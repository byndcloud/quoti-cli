const md5 = require('md5')
const fs = require('fs')
const { firebase } = require('../config/firebase')
const { bucket } = require('../config/storage')
const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')
const api = require('../config/axios')

class DeployCommand extends Command {
  async run () {
    await credentials.load()
    const currentTime = await firebase.firestore.Timestamp.fromDate(new Date()).toMillis()
    const filename = this.getUploadFileNameDeploy(currentTime.toString())
    const url = `https://storage.cloud.google.com/dynamic-components/${filename}`

    const { args } = this.parse(DeployCommand)

    if (!fs.existsSync(args.filePath)) {
      throw new Error(`File ${args.filePath} not found`)
    }

    await bucket.upload(args.filePath, {
      destination: filename,
      gzip: true,
      metadata: {
        cacheControl: 'public, max-age=0'
      }
    })
    const token = await firebase.auth().currentUser.getIdToken()
    const result = await api.axios.put(
      `/${credentials.institution}/dynamic-components/${credentials.extensionId}`,
      {
        url: url,
        version: currentTime,
        fileVuePrefix: filename,
        id: credentials.extensionId
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    await firebase
      .firestore()
      .collection('dynamicComponents')
      .doc(credentials.extensionStorageId)
      .update({
        updatedAtToDeploy: currentTime
      })
    console.log(chalk.green('Deploy done!'))
  }

  getUploadFileNameDeploy (currentTime) {
    return encodeURI(`${credentials.institution}/${md5(currentTime)}.vue`)
  }
}

// TODO: Add documentation and flags specifications

DeployCommand.args = [
  {
    name: 'filePath',
    required: false,
    description: 'The path to a file to deploy',
    default: './src/index.vue'
  }
]

DeployCommand.description = `Deploy your extension
...
Deploy specify document to your application
`

module.exports = DeployCommand
