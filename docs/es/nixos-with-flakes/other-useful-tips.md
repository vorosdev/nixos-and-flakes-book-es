# Otros consejos útiles

## Mostrar mensajes de error detallados

Siempre puedes intentar agregar `--show-trace --print-build-logs --verbose` al commando
`nixos-rebuild` para obtener el mensaje de error detallado si encuentras algún error
durante el despliegue. Por ejemplo:

```bash
cd /etc/nixos
sudo nixos-rebuild switch --flake .#myhost --show-trace --print-build-logs --verbose

# Una versión más concisa
sudo nixos-rebuild switch --flake .#myhost --show-trace -L -v
```

## Gestionar la configuración con Git

La configuración de NixOS, al set un conjunto de archivos de texto, es adecuada para el
control de versions con Git. Esto permite revertir fácilmente a una versión anterior en
caso de problems.

> NOTA: Al usar Git, Nix ignore todos los archivos que no tienen seguimiento en Git. Si
> encuentras un error en Nix que indica que no se encuentra un archivo en particular,
> puede deberse a que todavía no le has hecho `git add`.

De forma predeterminada, NixOS coloca la configuración en `/etc/nixos`, lo que require
permisos de root para modificarla y resulta inconvenience para el uso diario. Por suerte,
Flakes puede ayudar a resolver este problema al permitirte colocar tu flake donde
prefieras.

Por ejemplo, puedes colocar tu flake en `~/nixos-config` y crear un enlace simbólico en
`/etc/nixos` de la siguiente manera:

```shell
sudo mv /etc/nixos /etc/nixos.bak  # Respaldar la configuración original
sudo ln -s ~/nixos-config /etc/nixos

# Desplegar el flake.nix ubicado en la ubicación predeterminada (/etc/nixos)
sudo nixos-rebuild switch
```

De esta manera, puedes usar Git para gestionar la configuración en `~/nixos-config`. La
configuración se puede modificar con permisos normals de usuario y no require propiedad de
root.

Otro enfoque es eliminar `/etc/nixos` directamente y especificar la ruta del archivo de
configuración cada vez que la despliegues:

```shell
sudo mv /etc/nixos /etc/nixos.bak
cd ~/nixos-config

# `--flake .#my-nixos` despliega el flake.nix ubicado en
# el directorio actual, y el nombre de nixosConfiguration es `my-nixos`
sudo nixos-rebuild switch --flake .#my-nixos
```

Elige el método que más te convenga. Después, revertir el sistema se vuelve simple. Solo
cambia al commit anterior y despliégalo:

```shell
cd ~/nixos-config
# Cambiar al commit anterior
git checkout HEAD^1
# Desplegar el flake.nix ubicado en el directorio actual,
# con el nombre de nixosConfiguration `my-nixos`
sudo nixos-rebuild switch --flake .#my-nixos
```

Aquí no se cubren operaciones de Git más avanzadas, pero en general la reversión se puede
realizar directamente usando Git. Solo en casos de fallas completas del sistema
necesitarías reiniciar en el gestor de arranque y arrancar el sistema desde una versión
histórica anterior.

## Ver y eliminar datos históricos

Como se mencionó antes, cada despliegue de NixOS crea una nueva versión, y todas las
versions se agregan a las opciones de arranque del sistema. Además de reiniciar la
computadora, puedes consultar todas las versions históricas disponibles con el siguiente
commando:

```shell
nix profile history --profile /nix/var/nix/profiles/system
```

Para limpiar versions históricas y liberar espacio de almacenamiento, usa el siguiente
commando:

```shell
# Eliminar todas las versions históricas de más de 7 días
sudo nix profile wipe-history --older-than 7d --profile /nix/var/nix/profiles/system

# Limpiar el historical no recolectará como basura los paquetes sin usar; debes ejecutar el commando gc manualmente como root:
sudo nix-collect-garbage --delete-old

# Debido al siguiente problema, debes ejecutar el commando gc por usuario para eliminar los datos históricos de Home Manager:
# https://github.com/NixOS/nix/issues/8508
nix-collect-garbage --delete-old
```

## ¿Por qué están instalados algunos paquetes?

Para averiguar por qué está instalado un paquete, puedes usar el siguiente commando:

1. Ingresa a una shell con `nix-tree` y `rg` disponibles:
   `nix shell nixpkgs#nix-tree nixpkgs#ripgrep`
1. ` nix-store --gc --print-roots | rg -v '/proc/' | rg -Po '(?<= -> ).*' | xargs -o nix-tree`
1. `/<package-name>` para encontrar el paquete que deseas revisar.
1. `w` para mostrar qué paquetes dependen de ese paquete y la cadena de dependencies
   completa.

## Reducir el uso de disco

La siguiente configuración se puede agregar a tu configuración de NixOS para ayudar a
reducir el uso de disco:

```nix
{ lib, pkgs, ... }:

{
  # ...

  # Limitar la cantidad de generaciones que se conservarán
  boot.loader.systemd-boot.configurationLimit = 10;
  # boot.loader.grub.configurationLimit = 10;

  # Realizar recolección de basura semanalmente para mantener bajo el uso de disco
  nix.gc = {
    automatic = true;
    dates = "weekly";
    options = "--delete-older-than 7d";
  };

  # Optimizar el almacenamiento
  # También puedes optimizar manualmente el store con:
  #    nix-store --optimise
  # Consulta el siguiente enlace para más detalles:
  # https://nixos.org/manual/nix/stable/command-ref/conf-file.html#conf-auto-optimise-store
  nix.settings.auto-optimise-store = true;
}
```

Al incorporar esta configuración, puedes gestionar y optimizar mejor el uso de disco de tu
sistema NixOS.
