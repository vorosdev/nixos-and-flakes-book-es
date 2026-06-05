# Compilación multiplataforma

En cualquier plataforma Linux, hay dos formas de hacer compilación multiplataforma. Por
ejemplo, para compilar un program `aarch64-linux` en un host `x86_64-linux`, puedes usar
los siguientes métodos:

1. Usar la toolchain de cross-compilation para compilar el program `aarch64`.
   - La desventaja es que no puedes usar el binary cache de NixOS y necesitas compilar
     todo por tu cuenta (cross-compilation también tiene un cache, pero prácticamente no
     hay nada en él).
   - Las ventajas son que no necesitas emular el conjunto de instrucciones y el
     rendimiento es alto.
2. Usar QEMU para emular la arquitectura `aarch64` y luego compilar el program en el
   emulador.
   - La desventaja es que el conjunto de instrucciones se emula y el rendimiento es bajo.
   - La ventaja es que puedes usar el binary cache de NixOS y no necesitas compilar todo
     por tu cuenta.

Si usas el método uno, no necesitas habilitar `binfmt_misc`, pero debes ejecutar la
compilación a través de la toolchain de cross-compilation.

Si usas el método dos, debes habilitar `binfmt_misc` para la arquitectura `aarch64` en la
configuración de NixOS de la máquina que construye.

## Cross-compilation

`nixpkgs` proporciona un conjunto de plataformas host predefinidas para cross-compilation
llamado `pkgsCross`. Puedes explorarlas en `nix repl`.

```shell
› nix repl '<nixpkgs>'
warning: future versions of Nix will require using `--file` to load a file
Welcome to Nix 2.13.3. Type :? for help.

Loading installable ''...
Added 19273 variables.
nix-repl> pkgsCross.<TAB>
pkgsCross.aarch64-android             pkgsCross.msp430
pkgsCross.aarch64-android-prebuilt    pkgsCross.musl-power
pkgsCross.aarch64-darwin              pkgsCross.musl32
pkgsCross.aarch64-embedded            pkgsCross.musl64
pkgsCross.aarch64-multiplatform       pkgsCross.muslpi
pkgsCross.aarch64-multiplatform-musl  pkgsCross.or1k
pkgsCross.aarch64be-embedded          pkgsCross.pogoplug4
pkgsCross.arm-embedded                pkgsCross.powernv
pkgsCross.armhf-embedded              pkgsCross.ppc-embedded
pkgsCross.armv7a-android-prebuilt     pkgsCross.ppc64
pkgsCross.armv7l-hf-multiplatform     pkgsCross.ppc64-musl
pkgsCross.avr                         pkgsCross.ppcle-embedded
pkgsCross.ben-nanonote                pkgsCross.raspberryPi
pkgsCross.fuloongminipc               pkgsCross.remarkable1
pkgsCross.ghcjs                       pkgsCross.remarkable2
pkgsCross.gnu32                       pkgsCross.riscv32
pkgsCross.gnu64                       pkgsCross.riscv32-embedded
pkgsCross.i686-embedded               pkgsCross.riscv64
pkgsCross.iphone32                    pkgsCross.riscv64-embedded
pkgsCross.iphone32-simulator          pkgsCross.rx-embedded
pkgsCross.iphone64                    pkgsCross.s390
pkgsCross.iphone64-simulator          pkgsCross.s390x
pkgsCross.loongarch64-linux           pkgsCross.sheevaplug
pkgsCross.m68k                        pkgsCross.vc4
pkgsCross.mingw32                     pkgsCross.wasi32
pkgsCross.mingwW64                    pkgsCross.x86_64-darwin
pkgsCross.mips-linux-gnu              pkgsCross.x86_64-embedded
pkgsCross.mips64-linux-gnuabi64       pkgsCross.x86_64-freebsd
pkgsCross.mips64-linux-gnuabin32      pkgsCross.x86_64-netbsd
pkgsCross.mips64el-linux-gnuabi64     pkgsCross.x86_64-netbsd-llvm
pkgsCross.mips64el-linux-gnuabin32    pkgsCross.x86_64-unknown-redox
pkgsCross.mipsel-linux-gnu
pkgsCross.mmix
```

Si quieres establecer `pkgs` como una toolchain de cross-compilation de forma global en un
flake, solo necesitas agregar un módulo en `flake.nix`, como se muestra abajo:

