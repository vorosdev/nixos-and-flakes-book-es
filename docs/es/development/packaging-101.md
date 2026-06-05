# Empaquetado 101

WIP, trabajo en progreso; consulta los siguientes documentos de referencia para aprender
empaquetado en Nix.

## Referencias

- [NixOS Series 3: Software Packaging 101](https://lantian.pub/en/article/modify-computer/nixos-packaging.lantian/)
- [How to Learn Nix, Part 28: The standard environment](https://ianthehenry.com/posts/how-to-learn-nix/the-standard-environment/)
- [stdenv - Nixpkgs Manual](https://github.com/NixOS/nixpkgs/tree/nixos-unstable/doc/stdenv)
- [languages-frameworks - Nixpkgs Manual](https://github.com/NixOS/nixpkgs/tree/nixos-unstable/doc/languages-frameworks)
- [Wrapping packages - NixOS Cookbook](https://wiki.nixos.org/wiki/Nix_Cookbook#Wrapping_packages)
- Herramientas útiles:
  - [nurl](https://github.com/nix-community/nurl): genera llamadas de Nix fetcher a partir
    de URLs de repositorios
  - [nix-init](https://github.com/nix-community/nix-init): genera paquetes de Nix a partir
    de URLs con prefetch de hash, inferencia de dependencies, detección de licencias y más
- Código fuente:
  - [pkgs/build-support/trivial-builders/default.nix - runCommand](https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/trivial-builders/default.nix#L25-L54)
  - [pkgs/build-support/setup-hooks/make-wrapper.sh](https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/setup-hooks/make-wrapper.sh)
  - Relacionado con FHS
    - [pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix](https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix):
      `pkgs.buildFHSEnvBubblewrap`
    - [pkgs/build-support/build-fhsenv-chroot/default.nix](https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix):
      `pkgs.buildFHSEnvChroot`
