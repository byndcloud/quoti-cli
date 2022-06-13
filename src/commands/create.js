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

class InitCommand extends Command {
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
    const [extension] = await Promise.all([
      this.initExtensionService.promptExtensionInfo(),
      marketplaceOrganizationService.downloadTemplate()
    ])
    const dynamicComponent =
      await this.initExtensionService.createDynamicComponent(extension)
    this.initExtensionService.initializeManifestFromDynamicComponent({
      dynamicComponent,
      manifestPath: path.resolve('./manifest.json')
    })
    let entryPointName
    if (extension.type === 'Com build') {
      entryPointName = 'index.vue'
    } else {
      entryPointName = 'App.vue'
    }
    const entryPointPath = path.resolve(entryPointName)
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
      this.initExtensionService.copyTemplateEntryPointToCWD({
        extensionType: extension.type,
        entryPointName
      })
    }
  }

  static description = 'Cria uma extensão vue para seu projeto'
}

module.exports = InitCommand
