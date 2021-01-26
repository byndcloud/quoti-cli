const { default: axios } = require('axios')
const { firebase } = require('../firebase')
const cliSelect = require('cli-select')
const credentials = require('../credentials')

async function listExtensions (institution) {
  let token = await firebase.auth().currentUser.getIdToken()
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

async function setExtension () {
  const extensions = await listExtensions(credentials.institution)
  const mappedExt = extensions.map(el => el.title)
  const choose = await cliSelect({ values: mappedExt })
  credentials.extensionId = extensions[choose.id].id
  credentials.extensionStorageId = extensions[choose.id].storeId
  credentials.extensionValue = choose.value
  credentials.save()
  console.log('\n\n\t\tAgora execure npm run serve')
}

module.exports.setExtension = setExtension
