# `pkgs.callPackage`

`pkgs.callPackage` se usa para parametrizar la construcción de una derivación de Nix. Para
entender su propósito, primero veamos cómo definiríamos un paquete de Nix, también llamado
derivación, sin usar `pkgs.callPackage`.

## 1. Sin `pkgs.callPackage`

Podemos definir un paquete de Nix con código como este:

```nix
pkgs.writeShellScriptBin "hello" ''echo "hello, ryan!"''
```

Para comprobarlo, puedes usar `nix repl`, y verás que el resultado es efectivamente una
derivación:

```shell
› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.5. Type :? for help.

Loading installable ''...
Added 19203 variables.

nix-repl> pkgs.writeShellScriptBin "hello" '' echo "hello, xxx!" ''
«derivation /nix/store/zhgar12vfhbajbchj36vbbl3mg6762s8-hello.drv»
```

Aunque la definición de esta derivación es bastante concisa, la mayoría de las
derivaciones en nixpkgs son mucho más complejas. En secciones anteriores introdujimos y
usamos ampliamente el método `import xxx.nix` para importar expresiones de Nix desde otros
archivos, lo que mejora la mantenibilidad del código.

1. Para mejorar la mantenibilidad, puedes guardar la definición de la derivación en un
   archivo aparte, por ejemplo `hello.nix`.
   1. Sin embargo, el contexto dentro de `hello.nix` no incluye la variable `pkgs`, así
      que tendrás que modificar su contenido para pasar `pkgs` como parámetro a
      `hello.nix`.
2. En los lugares donde necesites usar esta derivación, puedes usar
   `import ./hello.nix pkgs` para importar `hello.nix` y usar `pkgs` como parámetro para
   ejecutar la función definida dentro.

Sigamos comprobándolo con `nix repl`, y verás que el resultado sigue siendo una
derivación:

```shell
› cat hello.nix
pkgs:
  pkgs.writeShellScriptBin "hello" '' echo "hello, xxx!" ''

› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.5. Type :? for help.

warning: Nix search path entry '/nix/var/nix/profiles/per-user/root/channels' does not exist, ignoring
Loading installable ''...
Added 19203 variables.

nix-repl> import ./hello.nix pkgs
«derivation /nix/store/zhgar12vfhbajbchj36vbbl3mg6762s8-hello.drv»
```

## 2. Usando `pkgs.callPackage`

En el ejemplo anterior sin `pkgs.callPackage`, pasamos `pkgs` directamente como parámetro
a `hello.nix`. Sin embargo, este enfoque tiene algunas desventajas:

1. Todas las demás dependencias de la derivación `hello` quedan fuertemente acopladas con
   `pkgs`.
   1. Si necesitamos dependencias personalizadas, tenemos que modificar `pkgs` o el
      contenido de `hello.nix`, lo cual puede ser engorroso.
2. Cuando `hello.nix` se vuelve complejo, es difícil determinar de qué derivaciones de
   `pkgs` depende, lo que complica analizar las dependencias entre derivaciones.

