const { default: axios } = require('axios')
const md5 = require('md5')
const fs = require('fs')
const { firebase } = require('../firebase')
const { bucket } = require('../storage')
const credentials = require('../credentials')

async function getUploadFileNameDeploy (currentTime) {
  return encodeURI(`${credentials.institution}/${md5(currentTime)}.vue`)
}

module.exports = async function () {
  console.log('deploy na aplicação', credentials)
  const currentTime = new Date().getTime()
  console.log(currentTime)
  const filename = await getUploadFileNameDeploy(currentTime.toString())
  console.log(filename)

  const url = `https://storage.cloud.google.com/dynamic-components/${filename}`

  if (!fs.existsSync('./index.vue')) {
    throw new Error('File index.vue not found')
  }

  await bucket.upload('./index.vue', {
    destination: filename,
    gzip: true,
    metadata: {
      cacheControl: 'public, max-age=0'
    }
  })
  const token = await firebase.auth().currentUser.getIdToken()
  const result = await axios.put(
    `http://localhost:8081/api/v1/${credentials.institution}/dynamic-components/${credentials.extensionId}`,
    {
      url: url,
      version: currentTime,
      fileVuePrefix: filename,
      id: credentials.extensionId
    },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  console.log(result)
  await firebase
    .firestore()
    .collection('dynamicComponents')
    .doc(credentials.extensionIdStorage)
    .update({
      updatedAtToDeploy: currentTime
    })
  console.log('Deploy feito')
  process.exit(0)
}
