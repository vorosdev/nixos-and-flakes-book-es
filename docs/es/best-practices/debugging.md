# Depuración de derivaciones y expresiones de Nix

## Mostrar mensajes de error detallados

Siempre puedes intentar añadir `--show-trace --print-build-logs --verbose` al commando
`nixos-rebuild` para obtener el mensaje de error detallado si encuentras algún problema
durante el despliegue. por ejemplo:

```bash
cd /etc/nixos
sudo nixos-rebuild switch --flake .#myhost --show-trace --print-build-logs --verbose

# Una versión más concisa
sudo nixos-rebuild switch --flake .#myhost --show-trace -L -v
```

## Depuración con `nix repl`

> NOTA: si desactivaste `NIX_PATH`, no podrás usar sintaxis como `<nixpkgs>`. En su lugar,
> debes usar `nix repl -f flake:nixpkgs` para cargar nixpkgs.

Hemos usado con frecuencia `nix repl <nixpkgs>` a lo largo de esta guía para examinar el
código fuente. Es una herramienta potente que nos ayuda a entender cómo funcionan las
cosas en Nix.

Veamos más de cerca el mensaje de ayuda de `nix repl`:

```shell
› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.3. Type :? for help.

Loading installable ''...
Added 17755 variables.
nix-repl> :?
The following commands are available:

  <expr>        Evaluate and print expression
  <x> = <expr>  Bind expression to variable
  :a <expr>     Add attributes from resulting set to scope
  :b <expr>     Build a derivation
  :bl <expr>    Build a derivation, creating GC roots in the working directory
  :e <expr>     Open package or function in $EDITOR
  :i <expr>     Build derivation, then install result into current profile
  :l <path>     Load Nix expression and add it to scope
  :lf <ref>     Load Nix flake and add it to scope
  :p <expr>     Evaluate and print expression recursively
  :q            Exit nix-repl
  :r            Reload all files
  :sh <expr>    Build dependencies of derivation, then start nix-shell
  :t <expr>     Describe result of evaluation
  :u <expr>     Build derivation, then start nix-shell
  :doc <expr>   Show documentation of a builtin function
  :log <expr>   Show logs for a derivation
  :te [bool]    Enable, disable or toggle showing traces for errors
```

Hay un par de expresiones que uso con frecuencia: `:lf <ref>` y `:e <expr>`.

El commando `:e <expr>` es muy intuitivo, así que no entraré en detalles. En su lugar,
centremonos en `:lf <ref>`:

```nix
# entra al directorio de mi repo nix-config (deberías reemplazarlo por tu propio repo nix-config)
› cd ~/nix-config/

# entra a nix repl
› nix repl
Welcome to Nix 2.13.3. Type :? for help.

# carga mi flake de nix y añádelo al scope
nix-repl> :lf .
Added 16 variables.

# pulsa <TAB> para ver lo que tenemos en scope
nix-repl><TAB>
# ......omitir algunas salidas
__isInt                          nixosConfigurations
__isList                         null
__isPath                         outPath
__isString                       outputs
__langVersion                    packages
# ......omitir algunas salidas


# ver qué hay en inputs
nix-repl> inputs.<TAB>
inputs.agenix            inputs.nixpkgs
inputs.darwin            inputs.nixpkgs-darwin
inputs.home-manager      inputs.nixpkgs-unstable
inputs.hyprland          inputs.nixpkgs-wayland
inputs.nil
inputs.nixos-generators

# ver qué hay en inputs.nil
nix-repl> inputs.nil.packages.
inputs.nil.packages.aarch64-darwin
inputs.nil.packages.aarch64-linux
inputs.nil.packages.x86_64-darwin
inputs.nil.packages.x86_64-linux

# ver los outputs de mi flake de nix
nix-repl> outputs.nixosConfigurations.<TAB>
outputs.nixosConfigurations.ai
outputs.nixosConfigurations.aquamarine
outputs.nixosConfigurations.kana
outputs.nixosConfigurations.ruby

nix-repl> outputs.nixosConfigurations.ai.<TAB>
outputs.nixosConfigurations.ai._module
outputs.nixosConfigurations.ai._type
outputs.nixosConfigurations.ai.class
outputs.nixosConfigurations.ai.config
outputs.nixosConfigurations.ai.extendModules
outputs.nixosConfigurations.ai.extraArgs
outputs.nixosConfigurations.ai.options
outputs.nixosConfigurations.ai.pkgs
outputs.nixosConfigurations.ai.type

nix-repl> outputs.nixosConfigurations.ai.config.
outputs.nixosConfigurations.ai.config.age
outputs.nixosConfigurations.ai.config.appstream
outputs.nixosConfigurations.ai.config.assertions
outputs.nixosConfigurations.ai.config.boot
outputs.nixosConfigurations.ai.config.console
outputs.nixosConfigurations.ai.config.containers
# ......omitir otras salidas

nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.activation
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.activationPackage
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.emptyActivationPath
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.enableDebugInfo
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.enableNixpkgsReleaseCheck
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraActivationPath
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraBuilderCommands
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraOutputsToInstall
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraProfileCommands
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file
# ......omitir otras salidas


nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.BROWSER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.DELTA_PAGER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.EDITOR
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.TERM
# ......omitir otras salidas

# ver el valor de `TERM`
nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.TERM
"xterm-256color"


# ver todos los archivos definidos por `home.file`
nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..bash_profile
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..bashrc
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/fcitx5/profile
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/fcitx5/profile-bak
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/config
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/i3blocks.conf
#......
```

Como ves, después de cargar tu flake de Nix en el REPL, puedes revisar cada atributo del
flake. Esta capacidad es muy útil para depurar.

## Funciones de depuración proporcionadas por nixpkgs

TODO

## Depuración usando `NIX_DEBUG` en una derivación

TODO

## Referencias

- [How to make nix build display all commands executed by make?](https://www.reddit.com/r/NixOS/comments/14stdgy/how_to_make_nix_build_display_all_commands/)
  - usa `NIX_DEBUG=7` en la derivación
- [Collection of functions useful for debugging broken nix expressions.](https://github.com/NixOS/nixpkgs/blob/nixos-26.05/lib/debug.nix)
