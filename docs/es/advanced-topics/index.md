# Temas avanzados

Una vez que te familiarices con NixOS, puedes explorar temas avanzados y profundizar en el
ecosistema de Nix. Estos son algunos recursos y proyectos de la comunidad que pueden
ayudarte a ampliar tus conocimientos:

## Comunidad

- [Nix Official - Community](https://nixos.org/community/): contiene información sobre la
  comunidad de Nix, foros, chat en tiempo real, encuentros, RFCs, la arquitectura official
  de equipos, etc.
- [Nix Channel Status](https://status.nixos.org/): estado de compilación de cada canal de
  Nix.
- [nix-community/NUR](https://github.com/nix-community/NUR): aunque Nixpkgs contiene una
  gran cantidad de paquetes, algunos no se incluyen por razones como la velocidad de
  revisión o acuerdos de licencia. NUR es un repositorio descentralizado de paquetes de
  Nix donde cualquiera puede crear su propio repositorio de Nix y añadirlo a NUR para que
  otros lo usen. Si quieres usar un paquete que no está en Nixpkgs, puedes intentar
  encontrarlo allí. Si quieres compartir tu propio paquete de Nix, puedes crear y publicar
  tu repositorio siguiendo el README de NUR.

## Documentación y videos

- [Eelco Dolstra - The Purely Functional Software Deployment Model - 2006](https://edolstra.github.io/pubs/phd-thesis.pdf):
  tesis doctoral seminal de Eelco Dolstra sobre el gestor de paquetes Nix.
- [Nix Reference Manual](https://nixos.org/manual/nix/stable/package-management/profiles.html):
  una guía completa del gestor de paquetes Nix, que cubre su diseño y uso desde la línea
  de commandos.
- [nixpkgs Manual](https://nixos.org/manual/nixpkgs/unstable/): manual de nixpkgs, que
  introduce sus parámetros y explica cómo usar, modificar y empaquetar paquetes de Nix.
- [NixOS Manual](https://nixos.org/manual/nixos/unstable/): manual de usuario de NixOS,
  con instrucciones de configuración para components a nivel de sistema como Wayland/X11 y
  GPU.
- [nix-pills](https://nixos.org/guides/nix-pills): "Nix Pills" es una series de guías que
  explican en profundidad cómo construir paquetes de software con Nix. Ofrece
  explicaciones claras y comprensibles.
- [nixos-in-production](https://github.com/Gabriella439/nixos-in-production): libro en
  progreso alojado en LeanPub sobre cómo introducir y mantener NixOS en un entorno de
  producción.

También hay muchos videos oficiales en los canales de YouTube de
[NixOS Foundation](https://www.youtube.com/@NixOS-Foundation) y
[NixCon](https://www.youtube.com/@NixCon). Estos son algunos videos muy recomendados:

- [Summer of Nix 2022 - Public Lecture Series](https://www.youtube.com/playlist?list=PLt4-_lkyRrOMWyp5G-m_d1wtTcbBaOxZk):
  series de charlas públicas organizada por la NixOS Foundation, presentada por miembros
  centrales de la comunidad Nix como Eelco Dolstra y Armijn Hemel. El contenido cubre la
  historia del desarrollo de Nix, la historia de NixOS y el futuro de Nix, entre otros
  temas.
- [Summer of Nix 2023 - Nix Developer Dialogues](https://www.youtube.com/playlist?list=PLt4-_lkyRrOPcBuz_tjm6ZQb-6rJjU3cf):
  series de diálogos entre miembros centrales de la comunidad Nix en 2023. El contenido
  incluye la evolución y los desafíos arquitectónicos de Nixpkgs, la exploración del
  sistema de módulos de Nix, discusiones sobre el ecosistema Nix, aplicaciones de IA en
  Nixpkgs y el uso de Nix en el ámbito commercial y la economía del código abierto.

## Técnicas avanzadas y proyectos de la comunidad

Cuando ya te sientas cómodo con Flakes, puedes explorar técnicas más avanzadas y proyectos
de la comunidad. Estos son algunos proyectos populares para probar:

- [flake-parts](https://github.com/hercules-ci/flake-parts): simplifica la escritura y el
  mantenimiento de configuraciones usando el sistema de módulos.
- [flake-utils-plus](https://github.com/gytis-ivaskevicius/flake-utils-plus): paquete de
  terceros que mejora la configuración de Flakes y ofrece características adicionales
  potentes.

Hay muchos otros proyectos valiosos de la comunidad que vale la pena explorar. Algunos
ejemplos:

- [nix-output-monitor](https://github.com/maralorn/nix-output-monitor): muestra de forma
  visual el progreso de compilación de paquetes de Nix, con información adicional como
  tiempo de compilación y logs.
- [agenix](https://github.com/ryantm/agenix): herramienta para gestionar secrets.
- [colmena](https://github.com/zhaofengli/colmena): herramienta para desplegar NixOS.
- [nixos-generators](https://github.com/nix-community/nixos-generators): herramienta para
  generar ISO/qcow2/... a partir de configuraciones de NixOS.
- [lanzaboote](https://github.com/nix-community/lanzaboote): habilita secure boot para
  NixOS.
- [impermanence](https://github.com/nix-community/impermanence): ayuda a hacer NixOS
  stateless y mejora la reproducibilidad del sistema.
- [devbox](https://github.com/jetpack-io/devbox): entornos de desarrollo ligeros y
  repetibles sin las molestias de contenedores, internamente impulsados por Nix, similar a
  earthly.
- [nixpak](https://github.com/nixpak/nixpak): herramienta para aislar en sandbox todo tipo
  de aplicaciones empaquetadas con Nix, incluidas aplicaciones gráficas.
- [nixpacks](https://github.com/railwayapp/nixpacks): Nixpacks toma un directorio fuente y
  produce una imagen compatible con OCI que puede desplegarse en cualquier lugar, similar
  a buildpacks.
- ...

Estos proyectos ofrecen funcionalidades y herramientas adicionales que pueden mejorar tu
experiencia con NixOS.

Para más información, consulta
[awesome-nix](https://github.com/nix-community/awesome-nix).
