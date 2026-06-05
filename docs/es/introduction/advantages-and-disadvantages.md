# Ventajas y desventajas de NixOS

## Ventajas de NixOS

- **Configuración declarativa, OS as Code**
  - NixOS usa configuración declarativa para gestionar todo el entorno del sistema. Estas
    configuraciones pueden administrarse directamente con Git, lo que permite restaurar el
    sistema a cualquier estado histórico mientras se conserven los archivos de
    configuración (siempre que los estados deseados estén declarados en la configuración
    de Nix).
  - Nix Flakes mejora aún más la reproducibilidad al usar un archivo de bloqueo de
    versiones `flake.lock`, que registra las direcciones de origen de datos, valores de
    hash y otra información relevante de todas las dependencias. Este diseño mejora mucho
    la reproducibilidad de Nix y garantiza resultados de compilación consistentes. Toma
    inspiración de diseños de gestión de paquetes en lenguajes como Cargo y npm.
- **Gran capacidad para personalizar el sistema**
  - Con solo unos pocos cambios de configuración, varios componentes del sistema pueden
    reemplazarse con facilidad. Nix encapsula todas las operaciones complejas internas en
    los paquetes de Nix, ofreciendo al usuario un conjunto breve de parámetros
    declarativos.
  - Los cambios son seguros y cambiar entre distintos entornos de escritorio, como GNOME,
    KDE, i3 y sway, es sencillo y con pocas trampas.
- **Capacidad de retroceso**
  - Es posible volver a cualquier estado anterior del sistema, y NixOS incluso incluye por
    defecto todas las versiones antiguas en las opciones de arranque, lo que facilita
    revertir cambios. Por eso, Nix se considera uno de los enfoques de gestión de paquetes
    más estables.
- **Sin conflictos de dependencias**
  - Cada paquete de software en Nix tiene un hash único que se incorpora a su ruta de
    instalación, lo que permite que varias versiones coexistan.
- **La comunidad es activa, con una amplia variedad de proyectos de terceros**
  - El repositorio oficial de paquetes, nixpkgs, tiene muchos colaboradores, y mucha gente
    compare sus configuraciones de Nix. Explorar el ecosistema de NixOS es una experiencia
    emocionante, casi como descubrir un nuevo continente.

<figure>
  <img src="/nixos-bootloader.avif">
  <figcaption>
    <h4 align="center">
      Todas las versiones históricas aparecen en las opciones de arranque de NixOS. <br>
      Imagen de
      <a href="https://discourse.nixos.org/t/how-to-make-uefis-grub2-menu-the-same-as-bioss-one/10074" target="_blank" rel="noopener noreferrer">
        NixOS Discourse - 10074
      </a>
    </h4>
  </figcaption>
</figure>

## Desventajas de NixOS

- **Curva de aprendizaje alta**:
  - Alcanzar una reproducibilidad completa y evitar problemas por un uso incorrecto exige
    aprender todo el diseño de Nix y gestionar el sistema de forma declarativa, en lugar
    de usar a ciegas comandos como `nix-env -i` (similar a `apt-get install`).
- **Documentación desordenada**:
  - Actualmente, Nix Flakes sigue siendo una función experimental, y hay poca
    documentación centrada en ella. La mayor parte de la documentación de la comunidad de
    Nix cubre sobre todo la clásica `/etc/nixos/configuration.nix`. Si quieres empezar a
    aprender directamente desde Nix Flakes (`flake.nix`), necesitas revisar mucha
    documentación desactualizada y extraer la información relevante. Además, algunas
    funciones centrales de Nix, como `imports` y el Nixpkgs Module System, carecen de una
    documentación oficial detallada, por lo que toca recurrir al análisis del código
    fuente.
- **Mayor uso de espacio en disco**:
  - Para asegurar la posibilidad de volver al sistema en cualquier memento, Nix conserva
    todos los entornos históricos por defecto, lo que incrementa el uso de espacio en
    disco.
  - Aunque ese espacio extra quizá no sea un problema en computadoras de escritorio, puede
    volverse incómodo en servidores en la nube con recursos limitados.
- **Mensajes de error poco claros**:
  - Debido al
    [algoritmo de combinación complejo](https://discourse.nixos.org/t/best-resources-for-learning-about-the-nixos-module-system/1177/4)
    del [sistema de módulos de Nixpkgs](../other-usage-of-flakes/module-system.md), los
    mensajes de error de NixOS son bastante pobres. En muchos casos, aunque agregues
    `--show-trace`, solo te dirán que hay un error en el código (el mensaje más común y
    confuso es
    [Infinite recursion encountered](https://discourse.nixos.org/t/infinite-recursion-encountered-by-making-module-configurable/23508/2)),
    pero no dónde está exactamente el error. El sistema de tipos dice que no lo sabe, así
    que tienes que encontrarlo por tu cuenta. En mi experiencia, **la forma más simple y
    efectiva de tratar estos mensajes inútiles es usar una "búsqueda binaria" para ir
    restaurando el código poco a poco**.
  - Este problema probablemente sea el mayor dolor de cabeza de NixOS en este memento.
- **Implementación interna más compleja**:
  - La abstracción declarativa de Nix introduce más complejidad en el código interno que
    un enfoque imperativo tradicional.
  - Esa complejidad aumenta la dificultad de implementación y hace más difícil hacer
    modificaciones personalizadas en los niveles bajos. Sin embargo, esta carga recae
    sobre todo en quienes mantienen los paquetes de Nix, porque los usuarios normales
    apenas interactúan con esas complejidades internas.

## Resumen

En general, creo que NixOS es adecuado para desarrolladores con cierto nivel de
experiencia en Linux y conocimientos de programación que quieran más control sobre sus
sistemas.

No recomiendo que quienes no tienen experiencia previa con Linux se metan de lleno en
NixOS, porque puede convertirse en un camino frustrante.

> Si tienes más preguntas sobre NixOS, puedes consultar el último capítulo de este libro:
> [FAQ](../faq/).
