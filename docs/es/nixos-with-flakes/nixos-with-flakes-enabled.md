# Habilitando NixOS con Flakes

En comparación con el método de configuración predeterminado que actualmente se usa en
NixOS, Flakes ofrece una mejor reproducibilidad. Su definición clara de la estructura de
paquetes admite de forma nativa dependencias de otros repositorios Git, lo que facilita el
intercambio de código. Por lo tanto, este libro sugiere usar Flakes para gestionar las
configuraciones del sistema.

Esta sección describe cómo usar Flakes para gestionar la configuración de NixOS, y **no
necesitas saber nada sobre Flakes de antemano**.

## Habilitando el soporte de Flakes en NixOS {#enable-nix-flakes}

Actualmente, Flakes sigue siendo una característica experimental y no está habilitada por
defecto. Necesitamos modificar manualmente el archivo `/etc/nixos/configuration.nix` para
habilitar la función Flakes y la nueva herramienta de línea de comandos de nix que la
acompaña:

```nix{12,16}
{ config, pkgs, ... }:

{
  imports = [
    # Include the results of the hardware scan.
    ./hardware-configuration.nix
  ];

  # ......

  # Enable the Flakes feature and the accompanying new nix command-line tool
  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  environment.systemPackages = with pkgs; [
    # Flakes clones its dependencies through the git command,
    # so git must be installed first
    git
    vim
    wget
  ];
  # Set the default editor to vim
  environment.variables.EDITOR = "vim";

  # ......
}
```

Después de realizar estos cambios, ejecuta `sudo nixos-rebuild switch` para aplicar las
modificaciones. Luego podrás usar la función Flakes para gestionar la configuración de tu
sistema.

La nueva herramienta de línea de comandos de nix también ofrece algunas funciones
prácticas. Por ejemplo, ahora puedes usar el comando `nix repl` para abrir un entorno
interactivo de nix. Si te interesa, puedes aprovecharlo para repasar y probar toda la
sintaxis de Nix que has aprendido antes.

## Cambiando la configuración del sistema a `flake.nix` {#switch-to-flake-nix}

Después de habilitar la función Flakes, el comando `sudo nixos-rebuild switch` dará
prioridad a la lectura del archivo `/etc/nixos/flake.nix`, y si no lo encuentra, intentará
usar `/etc/nixos/configuration.nix`.

Puedes comenzar utilizando las plantillas oficiales para aprender a escribir un flake.
Primero, revisa qué plantillas están disponibles:

```bash
nix flake show templates
```

Entre ellas, la plantilla `templates#full` muestra todos los usos posibles. Echa un
vistazo a su contenido:

```bash
nix flake init -t templates#full
cat flake.nix
```

Tomando como referencia esta plantilla, crea el archivo `/etc/nixos/flake.nix` y escribe
el contenido de la configuración. A partir de ese momento, todas las modificaciones del
sistema estarán gestionadas por Nix Flakes. Aquí tienes un ejemplo del contenido:

```nix{15}
{
  description = "A simple NixOS flake";

  inputs = {
    # NixOS official package source, using the nixos-25.05 branch here
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # Please replace my-nixos with your hostname
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      modules = [
        # Import the previous configuration.nix we used,
        # so the old configuration file still takes effect
        ./configuration.nix
      ];
    };
  };
}
```

Aquí definimos un sistema llamado `my-nixos`, con su archivo de configuración ubicado en
`/etc/nixos/` como `./configuration.nix`. Esto significa que aún estamos usando la
configuración clásica.

Ahora, cuando ejecutes `sudo nixos-rebuild switch` para aplicar la configuración, el
sistema no debería cambiar en absoluto, porque simplemente hemos pasado a usar Nix Flakes,
y el contenido de la configuración sigue siendo el mismo que antes.

> Si el nombre de host de tu sistema no es `my-nixos`, necesitas modificar el nombre de
> `nixosConfigurations` en `flake.nix`, o usar `--flake /etc/nixos#my-nixos` para
> especificar el nombre de la configuración.

Después de este cambio, ya podemos gestionar el sistema mediante la función Flakes.

Actualmente, nuestro flake incluye estos archivos:

- `/etc/nixos/flake.nix`: El punto de entrada del flake, que es reconocido y desplegado
  cuando se ejecuta `sudo nixos-rebuild switch`.
- `/etc/nixos/flake.lock`: El archivo de bloqueo de versiones generado automáticamente,
  que registra las fuentes de datos, valores hash y números de versión de todos los
  _inputs_ en todo el flake, garantizando la reproducibilidad del sistema.
- `/etc/nixos/configuration.nix`: Nuestro archivo de configuración anterior, que se
  importa como un módulo en `flake.nix`. Actualmente, toda la configuración del sistema
  está escrita en este archivo.
- `/etc/nixos/hardware-configuration.nix`: El archivo de configuración de hardware del
  sistema, generado por NixOS, que describe la información de hardware del sistema.

## Conclusión

Hasta este punto, solo hemos añadido un archivo de configuración muy simple,
`/etc/nixos/flake.nix`, que no es más que una capa ligera sobre
`/etc/nixos/configuration.nix`, sin ofrecer nuevas funciones ni introducir cambios
disruptivos.

En el contenido que sigue en este libro, aprenderemos sobre la estructura y funcionalidad
de `flake.nix` y veremos poco a poco los beneficios que un wrapper de este tipo puede
aportar.

> Nota: El método de gestión de configuración descrito en este libro NO es “todo en un
> solo archivo”. Se recomienda categorizar el contenido de la configuración en diferentes
> archivos nix, luego introducir estos archivos de configuración en la lista `modules` de
> `flake.nix`, y gestionarlos con Git.
>
> Los beneficios de este enfoque son una mejor organización de los archivos de
> configuración y una mayor mantenibilidad de la configuración. La sección
> [Modularizando la configuración de NixOS](./modularize-the-configuration.md) explicará
> en detalle cómo modularizar tu configuración de NixOS, y
> [Otros consejos útiles - Gestionar la configuración de NixOS con Git](./other-useful-tips.md)
> presentará varias buenas prácticas para gestionar la configuración de NixOS con Git.

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
