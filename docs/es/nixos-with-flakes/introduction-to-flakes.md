# Introducción a Flakes

La característica experimental **flakes** es un gran avance para Nix: introduce una
política para gestionar dependencias entre expresiones de Nix, mejora la reproducibilidad,
la componibilidad y la usabilidad en el ecosistema de Nix. Aunque todavía es una función
experimental, flakes ha sido ampliamente adoptado por la comunidad de Nix.[^1]

Flakes es uno de los cambios más significativos que el proyecto Nix ha visto en toda su
historia.[^2]

En términos simples, si has trabajado con JavaScript/Go/Rust/Python, deberías estar
familiarizado con archivos como `package.json`/`go.mod`/`Cargo.toml`/`pyproject.toml`. En
estos lenguajes de programación, estos archivos se usan para describir las dependencias
entre paquetes de software y cómo construir proyectos.

De manera similar, los gestores de paquetes en estos lenguajes también usan archivos como
`package-lock.json`/`go.sum`/`Cargo.lock`/`poetry.lock` para bloquear las versiones de las
dependencias, garantizando la reproducibilidad de los proyectos.

Flakes toma ideas de estos gestores de paquetes para mejorar la reproducibilidad, la
componibilidad y la usabilidad del ecosistema de Nix.

Flakes introduce `flake.nix`, similar a `package.json`, para describir las dependencias
entre paquetes de Nix y cómo construir proyectos. Además, proporciona `flake.lock`,
parecido a `package-lock.json`, para bloquear las versiones de las dependencias y
garantizar la reproducibilidad de los proyectos.

Por otro lado, las funciones experimentales de Flakes no rompieron el diseño original de
Nix a nivel de usuario. Los dos nuevos archivos `flake.nix`/`flake.lock` introducidos por
Flakes son solo una capa envolvente sobre otras configuraciones de Nix. En los siguientes
capítulos veremos que las características de Flakes proporcionan una forma nueva y más
conveniente de gestionar las dependencias entre expresiones de Nix, basándose en el diseño
original de Nix.

## Una advertencia sobre Flakes <Badge type="danger" text="precaución" />

Los beneficios de Flakes son evidentes, y toda la comunidad de NixOS lo ha adoptado con
entusiasmo. Actualmente, más de la mitad de los usuarios utilizan Flakes[^3], lo que da la
seguridad de que no será descontinuado.

:warning: Sin embargo, es importante tener en cuenta que **Flakes sigue siendo una
característica experimental**. Persisten algunos problemas y existe la posibilidad de que
se introduzcan cambios incompatibles durante el proceso de estabilización. El alcance de
estos cambios aún es incierto.

En general, recomiendo encarecidamente a todos usar Flakes, especialmente porque este
libro gira en torno a NixOS y Flakes. No obstante, es fundamental estar preparados para
los posibles problemas que puedan surgir debido a futuros cambios incompatibles.

## ¿Cuándo se estabilizará Flakes?

Investigué algunos detalles sobre Flakes:

