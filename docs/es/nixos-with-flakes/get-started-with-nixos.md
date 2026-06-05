# Primeros pasos con NixOS

Ahora que ya hemos aprendido los fundamentos del lenguaje Nix, podemos empezar a usarlo
para configurar nuestro sistema NixOS. El archivo de configuración predeterminado de NixOS
está en `/etc/nixos/configuration.nix`. Este archivo contiene toda la configuración
declarativa del sistema, incluidos los ajustes de zona horaria, idioma, distribución del
teclado, red, usuarios, sistema de archivos y opciones de arranque.

Para modificar el estado del sistema de forma reproducible, algo muy recomendable,
necesitamos editar manualmente el archivo `/etc/nixos/configuration.nix` y luego ejecutar
`sudo nixos-rebuild switch` para aplicar la configuración modificada. Este commando genera
un nuevo entorno de sistema basado en el archivo de configuración actualizado, establece
ese nuevo entorno como predeterminado y conserva el entorno anterior en las opciones de
arranque de grub/systemd-boot. Así siempre podemos volver al entorno anterior, incluso si
el nuevo no arranca.

Aunque `/etc/nixos/configuration.nix` es el método clásico para configurar NixOS, depende
de fuentes de datos configuradas por `nix-channel` y carece de un mecanismo de bloqueo de
versions, por lo que es difícil garantizar la reproducibilidad del sistema. Un enfoque
mejor es usar Flakes, que aporta reproducibilidad y facilita la gestión de la
configuración.

En esta sección primero aprenderemos a gestionar NixOS usando el método clásico
(`/etc/nixos/configuration.nix`) y luego exploraremos Flakes, que es más avanzado.

## Configuración del sistema usando `/etc/nixos/configuration.nix`

El archivo `/etc/nixos/configuration.nix` es el método predeterminado y clásico para
configurar NixOS. Aunque carece de algunas de las funciones avanzadas de Flakes, sigue
siendo muy usado y ofrece flexibilidad en la configuración del sistema.

Para ilustrar cómo usar `/etc/nixos/configuration.nix`, veamos un ejemplo en el que
habilitamos SSH y añadimos un usuario llamado `ryan` al sistema. Podemos lograrlo
agregando el siguiente contenido a `/etc/nixos/configuration.nix`:

```nix{14-38}
# Edita este archivo de configuración para definir qué debe instalarse en
# tu sistema. La ayuda está disponible en la página del manual configuration.nix(5)
# y en el manual de NixOS (accessible ejecutando ‘nixos-help’).
{ config, pkgs, ... }:

{
  imports =
    [ # Incluir los resultados del análisis de hardware.
      ./hardware-configuration.nix
    ];

  # Omitir ajustes de configuración anteriores...

  # Añadir el usuario 'ryan'
  users.users.ryan = {
    isNormalUser = true;
    description = "ryan";
    extraGroups = [ "networkmanager" "wheel" ];
    openssh.authorizedKeys.keys = [
        # Reemplaza esto con tu propia clave pública
        "ssh-ed25519 <some-public-key> ryan@ryan-pc"
    ];
    packages = with pkgs; [
      firefox
    #  thunderbird
    ];
  };

  # Habilitar el demonio OpenSSH.
  services.openssh = {
    enable = true;
    settings = {
      X11Forwarding = true;
      PermitRootLogin = "no"; # deshabilitar el inicio de sesión de root
      PasswordAuthentication = false; # deshabilitar inicio de sesión por contraseña
    };
    openFirewall = true;
  };

  # Omitir el resto de la configuración...
}
```

En esta configuración declaramos que queremos habilitar el servicio openssh, añadir una
clave pública SSH para el usuario `ryan` y deshabilitar el inicio de sesión por
contraseña.

Para desplegar la configuración modificada, ejecuta `sudo nixos-rebuild switch`. Este
commando aplicará los cambios, generará un nuevo entorno de sistema y lo establecerá como
predeterminado. Ahora ya puedes iniciar sesión en el sistema mediante SSH con las claves
configuradas.

> Siempre puedes añadir `--show-trace --print-build-logs --verbose` al commando
> `nixos-rebuild` para obtener mensajes de error detallados si encuentras algún problema
> durante el despliegue.

Recuerda que cualquier cambio reproducible en el sistema puede hacerse modificando el
archivo `/etc/nixos/configuration.nix` y desplegando los cambios con
`sudo nixos-rebuild switch`.

Para encontrar opciones de configuración y documentación:

- Usa motores de búsqueda como Google; por ejemplo, busca `Chrome NixOS` para encontrar
  información relacionada con Chrome en NixOS. La Wiki de NixOS y el código fuente de
  Nixpkgs suelen aparecer entre los primeros resultados.
- Usa [NixOS Options Search](https://search.nixos.org/options) para buscar palabras clave.
- Consulta la
  [sección de configuración](https://nixos.org/manual/nixos/unstable/index.html#ch-configuration)
  del manual de NixOS para documentación de configuración a nivel de sistema.
- Busca palabras clave directamente en el código fuente de
  [nixpkgs](https://github.com/NixOS/nixpkgs) en GitHub.

## Referencias

- [Overview of the NixOS Linux distribution](https://wiki.nixos.org/wiki/Overview_of_the_NixOS_Linux_distribution)
