const md5 = require('md5')
const { firebase } = require('../config/firebase')
const credentials = require('../config/credentials')
const Command = require('../base.js')
const ExtensionService = require('../services/extension')
const RemoteExtensionService = require('../services/remoteExtension')
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const utils = require('../utils/index')
const { flags } = require('@oclif/command')

const { ExtensionNotFoundError } = require('../utils/errorClasses')

class DeployCommand extends Command {
  init () {
    super.init({ injectProjectRoot: true, injectExtensionsPaths: true })
  }

  async run () {
    credentials.load()
    const { entryPointPath: entryPointPathFromArgs } = this.args
    if (entryPointPathFromArgs && this.flags.all) {
      this.logger.warning('Flag -all desconsiderada')
    }
    let entryPointsPath
    if (entryPointPathFromArgs) {
      entryPointsPath = [entryPointPathFromArgs]
      utils.validateEntryPointIncludedInPackage(entryPointPathFromArgs, this.projectRoot)
    } else if (this.flags.all) {
      entryPointsPath = this.extensionsPaths
    } else {
      entryPointsPath = await utils.getEntryPointsFromUser({
        extensionsPaths: this.extensionsPaths,
        message: 'De qual extensão você deseja fazer deploy?'
      })
    } else {
      utils.validateEntryPointIncludedInPackage(entryPointPath, this.projectRoot)
    }
    const isVersionTimestamp = this.flags.version
    for (const entryPointPath of entryPointsPath) {
      await this.deployExtension(entryPointPath, isVersionTimestamp)
    }
  }

  /**
   *
   * @param {string} entryPointPath
   * @param {boolean} isVersionTimestamp
   */
  async deployExtension (entryPointPath, isVersionTimestamp) {
    this.logger.info('\n----------------------------------------------')
    this.manifest = utils.getManifestFromEntryPoint(entryPointPath)

    const token = await firebase.auth().currentUser.getIdToken()
    const remoteExtensionService = new RemoteExtensionService()
    const remoteExtension = await remoteExtensionService.getRemoteExtensionsByIds({
      ids: [this.manifest.extensionId],
      orgSlug: credentials.institution,
      token
    })
    if (!remoteExtension) {
      throw new ExtensionNotFoundError(
        `Você não possui a extensão ${path.relative(
          './',
          entryPointPath
        )} em sua organização`
      )
    }

    const lastVersion = remoteExtension[0].DynamicComponentsFiles.find(item => item.activated).version
    this.logger.info(`* Você está realizando deploy de uma nova versão para a extensão ${remoteExtension[0].title}`)
    if (lastVersion) {
      this.logger.info(`* Última versão ${lastVersion}`)
    }

    this.extensionService = new ExtensionService(this.manifest)

    if (!this.manifest.exists()) {
      this.logger.warning(
        'Por favor selecione sua extensão. Execute qt selectExtension no diretório onde encontra a extensão'
      )
      return
    }

    const versionName = await this.inputVersionName(lastVersion)
    const filename = this.getUploadFileNameDeploy(
      new Date().getTime().toString(),
      this.manifest.type === 'build'
    )
    const url = `https://storage.cloud.google.com/dynamic-components/${filename}`

    let extensionPath = entryPointPath
    if (this.manifest.type === 'build') {
      extensionPath = await this.extensionService.build(entryPointPath)
    }
    await this.extensionService.upload(fs.readFileSync(extensionPath), filename)
    try {
      this.spinner.start('Fazendo deploy...')
      await this.extensionService.deployVersion(
        {
          url,
          version: versionName,
          fileVuePrefix: filename,
          activated: true
        },
        token
      )
      this.spinner.succeed('Deploy feito com sucesso!')
    } catch (error) {
      let errorMessage = 'Erro durante o deploy. '
      if (error?.response?.data?.message) {
        errorMessage += error?.response?.data?.message
      }
      this.spinner.fail(errorMessage)
      throw error
    }
  }

  async inputVersionName () {
    const { versionName } = await inquirer.prompt([
      {
        name: 'versionName',
        message: 'Escolha uma versão para sua extensão',
        type: 'input'
      }
    ])
    return versionName
  }

  getUploadFileNameDeploy (currentTime, isBuild) {
    return encodeURI(
      `${credentials.institution}/${md5(currentTime)}.${isBuild ? 'js' : 'vue'}`
    )
  }
}

DeployCommand.flags = {
  all: flags.boolean({
    char: 'a',
    description: 'Realiza deploy de todas as extensões presente na propriedade quoti do package.json',
    exclusive: ['extra-flag']
  }),
  version: flags.boolean({
    char: 'v',
    description: 'Coloca um timestamp na versão',
    exclusive: ['extra-flag']
  })
}

DeployCommand.args = [
  {
    name: 'entryPointPath',
    required: false,
    description: 'Endereço do entry point (arquivo principal) da extensão'
  }
]

DeployCommand.description = 'Realiza deploy da sua extensão para o Quoti'

module.exports = DeployCommand
