# Fundamentos del lenguaje Nix

El lenguaje Nix es esencial para declarar configuraciones que serán construidas por Nix.
Para aprovechar plenamente los beneficios de NixOS y Flakes, es necesario comprender los
fundamentos de este lenguaje.

El lenguaje Nix es un lenguaje funcional sencillo. Si tienes algo de experiencia en
programación, deberías poder comprender sus bases en menos de 2 horas.

La comunidad ya cuenta con muchos buenos tutoriales sobre el lenguaje Nix, así que no
reinventaré la rueda. Para empezar, recomiendo leer los siguientes recursos como una
introducción rápida al lenguaje Nix:

1. [**Nix Language Basics - nix.dev**](https://nix.dev/tutorials/first-steps/nix-language):
   Este tutorial ofrece una visión general completa de los fundamentos del lenguaje Nix,
   recomendado para principiantes.
2. [**A tour of Nix**](https://nixcloud.io/tour/?id=introduction/nix): Un tutorial
   interactivo en línea que se centra en las construcciones del lenguaje de programación y
   en cómo Nix puede usarse algorítmicamente para resolver problemas.
3. [**Nix Language - Nix Reference Manual**](https://nixos.org/manual/nix/stable/language/):
   La documentación oficial del lenguaje Nix.
   1. nix.dev y otros tutoriales amigables son adecuados solo como lectura inicial, y
      **ninguno de ellos introduce completamente toda la sintaxis de Nix**. Si encuentras
      una nueva sintaxis que no conoces, consulta este documento oficial.
4. [https://noogle.dev/](https://noogle.dev/) es un buscador de funciones de la librería
   Nix que te ayuda a encontrar rápidamente las funciones que necesitas y su uso, lo cual
   es muy práctico.

Por ahora está bien tener solo una idea general de la sintaxis. Puedes volver a revisarla
más adelante cuando te encuentres con algo que no entiendas.
