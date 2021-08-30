const credentials = require('../config/credentials')
const manifest = require('../config/manifest')
const fs = require('fs')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')
const chokidar = require('chokidar')
const ExtensionService = require('../services/extension')
const { debounce } = require('lodash')

class ServeCommand extends Command {
  constructor () {
    super(...arguments)
    this.extensionService = new ExtensionService()
  }
  build (args) {
    return async (event, path) => {
      console.log(`Building extension...`)
      await this.extensionService.build(args.filePath, { mode: 'staging' })

      const distPath = `./dist/dc_${manifest.extensionId}.umd.min.js`

      console.log(`Uploading file ${distPath}...`)
      await this.extensionService.upload(distPath, this.getUploadFileName())
    }
  }
  async run () {
    await credentials.load()
    try {
      const { args } = this.parse(ServeCommand)
      console.log(`Changes saved in ${args.filePath} will be displayed on the develop page`)
      console.log(chalk.green(`Waiting for changes ...`))

      if (!manifest.exists()) {
        console.log(chalk.yellow('Please select your extension. Try run qt selectExtension'))
        process.exit(0)
      }
      // if (!fs.existsSync(args.filePath) || args.filePath.slice(-4) !== '.vue') {
      if (!fs.existsSync(args.filePath) || args.filePath.slice(-4) !== '.vue') {
        console.log(chalk.red(`Path ${args.filePath} is not valid directory`))
        process.exit(0)
      }
      await manifest.load()

      const filesToWatch = [args.filePath, '*.js', './**/*.vue', './**/*.js']

      const debouncedBuild = debounce(this.build(args), 800)
      chokidar.watch(filesToWatch, { ignored: ['node_modules'] }).on('change', debouncedBuild)
      chokidar.watch(filesToWatch, { ignored: ['node_modules'] }).on('ready', debouncedBuild)
    } catch (error) {
      console.log(chalk.red(`${error}`))
    }
  }
  getUploadFileName () {
    return encodeURI(
      `${credentials.institution}/dev/idExtension${manifest.extensionId}.min.js`
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
// TODO: Find a way to customize command name
module.exports = ServeCommand
