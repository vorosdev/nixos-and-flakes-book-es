# Uso avanzado de Nixpkgs

`callPackage`, `override` y `overlays` son técnicas que se usan ocasionalmente al utilizar
Nix para personalizar el método de construcción de los paquetes de Nix.

Sabemos que muchos programas tienen una gran cantidad de parámetros de compilación que
necesitan configurarse, y distintos usuarios pueden querer valores distintos. Ahí es donde
`override` y `overlays` resultan útiles. Te doy algunos ejemplos que he encontrado:

1. [`fcitx5-rime.nix`](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix):
   por defecto, `fcitx5-rime` usa `rime-data` como valor de `rimeDataPkgs`, pero este
   parámetro se puede personalizar con `override`.
2. [`vscode/with-extensions.nix`](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/pkgs/applications/editors/vscode/with-extensions.nix):
   este paquete para VS Code también puede personalizarse sobrescribiendo el valor de
   `vscodeExtensions`, así podemos instalar complementos personalizados en VS Code.
   - [`nix-vscode-extensions`](https://github.com/nix-community/nix-vscode-extensions): un
     gestor de complementos de vscode implementado sobrescribiendo `vscodeExtensions`.
3. [`firefox/common.nix`](https://github.com/NixOS/nixpkgs/blob/416ffcd08f1f16211130cd9571f74322e98ecef6/pkgs/applications/networking/browsers/firefox/common.nix):
   Firefox también tiene muchos parámetros personalizables.
4. ...

En resumen, `callPackage`, `override` y `overlays` pueden usarse para personalizar los
parámetros de construcción de los paquetes de Nix.
