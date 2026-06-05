# Agregar servidores de caché binaria

Ya introdujimos los concepts de Nix Store y caché binaria. Aquí veremos cómo agregar
various servidores de caché para acelerar las descargas de paquetes.

## Por qué agregar servidores de caché {#why-add-cache-servers}

Nix ofrece un servidor de caché official,
[https://cache.nixos.org](https://cache.nixos.org), que almacena resultados de compilación
para la mayoría de los paquetes de uso común. Sin embargo, puede no satisfacer todas las
necesidades. En los siguientes casos, necesitamos agregar servidores de caché adicionales:

1. Agregar servidores de caché para algunos proyectos de terceros, como el servidor de
   caché de nix-community
   [https://nix-community.cachix.org](https://nix-community.cachix.org), que puede mejorar
   significativamente la velocidad de compilación de esos proyectos.
1. Agregar espejos del servidor de caché cercanos al usuario para acelerar las descargas.
1. Agregar un servidor de caché propio para acelerar el proceso de compilación de
   proyectos personales.

## Cómo agregar servidores de caché {#how-to-add-custom-cache-servers}

En Nix, puedes configurar servidores de caché usando las siguientes opciones:

1. [substituters](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-substituters):
   es una lista de cadenas, y cada cadena es la dirección de un servidor de caché. Nix
   intentará encontrar cachés en estos servidores en el orden indicado en la lista.
2. [trusted-public-keys](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-public-keys):
   para evitar ataques maliciosos, la opción
   [require-sigs](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-require-sigs)
   está activada por defecto. Nix solo usará cachés cuyas firmas puedan verificarse con
   alguna clave pública en `trusted-public-keys`. Por eso necesitas agregar la clave
   pública correspondiente a los `substituters` en `trusted-public-keys`.
   1. Los datos del espejo de caché se sincronizan directamente desde el servidor
      official. Por lo tanto, sus claves públicas son las mismas que las del servidor
      official, y puedes usar la clave pública del servidor official sin configuración
      adicional.
   2. Este mecanismo de verificación basado totalmente en confianza transfiere la
      responsabilidad de seguridad a los usuarios. Si un usuario quiere usar un servidor
      de caché de terceros para acelerar la compilación de una biblioteca concreta, debe
      asumir los riesgos de seguridad correspondientes y decidir si añade la clave pública
      de ese servidor a `trusted-public-keys`. Para resolver completamente este problema
      de confianza, Nix introdujo la característica experimental
      [ca-derivations](https://wiki.nixos.org/wiki/Ca-derivations), que no depende de
      `trusted-public-keys` para la verificación de firmas. Los usuarios interesados
      pueden explorarlo más.

Puedes configurar `substituters` y `trusted-public-keys` de las siguientes maneras:

1. Configurarlo en `/etc/nix/nix.conf`, una configuración global que afecta a todos los
   usuarios.
   1. Puedes usar `nix.settings.substituters` y `nix.settings.trusted-public-keys` en
      cualquier módulo de NixOS para generar declarativamente `/etc/nix/nix.conf`.
2. Configurarlo en el `flake.nix` de un proyecto flake usando `nixConfig.substituters`.
   Esta configuración solo afecta al flake actual.
3. Establecerlo temporalmente mediante el parámetro `--option` del commando `nix`; esta
   configuración solo se aplica al commando actual.

De estos tres métodos, excepto la configuración global del primero, los otros dos son
temporales. Si se usan various métodos a la vez, las configuraciones posteriores
sobrescriben directamente a las anteriores.

Sin embargo, hay riesgos de seguridad al establecer `substituters` temporalmente, como ya
explicamos sobre las limitaciones del mecanismo de verificación basado en
`trusted-public-keys`. Para establecer `substituters` mediante el segundo y tercer método,
debes cumplir una de las siguientes condiciones:

1. El usuario actual está incluido en la lista del parámetro
   [`trusted-users`](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-users)
   en `/etc/nix/nix.conf`.
2. Los `substituters` especificados temporalmente mediante
   `--option substituters "http://xxx"` están incluidos en la lista del parámetro
   [`trusted-substituters`](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-substituters)
   en `/etc/nix/nix.conf`.

Con base en lo anterior, los siguientes son ejemplos de los tres métodos de configuración
mencionados.

Primero, configura de forma declarativa `substituters` y `trusted-public-keys` a nivel de
sistema usando `nix.settings` en `/etc/nixos/configuration.nix` o en cualquier módulo de
NixOS:

```nix{7-27}
{
  lib,
  ...
}: {

  # ...
  nix.settings = {
    # da a los usuarios de esta lista el derecho a especificar substituters adicionales vía:
    #    1. `nixConfig.substituters` en `flake.nix`
    #    2. arguments de línea de commandos `--options substituters http://xxx`
    trusted-users = ["ryan"];

    substituters = [
      # espejo de caché ubicado en China
      # estado: https://mirror.sjtu.edu.cn/
      "https://mirror.sjtu.edu.cn/nix-channels/store"
      # estado: https://mirrors.ustc.edu.cn/status/
      # "https://mirrors.ustc.edu.cn/nix-channels/store"

      "https://cache.nixos.org"
    ];

    trusted-public-keys = [
      # clave pública predeterminada de cache.nixos.org; viene integrada, no have falta agregarla aquí
      "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
    ];
  };

}
```

El segundo método es configurar `substituters` y `trusted-public-keys` usando `nixConfig`
en `flake.nix`:

> Como se mencionó antes, es esencial configurar `nix.settings.trusted-users` en esta
> configuración. De lo contrario, los `substituters` que definamos aquí no surtirán
> efecto.

```nix{5-23,42-46}
{
  description = "NixOS configuration of Ryan Yin";

  # el nixConfig aquí solo afecta al propio flake, ¡no a la configuración del sistema!
  nixConfig = {
    # sobrescribe los substituters predeterminados
    substituters = [
      # espejo de caché ubicado en China
      # estado: https://mirror.sjtu.edu.cn/
      "https://mirror.sjtu.edu.cn/nix-channels/store"
      # estado: https://mirrors.ustc.edu.cn/status/
      # "https://mirrors.ustc.edu.cn/nix-channels/store"

      "https://cache.nixos.org"

      # servidor de caché de la comunidad nix
      "https://nix-community.cachix.org"
    ];
    trusted-public-keys = [
      # clave pública del servidor de caché de la comunidad nix
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";

    # se omiten varias configuraciones...
  };

  outputs = inputs@{
      self,
      nixpkgs,
      ...
  }: {
    nixosConfigurations = {
      my-nixos = nixpkgs.lib.nixosSystem {
        modules = [
          ./hardware-configuration.nix
          ./configuration.nix

          {
            # da a los usuarios de esta lista el derecho a especificar substituters adicionales vía:
            #    1. `nixConfig.substituters` en `flake.nix`
            nix.settings.trusted-users = [ "ryan" ];
          }
          # se omiten varias configuraciones...
       ];
      };
    };
  };
}
```

Por último, el tercer método consiste en usar el siguiente commando para especificar de
forma temporal `substituters` y `trusted-public-keys` durante el despliegue:

```bash
sudo nixos-rebuild switch --option substituters "https://nix-community.cachix.org" --option trusted-public-keys "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
```

Elige uno de los tres métodos anteriores para configurar y desplegar. Después de un
despliegue exitoso, los paquetes posteriores buscarán primero cachés en los espejos
nacionales.

> Si el hostname de tu sistema no es `my-nixos`, debes modificar el nombre de
> `nixosConfigurations` en `flake.nix` o usar `--flake /etc/nixos#my-nixos` para indicar
> el nombre de la configuración.

### El prefijo `extra-` para parámetros de opciones de Nix

Como ya se mencionó, los `substituters` configurados por los tres métodos se sobrescriben
entre sí, pero la situación ideal sería:

1. A nivel de sistema en `/etc/nix/nix.conf`, configurar solo los `substituters` y
   `trusted-public-keys` más genéricos, como los servidores oficiales de caché y los
   espejos nacionales.
2. En el `flake.nix` de cada proyecto, configurar los `substituters` y
   `trusted-public-keys` específicos de ese proyecto, como servidores de caché no
   oficiales como nix-community.
3. Al construir un proyecto flake, Nix debería **fusionar** los `substituters` y
   `trusted-public-keys` configurados en `flake.nix` y `/etc/nix/nix.conf`.

Nix ofrece el prefijo
[`extra-`](https://nixos.org/manual/nix/stable/command-ref/conf-file.html?highlight=extra#file-format)
para lograr esta funcionalidad de **fusión**.

Según la documentación official, si el valor del parámetro `xxx` es una lista, el valor de
`extra-xxx` se agrega al final del parámetro `xxx`:

En otras palabras, puedes usarlo así:

```nix{7,13,36-58}
{
  description = "NixOS configuration of Ryan Yin";

  # el nixConfig aquí solo afecta al propio flake, ¡no a la configuración del sistema!
  nixConfig = {
    # se añadirá a los substituters a nivel de sistema
    extra-substituters = [
      # servidor de caché de la comunidad nix
      "https://nix-community.cachix.org"
    ];

    # se añadirá a los trusted-public-keys a nivel de sistema
    extra-trusted-public-keys = [
      # clave pública del servidor de caché de la comunidad nix
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";

    # se omiten varias configuraciones...
  };

  outputs = inputs@{
      self,
      nixpkgs,
      ...
  }: {
    nixosConfigurations = {
      my-nixos = nixpkgs.lib.nixosSystem {
        modules = [
          ./hardware-configuration.nix
          ./configuration.nix

          {
            # da a los usuarios de esta lista el derecho a especificar substituters adicionales vía:
            #    1. `nixConfig.substituters` en `flake.nix`
            nix.settings.trusted-users = [ "ryan" ];

            # los substituters y trusted-public-keys a nivel de sistema
            nix.settings = {
              substituters = [
                # espejo de caché ubicado en China
                # estado: https://mirror.sjtu.edu.cn/
                "https://mirror.sjtu.edu.cn/nix-channels/store"
                # estado: https://mirrors.ustc.edu.cn/status/
                # "https://mirrors.ustc.edu.cn/nix-channels/store"

                "https://cache.nixos.org"
              ];
              trusted-public-keys = [
                # clave pública predeterminada de cache.nixos.org, viene integrada, no have falta agregarla aquí
                "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
              ];
            };
          }
          # se omiten varias configuraciones...
       ];
      };
    };
  };
}
```

## Acelerar descargas de paquetes mediante un servidor proxy {#accelerate-package-downloads-via-a-proxy-server}

> Referenciado desde el issue:
> [roaming laptop: network proxy configuration - NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/issues/27535#issuecomment-1178444327)
> Aunque antes se mencionó que un proxy transparente ejecutándose en tu router o máquina
> local puede resolver completamente el problema de descargas lentas de paquetes en NixOS,
> la configuración es bastante engorrosa y a menudo require hardware adicional.

Algunos usuarios pueden preferir acelerar directamente las descargas de paquetes usando un
proxy HTTP/Socks5 ejecutándose en su máquina. Así se configura. Usar métodos como
`export HTTPS_PROXY=http://127.0.0.1:7890` en la terminal no funcionará porque el trabajo
real lo have un proceso en segundo plano llamado `nix-daemon`, no los commandos ejecutados
directamente en la terminal.

Si solo necesitas usar un proxy temporalmente, puedes establecer las variables de entorno
del proxy con los siguientes commandos:

```bash
sudo mkdir -p /run/systemd/system/nix-daemon.service.d/
sudo tee /run/systemd/system/nix-daemon.service.d/override.conf <<EOF
[Service]
Environment="https_proxy=socks5h://localhost:7891"
EOF
sudo systemctl daemon-reload
sudo systemctl restart nix-daemon
```

Después de desplegar esta configuración, puedes verificar si las variables de entorno se
establecieron ejecutando `sudo cat /proc/$(pidof nix-daemon)/environ | tr '\0' '\n'`.

La configuración en `/run/systemd/system/nix-daemon.service.d/override.conf` se eliminará
automáticamente cuando el sistema se reinicie, o puedes eliminarla manualmente y reiniciar
el servicio nix-daemon para restaurar la configuración original.

Si quieres establecer el proxy de forma permanente, se recomienda guardar los commandos
anteriores como un script de shell y ejecutarlo cada vez que arranque el sistema. Como
alternativa, puedes usar un proxy transparente o TUN y otras soluciones de proxy global.

> También hay personas en la comunidad que establecen permanentemente el proxy para
> nix-daemon de forma declarativa usando `systemd.services.nix-daemon.environment`. Sin
> embargo, si el proxy encuentra problems, será muy problemático. Nix-daemon no funcionará
> correctamente y la mayoría de los commandos de Nix no se ejecutarán bien. Además, la
> propia configuración de systemd está protegida como solo lectura, lo que dificulta
> modificar o eliminar la configuración del proxy. Por eso no se recomienda usar este
> método.

> Al usar algunos proxies comerciales o públicos, podrías encontrar errores HTTP 403 al
> descargar desde GitHub, como se describe en
> [nixos-and-flakes-book/issues/74](https://github.com/ryan4yin/nixos-and-flakes-book/issues/74).
> En esos casos, puedes intentar cambiar de servidor proxy o configurar
> [access-tokens](https://github.com/NixOS/nix/issues/6536) para resolver el problema.
