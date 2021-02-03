var nodemon = require('nodemon')
const { bucket } = require('../config/storage')
const { firebase } = require('../config/firebase')
const credentials = require('../config/credentials')
const manifest = require('../config/manifest')
const fs = require('fs')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')

class ServeCommand extends Command {
  async run () {
    await credentials.load()
    try {
      const { args } = this.parse(ServeCommand)
      console.log(`Changes saved in ${args.filePath} will be displayed on the develop page`)
      await manifest.load()
      nodemon(
        `-e vue --watch ${args.filePath} `,
        {
          script: 'app.js',
          ext: 'js json'
        })
      nodemon.on('restart', files => {
        console.log(`Uploading file ${args.filePath}...`)
        this.sendExtensionsFile(args.filePath)
      }).on('quit', function () {
        console.log('')
        process.exit()
      })
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
    await firebase
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
