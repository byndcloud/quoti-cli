const { bucket } = require('../config/storage')
const { firebase } = require('../config/firebase')
const credentials = require('../config/credentials')
const manifest = require('../config/manifest')
const fs = require('fs')
const { default: Command } = require('@oclif/command')
const { spawn, exec } = require('child_process')
const express = require('express')
const chalk = require('chalk')
const app = express()
const port = 1235
let allowRequest = true
class ServeCommand extends Command {
  async run () {
    await credentials.load()
    const { args } = this.parse(ServeCommand)
    app.put('/sendmodifications', async (req, res) => {
      if (allowRequest) {
        allowRequest = false
        this.sendExtensionsFile(args.filePath)
      }
      res.status(200).send()
    })

    app.listen(port, async () => {
      console.log(`App listening at http://localhost:${port}`)
      // await silentLogin()
      const spawnResult = spawn('nodemon', [
        '-e', 'vue',
        '--watch', args.filePath,
        `${__dirname}/../scriptNodemon.js`
      ])
      spawnResult.stdout.on('data', msg => {
        if (!msg.toString().includes('nodemon')) { console.log(msg.toString()) }
        // console.log(msg.toString())
      })
      // exec(`nodemon -e vue --watch ${args.filePath} ${__dirname}/../scriptNodemon.js`, (err, stdout, stderr) => {
      //   if (err) {
      //     console.error(err)
      //     return
      //   }
      //   console.log(stdout)
      // })
    })
  }
  async getUploadFileName () {
    return encodeURI(
      `${credentials.institution}/dev/idExtension${manifest.extensionId}.vue`
    )
  }
  async sendExtensionsFile (path) {
    console.log('Sending file to Quoti...')
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
    console.log(chalk.blue(`${filename} uploaded to ${'dynamic-components'}.`))
    allowRequest = true
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
