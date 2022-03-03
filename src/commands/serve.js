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
      this.extensionsPaths = extensionsPaths || utils.listExtensionsPaths(this.projectRoot)
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
  getDependentExtensionPath ({ changedFilePath, args }) {
    if (!changedFilePath) return
    const extensionsEntrypointsToCheck = []

    const currentExtensionPath = args?.entryPointPath
      ? path.resolve(args.entryPointPath)
      : null

    if (!currentExtensionPath) {
      extensionsEntrypointsToCheck.push(...this.extensionsPaths)
    } else {
      extensionsEntrypointsToCheck.push(currentExtensionPath)
    }

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
  getManifestObjectFromPathsExtensions (extensionsToUpdate) {
    const manifests = extensionsToUpdate.reduce(
      (manifestsObj, entryPoint) => {
        manifestsObj[entryPoint] = utils.getManifestFromEntryPoint(entryPoint)
        return manifestsObj
      },
      {}
    )

    Object.entries(manifests).forEach(([path, manifest]) => {
      if (!manifest?.exists()) {
        throw new Error(
          `manifest.json não encontrado para a extensão em ${path}, vá para a pasta da extensão e rode qt select-extension`
        )
      }
    })
    return manifests
  }
  async buildAndUploadExtension ({ changedFilePath, extensionsToUpdate, manifests }) {
    const extensionsData = await Promise.all(
      extensionsToUpdate.map(async entryPoint => {
        let distPath = entryPoint
        const manifest = manifests[entryPoint]
        const extensionService = new ExtensionService(manifest)

        if (manifest.type === 'build') {
          if (!manifest.extensionUUID) {
            const extension = await extensionService.getExtension(manifest.extensionId)
            if (extension?.extensionUUID) {
              manifest.extensionUUID = extension.extensionUUID
              manifest.save()
            } else {
              await extensionService.createExtensionUUID()
            }
          }
          distPath = await extensionService.build(entryPoint, { mode: 'staging' })
        }
        const fileBuffer = fs.readFileSync(distPath || changedFilePath)
        const extensionCode = fileBuffer.toString()
        extensionService.upload(fileBuffer, this.getUploadFileName(manifest))
        return {
          extensionInfo: manifests[entryPoint],
          code: extensionCode
        }
      })
    )
    return extensionsData
  }
  async sendCodeToQuotiBySocket (extensionsData) {
    extensionsData.forEach(async extensionData => {
      this.spinner.start('Enviando código para o Quoti...')
      const err = await this.socket.emit({
        event: 'reload-extension',
        data: {
          ...extensionData,
          user: {
            uid: credentials.user.uid,
            orgSlug: credentials.institution
          }
        }
      })

      if (!err) {
        this.spinner.succeed('Quoti recebeu o código da extensão!')
        return
      }
      this.spinner.fail('Quoti não recebeu o código da extensão!')
      this.logger.error(`Erro ao enviar extensão para o Quoti ${err}`)
      if (process.env.DEBUG) {
        console.error(err)
      }
    })
  }
  chokidarOnChange (args, watch) {
    return async changedFilePath => {
      const extensionsToUpdate = this.getDependentExtensionPath({ changedFilePath, args })
      const manifests = this.getManifestObjectFromPathsExtensions(extensionsToUpdate)
      const extensionsData = await this.buildAndUploadExtension({ changedFilePath, extensionsToUpdate, manifests })
      await this.sendCodeToQuotiBySocket(extensionsData)
    }
  }
  async checkIfRemoteExtensionsExists (extensionsPaths) {
    const token = await firebase.auth().currentUser.getIdToken()
    const orgSlug = credentials.institution

    const remoteExtensionsByPaths = await utils.getRemoteExtensions({
      extensionsPathsArg: extensionsPaths,
      orgSlug,
      token
    })

    const remoteExtensionsNotFound =
      Object
        .keys(pickBy(remoteExtensionsByPaths, extension => !extension))
        .map(entryPointPath => path.relative('./', entryPointPath))

    if (remoteExtensionsNotFound?.length > 1) {
      throw new ExtensionsNotFoundError(`Extensões abaixo não puderam ser encontradas em sua organização ${orgSlug} \n* ${remoteExtensionsNotFound.join('\n* ')} `)
    } else if (remoteExtensionsNotFound?.length === 1) {
      throw new ExtensionNotFoundError(`Extensão ${remoteExtensionsNotFound[0]} não encontrada na organização ${orgSlug}`)
    }
  }

  async run () {
    const filesToWatch = ['*.js', './**/*.vue', './**/*.js']
    let extensionsPaths = this.extensionsPaths
    if (this.args.entryPointPath) {
      utils.validateEntryPointIncludedInPackage(this.args.entryPointPath)
      extensionsPaths = [this.args.entryPointPath]
    }

    await this.checkIfRemoteExtensionsExists(extensionsPaths)

    this.logger.info('Conectado ao Quoti!')

    const debouncedBuild = debounce(this.chokidarOnChange(this.args), 800)
    chokidar
      .watch(filesToWatch, { cwd: this.projectRoot, ignored: ['node_modules'] })
      .on('change', debouncedBuild)

    const watchingChangesMessage = this.args.entryPointPath
      ? `Observando alterações na extensão em ${this.args.entryPointPath}`
      : 'Observando alterações em qualquer extensão'

    this.logger.info(watchingChangesMessage)
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
