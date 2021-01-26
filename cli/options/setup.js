const { default: axios } = require('axios')
const { firebase } = require('../firebase')
const cliSelect = require('cli-select')
const fs = require('fs')

async function listExtensions (institution) {
  // console.log(`Listing`)
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
  const rawdata = fs.readFileSync('./credentials.json')
  const credenciais = JSON.parse(rawdata)
  const extensions = await listExtensions(credenciais.institution)
  const mappedExt = extensions.map(el => el.title)
  // console.log(extensions)
  const choose = await cliSelect({ values: mappedExt })
  credenciais.extensionId = extensions[choose.id].id
  credenciais.extensionStorageId = extensions[choose.id].storeId
  credenciais.extensionValue = choose.value
  // console.log(credenciais)
  fs.writeFileSync('./credentials.json', JSON.stringify(credenciais))
  console.log('\n\n\t\tAgora execure npm run serve')
}

module.exports.setExtension = setExtension
