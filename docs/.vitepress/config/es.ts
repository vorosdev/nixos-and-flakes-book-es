import { defineConfig } from "vitepress"

export const es = defineConfig({
  lang: "es-MX",
  description: "Un libro no oficial y con criterio propio para principiantes",

  themeConfig: {
    nav: [
      { text: "Inicio", link: "/" },
      { text: "Prefacio", link: "/preface.md" },
      { text: "Primeros pasos", link: "/introduction/index.md" },
      { text: "Mejores prácticas", link: "/best-practices/intro.md" },
    ],
    sidebar: [
      {
        text: "Prefacio",
        items: [{ text: "Prefacio", link: "/preface.md" }],
      },
      {
        text: "Primeros pasos",
        items: [
          { text: "Introducción", link: "/introduction/index.md" },
          {
            text: "Ventajas y desventajas",
            link: "/introduction/advantages-and-disadvantages.md",
          },
          {
            text: "Instalación",
            link: "/introduction/installation.md",
          },
        ],
      },
      {
        text: "El lenguaje Nix",
        items: [{ text: "Fundamentos", link: "/the-nix-language/index.md" }],
      },
      {
        text: "NixOS con Flakes",
        items: [
          {
            text: "Primeros pasos con NixOS",
            link: "/nixos-with-flakes/get-started-with-nixos.md",
          },
          {
            text: "Introducción a Flakes",
            link: "/nixos-with-flakes/introduction-to-flakes.md",
          },
          {
            text: "NixOS con Flakes habilitado",
            link: "/nixos-with-flakes/nixos-with-flakes-enabled.md",
          },
          {
            text: "Explicación de flake.nix de NixOS",
            link: "/nixos-with-flakes/nixos-flake-configuration-explained.md",
          },
          {
            text: "La capacidad de combinación de Flakes y el sistema de módulos de Nixpkgs",
            link: "/nixos-with-flakes/nixos-flake-and-module-system.md",
          },
          {
            text: "Primeros pasos con Home Manager",
            link: "/nixos-with-flakes/start-using-home-manager.md",
          },
          {
            text: "Modularizar la configuración",
            link: "/nixos-with-flakes/modularize-the-configuration.md",
          },
          {
            text: "Actualizar el sistema",
            link: "/nixos-with-flakes/update-the-system.md",
          },
          {
            text: "Actualizar o revertir paquetes",
            link: "/nixos-with-flakes/downgrade-or-upgrade-packages.md",
          },
          {
            text: "Otros consejos útiles",
            link: "/nixos-with-flakes/other-useful-tips.md",
          },
        ],
      },
      {
        text: "Uso avanzado de Nixpkgs",
        items: [
          { text: "Introducción", link: "/nixpkgs/intro.md" },
          { text: "callPackage", link: "/nixpkgs/callpackage.md" },
          { text: "Overriding", link: "/nixpkgs/overriding.md" },
          { text: "Overlays", link: "/nixpkgs/overlays.md" },
          {
            text: "Múltiples instancias de Nixpkgs",
            link: "/nixpkgs/multiple-nixpkgs.md",
          },
        ],
      },
      {
        text: "Nix Store y caché binaria",
        items: [
          { text: "Introducción", link: "/nix-store/intro.md" },
          {
            text: "Agregar servidores de caché binaria",
            link: "/nix-store/add-binary-cache-servers.md",
          },
          {
            text: "Aloja tu propio servidor de caché binaria",
            link: "/nix-store/host-your-own-binary-cache-server.md",
          },
        ],
      },
      {
        text: "Mejores prácticas",
        items: [
          { text: "Introducción", link: "/best-practices/intro.md" },
          {
            text: "Ejecutar binarios descargados en NixOS",
            link: "/best-practices/run-downloaded-binaries-on-nixos.md",
          },
          {
            text: "Simplificar comandos relacionados con NixOS",
            link: "/best-practices/simplify-nixos-related-commands.md",
          },
          {
            text: "Acelerar la depuración de dotfiles",
            link: "/best-practices/accelerating-dotfiles-debugging.md",
          },
          {
            text: "NIX_PATH personalizado y registro de flakes",
            link: "/best-practices/nix-path-and-flake-registry.md",
          },
          {
            text: "Despliegue remoto",
            link: "/best-practices/remote-deployment.md",
          },
          {
            text: "Depuración de derivaciones y expresiones de Nix",
            link: "/best-practices/debugging.md",
          },
        ],
      },

      {
        text: "Otros usos de Flakes",
        items: [
          { text: "Introducción", link: "/other-usage-of-flakes/intro.md" },
          {
            text: "Flake Inputs",
            link: "/other-usage-of-flakes/inputs.md",
          },
          {
            text: "Flake Outputs",
            link: "/other-usage-of-flakes/outputs.md",
          },
          {
            text: "La nueva CLI",
            link: "/other-usage-of-flakes/the-new-cli.md",
          },
          {
            text: "Sistema de módulos y opciones personalizadas",
            link: "/other-usage-of-flakes/module-system.md",
          },
          {
            text: "[WIP] Pruebas",
            link: "/other-usage-of-flakes/testing.md",
          },
        ],
      },
      {
        text: "Entornos de desarrollo en NixOS",
        items: [
          {
            text: "nix shell, nix develop & pkgs.runCommand",
            link: "/development/intro.md",
          },
          {
            text: "Entornos de desarrollo",
            link: "/development/dev-environments.md",
          },
          {
            text: "[WIP] Empaquetado 101",
            link: "/development/packaging-101.md",
          },
          {
            text: "Compilación multiplataforma",
            link: "/development/cross-platform-compilation.md",
          },
          {
            text: "Construcción distribuida",
            link: "/development/distributed-building.md",
          },
          {
            text: "[WIP] Desarrollo del kernel",
            link: "/development/kernel-development.md",
          },
        ],
      },
      {
        text: "Temas avanzados",
        items: [{ text: "Temas avanzados", link: "/advanced-topics/index.md" }],
      },
      {
        text: "Preguntas frecuentes",
        items: [{ text: "Preguntas frecuentes", link: "/faq/index.md" }],
      },
    ],
  },
})
