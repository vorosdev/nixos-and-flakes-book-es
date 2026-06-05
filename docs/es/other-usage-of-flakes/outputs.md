# Flake Outputs

En `flake.nix`, la sección `outputs` define las distintas salidas que un flake puede
producir durante su proceso de compilación. Un flake puede tener varias salidas al mismo
tiempo, entre las cuales se incluyen, pero no se limitan a, las siguientes:

- Paquetes de Nix: se llaman `apps.<system>.<name>`, `packages.<system>.<name>` o
  `legacyPackages.<system>.<name>`. Puedes construir un paquete específico usando el
  commando `nix build .#<name>`.
- Funciones auxiliares de Nix: se llaman `lib.<name>` y sirven como bibliotecas para que
  otros flakes las usen.
- Entornos de desarrollo de Nix: se llaman `devShells` y proporcionan entornos de
  desarrollo aislados. Se accede a ellos con el commando `nix develop`.
- Configuraciones de NixOS: se llaman `nixosConfiguration` y representan configuraciones
  específicas de sistemas NixOS. Puedes activar una configuración con el commando
  `nixos-rebuild switch --flake .#<name>`.
- Plantillas de Nix: se llaman `templates` y pueden usarse como punto de partida para
  crear proyectos nuevos. Puedes generar un proyecto con el commando
  `nix flake init --template <reference>`.
- Otras salidas definidas por el usuario: estas salidas pueden set definidas por el
  usuario y usadas por otras herramientas relacionadas con Nix.

Consulta la documentación official para más detalles - [Flakes Check - Nix Manual].

Aquí hay un fragmento de ejemplo de la Wiki de NixOS que demuestra la estructura de la
sección `outputs`:

```nix
{
  inputs = {
    # ......
  };

  outputs = { self, ... }@inputs: {
    # Ejecutado por `nix flake check`
    checks."<system>"."<name>" = derivation;
    # Ejecutado por `nix build .#<name>`
    packages."<system>"."<name>" = derivation;
    # Ejecutado por `nix build .`
    packages."<system>".default = derivation;
    # Ejecutado por `nix run .#<name>`
    apps."<system>"."<name>" = {
      type = "app";
      program = "<store-path>";
    };
    # Ejecutado por `nix run . -- <args?>`
    apps."<system>".default = { type = "app"; program = "..."; };

    # Formateador (alejandra, nixfmt o nixpkgs-fmt)
    formatter."<system>" = derivation;
    # Usado para paquetes de nixpkgs, también accessible vía `nix build .#<name>`
    legacyPackages."<system>"."<name>" = derivation;
    # Overlay, consumido por otros flakes
    overlays."<name>" = final: prev: { };
    # Overlay predeterminado
    overlays.default = {};
    # Módulo de NixOS, consumido por otros flakes
    nixosModules."<name>" = { config }: { options = {}; config = {}; };
    # Módulo predeterminado
    nixosModules.default = {};
    # Usado con `nixos-rebuild --flake .#<hostname>`
    # nixosConfigurations."<hostname>".config.system.build.toplevel must be a derivation
    nixosConfigurations."<hostname>" = {};
    # Usado por `nix develop .#<name>`
    devShells."<system>"."<name>" = derivation;
    # Usado por `nix develop`
    devShells."<system>".default = derivation;
    # Trabajos de compilación de Hydra
    hydraJobs."<attr>"."<system>" = derivation;
    # Usado por `nix flake init -t <flake>#<name>`
    templates."<name>" = {
      path = "<store-path>";
      description = "¿Aquí va la descripción de la plantilla?";
    };
    # Usado por `nix flake init -t <flake>`
    templates.default = { path = "<store-path>"; description = ""; };
  };
}
```

## Referencias

- [Flakes Check - Nix Manual]

[Flakes Check - Nix Manual]:
  https://nix.dev/manual/nix/stable/command-ref/new-cli/nix3-flake-check
