const md5 = require('md5')
const { firebase } = require('../config/firebase')
const ora = require('ora')
const credentials = require('../config/credentials')
const Command = require('../base.js')
const ExtensionService = require('../services/extension')
const RemoteExtensionService = require('../services/remoteExtension')
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const utils = require('../utils/index')

const { ExtensionNotFoundError } = require('../utils/errorClasses')

class DeployCommand extends Command {
  constructor ({ projectRoot, extensionsPaths }) {
    super(...arguments)
    this._argConstructor = { projectRoot, extensionsPaths }
  }

  init () {
    super.init()
    this.spinnerOptions = {
      spinner: 'arrow3',
      color: 'yellow'
    }
    this.spinner = ora(this.spinnerOptions)
    try {
      this.projectRoot = this._argConstructor?.projectRoot || utils.getProjectRootPath()
      this.extensionsPaths = this._argConstructor?.extensionsPaths || utils.listExtensionsPaths(this.projectRoot)
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
    credentials.load()
    let { entryPointPath } = this.args
    if (!entryPointPath) {
      entryPointPath = await utils.getEntryPointFromUser({
        extensionsPaths: this.extensionsPaths,
        message: 'De qual extensão você deseja fazer deploy?'
      })
    } else {
      utils.validateEntryPointIncludedInPackage(entryPointPath, this.projectRoot)
    }
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
      await this.extensionService.deployVersion({
        data: {
          url,
          version: versionName,
          fileVuePrefix: filename,
          activated: true
        },
        token
      })
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

DeployCommand.args = [
  {
    name: 'entryPointPath',
    required: false,
    description: 'Endereço do entry point (arquivo principal) da extensão'
  }
]

DeployCommand.description = 'Realiza deploy da sua extensão para o Quoti'

module.exports = DeployCommand
