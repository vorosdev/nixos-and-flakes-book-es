# NIX_PATH personalizado y registro de flakes

## Introducción a NIX_PATH {#nix-path-introduction}

La ruta de búsqueda de Nix está controlada por la variable de entorno `NIX_PATH`, que
sigue el mismo formato que la variable `PATH` de Linux: consiste en varias rutas separadas
por dos puntos.

Las rutas en expresiones de Nix que se ven como `<name>` se resuelven usando la ruta
llamada `name` de `NIX_PATH`.

Este patrón de uso ya no se recomienda con la característica Flakes porque hace que las
compilaciones dependan de una variable mutable `NIX_PATH`, comprometiendo la
reproducibilidad.

Sin embargo, en ciertos escenarios todavía necesitamos usar `NIX_PATH`, por ejemplo cuando
usamos con frecuencia el comando `nix repl '<nixpkgs>'`, que utiliza el Nixpkgs encontrado
mediante la búsqueda en `NIX_PATH`.

## Introducción al registro de flakes {#flakes-registry-introduction}

El registro de flakes es un centro de registro de flakes que nos ayuda a usar IDs cortos
en vez de direcciones largas de repositorios cuando usamos comandos como `nix run`,
`nix shell`

Por defecto, Nix busca la dirección correspondiente del repositorio GitHub para este ID en
<https://github.com/NixOS/flake-registry/blob/master/flake-registry.json>.

Por ejemplo, si ejecutamos `nix run nixpkgs#ponysay hello`, Nix obtendrá automáticamente
la dirección del repositorio GitHub de `nixpkgs` desde el archivo JSON mencionado. Luego
descarga el repositorio, localiza el `flake.nix` dentro y ejecuta el paquete `ponysay`
correspondiente.

## NIX_PATH y registro de flakes personalizados {#custom-nix-path-and-flake-registry-1}

> **NOTA: Los principiantes deben saltarse esta sección. Desactivar `nix-channel` de forma
> incorrecta puede provocar algunos dolores de cabeza.**

Los roles de `NIX_PATH` y del registro de flakes ya se explicaron antes. En el uso diario,
normalmente queremos que el `nixpkgs` usado en comandos como `nix repl '<nixpkgs>'`,
`nix run nixpkgs#ponysay hello` coincida con el `nixpkgs` del sistema. Esto se hace por
defecto desde [NixOS 24.05][automatic flake registry]. Además, aunque `nix-channel` puede
coexistir con Flakes, en la práctica Flakes puede reemplazarlo por completo, así que
también podemos desactivarlo.

[automatic flake registry]: https://github.com/NixOS/nixpkgs/pull/254405

En tu configuración de NixOS, añadir el siguiente módulo logrará los requisitos
mencionados:

```nix
{ nixpkgs, ... }: {
  nix.channel.enable = false; # elimina herramientas y configuraciones relacionadas con nix-channel; usamos flakes en su lugar.

  # esto lo establece automáticamente nixpkgs.lib.nixosSystem, pero podría ser necesario
  # si no se está usando eso:
  # nixpkgs.flake.source = nixpkgs;
}
```

## Referencias

- [Chapter 15. Nix Search Paths - Nix Pills](https://nixos.org/guides/nix-pills/nix-search-paths.html)