`pkgs.callPackage`, como herramienta para parametrizar la construcción de derivaciones,
resuelve estos problemas. Veamos su código fuente y sus comentarios en
[nixpkgs/lib/customisation.nix#L101-L121](https://github.com/NixOS/nixpkgs/blob/fe138d3/lib/customisation.nix#L101-L121):

```nix
  /* Llama a la función del paquete en el archivo `fn` con los
    argumentos requeridos de forma automática. La función se invoca con
    los argumentos `args`, pero cualquier argumento faltante se obtiene
    de `autoArgs`. Esta función está pensada para parametrizarse
    parcialmente, por ejemplo:

      callPackage = callPackageWith pkgs;
      pkgs = {
        libfoo = callPackage ./foo.nix { };
        libbar = callPackage ./bar.nix { };
      };

    Si la función `libbar` espera un argumento llamado `libfoo`, se le
    pasa automáticamente. Las sobrescrituras o los argumentos faltantes
    pueden proporcionarse en `args`, por ejemplo:

      libbar = callPackage ./bar.nix {
        libfoo = null;
        enableX11 = true;
      };
  */
  callPackageWith = autoArgs: fn: args:
    let
      f = if lib.isFunction fn then fn else import fn;
      fargs = lib.functionArgs f;

      # Todos los argumentos que se pasarán a la función
      # Esto incluye los automáticos y los pasados explícitamente
      allArgs = builtins.intersectAttrs fargs autoArgs // args;

    # ......
```

En esencia, `pkgs.callPackage` se usa como `pkgs.callPackage fn args`, donde el marcador
`fn` es un archivo o función de Nix, y `args` es un conjunto de atributos. Así funciona:

1. `pkgs.callPackage fn args` primero comprueba si `fn` es una función o un archivo. Si es
   un archivo, importa la función definida dentro.
   1. Después de este paso, tienes una función, normalmente con parámetros como `lib`,
      `stdenv`, `fetchurl` y posiblemente algunos parámetros personalizados.
2. Luego, `pkgs.callPackage fn args` fusiona `args` con el conjunto de atributos `pkgs`.
   Si hay conflictos, los parámetros de `args` sobrescriben los de `pkgs`.
3. Después, `pkgs.callPackage fn args` extrae los parámetros de la función `fn` del
   conjunto de atributos fusionado y los usa para ejecutar la función.
4. El resultado de la ejecución de la función es una derivación, es decir, un paquete de
   Nix.

¿Cómo puede verse un archivo o función de Nix usado como argumento de `pkgs.callPackage`?
Puedes revisar ejemplos que ya usamos en
[Uso avanzado de Nixpkgs - Introducción](./intro.md): `hello.nix`, `fcitx5-rime.nix`,
`vscode/with-extensions.nix` y `firefox/common.nix`. Todos pueden importarse con
`pkgs.callPackage`.

Por ejemplo, si definiste una configuración personalizada del kernel de NixOS en
`kernel.nix` y hiciste configurable el nombre de la rama de desarrollo y el código fuente
del kernel:

```nix
{
  lib,
  stdenv,
  linuxManualConfig,

  src,
  boardName,
  ...
}:
(linuxManualConfig {
  version = "5.10.113-thead-1520";
  modDirVersion = "5.10.113";

  inherit src lib stdenv;

  # ruta del archivo de configuración del kernel generado (el `.config` creado por `make menuconfig`)
  #
  # aquí hay un uso especial para generar una ruta de archivo a partir de una cadena
  configfile = ./. + "${boardName}_config";

  allowImportFromDerivation = true;
})
```

Puedes usar `pkgs.callPackage ./hello.nix {}` en cualquier módulo de Nix para importarlo y
usarlo, sustituyendo cualquiera de sus parámetros según sea necesario:

```nix
{ lib, pkgs, pkgsKernel, kernel-src, ... }:

{
  # ......

  boot = {
    # ......
    kernelPackages = pkgs.linuxPackagesFor (pkgs.callPackage ./pkgs/kernel {
        src = kernel-src;  # el código fuente del kernel se pasa como `specialArgs` e inyecta en este módulo.
        boardName = "licheepi4a";  # nombre de la placa, usado para generar la ruta del archivo de configuración del kernel.
    });

  # ......
}
```

Como se muestra arriba, al usar `pkgs.callPackage` puedes pasar distintos valores de `src`
y `boardName` a la función definida en `kernel.nix` para generar distintos paquetes del
kernel. Esto permite adaptar el mismo `kernel.nix` a diferentes fuentes del kernel y
placas de desarrollo.

Las ventajas de `pkgs.callPackage` son:

1. Las definiciones de derivaciones quedan parametrizadas, y todas sus dependencias son
   los parámetros de la función en su definición. Esto facilita analizar dependencias
   entre derivaciones.
2. Todas las dependencias y otros parámetros personalizados de la derivación pueden
   reemplazarse fácilmente usando el segundo parámetro de `pkgs.callPackage`, lo que
   mejora mucho la reutilización.
3. Aunque consigue las dos funcionalidades anteriores, no aumenta la complejidad del
   código, porque todas las dependencias en `pkgs` pueden inyectarse automáticamente.

Por eso siempre se recomienda usar `pkgs.callPackage` para definir derivaciones.

## References

- [Capítulo 13. Patrón de diseño Callpackage - Nix Pills](https://nixos.org/guides/nix-pills/callpackage-design-pattern.html)
- [callPackage, una herramienta para los perezosos - The Summer of Nix](https://summer.nixos.org/blog/callpackage-a-tool-for-the-lazy/)
- [Documentar qué hace callPackage y sus precondiciones - Nixpkgs Issues](https://github.com/NixOS/nixpkgs/issues/36354)
