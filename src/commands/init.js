const Command = require('../base.js')
const InitExtensionService = require('../services/initExtension')
const MarketplaceOrganizationService = require('../services/marketplaceOrganization')
const marketplaceOrganizationService = new MarketplaceOrganizationService()
const Logger = require('../config/logger')
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

  async run () {
    const [extension] = await Promise.all([
      this.initExtensionService.promptExtensionInfo(),
      marketplaceOrganizationService.downloadTemplate()
    ])
    const dynamicComponent =
      await this.initExtensionService.createDynamicComponent(extension)
    this.initExtensionService.copyTemplateToCWD({
      extensionType: extension.type
    })
    this.initExtensionService.initializeManifestAccordingWithType(
      dynamicComponent
    )
  }

  static description =
    'Inicializa um projeto Vue para uma ou mais extensões do Quoti'
}

module.exports = InitCommand
