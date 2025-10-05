# Explicación de la configuración de `flake.nix` {#flake-nix-configuration-explained}

Arriba creamos un archivo `flake.nix` para gestionar las configuraciones del sistema, pero
puede que aún no tengas clara su estructura. A continuación, explicaremos en detalle el
contenido de este archivo.

## 1. Entradas del Flake (_Flake Inputs_)

Primero, veamos el atributo `inputs`. Es un conjunto de atributos que define todas las
dependencias de este flake. Estas dependencias se pasarán como argumentos a la función
`outputs` después de ser obtenidas:

```nix{2-5,7}
{
  inputs = {
    # NixOS official package source, using the nixos-25.05 branch here
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # Omitting previous configurations......
  };
}
```

Las dependencias en `inputs` pueden tener muchos tipos y definiciones. Pueden ser otro
flake, un repositorio Git normal o una ruta local. La sección
[Otros usos de Flakes - Entradas de Flake](../other-usage-of-flakes/inputs.md) describe en
detalle los tipos de dependencias más comunes y sus definiciones.

Aquí solo definimos una dependencia llamada `nixpkgs`, que es la forma más común de hacer
referencia en un flake, es decir: `github:owner/name/reference`. El `reference` puede ser
un nombre de rama, un _commit-id_ o una etiqueta (_tag_).

Después de definir `nixpkgs` en `inputs`, puedes usarlo como parámetro en la función
`outputs` que viene a continuación, que es exactamente lo que hace nuestro ejemplo.

## 2. Salidas del Flake (_Flake Outputs_)

Ahora veamos `outputs`. Es una función que recibe como parámetros las dependencias
definidas en `inputs`, y su valor de retorno es un conjunto de atributos que representa
los resultados de compilación del flake:

```nix{9-16}
{
  description = "A simple NixOS flake";

  inputs = {
    # NixOS official package source, here using the nixos-25.05 branch
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # The host with the hostname `my-nixos` will use this configuration
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

Los flakes pueden tener diversos propósitos y diferentes tipos de salidas (_outputs_). La
sección [Salidas de Flake](../other-usage-of-flakes/outputs.md) ofrece una introducción
más detallada. Aquí, solo estamos utilizando el tipo de salida `nixosConfigurations`, que
se usa para configurar sistemas NixOS.

Cuando ejecutamos el comando `sudo nixos-rebuild switch`, este busca el atributo
`nixosConfigurations.my-nixos` (donde `my-nixos` será el nombre de host de tu sistema
actual) dentro del conjunto de atributos devuelto por la función `outputs` de
`/etc/nixos/flake.nix`, y usa esa definición para configurar tu sistema NixOS.

En realidad, también podemos personalizar la ubicación del flake y el nombre de la
configuración de NixOS en lugar de usar los valores predeterminados. Esto puede hacerse
agregando el parámetro `--flake` al comando `nixos-rebuild`. Aquí tienes un ejemplo:

```nix
sudo nixos-rebuild switch --flake /path/to/your/flake#your-hostname
```

Una breve explicación del parámetro `--flake /path/to/your/flake#your-hostname`:

1. `/path/to/your/flake` es la ubicación del flake de destino. La ruta predeterminada es
   `/etc/nixos/`.
2. `#` es un separador, y `your-hostname` es el nombre de la configuración de NixOS.
   `nixos-rebuild` usará por defecto el nombre de host de tu sistema actual como el nombre
   de la configuración que debe buscar.

Incluso puedes hacer referencia directamente a un repositorio remoto de GitHub como fuente
de tu flake, por ejemplo:

```nix
sudo nixos-rebuild switch --flake github:owner/repo#your-hostname
```

## 3. El parámetro especial `self` de la función `outputs` {#special-parameter-self-of-outputs-function}

Aunque no lo hemos mencionado antes, todo el código de ejemplo de las secciones anteriores
incluye un parámetro especial adicional en la función `outputs`, y aquí presentaremos
brevemente su propósito.

Su descripción en el [manual de Nix — *nix flake*] es la siguiente:

> El _input_ especial llamado `self` hace referencia a las salidas (_outputs_) y al árbol
> de código fuente (_source tree_) de este flake.

Esto significa que `self` es tanto el valor de retorno de la función `outputs` del flake
actual como la ruta a la carpeta del código fuente (árbol de origen) de dicho flake.

