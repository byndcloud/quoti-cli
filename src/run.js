const express = require('express')
const ExtensionService = require('./services/extension')
const app = express()
const { exec } = require('child_process')
const port = 1235

const extensionService = new ExtensionService()

app.get('/sendmodifications', async (req, res) => {
  await extensionService.upload('./index.vue', getUploadFileName())
  res.status(200).send()
})

app.listen(port, async () => {
  console.log(`Example app listening at http://localhost:${port}`)
  await silentLogin()
  exec('nodemon -e vue index.js', (err, stdout, stderr) => {
    if (err) {
      console.error(err)
      return
    }
    console.log(stdout)
  })
})

var firebase = require('firebase/app')
const fs = require('fs')

require('firebase/auth')
require('firebase/firestore')

const { Storage } = require('@google-cloud/storage')

// Instantiate a storage client
const storage = new Storage()
const bucket = storage.bucket('dynamic-components')

var institution = null
var extensionId = null
var extensionIdStorage = null

var firebaseConfig = {
  apiKey: 'AIzaSyDiicN8xT3lImJY0hfcobQfRLit90zMw8U',
  authDomain: 'beyond-quoti.firebaseapp.com',
  databaseURL: 'https://beyond-quoti.firebaseio.com',
  projectId: 'beyond-quoti',
  storageBucket: 'beyond-quoti.appspot.com',
  messagingSenderId: '40570897776',
  appId: '1:40570897776:web:4f02b3cf8eba78ed763bb5'
}
// Initialize Firebase
firebase.initializeApp(firebaseConfig)

var Args = process.argv.slice(2)
console.log('Args: ', Args)

async function silentLogin (callsetup = false) {
  let rawdata = null
  let extensionValue = null
  if (!fs.existsSync('credentials.json')) {
    console.log('Faça o login!!! npm run login')
  } else {
    try {
      rawdata = fs.readFileSync('credentials.json')
      const userData = JSON.parse(rawdata).user
      extensionId = JSON.parse(rawdata).extensionId
      extensionValue = JSON.parse(rawdata).extensionValue
      extensionIdStorage = JSON.parse(rawdata).extensionStorageId

      const user = new firebase.User(
        userData,
        userData.stsTokenManager,
        userData
      )
      await firebase.auth().updateCurrentUser(user)
      institution = JSON.parse(rawdata).institution
    } catch (error) {
      console.log('erro ao carregar credenciais')
    }
  }
  if (callsetup) {
    return extensionId
  } else if (!extensionId) {
    console.log(
      '\n\n\tVocê já está logado'
    )
    process.exit(0)
  } else {
    console.log('Você está trabalhando na extensão ', extensionValue)
  }
}
function getUploadFileName () {
  return encodeURI(`${institution}/dev/idExtension${extensionId}.vue`)
}
