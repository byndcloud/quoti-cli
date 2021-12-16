const { app } = require('../config/firebase')
const cliSelect = require('cli-select')
const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')
const api = require('../config/axios')
const JSONManager = require('../config/JSONManager')

class SelectExtensionCommand extends Command {
  constructor () {
    super(...arguments)
    this.manifest = new JSONManager('./manifest.json')
  }
  async run () {
    try {
      const extensions = await this.listExtensions(credentials.institution)
      const mappedExt = extensions.map(el => el.title)
      console.log(chalk.bgMagentaBright('Choose your extension to work'))
      const choose = await cliSelect({
        unselected: '○',
        selected: '●',
        values: mappedExt,
        valueRenderer: (value, selected) => {
          if (selected) {
            return chalk.bgMagenta(value)
          }

          return value
        }
      }) // TODO: Replace cliSelect with an oclif plugin
      this.manifest.extensionId = extensions[ choose.id ].id
      this.manifest.extensionStorageId = extensions[ choose.id ].storeId
      this.manifest.type = extensions[ choose.id ].type === 'Com build' ? 'build' : 'noBuild'
      this.manifest.name = choose.value
      this.manifest.save()
      console.log(chalk.green(`Your extension is ${choose.value}`))
      console.log(chalk.yellow('Now run qt serve'))
    } catch (error) {
      console.log(chalk.red(error))
    }
  }
  async listExtensions (institution) {
    const token = await app.auth().currentUser.getIdToken()
    const result = await api.axios.get(
      `/${institution}/dynamic-components/`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return result.data
  }
}
SelectExtensionCommand.description = `Select your extension to work`
// TODO: Find a way to customize command name
module.exports = SelectExtensionCommand
