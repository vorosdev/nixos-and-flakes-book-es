---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

titleTemplate: "Home Page"

hero:
  name: "NixOS & Flakes Book"
  text: "Un libro no oficial para principiantes"
  tagline:
    ¿Quieres conocer NixOS y Flakes en detalle? ¿Buscas un tutorial amigable para
    principiantes? Entonces llegaste al lugar correcto!
  image:
    src: /logo.png
    alt: NixOS Flakes
  actions:
    - theme: brand
      text: Prólogo
      link: /preface.md
    - theme: brand
      text: Comenzar
      link: /introduction/index.md
    - theme: alt
      text: Ver en GitHub
      link: https://github.com/vorosdev/nixos-and-flakes-book-es
# features:
#   - title: Feature A
#     details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
#   - title: Feature B
#     details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
#   - title: Feature C
#     details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #5478BF 50%, #79B4D9);

  --vp-home-hero-image-background-image: linear-gradient(-60deg, #79B4D980, #5478BF99);
  --vp-home-hero-image-filter: blur(72px);
}

.image-bg {
  -webkit-filter: blur(5vw);
  -moz-filter: blur(5vw);
  -ms-filter: blur(5vw);
  filter: blur(5vw);
  background-size: 300% 300%;
  animation: animateGlow 3s ease infinite;
}

@keyframes animateGlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.VPImage {
  scale: 1.2;
  transform-origin: top left;
}
</style>
