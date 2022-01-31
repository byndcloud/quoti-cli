const path = require('path')
const ora = require('ora')
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
const fuzzy = require('fuzzy')
const Logger = require('../config/logger')
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection)
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))

class SelectExtensionCommand extends Command {
  constructor () {
    super(...arguments)

    this.logger = Logger.child({
      tag: 'command/publish'
    })
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
          `O arquivo de ponto de entrada de extensão fornecido não foi encontrado em '${args.entryPointPath}', certifique-se de que o arquivo existe`
        )
      }

      if (args.entryPointPath && !args.entryPointPath.endsWith('.vue')) {
        throw new Error(`O arquivo de ponto de entrada de extensão deve ser um arquivo .vue`)
      }

      if (!this.packageJsonPath && flags.build === true) {
        throw new Error(
          'Para selecionar uma extensão com build você precisa estar em um projeto Vue com um arquivo package.json'
        )
      }

      const { selectedEntryPoint } = await inquirer.prompt([
        {
          name: 'selectedEntryPoint',
          message:
            'Qual é o entry point (arquivo principal) da sua extensão?',
          type: 'file-tree-selection',
          validate: file => file.endsWith('.vue'),
          hideRoot: true,
          when: !args.entryPointPath
        }
      ])

      const spinner = ora({
        text: 'Buscando extensões',
        spinner: 'dots3'
      }).start()

      const extensions = await this.listExtensions(
        credentials.institution,
        flags.build
      ).catch(err => {
        spinner.fail('Falha ao carregar extensões')
        throw err
      })

      if (extensions.length === 0) {
        spinner.fail('Não encontramos nenhuma extensão.')
        return
      }

      spinner.succeed('Lista de extensões obtida')
      const extensionsChoices = extensions.map(ext => ({
        name: ext.title,
        value: ext
      }))

      const { selectedExtension } = await inquirer.prompt([
        {
          name: 'selectedExtension',
          message: 'Escolha sua extensão:',
          type: 'autocomplete',
          choices: extensionsChoices,
          searchText: 'Carregando...',
          emptyText: 'Nem resultado encontrado para a pesquisa realizada',
          source: function (answersSoFar, input) {
            if (input) {
              const fuzzyResult = fuzzy.filter(input, extensionsChoices.map(e => e.name))
              return fuzzyResult.map(fr => extensionsChoices[fr.index])
            } else {
              return extensionsChoices
            }
          }
        }
      ])

      const absoluteExtensionPath = path.resolve(
        args.entryPointPath || selectedEntryPoint
      )

      if (selectedExtension.type === 'Com build' && !this.packageJsonPath) {
        throw new Error(
          `A extensão selecionada requer compilação, portanto, você deve ter um arquivo package.json na raiz do seu projeto. Tente executar npm init na raiz do projeto ou usar um modelo.`
        )
      }

      if (this.packageJsonPath) {
        await this.addExtensionToPackageJson(absoluteExtensionPath)
      }

      this.upsertManifest(
        path.resolve(path.dirname(absoluteExtensionPath), 'manifest.json'),
        selectedExtension
      )

      this.logger.success('Extensão selecionada! \\o/')
      this.logger.success('Verifique se você está na raiz do seu projeto e execute qt serve')
    } catch (error) {
      this.logger.error(error)
      if (process.env.DEBUG) console.error(error)
    }
  }

  upsertManifest (manifestPath, extensionData) {
    const manifest = new JSONManager(manifestPath)

    manifest.extensionId = extensionData.id
    manifest.extensionStorageId = extensionData.extensionStorageId
    manifest.type = extensionData.type === 'Com build' ? 'build' : 'noBuild'
    manifest.name = extensionData.title
    manifest.extensionUUID = extensionData.extensionUUID

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
    description: 'Endereço do entry point (arquivo principal) da extensão'
  }
]

SelectExtensionCommand.flags = {
  build: flags.boolean({
    allowNo: true,
    char: 'b',
    description:
      'Use build se você está selecionando uma extensão com build ou use no-build se você está selecionando uma extensão sem build',
    exclusive: []
  })
}

SelectExtensionCommand.description = `Selecione sua extensão para desenvolvimento`

module.exports = SelectExtensionCommand
