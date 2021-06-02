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
quoti-cli/0.1.2 linux-x64 node-v14.16.0
$ qt --help [COMMAND]
USAGE
  $ qt COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qt deploy FILEPATH`](#qt-deploy-filepath)
* [`qt download-current-version [FILEPATH]`](#qt-download-current-version-filepath)
* [`qt help [COMMAND]`](#qt-help-command)
* [`qt login`](#qt-login)
* [`qt logout`](#qt-logout)
* [`qt select-extension`](#qt-select-extension)
* [`qt serve [FILEPATH]`](#qt-serve-filepath)

## `qt deploy FILEPATH`

Deploy your extension

```
USAGE
  $ qt deploy FILEPATH

ARGUMENTS
  FILEPATH  [default: ./src/App.vue] The path to a file to deploy

DESCRIPTION
  ...
  Deploy specify document to your application
```

_See code: [src/commands/deploy.js](https://github.com/byndcloud/quoti-cli/blob/v0.1.2/src/commands/deploy.js)_

## `qt download-current-version [FILEPATH]`

Download your extension active

```
USAGE
  $ qt download-current-version [FILEPATH]

ARGUMENTS
  FILEPATH  [default: ./src/index.vue] Download current version

DESCRIPTION
  ...
```

_See code: [src/commands/download-current-version.js](https://github.com/byndcloud/quoti-cli/blob/v0.1.2/src/commands/download-current-version.js)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.1/src/commands/help.ts)_

## `qt login`

Logout from the current organization

```
USAGE
  $ qt login
```

_See code: [src/commands/login.js](https://github.com/byndcloud/quoti-cli/blob/v0.1.2/src/commands/login.js)_

## `qt logout`

Logout from the current organization

```
USAGE
  $ qt logout
```

_See code: [src/commands/logout.js](https://github.com/byndcloud/quoti-cli/blob/v0.1.2/src/commands/logout.js)_

## `qt select-extension`

Select your extension to work

```
USAGE
  $ qt select-extension
```

_See code: [src/commands/select-extension.js](https://github.com/byndcloud/quoti-cli/blob/v0.1.2/src/commands/select-extension.js)_

## `qt serve [FILEPATH]`

Create local serve and Upload file automatically

```
USAGE
  $ qt serve [FILEPATH]

ARGUMENTS
  FILEPATH  [default: ./src/App.vue] The path to a file to build

DESCRIPTION
  ...
  A local serve to upload your file automatically
```

_See code: [src/commands/serve.js](https://github.com/byndcloud/quoti-cli/blob/v0.1.2/src/commands/serve.js)_
<!-- commandsstop -->
