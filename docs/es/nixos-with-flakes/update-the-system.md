# Actualizar el sistema

Con Flakes, actualizar el sistema es sencillo. Simplemente ejecuta los siguientes
commandos en `/etc/nixos` o en cualquier otra ubicación donde mantengas la configuración:

> **NOTA**: El directorio `/etc/nixos` pertenece a `root` y solo `root` puede escribir en
> él. Por lo tanto, si tu flake se encuentra en este directorio, necesitarás usar `sudo`
> para actualizar cualquier archivo de configuración.

```shell
# Actualizar flake.lock
nix flake update

# O actualizar solo el input específico, como home-manager:
nix flake update home-manager

# Aplicar las actualizaciones
sudo nixos-rebuild switch --flake .
```

Ocasionalmente, puedes encontrar un error de "sha256 mismatch" al ejecutar
`nixos-rebuild switch`. Este error se puede resolver actualizando `flake.lock` con
`nix flake update`.
