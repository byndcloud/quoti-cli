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
const JSONManager = require('../config/JSONManager')

const connectionUrl =
  'wss://connect.websocket.in/v3/1?api_key=oCdCMcMPQpbvNjUIzqtvF1d2X2okWpDQj4AwARJuAgtjhzKxVEjQU6IdCjwm&notify_self'

const options = {
  headers: {
    Authorization:
      'Binary 01100100 01100001 01110110 01101001 01100100 01100101 01110110',
    Cookie: 'uuid=dev-server-whiskas-sachê'
  }
}
const socket = new Ws(connectionUrl, options)

class ServeCommand extends Command {
  constructor () {
    super(...arguments)

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
      const currentExtensionPath = args.filePath
        ? path.resolve(args.filePath)
        : null

      if (
        currentExtensionPath &&
        !this.extensionsPaths.includes(currentExtensionPath)
      ) {
        throw new Error(
          `O caminho especificado (${args.filePath}) não foi declarado como de uma extensão no package.json em quoti.extensions.`
        )
      }

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

      const manifests = extensionsToUpdate.reduce(
        (manifestsObj, entryPoint) => {
          manifestsObj[entryPoint] = this.getManifestFromEntryPoint(entryPoint)
          return manifestsObj
        },
        {}
      )

      Object.entries(manifests).forEach(([path, manifest]) => {
        if (!manifest?.exists()) {
          throw new Error(
            `manifest.json não encontrado para a extensão em ${path}`
          )
        }
      })

      const extensionsData = await Promise.all(
        extensionsToUpdate.map(async entryPoint => {
          let distPath = null
          const manifest = manifests[entryPoint]
          const extensionService = new ExtensionService(manifest)
          if (manifest.type === 'build') {
            distPath = `./dist/dc_${manifest.extensionId}.umd.min.js`
            console.log(`Building extension...`)
            await extensionService.build(entryPoint, { mode: 'staging' })
            console.log(
              `Built extension ${entryPoint.replace(this.projectRoot, '')}`
            )
          }
          console.log(`Uploading file ${distPath}...`)
          const extensionCode = fs
            .readFileSync(distPath || changedFilePath)
            .toString()

          // extensionService.upload(fileBuffer, this.getUploadFileName())
          return {
            extensionInfo: manifests[entryPoint],
            code: extensionCode
          }
        })
      )

      extensionsData.forEach(extensionData => {
        const message = `Built and uploaded extension ${extensionData.extensionInfo.name}`
        socket.send(
          JSON.stringify({
            event: 'reload-extension',
            data: {
              ...extensionData,
              user: {
                uid: credentials.user.uid,
                orgSlug: credentials.institution
              }
            }
          })
        )
        console.log(message)
      })
    }
  }

  getManifestFromEntryPoint (changedFilePath) {
    const manifestPath = path.resolve(
      path.dirname(changedFilePath),
      'manifest.json'
    )
    const manifest = new JSONManager(manifestPath)
    return manifest
  }

  async run () {
    try {
      const { args } = this.parse(ServeCommand)
      const filesToWatch = ['*.js', './**/*.vue', './**/*.js']
      if (args.filePath) filesToWatch.push(args.filePath)

      const debouncedBuild = debounce(this.buildAndUpload(args), 800)
      chokidar
        .watch(filesToWatch, { ignored: ['node_modules'] })
        .on('change', debouncedBuild)
    } catch (error) {
      console.log(chalk.red(`${error}`))
    }
  }
  getUploadFileName () {
    let path = `${credentials.institution}/dev/idExtension${this.manifest.extensionId}.min`
    if (this.manifest.type === 'build') {
      path += '.js'
    } else {
      path += '.vue'
    }
    return encodeURI(path)
  }
}

ServeCommand.args = [
  {
    name: 'filePath',
    required: false,
    description: 'The path to a file to build'
  }
]
ServeCommand.description = `Create local serve and Upload file automatically
...
A local serve to upload your file automatically
`
module.exports = ServeCommand
