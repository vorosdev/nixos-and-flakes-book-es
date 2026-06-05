# Actualizar o revertir paquetes

Al trabajar con Flakes, puedes encontrar situaciones en las que necesites bajar o
actualizar la versión de ciertos paquetes para solucionar errores o problems de
compatibilidad. En Flakes, las versions de los paquetes y los valores hash están
vinculados directamente al commit de git del input de tu flake. Para modificar la versión
del paquete, debes fijar el commit de git del input de flake.

Este es un ejemplo de cómo puedes agregar múltiples inputs de nixpkgs, cada uno usando un
commit o una rama de git diferente:

```nix{8-13,19-20,27-42}
{
  description = "NixOS configuration of Ryan Yin";

  inputs = {
    # Usar la rama nixos-unstable de forma predeterminada
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    # Rama estable más reciente de nixpkgs, usada para revertir versions
    # La versión más reciente actual es 26.05
    nixpkgs-stable.url = "github:nixos/nixpkgs/nixos-26.05";

    # También puedes usar un hash de commit de git específico para fijar la versión
    nixpkgs-fd40cef8d.url = "github:nixos/nixpkgs/fd40cef8d797670e203a27a91e4b8e6decf0b90c";
  };

  outputs = inputs@{
    self,
    nixpkgs,
    nixpkgs-stable,
    nixpkgs-fd40cef8d,
    ...
  }: {
    nixosConfigurations = {
      my-nixos = nixpkgs.lib.nixosSystem {
        # El parámetro `specialArgs` pasa las instancias de nixpkgs
        # no predeterminadas a otros módulos de nix
        specialArgs = let
          system = "x86_64-linux";
        in {
          # Para usar paquetes de nixpkgs-stable,
          # primero configuramos algunos parámetros
          pkgs-stable = import nixpkgs-stable {
            inherit system;
            # Para usar Chrome, necesitamos permitir la
            # instalación de software no libre.
            config.allowUnfree = true;
          };
          pkgs-fd40cef8d = import nixpkgs-fd40cef8d {
            inherit system;
            config.allowUnfree = true;
          };
        };

        modules = [
          ./hosts/my-nixos

          # Omitir otras configuraciones...
        ];
      };
    };
  };
}
```

> **NOTA**: Al usar `import nixpkgs { ... }`, debes proporcionar `system` o `localSystem`
> para especificar la arquitectura de destino; esto difiere de definir una configuración
> de NixOS con `nixpkgs.lib.nixosSystem`. Esta última ya tiene `nixpkgs.hostPlatform`
> configurado en el `hardware-configuration.nix` generado, mientras que un
> `import nixpkgs { ... }` nuevo crea una instancia nueva que no hereda ese valor.

En el ejemplo anterior, hemos definido múltiples inputs de nixpkgs: `nixpkgs`,
`nixpkgs-stable` y `nixpkgs-fd40cef8d`. Cada input corresponde a un commit o una rama de
git diferente.

A continuación, puedes referirte a los paquetes de `pkgs-stable` o `pkgs-fd40cef8d` dentro
de tu submódulo. Este es un ejemplo de un submódulo de Home Manager:

```nix{4-7,13,25}
{
  pkgs,
  config,
  # Nix buscará e inyectará este parámetro
  # desde `specialArgs` en `flake.nix`
  pkgs-stable,
  # pkgs-fd40cef8d,
  ...
}:

{
  # Usar paquetes de `pkgs-stable` en lugar de `pkgs`
  home.packages = with pkgs-stable; [
    firefox-wayland

    # El soporte de Chrome para Wayland estaba roto en la rama nixos-unstable,
    # así que por ahora usamos la rama estable como alternativa.
    # Referencia: https://github.com/swaywm/sway/issues/7562
    google-chrome
  ];

  programs.vscode = {
    enable = true;
    # Referirse a vscode desde `pkgs-stable` en lugar de `pkgs`
    package = pkgs-stable.vscode;
  };
}
```

## Fijar una versión de paquete con un overlay

El enfoque anterior es perfecto para paquetes de aplicaciones, pero a veces necesitas
reemplazar bibliotecas usadas por esos paquetes. Aquí es donde los
[Overlays](../nixpkgs/overlays.md) brillan. Los overlays pueden editar o reemplazar
cualquier atributo de un paquete, pero por ahora solo fijaremos un paquete a una versión
diferente de nixpkgs. La principal desventaja de editar una dependencia con un overlay es
que tu instalación de Nix recompilará todos los paquetes instalados que dependan de ella,
pero tu situación puede requerirlo para correcciones de errores específicas.

```nix
# overlays/mesa.nix
{ config, pkgs, lib, pkgs-fd40cef8d, ... }:
{
  nixpkgs.overlays = [
    # Overlay: usar `self` y `super` para expresar
    # la relación de herencia
    (self: super: {
      mesa = pkgs-fd40cef8d.mesa;
    })
  ];
}
```

## Aplicar la nueva configuración

Al ajustar la configuración como se muestra arriba, puedes desplegarla usando
`sudo nixos-rebuild switch`. Esto bajará tus versions de Firefox/Chrome/VSCode a las
correspondientes a `nixpkgs-stable` o `nixpkgs-fd40cef8d`.

> Según
> [1000 instances of nixpkgs](https://discourse.nixos.org/t/1000-instances-of-nixpkgs/17347),
> no es una buena práctica usar `import` en submódulos o subflakes para personalizar
> `nixpkgs`. Cada `import` crea una nueva instancia de nixpkgs, lo que aumenta el tiempo
> de compilación y el uso de memoria a medida que la configuración crece. Para evitar este
> problema, creamos todas las instancias de nixpkgs en `flake.nix`.
