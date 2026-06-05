# Modulariza tu configuración de NixOS

En este punto, el esqueleto de todo el sistema está configurado. La estructura de
configuración actual en `/etc/nixos` debería set la siguiente:

```
$ tree
.
├── flake.lock
├── flake.nix
├── home.nix
└── configuration.nix
```

Las funciones de estos cuatro archivos son:

- `flake.lock`: un archivo de bloqueo de versions generado automáticamente que registra
  todas las fuentes de inputs, valores hash y números de versión de todo el flake para
  garantizar la reproducibilidad.
- `flake.nix`: el archivo de entrada que se reconocerá y desplegará al ejecutar
  `sudo nixos-rebuild switch`. Consulta
  [Flakes - NixOS Wiki](https://wiki.nixos.org/wiki/Flakes) para ver todas las opciones de
  flake.nix.
- `configuration.nix`: importado como módulo de Nix en flake.nix; toda la configuración a
  nivel de sistema se escribe actualmente aquí. Consulta
  [Configuration - NixOS Manual](https://nixos.org/manual/nixos/unstable/index.html#ch-configuration)
  para ver todas las opciones de configuration.nix.
- `home.nix`: importado por Home Manager como la configuración del usuario `ryan` en
  flake.nix; contiene toda la configuración de `ryan` y administra la carpeta personal de
  `ryan`. Consulta
  [Appendix A. Configuration Options - Home-Manager](https://nix-community.github.io/home-manager/options.xhtml)
  para ver todas las opciones de home.nix.

Al modificar estos archivos, puedes cambiar declarativamente el estado del sistema y del
directorio personal.

Sin embargo, a medida que la configuración crece, depender únicamente de
`configuration.nix` y `home.nix` puede producir archivos inflados y difíciles de mantener.
Una mejor solución es usar el sistema de módulos de Nix para dividir la configuración en
various módulos de Nix y escribirlos de forma clasificada.

El lenguaje Nix proporciona una
[función import](https://nix.dev/tutorials/nix-language.html#import) con una regla
especial:

> Si el parámetro de `import` es una ruta de carpeta, devolverá el resultado de ejecutar
> el archivo `default.nix` en esa carpeta.

El sistema de módulos de Nixpkgs proporciona un parámetro similar, `imports`, que acepta
una lista de archivos `.nix` y **fusiona** toda la configuración definida en estos
archivos en el módulo de Nix actual.

Ten en cuenta que `imports` no simplemente sobrescribe configuraciones duplicadas, sino
que las maneja de forma más razonable. Por ejemplo, si `program.packages = [...]` se
define en various módulos, entonces `imports` fusionará todos los `program.packages`
definidos en todos los módulos de Nix en una sola lista. Los conjuntos de atributos
también se pueden fusionar correctamente. Puedes explorar por tu cuenta el comportamiento
específico.

> Solo encontré una descripción de `imports` en el
> [Nixpkgs-Unstable Official Manual - evalModules Parameters](https://nixos.org/manual/nixpkgs/unstable/#module-system-lib-evalModules-parameters):
> `A list of modules. These are merged together to form the final configuration.` Es un
> poco ambiguo...

Con la ayuda de `imports`, podemos dividir `home.nix` y `configuration.nix` en various
módulos de Nix definidos en diferentes archivos `.nix`. Veamos un módulo de ejemplo
`packages.nix`:

```nix
{
  config,
  pkgs,
  ...
}: {
  imports = [
    (import ./special-fonts-1.nix {inherit config pkgs;}) # (1)
    ./special-fonts-2.nix # (2)
  ];

  fontconfig.enable = true;
}
```

Este módulo carga otros dos módulos en la sección imports, concretamente
`special-fonts-1.nix` y `special-fonts-2.nix`. Ambos archivos son módulos en sí mismos y
se ven similares a esto.

```nix
{ config, pkgs, ...}: {
  # Cosas de configuración ...
}
```

Las dos sentencias import anteriores son equivalentes en los parámetros que reciben:

- La sentencia `(1)` importa la función en `special-fonts-1.nix` y la llama pasando
  `{config = config; pkgs = pkgs}`. Básicamente usa el valor de retorno de la llamada
  (otro _conjunto de atributos_ de configuración parcial) dentro de la lista `imports`.

- La sentencia `(2)` define una ruta a un módulo, cuya función Nix cargará
  _automáticamente_ al ensamblar la configuración `config`. Pasará todos los arguments
  coincidentes de la función en `packages.nix` a la función cargada en
  `special-fonts-2.nix`, lo que resulta en
  `import ./special-fonts-2.nix {config = config; pkgs = pkgs}`.

Aquí hay un buen ejemplo inicial de modularización de la configuración, muy recomendado:

- [Misterio77/nix-starter-configs](https://github.com/Misterio77/nix-starter-configs)

Un ejemplo más complicado,
[ryan4yin/nix-config/i3-kickstarter](https://github.com/ryan4yin/nix-config/tree/i3-kickstarter),
es la configuración de mi sistema NixOS anterior con el gestor de ventanas i3. Su
estructura es la siguiente:

```shell
├── flake.lock
├── flake.nix
├── home
│   ├── default.nix         # aquí importamos todos los submódulos con imports = [...]
│   ├── fcitx5              # configuración del método de entrada fcitx5
│   │   ├── default.nix
│   │   └── rime-data-flypy
│   ├── i3                  # configuración del gestor de ventanas i3
│   │   ├── config
│   │   ├── default.nix
│   │   ├── i3blocks.conf
│   │   ├── keybindings
│   │   └── scripts
│   ├── programs
│   │   ├── browsers.nix
│   │   ├── common.nix
│   │   ├── default.nix   # aquí importamos todos los módulos de la carpeta programs con imports = [...]
│   │   ├── git.nix
│   │   ├── media.nix
│   │   ├── vscode.nix
│   │   └── xdg.nix
│   ├── rofi              # configuración del lanzador rofi
│   │   ├── configs
│   │   │   ├── arc_dark_colors.rasi
│   │   │   ├── arc_dark_transparent_colors.rasi
│   │   │   ├── power-profiles.rasi
│   │   │   ├── powermenu.rasi
│   │   │   ├── rofidmenu.rasi
│   │   │   └── rofikeyhint.rasi
│   │   └── default.nix
│   └── shell             # configuración relacionada con shell/terminal
│       ├── common.nix
│       ├── default.nix
│       ├── nushell
│       │   ├── config.nu
│       │   ├── default.nix
│       │   └── env.nu
│       ├── starship.nix
│       └── terminals.nix
├── hosts
│   ├── msi-rtx4090      # configuración de mi máquina principal
│   │   ├── default.nix  # este es el antiguo configuration.nix, pero la mayor parte del contenido se dividió en módulos.
│   │   └── hardware-configuration.nix  # configuración relacionada con hardware y disco, autogenerada por nixos
│   └── my-nixos       # configuración de mi máquina de pruebas
│       ├── default.nix
│       └── hardware-configuration.nix
├── modules          # algunos módulos comunes de NixOS que se pueden reutilizar
│   ├── i3.nix
│   └── system.nix
└── wallpaper.jpg    # fondo de pantalla
```

No es necesario seguir la estructura anterior; puedes organizar tu configuración de la
forma que prefieras. La clave es usar `imports` para importar todos los submódulos en el
módulo principal.

## `lib.mkOverride`, `lib.mkDefault` y `lib.mkForce`

En Nix, algunas personas usan `lib.mkDefault` y `lib.mkForce` para definir valores. Estas
funciones están diseñadas para establecer valores predeterminados o forzar valores de
opciones.

Puedes explorar el código fuente de `lib.mkDefault` y `lib.mkForce` ejecutando
`nix repl -f '<nixpkgs>'` y luego ingresando `:e lib.mkDefault`. Para aprender más sobre
`nix repl`, escribe `:?` para ver la información de ayuda.

Aquí está el código fuente:

```nix
  # ......

  mkOverride = priority: content: {
    _type = "override";
    inherit priority content;
  };

  mkOptionDefault = mkOverride 1500; # priority of option defaults
  mkDefault = mkOverride 1000; # used in config sections of non-user modules to set a default
  defaultOverridePriority = 100;
  mkImageMediaOverride = mkOverride 60; # image media profiles can be derived by inclusion into host config, hence needing to override host config, but do allow user to mkForce
  mkForce = mkOverride 50;
  mkVMOverride = mkOverride 10; # used by ‘nixos-rebuild build-vm’

  # ......
```

En resumen, `lib.mkDefault` se usa para establecer valores predeterminados de opciones con
una prioridad interna de 1000, y `lib.mkForce` se usa para forzar valores de opciones con
una prioridad interna de 50. Si estableces directamente el valor de una opción, se
establecerá con una prioridad predeterminada de 100 (definida por
`defaultoverridepriority`), que es más alta que `lib.mkDefault`, por lo que se
sobrescribirá el valor predeterminado.

Cuanto menor sea el valor de `priority`, mayor será la prioridad real. Como resultado,
`lib.mkForce` tiene mayor prioridad que `lib.mkDefault`. Si defines various valores con la
misma prioridad, Nix lanzará un error.

Usar estas funciones puede set muy útil para modularizar la configuración. Puedes
establecer valores predeterminados en un módulo de bajo nivel (módulo base) y forzar
valores en un módulo de alto nivel.

Por ejemplo, en mi configuración en
[ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-server.nix](https://github.com/ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-server.nix#L32),
defino valores predeterminados así:

```nix{6}
{ lib, pkgs, ... }:

{
  # ......

  nixpkgs.config.allowUnfree = lib.mkDefault false;

  # ......
}
```

Luego, para mi máquina de escritorio, sobrescribo el valor en
[ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-desktop.nix](https://github.com/ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-desktop.nix#L18)
así:

```nix{10}
{ lib, pkgs, ... }:

{
  # import the base module
  imports = [
    ./core-server.nix
  ];

  # override the default value defined in the base module
  nixpkgs.config.allowUnfree = lib.mkForce true;

  # ......
}
```

## `lib.mkOrder`, `lib.mkBefore` y `lib.mkAfter`

Además de `lib.mkDefault` y `lib.mkForce`, también existen `lib.mkBefore` y `lib.mkAfter`,
que se usan para establecer el orden de fusión de **opciones de tipo lista**. Estas
funciones contribuyen aún más a la modularización de la configuración.

> No he encontrado la documentación official para opciones de tipo lista, pero simplemente
> entiendo que son tipos cuyos resultados de fusión están relacionados con el orden de
> fusión. Según esta interpretación, tanto los tipos `list` como `string` son opciones de
> tipo lista, y en la práctica estas funciones sí se pueden usar en esos dos tipos.

Como se mencionó antes, cuando defines various valores con la misma **prioridad de
sobrescritura**, Nix lanzará un error. Sin embargo, al usar `lib.mkOrder`, `lib.mkBefore`
o `lib.mkAfter`, puedes definir various valores con la misma prioridad de sobrescritura, y
se fusionarán en el orden que especifiques.

Para examinar el código fuente de `lib.mkBefore`, puedes ejecutar
`nix repl -f '<nixpkgs>'` y luego ingresar `:e lib.mkBefore`. Para aprender más sobre
`nix repl`, escribe `:?` para ver la información de ayuda:

```nix
  # ......

  mkOrder = priority: content:
    { _type = "order";
      inherit priority content;
    };

  mkBefore = mkOrder 500;
  defaultOrderPriority = 1000;
  mkAfter = mkOrder 1500;

  # ......
```

Por lo tanto, `lib.mkBefore` es una abreviatura de `lib.mkOrder 500`, y `lib.mkAfter` es
una abreviatura de `lib.mkOrder 1500`.

Para probar el uso de `lib.mkBefore` y `lib.mkAfter`, creemos un proyecto Flake simple:

```nix{8-36}
# flake.nix
{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  outputs = {nixpkgs, ...}: {
    nixosConfigurations = {
      "my-nixos" = nixpkgs.lib.nixosSystem {
        modules = [
          ({lib, ...}: {
            programs.bash.shellInit = lib.mkBefore ''
              echo 'insert before default'
            '';
            programs.zsh.shellInit = lib.mkBefore "echo 'insert before default';";
            nix.settings.substituters = lib.mkBefore [
              "https://nix-community.cachix.org"
            ];
          })

          ({lib, ...}: {
            programs.bash.shellInit = lib.mkAfter ''
              echo 'insert after default'
            '';
            programs.zsh.shellInit = lib.mkAfter "echo 'insert after default';";
            nix.settings.substituters = lib.mkAfter [
              "https://ryan4yin.cachix.org"
            ];
          })

          ({lib, ...}: {
            programs.bash.shellInit = ''
              echo 'this is default'
            '';
            programs.zsh.shellInit = "echo 'this is default';";
            nix.settings.substituters = [
              "https://nix-community.cachix.org"
            ];
          })
        ];
      };
    };
  };
}
```

El flake anterior contiene el uso de `lib.mkBefore` y `lib.mkAfter` en cadenas multilínea,
cadenas de una sola línea y listas. Probemos los resultados:

```bash
# Example 1: multiline string merging
› echo $(nix eval .#nixosConfigurations.my-nixos.config.programs.bash.shellInit)
trace: warning: system.stateVersion is not set, defaulting to 26.05. Read why this matters on https://nixos.org/manual/nixos/stable/options.html#opt-system.stateVersio
n.
"echo 'insert before default'

echo 'this is default'

if [ -z \"$__NIXOS_SET_ENVIRONMENT_DONE\" ]; then
 . /nix/store/60882lm9znqdmbssxqsd5bgnb7gybaf2-set-environment
fi



echo 'insert after default'
"

# example 2: single-line string merging
› echo $(nix eval .#nixosConfigurations.my-nixos.config.programs.zsh.shellInit)
"echo 'insert before default';
echo 'this is default';
echo 'insert after default';"

# Example 3: list merging
› nix eval .#nixosConfigurations.my-nixos.config.nix.settings.substituters
[ "https://nix-community.cachix.org" "https://nix-community.cachix.org" "https://cache.nixos.org/" "https://ryan4yin.cachix.org" ]

```

Como puedes ver, `lib.mkBefore` y `lib.mkAfter` pueden definir el orden de fusión de
cadenas multilínea, cadenas de una sola línea y listas. El orden de fusión es el mismo que
el orden de definición.

> Para una introducción más profunda al sistema de módulos, consulta
> [Sistema de módulos y opciones personalizadas](../other-usage-of-flakes/module-system.md).

## Referencias

- [Nix modules: Improving Nix's discoverability and usability](https://cfp.nixcon.org/nixcon2020/talk/K89WJY/)
- [Module System - Nixpkgs](https://github.com/NixOS/nixpkgs/blob/nixos-26.05/doc/module-system/module-system.chapter.md)
