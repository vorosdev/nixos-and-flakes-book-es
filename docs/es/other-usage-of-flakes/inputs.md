# Flake Inputs

La sección `inputs` en `flake.nix` es un conjunto de atributos usado para especificar las
dependencies del flake actual. Hay various tipos de entradas, como muestran los ejemplos
de abajo:

> Consulta la documentación official para más detalles - [Flakes Inputs - Nix Manual].

```nix
{
  inputs = {
    # Repositorio de GitHub como fuente de datos, especificando la rama master.
    # Este es el formato de entrada más común.
    nixpkgs.url = "github:Mic92/nixpkgs/master";
    # URL Git, applicable a cualquier repositorio Git que use el protocolo https/ssh.
    git-example.url = "git+https://git.somehost.tld/user/path?ref=branch";
    # URL Git por etiqueta, applicable a cualquier repositorio Git que use el protocolo https/ssh.
    git-example-tag.url = "git+https://git.somehost.tld/user/path?tag=x.y.x";
    # URL de GitHub por pull request.
    git-pr.url = "github:NixOS/nixpkgs/pull/349351/head";
    # URL Git con submódulos, applicable a cualquier repositorio Git que use el protocolo https/ssh.
    git-example-submodule.url = "git+https://git.somehost.tld/user/path?submodules=1";
    # URL de archivo comprimido, necesaria si tu entrada usa LFS.
    # La entrada Git normal no soporta LFS antes de nix 2.27
    git-example-lfs.url = "https://codeberg.org/solver-orgz/treedome/archive/master.tar.gz";
    # A partir de nix 2.27, puedes usar una URL como la siguiente para habilitar git LFS en una entrada del flake
    treedome.url = "git+https://codeberg.org/solver-orgz/treedome?ref=master&lfs=1";
    # Similar a obtener un repositorio Git, pero usando el protocolo ssh
    # con autenticación por clave. También usa el parámetro shallow=1
    # para evitar copiar el directorio .git.
    ssh-git-example.url = "git+ssh://git@github.com/ryan4yin/nix-secrets.git?shallow=1";
    # También es possible depender directamente de un repositorio Git local.
    git-directory-example.url = "git+file:///path/to/repo?shallow=1";
    # Usando el parámetro `dir` para especificar un subdirectorio.
    nixpkgs.url = "github:foo/bar?dir=shu";
    # Carpeta local (si usas una ruta absoluta, el prefijo 'path:' se puede omitir).
    directory-example.url = "path:/path/to/repo";

    # Si la fuente de datos no es un flake, establece flake=false.
    # `flake=false` suele usarse para incluir código fuente adicional,
    #   archivos de configuración, etc.
    # En código Nix, puedes referenciar directamente archivos dentro
    #   de él usando la notación "${inputs.bar}/xxx/xxx".
    # Por ejemplo, importa "${inputs.bar}/xxx/xxx.nix" para importar un archivo nix específico,
    # o usa "${inputs.bar}/xx/xx" como parámetro de ruta para ciertas opciones.
    bar = {
      url = "github:foo/bar/branch";
      flake = false;
    };

    sops-nix = {
      url = "github:Mic92/sops-nix";
      # `follows` es la sintaxis de herencia dentro de inputs.
      # Aquí asegura que `inputs.nixpkgs` de sops-nix coincida con
      # `inputs.nixpkgs` del flake actual,
      # evitando inconsistencies en la versión de nixpkgs de la dependencia.
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # Bloquea el flake a un commit específico.
    nix-doom-emacs = {
      url = "github:vlaci/nix-doom-emacs?rev=238b18d7b2c8239f676358634bfb32693d3706f3";
      flake = false;
    };
  };

  outputs = { self, ... }@inputs: { ... };
}
```

## Referencias

- [Flakes Inputs - Nix Manual]

[Flakes Inputs - Nix Manual]:
  https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake.html#flake-inputs
