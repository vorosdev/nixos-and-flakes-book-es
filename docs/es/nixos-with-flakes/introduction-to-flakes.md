# Introducción a Flakes

La función experimental Flakes es un advance important para Nix: introduce una política
para gestionar dependencies entre expresiones de Nix y mejora la reproducibilidad, la
componibilidad y la usabilidad dentro del ecosistema Nix. Aunque sigue siendo una función
experimental, la comunidad de Nix la usa ampliamente.[^1]

Flakes es uno de los cambios más significativos que el proyecto Nix ha visto jamás.[^2]

En términos simples, si has trabajado con JavaScript/Go/Rust/Python, seguramente te
resulten familiares archivos como `package.json`/`go.mod`/`Cargo.toml`/`pyproject.toml`.
En esos lenguajes, esos archivos se usan para describir las dependencies entre paquetes de
software y cómo construir proyectos.

De forma similar, los gestores de paquetes de esos lenguajes también usan archivos como
`package-lock.json`/`go.sum`/`Cargo.lock`/`poetry.lock` para fijar las versions de las
dependencies y asegurar la reproducibilidad de los proyectos.

Flakes toma ideas de esos gestores de paquetes para mejorar la reproducibilidad, la
componibilidad y la usabilidad del ecosistema Nix.

Flakes introduce `flake.nix`, similar a `package.json`, para describir las dependencies
entre paquetes de Nix y cómo construir proyectos. Además, proporciona `flake.lock`,
parecido a `package-lock.json`, para fijar las versions de las dependencies y garantizar
la reproducibilidad del proyecto.

Por otro lado, la función experimental Flakes no rompe el diseño original de Nix a nivel
de usuario. Los dos archivos nuevos `flake.nix`/`flake.lock` introducidos por Flakes son
solo un envoltorio para otras configuraciones de Nix. En los capítulos siguientes veremos
que Flakes ofrece una forma nueva y más cómoda de gestionar las dependencies entre
expresiones de Nix basada en el diseño original de Nix.

## Una advertencia sobre Flakes <Badge type="danger" text="precaución" />

Las ventajas de Flakes son evidentes, y toda la comunidad de NixOS lo ha adoptado con
entusiasmo. Actualmente, más de la mitad de los usuarios usa Flakes[^3], lo que da la
tranquilidad de que no será deprecado.

:warning: Sin embargo, es important tener en cuenta que **Flakes sigue siendo una función
experimental**. Persistent algunos problems y existe la posibilidad de introducir cambios
rupturistas durante el proceso de estabilización. El alcance de esos cambios aún es
incierto.

En general, recomiendo mucho usar Flakes, especialmente porque este libro gira en torno a
NixOS y Flakes. Sin embargo, conviene estar preparado para posibles problems derivados de
futuros cambios rupturistas.

## ¿Cuándo se estabilizará Flakes?

Revisé algunos detalles sobre Flakes:

