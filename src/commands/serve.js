const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')
const getDependencyTree = require('get-dependency-tree')

const { debounce } = require('lodash')
const Command = require('../base.js')

const credentials = require('../config/credentials')
const ExtensionService = require('../services/extension')
const Socket = require('../config/socket')
const { getManifestFromEntryPoint } = require('../utils/index')
const ora = require('ora')
const { getProjectRootPath, listExtensionsPaths, validateEntryPointIncludedInPackage } = require('../utils/index')
class ServeCommand extends Command {
  constructor () {
    super(...arguments)
    this.spinnerOptions = {
      spinner: 'arrow3',
      color: 'yellow'
    }
    this.spinner = ora(this.spinnerOptions)
    this.socket = new Socket()

    credentials.load()
    try {
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
  buildAndUpload (args) {
    return async changedFilePath => {
      if (!changedFilePath) return

      const extensionsEntrypointsToCheck = []

      const currentExtensionPath = args.entryPointPath
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

      const manifests = extensionsToUpdate.reduce(
        (manifestsObj, entryPoint) => {
          manifestsObj[entryPoint] = getManifestFromEntryPoint(entryPoint)
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
            distPath = path.resolve(this.projectRoot, `dist/dc_${manifest.extensionUUID}.umd.min.js`)
            await extensionService.build(entryPoint, { mode: 'staging' })
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
  }

  async run () {
    const filesToWatch = ['*.js', './**/*.vue', './**/*.js']

    if (this.args.entryPointPath) {
      validateEntryPointIncludedInPackage(args.entryPointPath)
    }

    this.logger.info('Conectado ao Quoti!')

    const debouncedBuild = debounce(this.buildAndUpload(this.args), 800)
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
