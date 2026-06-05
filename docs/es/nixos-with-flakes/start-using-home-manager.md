# Primeros pasos con Home Manager

Como mencioné antes, NixOS solo puede gestionar la configuración a nivel del sistema. Para
gestionar la configuración a nivel de usuario en el directorio Home, necesitamos instalar
Home Manager.

Según el
[manual oficial de Home Manager](https://nix-community.github.io/home-manager/index.xhtml),
para instalar Home Manager como un módulo de NixOS, primero necesitamos crear
`/etc/nixos/home.nix`. Este es un ejemplo de su contenido:

```nix
{ config, pkgs, ... }:

{
  # TODO cambia el nombre de usuario y el directorio Home por los tuyos
  home.username = "ryan";
  home.homeDirectory = "/home/ryan";

  # Importa archivos desde el directorio de configuración actual al Nix store,
  # y crea enlaces simbólicos en el directorio Home que apuntan a esos archivos del store.

  # home.file.".config/i3/wallpaper.jpg".source = ./wallpaper.jpg;

  # Importa el directorio scripts al Nix store,
  # y genera recursivamente enlaces simbólicos en el directorio Home que apuntan a los archivos del store.
  # home.file.".config/i3/scripts" = {
  #   source = ./scripts;
  #   recursive = true;   # enlazar recursivamente
  #   executable = true;  # hacer ejecutables todos los archivos
  # };

  # codifica el contenido del archivo directamente en el archivo de configuración de Nix
  # home.file.".xxx".text = ''
  #     xxx
  # '';

  # define el tamaño del cursor y los dpi para un monitor 4k
  xresources.properties = {
    "Xcursor.size" = 16;
    "Xft.dpi" = 172;
  };

  # Paquetes que deberían instalarse en el profile de usuario.
  home.packages = with pkgs; [
    # aquí hay algunas herramientas de línea de comandos que uso con frecuencia
    # puedes agregar las tuyas o eliminar algunas de estas

    neofetch
    nnn # terminal file manager

    # archivos comprimidos
    zip
    xz
    unzip
    p7zip

    # utilidades
    ripgrep # busca recursivamente en directors un patrón regex
    jq # un procesador JSON de línea de comandos ligero y flexible
    yq-go # procesador yaml https://github.com/mikefarah/yq
    eza # un reemplazo moderno para ‘ls’
    fzf # un buscador difuso de línea de comandos

    # herramientas de red
    mtr # una herramienta de diagnóstico de red
    iperf3
    dnsutils  # `dig` + `nslookup`
    ldns # reemplazo de `dig`; proporciona el comando `drill`
    aria2 # una utilidad de descarga de línea de comandos ligera, multiprotocolo y multifuente
    socat # reemplazo de openbsd-netcat
    nmap # una utilidad para descubrimiento de red y auditoría de seguridad
    ipcalc  # es una calculadora para direcciones IPv4/v6

    # varios
    cowsay
    file
    which
    tree
    gnused
    gnutar
    gawk
    zstd
    gnupg

    # relacionado con nix
    #
    # proporciona el comando `nom`, que funciona igual que `nix`
    # con una salida de logs más detallada
    nix-output-monitor

    # productividad
    hugo # generador de sitios estáticos
    glow # previsualizador de markdown en la terminal

    btop  # reemplazo de htop/nmon
    iotop # monitoreo de io
    iftop # monitoreo de red

    # monitoreo de llamadas del sistema
    strace # monitoreo de llamadas del sistema
    ltrace # monitoreo de llamadas a bibliotecas
    lsof # listar archivos abiertos

    # herramientas del sistema
    sysstat
    lm_sensors # para el comando `sensors`
    ethtool
    pciutils # lspci
    usbutils # lsusb
  ];

  # configuración básica de git; cámbiala por la tuya
  programs.git = {
    enable = true;
    userName = "Ryan Yin";
    userEmail = "xiaoyin_c@qq.com";
  };

  # starship: un prompt personalizable para cualquier shell
  programs.starship = {
    enable = true;
    # ajustes personalizados
    settings = {
      add_newline = false;
      aws.disabled = true;
      gcloud.disabled = true;
      line_break.disabled = true;
    };
  };

  # alacritty: un emulador de terminal multiplataforma acelerado por GPU
  programs.alacritty = {
    enable = true;
    # ajustes personalizados
    settings = {
      env.TERM = "xterm-256color";
      font = {
        size = 12;
        draw_bold_text_with_bright_colors = true;
      };
      scrolling.multiplier = 5;
      selection.save_to_clipboard = true;
    };
  };

  programs.bash = {
    enable = true;
    enableCompletion = true;
    # TODO agrega aquí tu bashrc personalizado
    bashrcExtra = ''
      export PATH="$PATH:$HOME/bin:$HOME/.local/bin:$HOME/go/bin"
    '';

    # define algunos alias; puedes agregar más o eliminar algunos
    shellAliases = {
      k = "kubectl";
      urldecode = "python3 -c 'import sys, urllib.parse as ul; print(ul.unquote_plus(sys.stdin.read()))'";
      urlencode = "python3 -c 'import sys, urllib.parse as ul; print(ul.quote_plus(sys.stdin.read()))'";
    };
  };

  # Este valor determina la versión de Home Manager con la que tu
  # configuración es compatible. Esto ayuda a evitar roturas
  # cuando una nueva versión de Home Manager introduce cambios
  # incompatibles hacia atrás.
  #
  # Puedes actualizar Home Manager sin cambiar este valor. Consulta
  # las notas de lanzamiento de Home Manager para ver una lista de
  # cambios de state version en cada versión.
  home.stateVersion = "26.05";
}
```

Después de agregar `/etc/nixos/home.nix`, necesitas importar este nuevo archivo de
configuración en `/etc/nixos/flake.nix` para usarlo. Usa el siguiente comando para generar
un ejemplo en la carpeta actual como referencia:

```shell
nix flake new example -t github:nix-community/home-manager#nixos
```

Después de ajustar los parámetros, el contenido de `/etc/nixos/flake.nix` queda así:

```nix
{
  description = "NixOS configuration";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
    # home-manager, usado para gestionar la configuración de usuario
    home-manager = {
      url = "github:nix-community/home-manager/release-26.05";
      # La palabra clave `follows` en inputs se usa para herencia.
      # Aquí, `inputs.nixpkgs` de home-manager se mantiene consistente con
      # el `inputs.nixpkgs` del flake actual,
      # para evitar problemas causados por diferentes versiones de nixpkgs.
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs@{ nixpkgs, home-manager, ... }: {
    nixosConfigurations = {
      # TODO cambia el hostname por el tuyo
      my-nixos = nixpkgs.lib.nixosSystem {
        modules = [
          ./configuration.nix

          # convierte home-manager en un módulo de nixos
          # para que la configuración de home-manager se despliegue automáticamente al ejecutar `nixos-rebuild switch`
          home-manager.nixosModules.home-manager
          {
            home-manager.useGlobalPkgs = true;
            home-manager.useUserPackages = true;

            # TODO reemplaza ryan por tu propio nombre de usuario
            home-manager.users.ryan = import ./home.nix;

            # Opcionalmente, usa home-manager.extraSpecialArgs para pasar argumentos a home.nix
          }
        ];
      };
    };
  };
}
```

Luego ejecuta `sudo nixos-rebuild switch` para aplicar la configuración, y home-manager se
instalará automáticamente.

> Si el hostname de tu sistema no es `my-nixos`, necesitas modificar el nombre de
> `nixosConfigurations` en `flake.nix`, o usar `--flake /etc/nixos#my-nixos` para
> especificar el nombre de la configuración.

Después de la instalación, todos los paquetes y la configuración a nivel de usuario pueden
gestionarse mediante `/etc/nixos/home.nix`. Al ejecutar `sudo nixos-rebuild switch`, la
configuración de home-manager se aplicará automáticamente. (**¡No es necesario ejecutar
`home-manager switch` manualmente**!)

Para encontrar las opciones que puedes usar en `home.nix`, consulta los siguientes
documentos:

- [Home Manager - Appendix A. Configuration Options](https://nix-community.github.io/home-manager/options.xhtml):
  una lista de todas las opciones; se recomienda buscar palabras clave allí.
  - [Home Manager Option Search](https://home-manager-options.extranix.com/) es otra
    herramienta de búsqueda de opciones con una mejor UI.
- [home-manager](https://github.com/nix-community/home-manager): algunas opciones no
  aparecen en la documentación oficial, o la documentación no es lo suficientemente clara;
  puedes buscar y leer directamente el código fuente correspondiente en este repositorio
  de home-manager.

## Home Manager vs NixOS

Hay muchos paquetes de software o configuraciones que pueden configurarse usando tanto
NixOS Modules (`configuration.nix`) como Home Manager (`home.nix`), lo que genera un
dilemma de elección: **¿Cuál es la diferencia entre colocar paquetes de software o
archivos de configuración en NixOS Modules frente a Home Manager, y cómo deberías
decidir?**

Primero, veamos las diferencias: los paquetes de software y archivos de configuración
instalados mediante NixOS Modules son globales para todo el sistema. Las configuraciones
globales normalmente se almacenan en `/etc`, y el software instalado para todo el sistema
está disponible en cualquier entorno de usuario.

Por otro lado, las configuraciones y el software instalados mediante Home Manager se
enlazarán al directorio Home del usuario correspondiente. El software instalado solo está
disponible en el entorno de ese usuario, y deja de estar disponible al cambiar a otro
usuario.

Con base en estas características, el uso general recomendado es:

- NixOS Modules: instala componentes centrales del sistema y otros paquetes de software o
  configuraciones que necesiten todos los usuarios.
  - Por ejemplo, si quieres que un paquete de software siga funcionando cuando cambies al
    usuario root, o si quieres que una configuración se aplique a todo el sistema,
    deberías instalarlo usando NixOS Modules.
- Home Manager: usa Home Manager para todas las demás configuraciones y software.

Los beneficios de este enfoque son:

1. El software y los servicios en segundo plano instalados a nivel del sistema a menudo se
   ejecutan con privilegios de root. Evitar instalaciones innecesarias de software a nivel
   del sistema puede reducir los riesgos de seguridad del sistema.
1. Muchas configuraciones en Home Manager son universales para NixOS, macOS y otras
   distribuciones Linux. Elegir Home Manager para instalar software y configurar sistemas
   puede mejorar la portabilidad de las configuraciones.
1. Si necesitas soporte multiusuario, el software y las configuraciones instalados
   mediante Home Manager pueden aislar mejor los distintos entornos de usuario, evitando
   conflictos de configuración y de versiones de software entre usuarios.

## ¿Cómo usar paquetes instalados por Home Manager con acceso privilegiado?

Lo primero que viene a la mente es cambiar a `root`, pero entonces cualquier paquete
instalado por el usuario actual mediante `home.nix` no estará disponible. Tomemos
`kubectl` como ejemplo (está preinstalado mediante `home.nix`):

```sh
# 1. kubectl está disponible
› kubectl | head
kubectl controls the Kubernetes cluster manager.

 Find more information at: https://kubernetes.io/docs/reference/kubectl/
......

# 2. cambiar al usuario `root`
› sudo su

# 3. kubectl ya no está disponible
> kubectl
Error: nu::shell::external_command

  × External command failed
   ╭─[entry #1:1:1]
 1 │ kubectl
   · ───┬───
   ·    ╰── executable was not found
   ╰────
  help: No such file or directory (os error 2)


/home/ryan/nix-config> exit
```

La solución es usar `sudo` para ejecutar el comando, lo que concede temporalmente al
usuario actual la capacidad de ejecutar el comando como un usuario privilegiado (`root`):

```sh
› sudo kubectl
kubectl controls the Kubernetes cluster manager.
...
```
