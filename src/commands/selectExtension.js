const { firebase } = require('../config/firebase')
const cliSelect = require('cli-select')
const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')
const api = require('../config/axios')

class SelectExtensionCommand extends Command {
  async run () {
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
    credentials.extensionId = extensions[choose.id].id
    credentials.extensionStorageId = extensions[choose.id].storeId
    credentials.extensionValue = choose.value
    credentials.save()
    console.log(chalk.yellow(`Your extension is ${choose.value}`))
    console.log(chalk.yellow('Now run qt serve'))
  }
  async listExtensions (institution) {
    const token = await firebase.auth().currentUser.getIdToken()
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
