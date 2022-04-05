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
quoti-cli/0.6.0-beta.0 linux-x64 node-v14.19.0
$ qt --help [COMMAND]
USAGE
  $ qt COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qt autocomplete [SHELL]`](#qt-autocomplete-shell)
* [`qt deploy [ENTRYPOINTPATH]`](#qt-deploy-entrypointpath)
* [`qt download-current-version [FILEPATH]`](#qt-download-current-version-filepath)
* [`qt help [COMMAND]`](#qt-help-command)
* [`qt link-extension [ENTRYPOINTPATH]`](#qt-link-extension-entrypointpath)
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

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v1.2.0/src/commands/autocomplete/index.ts)_

## `qt deploy [ENTRYPOINTPATH]`

Realiza deploy da sua extensão para o Quoti

```
USAGE
  $ qt deploy [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão
```

_See code: [src/commands/deploy.js](https://github.com/byndcloud/quoti-cli/blob/v0.6.0-beta.0/src/commands/deploy.js)_

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

_See code: [src/commands/download-current-version.js](https://github.com/byndcloud/quoti-cli/blob/v0.6.0-beta.0/src/commands/download-current-version.js)_

## `qt help [COMMAND]`

Display help for qt.

```
USAGE
  $ qt help [COMMAND]

ARGUMENTS
  COMMAND  Command to show help for.

OPTIONS
  -n, --nested-commands  Include all nested commands in the output.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.12/src/commands/help.ts)_

## `qt link-extension [ENTRYPOINTPATH]`

Faça um link de uma extensão no Quoti com o seu código

```
USAGE
  $ qt link-extension [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

OPTIONS
  -b, --[no-]build  Use (--build|-b) se você está selecionando uma extensão com build ou use --no-build se você está
                    selecionando uma extensão sem build

ALIASES
  $ qt select-extension
```

_See code: [src/commands/link-extension.js](https://github.com/byndcloud/quoti-cli/blob/v0.6.0-beta.0/src/commands/link-extension.js)_

## `qt login`

Realiza login em uma organização do Quoti

```
USAGE
  $ qt login
```

_See code: [src/commands/login.js](https://github.com/byndcloud/quoti-cli/blob/v0.6.0-beta.0/src/commands/login.js)_

## `qt logout`

Logout from the current organization

```
USAGE
  $ qt logout
```

_See code: [src/commands/logout.js](https://github.com/byndcloud/quoti-cli/blob/v0.6.0-beta.0/src/commands/logout.js)_

## `qt publish [ENTRYPOINTPATH]`

Publica uma nova extensão

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
```

_See code: [src/commands/publish.js](https://github.com/byndcloud/quoti-cli/blob/v0.6.0-beta.0/src/commands/publish.js)_

## `qt serve [ENTRYPOINTPATH]`

Cria um serve local e realiza upload automaticamente para o Quoti

```
USAGE
  $ qt serve [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

OPTIONS
  --deploy-develop  Indica se devemos salvar o build da extensão de develop no banco de dados da Beyond Company
  --new-session     Força a criação de um novo devSessionId

DESCRIPTION
  ...
  Cria um serve local e realiza upload automaticamente para o Quoti
```

_See code: [src/commands/serve.js](https://github.com/byndcloud/quoti-cli/blob/v0.6.0-beta.0/src/commands/serve.js)_
<!-- commandsstop -->
