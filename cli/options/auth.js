const { app } = require('../firebase')
const readline = require('readline')
const { firebase } = require('../firebase')
const fs = require('fs')

async function login () {
  const institution = await insertIntitution()
  let customToken = await insertToken()
  const authFirebase = await app.auth().signInWithCustomToken(customToken)
  let data = JSON.stringify({
    institution: institution,
    user: authFirebase.user.toJSON()
  })
  fs.writeFileSync('credentials.json', data)
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
  if (!fs.existsSync('./credentials.json')) {
    console.log('fazendo login')
    await login()
  } else {
    try {
      const rawdata = fs.readFileSync('./credentials.json')
      const userData = JSON.parse(rawdata).user
      const user = new firebase.User(
        userData,
        userData.stsTokenManager,
        userData
      )
      await firebase.auth().updateCurrentUser(user)
    } catch (error) {
      console.log('erro ao carregar credenciais')
    }
  }
}

module.exports.login = login

module.exports.silentLogin = silentLogin
