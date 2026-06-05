# Despliegue remoto

El diseño inherente de Nix encaja muy bien con el despliegue remoto, y la comunidad de Nix
ofrece varias herramientas pensadas para este propósito, como
[NixOps](https://github.com/NixOS/nixops) y
[colmena](https://github.com/zhaofengli/colmena). Además, la herramienta oficial que hemos
usado ampliamente, `nixos-rebuild`, también tiene algunas capacidades de despliegue
remoto.

Además, en escenarios multiarquitectura el despliegue remoto puede aprovechar de forma
óptima el soporte multiarquitectura de Nix. Por ejemplo, puedes compilar cruzadamente un
sistema NixOS aarch64/riscv64 en un host x86_64 y luego desplegarlo remotamente en los
hosts correspondientes vía SSH.

Hace poco me encontré con una situación en la que compilé localmente una imagen del
sistema NixOS para una SBC RISCV64. Como resultado, ya tenía todas las cachés de
compilación para construir ese sistema localmente. Sin embargo, debido a la falta de
cachés binarias oficiales para la arquitectura RISCV64, ejecutar cualquier programa no
instalado directamente en la placa de desarrollo (por ejemplo,
`nix run nixpkgs#cowsay hello`) disparaba compilaciones extensas. Ese proceso consumía
horas, lo cual era totalmente inaceptable.

Al adoptar el despliegue remoto, pude aprovechar por completo la potencia de mi CPU local
de alto rendimiento y las amplias cachés de compilación. Este cambio mejoró mucho mi
experiencia y mitigó en gran medida el problema de compilación que antes consumía tanto
tiempo.

Déjame guiarte brevemente en el uso de `colmena` o `nixos-rebuild` para despliegue remoto.

## Requisitos previous

Antes de empezar con el despliegue remoto, son necesarios algunos pasos preparatorios:

1. Para evitar fallos de verificación de contraseña de sudo en el host remoto, elige uno
   de los siguientes métodos:
   1. Despliega como el usuario `root` del host remoto.
   2. Añade `security.sudo.wheelNeedsPassword = false;` a la configuración del host remoto
      y despliega manualmente una vez con antelación para otorgar al usuario permisos de
      sudo sin contraseña.
      1. **Esto permitirá que programas a nivel de usuario obtengan permisos de sudo en
         silencio, lo cual supone un riesgo de seguridad**. Por tanto, si eliges este
         método, es aconsejable crear un usuario dedicado para el despliegue remoto en
         lugar de usar tu usuario habitual.
2. Configura autenticación SSH por clave pública para los hosts remotos.
   1. Usa la opción `users.users.<name>.openssh.authorizedKeys.keys` para completar esta
      tarea.
3. Añade el registro de Known Hosts del host remoto a tu máquina local. De lo contrario,
   `colmena`/`nixos-rebuild` fallará al desplegar por no poder verificar la identidad del
   host remoto.
   1. Usa la opción `programs.ssh.knownHosts` para añadir la clave pública del host remoto
      al registro Known Hosts.
4. Usa manualmente el comando `ssh root@<tu-host>` para verificar que puedes iniciar
   sesión en el host remoto.
   1. Si encuentras algún problema, resuélvelo antes de continuar.

Es recomendable usar el usuario `root` para el despliegue, porque es más cómodo y evita la
complejidad de los permisos de sudo.

Suponiendo que queremos desplegar remotamente usando el usuario root, el primer paso
consiste en configurar autenticación SSH por clave pública para root en el host remoto.
Para lograrlo, solo añade el siguiente contenido a cualquier módulo de NixOS en la
configuración Nix del host remoto (por ejemplo, `configuration.nix`) y luego reconstruye
el sistema:

```nix{6-9}
# configuration.nix
{

  # ...

  users.users.root.openssh.authorizedKeys.keys = [
    # TODO Reemplaza esto con tu propia clave pública SSH.
    "ssh-ed25519 AAAAC3Nxxxxx ryan@xxx"
  ];

  # ...
}
```

Además, necesitarás añadir la clave privada SSH al agente SSH en tu máquina local para la
autenticación durante el despliegue remoto:

```bash
ssh-add ~/.ssh/your-private-key
```

## Despliegue mediante `colmena`

`colmena` no usa directamente el familiar `nixosConfigurations.xxx` para el despliegue
remoto. En su lugar, personaliza los outputs del flake llamado `colmena`. Aunque su
estructura es similar a `nixosConfigurations.xxx`, no es idéntica.

En el `flake.nix` de tu sistema, añade un nuevo output llamado `colmena`. Un ejemplo
simple se muestra a continuación:

```nix{11-34}
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";

    # ...
  };
  outputs = { self, nixpkgs }: {
    # ...

    # Agrega este output; colmena leerá su contenido para el despliegue remoto
    colmena = {
      meta = {
        nixpkgs = import nixpkgs { system = "x86_64-linux"; };

        # Este parámetro funciona de forma similar a `specialArgs` en `nixosConfigurations.xxx`,
        # y se usa para pasar argumentos personalizados a todos los submódulos.
        specialArgs = {
          inherit nixpkgs;
        };
      };

      # Nombre del host = "my-nixos"
      "my-nixos" = { name, nodes, ... }: {
        # Parámetros relacionados con el despliegue remoto
        deployment.targetHost = "192.168.5.42"; # IP del host remoto
        deployment.targetUser = "root";  # usuario del host remoto

        # Este parámetro funciona de forma similar a `modules` en `nixosConfigurations.xxx`,
        # y se usa para importar todos los submódulos.
        imports = [
          ./configuration.nix
        ];
      };
    };
  };
}
```

Ahora puedes desplegar tu configuración en el dispositivo:

```bash
nix run nixpkgs#colmena apply
```

Para un uso más avanzado, consulta la documentación oficial de colmena en
<https://colmena.cli.rs/unstable/introduction.html>

## Despliegue mediante `nixos-rebuild`

Usar `nixos-rebuild` para el despliegue remoto tiene la ventaja de parecerse mucho al
despliegue en un host local. Solo requiere algunos parámetros adicionales para indicar la
IP del host remoto, el nombre de usuario y otros detalles.

Por ejemplo, para desplegar la configuración definida en `nixosConfigurations.my-nixos` de
tu flake en un host remoto, usa el siguiente comando:

```bash
nixos-rebuild switch --flake .#my-nixos \
  --target-host root@192.168.4.1 --build-host localhost --verbose
```

El comando anterior construirá y desplegará la configuración de `my-nixos` en un servidor
con IP `192.168.4.1`. El proceso de construcción del sistema ocurrirá localmente.

Si prefieres construir la configuración en el host remoto, reemplaza
`--build-host localhost` por `--build-host root@192.168.4.1`.

Para no usar IPs repetidamente, puedes definir alias de host en `~/.ssh/config` o en
`/etc/ssh/ssh_config` de tu máquina local. Por ejemplo:

> Es posible generar toda la configuración SSH mediante Nix, y esa tarea queda para ti.

```bash
› cat ~/.ssh/config

# ......

Host aquamarine
  HostName 192.168.4.1
  Port 22

# ......
```

Con esta configuración, puedes usar alias de host para el despliegue:

```bash
nixos-rebuild switch --flake .#my-nixos --target-host root@aquamarine --build-host root@aquamarine --verbose
```

Esto ofrece una forma más cómoda de desplegar usando los alias de host definidos.
