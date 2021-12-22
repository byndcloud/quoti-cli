const path = require('path')
const ora = require('ora')
const chalk = require('chalk')
const { union } = require('lodash')
const inquirer = require('inquirer')
const readJSON = require('json-file-plus')
const readPkgSync = require('read-pkg-up').sync
const inquirerFileTreeSelection = require('inquirer-file-tree-selection-prompt')

const { merge } = require('lodash')
const { readdirSync, existsSync } = require('fs')
const { default: Command, flags } = require('@oclif/command')

const { app } = require('../config/firebase')

const credentials = require('../config/credentials')
const api = require('../config/axios')
const JSONManager = require('../config/JSONManager')

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection)

class SelectExtensionCommand extends Command {
  constructor () {
    super(...arguments)
    const pkgInfo = readPkgSync()
    if (pkgInfo) {
      this.projectRoot = path.resolve(path.dirname(pkgInfo.path))
      this.packageJsonPath = pkgInfo.path
    } else {
      this.projectRoot = process.cwd()
    }
  }

  async run () {
    try {
      const { args, flags } = this.parse(SelectExtensionCommand)

      if (args.entryPointPath && !existsSync(args.entryPointPath)) {
        throw new Error(
          `The given extension entrypoint file wasn't found at '${args.entryPointPath}', make sure the file exists`
        )
      }

      if (args.entryPointPath && !args.entryPointPath.endsWith('.vue')) {
        throw new Error(`The extension entrypoint file must be a .vue file`)
      }

      if (!this.packageJsonPath && flags.build === true) {
        throw new Error(
          'To select an extension with build you have to be in a Vue project with a package.json file'
        )
      }

      const { selectedEntryPoint } = await inquirer.prompt([
        {
          name: 'selectedEntryPoint',
          message: 'Which file is the entry point (main file) to your extension?',
          type: 'file-tree-selection',
          validate: file => file.endsWith('.vue'),
          hideRoot: true,
          when: !args.entryPointPath
        }
      ])

      const spinner = ora({
        text: 'Fetching extensions',
        spinner: 'dots3'
      }).start()

      const extensions = await this.listExtensions(
        credentials.institution,
        flags.build
      ).catch(err => {
        spinner.fail('Failed loading extensions')
        throw err
      })

      if (extensions.length === 0) {
        spinner.fail("Couldn't find any extensions")
        return
      }

      spinner.succeed('Got extensions list!')
      const extensionsChoices = extensions.map(ext => ({
        name: ext.title,
        value: ext
      }))

      const { selectedExtension } = await inquirer.prompt([
        {
          name: 'selectedExtension',
          message: 'Choose your extension:',
          type: 'list',
          choices: extensionsChoices
        }
      ])

      const absoluteExtensionPath = path.resolve(
        args.entryPointPath || selectedEntryPoint
      )

      if (this.packageJsonPath) {
        await this.addExtensionToPackageJson(absoluteExtensionPath)
      }

      this.upsertManifest(
        path.resolve(path.dirname(absoluteExtensionPath), 'manifest.json'),
        selectedExtension
      )

      console.log(chalk.green('Extension selected! \\o/'))
      console.log(
        chalk.blue("You can now go to your project's root and run"),
        chalk.yellow('qt serve')
      )
    } catch (error) {
      console.log(chalk.red(error))
      if (process.env.DEBUG) console.error(error)
    }
  }

  upsertManifest (manifestPath, extensionData) {
    const manifest = new JSONManager(manifestPath)

    manifest.extensionId = extensionData.id
    manifest.extensionStorageId = extensionData
    manifest.type = extensionData.type === 'Com build' ? 'build' : 'noBuild'
    manifest.name = extensionData.title

    manifest.save()

    return manifest
  }

  async addExtensionToPackageJson (absoluteExtensionPath) {
    const extensionPathRelativeToProjectRoot = path.relative(
      this.projectRoot,
      absoluteExtensionPath
    )

    const packageJsonEditor = await readJSON(path.resolve(this.packageJsonPath))

    const currentQuotiInfo = merge(
      { extensions: [] },
      await packageJsonEditor.get('quoti')
    )

    currentQuotiInfo.extensions = union(currentQuotiInfo.extensions, [
      extensionPathRelativeToProjectRoot
    ])

    packageJsonEditor.set({
      quoti: currentQuotiInfo
    })

    await packageJsonEditor.save()
  }

  async listExtensions (institution, withBuild) {
    const token = await app.auth().currentUser.getIdToken()
    const result = await api.axios.get(`/${institution}/dynamic-components/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    let extensions

    if (typeof withBuild !== 'undefined') {
      extensions = result.data.filter(
        extension =>
          (withBuild && extension.type === 'Com build') ||
          (!withBuild && extension.type === 'Sem build')
      )
    } else {
      extensions = result.data
    }

    return extensions
  }

  getFilesAsChoices (fileExtensionsAllowed = ['.vue']) {
    const dirents = readdirSync(process.cwd(), { withFileTypes: true })

    const filesNames = dirents
      .filter(dirent => dirent.isFile())
      .filter(dirent =>
        fileExtensionsAllowed.some(fileExt => dirent.name.endsWith(fileExt))
      )
      .map(dirent => dirent.name)

    return filesNames.map(fileName => ({ name: fileName, value: fileName }))
  }
}

SelectExtensionCommand.args = [
  {
    name: 'entryPointPath',
    required: false,
    description: "The path to the Extension's entry point"
  }
]

SelectExtensionCommand.flags = {
  build: flags.boolean({
    allowNo: true,
    char: 'b',
    description:
      "Specify that you're selecting an extension **with** build, use --no-build for extensions without build",
    exclusive: []
  })
}

SelectExtensionCommand.description = `Select your extension to work`

module.exports = SelectExtensionCommand
