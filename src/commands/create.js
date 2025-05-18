const Command = require('../base.js')
const InitExtensionService = require('../services/initExtension')
const Logger = require('../config/logger')
const path = require('path')
const fs = require('fs')
const MarketplaceOrganizationService = require('../services/marketplaceOrganization')
const marketplaceOrganizationService = new MarketplaceOrganizationService()
const utils = require('../utils/index')
const PackageService = require('../services/package.js')
const packageService = new PackageService()

class CreateCommand extends Command {
  constructor () {
    super(...arguments)
    const commandName = this.id
    this.logger = Logger.child({
      tag: `command/${commandName}`
    })
    this.initExtensionService = new InitExtensionService({
      logger: this.logger
    })
  }

  init () {
    super.init({ injectProjectRoot: true })
  }

  async run () {
    if (!this.args?.extensionDirectory) {
      return
    }
    let basePath = path.join(this.projectRoot, 'src/pages')
    if (!fs.existsSync(basePath)) {
      basePath = path.resolve(this.projectRoot)
    }

    const [extension] = await Promise.all([
      this.initExtensionService.promptExtensionInfo(),
      marketplaceOrganizationService.downloadTemplate()
    ])
    const dynamicComponent =
      await this.initExtensionService.createDynamicComponent(extension)
    const extensionDirectory = path.join(basePath, this.args.extensionDirectory)
    if (!fs.existsSync(extensionDirectory)) {
      fs.mkdirSync(extensionDirectory, { recursive: true })
    }
    this.initExtensionService.initializeManifestFromDynamicComponent({
      dynamicComponent,
      manifestPath: path.join(extensionDirectory, './manifest.json')
    })
    let entryPointName
    const framework = extension.meta?.framework || 'vue' // Default to vue if somehow not set
    if (framework === 'react') {
      if (extension.type === 'Com build') {
        entryPointName = 'index.jsx'
      } else {
        entryPointName = 'App.jsx'
      }
    } else { // vue or default
      if (extension.type === 'Com build') {
        entryPointName = 'index.vue'
      } else {
        entryPointName = 'App.vue'
      }
    }
    const entryPointPath = path.join(extensionDirectory, entryPointName)
    await packageService.addExtensionToPackageJson(
      entryPointPath,
      this.projectRoot
    )
    let isReplaceFile = true
    if (fs.existsSync(entryPointPath)) {
      isReplaceFile = await utils.confirmQuestion(
        `Já existe um arquivo em ./${path.relative(
          path.resolve('./'),
          entryPointPath
        )}. Deseja substitui-lo? por um arquivo padrão ? n`,
        false
      )
    }
    if (isReplaceFile) {
      marketplaceOrganizationService.copyTemplateEntryPointToPath({
        extensionType: extension.type,
        extensionFramework: framework,
        entryPointName: entryPointName,
        to: path.join(extensionDirectory, entryPointName)
      })
    }
  }

  static description = 'Cria uma extensão vue para seu projeto'
  static args = [
    {
      name: 'extensionDirectory',
      required: true,
      description:
        'Endereço relativo a pasta ./src/pages onde será salvo sua extensão. Caso não exista a pasta ./src/pages o endereço fica relativo a raiz do projeto'
    }
  ]
}

module.exports = CreateCommand
