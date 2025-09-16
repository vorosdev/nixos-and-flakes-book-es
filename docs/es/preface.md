# Prefacio

## El dolor de los principiantes en NixOS - Documentación y Flakes

NixOS es una distribución de Linux muy distintiva, construida sobre el gestor de paquetes
Nix, con una filosofía de diseño que la diferencia de las distribuciones tradicionales
como Ubuntu, CentOS, Arch Linux y otras.

Una de las principales ventajas de NixOS sobre otras distribuciones radica en su
reproducibilidad y configuración declarativa, lo que permite a los usuarios replicar
entornos de sistema consistentes en múltiples máquinas.

Si bien NixOS es potente, su fortaleza también conlleva una mayor complejidad del sistema.
Esto lo hace más desafiante para los recién llegados. Un gran obstáculo es que el
conocimiento adquirido en otras distribuciones de Linux no se transfiere fácilmente a
NixOS. Otro es que la documentación oficial y comunitaria suele estar dispersa y
desactualizada. Estos problemas han preocupado a muchos principiantes en NixOS.

Se pueden observar estos problemas con la característica experimental del gestor de
paquetes Nix llamada Flakes. Inspirada en gestores de paquetes como npm y Cargo, Flakes
utiliza `flake.nix` para registrar todas las dependencias externas y `flake.lock` para
bloquear sus versiones. Esto mejora significativamente la reproducibilidad y la
componibilidad del gestor de paquetes Nix y de las configuraciones de NixOS.

Las ventajas de Flakes lo han vuelto ampliamente popular dentro de la comunidad: según
encuestas oficiales, más de la mitad de los nuevos repositorios de Nix creados en GitHub
utilizan Flakes.

Sin embargo, para mantener la estabilidad, la documentación oficial apenas cubre contenido
relacionado con Flakes. Esto ha dejado a muchos usuarios de Nix/NixOS confundidos. Ven que
todos usan Flakes y quieren aprenderlo también, pero no encuentran por dónde empezar,
teniendo que armar la información dispersa, buscar en el código fuente de Nixpkgs o pedir
ayuda a usuarios más experimentados.

## El origen de este libro

Este libro se originó a partir de mis notas dispersas cuando comencé con NixOS.

En abril de este año (2023), cuando me adentré en NixOS, me enamoré de su filosofía de
diseño. Por recomendación de un amigo, conocí la función experimental Flakes de Nix.
Después de comparar Flakes con el método tradicional de configuración de NixOS, me di
cuenta de que solo un NixOS con Flakes habilitado cumplía con mis expectativas. En
consecuencia, ignoré por completo el enfoque tradicional de configuración de Nix y aprendí
directamente a configurar mi sistema NixOS usando Flakes desde mis primeros pasos.

A lo largo de mi proceso de aprendizaje, descubrí que había muy pocos recursos sobre
Flakes orientados a principiantes. La gran mayoría de la documentación se centraba en el
enfoque tradicional de configuración de Nix, lo que me obligó a extraer la información que
necesitaba de diversas fuentes como la Wiki de NixOS, Zero to Nix, el Manual de Nixpkgs y
el código fuente de Nixpkgs, descartando todo lo que no estuviera relacionado con Flakes.
Este camino de aprendizaje fue bastante enredado y doloroso. Para evitar tropiezos en el
futuro, fui documentando con esmero numerosas notas dispersas a medida que avanzaba.

Con algo de experiencia a mis espaldas, a inicios de mayo de este año cambié mi PC
principal a NixOS. Después de organizar y pulir mis notas de principiante en NixOS, las
publiqué en mi blog[^1] y las compartí en la comunidad china de NixOS. La comunidad china
respondió de manera positiva y, con base en sus consejos, traduje el artículo al inglés y
lo compartí en Reddit, recibiendo una gran respuesta[^2].

La recepción positiva de este documento compartido me animó y me impulsó a seguir
mejorándolo. A través de actualizaciones continuas, el contenido de este documento se
expandió a más de 20,000 palabras. Algunos lectores sugirieron que la experiencia de
lectura podía mejorar, lo que me llevó a atender sus recomendaciones[^3]. Como resultado,
migré el contenido del artículo a un repositorio en GitHub, establecí un sitio de
documentación dedicado y ajusté la presentación para que estuviera más alineada con una
guía para principiantes en lugar de un cuaderno personal.

Y así nació un libro bilingüe de código abierto, al que llamé “<NixOS & Flakes Book>” con
el título en chino “NixOS & Flakes 新手指南” (“NixOS & Flakes Beginner's Guide”).

El contenido de este libro de código abierto fue evolucionando paso a paso a medida que
usaba NixOS e interactuaba con los lectores. La sensación de logro derivada de la
retroalimentación positiva de los lectores ha sido mi mayor motivación para seguir
actualizándolo. Algunos comentarios de los lectores han sido de gran ayuda en su
“evolución”. Al inicio, solo quería compartir mis experiencias con NixOS de una manera
algo casual, pero de forma inesperada se convirtió en un libro de código abierto. Su
público en el extranjero incluso superó al de mi propio país, y obtuvo muchas estrellas
—un resultado que nunca anticipé.

Estoy agradecido con todos los amigos que han contribuido a este libro y han ofrecido
sugerencias, y valoro todo el apoyo y el ánimo de los lectores. Sin todos ustedes, el
contenido de este libro podría haberse quedado limitado a mi blog personal y no habría
alcanzado su forma actual.

## Las características de este libro

1. Enfocado en NixOS y Flakes, dejando de lado el enfoque tradicional de configuración de
   Nix.
2. Amigable para principiantes, con explicaciones desde la perspectiva de quienes recién
   llegan a NixOS y tienen algo de experiencia en el uso de Linux y programación.
3. Aprendizaje paso a paso y progresivo.
4. La mayoría de los capítulos de este libro incluyen enlaces de referencia al final, lo
   que facilita a los lectores profundizar en los temas y evaluar la credibilidad del
   contenido.
5. Contenido coherente, bien organizado y estructurado. Los lectores pueden leer el libro
   de manera gradual o encontrar rápidamente la información que necesitan.

## Donación

Si encuentras útil este libro, por favor considera hacer una donación para apoyar su
desarrollo.

- GitHub: <https://github.com/sponsors/ryan4yin>
- Patreon: <https://patreon.com/ryan4yin>
- Buy me a coffee: <https://buymeacoffee.com/ryan4yin>
- 爱发电: <https://afdian.com/a/ryan4yin>
- Ethereum: `0xB74Aa43C280cDc8d8236952400bF6427E4390855`

## Retroalimentación y discusión

No soy un experto en NixOS y he estado usando NixOS por menos de 9 meses hasta ahora
(2024-02), por lo que seguramente habrá algunos conceptos erróneos o casos complejos en el
libro. Si alguien encuentra algo incorrecto o tiene preguntas/sugerencias, puede hacérmelo
saber abriendo un _issue_ o uniéndose a la discusión en
[GitHub Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions). Estoy
feliz de seguir mejorando el contenido de este libro.

La razón por la que escribí este pequeño libro fue simplemente porque nadie en la
comunidad lo hizo por mí, que en ese momento era un principiante, así que decidí hacerlo
yo mismo. Aunque sabía que podía cometer errores, es mucho mejor que no hacer nada.

Mi esperanza es que este libro pueda ayudar a más personas, permitiéndoles experimentar
las alegrías de NixOS. ¡Espero que les guste!

## Retroalimentación e intercambios históricos sobre este libro

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
