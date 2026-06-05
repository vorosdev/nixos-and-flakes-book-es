# Prefacio

## La dificultad de empezar en NixOS: documentación y Flakes

NixOS es una distribución de Linux muy particular, construida sobre el gestor de paquetes
Nix, con una filosofía de diseño que la diferencia de distribuciones tradicionales como
Ubuntu, CentOS, Arch Linux y otras.

Una de las principales ventajas de NixOS frente a otras distribuciones es su
reproducibilidad y su configuración declarativa, lo que permite replicar entornos de
sistema consistentes en varias máquinas.

Aunque NixOS es potente, esa fortaleza también implica una mayor complejidad del sistema.
Esto lo hace más difícil para quienes comienzan. Un problema importante es que el
conocimiento acumulado en otras distribuciones de Linux no se transfiere fácilmente a
NixOS. Otro es que la documentación oficial y la de la comunidad suele estar dispersa y
desactualizada. Estos problemas han afectado a muchos principiantes de NixOS.

Estos problemas también se ven con la función experimental del gestor de paquetes Nix
llamada Flakes. Inspirado en gestores de paquetes como npm y Cargo, Flakes usa `flake.nix`
para registrar todas las dependencias externas y `flake.lock` para fijar sus versiones.
Esto mejora de forma significativa la reproducibilidad y la componibilidad del gestor de
paquetes Nix y de las configuraciones de NixOS.

Las ventajas de Flakes lo han vuelto muy popular dentro de la comunidad: según encuestas
oficiales, más de la mitad de los nuevos repositorios de Nix creados en GitHub ya usan
Flakes.

Sin embargo, para mantener la estabilidad, la documentación oficial cubre muy poco
contenido relacionado con Flakes. Esto ha dejado a muchos usuarios de Nix/NixOS
confundidos. Ven que todo el mundo usa Flakes y también quieren aprenderlo, pero no
encuentran por dónde empezar; a menudo tienen que reunir información dispersa, buscar en
el código fuente de Nixpkgs o pedir ayuda a usuarios con más experiencia.

## El origen de este libro

Este libro nació de mis notas dispersas cuando empecé con NixOS.

En abril de ese año (2023), cuando empecé con NixOS, me enamoré de su filosofía de diseño.
A recomendación de un amigo, conocí la función experimental Flakes de Nix. Después de
comparar Flakes con el método tradicional de configuración de NixOS, me di cuenta de que
solo un NixOS con Flakes habilitado cumplía con mis expectativas. Por eso, ignoré por
completo el enfoque tradicional de configuración de Nix y aprendí directamente a
configurar mi sistema NixOS con Flakes desde los primeros pasos.

Durante todo mi proceso de aprendizaje, encontré muy pocos recursos de Flakes pensados
para principiantes. La gran mayoría de la documentación se centraba en el enfoque
tradicional de configuración de Nix, lo que me obligó a extraer la información que
necesitaba de distintas fuentes, como la Wiki de NixOS, Zero to Nix, el manual de Nixpkgs
y el código fuente de Nixpkgs, descartando todo lo que no estuviera relacionado con
Flakes. Ese camino de aprendizaje fue bastante enredado y doloroso. Para evitar tropiezos
después, fui documentando con cuidado muchas notas dispersas a medida que avanzaba.

Con algo de experiencia a mis espaldas, a inicios de mayo de ese año cambié mi PC
principal a NixOS. Después de organizar y pulir mis notas para principiantes en NixOS, las
publiqué en mi blog[^1] y las compartí en la comunidad china de NixOS. La comunidad china
respondió de forma positiva y, con base en sus consejos, traduje el artículo al inglés y
lo compartí en Reddit, recibiendo muy buena respuesta[^2].

La buena recepción de este documento compartido me animó y me impulsó a seguir
mejorándolo. Con actualizaciones continuas, el contenido llegó a superar las 20,000
palabras. Algunos lectores sugirieron que la experiencia de lectura podía mejorar, así que
atendí sus recomendaciones[^3]. Como resultado, migré el contenido del artículo a un
repositorio de GitHub, monté un sitio de documentación dedicado y ajusté la presentación
para que se pareciera más a una guía para principiantes que a un cuaderno personal.

