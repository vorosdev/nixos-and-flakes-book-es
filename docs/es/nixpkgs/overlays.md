# Overlays

En la sección anterior aprendimos a sobrescribir derivaciones con
`pkgs.xxx.override { ... }` o
`pkgs.xxx.overrideAttrs (finalAttrs: previousAttrs: { ... });`. Sin embargo, este enfoque
genera una nueva derivación y no modifica la derivación original dentro de la instancia de
`pkgs`. Si la derivación que quieres sobrescribir también la usan otros paquetes de Nix,
ellos seguirán usando la derivación sin modificar.

Para modificar globalmente las derivaciones en la instancia predeterminada de nixpkgs, Nix
ofrece una funcionalidad llamada `overlays`.

En entornos Nix tradicionales, los overlays pueden configurarse globalmente usando los
archivos `~/.config/nixpkgs/overlays.nix` o `~/.config/nixpkgs/overlays/*.nix`. Sin
embargo, con Flakes, para garantizar la reproducibilidad del sistema, los overlays no
pueden depender de configuraciones fuera del repositorio Git.

Al usar `flake.nix` para configurar NixOS, tanto Home Manager como NixOS ofrecen la opción
`nixpkgs.overlays` para definir overlays. Puedes consultar la siguiente documentación para
ver más detalles:

- [Home Manager docs - `nixpkgs.overlays`](https://nix-community.github.io/home-manager/options.xhtml#opt-nixpkgs.overlays)
- [Nixpkgs source code - `nixpkgs.overlays`](https://github.com/NixOS/nixpkgs/blob/30d7dd7e7f2cba9c105a6906ae2c9ed419e02f17/nixos/modules/misc/nixpkgs.nix#L169)

Veamos un módulo de ejemplo que carga overlays. Este módulo puede usarse como módulo de
Home Manager o como módulo de NixOS, ya que las definiciones son las mismas:

```nix
# ./overlays/default.nix
{ config, pkgs, lib, ... }:

{
  nixpkgs.overlays = [
    # Overlay 1: usar `self` y `super` para expresar
    # la relación de herencia
    (self: super: {
      google-chrome = super.google-chrome.override {
        commandLineArgs =
          "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
      };
    })

    # Overlay 2: usar `final` y `prev` para expresar
    # la relación entre lo nuevo y lo anterior
    (final: prev: {
      steam = prev.steam.override {
        extraPkgs = pkgs: with pkgs; [
          keyutils
          libkrb5
          libpng
          libpulseaudio
          libvorbis
          stdenv.cc.cc.lib
          xorg.libXcursor
          xorg.libXi
          xorg.libXinerama
          xorg.libXScrnSaver
        ];
        extraProfile = "export GDK_SCALE=2";
      };
    })

    # Overlay 3: definir overlays en otros archivos
    # El contenido de ./overlays/overlay3/default.nix es el mismo que arriba:
    # `(final: prev: { xxx = prev.xxx.override { ... }; })`
    (import ./overlay3)
  ];
}
```

En el ejemplo anterior definimos tres overlays.

1. Overlay 1 modifica la derivación `google-chrome` agregando un argumento de línea de
   commandos para un servidor proxy.
2. Overlay 2 modifica la derivación `steam` agregando paquetes extra y variables de
   entorno.
3. Overlay 3 está definido en un archivo separado `./overlays/overlay3/default.nix`.

Un ejemplo de importar la configuración anterior como módulo de NixOS es el siguiente:

```nix
# ./flake.nix
{
  inputs = {
    # ...
  };

  outputs = inputs@{ nixpkgs, ... }: {
    nixosConfigurations = {
      my-nixos = nixpkgs.lib.nixosSystem {
        modules = [
          ./configuration.nix

          # importar el módulo que contiene overlays
          (import ./overlays)
        ];
      };
    };
  };
}
```

Esto es solo un ejemplo. Escribe tus propios overlays según tus necesidades.

## Múltiples instancias de nixpkgs con distintos overlays

La opción `nixpkgs.overlays = [...];` mencionada arriba modifica directamente la instancia
global de nixpkgs `pkgs`. Si tus overlays cambian algunos paquetes de bajo nivel, podrían
afectar a otros módulos. Una desventaja es que aumenta la compilación local (por la
invalidez de la caché), y también podrían surgir problems de funcionamiento en los
paquetes afectados.

Si quieres usar overlays solo en un lugar específico sin afectar la instancia
predeterminada de nixpkgs, puedes instanciar una nueva instancia de nixpkgs y aplicar ahí
tus overlays. En la siguiente sección veremos cómo hacerlo:
[Los usos ingeniosos de múltiples instancias de nixpkgs](./multiple-nixpkgs.md).

## References

- [Chapter 3. Overlays - nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/#chap-overlays)
