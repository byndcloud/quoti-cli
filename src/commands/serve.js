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
const { firebase } = require('../config/firebase')
const {
  ExtensionsNotFoundError,
  ExtensionNotFoundError
} = require('../utils/errorClasses')

const { flags } = require('@oclif/command')
const { getFrontBaseURL } = require('../utils/index')
const RemoteExtensionService = require('../services/remoteExtension')
const DevSessionIdService = require('../services/devSessionId.js')

class ServeCommand extends Command {
  constructor ({ projectRoot, extensionsPaths }) {
    super(...arguments)
    this._argConstructor = { projectRoot, extensionsPaths }
  }

  init () {
    super.init({ injectProjectRoot: true, injectExtensionsPaths: true })
    this.socket = new Socket()
    credentials.load()
  }

  getDependentExtensionPath ({
    changedFilePath,
    extensionsEntrypointsToCheck,
    alias
  }) {
    if (!changedFilePath) return
    const changedFileAbsolutePath = path.join(this.projectRoot, changedFilePath)
    const extensionsToUpdate = extensionsEntrypointsToCheck.filter(
      entryPoint => {
        const { arr: dependencies } = getDependencyTree({
          entry: entryPoint,
          alias
        })
        dependencies.push(entryPoint)
        return dependencies.includes(changedFileAbsolutePath)
      }
    )
    return extensionsToUpdate
  }

