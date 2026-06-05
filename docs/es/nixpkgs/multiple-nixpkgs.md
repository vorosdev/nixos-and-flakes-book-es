# Los usos ingeniosos de múltiples instancias de nixpkgs

En la sección
[Actualizar o revertir paquetes](../nixos-with-flakes/downgrade-or-upgrade-packages.md) ya
vimos cómo instanciar múltiples instancias distintas de nixpkgs usando el método
`import nixpkgs {...}`, y usarlas en cualquier submódulo mediante `specialArgs`. Hay
muchas aplicaciones para esta técnica; algunas comunes son:

1. Instanciar instancias de nixpkgs con distintos IDs de commit para instalar varias
   versiones de paquetes de software. Este enfoque se usó en la sección anterior
   [Actualizar o revertir paquetes](../nixos-with-flakes/downgrade-or-upgrade-packages.md).

2. Si quieres usar overlays sin afectar la instancia predeterminada de nixpkgs, puedes
   instanciar una nueva instancia de nixpkgs y aplicar overlays sobre ella.
   - La opción `nixpkgs.overlays = [...];` mencionada en la sección anterior sobre
     overlays modifica directamente la instancia global de nixpkgs. Si tus overlays
     cambian algunos paquetes de bajo nivel, podrían afectar a otros módulos. Una
     desventaja es que aumenta la compilación local (por la invalidez de la caché), y
     también podrían surgir problemas de funcionamiento en los paquetes afectados.

3. En compilación multiplataforma, puedes instanciar múltiples instancias de nixpkgs para
   usar de forma selectiva la simulación QEMU para compilación y compilación cruzada en
   distintos lugares, o para añadir varios parámetros de compilación de GCC.

En conclusión, instanciar múltiples instancias de nixpkgs es muy ventajoso.

## Instanciar `nixpkgs`

Primero entendamos cómo instanciar una instancia no global de nixpkgs. La sintaxis más
común es la siguiente:

```nix
{
  # un ejemplo simple
  pkgs-xxx = import nixpkgs {
    # como dijimos antes, aquí se requiere `system` o `localSystem`.
    system = "x86_64-linux";
  };

  # nixpkgs con overlays personalizados
  pkgs-yyy = import nixpkgs {
    system = "x86_64-linux";

    overlays = [
      (self: super: {
        google-chrome = super.google-chrome.override {
          commandLineArgs =
            "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
        };
        # ... otros overlays
      })
    ];
  };

  # un ejemplo más complejo (compilación cruzada)
  pkgs-zzz = import nixpkgs {
    localSystem = "x86_64-linux";
    crossSystem = {
      config = "riscv64-unknown-linux-gnu";

      # https://wiki.nixos.org/wiki/Build_flags
      # esta opción equivale a añadir `-march=rv64gc` a CFLAGS.
      # CFLAGS se usarán como argumentos de línea de comandos para gcc/clang.
      gcc.arch = "rv64gc";
      # equivalente a `-mabi=lp64d` en CFLAGS.
      gcc.abi = "lp64d";
    };

    overlays = [
      (self: super: {
        google-chrome = super.google-chrome.override {
          commandLineArgs =
            "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
        };
        # ... otros overlays
      })
    ];
  };
}
```

Ya aprendimos en nuestro estudio de la sintaxis de Nix:

> La expresión `import` toma como argumento la ruta a otro archivo de Nix y devuelve el
> resultado de ejecución de ese archivo. Si el argumento de `import` es la ruta a una
> carpeta, devuelve el resultado de ejecución del archivo `default.nix` dentro de esa
> carpeta.

`nixpkgs` es un flake con un archivo `default.nix` en su directorio raíz. Así que
`import nixpkgs` devuelve esencialmente el resultado de ejecución de
[nixpkgs/default.nix]. Partiendo de este archivo, puedes ver que la implementación de
`import nixpkgs` está en [pkgs/top-level/impure.nix], como se muestra a continuación:

```nix
# ... se omiten algunas líneas

{ # Ponemos el `system` heredado en `localSystem` si no se pasó `localSystem`.
  # Si no se pasa ninguno, asumimos que estamos construyendo paquetes en la plataforma
  # actual (build, en la terminología de GNU Autotools).
  localSystem ? { system = args.system or builtins.currentSystem; }

# Esto solo hace falta porque la lógica de línea de comandos `--arg` de nix no funciona
# con parámetros sin nombre permitidos por ...
, system ? localSystem.system
, crossSystem ? localSystem

, # Valor de reserva: el contenido del archivo de configuración encontrado en
  # $NIXPKGS_CONFIG o $HOME/.config/nixpkgs/config.nix.
  config ? let
  # ... se omiten algunas líneas

, # Los overlays se usan para extender la colección de Nixpkgs con colecciones
  # adicionales de paquetes. Estas colecciones de paquetes forman parte del punto fijo
  # construido por Nixpkgs.
  overlays ? let
  # ... se omiten algunas líneas

, crossOverlays ? []

, ...
} @ args:

# Si `localSystem` se pasó explícitamente, no debe pasarse el `system` heredado, y vice
# versa.
assert args ? localSystem -> !(args ? system);
assert args ? system -> !(args ? localSystem);

import ./. (builtins.removeAttrs args [ "system" ] // {
  inherit config overlays localSystem;
})
```

Por lo tanto, `import nixpkgs {...}` llama efectivamente a esta función, y el conjunto de
atributos posterior se convierte en los argumentos de esta función.

## Consideraciones

Al crear múltiples instancias de nixpkgs, hay algunos detalles que conviene tener en
cuenta. Estos son algunos problemas comunes:

1. Según el artículo
   [1000 instances of nixpkgs](https://discourse.nixos.org/t/1000-instances-of-nixpkgs/17347)
   compartido por @fbewivpjsbsby, no es una buena práctica usar `import` para personalizar
   `nixpkgs` en submódulos o subflakes. Esto se debe a que cada `import` se evalúa por
   separado, creando una nueva instancia de nixpkgs cada vez. A medida que aumenta el
   número de configuraciones, esto puede provocar tiempos de compilación más largos y más
   uso de memoria. Por eso se recomienda crear todas las instancias de nixpkgs en el
   archivo `flake.nix`.

2. Al mezclar simulación QEMU y compilación cruzada, hay que tener cuidado de evitar
   duplicación innecesaria de compilaciones de paquetes.

[nixpkgs/default.nix]: https://github.com/NixOS/nixpkgs/blob/nixos-26.05/default.nix
[pkgs/top-level/impure.nix]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/top-level/impure.nix
