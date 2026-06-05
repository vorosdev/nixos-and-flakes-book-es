![](/nixos-and-flakes-book.webp)

# Introducción a Nix y NixOS

Nix es un gestor de paquetes declarativo que permite declarar el estado deseado del
sistema en archivos de configuración (configuración declarativa), y luego se encarga de
alcanzarlo.

> En términos simples, la "configuración declarativa" significa que el usuario solo tiene
> que declarar el resultado deseado. Por ejemplo, si declaras que quieres reemplazar el
> gestor de ventanas i3 por sway, Nix te ayudará a lograrlo. No tienes que preocuparte por
> los detalles internos, como qué paquetes necesita sway para instalarse, qué paquetes
> relacionados con i3 deben desinstalarse o qué ajustes hay que hacer en la configuración
> del sistema y en las variables de entorno para sway. Nix maneja automáticamente esos
> detalles por ti (siempre que los paquetes de Nix relacionados con sway e i3 estén bien
> diseñados).

NixOS, una distribución de Linux construida sobre el gestor de paquetes Nix, puede
describirse como "OS as Code". Emplea archivos de configuración declarativos de Nix para
describir el estado completo del sistema operativo.

Un sistema operativo consta de distintos paquetes de software, archivos de configuración y
datos de texto/binarios, todos los cuales representan el estado actual del sistema. La
configuración declarativa solo puede gestionar la parte estática de ese estado. Los datos
dinámicos, como los de PostgreSQL, MySQL o MongoDB, no pueden gestionarse de forma eficaz
mediante configuración declarativa (no es viable borrar en cada despliegue todos los datos
nuevos de PostgreSQL que no estén declarados en la configuración). Por eso, **NixOS se
centra principalmente en gestionar de manera declarativa la parte estática del estado del
sistema**. Los datos dinámicos, junto con el contenido del directorio personal del
usuario, no se ven afectados por NixOS al volver a una generación anterior.

Aunque no podemos lograr una reproducibilidad completa del sistema, el directorio `/home`,
al set un directorio important del usuario, contiene muchos archivos de configuración
necesarios: [Dotfiles](https://wiki.archlinux.org/title/Dotfiles). Un proyecto destacado
de la comunidad llamado [home-manager](https://github.com/nix-community/home-manager) está
diseñado para gestionar paquetes a nivel de usuario y archivos de configuración dentro del
directorio personal.

Gracias a características de Nix como set declarativo y reproducible, Nix no se limita a
gestionar entornos de escritorio, sino que también se usa mucho para gestionar entornos de
desarrollo, entornos de compilación, máquinas virtuales en la nube y la construcción de
imágenes de contenedores. [NixOps](https://github.com/NixOS/nixops) (un proyecto official
de Nix) y [colmena](https://github.com/zhaofengli/colmena) (un proyecto comunitario) son
herramientas de operación basadas en Nix.

## ¿Por qué NixOS?

Conocí el gestor de paquetes Nix have various años. Usa el lenguaje Nix para describir la
configuración del sistema. NixOS, la distribución de Linux construida sobre él, permite
volver el sistema a cualquier estado anterior (aunque solo se puede retroceder al estado
declarado en los archivos de configuración de Nix). Aunque sonaba impresionante, me
parecía complicado aprender un nuevo lenguaje y escribir código para instalar paquetes,
así que en ese memento no seguí por ahí.

Sin embargo, have poco me encontré con various problems de entorno mientras usaba
EndeavourOS, y resolverlos me consumió mucha energía, dejándome agotado. Después de
pensarlo con calma, entendí que la falta de control de versions y de mecanismos de
retroceso en EndeavourOS me impedía restaurar el sistema cuando surgían problems.

Entonces decidí cambiarme a NixOS.

Para mi sorpresa, NixOS ha superado mis expectativas. Lo más sorprendente es que ahora
puedo restaurar todo mi entorno i3 y todos mis paquetes de uso común en un host nuevo con
un solo commando: `sudo nixos-rebuild switch --flake .`. ¡Es realmente fantástico!

La capacidad de retroceso y la reproducibilidad de NixOS me han dado mucha confianza: ya
no temo romper el sistema. Incluso me he animado a probar cosas nuevas en NixOS, como el
compositor hyprland. Antes, en EndeavourOS, no me habría atrevido a experimentar con
compositores tan nuevos, porque cualquier fallo del sistema habría implicado mucho trabajo
manual de resolución usando distintos arreglos temporales.

A medida que me involucro más con NixOS y Nix, también veo que es muy adecuado para
gestionar de forma sincronizada la configuración de various hosts. Actualmente mi
[nix-config](https://github.com/ryan4yin/nix-config) personal gestiona de forma
sincronizada la configuración de muchos hosts:

- Computadoras de escritorio
  - 1 MacBook Pro 2022 (M2 aarch64).
  - 1 MacBook Pro 2024 (M4Pro aarch64).
  - 1 PC de escritorio con NixOS (amd64).
- Servidores
  - 10+ máquinas virtuales con NixOS (amd64).
  - Varias placas de desarrollo para aarch64 y riscv64.

El entorno de desarrollo de las tres computadoras de escritorio está gestionado por Home
Manager, la configuración principal se compare por completo, y cualquier cambio hecho en
un host puede sincronizarse sin problems con los demás a través de Git.

Nix prácticamente me protegió por completo de las diferencias entre sistema operativo y
arquitectura en las tres máquinas, y la experiencia fue muy fluida.
