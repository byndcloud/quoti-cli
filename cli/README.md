cliv2
=====

A Quoti Extensions LCI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/cliv2.svg)](https://npmjs.org/package/cliv2)
[![Downloads/week](https://img.shields.io/npm/dw/cliv2.svg)](https://npmjs.org/package/cliv2)
[![License](https://img.shields.io/npm/l/cliv2.svg)](https://github.com/nmf2/cliv2/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g cliv2
$ qt COMMAND
running command...
$ qt (-v|--version|version)
cliv2/0.0.0 linux-x64 node-v14.15.4
$ qt --help [COMMAND]
USAGE
  $ qt COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qt hello`](#qt-hello)
* [`qt help [COMMAND]`](#qt-help-command)

## `qt hello`

Describe the command here

```
USAGE
  $ qt hello

OPTIONS
  -n, --name=name  name to print

DESCRIPTION
  ...
  Extra documentation goes here
```

_See code: [src/commands/hello.js](https://github.com/nmf2/cliv2/blob/v0.0.0/src/commands/hello.js)_

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
<!-- commandsstop -->
