# Construcción distribuida

La construcción distribuida puede acelerar significativamente el proceso de construcción
al utilizar varias máquinas. Sin embargo, para usuarios comunes de NixOS, puede no ser muy
útil, ya que `cache.nixos.org` proporciona la gran mayoría de las cachés para la
arquitectura `x86_64`.

La construcción distribuida es especialmente valiosa en escenarios donde no hay caché
disponible, como:

1. Usuarios de arquitecturas `RISC-V` o `ARM64`, especialmente `RISC-V`, ya que hay muy
   pocas cachés para estas arquitecturas en el repositorio oficial. A menudo se requiere
   compilación local.
2. Usuarios que personalizan intensamente sus sistemas. Los paquetes del repositorio de
   caché oficial se construyen con configuraciones predeterminadas. Si modificas los
   parámetros de construcción, el caché oficial ya no aplica y es necesaria la compilación
   local. Por ejemplo, en escenarios embebidos, a menudo se requiere personalizar el
   kernel subyacente, los controladores, etc., lo que lleva a necesitar compilación local.

## Configurar la construcción distribuida

Actualmente no existe documentación oficial para la construcción distribuida. Sin embargo,
abajo proporciono una configuración de ejemplo para construcción distribuida (un módulo de
NixOS), junto con algunos documentos de referencia recomendados al final de esta sección.

```nix
{ ... }: {

  ####################################################################
  #
  #  Configuración de NixOS para construcción remota / construcción distribuida
  #
  ####################################################################

  # Establecer max-jobs local en 0 para forzar la construcción remota (deshabilitar la local).
  # nix.settings.max-jobs = 0;
  nix.distributedBuilds = true;
  nix.buildMachines =
    let
      sshUser = "ryan";
      # Ruta a la clave SSH en la máquina local.
      sshKey = "/home/ryan/.ssh/ai-idols";
      systems = [
        # Arquitectura nativa.
        "x86_64-linux"

        # Arquitectura emulada usando binfmt_misc y qemu-user.
        "aarch64-linux"
        "riscv64-linux"
      ];
      # Todas las características del sistema disponibles están mal documentadas aquí:
      # https://github.com/NixOS/nix/blob/e503ead/src/libstore/globals.hh#L673-L687
      supportedFeatures = [
        "benchmark"
        "big-parallel"
        "kvm"
      ];
    in
      [
        # Nix parece priorizar siempre la construcción remota.
        # Para aprovechar la CPU de alto rendimiento de la máquina local, no pongas demasiado alto el maxJobs del builder remoto.
        {
          # Algunos de mis builders remotos ejecutan NixOS
          # y tienen el mismo sshUser, sshKey, systems, etc.
          inherit sshUser sshKey systems supportedFeatures;

          # El hostName debe ser:
          #   1. Un hostname que pueda resolves por DNS.
          #   2. La dirección IP del builder remoto.
          #   3. Un alias de host definido globalmente en /etc/ssh/ssh_config.
          hostName = "aquamarine";
          # max-jobs del builder remoto.
          maxJobs = 3;
          # SpeedFactor es un entero con signo,
          # pero parece que Nix no lo usa y no tiene efecto.
          speedFactor = 1;
        }
        {
          inherit sshUser sshKey systems supportedFeatures;
          hostName = "ruby";
          maxJobs = 2;
          speedFactor = 1;
        }
        {
          inherit sshUser sshKey systems supportedFeatures;
          hostName = "kana";
          maxJobs = 2;
          speedFactor = 1;
        }
      ];
  # Opcional: útil cuando el builder tiene una conexión a Internet más rápida que la tuya.
	nix.extraOptions = ''
		builders-use-substitutes = true
	'';

  # Definir los alias de host para los builders remotos.
  # Esta configuración se escribirá en /etc/ssh/ssh_config.
  programs.ssh.extraConfig = ''
    Host ai
      HostName 192.168.5.100
      Port 22

    Host aquamarine
      HostName 192.168.5.101
      Port 22

    Host ruby
      HostName 192.168.5.102
      Port 22

    Host kana
      HostName 192.168.5.103
      Port 22
  '';

  # Definir las claves de host para los builders remotos para que Nix pueda verificarlos a todos.
  # Esta configuración se escribirá en /etc/ssh/ssh_known_hosts.
  programs.ssh.knownHosts = {
    # 星野 愛久愛海, Hoshino Aquamarine
    aquamarine = {
      hostNames = [ "aquamarine" "192.168.5.101" ];
      publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDnCQXlllHoLX5EvU+t6yP/npsmuxKt0skHVeJashizE";
    };

    # 星野 瑠美衣, Hoshino Rubii
    ruby = {
      hostNames = [ "ruby" "192.168.5.102" ];
      publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE7n11XxB8B3HjdyAsL3PuLVDZxWCzEOUTJAY8+goQmW";
    };

    # 有馬 かな, Arima Kana
    kana = {
      hostNames = [ "kana" "192.168.5.103" ];
      publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ3dDLOZERP1nZfRz3zIeVDm1q2Trer+fWFVvVXrgXM1";
    };
  };
}
```

## Limitaciones

Estas son algunas limitaciones y problemas observados:

1. No puedes especificar qué hosts usar en tiempo de construcción. Solo puedes indicar una
   lista de hosts en el archivo de configuración, y Nix selecciona automáticamente los
   hosts disponibles.
2. Al elegir un host, Nix siempre prefiere el host remoto sobre el local, incluso si el
   local tiene mejor rendimiento. Esto puede provocar subutilización de la CPU del host
   local.
3. La unidad mínima de construcción distribuida es una derivación. Al construir paquetes
   grandes, otras máquinas pueden permanecer inactivas durante mucho tiempo esperando a
   que se construya el paquete grande. Esto puede provocar desperdicio de recursos.

## Referencias

- [Distributed build - NixOS Wiki](https://wiki.nixos.org/wiki/Distributed_build)
- [Document available system features - nix#7380](https://github.com/NixOS/nix/issues/7380)
- [Distributed builds seem to disable local builds - nix#2589](https://github.com/NixOS/nix/issues/2589)
- [Offloading NixOS builds to a faster machine](https://sgt.hootr.club/molten-matter/nix-distributed-builds/)
- [tests/nixos/remote-builds.nix - Nix Source Code](https://github.com/NixOS/nix/blob/713836112/tests/nixos/remote-builds.nix#L46)
