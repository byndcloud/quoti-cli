const { app } = require('../config/firebase')
const cliSelect = require('cli-select')
const credentials = require('../config/credentials')
const manifest = require('../config/manifest')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')
const api = require('../config/axios')

class SelectExtensionCommand extends Command {
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
        } }) // TODO: Replace cliSelect with an oclif plugin
      manifest.extensionId = extensions[choose.id].id
      manifest.extensionStorageId = extensions[choose.id].storeId
      manifest.name = choose.value
      manifest.save()
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
