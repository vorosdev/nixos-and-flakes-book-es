# Explicación de la configuración de `flake.nix` {#flake-nix-configuration-explained}

Antes creamos un archivo `flake.nix` para administrator configuraciones del sistema, pero
quizás todavía no tengas clara su estructura. Expliquemos en detalle el contenido de este
archivo.

## 1. Inputs de Flake

Primero, veamos el atributo `inputs`. Es un conjunto de atributos que define todas las
dependencies de este flake. Estas dependencies se pasarán como arguments a la función
`outputs` después de obtenerse:

```nix{2-5,7}
{
  inputs = {
    # Fuente official de paquetes de NixOS; aquí se usa la rama nixos-26.05
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # Se omiten configuraciones anteriores......
  };
}
```

Las dependencies en `inputs` tienen muchos tipos y definiciones. Puede set otro flake, un
repositorio Git normal o una ruta local. La sección
[Otros usos de Flakes - Inputs de Flake](../other-usage-of-flakes/inputs.md) describe en
detalle los tipos comunes de dependencies y sus definiciones.

Aquí solo definimos una dependencia llamada `nixpkgs`, que es la forma más común de hacer
referencia en un flake, es decir, `github:owner/name/reference`. Aquí, `reference` puede
set el nombre de una rama, un commit-id o una etiqueta.

Después de definir `nixpkgs` en `inputs`, puedes usarlo en los parámetros de la función
`outputs` posterior, que es exactamente lo que have nuestro ejemplo.

## 2. Outputs de Flake

Ahora veamos `outputs`. Es una función que toma las dependencies de `inputs` como sus
parámetros, y su valor de retorno es un conjunto de atributos que representa los
resultados de compilación del flake:

```nix{9-16}
{
  description = "A simple NixOS flake";

  inputs = {
    # Fuente official de paquetes de NixOS; aquí se usa la rama nixos-26.05
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # El host con el hostname `my-nixos` usará esta configuración
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

Los Flakes pueden tener diversos propósitos y diferentes tipos de outputs. La sección
[Outputs de Flake](../other-usage-of-flakes/outputs.md) ofrece una introducción más
detallada. Aquí solo usamos el tipo de output `nixosConfigurations`, que se usa para
configurar sistemas NixOS.

Cuando ejecutamos el commando `sudo nixos-rebuild switch`, este busca el atributo
`nixosConfigurations.my-nixos` (donde `my-nixos` será el hostname de tu sistema actual) en
el conjunto de atributos devuelto por la función `outputs` de `/etc/nixos/flake.nix` y usa
la definición allí para configurar tu sistema NixOS.

En realidad, también podemos personalizar la ubicación del flake y el nombre de la
configuración de NixOS en lugar de usar los valores predeterminados. Esto se puede hacer
agregando el parámetro `--flake` al commando `nixos-rebuild`. Aquí tienes un ejemplo:

```nix
sudo nixos-rebuild switch --flake /path/to/your/flake#your-hostname
```

Una explicación breve del parámetro `--flake /path/to/your/flake#your-hostname`:

1. `/path/to/your/flake` es la ubicación del flake de destino. La ruta predeterminada es
   `/etc/nixos/`.
2. `#` es un separador, y `your-hostname` es el nombre de la configuración de NixOS.
   `nixos-rebuild` usará de forma predeterminada el hostname de tu sistema actual como el
   nombre de configuración que debe buscar.

Incluso puedes referenciar directamente un repositorio remoto de GitHub como fuente de tu
flake, por ejemplo:

```nix
sudo nixos-rebuild switch --flake github:owner/repo#your-hostname
```

## 3. El parámetro especial `self` de la función `outputs` {#special-parameter-self-of-outputs-function}

Aunque no lo hemos mencionado antes, todo el código de ejemplo en las secciones anteriores
tiene un parámetro especial más en la función `outputs`, y aquí presentaremos brevemente
su propósito.

La descripción en el [nix flake - Nix Manual] es:

> La entrada especial llamada `self` se refiere a las salidas y al árbol de código fuente
> de este flake.

Esto significa que `self` es el valor de retorno de la función `outputs` del flake actual
y también la ruta a la carpeta de código fuente del flake actual (source tree).

Aquí no usamos el parámetro `self`, pero más adelante, en algunos ejemplos más complejos
(o configuraciones que puedes encontrar en línea), verás el uso de `self`.

> Nota: Puede que encuentres código donde se usa `self.outputs` para referenciar los
> outputs del flake actual, lo cual efectivamente es posible. Sin embargo, el Nix Manual
> no ofrece ninguna explicación sobre esto, y se considera un detalle interno de
> implementación de flakes. ¡No se recomienda usarlo en tu propio código!

## 4. Introducción simple a la función `nixpkgs.lib.nixosSystem` {#simple-introduction-to-nixpkgs-lib-nixos-system}

**Un Flake puede depender de otros Flakes para utilizar las funcionalidades que ofrecen.**

De forma predeterminada, un flake busca un archivo `flake.nix` en el directorio raíz de
cada una de sus dependencies (es decir, cada elemento en `inputs`) y evalúa de forma
perezosa sus funciones `outputs`. Luego pasa el conjunto de atributos devuelto por estas
funciones como arguments a su propia función `outputs`, lo que nos permite usar las
funcionalidades proporcionadas por los otros flakes dentro de nuestro flake actual.

Más precisamente, la evaluación de la función `outputs` de cada dependencia es perezosa.
Esto significa que la función `outputs` de un flake solo se evalúa cuando realmente se
usa, lo que evita cálculos innecesarios y mejora la eficiencia.

La descripción anterior puede set un poco confusa, así que veamos el proceso con el
ejemplo de `flake.nix` usado en esta sección. Nuestro `flake.nix` declara la dependencia
`inputs.nixpkgs`, por lo que [nixpkgs/flake.nix] se evaluará cuando ejecutemos el commando
`sudo nixos-rebuild switch`.

Desde el código fuente del repositorio Nixpkgs, podemos ver que su definición de outputs
de flake incluye el atributo `lib`; en nuestro ejemplo, usamos la función `nixosSystem`
del atributo `lib` para configurar nuestro sistema NixOS:

```nix{8-13}
{
  inputs = {
    # Fuente official de paquetes de NixOS; aquí se usa la rama nixos-26.05
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
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

- `system`: un alias heredado de `nixpkgs.hostPlatform` que especifica la plataforma en la
  que se ejecuta la máquina. Como el `hardware-configuration.nix` generado (importado por
  `configuration.nix`) ya define este valor, normalmente puedes omitirlo aquí.
- `modules`: esta es una lista de módulos donde se define la configuración real del
  sistema NixOS. El archivo de configuración `/etc/nixos/configuration.nix` es en sí mismo
  un Módulo de Nixpkgs, por lo que se puede agregar directamente a la lista `modules` para
  usarlo.

Comprender estos concepts básicos es suficiente para principiantes. Explorar en detalle la
función `nixpkgs.lib.nixosSystem` require entender el sistema de módulos de Nixpkgs. Los
lectores que hayan completado la sección
[Modularizar la configuración de NixOS](./modularize-the-configuration.md) pueden volver a
[nixpkgs/flake.nix] para encontrar la definición de `nixpkgs.lib.nixosSystem`, rastrear su
código fuente y estudiar su implementación.

[nix flake - Nix Manual]:
  https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake#flake-inputs
[nixpkgs/flake.nix]: https://github.com/NixOS/nixpkgs/tree/nixos-26.05/flake.nix
