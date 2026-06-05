# La capacidad de combinación de Flakes y el sistema de módulos de Nixpkgs

## Explicación de la estructura de un Módulo de Nixpkgs {#simple-introduction-to-nixpkgs-module-structure}

> El funcionamiento detallado de este sistema de módulos se presentará en la siguiente
> sección [Modularizar la configuración de NixOS](./modularize-the-configuration.md). Aquí
> solo cubriremos algunos concepts básicos.

Quizás te preguntes por qué el archivo de configuración `/etc/nixos/configuration.nix`
sigue la definición de Módulo de Nixpkgs y puede referenciarse directamente dentro de
`flake.nix`.

Para entenderlo, primero necesitamos conocer el origen del sistema de módulos de Nixpkgs y
su propósito.

Todo el código de implementación de NixOS se almacena en el directorio
[Nixpkgs/nixos](https://github.com/NixOS/nixpkgs/tree/master/nixos), y la mayor parte de
este código fuente está escrito en el lenguaje Nix. Para escribir y mantener una cantidad
tan grande de código Nix, y para permitir que los usuarios personalicen con flexibilidad
varias funciones de su sistema NixOS, es esencial contar con un sistema modular para
código Nix.

Este sistema modular para código Nix también se implementa dentro del repositorio Nixpkgs
y se usa principalmente para modularizar configuraciones del sistema NixOS. Sin embargo,
también se usa ampliamente en otros contexts, como nix-darwin y home-manager. Como NixOS
está construido sobre este sistema modular, es natural que sus archivos de configuración,
incluido `/etc/nixos/configuration.nix`, sean Módulos de Nixpkgs.

Antes de profundizar en el contenido posterior, es esencial tener una comprensión básica
de cómo opera este sistema de módulos.

Aquí tienes una estructura simplificada de un Módulo de Nixpkgs:

```nix
{lib, config, options, pkgs, ...}:
{
  # Importar otros Módulos
  imports = [
    # ...
    ./xxx.nix
  ];
  for.bar.enable = true;
  # Otras declaraciones de opciones
  # ...
}
```

La definición es en realidad una función de Nix, y tiene cinco **parámetros generados
automáticamente, inyectados automáticamente y libres de declaración** proporcionados por
el sistema de módulos:

1. `lib`: una biblioteca de funciones integrada incluida con nixpkgs, que ofrece muchas
   funciones prácticas para operar expresiones de Nix.
   - Para obtener más información, consulta
     <https://nixos.org/manual/nixpkgs/stable/#id-1.4>.
2. `config`: un conjunto con los valores de todas las opciones en el entorno actual, que
   se usará ampliamente en la sección posterior sobre el sistema de módulos.
3. `options`: un conjunto de todas las opciones definidas en todos los Módulos del entorno
   actual.
4. `pkgs`: una colección que contiene todos los paquetes de nixpkgs, junto con varias
   funciones utilitarias relacionadas.
   - En la etapa inicial, puedes pensar en su valor predeterminado como
     `nixpkgs.legacyPackages.<system>`, donde `<system>` es la arquitectura de tu máquina
     (por ejemplo, `x86_64-linux`), y el valor de `pkgs` se puede personalizar mediante la
     opción `nixpkgs.pkgs`.
5. `modulesPath`: un parámetro disponible solo en NixOS, que es una ruta que apunta a
   [nixpkgs/nixos/modules](https://github.com/NixOS/nixpkgs/tree/nixos-26.05/nixos/modules).
   - Se define en [nixpkgs - modulesPath].
   - Normalmente se usa para importar módulos adicionales de NixOS y se puede encontrar en
     la mayoría de los archivos `hardware-configuration.nix` generados automáticamente por
     NixOS.

## Pasar parámetros no predeterminados a submódulos {#pass-non-default-parameters-to-submodules}

Si necesitas pasar otros parámetros no predeterminados a submódulos, tendrás que usar
algunos métodos especiales para especificarlos manualmente.

El sistema de módulos de Nixpkgs proporciona dos formas de pasar parámetros no
predeterminados:

1. El parámetro `specialArgs` de la función `nixpkgs.lib.nixosSystem`
2. Usar la opción `_module.args` en cualquier módulo para pasar parámetros

La documentación oficial de estos dos parámetros está muy escondida y es vaga y difícil de
entender. Si a los lectores les interesa, incluyo aquí los enlaces:

1. `specialArgs`: hay menciones dispersas relacionadas con él en el NixOS Manual y el
   Nixpkgs Manual.
   - Nixpkgs Manual: [Module System - Nixpkgs]
   - NixOS Manual: [nixos manual - specialArgs]
1. `_module.args`:
   - NixOS Manual:
     [Appendix A. Configuration Options](https://nixos.org/manual/nixos/stable/options#opt-_module.args)
   - Código fuente: [nixpkgs/nixos-26.05/lib/modules.nix - _module.args]

En resumen, tanto `specialArgs` como `_module.args` requieren un conjunto de atributos
como valor y cumplen el mismo propósito: pasar todos los parámetros del conjunto de
atributos a todos los submódulos. La diferencia entre ellos es:

1. La opción `_module.args` se puede usar en cualquier módulo para pasar parámetros entre
   ellos, por lo que es más flexible que `specialArgs`, que solo puede usarse en la
   función `nixpkgs.lib.nixosSystem`.
1. `_module.args` se declara dentro de un módulo, por lo que debe evaluarse después de que
   todos los módulos se hayan evaluado antes de poder usarse. Esto significa que **si usas
   los parámetros pasados mediante `_module.args` en `imports = [ ... ];`, se producirá un
   error de `infinite recursion`**. En este caso, debes usar `specialArgs` en su lugar.

Personalmente prefiero `specialArgs` porque es más directo y fácil de usar, y el estilo de
nomenclatura `_xxx` hace que parezca algo interno que no es adecuado para archivos de
configuración de usuario.

Supón que quieres pasar una dependencia determinada a un submódulo para usarla. Puedes
usar el parámetro `specialArgs` para pasar `inputs` a todos los submódulos:

```nix{11}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    another-input.url = "github:username/repo-name/branch-name";
  };

  outputs = inputs@{ self, nixpkgs, another-input, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      # Establece todos los parámetros de inputs como argumentos especiales para todos los submódulos,
      # para que puedas usar directamente todas las dependencias de inputs en los submódulos
      specialArgs = { inherit inputs; };
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

O puedes lograr el mismo efecto usando la opción `_module.args`:

```nix{13}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    another-input.url = "github:username/repo-name/branch-name";
  };
  outputs = inputs@{ self, nixpkgs, another-input, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      modules = [
        ./configuration.nix
        {
          # Establece todos los parámetros de inputs como argumentos especiales para todos los submódulos,
          # para que puedas usar directamente todas las dependencias de inputs en los submódulos
          _module.args = { inherit inputs; };
        }
      ];
    };
  };
}
```

Elige uno de los dos métodos anteriores para modificar tu configuración, y luego podrás
usar el parámetro `inputs` en `/etc/nixos/configuration.nix`. El sistema de módulos hará
coincidir automáticamente el `inputs` definido en `specialArgs` y lo inyectará en todos
los submódulos que requieran este parámetro:

```nix{3}
# Nix hará coincidir por nombre e inyectará automáticamente inputs
# desde specialArgs/_module.args en el tercer parámetro de esta función
{ config, pkgs, inputs, ... }:
{
  # ...
}
```

La siguiente sección demostrará cómo usar `specialArgs`/`_module.args` para instalar
software del sistema desde otras fuentes de flake.

## Instalar software del sistema desde otras fuentes de flake {#install-system-packages-from-other-flakes}

El requisito más común al administrator un sistema es instalar software, y ya vimos en la
sección anterior cómo instalar paquetes desde el repositorio oficial nixpkgs usando
`environment.systemPackages`. Todos estos paquetes provienen del repositorio oficial
nixpkgs.

Ahora aprenderemos cómo instalar paquetes de software desde otras fuentes de flake, lo
cual es mucho más flexible que instalarlos directamente desde nixpkgs. El caso de uso
principal es instalar la versión más reciente de un software que aún no se ha agregado o
actualizado en Nixpkgs.

Tomando como ejemplo el editor Helix, aquí se muestra cómo compilar e instalar
directamente la rama master de Helix.

Primero, agrega la fuente de datos de input helix a `flake.nix`:

```nix{6,11,17}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

    # editor helix, usa la rama master
    helix.url = "github:helix-editor/helix/master";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      specialArgs = { inherit inputs; };
      modules = [
        ./configuration.nix

        # Este módulo funciona igual que el parámetro `specialArgs` que usamos arriba
        # elige uno de los dos métodos para usarlo
        # { _module.args = { inherit inputs; };}
      ];
    };
  };
}
```

Luego, puedes referenciar esta fuente de datos de input de flake en `configuration.nix`:

```nix{1,10}
{ config, pkgs, inputs, ... }:
{
  # ...
  environment.systemPackages = with pkgs; [
    git
    vim
    wget
    # Aquí, el paquete helix se instala desde la fuente de datos de input helix
    inputs.helix.packages."${pkgs.stdenv.hostPlatform.system}".helix
  ];
  # ...
}
```

Realiza los cambios necesarios y despliega con `sudo nixos-rebuild switch`. Esta vez el
despliegue tomará mucho más tiempo porque Nix compilará todo el programa Helix desde el
código fuente.

Después del despliegue, puedes probar y verificar directamente la instalación usando el
comando `hx` en la terminal.

Además, si solo quieres probar la versión más reciente de Helix y decidir después si
instalarla en tu sistema, hay una forma más simple de hacerlo con un solo comando (pero,
como se mencionó antes, compilar desde el código fuente tomará mucho tiempo):

```bash
nix run github:helix-editor/helix/master
```

Entraremos en más detalle sobre el uso de `nix run` en la siguiente sección
[Uso de la nueva CLI](../other-usage-of-flakes/the-new-cli.md).

## Aprovechar funcionalidades de otros paquetes de Flakes

De hecho, esta es la funcionalidad principal de Flakes: un flake puede depender de otros
flakes, lo que le permite utilizar las funcionalidades que proporcionan. Es similar a cómo
incorporamos funcionalidades de otras bibliotecas cuando escribimos programas en
TypeScript, Go, Rust y otros lenguajes de programación.

El ejemplo anterior, que usa la versión más reciente del Flake oficial de Helix, ilustra
esta funcionalidad. Más adelante se discutirán más casos de uso; aquí hay algunos ejemplos
referenciados para mencionarlos en el futuro:

- [Primeros pasos con Home Manager](./start-using-home-manager.md): introduce el Home
  Manager de la comunidad como dependencia, lo que permite utilizar directamente las
  funcionalidades proporcionadas por este Flake.
- [Actualizar o revertir paquetes](./downgrade-or-upgrade-packages.md): aquí se introducen
  diferentes versiones de Nixpkgs como dependencias, lo que permite seleccionar con
  flexibilidad paquetes de varias versiones de Nixpkgs.

## Más tutorials de Flakes

Hasta este punto, hemos aprendido cómo usar Flakes para configurar sistemas NixOS. Si
tienes más preguntas sobre Flakes o quieres aprender con mayor profundidad, consulta
directamente los siguientes documentos oficiales/semioficiales:

- Documentación oficial de Nix Flakes:
  - [Nix flakes - Nix Manual](https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake)
  - [Flakes - nix.dev](https://nix.dev/concepts/flakes)
- Una series de tutorials de Eelco Dolstra (el creador de Nix) sobre Flakes:
  - [Nix Flakes, Part 1: An introduction and tutorial (Eelco Dolstra, 2020)](https://www.tweag.io/blog/2020-05-25-flakes/)
  - [Nix Flakes, Part 2: Evaluation caching (Eelco Dolstra, 2020)](https://www.tweag.io/blog/2020-06-25-eval-cache/)
  - [Nix Flakes, Part 3: Managing NixOS systems (Eelco Dolstra, 2020)](https://www.tweag.io/blog/2020-07-31-nixos-flakes/)
- Otros documentos útiles:
  - [Practical Nix Flakes](https://serokell.io/blog/practical-nix-flakes)

[nix flake - Nix Manual]:
  https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake#flake-inputs
[nixpkgs/flake.nix]: https://github.com/NixOS/nixpkgs/tree/nixos-26.05/flake.nix
[nixpkgs/nixos/lib/eval-config.nix]:
  https://github.com/NixOS/nixpkgs/tree/nixos-26.05/nixos/lib/eval-config.nix
[Module System - Nixpkgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/doc/module-system/module-system.chapter.md
[nixpkgs/nixos-26.05/lib/modules.nix - _module.args]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/lib/modules.nix#L122-L184
[nixos manual - specialArgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/nixos/doc/manual/development/option-types.section.md?plain=1#L299-L306
[nixpkgs - modulesPath]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/nixos/lib/eval-config-minimal.nix#L42
