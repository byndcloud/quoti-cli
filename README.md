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
quoti-cli/0.3.0-beta.1 linux-x64 node-v14.18.2
$ qt --help [COMMAND]
USAGE
  $ qt COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qt deploy [ENTRYPOINTPATH]`](#qt-deploy-entrypointpath)
* [`qt download-current-version [FILEPATH]`](#qt-download-current-version-filepath)
* [`qt help [COMMAND]`](#qt-help-command)
* [`qt login`](#qt-login)
* [`qt logout`](#qt-logout)
* [`qt publish [ENTRYPOINTPATH]`](#qt-publish-entrypointpath)
* [`qt select-extension [ENTRYPOINTPATH]`](#qt-select-extension-entrypointpath)
* [`qt serve [ENTRYPOINTPATH]`](#qt-serve-entrypointpath)

## `qt deploy [ENTRYPOINTPATH]`

Deploy sua extensão

```
USAGE
  $ qt deploy [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

DESCRIPTION
  ...
  Deploy sua extensão
```

_See code: [src/commands/deploy.js](https://github.com/byndcloud/quoti-cli/blob/v0.3.0-beta.1/src/commands/deploy.js)_

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

_See code: [src/commands/download-current-version.js](https://github.com/byndcloud/quoti-cli/blob/v0.3.0-beta.1/src/commands/download-current-version.js)_

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

## `qt login`

Realiza login em uma organização do Quoti

```
USAGE
  $ qt login
```

_See code: [src/commands/login.js](https://github.com/byndcloud/quoti-cli/blob/v0.3.0-beta.1/src/commands/login.js)_

## `qt logout`

Logout from the current organization

```
USAGE
  $ qt logout
```

_See code: [src/commands/logout.js](https://github.com/byndcloud/quoti-cli/blob/v0.3.0-beta.1/src/commands/logout.js)_

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

_See code: [src/commands/publish.js](https://github.com/byndcloud/quoti-cli/blob/v0.3.0-beta.1/src/commands/publish.js)_

## `qt select-extension [ENTRYPOINTPATH]`

Selecione sua extensão para desenvolvimento

```
USAGE
  $ qt select-extension [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

OPTIONS
  -b, --[no-]build  Use build se você está selecionando uma extensão com build ou use no-build se você está selecionando
                    uma extensão sem build
```

_See code: [src/commands/select-extension.js](https://github.com/byndcloud/quoti-cli/blob/v0.3.0-beta.1/src/commands/select-extension.js)_

## `qt serve [ENTRYPOINTPATH]`

Cria um serve local e realiza upload automaticamente para o Quoti

```
USAGE
  $ qt serve [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Endereço do entry point (arquivo principal) da extensão

DESCRIPTION
  ...
  Cria um serve local e realiza upload automaticamente para o Quoti
```

_See code: [src/commands/serve.js](https://github.com/byndcloud/quoti-cli/blob/v0.3.0-beta.1/src/commands/serve.js)_
<!-- commandsstop -->
