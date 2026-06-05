# Entornos de desarrollo en NixOS

La reproducibilidad de NixOS lo hace ideal para construir entornos de desarrollo. Sin
embargo, si vienes de otras distribuciones, puedes encontrar problemas porque NixOS tiene
su propia lógica. Lo explicamos brevemente a continuación.

En las siguientes secciones, presentaremos cómo funciona el entorno de desarrollo en
NixOS.

## Crear un entorno de shell personalizado con `nix shell`

La forma más simple de crear un entorno de desarrollo es usar `nix shell`. `nix shell`
creará un entorno de shell con el paquete de Nix especificado instalado.

Aquí tienes un ejemplo:

```shell
# hello no está disponible
› hello
hello: command not found

# Entrar a un entorno con el paquete `hello` y `cowsay`
› nix shell nixpkgs#hello nixpkgs#cowsay

# hello ya está disponible
› hello
Hello, world!

# cowsay también está disponible
› cowsay "Hello, world!"
 _______
< hello >
 -------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

`nix shell` es muy útil cuando solo quieres probar algunos paquetes o crear rápidamente un
entorno limpio.

## Crear un entorno de desarrollo

`nix shell` es simple y fácil de usar, pero no es muy flexible; para un entorno de
desarrollo más complejo, necesitamos usar `pkgs.mkShell` y `nix develop`.

Podemos crear un entorno de desarrollo usando `pkgs.mkShell { ... }` y abrir un shell Bash
interactivo de ese entorno con `nix develop`.

Para ver cómo funciona [`pkgs.mkShell`], echemos un vistazo a su código fuente.

```nix
{ lib, stdenv, buildEnv }:

# Un tipo especial de derivation que solo está pensada para ser consumida por
# nix-shell.
{ name ? "nix-shell"
, # una lista de paquetes para agregar al entorno de shell
  packages ? [ ]
, # propaga todas las entradas de las derivations dadas
  inputsFrom ? [ ]
, buildInputs ? [ ]
, nativeBuildInputs ? [ ]
, propagatedBuildInputs ? [ ]
, propagatedNativeBuildInputs ? [ ]
, ...
}@attrs:
let
  mergeInputs = name:
    (attrs.${name} or [ ]) ++
    (lib.subtractLists inputsFrom (lib.flatten (lib.catAttrs name inputsFrom)));

  rest = builtins.removeAttrs attrs [
    "name"
    "packages"
    "inputsFrom"
    "buildInputs"
    "nativeBuildInputs"
    "propagatedBuildInputs"
    "propagatedNativeBuildInputs"
    "shellHook"
  ];
in

