const { bucket } = require('../config/storage')
const { firebase, appExtension } = require('../config/firebase')
const credentials = require('../config/credentials')
const manifest = require('../config/manifest')
const fs = require('fs')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')
const chokidar = require('chokidar')

class ServeCommand extends Command {
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
        this.sendExtensionsFile(args.filePath)
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
  async getUploadFileName () {
    return encodeURI(
      `${credentials.institution}/dev/idExtension${manifest.extensionId}.vue`
    )
  }
  async sendExtensionsFile (path) {
    if (!manifest.extensionId) {
      console.log(chalk.yellow('Please select your extension. Try run qt selectExtension'))
      process.exit(0)
    } else if (!fs.existsSync(path)) {
      console.log(chalk.red(`File ${path} not found`))
      process.exit(0)
    }
    // Create a new blob in the bucket and upload the file data.
    // Uploads a local file to the bucket
    const filename = await this.getUploadFileName()
    await bucket.upload(path, {
      destination: filename,
      gzip: true,
      metadata: {
        cacheControl: 'public, max-age=0'
      }
    })
    await appExtension
      .firestore()
      .collection('dynamicComponents')
      .doc(manifest.extensionStorageId)
      .update({
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
    console.log(chalk.blue(`File ${path} uploaded.`))
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
