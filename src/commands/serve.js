const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')
const readPkgSync = require('read-pkg-up').sync
const getDependencyTree = require('get-dependency-tree')

const { debounce } = require('lodash')
const { default: Command } = require('@oclif/command')

const credentials = require('../config/credentials')
const ExtensionService = require('../services/extension')
const Socket = require('../config/socket')
const { getManifestFromEntryPoint } = require('../utils/index')
const Logger = require('../config/logger')
const ora = require('ora')
class ServeCommand extends Command {
  constructor () {
    super(...arguments)
    this.spinnerOptions = {
      spinner: 'arrow3',
      color: 'yellow'
    }
    this.spinner = ora(this.spinnerOptions)
    this.logger = Logger.child({
      tag: 'command/publish'
    })
    this.socket = new Socket()

    credentials.load()

    const pkgInfo = readPkgSync()
    if (!pkgInfo?.packageJson) {
      throw new Error(
        'Nenhum arquivo package.json encontrado, tem certeza que o diretório atual é de um projeto Vue?'
      )
    }

    this.projectRoot = path.resolve(path.dirname(pkgInfo.path))
    this.extensionsPaths = pkgInfo.packageJson.quoti.extensions.map(extPath =>
      path.resolve(this.projectRoot, extPath)
    )
    if (this.extensionsPaths.length === 0) {
      throw new Error(
        'Nenhuma extensão declarada no package.json, adicione o entrypoint da sua extensão em um array no path quoti.extensions dentro do package.json'
      )
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

      const changedFileAbsolutePath = path.resolve(changedFilePath)
      const extensionsToUpdate = extensionsEntrypointsToCheck.filter(
        entryPoint => {
          const { arr: dependencies } = getDependencyTree({ entry: entryPoint })
          return dependencies.includes(changedFileAbsolutePath)
        }
      )

      // Victor: code below suports to extensions wich type is noBuild
      if (!extensionsToUpdate.length && changedFilePath.includes('.vue')) {
        extensionsToUpdate.push(changedFilePath)
      }

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
              await extensionService.createExtensionUUID()
            }
            distPath = `./dist/dc_${manifest.extensionUUID}.umd.min.js`
            await extensionService.build(entryPoint, { mode: 'staging' })
          }
          const fileBuffer = fs.readFileSync(distPath || changedFilePath)
          const extensionCode = fileBuffer.toString()
          await extensionService.upload(fileBuffer, this.getUploadFileName(manifest))
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
    try {
      const { args } = this.parse(ServeCommand)
      const filesToWatch = ['*.js', './**/*.vue', './**/*.js']

      if (
        args.entryPointPath &&
        !this.extensionsPaths.includes(path.resolve(args.entryPointPath))
      ) {
        throw new Error(
          `O caminho especificado (${args.entryPointPath}) não foi declarado como de uma extensão no package.json em quoti.extensions`
        )
      }

      this.logger.info('Conectado ao Quoti!')

      const debouncedBuild = debounce(this.buildAndUpload(args), 800)
      chokidar
        .watch(filesToWatch, { ignored: ['node_modules'] })
        .on('change', debouncedBuild)

      const watchingChangesMessage = args.entryPointPath
        ? `Observando alterações na extensão em ${args.entryPointPath}`
        : 'Observando alterações em qualquer extensão'

      this.logger.info(watchingChangesMessage)
    } catch (error) {
      this.logger.error(`${error}`)
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
