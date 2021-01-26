const credentials = require('../credentials')
const { app } = require('../firebase')
const readline = require('readline')
const { firebase } = require('../firebase')

async function login () {
  const institution = await insertIntitution()
  const customToken = await insertToken()
  const authFirebase = await app.auth().signInWithCustomToken(customToken)
  const data = {
    institution: institution,
    user: authFirebase.user.toJSON()
  }
  credentials.save(data)
}

async function insertIntitution () {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  return new Promise((resolve, reject) => {
    rl.question('Qual sua instituição? ', answer => {
      rl.close()
      resolve(answer)
    })
  })
}

async function insertToken () {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  return new Promise((resolve, reject) => {
    rl.question('Informe o seu token de login ', answer => {
      rl.close()
      resolve(answer)
    })
  })
}

async function silentLogin () {
  if (!credentials.exists()) {
    await login()
  } else {
    try {
      const userData = credentials.user
      const user = new firebase.User(
        userData,
        userData.stsTokenManager,
        userData
      )
      await firebase.auth().updateCurrentUser(user)
    } catch (error) {
      console.error(error)
      console.log('erro ao carregar credenciais')
    }
  }
}

module.exports.login = login

module.exports.silentLogin = silentLogin
