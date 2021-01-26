const { firebase  } = require('./firebase')
const cliSelect = require('cli-select')

async function listExtensions() {
  let token = await firebase.auth().currentUser.getIdToken()
  const result = await axios.get(`https://api.develop.minhaescola.app/api/v1/${institution}/dynamic-components/`,
      { headers: { Authorization: `Bearer ${token}` } })
  // console.log(result.data)
  return result.data
}

module.exports = async function () {
  await silentLogin('setup')
  let extensions = await listExtensions()
  rawdata = fs.readFileSync('credentials.json');
  let credenciais = (JSON.parse(rawdata))
  let mappedExt = extensions.map(el => {
      return el.title
  })
  console.log(extensions)
  let choose = await cliSelect({ values: mappedExt })
  credenciais.extensionId = extensions[choose.id].id
  credenciais.extensionStorageId = extensions[choose.id].storeId
  credenciais.extensionValue = choose.value
  console.log(credenciais)
  fs.writeFileSync('credentials.json', JSON.stringify(credenciais));
  console.log("\n\n\t\tAgora execure npm run serve")

}