stdenv.mkDerivation ({
  inherit name;

  buildInputs = mergeInputs "buildInputs";
  nativeBuildInputs = packages ++ (mergeInputs "nativeBuildInputs");
  propagatedBuildInputs = mergeInputs "propagatedBuildInputs";
  propagatedNativeBuildInputs = mergeInputs "propagatedNativeBuildInputs";

  shellHook = lib.concatStringsSep "\n" (lib.catAttrs "shellHook"
    (lib.reverseList inputsFrom ++ [ attrs ]));

  phases = [ "buildPhase" ];

  # ......

  # cuando la construcción distribuida está habilitada, prefiere construir localmente
  preferLocalBuild = true;
} // rest)
```

`pkgs.mkShell { ... }` es una derivación especial (paquete de Nix). Su `name`,
`buildInputs` y otros parámetros son personalizables, y `shellHook` es un parámetro
especial que se ejecutará cuando `nix develop` entre al entorno.

Aquí hay un `flake.nix` que define un entorno de desarrollo con Node.js 24 instalado:

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # el system debe coincidir con el sistema en el que lo ejecutas
    system = "x86_64-linux";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs { inherit system; };
    in pkgs.mkShell {
      # crear un entorno con nodejs, pnpm y yarn
      packages = with pkgs; [
        nodejs_24
        pnpm
        (yarn.override { nodejs = nodejs_24; })
      ];

      shellHook = ''
        echo "node `node --version`"
      '';
    };
  };
}
```

Crea una carpeta vacía, guarda la configuración anterior como `flake.nix` y luego ejecuta
`nix develop` (o, más precisamente, puedes usar `nix develop .#default`); se mostrará la
versión actual de nodejs, y ahora puedes usar `node`, `pnpm` y `yarn` sin problemas.

## Usar zsh/fish/... en lugar de bash

`pkgs.mkShell` usa `bash` por defecto, pero también puedes usar `zsh` o `fish` agregando
`exec <your-shell>` a `shellHook`.

Aquí hay un ejemplo:

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # el system debe coincidir con el sistema en el que lo ejecutas
    system = "x86_64-linux";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs { inherit system; };
    in pkgs.mkShell {
      # crear un entorno con nodejs_24, pnpm y yarn
      packages = with pkgs; [
        nodejs_24
        pnpm
        (yarn.override { nodejs = nodejs_24; })
        nushell
      ];

      shellHook = ''
        echo "node `node --version`"
        exec nu
      '';
    };
  };
}
```

Con la configuración anterior, `nix develop` entrará al entorno REPL de nushell.

## Crear un entorno de desarrollo con `pkgs.runCommand`

La derivación creada por `pkgs.mkShell` no puede usarse directamente, sino que debe
accederse a ella mediante `nix develop`.

De hecho, es posible crear un wrapper de shell que contenga los paquetes necesarios a
través de `pkgs.stdenv.mkDerivation`, y luego entrar directamente al entorno ejecutando el
wrapper.

Usar `mkDerivation` directamente es un poco incómodo, y Nixpkgs ofrece funciones más
simples para ayudarnos a crear esos wrappers, como `pkgs.runCommand`.

Ejemplo:

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # el system debe coincidir con el sistema en el que lo ejecutas
    system = "x86_64-linux";
  in {
    packages."${system}".dev = let
      pkgs = import nixpkgs { inherit system; };
      packages = with pkgs; [
          nodejs_22
          pnpm
          nushell
      ];
    in pkgs.runCommand "dev-shell" {
      # Dependencies que deben existir en el entorno de ejecución
      buildInputs = packages;
      # Dependencies que solo deben existir en el entorno de construcción
      nativeBuildInputs = [ pkgs.makeWrapper ];
    } ''
      mkdir -p $out/bin/
      ln -s ${pkgs.nushell}/bin/nu $out/bin/dev-shell
      wrapProgram $out/bin/dev-shell --prefix PATH : ${pkgs.lib.makeBinPath packages}
    '';
  };
}
```

Luego ejecuta `nix run .#dev` o `nix shell .#dev --command 'dev-shell'`; entrarás en una
sesión de nushell, donde puedes usar los comandos `node` y `pnpm` con normalidad, y la
versión de node es 22.

El wrapper generado de esta forma es un archivo ejecutable que en realidad no depende del
comando `nix run` ni de `nix shell`.

Por ejemplo, podemos instalar este wrapper directamente a través de
`environment.systemPackages` de NixOS y luego ejecutarlo de forma directa:

```nix
{pkgs, lib, ...}:{

  environment.systemPackages = [
    # Instalar el wrapper en el sistema
    (let
      packages = with pkgs; [
          nodejs_22
          pnpm
          nushell
      ];
    in pkgs.runCommand "dev-shell" {
      # Dependencies que deben existir en el entorno de ejecución
      buildInputs = packages;
      # Dependencies que solo deben existir en el entorno de construcción
      nativeBuildInputs = [ pkgs.makeWrapper ];
    } ''
      mkdir -p $out/bin/
      ln -s ${pkgs.nushell}/bin/nu $out/bin/dev-shell
      wrapProgram $out/bin/dev-shell --prefix PATH : ${pkgs.lib.makeBinPath packages}
    '')
  ];
}
```

Agrega la configuración anterior a cualquier módulo de NixOS, despliégala con
`sudo nixos-rebuild switch`, y podrás entrar directamente al entorno de desarrollo con el
comando `dev-shell`, que es la característica especial de `pkgs.runCommand` frente a
`pkgs.mkShell`.

Código fuente relacionado:

- [pkgs/build-support/trivial-builders/default.nix - runCommand]
- [pkgs/build-support/setup-hooks/make-wrapper.sh]

