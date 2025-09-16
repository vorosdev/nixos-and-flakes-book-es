# Ventajas y desventajas de NixOS

## Ventajas de NixOS

- **Configuración declarativa, sistema operativo como código**
  - NixOS utiliza configuración declarativa para gestionar todo el entorno del sistema.
    Estas configuraciones pueden administrarse directamente con Git, lo que permite
    restaurar el sistema a cualquier estado histórico siempre que se conserven los
    archivos de configuración (y que los estados deseados estén declarados en la
    configuración de Nix).
  - Nix Flakes mejora aún más la reproducibilidad al utilizar un archivo de bloqueo de
    versiones `flake.lock`, que registra las direcciones de origen de los datos, valores
    hash y otra información relevante de todas las dependencias. Este diseño incrementa
    enormemente la reproducibilidad de Nix y garantiza resultados de compilación
    consistentes. Se inspira en los diseños de gestión de paquetes de lenguajes de
    programación como Cargo y npm.
- **Alta capacidad de personalización del sistema**
  - Con solo unos pocos cambios de configuración, varios componentes del sistema pueden
    reemplazarse fácilmente. Nix encapsula todas las operaciones subyacentes complejas
    dentro de los paquetes de Nix, ofreciendo a los usuarios un conjunto conciso de
    parámetros declarativos.
  - Las modificaciones son seguras y cambiar entre distintos entornos de escritorio (como
    GNOME, KDE, i3 y sway) es sencillo, con pocos inconvenientes.
- **Capacidad de retroceso**
  - Es posible volver a cualquier estado anterior del sistema, e incluso NixOS incluye por
    defecto todas las versiones antiguas en las opciones de arranque, lo que garantiza la
    capacidad de revertir cambios fácilmente. En consecuencia, Nix es considerado uno de
    los enfoques de gestión de paquetes más estables.
- **Sin problemas de conflicto de dependencias**
  - Cada paquete de software en Nix tiene un hash único, el cual se incorpora en su ruta
    de instalación, lo que permite que múltiples versiones coexistan.
- **Comunidad activa, con una amplia gama de proyectos de terceros**
  - El repositorio oficial de paquetes, nixpkgs, cuenta con numerosos colaboradores, y
    muchas personas comparten sus configuraciones de Nix. Explorar el ecosistema de NixOS
    es una experiencia emocionante, similar a descubrir un nuevo continente.

<figure>
  <img src="/nixos-bootloader.avif">
  <figcaption>
    <h4 align="center">
      Todas las versiones históricas se listan en las opciones de arranque de NixOS. <br>
      Imagen de
      <a href="https://discourse.nixos.org/t/how-to-make-uefis-grub2-menu-the-same-as-bioss-one/10074" target="_blank" rel="noopener noreferrer">
        NixOS Discourse - 10074
      </a>
    </h4>
  </figcaption>
</figure>

## Desventajas de NixOS

- **Curva de aprendizaje elevada**:
  - Alcanzar una reproducibilidad completa y evitar los problemas asociados con un uso
    inadecuado requiere aprender todo el diseño de Nix y gestionar el sistema de manera
    declarativa, en lugar de usar ciegamente comandos como `nix-env -i` (similar a
    `apt-get install`).
- **Documentación desorganizada**:
  - Actualmente, Nix Flakes sigue siendo una característica experimental, y existe
    documentación limitada enfocada específicamente en ella. La mayor parte de la
    documentación de la comunidad Nix cubre principalmente el clásico
    `/etc/nixos/configuration.nix`. Si deseas empezar a aprender directamente con Nix
    Flakes (`flake.nix`), necesitas consultar una gran cantidad de documentación
    desactualizada y extraer la información relevante. Además, algunas funciones clave de
    Nix, como `imports` y el _Nixpkgs Module System_, carecen de documentación oficial
    detallada, lo que obliga a recurrir al análisis del código fuente.
- **Mayor uso de espacio en disco**:
  - Para garantizar la capacidad de retroceder el sistema en cualquier momento, Nix
    conserva por defecto todos los entornos históricos, lo que resulta en un mayor consumo
    de espacio en disco.
  - Aunque este uso adicional de espacio puede no ser un problema en computadoras de
    escritorio, sí puede volverse problemático en servidores en la nube con recursos
    limitados.
- **Mensajes de error poco claros**:
  - Debido al
    [complejo algoritmo de fusión](https://discourse.nixos.org/t/best-resources-for-learning-about-the-nixos-module-system/1177/4)
    del [sistema de módulos de Nixpkgs](../other-usage-of-flakes/module-system.md), los
    mensajes de error en NixOS son bastante pobres. En muchos casos, incluso si agregas
    `--show-trace`, solo te indicará que hay un error en el código (el mensaje más común y
    confuso es
    [Infinite recursion encountered](https://discourse.nixos.org/t/infinite-recursion-encountered-by-making-module-configurable/23508/2)),
    pero ¿dónde exactamente está el error? El sistema de tipos dice que no lo sabe, así
    que tienes que encontrarlo tú mismo. En mi experiencia, **la forma más simple y
    efectiva de lidiar con estos mensajes de error sin sentido es usar una “búsqueda
    binaria” para ir restaurando gradualmente el código**.
  - Este problema es probablemente el mayor dolor de cabeza de NixOS en la actualidad.
- **Implementación subyacente más compleja**:
  - La abstracción declarativa de Nix introduce una complejidad adicional en el código
    subyacente en comparación con un código similar en herramientas imperativas
    tradicionales.
  - Esta complejidad incrementa la dificultad de implementación y hace más complicado
    realizar modificaciones personalizadas a bajo nivel. Sin embargo, esta carga recae
    principalmente en los mantenedores de paquetes de Nix, ya que los usuarios comunes
    tienen un contacto limitado con dichas complejidades, lo que reduce su carga.

## Resumen

En general, considero que NixOS es adecuado para desarrolladores con cierto nivel de
experiencia en el uso de Linux y conocimientos de programación que deseen tener un mayor
control sobre sus sistemas.

No recomiendo a los recién llegados sin experiencia previa en Linux que se sumerjan
directamente en NixOS, ya que podría llevarlos a una experiencia frustrante.

> Si tienes más preguntas sobre NixOS, puedes consultar el último capítulo de este libro,
> [FAQ](../faq/).
