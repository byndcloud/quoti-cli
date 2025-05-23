const credentials = require('../config/credentials')
const Command = require('../base.js')
const { flags } = require('@oclif/command')
const api = require('../config/axios')
const { firebase } = require('../config/firebase')
const semver = require('semver')
const {
  getManifestFromEntryPoint,
  confirmQuestion,
  validateEntryPointIncludedInPackage,
  promptExtensionEntryPointsFromUser,
  prompt
} = require('../utils/index')
const inquirer = require('inquirer')
const RemoteExtensionService = require('../services/remoteExtension')

class PublishCommand extends Command {
  init () {
    super.init({ injectProjectRoot: true, injectExtensionsPaths: true })
    credentials.load()
  }

  async run () {
    const { entryPointPath } = this.args
    if (entryPointPath) {
      validateEntryPointIncludedInPackage(entryPointPath, this.projectRoot)
    }
    const manifest = await this.getManifest(entryPointPath)
    if (!manifest.extensionUUID) {
      this.logger.error(
        'Por razões de segurança é necessário realizar deploy em sua extensão antes de publicar no Marketplace. Uma vez publicado esta mensagem não irá mais aparecer porém sempre que desejar publicar uma versão mais antiga que a data de hoje será necessário realizar deploy da versão desejada'
      )
      process.exit(0)
    }
    if (this.flags.version && !semver.valid(this.flags.version)) {
      this.logger.error('Versão deve estar no formato x.x.x')
      process.exit(0)
    }

    if (!this.commandSintaxeValid(this.flags)) {
      this.logger.error(
        'Use apenas uma das flags  --version --patch, --minor, --major'
      )
      process.exit(0)
    }

    if (!manifest) {
      this.logger.warning('Por favor selecione uma extensão. Execute qt link')
      process.exit(0)
    }

    const token = await firebase.auth().currentUser.getIdToken()

    const orgSlug = credentials.institution
    const extensionId = manifest.extensionId
    const { data } = await api.axios.get(
      decodeURIComponent(
        `/${orgSlug}/dynamic-components?where[id]=${extensionId}`
      ),
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    const dynamicComponentFile = data?.[0]
    if (!dynamicComponentFile) {
      this.logger.error(
        'Extensão não encontrada. Verifique se você ainda possui esta extensão'
      )
      process.exit(0)
    }
    const dynamicComponentFileActivated =
      dynamicComponentFile.DynamicComponentsFiles.find(item => item.activated)
    if (!dynamicComponentFileActivated) {
      this.logger.error(
        'Nenhuma versão ativa para esta extensão. É necessário realizar deploy de alguma versão antes de publicar'
      )
      process.exit(0)
    }

    const extensionName = dynamicComponentFile.title

    this.logger.info(
      `* Publicando a extensão ${extensionName} (id: ${extensionId}) da organização ${orgSlug}`
    )

    if (extensionName !== manifest.name) {
      this.logger.warning(
        `O nome da extensão no manifesto (${manifest.name}) está diferente do nome da extensão na sua organização (${extensionName}). Execute 'qt link' para atualizar o nome da extensão no manifesto.`
      )
    }

    if (!dynamicComponentFile.marketplaceExtensionId) {
      await this.publishExtension(
        this.flags,
        dynamicComponentFileActivated.id,
        token,
        manifest
      )
    } else {
      const remoteExtensionService = new RemoteExtensionService()
      await remoteExtensionService.loadExtensionVersionsOnMarketplace({
        extensionVersionId: dynamicComponentFile.marketplaceExtensionId,
        token,
        orgSlug: credentials.institution
      })
      const lastVersionOnMarketplace =
        remoteExtensionService.getLastVersionOnMarketplace()
      const targetVersion = this.getTargetVersion(
        this.flags,
        lastVersionOnMarketplace
      )
      await this.validateVersionSemantics({
        targetVersion,
        lastVersion: lastVersionOnMarketplace
      })
      this.logger.info(
        `Atualmente a versão mais recente para esta extensão no Marketplace é ${lastVersionOnMarketplace}`
      )
      await this.publishNewVersion(
        this.flags,
        dynamicComponentFileActivated.id,
        token,
        manifest,
        targetVersion,
        dynamicComponentFile.marketplaceExtensionId
      )
    }
  }

  async publishExtension (flags, dynamicComponentFileId, token, manifest) {
    if (this.existIncrementVersion(flags)) {
      this.logger.warning(
        'Flag [--patch] [--minor] [--major] ignoradas. Você está publicando uma extensão e portanto as flags [--patch] [--minor] [--major] não é importante nesse cenário. Apenas use essas flags quando estiver realizando a atualização de uma extensão'
      )
    }
    const confirmed = await confirmQuestion(
      `Deseja publicar a extensão "${manifest.name}" no Marketplace? Sim/Não\n`
    )
    if (!confirmed) {
      process.exit(0)
    }
    let version
    if (!flags.version) {
      const { versionName } = await inquirer.prompt([
        {
          name: 'versionName',
          message: 'Escolha uma versão para sua extensão',
          type: 'input',
          validate: input => {
            if (!semver.valid(input)) {
              return 'A versão deve estar no formato x.x.x'
            }
            return true
          }
        }
      ])
      version = versionName
    } else {
      version = flags.version
    }
    const bodyPublishExtension = {
      dynamicComponentFileId,
      version,
      extensionUUID: manifest.extensionUUID,
      manifest: manifest.getManifestToPublish()
    }
    await this.callEndpointPublishExtension(bodyPublishExtension, token)
    this.logger.success(`Nova extensão publicada com sucesso: ${version}`)
  }

  /**
   *
   * @param {*} flags
   * @param {*} dynamicComponentFileId
   * @param {*} token
   * @param {import('../services/manifest')} manifest
   * @param {*} targetVersion
   */
  async publishNewVersion (
    flags,
    dynamicComponentFileId,
    token,
    manifest,
    targetVersion,
    extensionId
  ) {
    let orgsToUpdate
    if (flags.orgs) {
      const remoteExtensionService = new RemoteExtensionService()
      const orgs = await remoteExtensionService.getSubscribedOrgs(extensionId)
      orgsToUpdate = await prompt(
        'Selecione as organizações que receberão essa atualização',
        orgs
      )
    }
    const confirmed = await confirmQuestion(
      `Deseja publicar uma nova versão "${targetVersion}" para a extensão "${manifest.name}" já publicada no Marketplace? Sim/Não\n`
    )
    if (!confirmed) {
      this.logger.info(
        'Operação cancelada. Caso queira saber mais sobre o comando publish execute qt help publish'
      )
      process.exit(0)
    }
    let versionIncrement
    if (!flags.version) {
      const versionIncrementTemp =
        flags?.patch || flags?.minor || flags?.major || 'PATCH'
      versionIncrement = versionIncrementTemp.toUpperCase()
    }
    const bodyPublishExtensionVersion = {
      dynamicComponentFileId,
      version: flags.version,
      versionIncrement,
      manifest: manifest.getManifestToPublish(),
      orgsToUpdate
    }
    try {
      const data = await this.callEndpointPublishExtensionVersion(
        bodyPublishExtensionVersion,
        token
      )
      this.logger.success(
        `Nova versão ${data.newVersion} foi publicada com sucesso`
      )
      if (data.orgsUpdatedWithSuccess.length > 0) {
        this.logger.success(
          `Organizações que tiveram sua extensão atualizada: ${data.orgsUpdatedWithSuccess.join(
            ', '
          )}`
        )
      } else {
        this.logger.success('Nenhuma org teve essa extensão atualizada')
      }
      if (data.orgsWithoutAutomaticUpdate.length > 0) {
        this.logger.success(
          `Organizações sem a atualização automática para esta extensão: ${data.orgsWithoutAutomaticUpdate.join(
            ', '
          )}`
        )
      }
      if (data.orgsWithErrorOnUpdate.length > 0) {
        this.logger.error(
          `Houveram erros durante a atualização nessas organizações:  ${data.orgsWithErrorOnUpdate.join(
            ', '
          )}`
        )
      }
    } catch (error) {
      if (error.response.status === 422) {
        this.logger.error(
          'A versão informada é menor ou igual à última versão. Por favor, insira uma versão maior.'
        )
      } else {
        this.logger.error(JSON.stringify(error, null, 2))
      }
      process.exit(0)
    }
  }

  commandSintaxeValid (flags) {
    return Object.keys(flags).length < 2
  }

  async validateVersionSemantics ({ targetVersion, lastVersion }) {
    if (lastVersion) {
      if (
        semver.valid(targetVersion) &&
        semver.gte(lastVersion, targetVersion)
      ) {
        throw new Error(
          `A versão desejada "${targetVersion}" é menor ou igual à versão atual "${lastVersion}"`
        )
      }
    }
  }

  getTargetVersion (flags, lastVersion) {
    if (flags.version) {
      return flags.version
    }
    const inc = flags.minor || flags.major || 'patch'
    return semver.inc(lastVersion, inc)
  }

  async callEndpointPublishExtensionVersion (body, token) {
    const { data } = await api.axios.post(
      `/${credentials.institution}/marketplace/extensions/publish-version`,
      body,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return data.data
  }

  async callEndpointPublishExtension (body, token) {
    await api.axios.post(
      `/${credentials.institution}/marketplace/extensions`,
      body,
      { headers: { Authorization: `Bearer ${token}` } }
    )
  }

  async getManifest (entryPointPath) {
    if (entryPointPath) {
      return getManifestFromEntryPoint(entryPointPath)
    }
    entryPointPath = await promptExtensionEntryPointsFromUser({
      extensionsPaths: this.extensionsPaths,
      message: 'Qual extensão deseja publicar?',
      multiSelect: false
    })
    return getManifestFromEntryPoint(entryPointPath[0])
  }

  existIncrementVersion (flags) {
    return flags.patch || flags.minor || flags.major
  }

  static aliases = ['p']

  static args = [
    {
      name: 'entryPointPath',
      required: false,
      description: 'Endereço do entry point (arquivo principal) da extensão'
    }
  ]

  static description =
    'Publica uma nova extensão ou atualiza uma extensão já publicada no Marketplace'

  static flags = {
    org: flags.string({ description: 'Slug da organização' }),
    version: flags.string({
      char: 'v',
      description: 'Versão da extensão'
    }),

    // incrementVersion [patch, minor, major]
    patch: flags.boolean({
      char: 'p',
      description: 'x.x.x -> x.x.x+1'
    }),

    minor: flags.boolean({
      char: 'm',
      description: 'x.x.x -> x.x+1.x'
    }),

    major: flags.boolean({
      char: 'M',
      description: 'x.x.x -> x+1.x.x'
    }),

    orgs: flags.boolean({
      char: 'o',
      description:
        'Publique e instale a extensão apenas em organizações específicas. Ideal para versões em homologação'
    })
  }
}

module.exports = PublishCommand
