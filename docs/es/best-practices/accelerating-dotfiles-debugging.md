# Acelerar la depuración de dotfiles

Después de gestionar nuestros dotfiles con Home Manager, un problema que puede aparecer es
que cada vez que modificamos nuestros dotfiles tenemos que ejecutar
`sudo nixos-rebuild switch` (o `home-manager switch` si usas Home Manager de forma
independiente) para que los cambios surtan efecto. Sin embargo, ejecutar este comando
recalcula el estado completo del sistema cada vez, lo cual es doloroso a pesar de los
muchos mecanismos de caché que Nix ya tiene para acelerar este cálculo.

Tomando mi configuración de Neovim/Emacs como ejemplo, les hago cambios frecuentes, a
veces docenas o incluso cientos de veces al día. Tener que esperar a que `nixos-rebuild`
tarde decenas de segundos cada vez es una pérdida de tiempo enorme.

Por suerte, Home Manager proporciona la función
[mkOutOfStoreSymlink][mkOutOfStoreSymlink], que puede crear un enlace simbólico que apunta
a la ruta absoluta de tus dotfiles, evitando así Home Manager y permitiendo que tus
cambios surtan efecto de inmediato.

Este método funciona bajo la premisa de que el contenido de tus dotfiles no es generado
por Nix. Por ejemplo, mis configuraciones de Emacs/Neovim son nativas y solo se enlazan a
las rutas correctas mediante `home.file` o `xdg.configFile` de Nix Home Manager.

A continuación se muestra una breve explicación de cómo usar esta función para acelerar la
depuración de dotfiles.

Suponiendo que colocaste tu configuración de Neovim en `~/nix-config/home/nvim`, añade el
siguiente código a tu configuración de Home Manager (por ejemplo,
`~/nix-config/home/default.nix`):

```nix
{ config, pkgs, ... }: let
  # ruta al directorio de configuración de nvim
  nvimPath = "${config.home.homeDirectory}/nix-config/home/nvim";
  # ruta al directorio de configuración de doom emacs
  doomPath = "${config.home.homeDirectory}/nix-config/home/doom";
in
{
  xdg.configFile."nvim".source = config.lib.file.mkOutOfStoreSymlink nvimPath;
  xdg.configFile."doom".source = config.lib.file.mkOutOfStoreSymlink doomPath;
  # otras configuraciones
}
```

Después de modificar la configuración, ejecuta `sudo nixos-rebuild switch` (o
`home-manager switch` si usas Home Manager de forma independiente) para aplicar los
cambios. A partir de ahí, cualquier modificación que haggis en `~/nix-config/home/nvim` o
`~/nix-config/home/doom` será detectada de inmediato por Neovim/Emacs.

Así puedes gestionar todos tus dotfiles desde un solo repositorio `nix-config`, mientras
que las configuraciones no-Nix que cambian con frecuencia pueden aplicarse rápidamente,
sin verse afectadas por Nix.

[mkOutOfStoreSymlink]:
  https://github.com/search?q=repo%3Anix-community%2Fhome-manager%20outOfStoreSymlink&type=code
