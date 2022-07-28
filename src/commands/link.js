const path = require('path')
const ora = require('ora')
const inquirer = require('inquirer')
const inquirerFileTreeSelection = require('inquirer-file-tree-selection-prompt')
const { readdirSync, existsSync } = require('fs')
const Command = require('../base.js')
const { flags } = require('@oclif/command')

const { app } = require('../config/firebase')

const credentials = require('../config/credentials')
const api = require('../config/axios')
const fuzzy = require('fuzzy')
const ManifestService = require('../services/manifest.js')
const PackageService = require('../services/package.js')
const packageService = new PackageService()
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection)
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))

class LinkExtensionCommand extends Command {
  init () {
    super.init({ injectProjectRoot: true })
  }

  async run () {
    if (this.args.entryPointPath && !existsSync(this.args.entryPointPath)) {
      throw new Error(
        `O arquivo de ponto de entrada de extensão fornecido não foi encontrado em '${this.args.entryPointPath}', certifique-se de que o arquivo existe`
      )
    }

    if (
      this.args.entryPointPath &&
      !this.args.entryPointPath.endsWith('.vue')
    ) {
      throw new Error(
        'O arquivo de ponto de entrada de extensão deve ser um arquivo .vue'
      )
    }

    const { selectedEntryPoint } = await inquirer.prompt([
      {
        name: 'selectedEntryPoint',
        message: 'Qual é o entry point (arquivo principal) da sua extensão?',
        type: 'file-tree-selection',
        validate: file => file.endsWith('.vue'),
        hideRoot: true,
        when: !this.args.entryPointPath
      }
    ])

    const spinner = ora({
      text: 'Buscando extensões',
      spinner: 'dots3'
    }).start()

    const extensions = await this.listExtensions(
      credentials.institution,
      this.flags.build
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
            const fuzzyResult = fuzzy.filter(
              input,
              extensionsChoices.map(e => e.name)
            )
            return fuzzyResult.map(fr => extensionsChoices[fr.index])
          } else {
            return extensionsChoices
          }
        }
      }
    ])

    const absoluteExtensionPath = path.resolve(
      this.args.entryPointPath || selectedEntryPoint
    )

    await packageService.addExtensionToPackageJson(
      absoluteExtensionPath,
      this.projectRoot
    )

    this.upsertManifest({
      manifestPath: path.resolve(
        path.dirname(absoluteExtensionPath),
        'manifest.json'
      ),
      extensionData: selectedExtension,
      institution: credentials.institution
    })

    this.logger.success('Extensão selecionada! \\o/')
    this.logger.success(
      'Para desenvolver, execute qt serve para fazer deploy execute qt deploy'
    )
  }

  upsertManifest ({ manifestPath, extensionData, institution }) {
    const manifest = new ManifestService(manifestPath)

    manifest.extensionId = extensionData.id
    manifest.extensionStorageId = extensionData.extensionStorageId
    manifest.type = extensionData.type === 'Com build' ? 'build' : 'noBuild'
    manifest.name = extensionData.title
    manifest.extensionUUID = extensionData.extensionUUID
    manifest.meta = extensionData.meta
    manifest.institution = institution

    manifest.save()

    return manifest
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

  static aliases = ['l', 'link-extension', 'link']

  static description = 'Faça um link de uma extensão no Quoti com o seu código'

  static args = [
    {
      name: 'entryPointPath',
      required: false,
      description: 'Endereço do entry point (arquivo principal) da extensão'
    }
  ]

  static flags = {
    build: flags.boolean({
      allowNo: true,
      char: 'b',
      description:
        'Use (--build|-b) se você está selecionando uma extensão com build ou use --no-build se você está selecionando uma extensão sem build',
      exclusive: []
    })
  }
}

module.exports = LinkExtensionCommand
