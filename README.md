Quoti ClI
=====

A Quoti Extensions LCI

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g quoti-cli
$ qt COMMAND
running command...
$ qt (-v|--version|version)
quoti-cli/0.8.0 linux-x64 node-v14.19.3
$ qt --help [COMMAND]
USAGE
  $ qt COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qt autocomplete [SHELL]`](#qt-autocomplete-shell)
* [`qt create EXTENSIONDIRECTORY`](#qt-create-extensiondirectory)
* [`qt deploy [ENTRYPOINTPATH]`](#qt-deploy-entrypointpath)
* [`qt download-current-version [FILEPATH]`](#qt-download-current-version-filepath)
* [`qt help [COMMAND]`](#qt-help-command)
* [`qt init`](#qt-init)
* [`qt link [ENTRYPOINTPATH]`](#qt-link-entrypointpath)
* [`qt login`](#qt-login)
* [`qt logout`](#qt-logout)
* [`qt publish [ENTRYPOINTPATH]`](#qt-publish-entrypointpath)
* [`qt serve [ENTRYPOINTPATH]`](#qt-serve-entrypointpath)

## `qt autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ qt autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ qt autocomplete
  $ qt autocomplete bash
  $ qt autocomplete zsh
  $ qt autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v1.3.0/src/commands/autocomplete/index.ts)_

## `qt create EXTENSIONDIRECTORY`

Cria uma extensão vue para seu projeto

```
USAGE
  $ qt create EXTENSIONDIRECTORY

ARGUMENTS
  EXTENSIONDIRECTORY  Endereço relativo a pasta ./src/pages onde será salvo sua extensão. Caso não exista a pasta
                      ./src/pages o endereço fica relativo a raiz do projeto
```

_See code: [src/commands/create.js](https://github.com/byndcloud/quoti-cli/blob/v0.8.0/src/commands/create.js)_

## `qt deploy [ENTRYPOINTPATH]`

Realiza deploy da sua extensão para o Quoti

```
USAGE
  $ qt deploy [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

OPTIONS
  -a, --all          Realiza deploy de todas as extensões presente na propriedade quoti do package.json

  -a, --ask-version  Permite selecionar uma versão para o deploy quando a flag --all for passada também. Por padrão, um
                     timestamp será usado para identificar a versão.

ALIASES
  $ qt d
```

_See code: [src/commands/deploy.js](https://github.com/byndcloud/quoti-cli/blob/v0.8.0/src/commands/deploy.js)_

## `qt download-current-version [FILEPATH]`

Baixa a versão da extensão ativa

```
USAGE
  $ qt download-current-version [FILEPATH]

ARGUMENTS
  FILEPATH  [default: ./src/index.vue] Download current version

DESCRIPTION
  ...
```

_See code: [src/commands/download-current-version.js](https://github.com/byndcloud/quoti-cli/blob/v0.8.0/src/commands/download-current-version.js)_

## `qt help [COMMAND]`

display help for qt

```
USAGE
  $ qt help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.18/src/commands/help.ts)_

## `qt init`

Inicializa um projeto Vue para uma ou mais extensões do Quoti

```
USAGE
  $ qt init
```

_See code: [src/commands/init.js](https://github.com/byndcloud/quoti-cli/blob/v0.8.0/src/commands/init.js)_

## `qt link [ENTRYPOINTPATH]`

Faça um link de uma extensão no Quoti com o seu código

```
USAGE
  $ qt link [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

OPTIONS
  -b, --[no-]build  Use (--build|-b) se você está selecionando uma extensão com build ou use --no-build se você está
                    selecionando uma extensão sem build

ALIASES
  $ qt l
  $ qt link-extension
  $ qt select-extension
```

_See code: [src/commands/link.js](https://github.com/byndcloud/quoti-cli/blob/v0.8.0/src/commands/link.js)_

## `qt login`

Realiza login em uma organização do Quoti

```
USAGE
  $ qt login
```

_See code: [src/commands/login.js](https://github.com/byndcloud/quoti-cli/blob/v0.8.0/src/commands/login.js)_

## `qt logout`

Logout from the current organization

```
USAGE
  $ qt logout
```

_See code: [src/commands/logout.js](https://github.com/byndcloud/quoti-cli/blob/v0.8.0/src/commands/logout.js)_

## `qt publish [ENTRYPOINTPATH]`

Publica uma nova extensão ou atualiza uma extensão já publicada no Marketplace

```
USAGE
  $ qt publish [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

OPTIONS
  -M, --major            x.x.x -> x+1.x.x
  -m, --minor            x.x.x -> x.x+1.x
  -p, --patch            x.x.x -> x.x.x+1
  -v, --version=version  Versão da extensão

ALIASES
  $ qt p
```

_See code: [src/commands/publish.js](https://github.com/byndcloud/quoti-cli/blob/v0.8.0/src/commands/publish.js)_

## `qt serve [ENTRYPOINTPATH]`

Observa mudanças no código local e as envia para o ambiente de desenvolvimento do Quoti

```
USAGE
  $ qt serve [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

OPTIONS
  --deploy-develop  Indica se devemos salvar o build da extensão de develop no banco de dados da Beyond Company
  --new-session     Força a criação de um novo devSessionId

ALIASES
  $ qt s
  $ qt dev
```

_See code: [src/commands/serve.js](https://github.com/byndcloud/quoti-cli/blob/v0.8.0/src/commands/serve.js)_
<!-- commandsstop -->
