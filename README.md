# Quoti CLI

A powerful CLI tool for creating, developing, and managing Quoti Extensions with support for Vue and React frameworks.

<!-- toc -->
* [Quoti CLI](#quoti-cli)
* [Commands](#commands)
* [Create a Vue extension (default)](#create-a-vue-extension-default)
* [Create a React extension](#create-a-react-extension)
<!-- tocstop -->
## Overview

Quoti CLI (`qt`) is a command-line interface tool designed to streamline the development of extensions for the Quoti platform. It provides a comprehensive set of commands to create, develop, test, and deploy your extensions easily.

### Key Features

- **Multi-Framework Support**: Create extensions using Vue or React frameworks
- **Seamless Development**: Live development with hot reloading
- **Easy Deployment**: Simple commands for deploying to Quoti environments
- **Database Integration**: Tools for model creation and field type synchronization
- **Marketplace Publishing**: Publish your extensions to the Quoti Marketplace

## Installation

```sh-session
$ npm install -g quoti-cli
```

## Usage

<!-- usage -->
```sh-session
$ npm install -g quoti-cli
$ qt COMMAND
running command...
$ qt (--version)
quoti-cli/1.2.11 darwin-arm64 node-v20.12.2
$ qt --help [COMMAND]
USAGE
  $ qt COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qt autocomplete [SHELL]`](#qt-autocomplete-shell)
* [`qt create [EXTENSIONDIRECTORY]`](#qt-create-extensiondirectory)
* [`qt d [ENTRYPOINTPATH]`](#qt-d-entrypointpath)
* [`qt db:create [MODELSDIRECTORY]`](#qt-dbcreate-modelsdirectory)
* [`qt db:syncFieldTypes`](#qt-dbsyncfieldtypes)
* [`qt deploy [ENTRYPOINTPATH]`](#qt-deploy-entrypointpath)
* [`qt dev [ENTRYPOINTPATH]`](#qt-dev-entrypointpath)
* [`qt download-current-version [FILEPATH]`](#qt-download-current-version-filepath)
* [`qt help [COMMANDS]`](#qt-help-commands)
* [`qt init`](#qt-init)
* [`qt l [ENTRYPOINTPATH]`](#qt-l-entrypointpath)
* [`qt link [ENTRYPOINTPATH]`](#qt-link-entrypointpath)
* [`qt link-extension [ENTRYPOINTPATH]`](#qt-link-extension-entrypointpath)
* [`qt login`](#qt-login)
* [`qt logout`](#qt-logout)
* [`qt p [ENTRYPOINTPATH]`](#qt-p-entrypointpath)
* [`qt publish [ENTRYPOINTPATH]`](#qt-publish-entrypointpath)
* [`qt s [ENTRYPOINTPATH]`](#qt-s-entrypointpath)
* [`qt serve [ENTRYPOINTPATH]`](#qt-serve-entrypointpath)

## `qt autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ qt autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  display autocomplete installation instructions

EXAMPLES
  $ qt autocomplete

  $ qt autocomplete bash

  $ qt autocomplete zsh

  $ qt autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v1.4.6/src/commands/autocomplete/index.ts)_

## `qt create [EXTENSIONDIRECTORY]`

Create a new extension (Vue or React) for your project

```
USAGE
  $ qt create [EXTENSIONDIRECTORY]

ARGUMENTS
  EXTENSIONDIRECTORY  Nome do diretório para a extensão (opcional). Se não fornecido, será derivado do nome da extensão
                      escolhido no prompt. A extensão será criada em ./src/pages/nome-do-diretorio.

DESCRIPTION
  Cria uma extensão vue para seu projeto
```

_See code: [src/commands/create.js](https://github.com/byndcloud/quoti-cli/blob/v1.2.11/src/commands/create.js)_

## `qt d [ENTRYPOINTPATH]`

Realiza deploy da sua extensão para o Quoti

```
USAGE
  $ qt d [ENTRYPOINTPATH] [-a | ] [-av | ] [--org <value>]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

FLAGS
  -a, --all          Realiza deploy de todas as extensões presente na propriedade quoti do package.json
  -a, --ask-version  Permite selecionar uma versão para o deploy quando a flag --all for passada também. Por padrão, um
                     timestamp será usado para identificar a versão.
      --org=<value>  Slug da organização

DESCRIPTION
  Realiza deploy da sua extensão para o Quoti

ALIASES
  $ qt d
```

## `qt db:create [MODELSDIRECTORY]`

Create all models present in the directory specified by the modelDirectory argument

```
USAGE
  $ qt db:create [MODELSDIRECTORY]

ARGUMENTS
  MODELSDIRECTORY  [default: ./src/models] Endereço onde será salvo sua extensão. (Endereço relativo a pasta
                   ./src/pages. Caso ./src/pages não exista o endereço fica relativo a raiz do projeto)

DESCRIPTION
  Cria todos os modelos presentes na pasta especificada pelo arg modelDirectory
```

_See code: [src/commands/db/create.js](https://github.com/byndcloud/quoti-cli/blob/v1.2.11/src/commands/db/create.js)_

## `qt db:syncFieldTypes`

Synchronize available field types for databases in the organization

```
USAGE
  $ qt db:syncFieldTypes

DESCRIPTION
  Sincroniza os tipos de campos disponíveis para databases presentes na organização
```

_See code: [src/commands/db/syncFieldTypes.js](https://github.com/byndcloud/quoti-cli/blob/v1.2.11/src/commands/db/syncFieldTypes.js)_

## `qt deploy [ENTRYPOINTPATH]`

Deploy your extension to Quoti

```
USAGE
  $ qt deploy [ENTRYPOINTPATH] [-a | ] [-av | ] [--org <value>]

ARGUMENTS
  ENTRYPOINTPATH  Path to the entry point (main file) of the extension

FLAGS
  -a, --all          Realiza deploy de todas as extensões presente na propriedade quoti do package.json
  -a, --ask-version  Permite selecionar uma versão para o deploy quando a flag --all for passada também. Por padrão, um
                     timestamp será usado para identificar a versão.
      --org=<value>  Slug da organização

DESCRIPTION
  Realiza deploy da sua extensão para o Quoti

ALIASES
  $ qt d
```

_See code: [src/commands/deploy.js](https://github.com/byndcloud/quoti-cli/blob/v1.2.11/src/commands/deploy.js)_

## `qt dev [ENTRYPOINTPATH]`

Observa mudanças no código local e as envia para o ambiente de desenvolvimento do Quoti

```
USAGE
  $ qt dev [ENTRYPOINTPATH] [--deploy-develop] [--new-session] [--org <value>]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

FLAGS
  --deploy-develop  Indica se devemos salvar o build da extensão de develop no banco de dados da Beyond Company
  --new-session     Força a criação de um novo devSessionId
  --org=<value>     Slug da organização

DESCRIPTION
  Observa mudanças no código local e as envia para o ambiente de desenvolvimento do Quoti

ALIASES
  $ qt s
  $ qt dev
```

## `qt download-current-version [FILEPATH]`

Download the active version of the extension

```
USAGE
  $ qt download-current-version [FILEPATH]

ARGUMENTS
  FILEPATH  [default: ./src/index.vue] Path to download the current version to

DESCRIPTION
  Baixa a versão da extensão ativa
  ...
```

_See code: [src/commands/download-current-version.js](https://github.com/byndcloud/quoti-cli/blob/v1.2.11/src/commands/download-current-version.js)_

## `qt help [COMMANDS]`

Display help for qt.

```
USAGE
  $ qt help [COMMANDS...] [-n]

ARGUMENTS
  COMMANDS...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for qt.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.20/src/commands/help.ts)_

## `qt init`

Initialize a new project for one or more Quoti extensions with support for Vue and React

```
USAGE
  $ qt init

DESCRIPTION
  Inicializa um projeto Vue para uma ou mais extensões do Quoti
```

_See code: [src/commands/init.js](https://github.com/byndcloud/quoti-cli/blob/v1.2.11/src/commands/init.js)_

## `qt l [ENTRYPOINTPATH]`

Faça um link de uma extensão no Quoti com o seu código

```
USAGE
  $ qt l [ENTRYPOINTPATH] [-b] [--org <value>]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

FLAGS
  -b, --[no-]build   Use (--build|-b) se você está selecionando uma extensão com build ou use --no-build se você está
                     selecionando uma extensão sem build
      --org=<value>  Slug da organização

DESCRIPTION
  Faça um link de uma extensão no Quoti com o seu código

ALIASES
  $ qt l
  $ qt link-extension
  $ qt link
```

## `qt link [ENTRYPOINTPATH]`

Link a Quoti extension with your local code

```
USAGE
  $ qt link [ENTRYPOINTPATH] [-b] [--org <value>]

ARGUMENTS
  ENTRYPOINTPATH  Path to the entry point (main file) of the extension

FLAGS
  -b, --[no-]build   Use (--build|-b) se você está selecionando uma extensão com build ou use --no-build se você está
                     selecionando uma extensão sem build
      --org=<value>  Slug da organização

DESCRIPTION
  Faça um link de uma extensão no Quoti com o seu código

ALIASES
  $ qt l
  $ qt link-extension
  $ qt link
```

_See code: [src/commands/link.js](https://github.com/byndcloud/quoti-cli/blob/v1.2.11/src/commands/link.js)_

## `qt link-extension [ENTRYPOINTPATH]`

Faça um link de uma extensão no Quoti com o seu código

```
USAGE
  $ qt link-extension [ENTRYPOINTPATH] [-b] [--org <value>]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

FLAGS
  -b, --[no-]build   Use (--build|-b) se você está selecionando uma extensão com build ou use --no-build se você está
                     selecionando uma extensão sem build
      --org=<value>  Slug da organização

DESCRIPTION
  Faça um link de uma extensão no Quoti com o seu código

ALIASES
  $ qt l
  $ qt link-extension
  $ qt link
```

## `qt login`

Log in to a Quoti organization

```
USAGE
  $ qt login [-f] [--org <value>] [--local]

FLAGS
  -f, --force        Força o login em uma nova conta
      --local        Utiliza credenciais locais (relativas ao diretório atual)
      --org=<value>  Slug da organização (multipla autenticação)

DESCRIPTION
  Realiza login em uma organização do Quoti
```

_See code: [src/commands/login.js](https://github.com/byndcloud/quoti-cli/blob/v1.2.11/src/commands/login.js)_

## `qt logout`

Logout from the current organization

```
USAGE
  $ qt logout

DESCRIPTION
  Logout from the current organization
```

_See code: [src/commands/logout.js](https://github.com/byndcloud/quoti-cli/blob/v1.2.11/src/commands/logout.js)_

## `qt p [ENTRYPOINTPATH]`

Publish a new extension or update an existing extension in the Marketplace

```
USAGE
  $ qt p [ENTRYPOINTPATH] [--org <value>] [-v <value>] [-p] [-m] [-M] [-o]

ARGUMENTS
  ENTRYPOINTPATH  Path to the entry point (main file) of the extension

FLAGS
  -M, --major            x.x.x -> x+1.x.x
  -m, --minor            x.x.x -> x.x+1.x
  -o, --orgs             Publique e instale a extensão apenas em organizações específicas. Ideal para versões em
                         homologação
  -p, --patch            x.x.x -> x.x.x+1
  -v, --version=<value>  Versão da extensão
      --org=<value>      Slug da organização

DESCRIPTION
  Publica uma nova extensão ou atualiza uma extensão já publicada no Marketplace

ALIASES
  $ qt p
```

## `qt publish [ENTRYPOINTPATH]`

Publica uma nova extensão ou atualiza uma extensão já publicada no Marketplace

```
USAGE
  $ qt publish [ENTRYPOINTPATH] [--org <value>] [-v <value>] [-p] [-m] [-M] [-o]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

FLAGS
  -M, --major            x.x.x -> x+1.x.x
  -m, --minor            x.x.x -> x.x+1.x
  -o, --orgs             Publique e instale a extensão apenas em organizações específicas. Ideal para versões em
                         homologação
  -p, --patch            x.x.x -> x.x.x+1
  -v, --version=<value>  Versão da extensão
      --org=<value>      Slug da organização

DESCRIPTION
  Publica uma nova extensão ou atualiza uma extensão já publicada no Marketplace

ALIASES
  $ qt p
```

_See code: [src/commands/publish.js](https://github.com/byndcloud/quoti-cli/blob/v1.2.11/src/commands/publish.js)_

## `qt s [ENTRYPOINTPATH]`

Observa mudanças no código local e as envia para o ambiente de desenvolvimento do Quoti

```
USAGE
  $ qt s [ENTRYPOINTPATH] [--deploy-develop] [--new-session] [--org <value>]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

FLAGS
  --deploy-develop  Indica se devemos salvar o build da extensão de develop no banco de dados da Beyond Company
  --new-session     Força a criação de um novo devSessionId
  --org=<value>     Slug da organização

DESCRIPTION
  Observa mudanças no código local e as envia para o ambiente de desenvolvimento do Quoti

ALIASES
  $ qt s
  $ qt dev
```

## `qt serve [ENTRYPOINTPATH]`

Watch for changes in local code and send them to the Quoti development environment

```
USAGE
  $ qt serve [ENTRYPOINTPATH] [--deploy-develop] [--new-session] [--org <value>]

ARGUMENTS
  ENTRYPOINTPATH  Path to the entry point (main file) of the extension

FLAGS
  --deploy-develop  Indica se devemos salvar o build da extensão de develop no banco de dados da Beyond Company
  --new-session     Força a criação de um novo devSessionId
  --org=<value>     Slug da organização

DESCRIPTION
  Observa mudanças no código local e as envia para o ambiente de desenvolvimento do Quoti

ALIASES
  $ qt s
  $ qt dev
```

_See code: [src/commands/serve.js](https://github.com/byndcloud/quoti-cli/blob/v1.2.11/src/commands/serve.js)_
<!-- commandsstop -->

## Getting Started

### Create a New Project

To start a new Quoti extension project:

```sh
$ qt init
```

Follow the prompts to set up your project. You can choose between Vue and React frameworks.

### Create an Extension

Create a new extension using either Vue or React:

```sh
# Create a Vue extension (default)
$ qt create my-extension

# Create a React extension
$ qt create my-extension --framework=react
```

### Development

During development, you can use the serve command to automatically update your extension in the Quoti development environment:

```sh
$ qt serve src/pages/my-extension/App.vue  # For Vue
$ qt serve src/pages/my-extension/App.jsx  # For React
```

### Deployment

When you're ready to deploy your extension:

```sh
$ qt deploy src/pages/my-extension/App.vue  # For Vue
$ qt deploy src/pages/my-extension/App.jsx  # For React
```

### Publishing to Marketplace

To make your extension available in the Quoti Marketplace:

```sh
$ qt publish src/pages/my-extension/App.vue -m  # Increment minor version
```

## Project Configuration

You can configure multiple extensions in your `package.json` file:

```json
{
  "quoti": {
    "extensions": [
      "src/pages/extension1/App.vue",
      "src/pages/extension2/App.jsx"
    ]
  }
}
```

This allows you to deploy all extensions at once using the `--all` flag:

```sh
$ qt deploy --all
```

## Additional Resources

- [Quoti Documentation](https://docs.quoti.cloud)
- [GitHub Repository](https://github.com/byndcloud/quoti-cli)

## License

MIT
