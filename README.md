# Quoti CLI

A powerful CLI tool for creating, developing, and managing Quoti Extensions with support for Vue and React frameworks.

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
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
$ qt (-v|--version|version)
quoti-cli/1.2.0 darwin-arm64 node-v20.16.0
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
* [`qt db:create [MODELSDIRECTORY]`](#qt-dbcreate-modelsdirectory)
* [`qt db:syncFieldTypes`](#qt-dbsyncfieldtypes)
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

Create a new extension (Vue or React) for your project

```
USAGE
  $ qt create EXTENSIONDIRECTORY

ARGUMENTS
  EXTENSIONDIRECTORY  Relative path to the ./src/pages directory where your extension will be saved. If the ./src/pages
                      directory doesn't exist, the path will be relative to the project root

OPTIONS
  --framework=vue|react  Framework to use for the extension (defaults to Vue if not specified)

EXAMPLES
  $ qt create my-extension
  $ qt create my-extension --framework=react
```

_See code: [src/commands/create.js](https://github.com/byndcloud/quoti-cli/blob/v1.1.0/src/commands/create.js)_

## `qt db:create [MODELSDIRECTORY]`

Create all models present in the directory specified by the modelDirectory argument

```
USAGE
  $ qt db:create [MODELSDIRECTORY]

ARGUMENTS
  MODELSDIRECTORY  [default: ./src/models] Directory where your models are located. (Path relative to the
                   ./src/pages directory. If ./src/pages doesn't exist, the path will be relative to the project root)
```

_See code: [src/commands/db/create.js](https://github.com/byndcloud/quoti-cli/blob/v1.1.0/src/commands/db/create.js)_

## `qt db:syncFieldTypes`

Synchronize available field types for databases in the organization

```
USAGE
  $ qt db:syncFieldTypes
```

_See code: [src/commands/db/syncFieldTypes.js](https://github.com/byndcloud/quoti-cli/blob/v1.1.0/src/commands/db/syncFieldTypes.js)_

## `qt deploy [ENTRYPOINTPATH]`

Deploy your extension to Quoti

```
USAGE
  $ qt deploy [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Path to the entry point (main file) of the extension

OPTIONS
  -a, --all          Deploy all extensions listed in the quoti property of package.json

  -a, --ask-version  Allow selecting a version for deployment when the --all flag is also passed. By default,
                     a timestamp will be used to identify the version

  --org=org          Organization slug

ALIASES
  $ qt d
```

_See code: [src/commands/deploy.js](https://github.com/byndcloud/quoti-cli/blob/v1.1.0/src/commands/deploy.js)_

## `qt download-current-version [FILEPATH]`

Download the active version of the extension

```
USAGE
  $ qt download-current-version [FILEPATH]

ARGUMENTS
  FILEPATH  [default: ./src/index.vue] Path to download the current version to

DESCRIPTION
  Downloads the currently active version of your extension from Quoti to your local environment
```

_See code: [src/commands/download-current-version.js](https://github.com/byndcloud/quoti-cli/blob/v1.1.0/src/commands/download-current-version.js)_

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

Initialize a new project for one or more Quoti extensions with support for Vue and React

```
USAGE
  $ qt init

OPTIONS
  --framework=vue|react  Set the default framework for the project (defaults to Vue if not specified)

DESCRIPTION
  Initializes a new project for Quoti extensions with all necessary configurations and dependencies.
  You can choose between Vue and React frameworks for your extensions.
```

_See code: [src/commands/init.js](https://github.com/byndcloud/quoti-cli/blob/v1.1.0/src/commands/init.js)_

## `qt link [ENTRYPOINTPATH]`

Link a Quoti extension with your local code

```
USAGE
  $ qt link [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Path to the entry point (main file) of the extension

OPTIONS
  -b, --[no-]build  Use (--build|-b) if you are selecting an extension with build or use --no-build if you are
                    selecting an extension without build

  --org=org         Organization slug

ALIASES
  $ qt l
  $ qt link-extension
  $ qt link
```

_See code: [src/commands/link.js](https://github.com/byndcloud/quoti-cli/blob/v1.1.0/src/commands/link.js)_

## `qt login`

Log in to a Quoti organization

```
USAGE
  $ qt login

OPTIONS
  -f, --force  Force login to a new account
  --local      Use local credentials (relative to the current directory)
  --org=org    Organization slug (multiple authentication)
```

_See code: [src/commands/login.js](https://github.com/byndcloud/quoti-cli/blob/v1.1.0/src/commands/login.js)_

## `qt logout`

Logout from the current organization

```
USAGE
  $ qt logout
```

_See code: [src/commands/logout.js](https://github.com/byndcloud/quoti-cli/blob/v1.1.0/src/commands/logout.js)_

## `qt publish [ENTRYPOINTPATH]`

Publish a new extension or update an existing extension in the Marketplace

```
USAGE
  $ qt publish [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Path to the entry point (main file) of the extension

OPTIONS
  -M, --major            x.x.x -> x+1.x.x
  -m, --minor            x.x.x -> x.x+1.x

  -o, --orgs             Publish and install the extension only in specific organizations. Ideal for staging versions

  -p, --patch            x.x.x -> x.x.x+1

  -v, --version=version  Extension version

  --org=org              Organization slug

ALIASES
  $ qt p
```

_See code: [src/commands/publish.js](https://github.com/byndcloud/quoti-cli/blob/v1.1.0/src/commands/publish.js)_

## `qt serve [ENTRYPOINTPATH]`

Watch for changes in local code and send them to the Quoti development environment

```
USAGE
  $ qt serve [ENTRYPOINTPATH]

ARGUMENTS
  ENTRYPOINTPATH  Path to the entry point (main file) of the extension

OPTIONS
  --deploy-develop  Indicates whether to save the development build of the extension in the Beyond Company database
  --new-session     Force the creation of a new devSessionId
  --org=org         Organization slug

ALIASES
  $ qt s
  $ qt dev
```

_See code: [src/commands/serve.js](https://github.com/byndcloud/quoti-cli/blob/v1.1.0/src/commands/serve.js)_
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
