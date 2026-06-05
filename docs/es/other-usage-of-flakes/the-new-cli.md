# Uso de la nueva CLI

Una vez que hayas habilitado las características `nix-command` y `flakes`, puedes empezar
a usar las nuevas herramientas de línea de commandos de Nix de nueva generación que ofrece
[New Nix Commands][New Nix Commands]. En esta sección nos centraremos en dos commandos:
`nix shell` y `nix run`. Otros commandos importantes como `nix build` se tratarán en
detalle en [`nix develop` & `pkgs.mkShell`](/development/intro.md)

## `nix shell`

El commando `nix shell` te permite entrar en un entorno con el paquete de Nix especificado
y abre una shell interactiva dentro de ese entorno:

```shell
# hello no está disponible
› hello
hello: command not found

# Entra en un entorno con los paquetes 'hello' y `cowsay`
› nix shell nixpkgs#hello nixpkgs#cowsay

# hello ya está disponible
› hello
Hello, world!

# cowsay también está disponible
› cowsay "Hello, world!"
 _______
< hello >
 -------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

## `nix run`

Por otro lado, `nix run` crea un entorno con el paquete de Nix especificado y ejecuta ese
paquete directamente dentro del entorno (sin instalarlo en el entorno del sistema):

```shell
# hello no está disponible
› hello
hello: command not found

# Crea un entorno con el paquete 'hello' y ejecútalo
› nix run nixpkgs#hello
Hello, world!
```

Como `nix run` ejecuta directamente el paquete de Nix, el paquete especificado como
argumento debe generar un program ejecutable.

Según la documentación de `nix run --help`, `nix run` ejecuta el commando
`<out>/bin/<name>`, donde `<out>` es el directorio raíz de la derivación y `<name>` se
selecciona en el siguiente orden:

- El atributo `meta.mainProgram` de la derivación
- El atributo `pname` de la derivación
- El contenido del atributo `name` de la derivación sin el número de versión

Por ejemplo, en el caso del paquete `hello` que probamos antes, `nix run` ejecuta en
realidad el program `$out/bin/hello`.

Aquí tienes dos ejemplos más con explicaciones detalladas de los parámetros relevantes:

```bash
# Explicación del commando:
#   `nixpkgs#ponysay` significa el paquete 'ponysay' en el flake 'nixpkgs'.
#   `nixpkgs` es un id del registro de flakes, y Nix encontrará la dirección correspondiente del repositorio GitHub
#   en <https://github.com/NixOS/flake-registry/blob/master/flake-registry.json>.
# Por lo tanto, este commando crea un nuevo entorno, instala y ejecuta el paquete 'ponysay' proporcionado por el flake 'nixpkgs'.
#   Nota: ya se mencionó antes que un paquete de Nix es una de las salidas de un flake.
echo "Hello Nix" | nix run "nixpkgs#ponysay"

# Este commando tiene el mismo efecto que el anterior, pero usa la URI completa del flake en lugar del id del registro de flakes.
echo "Hello Nix" | nix run "github:NixOS/nixpkgs/nixos-unstable#ponysay"
```

## Casos de uso comunes de `nix run` y `nix shell`

Estos commandos se usan comúnmente para ejecutar programs de forma temporal. Por ejemplo,
si quiero clonar mi repositorio de configuración con Git en un nuevo host NixOS que no
tiene Git instalado, puedo usar el siguiente commando:

```bash
nix run nixpkgs#git clone git@github.com:ryan4yin/nix-config.git
```

También puedo usar `nix shell` para entrar en un entorno con Git y luego ejecutar el
commando `git clone`:

```bash
nix shell nixpkgs#git
git clone git@github.com:ryan4yin/nix-config.git
```

[New Nix Commands]: https://nixos.org/manual/nix/stable/command-ref/new-cli/nix.html
