# Entornos de desarrollo

En NixOS tenemos varios métodos para configurar entornos de desarrollo, y el enfoque más
ideal es definir por completo el entorno de desarrollo de cada proyecto mediante su propio
`flake.nix`. Sin embargo, en la práctica esto puede ser algo tedioso, porque requiere
crear un `flake.nix` y luego ejecutar `nix develop` para cada caso. Para proyectos
temporales o cuando solo se quiere echar un vistazo al código, este enfoque es un tanto
excesivo.

Como compromiso, se puede dividir el entorno de desarrollo en tres niveles:

1. **Entorno global**: normalmente se refiere al entorno de usuario administrado por
   home-manager.
   - Herramientas universales de desarrollo: `git`, `vim`, `emacs`, `tmux` y similares.
   - SDK y gestores de paquetes comunes de lenguajes: `rust`, `openjdk`, `python`, `go`,
     entre otros.
2. **Entorno del IDE**:
   - Tomando neovim como ejemplo, home-manager crea un wrapper para neovim que encapsula
     sus dependencias dentro de su propio entorno, evitando contaminar el entorno global.
   - Las dependencias de los plugins de neovim pueden añadirse al entorno de neovim con el
     parámetro `programs.neovim.extraPackages`, asegurando que el IDE funcione sin
     problemas.
   - Sin embargo, si usas varios IDEs (como emacs y neovim), a menudo dependen de muchos
     de los mismos programas (como lsp, tree-sitter, debugger, formateador, etc.). Para
     facilitar la administración, esas dependencias compartidas pueden colocarse en el
     entorno global. Ten cuidado con posibles conflictos de dependencias con otros
     programas del entorno global, especialmente con paquetes de python, que son propensos
     a conflictos.
3. **Entorno del proyecto**: cada proyecto puede definir su propio entorno de desarrollo
   (`devShells`) mediante `flake.nix`.
   - Para simplificar, puedes crear de antemano plantillas genéricas de `flake.nix` para
     lenguajes de uso frecuente, que luego se copian y modifican según sea necesario.
   - El entorno del proyecto tiene la mayor prioridad (se agrega al inicio de PATH), y sus
     dependencias reemplazarán a las que tengan el mismo nombre en el entorno global. Así,
     puedes controlar la versión de las dependencias del proyecto mediante el `flake.nix`
     del propio proyecto, sin verse afectado por el entorno global.

## Plantillas para entornos de desarrollo

Ya aprendimos cómo construir entornos de desarrollo, pero escribir `flake.nix` para cada
proyecto es un poco tedioso.

Por suerte, algunas personas de la comunidad ya hicieron esto por nosotros. El siguiente
repositorio contiene plantillas de entornos de desarrollo para la mayoría de los lenguajes
de programación. Solo cópialas y pégalas:

- [MordragT/nix-templates](https://github.com/MordragT/nix-templates)
- [the-nix-way/dev-templates](https://github.com/the-nix-way/dev-templates)

Si crees que la estructura de `flake.nix` sigue siendo demasiado complicada y quieres una
forma más simple, puedes considerar el siguiente proyecto, que encapsula Nix con mayor
profundidad y ofrece a los usuarios una definición más sencilla:

- [cachix/devenv](https://github.com/cachix/devenv)

Si no quieres escribir ni una sola línea de código de nix y solo quieres obtener un
entorno de desarrollo reproducible con el menor costo posible, aquí hay una herramienta
que podría cubrir tus necesidades:

- [jetpack-io/devbox](https://github.com/jetpack-io/devbox)

## Entorno de desarrollo para Python

El entorno de desarrollo para Python es mucho más engorroso en comparación con lenguajes
como Java o Go porque, por defecto, instala software en el entorno global. Para instalar
software para el proyecto actual, primero debes crear un entorno virtual (a diferencia de
lenguajes como JavaScript o Go, donde los entornos virtuales no son necesarios). Este
comportamiento es muy poco amigable para Nix.

Por defecto, cuando usas pip en Python, instala software globalmente. En NixOS, ejecutar
`pip install` directamente produce un error:

```bash
› pip install -r requirements.txt
error: externally-managed-environment

× This environment is externally managed
╰─> This command has been disabled as it tries to modify the immutable
    `/nix/store` filesystem.

    To use Python with Nix and nixpkgs, have a look at the online documentation:
    <https://nixos.org/manual/nixpkgs/stable/#python>.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
```

Según el mensaje de error, `pip install` está deshabilitado directamente por NixOS.
Incluso al intentar `pip install --user`, también se deshabilita. Para mejorar la
reproducibilidad del entorno, Nix elimina estos comandos por completo. Incluso si creamos
un entorno nuevo usando métodos como `mkShell`, estos comandos siguen fallando
(presumiblemente porque el comando pip en Nixpkgs se modificó para impedir que se ejecuten
instrucciones de modificación como `install`).

Sin embargo, muchos scripts de instalación de proyectos están basados en pip, lo que
significa que no pueden usarse directamente. Además, el contenido de nixpkgs es limitado y
faltan muchos paquetes de PyPI. Esto obliga a los usuarios a empaquetarlos por su cuenta,
lo que agrega mucha complejidad y carga mental.

Una solución es usar el entorno virtual `venv`. Dentro de un entorno virtual, puedes usar
comandos como pip con normalidad:

```shell
python -m venv ./env
source ./env/bin/activate
```

Otra opción es usar una herramienta de terceros llamada `virtualenv`, pero eso requiere
instalación adicional.

Para quienes todavía desconfían del venv creado directamente con Python, quizá prefieran
incluir el entorno virtual en `/nix/store` para hacerlo immutable. Esto puede lograrse
instalando directamente las dependencias de `requirements.txt` o `poetry.toml` con Nix. Ya
existen herramientas de empaquetado en Nix que ayudan con esto:

> Ten en cuenta que incluso en estos entornos, ejecutar directamente comandos como
> `pip install` seguirá fallando. Las dependencias de Python deben instalarse a través de
> `flake.nix` porque los datos residen en el directorio `/nix/store`, y estos comandos de
> modificación solo pueden ejecutarse durante la fase de construcción de Nix.

- [python venv demo](https://github.com/MordragT/nix-templates/blob/master/python-venv/flake.nix)
- [poetry2nix](https://github.com/nix-community/poetry2nix)

La ventaja de estas herramientas es que utilizan el mecanismo de bloqueo de Nix Flakes
para mejorar la reproducibilidad. Sin embargo, la desventaja es que añaden una capa extra
de abstracción, haciendo más complejo el sistema subyacente.

Finalmente, en algunos proyectos más complejos, ninguna de las soluciones anteriores puede
ser viable. En esos casos, la mejor opción es usar contenedores como Docker o Podman. Los
contenedores tienen menos restricciones que Nix y pueden ofrecer la mejor compatibilidad.
