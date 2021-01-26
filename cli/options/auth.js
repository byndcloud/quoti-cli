
const { firebase  } = require('./firebase')

module.exports = async function silentLogin(callsetup = false) {
  let rawdata = null
  let extensionValue = null
  if (!fs.existsSync('credentials.json')) {
      console.log('fazendo login')
      await login()
  } else {
      try {
          rawdata = fs.readFileSync('credentials.json');
          const userData = (JSON.parse(rawdata)).user
          extensionId = (JSON.parse(rawdata)).extensionId
          extensionValue = (JSON.parse(rawdata)).extensionValue
          extensionIdStorage = (JSON.parse(rawdata)).extensionStorageId

          const user = new firebase.User(userData, userData.stsTokenManager, userData)
          await firebase.auth().updateCurrentUser(user)
          institution = (JSON.parse(rawdata)).institution
      } catch (error) {
          console.log('erro ao carregar credenciais')
      }
  }
  if (callsetup) {
      return extensionId
  }
  else if (!extensionId) {
      console.log("\n\n\tVocê já estar logado. Agora execute npm run setup para selecionar uma extensão")
      process.exit(0)
  } else {
      console.log('Você está trabalhando na extensão ', extensionValue)
  }

}