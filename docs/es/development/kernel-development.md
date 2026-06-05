# Desarrollo del kernel

> WIP, trabajo en progreso

Un ejemplo de desarrollo del kernel con `flake.nix`.

```nix
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05-small";

    # código fuente del kernel personalizado
    thead-kernel = {
      url = "github:revyos/thead-kernel/lpi4a";
      flake = false;
    };
  };

  outputs = inputs@{
    self
    ,nixpkgs
    ,thead-kernel
    ,... }:
  let
    pkgsKernel = import nixpkgs {
      localSystem = "x86_64-linux";
      crossSystem = {
        config = "riscv64-unknown-linux-gnu";
      };

      overlays = [
        (self: super: {
          # usar gcc 13 para compilar este kernel personalizado
          linuxPackages_thead = super.linuxPackagesFor (super.callPackage ./pkgs/kernel {
            src = thead-kernel;
            stdenv = super.gcc13Stdenv;
            kernelPatches = with super.kernelPatches; [
              bridge_stp_helper
              request_key_helper
            ];
          });
        })
      ];
    };
  in
  {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";

      specialArgs = {
        inherit nixpkgs pkgsKernel;
      };
      modules = [
        {
          # hacer cross-compilation de este flake.
          nixpkgs.crossSystem = {
            system = "riscv64-linux";
          };
        }

        ./modules/licheepi4a.nix
        ./modules/sd-image-lp4a.nix
      ];
    };

    # usa `nix develop .#kernel` para entrar al entorno donde está disponible el entorno de construcción del kernel personalizado.
    # luego usa `unpackPhase` para desempaquetar el código fuente del kernel y entrar en él.
    # después puedes usar `make menuconfig` para configurar el kernel.
    #
    # problema
    #   - al usar `make menuconfig` - no se puede encontrar el paquete ncurses.
    devShells.x86_64-linux.kernel = pkgsKernel.linuxPackages_thead.kernel.dev;

    # usa `nix develop .#fhs` para entrar al entorno de pruebas FHS definido aquí.
    devShells.x86_64-linux.fhs = let
      pkgs = import nixpkgs {
        system = "x86_64-linux";
      };
    in
      # el código aquí está copiado principalmente de:
      #   https://wiki.nixos.org/wiki/Linux_kernel#Embedded_Linux_Cross-compile_xconfig_and_menuconfig
      (pkgs.buildFHSUserEnv {
        name = "kernel-build-env";
        targetPkgs = pkgs_: (with pkgs_;
          [
            # necesitamos estos paquetes para ejecutar `make menuconfig` con éxito.
            pkgconfig
            ncurses

            pkgsKernel.gcc13Stdenv.cc
            gcc
          ]
          ++ pkgs.linux.nativeBuildInputs);
        runScript = pkgs.writeScript "init.sh" ''
          # establecer las variables de entorno de cross-compilation.
          export CROSS_COMPILE=riscv64-unknown-linux-gnu-
          export ARCH=riscv
          export PKG_CONFIG_PATH="${pkgs.ncurses.dev}/lib/pkgconfig:"
          exec bash
        '';
      }).env;
  };
}
```

Con el `flake.nix` anterior, puedo entrar al entorno de construcción del kernel con
`nix develop .#kernel` y luego usar `unpackPhase` para desempaquetar el código fuente del
kernel y entrar en él. Pero no puedo usar `make menuconfig` para configurar el kernel,
porque el paquete `ncurses` falta en este entorno.

Para resolver este problema, agrego un entorno `fhs` para instalar el paquete `ncurses` y
otros paquetes necesarios, y entonces puedo usar `nix develop .#fhs` para entrar en este
entorno y usar `make menuconfig` para configurar el kernel.

## Referencias

- [Linux kernel - NixOS Wiki](https://wiki.nixos.org/wiki/Linux_kernel)
- https://github.com/jordanisaacs/kernel-module-flake
