const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')
const getDependencyTree = require('get-dependency-tree')

const { debounce, pickBy } = require('lodash')
const Command = require('../base.js')

const credentials = require('../config/credentials')
const ExtensionService = require('../services/extension')
const Socket = require('../config/socket')
const utils = require('../utils/index')
const ora = require('ora')
const { firebase } = require('../config/firebase')
const {
  ExtensionsNotFoundError,
  ExtensionNotFoundError
} = require('../utils/errorClasses')

const { flags } = require('@oclif/command')
const { randomUUID } = require('crypto')
const { getFrontBaseURL } = require('../utils/index')
const RemoteExtensionService = require('../services/remoteExtension')

class ServeCommand extends Command {
  constructor ({ projectRoot, extensionsPaths }) {
    super(...arguments)
    this.spinnerOptions = {
      spinner: 'arrow3',
      color: 'yellow'
    }
    this.spinner = ora(this.spinnerOptions)
    this.socket = new Socket()
    credentials.load()
    try {
      this.projectRoot = projectRoot || utils.getProjectRootPath()
      this.extensionsPaths =
        extensionsPaths || utils.listExtensionsPaths(this.projectRoot)
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

  getDependentExtensionPath ({ changedFilePath, extensionsEntrypointsToCheck }) {
    if (!changedFilePath) return
    const changedFileAbsolutePath = path.join(this.projectRoot, changedFilePath)
    const extensionsToUpdate = extensionsEntrypointsToCheck.filter(
      entryPoint => {
        const { arr: dependencies } = getDependencyTree({ entry: entryPoint })
        dependencies.push(entryPoint)
        return dependencies.includes(changedFileAbsolutePath)
      }
    )
    return extensionsToUpdate
  }

  getManifestObjectFromPaths (extensionsToUpdate) {
    const manifests = extensionsToUpdate.reduce((manifestsObj, entryPoint) => {
      manifestsObj[entryPoint] = utils.getManifestFromEntryPoint(entryPoint)
      return manifestsObj
    }, {})

    Object.entries(manifests).forEach(([path, manifest]) => {
      if (!manifest?.exists()) {
        throw new Error(
          `manifest.json não encontrado para a extensão em ${path}, vá para a pasta da extensão e rode qt select-extension`
        )
      }
    })
    return manifests
  }

  async buildAndUploadExtension ({
    changedFilePath,
    extensionsPathsToUpdate,
    remoteExtensionsByPaths,
    manifestsByPaths
  }) {
    const extensionsData = await Promise.all(
      extensionsPathsToUpdate.map(async path => {
        let distPath = path
        const manifest = manifestsByPaths[path]
        const extensionService = new ExtensionService(manifest)
        if (manifestsByPaths[path].type === 'build') {
          distPath = await extensionService.build(path, {
            mode: 'staging'
          })
        }

        const fileBuffer = fs.readFileSync(distPath || changedFilePath)
        const extensionCode = fileBuffer.toString()
        if (this.flags['deploy-develop']) {
          extensionService.upload(fileBuffer, this.getUploadFileName(manifest))
        }
        return {
          extensionInfo: manifestsByPaths[path],
          extensionPath: remoteExtensionsByPaths[path].path,
          code: extensionCode
        }
      })
    )
    return extensionsData
  }

  async sendCodeToQuotiBySocket (extensionsData, sessionId) {
    extensionsData.forEach(async extensionData => {
      this.spinner.start('Enviando código para o Quoti...')
      const err = await this.socket.emit({
        event: 'reload-extension',
        data: {
          ...extensionData,
          sessionId,
          user: {
            uid: credentials.user.uid,
            orgSlug: credentials.institution
          }
        }
      })

      if (!err) {
        const urlExtension = `${getFrontBaseURL()}/${credentials.institution}/develop/${extensionData.extensionPath}?devSessionId=${sessionId}`
        await this.spinner.succeed('Disponível em ' + urlExtension)
        return
      }
      await this.spinner.fail('Quoti não recebeu o código da extensão!')
      this.logger.error(`Erro ao enviar extensão para o Quoti ${err}`)
      if (process.env.DEBUG) {
        console.error(err)
      }
    })
  }

  chokidarOnChange ({ sessionId, remoteExtensionsByPaths, manifestsByPaths }) {
    return async changedFilePath => {
      const extensionsEntrypointsToCheck = Object.keys(remoteExtensionsByPaths)
      const extensionsPathsToUpdate = this.getDependentExtensionPath({
        changedFilePath,
        extensionsEntrypointsToCheck
      })
      const extensionsData = await this.buildAndUploadExtension({
        changedFilePath,
        extensionsPathsToUpdate,
        remoteExtensionsByPaths,
        manifestsByPaths
      })
      await this.sendCodeToQuotiBySocket(extensionsData, sessionId)
    }
  }

  async getRemoteExtensions (extensionsPaths) {
    const token = await firebase.auth().currentUser.getIdToken()
    const orgSlug = credentials.institution
    const remoteExtensionService = new RemoteExtensionService()
    const remoteExtensionsByPaths = await remoteExtensionService.getRemoteExtensions({
      extensionsPathsArg: extensionsPaths,
      orgSlug,
      token,
      parameters: ['path', 'extension_uuid']
    })
    return remoteExtensionsByPaths
  }

  checkWhichRemoteExtensionsExists (remoteExtensionsByPaths) {
    const orgSlug = credentials.institution
    const remoteExtensionsNotFound = Object.keys(
      pickBy(remoteExtensionsByPaths, extension => !extension)
    ).map(entryPointPath => path.relative('./', entryPointPath))

    if (remoteExtensionsNotFound?.length > 1) {
      throw new ExtensionsNotFoundError(
        `Extensões abaixo não puderam ser encontradas em sua organização ${orgSlug} \n* ${remoteExtensionsNotFound.join(
          '\n* '
        )} `
      )
    } else if (remoteExtensionsNotFound?.length === 1) {
      throw new ExtensionNotFoundError(
        `Extensão ${remoteExtensionsNotFound[0]} não encontrada na organização ${orgSlug}`
      )
    }
  }

  async run () {
    const filesToWatch = ['*.js', './**/*.vue', './**/*.js']

    if (this.args.entryPointPath) {
      utils.validateEntryPointIncludedInPackage(this.args.entryPointPath)
    }

    const extensionsPathsToCheck = this.getExtensionsEntrypointsToCheck(this.args?.entryPointPath)
    const remoteExtensionsByPaths = await this.getRemoteExtensions(extensionsPathsToCheck)
    this.checkWhichRemoteExtensionsExists(remoteExtensionsByPaths)
    const manifestsByPaths = await this.getManifestObjectFromPaths(extensionsPathsToCheck)
    await this.createUUIDIfItDoesNotExist({ extensionsPathsToCheck, remoteExtensionsByPaths, manifestsByPaths })

    this.logger.info('Conectado ao Quoti!')

    const sessionId = randomUUID()
    const debouncedBuild = debounce(this.chokidarOnChange({ sessionId, remoteExtensionsByPaths, manifestsByPaths }), 800)
    chokidar
      .watch(filesToWatch, { cwd: this.projectRoot, ignored: ['node_modules'] })
      .on('change', debouncedBuild)

    const watchingChangesMessage = this.args.entryPointPath
      ? `Observando alterações na extensão em ${this.args.entryPointPath}`
      : 'Observando alterações em qualquer extensão'

    this.logger.info(watchingChangesMessage)
  }

  getExtensionsEntrypointsToCheck (entryPointPathArg) {
    const extensionsEntrypointsToCheck = []
    if (!entryPointPathArg) {
      extensionsEntrypointsToCheck.push(...this.extensionsPaths)
    } else {
      extensionsEntrypointsToCheck.push(path.resolve(entryPointPathArg))
    }
    return extensionsEntrypointsToCheck
  }

  async createUUIDIfItDoesNotExist ({ extensionsPathsToCheck, remoteExtensionsByPaths, manifestsByPaths }) {
    for (const extensionPath of extensionsPathsToCheck) {
      const manifest = manifestsByPaths[extensionPath]
      const extension = remoteExtensionsByPaths[extensionPath]
      if (manifest.type === 'build' && !manifest.extensionUUID) {
        if (extension?.extensionUUID) {
          manifest.extensionUUID = extension.extensionUUID
          manifest.save()
        } else {
          const extensionService = new ExtensionService(manifest)
          await extensionService.createExtensionUUID()
        }
      }
    }
  }

  getUploadFileName (manifest) {
    let path = `${credentials.institution}/dev/idExtension${manifest.extensionId}.min`
    if (manifest.type === 'build') {
      path += '.js'
    } else {
      path += '.vue'
    }
    return encodeURI(path)
  }
}
ServeCommand.flags = {
  'deploy-develop': flags.boolean({
    description: 'Indica se devemos salvar o build da extensão de develop no banco de dados da Beyond Company'
  })
}
ServeCommand.args = [
  {
    name: 'entryPointPath',
    required: false,
    description: 'Endereço do entry point (arquivo principal) da extensão'
  }
]
ServeCommand.description = `Cria um serve local e realiza upload automaticamente para o Quoti
...
Cria um serve local e realiza upload automaticamente para o Quoti
`
module.exports = ServeCommand
