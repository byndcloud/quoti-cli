const md5 = require('md5')
const { firebase } = require('../config/firebase')
const manifest = require('../config/manifest')
const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')
const api = require('../config/axios')
const readline = require('readline')
const ExtensionService = require('../services/extension')
const fs = require('fs')
class DeployCommand extends Command {
  constructor () {
    super(...arguments)
    this.extensionService = new ExtensionService()
  }
  async run () {
    await credentials.load()
    try {
      if (!manifest.exists()) {
        console.log(chalk.yellow('Please select your extension. Try run qt selectExtension'))
        process.exit(0)
      }
      await manifest.load()
      const currentTime = await firebase.firestore.Timestamp.fromDate(new Date()).toMillis()
      const versionName = await this.inputVersionName() || currentTime
      const filename = this.getUploadFileNameDeploy(currentTime.toString(), manifest.type === 'build')
      const url = `https://storage.cloud.google.com/dynamic-components/${filename}`

      const { args } = this.parse(DeployCommand)

      let extensionPath = args.filePath
      if (manifest.type === 'build') {
        extensionPath = await this.extensionService.build(args.filePath)
      }

      await this.extensionService.upload(fs.readFileSync(extensionPath), filename)

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
  getUploadFileNameDeploy (currentTime, isBuild) {
    return encodeURI(`${credentials.institution}/${md5(currentTime)}.${isBuild ? 'js' : 'vue'}`)
  }
}

// TODO: Add documentation and flags specifications

DeployCommand.args = [
  {
    name: 'filePath',
    required: true,
    description: 'The path to a file to deploy',
    default: './src/App.vue'
  }
]

DeployCommand.description = `Deploy your extension
...
Deploy specify document to your application
`

module.exports = DeployCommand
