# Aloja tu propio servidor de caché binaria de Nix

## Introducción

La caché binaria de Nix es una implementación del Nix Store que almacena datos en un
servidor remoto en lugar de localmente, lo que facilita compartir cachés binarias entre
varias máquinas.

El servidor official de caché binaria de Nix solo proporciona binarios construidos con
parámetros estándar. Si has personalizado los parámetros de compilación o estás usando
paquetes fuera de Nixpkgs, Nix no encontrará la caché binaria correspondiente, lo que
provoca compilaciones locales.

Depender únicamente de tu Nix Store local `/nix/store` puede set engorroso, ya que
tendrías que recompilar todos tus paquetes personalizados en cada máquina, lo cual puede
llevar tiempo y consumir mucha memoria. Esta situación empeora en plataformas de menor
rendimiento como Raspberry Pi.

Este documento te mostrará cómo configurar tu propio servidor de caché binaria de Nix
usando un servicio S3 (como MinIO) para compartir resultados de compilación entre máquinas
y resolver los problems anteriores.

## Requisitos previous

1. Un host con NixOS
1. Un servidor MinIO desplegado
   1. Si no lo tienes, puedes seguir la
      [guía official de despliegue](https://min.io/docs/minio/linux/operations/installation.html)
      de MinIO.
1. El servidor MinIO necesita un certificado digital TLS válido, que puede set público o
   privado. Este ejemplo usará `https://minio.homelab.local` con un certificado privado.
1. Instalar `minio-client`

## Generar una contraseña

```bash
nix run nixpkgs#pwgen -- -c -n -y -s -B 32 1
# => oenu1Yuch3rohz2ahveid0koo4giecho
```

## Configurar el cliente MinIO

Instala el cliente de línea de commandos de MinIO `mc`.

```nix
{ pkgs, ... }:
{
  environment.systemPackages = with pkgs; [
    minio-client # alternativas para los commandos ls, cp, mkdir, diff y rsync para sistemas de archivos y almacenamiento de objetos
  ];
}
```

Crea `~/.mc/config.json` con el siguiente contenido (reemplaza los parámetros clave por
los tuyos):

```json
{
  "version": "10",
  "aliases": {
    "s3": {
      "url": "https://s3.homelab.local",
      "accessKey": "minio",
      "secretKey": "oenu1Yuch3rohz2ahveid0koo4giecho",
      "api": "s3v4",
      "path": "auto"
    }
  }
}
```

Como Nix interactuará directamente con el bucket S3, necesitamos configurar credenciales
S3 para todas las máquinas que requieran acceso a la caché binaria de Nix.

Crea `~/.aws/credentials` con el siguiente contenido (reemplaza `<nixbuildersecret>` por
la contraseña generada por `pwgen`).

```conf
[nixbuilder]
aws_access_key_id=nixbuilder
aws_secret_access_key=<nixbuildersecret>
```

## Configurar el bucket S3 como caché binaria

Crea el bucket `nix-cache` usando el cliente de MinIO:

```bash
mc mb s3/nix-cache
```

Crea el usuario `nixbuilder` para MinIO y asígnale una contraseña:

```bash
mc admin user add s3 nixbuilder <PASSWORD>
```

Crea un archivo llamado `nix-cache-write.json` en el directorio de trabajo actual con el
siguiente contenido:

```json
{
  "Id": "AuthenticatedWrite",
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AuthenticatedWrite",
      "Action": [
        "s3:AbortMultipartUpload",
        "s3:GetBucketLocation",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads",
        "s3:ListMultipartUploadParts",
        "s3:PutObject"
      ],
      "Effect": "Allow",
      "Resource": ["arn:aws:s3:::nix-cache", "arn:aws:s3:::nix-cache/*"],
      "Principal": "nixbuilder"
    }
  ]
}
```

Ahora crea una política para subir archivos a S3 usando el archivo `nix-cache-write.json`:

```bash
mc admin policy create s3 nix-cache-write nix-cache-write.json
```

Asocia la política S3 que acabamos de crear con el usuario `nixbuilder`:

```bash
mc admin policy attach s3 nix-cache-write -user nixbuilder
```

Permite que usuarios anónimos descarguen archivos sin autenticación, para que todos los
servidores Nix puedan obtener datos directamente desde esta caché S3:

```bash
mc anonymous set download s3/nix-cache
```

Por último, añade el archivo `nix-cache-info` al directorio raíz del bucket S3, ya que Nix
require este archivo para registrar cierta información relacionada con la caché binaria:

```bash
cat > nix-cache-info <<EOF
StoreDir: /nix/store
WantMassQuery: 1
Priority: 40
EOF
# Copia `nix-cache-info` al bucket S3
mc cp ./nix-cache-info s3/nix-cache/nix-cache-info
```

## Generar par de claves de firma

Como se mencionó antes, la caché binaria de Nix usa un mecanismo de firma con clave
pública para verificar el origen e integridad de los datos, así que necesitamos generar un
par de claves para que nuestra máquina de compilación Nix firme la caché binaria. El
nombre de la clave es arbitrario, pero los desarrolladores de NixOS recomiendan
encarecidamente usar el dominio de la caché seguido de un entero, para que si la clave
necesita revocarse o regenerarse, puedas simplemente incrementar el entero al final.

```bash
nix key generate-secret --key-name s3.homelab.local-1 > ~/.config/nix/secret.key
nix key convert-secret-to-public < ~/.config/nix/secret.key > ~/.config/nix/public.key
cat ~/.config/nix/public.key
# => s3.homelab.local-1:m0J/oDlLEuG6ezc6MzmpLCN2MYjssO3NMIlr9JdxkTs=
```

## Usar la caché binaria S3 en `flake.nix`

Añade lo siguiente a tu `configuration.nix` o a cualquier módulo personalizado de NixOS:

```nix
{
  nix = {
    settings = {
      # el substituter se añadirá a los substituters predeterminados al buscar paquetes
      extra-substituters = [
        "https://s3.homelab.local/nix-cache/"
      ];
      extra-trusted-public-keys = [
        "s3.homelab.local-1:m0J/oDlLEuG6ezc6MzmpLCN2MYjssO3NMIlr9JdxkTs="
      ];
    };
  };
}
```

Reconstruye el sistema para empezar a usar nuestra nueva caché binaria S3:

```bash
sudo nixos-rebuild switch --upgrade --flake .#<HOST>
```

## Enviar rutas del store a la caché binaria

Firma algunas rutas en el store local.

```bash
nix store sign --recursive --key-file ~/.config/nix/secret.key /run/current-system
```

Copia esas rutas a la caché:

```bash
nix copy --to 's3://nix-cache?profile=nixbuilder&endpoint=s3.homelab.local' /run/current-system
```

## Agregar una política automática de expiración de objetos

```bash
mc ilm rule add s3/nix-cache --expire-days "DAYS"
# Por ejemplo: mc ilm rule add s3/nix-cache --expire-days "7"
```

Esto establecerá una política de expiración para los objetos en el bucket S3, asegurando
que se eliminen automáticamente después de un número determinado de días.

Esto es útil para mantener manejable el tamaño de la caché y garantizar que los binarios
obsoletos no se almacenen indefinidamente.

## Referencias

- [Entrada de blog de Jeff sobre cachés binarias de Nix](https://jcollie.github.io/nixos/2022/04/27/nixos-binary-cache-2022.html)
- [Binary cache en la wiki de NixOS](https://wiki.nixos.org/wiki/Binary_Cache)
- [Servir un Nix store vía S3 en el manual de NixOS](https://nixos.org/manual/nix/stable/package-management/s3-substituter.html)
- [Servir un Nix store vía HTTP en el manual de NixOS](https://nixos.org/manual/nix/stable/package-management/binary-cache-substituter.html)
