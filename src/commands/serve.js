const { bucket } = require('../config/storage')
const { firebase, appExtension } = require('../config/firebase')
const credentials = require('../config/credentials')
const manifest = require('../config/manifest')
const fs = require('fs')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')
const chokidar = require('chokidar')
const ExtensionService = require('../services/extension')

class ServeCommand extends Command {
  constructor () {
    super(arguments)
    this.extensionService = new ExtensionService()
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
      chokidar.watch(args.filePath).on('all', (event, path) => {
        console.log(`Uploading file ${args.filePath}...`)
        this.extensionService.upload(args.filePath, this.getUploadFileName())
      })
      // nodemon(`-e vue --watch ${args.filePath} -V`)
      // nodemon.on('restart', files => {
      //  this.sendExtensionsFile(args.filePath)
      // }).on('quit', function () {
      //   console.log('saiu')
      //   process.exit()
      // }).on('crash', function (e) {
      //   console.log('crash', e)
      //   process.exit()
      // }).on('start', function (e) {
      //   console.log('start', e)
      // })
    } catch (error) {
      console.log(chalk.red(`${error}`))
    }
  }
  getUploadFileName () {
    return encodeURI(
      `${credentials.institution}/dev/idExtension${manifest.extensionId}.vue`
    )
  }
}

ServeCommand.args = [
  {
    name: 'filePath',
    required: false,
    description: 'The path to a file to deploy',
    default: './src/index.vue'
  }
]
ServeCommand.description = `Create local serve and Upload file automatically
...
A local serve to upload your file automatically
`
// TODO: Find a way to customize command name
module.exports = ServeCommand
