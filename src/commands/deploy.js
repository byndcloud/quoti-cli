const md5 = require('md5')
const { firebase } = require('../config/firebase')
const credentials = require('../config/credentials')
const Command = require('../base.js')
const ExtensionService = require('../services/extension')
const RemoteExtensionService = require('../services/remoteExtension')
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

    const userProvidedEntryPoint = this.args.entryPointPath

    const userWantsToDeployAllExtensions = this.flags.all

    if (userProvidedEntryPoint && userWantsToDeployAllExtensions) {
      this.logger.warning(
        `Flag --all desconsiderada pois o entrypoint ${userProvidedEntryPoint} foi informado`
      )
    }

    const entryPointsPath = await this.getExtensionsEntrypointsToDeploy(
      userProvidedEntryPoint
    )

    const promptVersion = this.flags['ask-version']
    for (const entryPointPath of entryPointsPath) {
      await this.deployExtension(entryPointPath, promptVersion)
    }
  }

  /**
   *
   * @param {string} entryPointPath
   * @param {boolean} isVersionTimestamp
   */
  async deployExtension (entryPointPath, promptVersion) {
    this.logger.info('\n----------------------------------------------')
    const manifest = utils.getManifestFromEntryPoint(entryPointPath)

    const token = await firebase.auth().currentUser.getIdToken()
    const remoteExtensionService = new RemoteExtensionService()
    const [remoteExtension] =
      await remoteExtensionService.listRemoteExtensionsByUUIDs(
        [manifest.extensionUUID],
        credentials.institution,
        token
      )

    if (!remoteExtension) {
      throw new ExtensionNotFoundError(null, {
        name: manifest.name,
        orgSlug: credentials.institution
      })
    }

    const lastDynamicComponentFile =
      remoteExtension.DynamicComponentsFiles.find(item => item.activated)
    const lastVersion = lastDynamicComponentFile?.version
    this.logger.info(
      `* Você está realizando deploy de uma nova versão para a extensão "${remoteExtension?.title}"`
    )
    if (lastVersion) {
      this.logger.info(`* Versão atual: ${lastVersion}`)
    } else {
      this.logger.info('* Extensão não possui uma versão ativa')
    }

    this.extensionService = new ExtensionService(manifest)

    if (!manifest.exists()) {
      this.logger.warning(
        'Execute "qt link" antes de realizar o deploy da sua extensão'
      )
      return
    }

    let versionName = Date.now()
    if (promptVersion) {
      versionName = await this.promptVersionName(lastVersion)
    }
    const filename = this.getUploadFileNameDeploy(
      new Date().getTime().toString(),
      manifest.type === 'build'
    )
    const url = `https://storage.cloud.google.com/dynamic-components/${filename}`

    const remoteExtensionUUID = remoteExtension?.extension_uuid
    const extensionCode = await this.extensionService.build(entryPointPath, {
      remoteExtensionUUID
    })
    await this.extensionService.upload(extensionCode, filename)
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

  async promptVersionName () {
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

  async getExtensionsEntrypointsToDeploy (entryPointFromUser) {
    const userProvidedAnEntryPoint = !!entryPointFromUser
    const userWantsToDeployAllExtensions = this.flags.all

    if (userProvidedAnEntryPoint) {
      utils.validateEntryPointIncludedInPackage(
        entryPointFromUser,
        this.projectRoot
      )
      return [entryPointFromUser]
    } else if (userWantsToDeployAllExtensions) {
      return this.extensionsPaths
    } else {
      return utils.promptExtensionEntryPointsFromUser({
        extensionsPaths: this.extensionsPaths,
        message: 'De qual extensão você deseja fazer deploy?'
      })
    }
  }

  finally () {
    /**
     * This is necessary due to a bug in the google cloud storage library
     * which causes the command to hang when the command is run not in a test
     * environment
     */
    if (process.env.NODE_ENV !== 'test') {
      process.exit(0)
    }
  }

  static aliases = ['d']

  static flags = {
    all: flags.boolean({
      char: 'a',
      description:
        'Realiza deploy de todas as extensões presente na propriedade quoti do package.json',
      exclusive: ['extra-flag']
    }),
    'ask-version': flags.boolean({
      char: 'av',
      description:
        'Permite selecionar uma versão para o deploy quando a flag --all for passada também. Por padrão, um timestamp será usado para identificar a versão.',
      exclusive: ['extra-flag']
    }),
    org: flags.string({ description: 'Slug da organização' })
  }

  static args = [
    {
      name: 'entryPointPath',
      required: false,
      description: 'Endereço do entry point (arquivo principal) da extensão'
    }
  ]

  static description = 'Realiza deploy da sua extensão para o Quoti'
}

module.exports = DeployCommand
