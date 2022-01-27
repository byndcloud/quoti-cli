const md5 = require('md5')
const { firebase } = require('../config/firebase')
const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')
const api = require('../config/axios')
const ExtensionService = require('../services/extension')
const fs = require('fs')
const JSONManager = require('../config/JSONManager')
const path = require('path')
const inquirer = require('inquirer')
const semver = require('semver')

class DeployCommand extends Command {
  async run () {
    await credentials.load()
    const { args } = this.parse(DeployCommand)
    const manifestPath = path.resolve(path.dirname(args.filePath), 'manifest.json')
    this.manifest = new JSONManager(manifestPath)
    this.extensionService = new ExtensionService(this.manifest)
    try {
      if (!this.manifest.exists()) {
        console.log(chalk.yellow('Please select your extension. Try run qt selectExtension in the folder where the extension\'s is'))
        process.exit(0)
      }
      const currentTime = await firebase.firestore.Timestamp.fromDate(new Date()).toMillis()
      const versionName = await this.inputVersionName() || currentTime
      const filename = this.getUploadFileNameDeploy(currentTime.toString(), this.manifest.type === 'build')
      const url = `https://storage.cloud.google.com/dynamic-components/${filename}`

      let extensionPath = args.filePath
      if (this.manifest.type === 'build') {
        extensionPath = await this.extensionService.build(args.filePath)
      }

      await this.extensionService.upload(fs.readFileSync(extensionPath), filename)

      const token = await firebase.auth().currentUser.getIdToken()
      await api.axios.put(
        `/${credentials.institution}/dynamic-components/${this.manifest.extensionId}`,
        {
          url: url,
          version: versionName,
          fileVuePrefix: filename,
          activated: true
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
    const { versionName } = await inquirer.prompt([
      {
        name: 'versionName',
        message:
            `Escolha uma versão para sua extensão`,
        type: 'input',
        validate: input => {
          if (!semver.valid(input)) {
            return 'A versão deve está no formato x.x.x'
          }
          return true
        }

      }
    ])
    return versionName
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