- [[RFC 0136] A Plan to Stabilize Flakes and the New CLI Incrementally](https://github.com/NixOS/rfcs/pull/136):
  Un plan para estabilizar Flakes y el nuevo CLI de forma incremental, ya fusionado.
- [CLI stabilization effort](https://github.com/NixOS/nix/issues/7701): Un issue que sigue
  el progreso del esfuerzo de estabilización del nuevo CLI.
- [Why Are Flakes Still Experimental? - NixOS Discourse](https://discourse.nixos.org/t/why-are-flakes-still-experimental/29317):
  Una publicación que explica por qué Flakes sigue considerándose experimental.
- [Flakes Are Such an Obviously Good Thing - Graham Christensen](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/):
  Un artículo que destaca las ventajas de Flakes y sugiere áreas de mejora en su diseño y
  proceso de desarrollo.
- [teaching Nix 3 CLI and Flakes #281 - nix.dev](https://github.com/NixOS/nix.dev/issues/281):
  Un issue sobre "Teaching Nix 3 CLI and Flakes" en nix.dev; la conclusión es que no se
  deberían promover funciones inestables en nix.dev.

Después de revisar estos recursos, parece que Flakes podría estabilizarse en un plazo de
dos años, o quizá no, posiblemente acompañado de algunos cambios rupturistas.

## El nuevo CLI y el CLI clásico

Nix introdujo dos funciones experimentales, `nix-command` y `flakes`, en 2020. Estas
funciones traen una nueva interfaz de línea de commandos (llamada el nuevo CLI), una
definición estandarizada de la estructura de paquetes de Nix (conocida como la función
Flakes) y archivos como `flake.lock`, similares a los archivos de bloqueo de versions en
cargo/npm. Aunque al 1 de febrero de 2024 siguen siendo experimentales, estas funciones
han logrado una adopción amplia en la comunidad de Nix gracias a la mejora significativa
que aportan a Nix.

El nuevo CLI actual de Nix (la función experimental `nix-command`) está fuertemente
acoplado con la función experimental Flakes. Aunque hay esfuerzos en cursor para
separarlos de forma explícita, usar Flakes esencialmente require usar el nuevo CLI. En
este libro, que sirve como guía para principiantes de NixOS y Flakes, es necesario
explicar las diferencias entre el nuevo CLI, del que depende Flakes, y el CLI antiguo.

Aquí listamos el CLI antiguo de Nix y los concepts relacionados que ya no se necesitan al
usar el nuevo CLI y Flakes (`nix-command` y `flakes`). Cuando investigues, puedes
reemplazarlos por los commandos correspondientes del nuevo CLI (excepto
`nix-collect-garbage`, porque actualmente no hay alternativa para ese commando):

1. `nix-channel`: `nix-channel` gestiona versions de entradas como nixpkgs mediante
   canales estables/inestables, similar a las listas de paquetes usadas por otros gestores
   como apt/yum/pacman. Esto es lo que tradicionalmente proporciona `<nixpkgs>` en el
   lenguaje Nix.
   1. En Flakes, la funcionalidad de `nix-channel` la reemplaza el Flake Registry
      (`nix registry`) para proporcionar "alguna versión global no especificada de
      nixpkgs" en el uso interaction del CLI (por ejemplo, `nix run nixpkgs#hello`). Al
      usar un `flake.nix`, las versions de las entradas se gestionan dentro del propio
      flake.
   2. Flakes usa la sección `inputs` en `flake.nix` para gestionar las versions de nixpkgs
      y otras entradas en cada flake, en lugar de usar estado global.
2. `nix-env`: `nix-env` es una herramienta central de línea de commandos del Nix clásico,
   usada para gestionar paquetes de software en el entorno del usuario.
   1. Instala paquetes desde las fuentes de datos añadidas por `nix-channel`, por lo que
      la versión del paquete instalado queda influida por el canal. Los paquetes
      instalados con `nix-env` no se registran automáticamente en la configuración
      declarativa de Nix y quedan completamente fuera de su control, así que es difícil
      reproducirlos en otras máquinas. Actualizar paquetes instalados con `nix-env` es
      lento y puede producir resultados inesperados porque no se guarda el nombre del
      atributo donde se encontró el paquete en nixpkgs.

      Por eso, no se recomienda usar este commando directamente.

   2. El commando correspondiente en el nuevo CLI es `nix profile`. Personalmente, no lo
      recomiendo para principiantes.

3. `nix-shell`: `nix-shell` crea un entorno temporal de shell, útil para desarrollo y
   pruebas.
   1. Nuevo CLI: esta herramienta se divide en tres subcomandos: `nix develop`,
      `nix shell` y `nix run`. Hablaremos de estos tres commandos en detalle en el
      capítulo "[Desarrollo](../development/intro.md)".
4. `nix-build`: `nix-build` construye paquetes de Nix y coloca los resultados de la
   compilación en `/nix/store`, pero no los registra en la configuración declarativa de
   Nix.
   1. Nuevo CLI: `nix-build` se reemplaza por `nix build`.
5. `nix-collect-garbage`: commando de recolección de basura usado para limpiar objetos del
   almacén no utilizados en `/nix/store`.
   1. Hay un commando similar en el nuevo CLI, `nix store gc --debug`, pero no limpia las
      generaciones de perfil, así que por ahora no hay alternativa para este commando.
6. Y otros commandos menos usados no se enumeran aquí.
   1. Puedes consultar la lista comparativa detallada de commandos en
      [Try to explain nix commands](https://qiita.com/Sumi-Sumi/items/6de9ee7aab10bc0dbead?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en).

[^1]: [Flakes - NixOS Wiki](https://wiki.nixos.org/wiki/Flakes)

[^2]:
    [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)

[^3]:
    [Draft: 1 year roadmap - NixOS Foundation](https://web.archive.org/web/20250317120825/https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)
