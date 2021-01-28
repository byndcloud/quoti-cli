const { default: axios } = require('axios')
const { firebase } = require('../config/firebase')
const cliSelect = require('cli-select')
const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')

class SelectExtensionCommand extends Command {
  async run () {
    const extensions = await this.listExtensions(credentials.institution)
    const mappedExt = extensions.map(el => el.title)
    const choose = await cliSelect({ values: mappedExt }) // TODO: Replace cliSelect with an oclif plugin
    credentials.extensionId = extensions[choose.id].id
    credentials.extensionStorageId = extensions[choose.id].storeId
    credentials.extensionValue = choose.value
    credentials.save()
    console.log('\n\n\t\tAgora execure npm run serve')
  }

  async listExtensions (institution) {
    const token = await firebase.auth().currentUser.getIdToken()
    const result = await axios.get(
      `https://api.develop.minhaescola.app/api/v1/${institution}/dynamic-components/`,
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
