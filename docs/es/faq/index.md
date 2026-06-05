# Preguntas frecuentes

## ¿Cuál es la diferencia entre la capacidad de rollback de NixOS y el rollback mediante snapshots del sistema con btrfs/zfs?

La diferencia está en la naturaleza de los snapshots. Los snapshots del sistema creados
con btrfs/zfs no contienen el "conocimiento" de cómo construir ese snapshot desde cero:
son **no interpretables**, y su contenido está fuertemente correlacionado con el entorno
de hardware actual, lo que dificulta reproducirlos en otras máquinas.

Por otro lado, la configuración de NixOS es una pieza de "conocimiento" que puede
construir un sistema operativo idéntico desde cero. Es **explicable** y puede construirse
automáticamente con unos pocos commandos simples. La configuración de NixOS sirve como
documentación de todos los cambios hechos a tu sistema operativo y también se usa para
construir automáticamente el propio sistema.

El archivo de configuración de NixOS es como el **código fuente** de un program. Mientras
el código fuente esté intacto, es fácil modificar, revisar o reconstruir un program
idéntico. En cambio, los snapshots del sistema son como programs binarios compilados a
partir del código fuente, por lo que modificarlos o revisarlos es mucho más difícil.
Además, los snapshots son grandes, así que compartirlos o migrarlos tiene un costo mayor
que compartir código fuente.

Sin embargo, esto no significa que NixOS elimine la necesidad de snapshots del sistema.
Como se mencionó en el capítulo 1 de este libro, NixOS solo puede garantizar la
reproducibilidad de todo lo declarado en la configuración declarativa. Otros aspects del
sistema que no están cubiertos por esa configuración, como datos dinámicos en
MySQL/PostgreSQL, archivos subidos por usuarios, logs del sistema, videos, música e
imágenes en los directors home de los usuarios, siguen necesitando snapshots del sistema u
otros medios de respaldo.

## ¿Cómo se compara Nix con herramientas tradicionales de gestión de sistemas como Ansible?