```nix{12-17}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      modules = [
        {
          # la plataforma que realiza el paso de construcción
          nixpkgs.buildPlatform.system = "x86_64-linux";

          # la plataforma que ejecutará los binarios resultantes
          # agrega esto para habilitar cross-compilation.
          nixpkgs.crossSystem.system = "riscv64-linux";
        }

        # ...... other modules
      ];
    };
  };
}
```

La opción `nixpkgs.crossSystem` se usa para establecer `pkgs` como una toolchain de
cross-compilation, de modo que todo lo que se construya será de arquitectura
`riscv64-linux`.

## Compilar mediante un sistema emulado

El segundo método es compilar a través del sistema emulado. Este método no require una
toolchain de cross-compilation.

Para usar este método, primero la máquina de construcción necesita habilitar el módulo
`binfmt_misc` en la configuración. Si tu máquina de construcción es NixOS, agrega la
siguiente configuración a tu módulo de NixOS para habilitar el sistema de construcción
simulado para las arquitecturas `aarch64-linux` y `riscv64-linux`:

```nix{6}
{ ... }:
{
  # ......

  # Habilitar la emulación de binfmt.
  boot.binfmt.emulatedSystems = [ "aarch64-linux" "riscv64-linux" ];

  # ......
}
```

En cuanto a `flake.nix`, su configuración es muy simple, incluso más simple que la de
cross-compilation, como se muestra abajo:

```nix{13}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      modules = [
        # la plataforma nativa
        # normalmente esto ya está definido en el `hardware-configuration.nix` generado y se puede omitir.
        { nixpkgs.hostPlatform = "riscv64-linux"; }
        # ...... other modules
      ];
    };
  };
}
```

No necesitas agregar módulos adicionales; solo especifica `nixpkgs.hostPlatform` como
`riscv64-linux`. Nix detectará automáticamente durante la construcción si el sistema
actual es `riscv64-linux`. Si no lo es, construirá automáticamente mediante el sistema
emulado (QEMU). Para los usuarios, estas operaciones internas son completamente
transparentes.

## binfmt_misc de Linux

La sección anterior solo ofreció una introducción sobre cómo usar el sistema emulado de
Nix, pero si quieres entender los detalles internos, aquí tienes una breve introducción.

`binfmt_misc` es una característica del kernel de Linux cuyo nombre significa Kernel
Support for miscellaneous Binary Formats. Permite que Linux ejecute programs para casi
cualquier arquitectura de CPU, incluidas X86_64, ARM64, RISCV64 y más.

Para que `binfmt_misc` ejecute programs en distintos formatos, se requieren dos cosas: un
método específico de identificación del formato binario y la ubicación del intérprete
correspondiente. Aunque `binfmt_misc` suena potente, su implementación es
sorprendentemente fácil de entender. Funciona de forma similar a cómo el intérprete de
Bash determina qué intérprete usar al leer la primera línea de un archivo de script (por
ejemplo, `#!/usr/bin/env python3`). `binfmt_misc` define un conjunto de reglas, como leer
el número mágico en una ubicación específica del archivo binario o determinar el formato
del archivo ejecutable según su extensión (por ejemplo, .exe, .py). Luego invoca el
intérprete correspondiente para ejecutar el program. El formato ejecutable predeterminado
en Linux es ELF, pero `binfmt_misc` amplía las posibilidades de ejecución al permitir que
una gran variedad de archivos binarios se ejecuten usando sus intérpretes respectivos.

Para registrar un formato de program binario, debes escribir una línea con el formato
`:name:type:offset:magic:mask:interpreter:flags` en el archivo
`/proc/sys/fs/binfmt_misc/register`. La explicación detallada del formato está fuera del
alcance de esta discusión.

Como escribir manualmente la información de registro de `binfmt_misc` puede set tedioso,
la comunidad ofrece un contenedor para ayudar con el registro automático. Este contenedor
se llama `binfmt` y al ejecutarlo instalará various emuladores `binfmt_misc`. Aquí tienes
un ejemplo:

```shell
# Registrar todas las arquitecturas
podman run --privileged --rm tonistiigi/binfmt:latest --install all

# Registrar solo las arquitecturas arm/riscv comunes
docker run --privileged --rm tonistiigi/binfmt --install arm64,riscv64,arm
```

