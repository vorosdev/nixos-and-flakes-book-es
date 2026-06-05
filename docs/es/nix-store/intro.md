# Nix Store y caché binaria

Aquí presentamos una introducción breve al Nix Store, la caché binaria de Nix y concepts
relacionados, sin entrar en configuraciones ni métodos de uso específicos; eso se cubrirá
en detalle en capítulos posteriores.

## Nix Store

El Nix Store es uno de los concepts centrales del gestor de paquetes Nix. Es un sistema de
archivos de solo lectura usado para almacenar todos los archivos que requieren
inmutabilidad, incluidos los resultados de compilación de los paquetes, los metadatos de
los paquetes y todos los insumos de compilación de los paquetes.

El gestor de paquetes Nix usa el lenguaje functional de Nix para describir los paquetes de
software y sus dependencies. Cada paquete se trata como la salida de una función pura, y
los resultados de compilación se almacenan en el Nix Store.

Los datos en el Nix Store tienen un formato de ruta fijo:

```
/nix/store/b6gvzjyb2pg0kjfwrjmg1vfhh54ad73z-firefox-33.1
|--------| |------------------------------| |----------|
store directory         digest                  name
```

Como se ve, las rutas en el Nix Store comienzan con un valor hash (digest), seguido por el
nombre y la versión del paquete. Este valor hash se calcula a partir de toda la
información de entrada del paquete (parámetros de compilación, dependencies, versions de
dependencies, etc.), y cualquier cambio en los parámetros o dependencies produce un cambio
en el hash, garantizando así la unicidad de cada ruta. Además, como el Nix Store es un
sistema de archivos de solo lectura, asegura la inmutabilidad de los paquetes: una vez
compilado un paquete, no cambiará.

Como la ruta de almacenamiento del resultado se calcula a partir de toda la información de
entrada del proceso de compilación, **la misma información de entrada produce la misma
ruta de almacenamiento**. Este diseño también se conoce como el _modelo basado en
entradas_ (_Input-addressed Model_).

### Cómo usa NixOS el Nix Store

La configuración declarativa de NixOS calcula qué paquetes deben instalarse y luego enlaza
simbólicamente las rutas de almacenamiento de esos paquetes en el Nix Store a
`/run/current-system`; después, al modificar variables de entorno como `PATH` para que
apunten a la carpeta correspondiente dentro de `/run/current-system`, se logra la
instalación de los paquetes. Cada vez que se have un despliegue, NixOS calcula la nueva
configuración del sistema, limpia los enlaces simbólicos antiguos y crea los nuevos para
asegurar que el entorno del sistema coincida con la configuración declarativa.

Home Manager funciona de forma similar: enlaza simbólicamente los paquetes configurados
por el usuario a `/etc/profiles/per-user/tu-usuario` y modifica variables de entorno como
`PATH` para que apunten a esa ruta, instalando así los paquetes del usuario.

```bash
# Ver de dónde proviene bash en el entorno (instalado usando NixOS)
› which bash
╭───┬─────────┬─────────────────────────────────┬──────────╮
│ # │ command │              path               │   type   │
├───┼─────────┼─────────────────────────────────┼──────────┤
│ 0 │ bash    │ /run/current-system/sw/bin/bash │ external │
╰───┴─────────┴─────────────────────────────────┴──────────╯

› ls -al /run/current-system/sw/bin/bash
lrwxrwxrwx 15 root root 76 1970年 1月 1日 /run/current-system/sw/bin/bash -> /nix/store/1zslabm02hi75anb2w8zjrqwzgs0vrs3-bash-interactive-5.2p26/bin/bash

# Ver de dónde proviene cowsay en el entorno (instalado usando home-manager)
› which cowsay
╭───┬─────────┬────────────────────────────────────────┬──────────╮
│ # │ command │                  path                  │   type   │
├───┼─────────┼────────────────────────────────────────┼──────────┤
│ 0 │ cowsay  │ /etc/profiles/per-user/ryan/bin/cowsay │ external │
╰───┴─────────┴────────────────────────────────────────┴──────────╯

› ls -al /etc/profiles/per-user/ryan/bin/cowsay
lrwxrwxrwx 2 root root 72 1970年 1月 1日 /etc/profiles/per-user/ryan/bin/cowsay -> /nix/store/w2czyf82gxz4vy9kzsdhr88112bmc0c1-home-manager-path/bin/cowsay
```

El commando `nix develop`, por otro lado, añade directamente las rutas de almacenamiento
de los paquetes a variables de entorno como `PATH` y `LD_LIBRARY_PATH`, permitiendo que el
nuevo entorno de shell use directamente esos paquetes o bibliotecas.