Y así nació un libro de código abierto bilingüe, al que llamé `<NixOS & Flakes Book>` con
el título en chino `NixOS & Flakes 新手指南` (`NixOS & Flakes Beginner's Guide`).

El contenido de este libro de código abierto fue evolucionando paso a paso a medida que
usaba NixOS e interactuaba con los lectores. La sensación de logro que me da la
retroalimentación positiva de los lectores ha sido mi mayor motivación para seguir
actualizándolo. Algunos comentarios de los lectores han sido muy útiles en su "evolución".
Al principio solo quería compartir mis experiencias con NixOS de una forma algo casual,
pero de manera inesperada se convirtió en un libro de código abierto. Su público en el
extranjero incluso superó al de mi propio país, y consiguió muchas estrellas, algo que
nunca imaginé.

Agradezco a todos los amigos que han contribuido a este libro y ofrecido sugerencias, y
valoro todo el apoyo y el ánimo de los lectores. Sin ustedes, el contenido de este libro
podría haberse quedado en mi blog personal y no habría llegado a su forma actual.

## Características de este libro

1. Enfocado en NixOS y Flakes, dejando de lado el enfoque tradicional de configuración de
   Nix.
2. Amigable para principiantes, con explicaciones desde la perspectiva de quienes llegan a
   NixOS con algo de experiencia en Linux y programación.
3. Aprendizaje paso a paso y progresivo.
4. La mayoría de los capítulos de este libro incluyen enlaces de referencia al final, lo
   que facilita profundizar en los temas y evaluar la credibilidad del contenido.
5. Contenido coherente, bien organizado y estructurado. Los lectores pueden avanzar de
   manera gradual o encontrar rápidamente la información que necesitan.

## Donaciones

Si este libro te resulta útil, considera hacer una donación para apoyar su desarrollo.

- GitHub: <https://github.com/sponsors/ryan4yin>
- Patreon: <https://patreon.com/ryan4yin>
- Buy me a coffee: <https://buymeacoffee.com/ryan4yin>
- 爱发电: <https://afdian.com/a/ryan4yin>
- Ethereum: `0xB74Aa43C280cDc8d8236952400bF6427E4390855`

## Retroalimentación y discusión

No soy experto en NixOS y he usado NixOS por menos de 9 meses hasta ahora (2024-02), así
que seguramente hay algunos malentendidos o casos complejos en el libro. Si alguien
encuentra algo incorrecto o tiene preguntas o sugerencias, avísame abriendo un issue o
uniéndose a la discusión en
[GitHub Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions). Con
gusto seguiré mejorando el contenido de este libro.

La razón por la que escribí este pequeño libro fue porque nadie en la comunidad lo hizo
por mí, que en ese memento era principiante, así que decidí hacerlo yo mismo. Aunque sabía
que podía cometer errores, siempre es mejor hacer algo que no hacer nada.

Mi esperanza es que este libro ayude a más personas y les permita experimentar lo bueno de
NixOS. ¡Espero que te guste!

## Retroalimentación histórica y discusiones sobre este libro

Comentarios en inglés y discusiones relacionadas:

- [[2023-05-11] NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-22] Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/updates_nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-24] An unofficial NixOS & Flakes book for beginners - Discourse](https://discourse.nixos.org/t/an-unofficial-nixos-flakes-book-for-beginners/29561)
- [[2023-07-06] This isn't an issue but it has to be said: - Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions/43)

Comentarios y discusiones en chino:

- [[2023-05-09] NixOS 与 Nix Flakes 新手入门 - v2ex 社区](https://www.v2ex.com/t/938569#reply45)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - v2ex 社区](https://www.v2ex.com/t/951190#reply9)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - 0xffff 社区](https://0xffff.one/d/1547-nixos-yu-flakes-yi-fen-fei-guan)

[^1]:
    [NixOS & Nix Flakes - A Guide for Beginners - This Cute World](https://thiscute.world/en/posts/nixos-and-flake-basics/)

[^2]:
    [NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)

[^3]:
    [Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/comment/jp4xhj3/?context=3)
