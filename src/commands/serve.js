const credentials = require('../config/credentials')
const fs = require('fs')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')
const chokidar = require('chokidar')
const ExtensionService = require('../services/extension')
const { debounce } = require('lodash')
const path = require('path')
const JSONManager = require('../config/JSONManager')

class ServeCommand extends Command {
  buildAndUpload (args) {
    if (!this.manifest) {
      const manifestPath = path.resolve(path.dirname(args.filePath), 'manifest.json')
      this.manifest = new JSONManager(manifestPath)
    }
    return async (event, path) => {
      let distPath = args.filePath

      if (this.manifest.type === 'build') {
        distPath = `./dist/dc_${this.manifest.extensionId}.umd.min.js`
        console.log(`Building extension...`)
        await this.extensionService.build(args.filePath, { mode: 'staging' })
      }
      console.log(`Uploading file ${distPath}...`)
      await this.extensionService.upload(fs.readFileSync(distPath), this.getUploadFileName())
    }
  }
  async run () {
    await credentials.load()
    try {
      const { args } = this.parse(ServeCommand)
      const manifestPath = path.resolve(path.dirname(args.filePath), 'manifest.json')
      this.manifest = new JSONManager(manifestPath)
      this.extensionService = new ExtensionService(this.manifest)

      console.log(`Changes saved in ${args.filePath} will be displayed on the develop page`)
      console.log(chalk.green(`Waiting for changes ...`))

      if (!this.manifest.exists()) {
        console.log(chalk.yellow('Please select your extension. Try run qt selectExtension'))
        process.exit(0)
      }
      if (!fs.existsSync(args.filePath) || args.filePath.slice(-4) !== '.vue') {
        console.log(chalk.red(`Path ${args.filePath} is not valid directory`))
        process.exit(0)
      }
      await this.manifest.load()

      const filesToWatch = [ args.filePath, '*.js', './**/*.vue', './**/*.js' ]

      const debouncedBuild = debounce(this.buildAndUpload(args), 800)
      chokidar.watch(filesToWatch, { ignored: [ 'node_modules' ] }).on('change', debouncedBuild)
      chokidar.watch(filesToWatch, { ignored: [ 'node_modules' ] }).on('ready', debouncedBuild)
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
    return encodeURI(
      path
    )
  }
}

ServeCommand.args = [
  {
    name: 'filePath',
    required: false,
    description: 'The path to a file to build',
    default: './src/App.vue'
  }
]
ServeCommand.description = `Create local serve and Upload file automatically
...
A local serve to upload your file automatically
`
module.exports = ServeCommand
