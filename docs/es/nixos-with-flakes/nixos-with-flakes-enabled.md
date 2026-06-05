# Habilitar NixOS con Flakes

En comparación con el método de configuración predeterminado que usa actualmente NixOS,
Flakes ofrece mejor reproducibilidad. Su definición clara de estructura de paquetes admite
de forma natural dependencies en otros repositorios de Git, lo que facilita compartir
código. Por eso, este libro sugiere usar Flakes para gestionar la configuración del
sistema.

Esta sección explica cómo usar Flakes para gestionar la configuración del sistema NixOS, y
**no necesitas saber nada sobre Flakes de antemano**.

## Habilitar soporte de Flakes en NixOS {#enable-nix-flakes}

Actualmente, Flakes sigue siendo una función experimental y no está habilitada por
defecto. Necesitamos modificar manualmente el archivo `/etc/nixos/configuration.nix` para
habilitar la función Flakes y la nueva herramienta de línea de commandos de nix:

```nix{12,16}
{ config, pkgs, ... }:

{
  imports = [
    # Incluir los resultados del análisis de hardware.
    ./hardware-configuration.nix
  ];

  # ......

  # Habilitar la función Flakes y la nueva herramienta de línea de commandos de nix
  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  environment.systemPackages = with pkgs; [
    # Flakes clona sus dependencies mediante el commando git,
    # así que git debe instalarse primero
    git
    vim
    wget
  ];
  # Establecer vim como editor predeterminado
  environment.variables.EDITOR = "vim";

  # ......
}
```

Después de hacer estos cambios, ejecuta `sudo nixos-rebuild switch` para aplicar las
modificaciones. Luego ya puedes usar Flakes para gestionar la configuración de tu sistema.

La nueva herramienta de línea de commandos de nix también ofrece funciones útiles. Por
ejemplo, ahora puedes usar el commando `nix repl` para abrir un entorno interaction de
nix. Si te interesa, puedes usarlo para repasar y probar toda la sintaxis de Nix que ya
aprendiste.

## Cambiar la configuración del sistema a `flake.nix` {#switch-to-flake-nix}

Después de habilitar Flakes, el commando `sudo nixos-rebuild switch` priorizará la lectura
del archivo `/etc/nixos/flake.nix` y, si no lo encuentra, intentará usar
`/etc/nixos/configuration.nix`.

Puedes empezar usando las plantillas oficiales para aprender a escribir un flake. Primero,
revisa qué plantillas están disponibles:

```bash
nix flake show templates
```

Entre ellas, la plantilla `templates#full` muestra todos los usos posibles. Mira su
contenido:

```bash
nix flake init -t templates#full
cat flake.nix
```

Tomando esta plantilla como referencia, crea el archivo `/etc/nixos/flake.nix` y escribe
el contenido de configuración. A partir de ahí, todas las modificaciones posteriores del
sistema pasarán a set gestionadas por Nix Flakes. Aquí tienes un ejemplo del contenido:

```nix{15}
{
  description = "A simple NixOS flake";

  inputs = {
    # Fuente official de paquetes de NixOS, usando aquí la rama nixos-26.05
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # Reemplaza my-nixos con el nombre de tu host
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      modules = [
        # Importar la configuration.nix anterior que usamos,
        # para que el archivo viejo siga teniendo efecto
        ./configuration.nix
      ];
    };
  };
}
```

Aquí definimos un sistema llamado `my-nixos`, con su archivo de configuración ubicado en
`/etc/nixos/` como `./configuration.nix`. Eso significa que todavía seguimos usando la
configuración anterior.

Ahora, cuando ejecutes `sudo nixos-rebuild switch` para aplicar la configuración, el
sistema no debería cambiar en absoluto porque solo hemos pasado a usar Nix Flakes, y el
contenido de la configuración sigue siendo el mismo que antes.

> Si el nombre de host de tu sistema no es `my-nixos`, necesitas modificar el nombre de
> `nixosConfigurations` en `flake.nix`, o usar `--flake /etc/nixos#my-nixos` para indicar
> el nombre de la configuración.

Después del cambio, ya podemos gestionar el sistema a través de la función Flakes.

Actualmente, nuestro flake incluye estos archivos:

- `/etc/nixos/flake.nix`: El punto de entrada del flake, que se reconoce y despliega
  cuando se ejecuta `sudo nixos-rebuild switch`.
- `/etc/nixos/flake.lock`: El archivo de bloqueo de versions generado automáticamente, que
  registra las fuentes de datos, valores hash y números de versión de todas las entradas
  de todo el flake, asegurando la reproducibilidad del sistema.
- `/etc/nixos/configuration.nix`: Este es nuestro archivo de configuración anterior, que
  se importa como módulo en `flake.nix`. Actualmente, todas las configuraciones del
  sistema se escriben en este archivo.
- `/etc/nixos/hardware-configuration.nix`: Este es el archivo de configuración de hardware
  del sistema, generado por NixOS, que describe la información de hardware del sistema.

## Conclusión

Hasta este punto, solo hemos añadido un archivo de configuración muy simple,
`/etc/nixos/flake.nix`, que no ha sido más que un envoltorio delgado alrededor de
`/etc/nixos/configuration.nix`, sin ofrecer nuevas funciones ni introducir cambios
rupturistas.

En el contenido del libro que sigue, aprenderemos la estructura y la funcionalidad de
`flake.nix` y veremos poco a poco los beneficios que puede aportar un envoltorio así.

> Nota: El método de gestión de configuración descrito en este libro NO es "Todo en un
> solo archivo". Se recomienda categorizar el contenido de la configuración en distintos
> archivos nix, luego introducir esos archivos en la lista `modules` de `flake.nix` y
> gestionarlos con Git.
>
> Las ventajas de este enfoque son una mejor organización de los archivos de configuración
> y una mayor mantenibilidad de la configuración. La sección
> [Modularizar la configuración de NixOS](./modularize-the-configuration.md) explicará en
> detalle cómo modularizar tu configuración de NixOS, y
> [Otros consejos útiles - Gestionar la configuración de NixOS con Git](./other-useful-tips.md)
> presentará varias buenas prácticas para gestionar la configuración de NixOS con Git.
