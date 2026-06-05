# Sobrescritura

En Nix, puedes personalizar los paquetes de Nix en `pkgs` usando la función `override`,
que permite definir parámetros de compilación personalizados y devuelve una nueva
derivación con los valores sobrescritos. Veamos un ejemplo:

```nix
pkgs.fcitx5-rime.override { rimeDataPkgs = [ ./rime-data-flypy ]; }
```

En el ejemplo anterior, sobrescribimos el parámetro `rimeDataPkgs` de la derivación
`fcitx5-rime` para usar un paquete personalizado llamado `rime-data-flypy`. Esto crea una
nueva derivación donde `rimeDataPkgs` queda sobrescrito, mientras que los demás parámetros
permanecen sin cambios.

Para saber qué parámetros de un paquete específico se pueden sobrescribir, hay un par de
enfoques que puedes seguir:

1. Revisa el código fuente del paquete en el repositorio de Nixpkgs en GitHub, por ejemplo
   [`fcitx5-rime.nix`](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix).
   Asegúrate de seleccionar la rama adecuada, como `nixos-unstable`, si estás usando esa
   rama.
2. Usa el commando `nix repl -f '<nixpkgs>'` para abrir un REPL de Nix y luego escribe
   `:e pkgs.fcitx5-rime`. Esto abre el código fuente del paquete en tu editor
   predeterminado, donde puedes ver todos sus parámetros. Para aprender el uso básico de
   `nix repl`, puedes escribir `:?` para ver la ayuda.

Usando estos métodos, puedes descubrir los parámetros de entrada de un paquete y
determinar cuáles se pueden modificar con `override`.

Por ejemplo, veamos el código fuente de [pkgs.hello]:

```nix
{ callPackage
, lib
, stdenv
, fetchurl
, nixos
, testers
, hello
}:

stdenv.mkDerivation (finalAttrs: {
  pname = "hello";
  version = "2.12.1";

  src = fetchurl {
    url = "mirror://gnu/hello/hello-${finalAttrs.version}.tar.gz";
    sha256 = "sha256-jZkUKv2SV28wsM18tCqNxoCZmLxdYH2Idh9RLibH2yA=";
  };

  doCheck = true;

  # ...
})
```

En este ejemplo, los atributos `pname`, `version`, `src` y `doCheck` pueden sobrescribirse
con `overrideAttrs`. Por ejemplo:

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  doCheck = false;
});
```

En el código anterior usamos `overrideAttrs` para sobrescribir el atributo `doCheck`, y
dejamos los demás atributos sin cambios.

También puedes sobrescribir algunos atributos predeterminados definidos en
`stdenv.mkDerivation` usando `overrideAttrs`. Por ejemplo:

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  separateDebugInfo = true;
});
```

En este caso sobrescribimos el atributo `separateDebugInfo`, que está definido en
`stdenv.mkDerivation` y no en el código fuente de `hello`.

Para ver todos los atributos definidos en `stdenv.mkDerivation`, puedes revisar su código
fuente usando `nix repl -f '<nixpkgs>'` y escribiendo `:e stdenv.mkDerivation`.

Esto abrirá el código fuente en tu editor predeterminado. Si eres nuevo usando `nix repl`,
puedes escribir `:?` para ver la ayuda.

## References

- [Chapter 4. Overriding - nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/#chap-overrides)

[pkgs.hello]:
  https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/applications/misc/hello/default.nix
