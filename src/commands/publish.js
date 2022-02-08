const credentials = require('../config/credentials')
const Command = require('../base.js')
const { flags } = require('@oclif/command')
const api = require('../config/axios')
const { firebase } = require('../config/firebase')
const semver = require('semver')
const { getManifestFromEntryPoint, confirmQuestion, listExtensionsPaths, getProjectRootPath } = require('../utils/index')
const inquirer = require('inquirer')
const path = require('path')

class PublishCommand extends Command {
  constructor () {
    super(...arguments)
    try {
      credentials.load()
      this.projectRoot = getProjectRootPath()
      this.extensionsPaths = listExtensionsPaths()
      if (this.extensionsPaths.length === 0) {
        throw new Error(
          'Nenhuma extensão foi selecionada até agora, execute qt select-extension para escolher extensões para desenvolver.'
        )
      }
    } catch (error) {
      this.logger.error(error)
      process.exit(0)
    }
  }
  async run () {
    const { entryPointPath } = this.args
    const manifest = await this.getManifest(entryPointPath)
    if (!manifest.extensionUUID) {
      this.logger.error(`Por razões de segurança é necessário realizar deploy em sua extensão antes de publicar no Marketplace. Uma vez publicado esta mensagem não irá mais aparecer porém sempre que desejar publicar uma versão mais antiga que a data de hoje será necessário realizar deploy da versão desejada`)
      process.exit(0)
    }
    if (this.flags.version && !semver.valid(this.flags.version)) {
      this.logger.error(`Versão deve estar no formato x.x.x`)
      process.exit(0)
    }

    if (!this.commandSintaxeValid(this.flags)) {
      this.logger.error(`Use apenas uma das flags  --version --patch, --minor, --major`)
      process.exit(0)
    }

    if (!manifest) {
      this.logger.warning('Por favor selecione uma extensão. Execute qt select-extension')
      process.exit(0)
    }

    const token = await firebase.auth().currentUser.getIdToken()

    const { data } = await api.axios.get(
      decodeURIComponent(`/${credentials.institution}/dynamic-components?where[id]=${manifest.extensionId}`),
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    const dynamicComponentFile = data[0]
    if (!dynamicComponentFile) {
      this.logger.error('Extensão não encontrada. Verifique se você ainda possui esta extensão')
      process.exit(0)
    }
    const dynamicComponentFileActivated = dynamicComponentFile.DynamicComponentsFiles.find(item => item.activated)
    if (!dynamicComponentFileActivated) {
      this.logger.error('Nenhuma versão ativa para esta extensão. É necessário realizar deploy de alguma versão antes de publicar')
      process.exit(0)
    }
    if (!dynamicComponentFile.marketplaceExtensionId) {
      await this.publishExtension(this.flags, dynamicComponentFileActivated.id, token, manifest)
    } else {
      await this.publishNewVersion(this.flags, dynamicComponentFileActivated.id, token, manifest)
    }
  }
  async publishExtension (flags, dynamicComponentFileId, token, manifest) {
    if (this.existIncrementVersion(flags)) { this.logger.warning('Flag [--patch] [--minor] [--major] ignoradas. Você está publicando uma extensão e portanto as flags [--patch] [--minor] [--major] não é importante nesse cenário. Apenas use essas flags quando estiver realizando a atualização de uma extensão') }
    const confirmed = await confirmQuestion(`Deseja publicar a extensão "${manifest.name}" no Marketplace? Sim/Não\n`)
    if (!confirmed) {
      process.exit(0)
    }
    let version
    if (!flags.version) {
      const { versionName } = await inquirer.prompt([
        {
          name: 'versionName',
          message:
              `Escolha uma versão para sua extensão`,
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
    const bodyPublishExtension = { dynamicComponentFileId, version, extensionUUID: manifest.extensionUUID }
    await this.callEndpointPublishExtension(bodyPublishExtension, token)
    this.logger.success('Nova extensão publicada com sucesso')
  }
  async publishNewVersion (flags, dynamicComponentFileId, token, manifest) {
    const confirmed = await confirmQuestion(`Deseja publicar uma nova versão para a extensão "${manifest.name}" já publicada no Marketplace? Sim/Não\n`)
    if (!confirmed) {
      process.exit(0)
    }
    let versionIncrement
    if (!flags.version) {
      if (Object.keys(flags).length === 0) {
        versionIncrement = 'PATCH'
      } else {
        versionIncrement = Object.keys(flags)[0].toUpperCase()
      }
    }
    const bodyPublishExtensionVersion = {
      dynamicComponentFileId,
      version: flags.version,
      versionIncrement
    }
    try {
      await this.callEndpointPublishExtensionVersion(bodyPublishExtensionVersion, token)
    } catch (error) {
      if (error.response.status === 422) {
        this.logger.error('A versão informada é menor ou igual à última versão. Por favor, insira uma versão maior.')
      } else {
        this.logger.error(JSON.stringify(error, null, 2))
      }
      process.exit(0)
    }
    this.logger.success('Nova versão foi publicada com sucesso')
  }

  commandSintaxeValid (flags) {
    return Object.keys(flags).length < 2
  }
  async callEndpointPublishExtensionVersion (body, token) {
    await api.axios.post(
      `/${credentials.institution}/marketplace/extensions/publish-version`,
      body,
      { headers: { Authorization: `Bearer ${token}` } }
    )
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
    const extensionsChoices = this.extensionsPaths.map(e => ({ name: path.relative(
      './',
      e
    ),
    value: e }))
    if (extensionsChoices.length > 1) {
      const { selectedExtensionPublish } = await inquirer.prompt([
        {
          name: 'selectedExtensionPublish',
          message: 'De qual extensão você deseja realizar deploy ?',
          type: 'list',
          choices: extensionsChoices
        }
      ])
      entryPointPath = selectedExtensionPublish
    } else {
      entryPointPath = extensionsChoices[0].value
    }
    return getManifestFromEntryPoint(entryPointPath)
  }
  existIncrementVersion (flags) {
    return flags.patch || flags.minor || flags.major
  }
}
PublishCommand.description = `Publica uma nova extensão`
PublishCommand.flags = {
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
  })

}
PublishCommand.args = [
  {
    name: 'entryPointPath',
    required: false,
    description: 'Endereço do entry point (arquivo principal) da extensão'
  }
]

module.exports = PublishCommand
