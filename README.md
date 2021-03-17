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
quoti-cli/0.0.11 linux-x64 node-v14.15.0
$ qt --help [COMMAND]
USAGE
  $ qt COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qt deploy FILEPATH`](#qt-deploy-filepath)
* [`qt downloadCurrentVersion [FILEPATH]`](#qt-downloadcurrentversion-filepath)
* [`qt help [COMMAND]`](#qt-help-command)
* [`qt selectExtension`](#qt-selectextension)
* [`qt serve [FILEPATH]`](#qt-serve-filepath)

## `qt deploy FILEPATH`

Deploy your extension

```
USAGE
  $ qt deploy FILEPATH

ARGUMENTS
  FILEPATH  The path to a file to deploy

DESCRIPTION
  ...
  Deploy specify document to your application
```

_See code: [src/commands/deploy.js](https://github.com/byndcloud/quoti-cli/blob/v0.0.11/src/commands/deploy.js)_

## `qt downloadCurrentVersion [FILEPATH]`

Download your extension active

```
USAGE
  $ qt downloadCurrentVersion [FILEPATH]

ARGUMENTS
  FILEPATH  [default: ./src/index.vue] Download current version

DESCRIPTION
  ...
```

_See code: [src/commands/downloadCurrentVersion.js](https://github.com/byndcloud/quoti-cli/blob/v0.0.11/src/commands/downloadCurrentVersion.js)_

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

## `qt selectExtension`

Select your extension to work

```
USAGE
  $ qt selectExtension
```

_See code: [src/commands/selectExtension.js](https://github.com/byndcloud/quoti-cli/blob/v0.0.11/src/commands/selectExtension.js)_

## `qt serve [FILEPATH]`

Create local serve and Upload file automatically

```
USAGE
  $ qt serve [FILEPATH]

ARGUMENTS
  FILEPATH  [default: ./src/index.vue] The path to a file to deploy

DESCRIPTION
  ...
  A local serve to upload your file automatically
```

_See code: [src/commands/serve.js](https://github.com/byndcloud/quoti-cli/blob/v0.0.11/src/commands/serve.js)_
<!-- commandsstop -->
