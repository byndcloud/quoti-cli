const { default: axios } = require('axios')
const md5 = require('md5')
const { bucket } = require('../config/storage')
const { firebase } = require('../config/firebase')
const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const { spawn } = require('child_process')
const express = require('express')
const app = express()
const port = 1235

class ServeCommand extends Command {
  async run () {
    await credentials.load()
    const { args } = this.parse(ServeCommand)
    app.get('/sendmodifications', async (req, res) => {
      await this.sendExtensionsFile(args.filePath)
      res.status(200).send()
    })

    app.listen(port, async () => {
      console.log(`Example app listening at http://localhost:${port}`)
      // await silentLogin()
      const spawnResult = spawn('nodemon', [
        '-e', 'vue',
        `${__dirname}/../scriptNodemon.js`
      ])
      spawnResult.stdout.on('data', msg => {
        console.log(msg.toString())
      })
    })
  }

  async getUploadFileName () {
    return encodeURI(
      `${credentials.institution}/dev/idExtension${credentials.extensionId}.vue`
    )
  }
  async sendExtensionsFile (path) {
    console.log('Chamando a API')
    if (!credentials.extensionId) {
      console.log('Please select your extension. Try run qt selectExtension')
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
      .doc(credentials.extensionStorageId)
      .update({
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
    console.log(`${filename} uploaded to ${'dynamic-components'}.`)
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
