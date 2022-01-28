const fs = require('fs')
const Ws = require('ws')
const path = require('path')
const chalk = require('chalk')
const chokidar = require('chokidar')
const readPkgSync = require('read-pkg-up').sync
const getDependencyTree = require('get-dependency-tree')

const { debounce } = require('lodash')
const { default: Command } = require('@oclif/command')

const credentials = require('../config/credentials')
const ExtensionService = require('../services/extension')
const Socket = require('../config/socket')
const { getManifestFromEntryPoint } = require('../utils/index')

class ServeCommand extends Command {
  constructor () {
    super(...arguments)

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
          // console.log(`entry`, entryPoint, dependencies)
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
            console.log(`Building extension...`)
            await extensionService.build(entryPoint, { mode: 'staging' })
            console.log(
              `Built extension ${entryPoint.replace(this.projectRoot, '')}`
            )
          }
          console.log(`Uploading file ${distPath}...`)
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
        console.log(`Built extension ${extensionData.extensionInfo.name}`)

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
          console.log(chalk.blue('Quoti received extension code!'))
          return
        }
        console.log(chalk.red('Error sending code to Quoti', err))
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

      this.log(chalk.blue('Connected to Quoti!'))

      const debouncedBuild = debounce(this.buildAndUpload(args), 800)
      chokidar
        .watch(filesToWatch, { ignored: ['node_modules'] })
        .on('change', debouncedBuild)

      const watchingChangesMessage = args.entryPointPath
        ? `Waching and serving changes in extension at ${args.entryPointPath}`
        : 'Waching and serving changes in any extension'

      this.log(chalk.blue(watchingChangesMessage))
    } catch (error) {
      console.log(chalk.red(`${error}`))
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
    description: "The path to an Extension's entry point"
  }
]
ServeCommand.description = `Create local serve and Upload file automatically
...
A local serve to upload your file automatically
`
module.exports = ServeCommand
