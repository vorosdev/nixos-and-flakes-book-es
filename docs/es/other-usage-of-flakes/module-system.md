# Sistema de módulos y opciones personalizadas

En nuestras configuraciones anteriores de NixOS, establecimos various valores para
`options` con el fin de configurar NixOS o Home Manager. Estas `options` en realidad se
definen en dos lugares:

- NixOS:
  [nixpkgs/nixos/modules](https://github.com/NixOS/nixpkgs/tree/nixos-26.05/nixos/modules),
  donde se definen todas las opciones de NixOS visible en
  <https://search.nixos.org/options>.
- Home Manager:
  [home-manager/modules](https://github.com/nix-community/home-manager/blob/release-26.05/modules),
  donde puedes encontrar todas sus opciones en
  <https://nix-community.github.io/home-manager/options.xhtml>.

> Si también usas nix-darwin, su configuración es similar, y su sistema de módulos está
> implementado en
> [nix-darwin/modules](https://github.com/LnL7/nix-darwin/tree/master/modules).

La base de los mencionados módulos de NixOS y Home Manager es un sistema de módulos
universal implementado en Nixpkgs, que se encuentra en [lib/modules.nix][lib/modules.nix].
La documentación official de este sistema de módulos se ofrece a continuación (incluso
para usuarios experimentados de NixOS, entenderlo puede set una tarea complicada):

- [Sistema de módulos - Nixpkgs]

Como la documentación del sistema de módulos de Nixpkgs es escasa, se recomienda
directamente leer otra guía de escritura específica para el sistema de módulos de NixOS,
que es más clara pero aún puede resultar difícil para quienes empiezan:

- [Escribir módulos de NixOS - Nixpkgs]

En resumen, el sistema de módulos está implementado por Nixpkgs y no forma parte del
gestor de paquetes Nix. Por lo tanto, su documentación no está incluida en la
documentación del gestor de paquetes Nix. Además, tanto NixOS como Home Manager se basan
en la implementación del sistema de módulos de Nixpkgs.

## ¿Cuál es el propósito del sistema de módulos?

Como usuarios normals, usar las distintas opciones implementadas por NixOS y Home Manager
basadas en el sistema de módulos basta para cubrir la mayoría de nuestras necesidades.
Entonces, ¿qué beneficios nos aporta profundizar en el sistema de módulos?

En la discusión anterior sobre configuración modular, la idea central era dividir la
configuración en various módulos y luego importar estos módulos usando
`imports = [ ... ];`. Este es el uso más básico del sistema de módulos. Sin embargo, usar
solo `imports = [ ... ];` nos permite importar configuraciones definidas en el módulo tal
como están, sin ninguna personalización, lo que limita la flexibilidad. En configuraciones
sencillas, este método basta, pero si la configuración es más compleja, se vuelve
insuficiente.

Para ilustrar esta desventaja, consideremos un ejemplo. Supongamos que administer cuatro
hosts de NixOS, A, B, C y D. Quiero lograr los siguientes objetivos minimizando la
repetición de configuración:

- Todos los hosts (A, B, C y D) deben habilitar el servicio Docker y configurarlo para que
  inicie al arrancar.
- El host A debe cambiar el controlador de almacenamiento de Docker a `btrfs` mientras
  mantiene el resto de la configuración igual.
- Los hosts B, ubicados en China, necesitan configurar un espejo local en la configuración
  de Docker.
- El host C, ubicado en Estados Unidos, no tiene requisitos especiales.
- El host D, una máquina de escritorio, necesita configurar un proxy HTTP para acelerar
  las descargas de Docker.

Si usáramos únicamente `imports`, podríamos tener que dividir la configuración en various
módulos como este y luego importar módulos distintos para cada host:

```bash
› tree
.
├── docker-default.nix  # Configuración básica de Docker, incluida la de inicio al arrancar
├── docker-btrfs.nix    # Importa docker-default.nix y cambia el controlador de almacenamiento a btrfs
├── docker-china.nix    # Importa docker-default.nix y establece un espejo local
└── docker-proxy.nix    # Importa docker-default.nix y establece un proxy HTTP
```

¿No parece redundante esta configuración? Y eso que este sigue siendo un ejemplo sencillo;
si tuviéramos más máquinas con diferencias de configuración mayores, la redundancia sería
aún más evidente.

Está claro que necesitamos otros medios para abordar este problema de configuración
redundante, y personalizar algunas de nuestras propias `options` es una excelente opción.

Antes de adentrarnos en el estudio del sistema de módulos, insisto una vez más en que el
siguiente contenido no es necesario aprenderlo ni usarlo. Muchos usuarios de NixOS no han
personalizado ninguna `options` y se conforman con usar simplemente `imports` para cubrir
sus necesidades. Si eres principiante, considera aprender esta parte cuando encuentres
problems que `imports` no pueda resolver. Eso está completamente bien.

## Estructura básica y uso

La estructura básica de los módulos definidos en Nixpkgs es la siguiente:

```nix
{ config, pkgs, ... }:

{
  imports =
    [ # importa otros módulos aquí
    ];

  options = {
    # ...
  };

  config = {
    # ...
  };
}
```

Entre estas, ya estamos familiarizados con `imports = [ ... ];`, pero las otras dos partes
aún no se han explorado. Hagamos una breve introducción aquí:

- `options = { ... };`: Similar a las declaraciones de variables en los lenguajes de
  programación, se usa para declarar opciones configurable.
- `config = { ... };`: Similar a las asignaciones de variables en los lenguajes de
  programación, se usa para asignar valores a las opciones declaradas en `options`.

El uso más típico es, dentro del mismo módulo de Nixpkgs, establecer valores para otras
`options` en `config = { .. };` según los valores actuales declarados en
`options = { ... };`. Esto consigue la funcionalidad de una configuración parametrizada.

Se entiende mejor con un ejemplo directo:

```nix
# ./foo.nix
{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.programs.foo;
in {
  options.programs.foo = {
    enable = mkEnableOption "the foo program";

    package = mkOption {
      type = types.package;
      default = pkgs.hello;
      defaultText = literalExpression "pkgs.hello";
      description = "foo package to use.";
    };

    extraConfig = mkOption {
      default = "";
      example = ''
        foo bar
      '';
      type = types.lines;
      description = ''
        Extra settings for foo.
      '';
    };
  };

  config = mkIf cfg.enable {
    home.packages = [ cfg.package ];
    xdg.configFile."foo/foorc" = mkIf (cfg.extraConfig != "") {
      text = ''
        # Generated by Home Manager.

        ${cfg.extraConfig}
      '';
    };
  };
}
```

El módulo definido arriba introduce tres `options`:

- `programs.foo.enable`: Se usa para controlar si este módulo se habilita.
- `programs.foo.package`: Permite personalizar el paquete `foo`, por ejemplo usando
  distintas versions, configurando diferentes parámetros de compilación, etc.
- `programs.foo.extraConfig`: Se usa para personalizar el archivo de configuración de
  `foo`.

Después, en la sección `config`, según los valores declarados en estas tres variables en
`options`, se aplican distintas configuraciones:

- Si `programs.foo.enable` es `false` o no está definido, no se aplica ninguna
  configuración.
  - Esto se consigue usando `lib.mkIf`.
- En caso contrario,
  - Se añade `programs.foo.package` a `home.packages` para instalarlo en el entorno del
    usuario.
  - Se escribe el valor de `programs.foo.extraConfig` en `~/.config/foo/foorc`.

De este modo, podemos importar este módulo en otro archivo Nix y lograr una configuración
personalizada para `foo` estableciendo las `options` definidas aquí. Por ejemplo:

```nix
# ./bar.nix
{ config, lib, pkgs, ... }:

{
  imports = [
    ./foo.nix
  ];

  programs.foo ={
    enable = true;
    package = pkgs.hello;
    extraConfig = ''
      foo baz
    '';
  };
}
```

En el ejemplo anterior, la forma en que asignamos valores a `options` es en realidad una
especie de **abreviación**. Cuando un módulo solo contiene `config` sin ninguna otra
declaración (como `option` y otros parámetros especiales del sistema de módulos), podemos
omitir el envoltorio `config` y escribir directamente el contenido de `config` para
asignar valores a la sección `options` declarada en otros módulos.

## Asignación y evaluación perezosa en el sistema de módulos

El sistema de módulos aprovecha al máximo la evaluación perezosa de Nix, que es crucial
para lograr configuraciones parametrizadas.

Comencemos con un ejemplo sencillo:

```nix
# ./flake.nix
{
  description = "NixOS Flake for Test";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = {nixpkgs, ...}: {
    nixosConfigurations = {
      "test" = nixpkgs.lib.nixosSystem {
        modules = [
          ({config, lib, ...}: {
            options = {
              foo = lib.mkOption {
                default = false;
                type = lib.types.bool;
              };
            };

            # Escenario 1 (funciona bien)
            config.warnings = if config.foo then ["foo"] else [];

            # Escenario 2 (error: se encontró una recursión infinita)
            # config = if config.foo then { warnings = ["foo"];} else {};

            # Escenario 3 (funciona bien)
            # config = lib.mkIf config.foo {warnings = ["foo"];};
          })
        ];
      };
    };
  };
}
```

En los ejemplos 1, 2 y 3 de la configuración anterior, el valor de `config.warnings`
depende del valor de `config.foo`, pero sus métodos de implementación son diferentes.
Guarda la configuración anterior como `flake.nix` y luego usa el commando
`nix eval .#nixosConfigurations.test.config.warnings` para probar por separado los
ejemplos 1, 2 y 3. Verás que los ejemplos 1 y 3 funcionan correctamente, mientras que el
ejemplo 2 produce un error: `error: infinite recursion encountered`.

Expliquemos cada caso:

1. Flujo de evaluación del ejemplo 1: `config.warnings` => `config.foo` => `config`
   1. Primero, Nix intenta calculator el valor de `config.warnings`, pero descubre que
      depende de `config.foo`.
   2. Después, Nix intenta calculator el valor de `config.foo`, que depende de su `config`
      externo.
   3. Nix intenta calculator el valor de `config`, y como el contenido que realmente no
      usa `config.foo` se evalúa perezosamente por Nix, en este punto no hay una
      dependencia recursiva sobre `config.warnings`.
   4. La evaluación de `config.foo` se completa, luego se asigna `config.warnings`, y el
      cálculo termina.

2. Ejemplo 2: `config` => `config.foo` => `config`
   1. Al principio, Nix intenta calculator el valor de `config`, pero descubre que depende
      de `config.foo`.
   2. Después, Nix intenta calculator el valor de `config.foo`, que depende de su `config`
      externo.
   3. Nix intenta calculator el valor de `config`, y esto vuelve al paso 1, lo que conduce
      a una recursión infinita y, finalmente, a un error.

3. Ejemplo 3: La única diferencia respecto al ejemplo 2 es el uso de `lib.mkIf` para
   resolver el problema de la recursión infinita.

La clave está en la función `lib.mkIf`. Cuando se usa `lib.mkIf` para definir `config`,
Nix lo evalúa perezosamente. Esto significa que el cálculo de `config = lib.mkIf ...` solo
ocurrirá después de que se haya completado la evaluación de `config.foo`.

El sistema de módulos de Nixpkgs proporciona una series de funciones similares a
`lib.mkIf` para la configuración parametrizada y la fusión inteligente de módulos:

1. `lib.mkIf`: Ya introducida.
2. `lib.mkOverride` / `lib.mkDefault` / `lib.mkForce`: Ya comentadas en
   [Modularización de la configuración de NixOS](../nixos-with-flakes/modularize-the-configuration.md).
3. `lib.mkOrder`, `lib.mkBefore` y `lib.mkAfter`: Como se mencionó arriba.
4. Consulta [Definiciones de opciones - NixOS] para más funciones relacionadas con la
   asignación (definición) de opciones.

## Declaración de opciones y verificación de tipos

Aunque la asignación es la característica más usada del sistema de módulos, si necesitas
personalizar algunas `options`, también debes profundizar en la declaración de opciones y
la verificación de tipos. Esta parte me parece relativamente directa; es mucho más simple
que la asignación, y puedes entender lo básico consultando directamente la documentación
official. No entraré en detalles aquí.

- [Declaraciones de opciones - NixOS]
- [Tipos de opciones - NixOS]

## Cómo pasar parámetros no predeterminados al sistema de módulos

Ya hemos introducido cómo usar `specialArgs` y `_module.args` para pasar parámetros
adicionales a otras funciones de módulos en
[Gestionar tu NixOS con Flakes](../nixos-with-flakes/nixos-with-flakes-enabled.md#pass-non-default-parameters-to-submodules).
No have falta extenderse más aquí.

## Cómo importar módulos de forma selectiva {#selectively-import-modules}

En los ejemplos anteriores hemos mostrado cómo habilitar o deshabilitar ciertas funciones
mediante opciones personalizadas. Sin embargo, nuestras implementations de código están
todas dentro del mismo archivo Nix. Si nuestros módulos están repartidos en distintos
archivos, ¿cómo podemos lograr una importación selectiva?

Primero veamos algunos patrons comunes de uso incorrecto y luego introduzcamos la forma
correcta de hacerlo.

### Uso incorrecto #1 - Usar `imports` en `config = { ... };` {#wrong-usage-1}

La primera idea podría set usar directamente `imports` dentro de `config = { ... };`, así:

```nix
# ./flake.nix
{
  description = "NixOS Flake for Test";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = {nixpkgs, ...}: {
    nixosConfigurations = {
      "test" = nixpkgs.lib.nixosSystem {
        modules = [
          ({config, lib, ...}: {
            options = {
              foo = lib.mkOption {
                default = false;
                type = lib.types.bool;
              };
            };
            config = lib.mkIf config.foo {
              # Usar imports en config provocará un error
              imports = [
                {warnings = ["foo"];}
                # ...omit other module or file paths
              ];
            };
          })
        ];
      };
    };
  };
}
```

Pero esto no funcionará. Puedes intentar guardar el `flake.nix` anterior en un directorio
nuevo y luego ejecutar `nix eval .#nixosConfigurations.test.config.warnings` allí; se
encontrará un error como `error: The option 'imports' does not exist.`

Esto se debe a que `config` es un conjunto de atributos normal, mientras que `imports` es
un parámetro especial del sistema de módulos. No existe una definición como
`config.imports`.

### Uso correcto #1 - Definir `options` individuals para todos los módulos que requieren importación conditional {#correct-usage-1}

Este es el método más recomendado. Los módulos en los sistemas NixOS se implementan de
esta manera, y buscar `enable` en <https://search.nixos.org/options> mostrará una gran
cantidad de módulos del sistema que pueden habilitarse o deshabilitarse mediante la opción
`enable`.

La forma de escribirlo se introdujo en la sección anterior
[Estructura básica y uso](#basic-structure-and-usage) y no se repetirá aquí.

La desventaja de este método es que todos los módulos Nix que requieren importación
conditional deben modificarse, trasladando todas las declaraciones de configuración del
módulo al bloque de código `config = { ... };`, lo que aumenta la complejidad del código y
es menos amigable para quienes empiezan.

### Uso correcto #2 - Usar `lib.optionals` en `imports = [];` {#correct-usage-2}

La principal ventaja de este método es que es mucho más simple que los métodos
introducidos anteriormente, ya que no require modificar el contenido del módulo; basta con
usar `lib.optionals` en `imports` para decidir si se importa un módulo o no.

> Detalles sobre cómo funciona `lib.optionals`: <https://noogle.dev/f/lib/optionals>

Veamos directamente un ejemplo:

```nix
# ./flake.nix
{
  description = "NixOS Flake for Test";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = {nixpkgs, ...}: {
    nixosConfigurations = {
      "test" = nixpkgs.lib.nixosSystem {
        specialArgs = { enableFoo = true; };
        modules = [
          ({config, lib, enableFoo ? false, ...}: {
            imports =
              [
                  # Otros módulos
              ]
              # Use lib.optionals to decide whether to import foo.nix
              ++ (lib.optionals (enableFoo) [./foo.nix]);
          })
        ];
      };
    };
  };
}
```

```nix
# ./foo.nix
{ warnings = ["foo"];}
```

Guarda los dos archivos Nix anteriores en una carpeta y luego ejecuta
`nix eval .#nixosConfigurations.test.config.warnings` en esa carpeta; la operación es
normal:

```bash
› nix eval .#nixosConfigurations.test.config.warnings
[ "foo" ]
```

Hay una cosa important a tener en cuenta aquí: **no puedes usar parámetros pasados por
`_module.args` en `imports =[ ... ];`**. Ya lo explicamos en detalle en la sección
anterior
[Pasar parámetros no predeterminados a submódulos](../nixos-with-flakes/nixos-flake-and-module-system#pass-non-default-parameters-to-submodules).

## Referencias

- [Mejores recursos para aprender sobre el sistema de módulos de NixOS - Discourse](https://discourse.nixos.org/t/best-resources-for-learning-about-the-nixos-module-system/1177/4)
- [Módulos de NixOS - NixOS Wiki](https://wiki.nixos.org/wiki/NixOS_modules)
- [NixOS: argumento `config` - NixOS Wiki](https://wiki.nixos.org/wiki/NixOS:config_argument)
- [Sistema de módulos - Nixpkgs]
- [Escribir módulos de NixOS - Nixpkgs]

[lib/modules.nix]: https://github.com/NixOS/nixpkgs/blob/nixos-26.05/lib/modules.nix
[Module System - Nixpkgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/doc/module-system/module-system.chapter.md
[Writing NixOS Modules - Nixpkgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/nixos/doc/manual/development/writing-modules.chapter.md
[Option Definitions - NixOS]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/nixos/doc/manual/development/option-def.section.md
[Option Declarations - NixOS]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/nixos/doc/manual/development/option-declarations.section.md
[Options Types - NixOS]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/nixos/doc/manual/development/option-types.section.md