  getManifestsFromEntrypoints (extensionsEntrypoints) {
    const manifests = extensionsEntrypoints.reduce((manifests, entryPoint) => {
      manifests[entryPoint] = utils.getManifestFromEntryPoint(entryPoint)
      return manifests
    }, {})
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
        const remoteExtensionUUID =
          remoteExtensionsByPaths?.[path]?.extension_uuid
        if (manifestsByPaths[path].type === 'build') {
          distPath = await extensionService.build(path, {
            mode: 'staging',
            remoteExtensionUUID
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
        const urlExtension = `${getFrontBaseURL()}/${
          credentials.institution
        }/develop/${extensionData.extensionPath}?devSessionId=${sessionId}`
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

  chokidarOnChange (
    sessionId,
    remoteExtensionsByPaths,
    manifestsByPaths,
    alias,
    watcher
  ) {
    return async changedFilePath => {
      const extensionsEntrypointsToCheck = Object.keys(remoteExtensionsByPaths)
      const extensionsPathsToUpdate = this.getDependentExtensionPath({
        changedFilePath,
        extensionsEntrypointsToCheck,
        alias
      })
      const extensionsData = await this.buildAndUploadExtension({
        changedFilePath,
        extensionsPathsToUpdate,
        remoteExtensionsByPaths,
        manifestsByPaths
      })
      await this.sendCodeToQuotiBySocket(extensionsData, sessionId)
      if (process.env.NODE_ENV === 'test') {
        watcher.close()
      }
    }
  }

  async getRemoteExtensions (extensionsPaths) {
    const token = await firebase.auth().currentUser.getIdToken()
    const orgSlug = credentials.institution
    const remoteExtensionService = new RemoteExtensionService()
    const remoteExtensionsByPaths =
      await remoteExtensionService.getRemoteExtensions({
        extensionsPathsArg: extensionsPaths,
        orgSlug,
        token,
        parameters: ['path', 'extension_uuid']
      })
    return remoteExtensionsByPaths
  }

  checkWhichRemoteExtensionsExist (remoteExtensionsByPaths) {
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
      utils.validateEntryPointIncludedInPackage(
        this.args.entryPointPath,
        this.projectRoot
      )
    }

    const entrypointsOfExtensionsToWatch =
      this.getEntrypointsOfExtensionsToWatch(
        this.args?.entryPointPath,
        this.extensionsPaths
      )

    const remoteExtensionsByEntrypoints = await this.getRemoteExtensions(
      entrypointsOfExtensionsToWatch
    )
    this.checkWhichRemoteExtensionsExist(remoteExtensionsByEntrypoints)

    const manifestsByEntrypoints = await this.getManifestsFromEntrypoints(
      entrypointsOfExtensionsToWatch
    )
    await this.createUUIDsIfTheyDontExist(
      entrypointsOfExtensionsToWatch,
      remoteExtensionsByEntrypoints,
      manifestsByEntrypoints
    )
    this.addUUIDsToManifestsIfNeeded(
      entrypointsOfExtensionsToWatch,
      remoteExtensionsByEntrypoints,
      manifestsByEntrypoints
    )
    const alias = await this.getAliasFromVueConfig()

    this.logger.info('Conectado ao Quoti!')
    const devSessionIdService = new DevSessionIdService()
    const sessionId = await devSessionIdService.getSessionId({
      forceCreateDevSessionId: this.flags['new-session']
    })

    const watcher = chokidar.watch(filesToWatch, {
      cwd: this.projectRoot,
      ignored: ['node_modules']
    })
    const debouncedBuild = debounce(
      this.chokidarOnChange(
        sessionId,
        remoteExtensionsByEntrypoints,
        manifestsByEntrypoints,
        alias,
        watcher
      ),
      800
    )
    watcher.on('change', debouncedBuild)

    const watchingChangesMessage = this.args.entryPointPath
      ? `Observando alterações na extensão em ${this.args.entryPointPath}`
      : 'Observando alterações em qualquer extensão'

    this.logger.info(watchingChangesMessage)
    fs.rmSync('./dist', { recursive: true, force: true })
  }

  async getAliasFromVueConfig () {
    const vueConfigPath = path.join(this.projectRoot, 'vue.config.js')
    if (fs.existsSync(vueConfigPath)) {
      const vueConfig = require(vueConfigPath)
      return vueConfig?.configureWebpack?.resolve?.alias
    }
  }

  getEntrypointsOfExtensionsToWatch (entryPointPath, allExtensionsPaths) {
    const extensionsEntrypointsToCheck = []
    if (!entryPointPath) {
      extensionsEntrypointsToCheck.push(...allExtensionsPaths)
    } else {
      extensionsEntrypointsToCheck.push(path.resolve(entryPointPath))
    }
    return extensionsEntrypointsToCheck
  }

  async createUUIDsIfTheyDontExist (
    extensionsPathsToCheck,
    remoteExtensionsByPaths,
    manifestsByEntrypoints
  ) {
    for (const entrypoint of extensionsPathsToCheck) {
      const manifest = manifestsByEntrypoints[entrypoint]
      const extension = remoteExtensionsByPaths[entrypoint]
      const remoteExtensionHasNoUUID = !extension?.extension_uuid

      if (remoteExtensionHasNoUUID) {
        const extensionService = new ExtensionService(manifest)
        await extensionService.createExtensionUUID()
      }
    }
  }

  /**
   * Adds an UUID to the manifests that don't have it yet, provided that the
   * corresponding remote extensions have an UUID.
   *
   * @param {any} extensionsPathsToCheck
   * @param {any} remoteExtensionsByPaths
   * @param {any} manifestsByEntrypoints
   * @returns {JSONManager[]} The manifests that were updated
   */
  addUUIDsToManifestsIfNeeded (
    extensionsPathsToCheck,
    remoteExtensionsByPaths,
    manifestsByEntrypoints
  ) {
    const manifestsUpdated = []
    for (const entrypoint of extensionsPathsToCheck) {
      const manifest = manifestsByEntrypoints[entrypoint]
      const extension = remoteExtensionsByPaths[entrypoint]
      const extensionNeedsBuild = manifest.type === 'build'
      const manifestHasNoUUID = !manifest.extensionUUID
      const remoteExtensionHasUUID = extension?.extensionUUID

      if (extensionNeedsBuild && manifestHasNoUUID && remoteExtensionHasUUID) {
        manifest.extensionUUID = extension.extensionUUID
        manifest.save()
        manifestsUpdated.push(manifest)
      }
    }
    return manifestsUpdated
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

  static aliases = ['s', 'dev']

  static flags = {
    'deploy-develop': flags.boolean({
      description:
        'Indica se devemos salvar o build da extensão de develop no banco de dados da Beyond Company'
    }),
    'new-session': flags.boolean({
      description: 'Força a criação de um novo devSessionId'
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

  static description =
    'Observa mudanças no código local e as envia para o ambiente de desenvolvimento do Quoti'
}
module.exports = ServeCommand
