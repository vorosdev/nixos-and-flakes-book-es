![](/nixos-and-flakes-book.webp)

# Introducción a Nix y NixOS

Nix es un gestor de paquetes declarativo que permite a los usuarios declarar el estado
deseado del sistema en archivos de configuración (configuración declarativa), y se encarga
de alcanzar ese estado.

> En términos simples, la “configuración declarativa” significa que los usuarios solo
> necesitan declarar el resultado deseado. Por ejemplo, si declaras que quieres reemplazar
> el gestor de ventanas i3 por sway, Nix te ayudará a lograr ese objetivo. No tienes que
> preocuparte por los detalles subyacentes, como qué paquetes requiere sway para
> instalarse, qué paquetes relacionados con i3 deben desinstalarse o los ajustes
> necesarios en la configuración del sistema y las variables de entorno para sway. Nix
> maneja automáticamente estos detalles por ti (siempre y cuando los paquetes de Nix
> relacionados con sway e i3 estén correctamente diseñados).

NixOS, una distribución de Linux construida sobre el gestor de paquetes Nix, puede
describirse como un “sistema operativo como código”. Emplea archivos de configuración
declarativos de Nix para describir el estado completo del sistema operativo.

Un sistema operativo está compuesto por diversos paquetes de software, archivos de
configuración y datos en texto/binarios, todos los cuales representan el estado actual del
sistema. La configuración declarativa solo puede gestionar la parte estática de este
estado. Los datos dinámicos, como los de PostgreSQL, MySQL o MongoDB, no pueden
administrarse de manera efectiva mediante configuración declarativa (no es factible
eliminar todos los nuevos datos de PostgreSQL que no estén declarados en la configuración
en cada despliegue). Por lo tanto, **NixOS se centra principalmente en gestionar de manera
declarativa la parte estática del estado del sistema**. Los datos dinámicos, junto con los
contenidos en el directorio personal del usuario, permanecen intactos cuando se realiza un
rollback a una generación anterior.

Aunque no podemos lograr una reproducibilidad completa del sistema, el directorio `/home`,
al ser un directorio importante del usuario, contiene muchos archivos de configuración
necesarios - [Dotfiles](https://wiki.archlinux.org/title/Dotfiles). Un proyecto
comunitario destacado llamado
[home-manager](https://github.com/nix-community/home-manager) está diseñado para gestionar
los paquetes a nivel de usuario y los archivos de configuración dentro del directorio
personal.

Gracias a las características de Nix, como ser declarativo y reproducible, Nix no se
limita a gestionar entornos de escritorio, sino que también se usa ampliamente para
administrar entornos de desarrollo, entornos de compilación, máquinas virtuales en la nube
y construcción de imágenes de contenedores. [NixOps](https://github.com/NixOS/nixops) (un
proyecto oficial de Nix) y [colmena](https://github.com/zhaofengli/colmena) (un proyecto
comunitario) son herramientas de operación basadas en Nix.

## ¿Por qué NixOS?

Conocí el gestor de paquetes Nix hace varios años. Utiliza el lenguaje Nix para describir
la configuración del sistema. NixOS, la distribución de Linux construida sobre él, permite
retroceder el sistema a cualquier estado previo (aunque solo se puede revertir el estado
declarado en los archivos de configuración de Nix). Aunque sonaba impresionante, me
resultaba problemático aprender un nuevo lenguaje y escribir código para instalar
paquetes, así que en ese momento no lo intenté.

Sin embargo, recientemente me encontré con numerosos problemas de entorno mientras usaba
EndeavourOS, y resolverlos me consumió una cantidad considerable de energía, dejándome
exhausto. Tras pensarlo detenidamente, me di cuenta de que la falta de control de
versiones y mecanismos de retroceso en EndeavourOS me impedía restaurar el sistema cuando
surgían problemas.

Fue entonces cuando decidí cambiarme a NixOS.

Para mi sorpresa, NixOS ha superado mis expectativas. Lo más asombroso es que ahora puedo
restaurar todo mi entorno i3 y todos mis paquetes de uso común en un nuevo host con NixOS
con un solo comando: `sudo nixos-rebuild switch --flake .`. ¡Es realmente fantástico!

La capacidad de retroceso y la reproducibilidad de NixOS me han dado mucha confianza: ya
no temo romper el sistema. Incluso me he atrevido a experimentar con cosas nuevas en
NixOS, como el compositor hyprland. Antes, en EndeavourOS, no me habría animado a probar
con compositores tan novedosos, ya que cualquier fallo del sistema habría implicado una
gran cantidad de resolución manual de problemas usando distintos trucos y soluciones
temporales.

A medida que me involucro cada vez más con NixOS y Nix, descubro que también es muy
adecuado para gestionar de forma sincronizada la configuración de múltiples hosts.
Actualmente, mi [nix-config](https://github.com/ryan4yin/nix-config) gestiona de manera
sincronizada la configuración de muchos hosts:

- Computadoras de escritorio
  - 1 MacBook Pro 2022 (M2 aarch64).
  - 1 MacBook Pro 2024 (M4Pro aarch64).
  - 1 PC de escritorio con NixOS (amd64).

- Servidores
  - 10+ máquinas virtuales con NixOS (amd64).
  - Varias placas de desarrollo para aarch64 y riscv64.

El entorno de desarrollo de las tres computadoras de escritorio está gestionado por Home
Manager, la configuración principal se comparte completamente, y cualquier modificación
realizada en un host puede sincronizarse sin problemas con los demás a través de Git.

Nix prácticamente me protegió por completo de las diferencias entre sistema operativo y
arquitectura en estas tres máquinas, ¡y la experiencia fue muy fluida!