Aquí no estamos usando el parámetro `self`, pero en algunos ejemplos más complejos (o
configuraciones que puedas encontrar en línea) más adelante, verás cómo se utiliza `self`.

> Nota: Es posible que encuentres código donde las personas usan `self.outputs` para hacer
> referencia a las salidas (_outputs_) del flake actual, lo cual efectivamente funciona.
> Sin embargo, el Manual de Nix no ofrece ninguna explicación sobre esto y se considera un
> detalle interno de la implementación de Flakes. ¡No se recomienda usarlo en tu propio
> código!

## 4. Introducción sencilla a la función `nixpkgs.lib.nixosSystem` {#simple-introduction-to-nixpkgs-lib-nixos-system}

**Un flake puede depender de otros flakes para aprovechar las funciones que estos
proporcionan.**

Por defecto, un flake busca un archivo `flake.nix` en el directorio raíz de cada una de
sus dependencias (es decir, en cada elemento de `inputs`) y evalúa de forma diferida
(_lazy evaluation_) sus funciones `outputs`. Luego, pasa el conjunto de atributos devuelto
por esas funciones como argumentos a su propia función `outputs`, lo que nos permite usar
las funcionalidades que otros flakes ofrecen dentro de nuestro flake actual.

Más precisamente, la evaluación de la función `outputs` de cada dependencia es
**perezosa** (_lazy evaluation_). Esto significa que la función `outputs` de un flake solo
se evalúa cuando realmente se utiliza, evitando así cálculos innecesarios y mejorando la
eficiencia.

La descripción anterior puede parecer un poco confusa, así que veamos el proceso con el
ejemplo de `flake.nix` utilizado en esta sección. Nuestro `flake.nix` declara la
dependencia `inputs.nixpkgs`, por lo que el archivo [nixpkgs/flake.nix] se evaluará cuando
ejecutemos el comando `sudo nixos-rebuild switch`.

A partir del código fuente del repositorio de Nixpkgs, podemos ver que su definición de
_flake outputs_ incluye el atributo `lib`, y en nuestro ejemplo usamos la función
`nixosSystem` de ese atributo `lib` para configurar nuestro sistema NixOS:

```nix{8-13}
{
  inputs = {
    # NixOS official package source, here using the nixos-25.05 branch
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      # system = "x86_64-linux";
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

El conjunto de atributos que sigue a `nixpkgs.lib.nixosSystem` es el único argumento de la
función y contiene todos los parámetros de configuración; aquí solo proporcionamos dos:

- `system`: Un alias heredado de `nixpkgs.hostPlatform` que especifica la plataforma en la
  que se ejecuta la máquina. Dado que el archivo `hardware-configuration.nix` generado (e
  importado por `configuration.nix`) ya define este valor, normalmente puedes omitirlo
  aquí.

- `modules`: Es una lista de módulos donde se define la configuración real del sistema
  NixOS. El archivo de configuración `/etc/nixos/configuration.nix` en sí mismo es un
  módulo de Nixpkgs, por lo que puede añadirse directamente a la lista `modules` para su
  uso.

Comprender estos conceptos básicos es suficiente para los principiantes. Explorar en
detalle la función `nixpkgs.lib.nixosSystem` requiere entender el sistema de módulos de
Nixpkgs. Los lectores que hayan completado la sección
[Modularizando la configuración de NixOS](./modularize-the-configuration.md) pueden volver
a [nixpkgs/flake.nix] para encontrar la definición de `nixpkgs.lib.nixosSystem`, seguir su
código fuente y estudiar su implementación.

[nix flake - Nix Manual]:
  https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake#flake-inputs
[nixpkgs/flake.nix]: https://github.com/NixOS/nixpkgs/tree/nixos-25.05/flake.nix
[nixpkgs/nixos/lib/eval-config.nix]:
  https://github.com/NixOS/nixpkgs/tree/nixos-25.05/nixos/lib/eval-config.nix
[Module System - Nixpkgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/doc/module-system/module-system.chapter.md
[nixpkgs/nixos-25.05/lib/modules.nix - _module.args]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/lib/modules.nix#L122-L184
[nixpkgs/nixos-25.05/nixos/doc/manual/development/option-types.section.md#L268-L275]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/nixos/doc/manual/development/option-types.section.md?plain=1#L268-L275
