const inquirer = require('inquirer')
const { slugify } = require('../utils/index')
const OrganizationService = require('../services/organization')
const organization = new OrganizationService()
const ora = require('ora')
const path = require('path')
const credentials = require('../config/credentials')
const { firebase } = require('../config/firebase')
const api = require('../config/axios')
const ManifestService = require('../services/manifest')
const MarketplaceOrganizationService = require('../services/marketplaceOrganization')
const marketplaceOrganizationService = new MarketplaceOrganizationService()
const { CreateDynamicComponentError } = require('../utils/errorClasses')

class InitExtensionService {
  constructor ({ spinnerOptions, cwd = './', logger } = {}) {
    this.logger = logger
    this.cwd = cwd
    this.spinner = ora(
      spinnerOptions || {
        spinner: 'arrow3',
        color: 'yellow'
      }
    )
    this.validate = {
      isName: item => {
        if (!item) {
          return 'Escreva um nome para sua extensão'
        }
        return true
      },
      validatePath: currentPaths => {
        return path => {
          const isValidFormat = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/i.test(path)
          if (!isValidFormat) {
            return 'Path inválido. Só aceitamos números, letras, e -'
          }
          const isPathExist = currentPaths.includes(path)
          if (isPathExist) {
            return `Já existe uma extensão com esse path na organização ${credentials.institution}.`
          }

          return true
        }
      }
    }
  }

  getCWD () {
    return this.cwd
  }

  async createDynamicComponent (dynamicComponent) {
    try {
      this.spinner.start('Criando extensão...')
      const token = await firebase.auth().currentUser.getIdToken()

      const { data } = await api.axios.post(
        `${credentials.institution}/dynamic-components`,
        dynamicComponent,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      this.spinner.succeed(
        `Extensão criada na organização ${credentials.institution}`
      )
      return data
    } catch (error) {
      this.spinner.fail(
        `Houve um erro ao criar extensão na organização ${credentials.institution}`
      )
      this.logger.debug(error)
      throw new CreateDynamicComponentError()
    }
  }

  initializeManifestAccordingWithType (dynamicComponent) {
    const rootPath = path.resolve(this.getCWD())
    const manifestPath =
      dynamicComponent.type === 'Com build'
        ? path.join(rootPath, 'src', 'pages', 'extension1', 'manifest.json')
        : path.join(rootPath, 'manifest.json')
    this.initializeManifestFromDynamicComponent({
      dynamicComponent,
      manifestPath
    })
  }

  initializeManifestFromDynamicComponent ({ dynamicComponent, manifestPath }) {
    const manifest = new ManifestService(manifestPath)
    manifest.extensionId = dynamicComponent.id
    manifest.extensionStorageId = dynamicComponent.extensionStorageId
    manifest.type = dynamicComponent.type === 'Com build' ? 'build' : 'noBuild'
    manifest.name = dynamicComponent.title
    manifest.extensionUUID = dynamicComponent.extensionUUID
    manifest.institution = credentials.institution
    manifest.meta = dynamicComponent.meta
    manifest.save()
  }

  async promptExtensionInfo () {
    const currentPathsPromise = organization.listExtensionsPaths()
    const nameExtensionPromise = this.promptExtensionName()
    const [currentPaths, extensionName] = await Promise.all([
      currentPathsPromise,
      nameExtensionPromise
    ])
    const extension = {
      title: extensionName,
      fileVuePrefix: '',
      url: '',
      version: '0.0.1',
      meta: {
        public: false,
        hasToolbar: true
      },
      DynamicComponentsFiles: [],
      id: null
    }

    extension.path = await this.promptExtensionPath({
      extensionName,
      currentPaths
    })

    extension.type = await this.promptExtensionType()
    extension.meta.public = await this.promptExtensionIsPublic()
    extension.meta.hasToolbar = await this.promptExtensionIsShowToolbar()
    extension.meta.framework = await this.promptFramework()
    return extension
  }

  async promptExtensionName () {
    const { name } = await inquirer.prompt([
      {
        name: 'name',
        message: 'Escolha um nome para sua extensão',
        type: 'input',
        validate: this.validate.isName
      }
    ])
    return name
  }

  async promptExtensionPath ({ extensionName, currentPaths }) {
    const { path } = await inquirer.prompt([
      {
        name: 'path',
        message: 'Escolha um path para sua extensão',
        type: 'input',
        default: slugify(extensionName),
        validate: this.validate.validatePath(currentPaths)
      }
    ])
    return path
  }

  async promptExtensionType () {
    const { type } = await inquirer.prompt([
      {
        name: 'type',
        message: 'Extensão com build? y',
        type: 'confirm',
        default: true,
        validate: this.validate.validatePath.bind
      }
    ])
    return type ? 'Com build' : 'Sem build'
  }

  async promptExtensionIsPublic () {
    const { isPublic } = await inquirer.prompt([
      {
        name: 'isPublic',
        message: 'Extensão é pública? n',
        type: 'confirm',
        default: false,
        validate: this.validate.validatePath.bind
      }
    ])
    return isPublic
  }

  async promptExtensionIsShowToolbar () {
    const { hasToolbar } = await inquirer.prompt([
      {
        name: 'hasToolbar',
        message: 'Extensão deve exibir a barra de navegação? y',
        type: 'confirm',
        default: true,
        validate: this.validate.validatePath.bind
      }
    ])
    return hasToolbar
  }

  async promptFramework () {
    const { framework } = await inquirer.prompt([
      {
        name: 'framework',
        message: 'Qual framework você gostaria de usar para esta extensão?',
        type: 'list',
        choices: ['vue', 'react'],
        default: 'vue'
      }
    ])
    return framework
  }

  copyTemplateToCWD ({ extensionType }) {
    marketplaceOrganizationService.copyTemplateToPath({
      extensionType,
      to: this.getCWD()
    })
  }

  copyTemplateEntryPointToCWD ({ extensionType, entryPointName }) {
    marketplaceOrganizationService.copyTemplateEntryPointToPath({
      extensionType,
      to: path.join(this.getCWD(), entryPointName)
    })
  }
}

module.exports = InitExtensionService
