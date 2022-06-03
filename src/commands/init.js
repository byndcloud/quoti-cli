const Command = require('../base.js')
const InitExtensionService = require('../services/initExtension')
const initExtensionService = new InitExtensionService()
const MarketplaceOrganizationService = require('../services/marketplaceOrganization')
const marketplaceOrganizationService = new MarketplaceOrganizationService()

class InitCommand extends Command {
  async run () {
    const [extension] = await Promise.all([
      initExtensionService.promptExtensionInfo(),
      marketplaceOrganizationService.downloadTemplate()
    ])
    const dynamicComponent = await initExtensionService.createDynamicComponent(
      extension
    )
    initExtensionService.copyTemplateToCWD({
      extensionType: extension.type
    })
    await initExtensionService.initializeManifestAccordingWithType(
      dynamicComponent
    )
  }

  static description = 'Inicializa um projeto Quoti'
}

module.exports = InitCommand