Nix no solo se usa para gestionar entornos de escritorio, también se emplea ampliamente
para la gestión por lotes de servidores en la nube.
[NixOps](https://github.com/NixOS/nixops), herramienta official de la comunidad NixOS, y
[colmena](https://github.com/zhaofengli/colmena), desarrollada por la comunidad, son
herramientas diseñadas específicamente para este caso de uso.

Comparado con herramientas tradicionales ampliamente usadas como Ansible, Nix tiene las
siguientes ventajas principles:

1. Uno de los mayores problems de Ansible es que cada despliegue se basa en cambios
   incrementales sobre el estado actual del sistema. El estado actual del sistema, al
   igual que los snapshots mencionados antes, no es interpretable y es difícil de
   reproducir. NixOS declara el estado objetivo del sistema mediante sus archivos de
   configuración, de modo que el resultado del despliegue es independiente del estado
   actual del sistema, y los despliegues repetidos no causan problems.
2. Nix Flakes usa un archivo de bloqueo de versions `flake.lock` para fijar el hash,
   número de versión, fuente de datos y otra información de todas las dependencies, lo que
   mejora mucho la reproducibilidad del sistema. Las herramientas tradicionales como
   Ansible no tienen esta característica, así que no son muy reproducibles.
   1. Esta es una razón por la que Docker es tan popular: proporciona, a una fracción del
      costo, un **entorno de sistema reproducible en una amplia variedad de máquinas** que
      herramientas Ops tradicionales como Ansible no proporcionan.
3. Nix ofrece un alto grado de facilidad para personalizar el sistema al ocultar los
   detalles de implementación subyacentes bajo una capa de abstracción declarativa, de
   modo que los usuarios solo deben preocuparse por sus requisitos principles.
   Herramientas como Ansible tienen abstracciones mucho más débiles.
   1. Si alguna vez has usado una herramienta de configuración declarativa como
      terraform/kubernetes, esto debería set fácil de entender. Cuanto más complejos son
      los requisitos, mayor es el beneficio de la configuración declarativa.

## ¿Cuáles son las ventajas de Nix frente a la tecnología de contenedores Docker?

Nix y las tecnologías de contenedores como Docker tienen casos de uso que se superponen,
por ejemplo:

1. Muchas personas usan Nix para gestionar entornos de desarrollo y compilación, como se
   explica en este libro. Por otro lado, tecnologías como
   [Dev Containers](https://github.com/devcontainers/spec), que construyen entornos de
   desarrollo basados en contenedores, también son populares.
2. El campo DevOps/SRE está actualmente dominado por tecnologías de contenedores basadas
   en Dockerfiles. Distribuciones comunes como Ubuntu/Debian se usan con frecuencia dentro
   de contenedores, y también existen opciones maduras para la máquina host. En este
   contexto, ¿qué ventajas significativas ofrece cambiar a NixOS?

Respecto al primer punto, "gestionar entornos de desarrollo y compilación", Nix
proporciona una experiencia de entorno de desarrollo muy parecida a trabajar directamente
en la máquina host. Esto ofrece varias ventajas frente a Dev Containers:

1. Nix no usa namespaces para aislar el sistema de archivos y la red, lo que permite una
   interacción sencilla con el sistema de archivos de la máquina host (incluido `/dev`
   para dispositivos externos) y el entorno de red desde el entorno de desarrollo creado
   por Nix. En cambio, los contenedores requieren various mapeos para permitir la
   comunicación entre el contenedor y el sistema de archivos del host, lo que a veces
   genera problems de permisos de archivos.
2. Debido a la ausencia de aislamiento fuerte, los entornos de desarrollo de Nix no tienen
   problems para soportar aplicaciones GUI. Ejecutar programs gráficos dentro de este
   entorno es tan fluido como ejecutarlos en el entorno del sistema.

En otras palabras, Nix proporciona una experiencia de desarrollo lo más cercana possible a
la máquina host, sin aislamiento fuerte. Los desarrolladores pueden usar herramientas de
desarrollo y depuración familiares en este entorno, y su experiencia previa puede migrarse
sin fricción. En cambio, si se usan Dev Containers, los desarrolladores pueden encontrar
various problems relacionados con comunicación del sistema de archivos, entorno de red,
permisos de usuario y la imposibilidad de usar herramientas de depuración GUI debido al
aislamiento fuerte.

Si decidimos usar Nix para gestionar todos los entornos de desarrollo, construir
contenedores Docker basados en Nix proporcionaría el mayor nivel de consistencia. Además,
adoptar una arquitectura tecnológica unificada para todos los entornos reduce de forma
significativa los costos de mantenimiento de infraestructura. Esto responde al segundo
punto mencionado antes: cuando se gestionan los entornos de desarrollo con Nix como
prerrequisito, usar NixOS para imágenes base de contenedores y servidores en la nube
ofrece ventajas claras.

## error: collision between `...` and `...`

Este error ocurre cuando instalaste dos paquetes que dependen de la misma biblioteca, pero
con versions distintas, en el mismo profile (módulo de Home Manager o módulo de NixOS).

Por ejemplo, si tienes la siguiente configuración:

```nix
{
   # como módulo de NixOS
   # environment.systemPackages = with pkgs; [
   #
   # o como módulo de Home Manager
   home.packages = with pkgs; [
     lldb

     (python311.withPackages (ps:
       with ps; [
         ipython
         pandas
         requests
         pyquery
         pyyaml
       ]
     ))
   ];
}
```

esto causará el siguiente error:

```bash
error: builder for '/nix/store/n3scj3s7v9jsb6y3v0fhndw35a9hdbs6-home-manager-path.drv' failed with exit code 25;
       last 1 log lines:
       > error: collision between `/nix/store/kvq0gvz6jwggarrcn9a8ramsfhyh1h9d-lldb-14.0.6/lib/python3.11/site-packages/six.py'
and `/nix/store/370s8inz4fc9k9lqk4qzj5vyr60q166w-python3-3.11.6-env/lib/python3.11/site-packages/six.py'
       For full logs, run 'nix log /nix/store/n3scj3s7v9jsb6y3v0fhndw35a9hdbs6-home-manager-path.drv'.
```

Estas son algunas soluciones:

1. Divide los dos paquetes en dos **profiles** distintos. Por ejemplo, puedes instalar
   `lldb` mediante `environment.systemPackages` y `python311` mediante `home.packages`.
2. Las distintas versions de Python3 se tratan como paquetes distintos, así que puedes
   cambiar tu versión personalizada de Python3 a `python310` para evitar el conflicto.
3. Usa `override` para sobrescribir la versión de la biblioteca usada por el paquete y
   hacerla consistente con la versión usada por el otro paquete.

```nix
{
  # como módulo de NixOS
  # environment.systemPackages = with pkgs; [
  #
  # o como módulo de Home Manager
  home.packages = let
    custom-python3 = (pkgs.python311.withPackages (ps:
      with ps; [
        ipython
        pandas
        requests
        pyquery
        pyyaml
      ]
    ));
  in
    with pkgs; [
      # sobrescribe la versión de python3
      # NOTA: esto disparará una recompilación de lldb; toma tiempo
      (lldb.override {
        python3 = custom-python3;
      })

      custom-python3
  ];
}
```
