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
    this.logger.debug('run create command')

    // Obter informações da extensão primeiro, pois podemos precisar do nome dela para o diretório
    const [extension] = await Promise.all([
      this.initExtensionService.promptExtensionInfo(),
      marketplaceOrganizationService.downloadTemplate() // Continua baixando o template geral se necessário
    ])

    let extensionFolderName = this.args.extensionDirectory
    if (!extensionFolderName) {
      // Normalizar o nome da extensão para usar como nome da pasta
      // Ex: "Minha Extensão Top" -> "minha-extensao-top"
      extensionFolderName = extension.title
        .toLowerCase()
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/[^a-z0-9-]/g, '') // Remove caracteres não alfanuméricos exceto hífens
        .replace(/-+/g, '-') // Substitui múltiplos hífens por um único
        .trim()
      if (!extensionFolderName) {
        this.logger.error('Nome da extensão inválido ou vazio após normalização.')
        return
      }
    }

    const basePath = path.join(this.projectRoot, 'src/pages')
    const extensionDirectory = path.join(basePath, extensionFolderName)

    if (!fs.existsSync(extensionDirectory)) {
      fs.mkdirSync(extensionDirectory, { recursive: true })
      this.logger.info(`Diretório da extensão criado: ${extensionDirectory}`)
    } else {
      this.logger.info(`Diretório da extensão já existe: ${extensionDirectory}`)
    }

    const dynamicComponent =
      await this.initExtensionService.createDynamicComponent(extension)
    this.logger.debug(`Dynamic component created: ${dynamicComponent}`)
    const manifestPath = path.join(extensionDirectory, './manifest.json')
    this.initExtensionService.initializeManifestFromDynamicComponent({
      dynamicComponent,
      manifestPath
    })
    let entryPointName
    const framework = extension.meta?.framework || 'vue' // Default to vue if somehow not set
    if (framework === 'react') {
      if (extension.type === 'Com build') {
        entryPointName = 'index.tsx'
      } else {
        entryPointName = 'App.tsx'
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
      const copyParams = {
        extensionType: extension.type,
        extensionFramework: framework,
        entryPointName: entryPointName,
        to: path.join(extensionDirectory, entryPointName)
      }
      marketplaceOrganizationService.copyTemplateEntryPointToPath(copyParams)
    }
  }

  static description = 'Cria uma extensão vue para seu projeto'
  static args = [
    {
      name: 'extensionDirectory',
      required: false,
      description:
        'Nome do diretório para a extensão (opcional). Se não fornecido, será derivado do nome da extensão escolhido no prompt. A extensão será criada em ./src/pages/nome-do-diretorio.'
    }
  ]
}

module.exports = CreateCommand
