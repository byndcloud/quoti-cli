
const { default: axios } = require('axios')
const md5 = require('md5')
const silentLogin = require('./auth')
const { firebase } = require('../firebase')
const { bucket } = require('../storage')

async function getUploadFileNameDeploy (institution, currentTime) {
  return encodeURI(`${institution}/${md5(currentTime)}.vue`)
}

module.exports = async function (extensionIdStorage, institution, extensionId) {
  console.log('deploy na aplicação')
  await silentLogin('setup')
  const currentTime = await firebase.firestore.Timestamp.now().toMillis()
  console.log(currentTime)
  let filename = await getUploadFileNameDeploy('asdsad')
  console.log(filename)
  let url = `https://storage.cloud.google.com/dynamic-components/${filename}`
  await bucket.upload('./index.vue', {
    destination: filename,
    gzip: true,
    metadata: {
      cacheControl: 'public, max-age=0'
    }
  })
  let token = await firebase.auth().currentUser.getIdToken()
  const result = await axios.put(
    `http://localhost:8081/api/v1/${institution}/dynamic-components/${extensionId}`,
    {
      url: url,
      version: currentTime,
      fileVuePrefix: filename,
      id: extensionId
    },
    { headers: { Authorization: `Bearer ${token}` } })
  console.log(result)
  await firebase.firestore().collection('dynamicComponents').doc(extensionIdStorage).update({
    updatedAtToDeploy: currentTime
  })
  console.log('Deploy feito')
  process.exit(0)
}
