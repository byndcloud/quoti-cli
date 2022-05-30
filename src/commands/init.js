const Command = require('../base.js')
const InitExtensionService = require('../services/initExtension')
const initExtensionService = new InitExtensionService()
const MarketplaceOrganizationService = require('../services/marketplaceOrganization')
const marketplaceOrganizationService = new MarketplaceOrganizationService()
const credentials = require('../config/credentials')
credentials.load()

class InitCommand extends Command {
  async run () {
    const [extension] = await Promise.all([
      initExtensionService.promptExtensionInfo(),
      marketplaceOrganizationService.downloadTemplate()
    ])
    const dynamicComponent = await initExtensionService.createDynamicComponent(
      extension
    )
    marketplaceOrganizationService.copyTemplateToPath({
      extensionType: extension.type,
      to: './'
    })
    await initExtensionService.initializeManifestAccordingWithType(
      dynamicComponent
    )
  }

  static description = 'Inicializa um projeto Quoti'
}

module.exports = InitCommand