- [[RFC 0136] A Plan to Stabilize Flakes and the New CLI Incrementally](https://github.com/NixOS/rfcs/pull/136):
  Un plan para estabilizar gradualmente Flakes y la nueva CLI, ya integrado.
- [CLI stabilization effort](https://github.com/NixOS/nix/issues/7701): Un issue que da
  seguimiento al progreso del esfuerzo de estabilización de la nueva CLI.
- [Why Are Flakes Still Experimental? - NixOS Discourse](https://discourse.nixos.org/t/why-are-flakes-still-experimental/29317):
  Una publicación que discute por qué Flakes aún se considera experimental.
- [Flakes Are Such an Obviously Good Thing - Graham Christensen](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/):
  Un artículo que enfatiza las ventajas de Flakes mientras sugiere áreas de mejora en su
  diseño y proceso de desarrollo.
- [ teaching Nix 3 CLI and Flakes #281 - nix.dev](https://github.com/NixOS/nix.dev/issues/281):
  Un issue sobre **“Enseñar Nix 3 CLI y Flakes”** en nix.dev, cuya conclusión es que no
  deberíamos promover características inestables en nix.dev.

Después de revisar estos recursos, parece que Flakes podría (o tal vez no…) estabilizarse
en un plazo de dos años, posiblemente acompañado de algunos cambios incompatibles.

## La nueva CLI y la CLI clásica

Nix introdujo dos características experimentales, `nix-command` y `flakes`, en el
año 2020. Estas funciones dieron lugar a una nueva interfaz de línea de comandos (conocida
como la nueva CLI), una definición estandarizada de la estructura de paquetes de Nix
(conocida como la función **Flakes**), y características como `flake.lock`, similar a los
archivos de bloqueo de versiones en cargo/npm.A pesar de ser experimentales al 1 de
febrero de 2024, estas funciones han sido ampliamente adoptadas dentro de la comunidad de
Nix debido a la mejora significativa que aportan a las capacidades de Nix.

La actual nueva CLI de Nix (la característica experimental `nix-command`) está
estrechamente acoplada a la característica experimental Flakes. Aunque existen esfuerzos
en curso para separarlas explícitamente, usar Flakes requiere esencialmente utilizar la
nueva CLI. En este libro, que sirve como guía para principiantes en NixOS y Flakes, es
necesario presentar las diferencias entre la nueva CLI de la que Flakes depende y la CLI
antigua.

Aquí listamos la antigua CLI de Nix y los conceptos relacionados que ya no se necesitan al
usar la nueva CLI y Flakes (`nix-command` y `flakes`). Al investigar, puedes reemplazarlos
con los comandos equivalentes de la nueva CLI (excepto por `nix-collect-garbage`, ya que
actualmente no existe una alternativa para este comando):

1. `nix-channel`: `nix-channel` gestiona versiones de _inputs_ como nixpkgs mediante
   canales stable/unstable, similar a las listas de paquetes utilizadas por otros gestores
   como apt/yum/pacman. Esto es lo que tradicionalmente provee `<nixpkgs>` en el lenguaje
   Nix.
   1. En Flakes, la funcionalidad de `nix-channel` se reemplaza con el Flake Registry
      (`nix registry`), que proporciona “una versión global no especificada de nixpkgs”
      para el uso interactivo de la CLI (por ejemplo: `nix run nixpkgs#hello`). Al usar un
      `flake.nix`, las versiones de los inputs se gestionan dentro del propio flake.
   2. Flakes usan la sección `inputs` en `flake.nix` para administrar las versiones de
      nixpkgs y otros inputs en cada Flake, en lugar de depender de un estado global.

2. `nix-env`: `nix-env` es una herramienta central de la CLI clásica de Nix utilizada para
   gestionar paquetes de software en el entorno del usuario.
   1. Instala paquetes desde las fuentes de datos añadidas por `nix-channel`, lo que
      provoca que la versión del paquete instalado dependa del canal. Los paquetes
      instalados con `nix-env` no se registran automáticamente en la configuración
      declarativa de Nix y quedan completamente fuera de su control, lo que dificulta
      reproducirlos en otras máquinas. Además, actualizar los paquetes instalados con
      `nix-env` es lento y puede producir resultados inesperados, ya que no se guarda el
      nombre del atributo donde se encontró el paquete en nixpkgs.

      Por esta razón, no se recomienda usar este comando directamente.

   2. El comando correspondiente en la nueva CLI es `nix profile`. Personalmente, no lo
      recomiendo para principiantes.

3. `nix-shell`: `nix-shell` crea un entorno de shell temporal, lo cual es útil para
   desarrollo y pruebas.
   1. **Nueva CLI**: Esta herramienta se divide en tres subcomandos: `nix develop`,
      `nix shell` y `nix run`. Hablaremos de estos tres comandos en detalle en el capítulo
      ["Desarrollo"](../development/intro.md).

4. `nix-build`: `nix-build` construye paquetes de Nix y coloca los resultados de la
   compilación en `/nix/store`, pero no los registra en la configuración declarativa de
   Nix.
   1. **Nueva CLI**: `nix-build` se reemplaza por `nix build`.

5. `nix-collect-garbage`: comando de recolección de basura usado para limpiar objetos no
   utilizados en `/nix/store`.
   1. En la nueva CLI existe un comando similar, `nix store gc --debug`, pero no limpia
      las generaciones de perfiles, por lo que actualmente no hay un reemplazo completo
      para este comando.

6. Otros comandos menos usados no se listan aquí.
   1. Puedes consultar la lista detallada de comparación de comandos en
      [Try to explain nix commands](https://qiita.com/Sumi-Sumi/items/6de9ee7aab10bc0dbead?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en).

[^1]: [Flakes - NixOS Wiki](https://wiki.nixos.org/wiki/Flakes)

[^2]:
    [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)

[^3]:
    [Draft: 1 year roadmap - NixOS Foundation](https://web.archive.org/web/20250317120825/https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)