Por ejemplo, en el repositorio fuente de este libro,
[ryan4yin/nixos-and-flakes-book](https://github.com/ryan4yin/nixos-and-flakes-book), tras
ejecutar `nix develop` podemos examinar el contenido de la variable `PATH`:

```bash
› nix develop
node v22.18.0

› env | egrep '^PATH'
PATH=/nix/store/v0sf67x7sw6pg277amhgf3j84m60wrqn-pre-commit-4.2.0/bin:/nix/store/yva1rk7v7s31dpwkwxcphpqkn5l3bp1f-nodejs-22.18.0-dev/bin:/nix/store/vrqcpwq576gar2i430lj91v37b7k8jw2-nodejs-22.18.0/bin:/nix/store/qzw56f9vai5jg9dm3wbm45r6cc6b65d8-pnpm-10.15.0/bin:/nix/store/n8b4js8xkj12d1jjjqm86p9lwmyhh2rf-yarn-1.22.22/bin:/nix/store/bjhv861k4ri85l1vyrnr954ncsdbw3ri-prettier-3.5.3/bin:/nix/store/m6zld27lmw422ca5zywhkq8kmlaf8inh-git-2.50.1/bin:/nix/store/gz3wn2d2xbl758jsln65za95mdc9yial-typos-1.32.0/bin:/nix/store/bx0wnjpp6mgr6bmh5q1mz9c1ach34lbn-nixfmt-0.6.0-bin/bin:/nix/store/zf4jj08zh07zg1j2s64g8sfjbzfq70lm-pandoc-cli-3.6/bin:/nix/store/g7i75czfbw9sy5f8v7rjbama6lr3ya3s-patchelf-0.15.0/bin:/nix/store/kaj8d1zcn149m40s9h0xi0khakibiphz-gcc-wrapper-14.3.0/bin:/nix/store/8adzgnxs3s0pbj22qhk9zjxi1fqmz3xv-gcc-14.3.0/bin:/nix/store/p2ixvjsas4qw58dcwk01d22skwq4fyka-glibc-2.40-66-bin/bin:/nix/store/rry6qingvsrqmc7ll7jgaqpybcbdgf5v-coreutils-9.7/bin:/nix/store/87zpmcmwvn48z4lbrfba74b312h22s6c-binutils-wrapper-2.44/bin:/nix/store/ap35np2bkwaba3rxs3qlxpma57n2awyb-binutils-2.44/bin:/nix/store/rry6qingvsrqmc7ll7jgaqpybcbdgf5v-coreutils-9.7/bin:/nix/store/392hs9nhm6wfw4imjllbvb1wil1n39qx-findutils-4.10.0/bin:/nix/store/xw0mf3shymq3k7zlncf09rm8917sdi4h-diffutils-3.12/bin:/nix/store/4rpiqv9yr2pw5094v4wc33ijkqjpm9sa-gnused-4.9/bin:/nix/store/l2wvwyg680h0v2la18hz3yiznxy2naqw-gnugrep-3.11/bin:/nix/store/c1z5j28ndxljf1ihqzag57bwpfpzms0g-gawk-5.3.2/bin:/nix/store/w60s4xh1pjg6dwbw7j0b4xzlpp88q5qg-gnutar-1.35/bin:/nix/store/xd9m9jkvrs8pbxvmkzkwviql33rd090j-gzip-1.14/bin:/nix/store/w1pxx760yidi7n9vbi5bhpii9xxl5vdj-bzip2-1.0.8-bin/bin:/nix/store/xk0d14zpm0njxzdm182dd722aqhav2cc-gnumake-4.4.1/bin:/nix/store/cfqbabpc7xwg8akbcchqbq3cai6qq2vs-bash-5.2p37/bin:/nix/store/gj54zvf7vxll1mzzmqhqi1p4jiws3mfb-patch-2.7.6/bin:/nix/store/22rpb6790f346c55iqi6s9drr5qgmyjf-xz-5.8.1-bin/bin:/nix/store/xlmpcglsq8l09qh03rf0virz0331pjdc-file-5.45/bin:/home/ryan/.local/bin:/run/wrappers/bin:/etc/profiles/per-user/ry... (line truncated to 2000 chars)
```

Está claro que `nix develop` añadió directamente las rutas de almacenamiento de muchos
paquetes al entorno `PATH`.

## Recolección de basura del Nix Store

El Nix Store es un sistema de almacenamiento centralizado donde se guardan tanto los
insumos como los resultados de compilación de los paquetes. A medida que se usa el
sistema, el número de paquetes en el Nix Store aumenta y el espacio en disco ocupado
crece.

Para evitar que el Nix Store crezca indefinidamente, el gestor de paquetes Nix ofrece un
mecanismo de recolección de basura para el Nix Store local, que limpia los datos antiguos
y recupera espacio.

Según
[Capítulo 11. El recolector de basura - nix pills](https://nixos.org/guides/nix-pills/garbage-collector),
el commando `nix-store --gc` realiza la recolección de basura recorriendo recursivamente
todos los enlaces simbólicos en el directorio `/nix/var/nix/gcroots/` para encontrar los
paquetes referenciados y eliminar los que ya no lo están. El commando
`nix-collect-garbage --delete-old` va un paso más allá: primero borra todos los
[perfiles](https://nixos.org/manual/nix/stable/command-ref/files/profiles) antiguos y
luego ejecuta `nix-store --gc` para limpiar los paquetes que ya no están referenciados.

Es important notar que los resultados de compilación de commandos como `nix build` y
`nix develop` no se agregan automáticamente a `/nix/var/nix/gcroots/`, así que esos
resultados pueden set eliminados por el mecanismo de recolección de basura. Puedes usar
`nix-instantiate` con `keep-outputs = true` y otros medios para evitarlo, pero yo prefiero
montar mi propio servidor de caché binaria y configurar un tiempo de caché más largo (por
ejemplo, un año), y luego enviar los datos al servidor de caché. Así puedes compartir los
resultados de compilación entre máquinas y evitar que la recolección de basura local los
elimine, logrando dos objetivos a la vez.

## Caché binaria

El diseño de Nix y del Nix Store garantiza la inmutabilidad de los paquetes, permitiendo
compartir directamente los resultados de compilación entre varias máquinas. Mientras estas
máquinas usen la misma información de entrada para compilar un paquete, obtendrán la misma
ruta de salida, y Nix puede reutilizar los resultados de compilación de otras máquinas en
vez de recompilar el paquete, acelerando así la instalación.

La caché binaria de Nix está diseñada sobre esta base; es una implementación del Nix Store
que guarda los datos en un servidor remoto en lugar de localmente. Cuando have falta, el
gestor de paquetes Nix descarga los resultados correspondientes desde el servidor remoto a
`/nix/store` local, evitando el costoso proceso de compilación local.

Nix ofrece un servidor official de caché binaria en <https://cache.nixos.org>, que
almacena resultados de compilación para la mayoría de los paquetes de nixpkgs en
arquitecturas de CPU comunes. Cuando ejecutas un commando de compilación de Nix en tu
máquina local, Nix primero intenta encontrar la caché binaria correspondiente en el
servidor. Si la encuentra, la descarga directamente, omitiendo la compilación local y
acelerando mucho el proceso.

## Modelo de confianza de la caché binaria de Nix

El **modelo basado en entradas** (_Input-addressed Model_) solo garantiza que la misma
entrada produzca la misma ruta de salida, pero no garantiza la unicidad del contenido de
salida. Esto significa que, incluso con la misma información de entrada, varias
compilaciones del mismo paquete pueden producir contenido de salida diferente.

Aunque Nix ha tomado medidas como deshabilitar el acceso a la red en el entorno de
compilación y usar marcas de tiempo fijas para minimizar la incertidumbre, todavía hay
factors incontrolables que pueden influir en el proceso de compilación y producir
contenido de salida distinto. Estas diferencias normalmente no afectan la funcionalidad
del paquete, pero sí representan un reto para el intercambio seguro de la caché binaria:
la incertidumbre en el contenido de salida dificulta determinar si la caché descargada del
servidor fue realmente construida con la información de entrada declarada y si contiene
contenido malicioso.

Para resolver esto, el gestor de paquetes Nix usa un mecanismo de firma con clave
pública/privada para verificar el origen y la integridad de la caché binaria. Esto deja la
responsabilidad de la seguridad en el usuario. Si deseas usar un servidor de caché no
official para acelerar el proceso de compilación, debes añadir la clave pública de ese
servidor a `trusted-public-keys` y asumir los riesgos de seguridad asociados: el servidor
podría proporcionar datos en caché que incluyan contenido malicioso.

### Modelo basado en contenido

[RFC062 - content-addressed store paths](https://github.com/NixOS/rfcs/blob/master/rfcs/0062-content-addressed-paths.md)
es un intento de la comunidad por mejorar la consistencia de los resultados de
compilación. Propone una nueva forma de calculator las rutas de almacenamiento basándose
en los resultados de compilación (outputs) en lugar de en la información de entrada
(inputs). Este diseño asegura consistencia en los resultados: si los resultados cambian,
las rutas de almacenamiento también cambian, evitando así la incertidumbre del contenido
de salida inherente al modelo basado en entradas.

Sin embargo, este enfoque sigue en una etapa experimental y no se ha adoptado ampliamente.

## Referencias

- [Nix Store - Nix Manual](https://nixos.org/manual/nix/stable/store/)