El módulo `binfmt_misc` se introdujo en Linux versión 2.6.12-rc2 y desde entonces ha
sufrido various cambios menores de funcionalidad. En Linux 4.8 se añadió la bandera "F"
(fix binary), que permite invocar correctamente el intérprete en namespaces de montaje y
entornos chroot. Para funcionar bien en contenedores donde se necesitan construir varias
arquitecturas, la bandera "F" es necesaria. Por lo tanto, la versión del kernel debe set
4.8 o superior.

En resumen, `binfmt_misc` ofrece transparencia frente a llamar explícitamente a un
intérprete para ejecutar programs de arquitecturas no nativas. Con `binfmt_misc`, los
usuarios ya no tienen que preocuparse por qué intérprete usar al ejecutar un program.
Permite ejecutar directamente programs de cualquier arquitectura. La bandera "F"
configurable es un beneficio adicional, ya que carga el program intérprete en memoria
durante la instalación y no se ve afectada por cambios posteriores en el entorno.

## Toolchain de construcción personalizada

A veces podemos necesitar usar una toolchain personalizada para construir, como usar
nuestro propio gcc o nuestra propia libc musl, etc. Esta modificación puede lograrse con
overlays.

Por ejemplo, probemos usar una versión diferente de gcc y verificarlo con `nix repl`:

```shell
› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.3. Type :? for help.

Loading installable ''...
Added 17755 variables.

# reemplazar gcc mediante overlays; esto creará una nueva instancia de nixpkgs
nix-repl> a = import <nixpkgs> { crossSystem = "riscv64-linux"; overlays = [ (self: super: { gcc = self.gcc13; }) ]; }

# comprobar la versión de gcc; efectivamente cambió a 12.2
nix-repl> a.pkgsCross.riscv64.stdenv.cc
«derivation /nix/store/kdi3g7px1bxz2r1jmjnr4pahscw8jj96-riscv64-unknown-linux-gnu-gcc-wrapper-13.4.0.drv»

# mirar los pkgs predeterminados; sigue siendo 11.3
nix-repl> pkgs.pkgsCross.riscv64.stdenv.cc
«derivation /nix/store/xd8s47j71z3lym5f2j9zy3v9r0ifw209-riscv64-unknown-linux-gnu-gcc-wrapper-14.3.0.drv»
```

Entonces, ¿cómo usar este método en Flakes? El ejemplo de `flake.nix` es el siguiente:

```nix{20-21}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05-small";
  };

  outputs = { self, nixpkgs, ... }:
  {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      modules = [
        {
          # la plataforma que realiza el paso de construcción
          nixpkgs.buildPlatform.system = "x86_64-linux";

          # la plataforma que ejecutará los binarios resultantes
          # agrega esto para habilitar cross-compilation.
          nixpkgs.crossSystem.system = "riscv64-linux";

          # reemplazar gcc por gcc13 mediante overlays
          nixpkgs.overlays = [ (self: super: { gcc = self.gcc13; }) ];
        }

        # other modules ......
      ];
    };
  };
}
```

`nixpkgs.overlays` se usa para modificar la instancia de `pkgs` de forma global, y la
instancia modificada afectará a todo el flake. Es probable que cause una gran cantidad de
cache misses y, por tanto, requiera construir localmente una gran cantidad de paquetes de
Nix.

Para evitar este problema, una mejor forma es crear una nueva instancia de `pkgs` y usarla
solo al construir los paquetes que queremos modificar. El ejemplo de `flake.nix` es el
siguiente:

```nix{10-17,32}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05-small";
  };

  outputs = { self, nixpkgs, ... }: let
    # crear una nueva instancia de pkgs con overlays
    pkgs-gcc13 = import nixpkgs {
      localSystem = "x86_64-linux";
      crossSystem = "riscv64-linux";

      overlays = [
        (self: super: { gcc = self.gcc13; })
      ];
    };
  in {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      specialArgs = {
        # pasar la nueva instancia de pkgs al módulo
        inherit pkgs-gcc13;
      };
      modules = [
        {
          nixpkgs.buildPlatform.system = "x86_64-linux";
          nixpkgs.crossSystem.system = "riscv64-linux";
        }

        ({pkgs-gcc13, ...}: {
          # usar la instancia personalizada de pkgs para construir el paquete hello
          environment.systemPackages = [ pkgs-gcc13.hello ];
        })

        # other modules ......
      ];
    };
  };
}
```

Con el método anterior, podemos personalizar fácilmente la toolchain de construcción de
algunos paquetes sin afectar la construcción de otros paquetes.

## Referencias

- [Cross compilation - nix.dev](https://nix.dev/tutorials/cross-compilation)
