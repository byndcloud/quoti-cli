const md5 = require('md5')
const fs = require('fs')
const { firebase } = require('../config/firebase')
const { bucket } = require('../config/storage')
const manifest = require('../config/manifest')
const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')
const api = require('../config/axios')
const readline = require('readline')

class DeployCommand extends Command {
  async run () {
    await credentials.load()
    await manifest.load()
    try {
      const currentTime = await firebase.firestore.Timestamp.fromDate(new Date()).toMillis()
      const versionName = await this.inputVersionName() || currentTime
      const filename = this.getUploadFileNameDeploy(currentTime.toString())
      const url = `https://storage.cloud.google.com/dynamic-components/${filename}`

      const { args } = this.parse(DeployCommand)

      if (!manifest.extensionId) {
        console.log(chalk.yellow('Please select your extension. Try run qt selectExtension'))
        process.exit(0)
      } else if (!fs.existsSync(args.filePath)) {
        console.log(chalk.red(`File ${args.filePath} not found`))
        process.exit(0)
      }

      await bucket.upload(args.filePath, {
        destination: filename,
        gzip: true,
        metadata: {
          cacheControl: 'public, max-age=0'
        }
      })
      const token = await firebase.auth().currentUser.getIdToken()
      await api.axios.put(
        `/${credentials.institution}/dynamic-components/${manifest.extensionId}`,
        {
          url: url,
          version: versionName,
          fileVuePrefix: filename,
          id: manifest.extensionId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await firebase
        .firestore()
        .collection('dynamicComponents')
        .doc(manifest.extensionStorageId)
        .update({
          updatedAtToDeploy: currentTime
        })
      console.log(chalk.green('Deploy done!'))
      process.exit(0)
    } catch (error) {
      console.log(chalk.red(error))
    }
  }
  async inputVersionName () {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    return new Promise((resolve, reject) => {
      rl.question(`Version Name: `, answer => {
        rl.close()
        resolve(answer)
      })
    })
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
