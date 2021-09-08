const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const { default: chalk } = require('chalk')
const manifest = require('../config/manifest')
const api = require('../config/axios')
const { firebase } = require('../config/firebase')
const readline = require('readline')
const moment = require('moment')

class PublishCommand extends Command {
  async run () {
    // The login itself is done in the hook so just display a message

    try {
      if (!manifest.exists()) {
        console.log(chalk.yellow('Please select your extension. Try run qt selectExtension'))
        process.exit(0)
      }
      const token = await firebase.auth().currentUser.getIdToken()
      const activedExtension = await api.axios.get(
        `/${credentials.institution}/dynamic-components/active/${manifest.extensionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      const publishExtensionBoolean = await this.confirmVersion(activedExtension.data.version, activedExtension.data.createdAt)
      if (publishExtensionBoolean) {
        console.log(chalk.blue(`Parabéns, você acaba de publicar sua versão`))
      }
    } catch (error) {
      console.log(chalk.red(`${error}`))
    }
  }
  async confirmVersion (version, date) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    return new Promise((resolve, reject) => {
      rl.question(`Publish version ${chalk.blue(version)} created at ${chalk.blue(moment(date).format('LLLL'))} on the marketplace? Yes/No `, answer => {
        rl.close()
        if (
          answer.toLowerCase() === 's' ||
            answer.toLowerCase() === 'sim' ||
            answer.toLowerCase() === 'yes' ||
            answer.toLowerCase() === 'y'
        ) {
          resolve(version)
        } else {
          console.log(chalk.red('operation canceled'))
          resolve(false)
        }
      })
    })
  }
}
PublishCommand.description = `Logout from the current organization`

module.exports = PublishCommand