## Entrar al entorno de construcción de cualquier paquete de Nix

Ahora veamos `nix develop`; primero lee la ayuda mostrada por `nix develop --help`:

```
Name
    nix develop - run a bash shell that provides the build environment of a derivation

Synopsis
    nix develop [option...] installable
# ......
```

Nos dice que `nix develop` acepta un parámetro `installable`, lo que significa que podemos
entrar al entorno de desarrollo de cualquier paquete de Nix instalable a través de él, no
solo al entorno creado por `pkgs.mkShell`.

Por defecto, `nix develop` intentará usar los siguientes atributos en las salidas del
flake:

- `devShells.<system>.default`
- `packages.<system>.default`

Si usamos `nix develop /path/to/flake#<name>` para especificar la dirección del paquete
del flake y el nombre de la salida del flake, entonces `nix develop` intentará los
siguientes atributos en las salidas del flake:

- `devShells.<system>.<name>`
- `packages.<system>.<name>`
- `legacyPackages.<system>.<name>`

Probémoslo. Primero, verifica que no tenemos `c++`, `g++` y otros comandos relacionados
con compilación en el entorno actual:

```shell
ryan in 🌐 aquamarine in ~
› c++
c++: command not found

ryan in 🌐 aquamarine in ~
› g++
g++: command not found
```

Luego usa `nix develop` para entrar en el entorno de construcción del paquete `hello` en
`nixpkgs`:

```shell
# entrar al entorno de construcción del paquete `hello`
ryan in 🌐 aquamarine in ~
› nix develop nixpkgs#hello

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› env | grep CXX
CXX=g++

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› c++ --version
g++ (GCC) 12.3.0
Copyright (C) 2022 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› g++ --version
g++ (GCC) 12.3.0
Copyright (C) 2022 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

Podemos ver que la variable de entorno `CXX` se ha configurado, y que ahora `c++`, `g++` y
otros comandos pueden usarse con normalidad.

Además, también podemos invocar normalmente cada fase de construcción del paquete `hello`:

> El orden de ejecución predeterminado de todas las fases de construcción de un paquete de
> Nix es:
> `$prePhases unpackPhase patchPhase $preConfigurePhases configurePhase $preBuildPhases buildPhase checkPhase $preInstallPhases installPhase fixupPhase installCheckPhase $preDistPhases distPhase $postPhases`

```shell
# desempaquetar el código fuente
ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› unpackPhase
unpacking source archive /nix/store/pa10z4ngm0g83kx9mssrqzz30s84vq7k-hello-2.12.1.tar.gz
source root is hello-2.12.1
setting SOURCE_DATE_EPOCH to timestamp 1653865426 of file hello-2.12.1/ChangeLog

ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› ls
hello-2.12.1

ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› cd hello-2.12.1/

# generar Makefile
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via ❄️  impure (hello-2.12.1-env)
› configurePhase
configure flags: --prefix=/tmp/xxx/outputs/out --prefix=/tmp/xxx/outputs/out
checking for a BSD-compatible install... /nix/store/02dr9ymdqpkb75vf0v1z2l91z2q3izy9-coreutils-9.3/bin/install -c
checking whether build environment is sane... yes
checking for a thread-safe mkdir -p... /nix/store/02dr9ymdqpkb75vf0v1z2l91z2q3izy9-coreutils-9.3/bin/mkdir -p
checking for gawk... gawk
checking whether make sets $(MAKE)... yes
checking whether make supports nested variables... yes
checking for gcc... gcc
# ......
checking that generated files are newer than configure... done
configure: creating ./config.status
config.status: creating Makefile
config.status: creating po/Makefile.in
config.status: creating config.h
config.status: config.h is unchanged
config.status: executing depfiles commands
config.status: executing po-directories commands
config.status: creating po/POTFILES
config.status: creating po/Makefile

# construir el paquete
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via C v12.3.0-gcc via ❄️  impure (hello-2.12.1-env) took 2s
› buildPhase
build flags: SHELL=/run/current-system/sw/bin/bash
make  all-recursive
make[1]: Entering directory '/tmp/xxx/hello-2.12.1'
# ......
ranlib lib/libhello.a
gcc  -g -O2   -o hello src/hello.o  ./lib/libhello.a
make[2]: Leaving directory '/tmp/xxx/hello-2.12.1'
make[1]: Leaving directory '/tmp/xxx/hello-2.12.1'

