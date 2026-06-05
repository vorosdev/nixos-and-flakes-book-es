# Simplificar comandos relacionados con NixOS

Para simplificar los comandos relacionados con NixOS, uso
[just](https://github.com/casey/just), que resulta muy cómodo.

También puedes usar herramientas similares como Makefile o
[cargo-make](https://github.com/sagiegurari/cargo-make) para este propósito. Aquí presento
mi enfoque como referencia.

A continuación, un ejemplo de cómo se ve mi `Justfile`:

> El último `Justfile` que estoy usando:
> [ryan4yin/nix-config/Justfile](https://github.com/ryan4yin/nix-config/blob/main/Justfile)

```Makefile
# just es un ejecutor de comandos; Justfile es muy parecido a Makefile, pero más simple.

############################################################################
#
#  Commandos de Nix relacionados con la máquina local
#
############################################################################

deploy:
  nixos-rebuild switch --flake . --use-remote-sudo

debug:
  nixos-rebuild switch --flake . --use-remote-sudo --show-trace --verbose

up:
  nix flake update

# Actualizar un input específico
# uso: make upp i=home-manager
upp:
  nix flake update $(i)

history:
  nix profile history --profile /nix/var/nix/profiles/system

repl:
  nix repl -f flake:nixpkgs

clean:
  # elimina todas las generaciones con más de 7 días
  sudo nix profile wipe-history --profile /nix/var/nix/profiles/system  --older-than 7d

gc:
  # recolecta como basura todas las entradas sin usar del store de nix
  sudo nix-collect-garbage --delete-old

############################################################################
#
#  Idols, comandos relacionados con mi clúster de compilación distribuida remota
#
############################################################################

add-idols-ssh-key:
  ssh-add ~/.ssh/ai-idols

aqua: add-idols-ssh-key
  nixos-rebuild --flake .#aquamarine --target-host aquamarine --build-host aquamarine switch --use-remote-sudo

aqua-debug: add-idols-ssh-key
  nixos-rebuild --flake .#aquamarine --target-host aquamarine --build-host aquamarine switch --use-remote-sudo --show-trace --verbose

ruby: add-idols-ssh-key
  nixos-rebuild --flake .#ruby --target-host ruby --build-host ruby switch --use-remote-sudo

ruby-debug: add-idols-ssh-key
  nixos-rebuild --flake .#ruby --target-host ruby --build-host ruby switch --use-remote-sudo --show-trace --verbose

kana: add-idols-ssh-key
  nixos-rebuild --flake .#kana --target-host kana --build-host kana switch --use-remote-sudo

kana-debug: add-idols-ssh-key
  nixos-rebuild --flake .#kana --target-host kana --build-host kana switch --use-remote-sudo --show-trace --verbose

idols: aqua ruby kana

idols-debug: aqua-debug ruby-debug kana-debug
```

Guarda este `Justfile` en el directorio raíz de tu flake de Nix. Entonces puedo usar
`just deploy` para desplegar la configuración en mi máquina local, y `just idols` para
desplegar la configuración en todos mis servidores remotos.

Este enfoque simplifica la ejecución de comandos de NixOS al ocultarlos detrás de nombres
de objetivo en el `Justfile`, ofreciendo una experiencia más amigable y cómoda.
