# Primeros pasos con NixOS

Ahora que hemos aprendido los fundamentos del lenguaje Nix, podemos empezar a usarlo para
configurar nuestro sistema NixOS. El archivo de configuración predeterminado de NixOS se
encuentra en `/etc/nixos/configuration.nix`. Este archivo contiene toda la configuración
declarativa del sistema, incluyendo ajustes de zona horaria, idioma, distribución del
teclado, red, usuarios, sistema de archivos y opciones de arranque.

Para modificar el estado del sistema de manera reproducible (lo cual es altamente
recomendable), necesitamos editar manualmente el archivo `/etc/nixos/configuration.nix` y
luego ejecutar `sudo nixos-rebuild switch` para aplicar la configuración modificada. Este
comando genera un nuevo entorno del sistema basado en el archivo de configuración
actualizado, establece el nuevo entorno como predeterminado y conserva el entorno anterior
en las opciones de arranque de grub/systemd-boot. Esto garantiza que siempre podamos
retroceder al entorno anterior incluso si el nuevo falla al iniciar.

Si bien `/etc/nixos/configuration.nix` es el método clásico para configurar NixOS, depende
de fuentes de datos configuradas mediante `nix-channel` y carece de un mecanismo de
bloqueo de versiones, lo que dificulta garantizar la reproducibilidad del sistema. Un
mejor enfoque es usar **Flakes**, que proporciona reproducibilidad y facilita la gestión
de configuraciones.

En esta sección, primero aprenderemos a gestionar NixOS usando el método clásico
(`/etc/nixos/configuration.nix`), y luego exploraremos el enfoque más avanzado con Flakes.

## Configuración del sistema usando `/etc/nixos/configuration.nix`

El archivo `/etc/nixos/configuration.nix` es el método clásico y predeterminado para
configurar NixOS. Aunque carece de algunas de las funciones avanzadas de Flakes, todavía
se usa ampliamente y ofrece flexibilidad en la configuración del sistema.

Para ilustrar cómo usar `/etc/nixos/configuration.nix`, consideremos un ejemplo en el que
habilitamos SSH y añadimos un usuario llamado `ryan` al sistema. Podemos lograrlo
añadiendo el siguiente contenido a `/etc/nixos/configuration.nix`:

```nix{14-38}
# Edit this configuration file to define what should be installed on
# your system.  Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running ‘nixos-help’).
{ config, pkgs, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
    ];

  # Omit previous configuration settings...

  # Add user 'ryan'
  users.users.ryan = {
    isNormalUser = true;
    description = "ryan";
    extraGroups = [ "networkmanager" "wheel" ];
    openssh.authorizedKeys.keys = [
        # Replace with your own public key
        "ssh-ed25519 <some-public-key> ryan@ryan-pc"
    ];
    packages = with pkgs; [
      firefox
    #  thunderbird
    ];
  };

  # Enable the OpenSSH daemon.
  services.openssh = {
    enable = true;
    settings = {
      X11Forwarding = true;
      PermitRootLogin = "no"; # disable root login
      PasswordAuthentication = false; # disable password login
    };
    openFirewall = true;
  };

  # Omit the rest of the configuration...
}
```

En esta configuración, declaramos nuestra intención de habilitar el servicio openssh,
añadir una clave pública SSH para el usuario `ryan` y deshabilitar el inicio de sesión por
contraseña.

Para desplegar la configuración modificada, ejecuta `sudo nixos-rebuild switch`. Este
comando aplicará los cambios, generará un nuevo entorno del sistema y lo establecerá como
predeterminado. Ahora podrás iniciar sesión en el sistema usando SSH con las claves
configuradas.

> Siempre puedes añadir `--show-trace --print-build-logs --verbose` al comando
> `nixos-rebuild` para obtener mensajes de error detallados si encuentras problemas
> durante el despliegue.

Recuerda que cualquier cambio reproducible en el sistema puede hacerse editando el archivo
`/etc/nixos/configuration.nix` y desplegando los cambios con `sudo nixos-rebuild switch`.

Para encontrar opciones de configuración y documentación:

- Usa motores de búsqueda como Google; por ejemplo, busca `Chrome NixOS` para encontrar
  información relacionada con Chrome en NixOS. La Wiki de NixOS y el código fuente de
  Nixpkgs suelen aparecer entre los primeros resultados.
- Utiliza el [NixOS Options Search](https://search.nixos.org/options) para buscar por
  palabras clave.
- Consulta la
  [sección de Configuración](https://nixos.org/manual/nixos/unstable/index.html#ch-configuration)
  en el Manual de NixOS para documentación de configuración a nivel de sistema.
- Busca palabras clave directamente en el código fuente de
  [nixpkgs](https://github.com/NixOS/nixpkgs) en GitHub.

## Referencias

- [Overview of the NixOS Linux distribution](https://wiki.nixos.org/wiki/Overview_of_the_NixOS_Linux_distribution)
