# Ejecutar binarios descargados en NixOS

Como NixOS no sigue estrictamente el Filesystem Hierarchy Standard (FHS), los binarios
descargados de internet pueden no funcionar directamente en NixOS. Sin embargo, hay varios
métodos disponibles para hacer que funcionen correctamente.

Para una guía completa con diez formas distintas de ejecutar binarios descargados en
NixOS, te recomiendo leer el artículo
[Different methods to run a non-nixos executable on Nixos](https://unix.stackexchange.com/questions/522822/different-methods-to-run-a-non-nixos-executable-on-nixos)
y echar un vistazo a [nix-alien](https://github.com/thiagokokada/nix-alien). O, si ya
conoces Docker, ejecutar el binario dentro de un contenedor Docker también es una buena
opción.

Entre estos métodos, yo prefiero crear un entorno FHS para ejecutar el binario, porque me
parece cómodo y fácil de usar. Para configurar un entorno así, puedes añadir el siguiente
código a uno de tus módulos de Nix:

```nix
{ config, pkgs, lib, ... }:

{
  # ......omitir muchas configuraciones

  environment.systemPackages = with pkgs; [
    # ......omitir muchos paquetes

    # Crea un entorno FHS usando el comando `fhs`, lo que permite ejecutar paquetes ajenos a NixOS en NixOS.
    (let base = pkgs.appimageTools.defaultFhsEnvArgs; in
      pkgs.buildFHSEnv (base // {
      name = "fhs";
      targetPkgs = pkgs:
        # pkgs.buildFHSEnv proporciona solo un entorno FHS mínimo,
        # sin muchos paquetes básicos que la mayoría del software necesita.
        # Por eso, debemos agregarlos manualmente.
        #
        # pkgs.appimageTools proporciona paquetes básicos requeridos por la mayoría del software.
        (base.targetPkgs pkgs) ++ (with pkgs; [
          pkg-config
          ncurses
          # Si hace falta, puedes agregar más paquetes aquí.
        ]
      );
      profile = "export FHS=1";
      runScript = "bash";
      extraOutputsToInstall = ["dev"];
    }))
  ];

  # ......omitir muchas configuraciones
}
```

Después de aplicar la configuración actualizada, puedes usar el comando `fhs` para entrar
al entorno FHS y luego ejecutar el binario descargado, por ejemplo:

```shell
# Al activar FHS entro en una shell que se parece a un entorno Linux "normal".
$ fhs
# Veamos qué hay en /usr/bin.
(fhs) $ ls /usr/bin
# Probemos a ejecutar un binario ajeno a NixOS descargado de internet.
(fhs) $ ./bin/code
```

## Referencias

- [Tips&Tricks for NixOS Desktop - NixOS
  Discourse][Tips&Tricks for NixOS Desktop - NixOS Discourse]: Este recurso ofrece una
  colección de consejos y trucos útiles para usuarios de escritorio de NixOS.
- [nix-alien](https://github.com/thiagokokada/nix-alien): Ejecuta binarios sin parchear en
  Nix/NixOS
- [nix-ld](https://github.com/Mic92/nix-ld): Ejecuta binarios dinámicos sin parchear en
  NixOS.
- [NixOS: Packaging Closed Source Software (& Binary Distributed Ones) - Lan Tian @ Blog](https://lantian.pub/en/article/modify-computer/nixos-packaging.lantian/#examples-closed-source-software--binary-distributed-ones)

[Tips&Tricks for NixOS Desktop - NixOS Discourse]:
  https://discourse.nixos.org/t/tips-tricks-for-nixos-desktop/28488