# run the built program
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via C v12.3.0-gcc via ❄️  impure (hello-2.12.1-env)
› ./hello
Hello, world!
```

Este uso sirve principalmente para depurar el proceso de construcción de un paquete de Nix
o para ejecutar algunos comandos en el entorno de construcción de un paquete de Nix.

## `nix build`

El comando `nix build` se usa para construir un paquete de software y crea un enlace
simbólico llamado `result` en el directorio actual, que apunta al resultado de la
construcción.

Aquí tienes un ejemplo:

```bash
# Build the package 'ponysay' from the 'nixpkgs' flake
nix build "nixpkgs#ponysay"
# Use the built 'ponysay' command
› ./result/bin/ponysay 'hey buddy!'
 ____________
< hey buddy! >
 ------------
     \
      \
       \
       ▄▄  ▄▄ ▄ ▄
    ▀▄▄▄█▄▄▄▄▄█▄▄▄
   ▀▄███▄▄██▄██▄▄██
  ▄██▄███▄▄██▄▄▄█▄██
 █▄█▄██▄█████████▄██
  ▄▄█▄█▄▄▄▄▄████████
 ▀▀▀▄█▄█▄█▄▄▄▄▄█████         ▄   ▄
    ▀▄████▄▄▄█▄█▄▄██       ▄▄▄▄▄█▄▄▄
    █▄██▄▄▄▄███▄▄▄██    ▄▄▄▄▄▄▄▄▄█▄▄
    ▀▄▄██████▄▄▄████    █████████████
       ▀▀▀▀▀█████▄▄ ▄▄▄▄▄▄▄▄▄▄██▄█▄▄▀
            ██▄███▄▄▄▄█▄▄▀  ███▄█▄▄▄█▀
            █▄██▄▄▄▄▄████   ███████▄██
            █▄███▄▄█████    ▀███▄█████▄
            ██████▀▄▄▄█▄█    █▄██▄▄█▄█▄
           ███████ ███████   ▀████▄████
           ▀▀█▄▄▄▀ ▀▀█▄▄▄▀     ▀██▄▄██▀█
                                ▀  ▀▀█
```

## Usar `nix profile` para gestionar entornos de desarrollo y entretenimiento

`nix develop` es una herramienta para crear y gestionar múltiples entornos de usuario, y
cambiar a distintos entornos cuando sea necesario.

A diferencia de `nix develop`, `nix profile` gestiona el entorno del sistema del usuario
en lugar de crear un entorno temporal de shell. Por eso es más compatible con JetBrains
IDE, VSCode y otros IDEs, y no tiene el problema de no poder usar en el IDE el entorno de
desarrollo configurado.

TODO

## Otros comandos

Hay otros comandos como `nix flake init`, que puedes explorar en [New Nix
Commands][New Nix Commands]. Para información más detallada, consulta la documentación.

## Referencias

- [pkgs.mkShell - nixpkgs manual](https://nixos.org/manual/nixpkgs/stable/#sec-pkgs-mkShell)
- [A minimal nix-shell](https://fzakaria.com/2021/08/02/a-minimal-nix-shell.html)
- [Wrapping packages - NixOS Cookbook](https://wiki.nixos.org/wiki/Nix_Cookbook#Wrapping_packages)
- [One too many shell, Clearing up with nix' shells nix shell and nix-shell - Yannik Sander](https://blog.ysndr.de/posts/guides/2021-12-01-nix-shells/)
- [Shell Scripts - NixOS Wiki](https://wiki.nixos.org/wiki/Shell_Scripts)

[New Nix Commands]: https://nixos.org/manual/nix/stable/command-ref/new-cli/nix.html
[pkgs/build-support/trivial-builders/default.nix - runCommand]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/trivial-builders/default.nix#L25-L54
[pkgs/build-support/setup-hooks/make-wrapper.sh]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/setup-hooks/make-wrapper.sh
[`pkgs.mkShell`]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/mkshell/default.nix
