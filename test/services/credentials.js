const path = require('path')
const fs = require('fs')
const JSONManager = require('../../src/config/JSONManager')
const dotenv = require('dotenv')
const deindent = require('deindent')
dotenv.config({ path: path.join(__dirname, '../../.env.test') })
const credentialsPath = path.resolve(process.env.TEST_BEYOND_CREDENTIALS_PATH)
class Credentials extends JSONManager {
  constructor () {
    super(credentialsPath)
    this.credentialsPath = credentialsPath
  }

  createBeyondCredential () {
    const beyondCredentials = process.env.TEST_BEYOND_CREDENTIALS
    if (!beyondCredentials) {
      throw new Error(
        deindent`
        A variável de ambiente TEST_BEYOND_CREDENTIALS precisa ser preenchida com uma credencial válida da organização beyond. 
        Basta fazer qt login na beyond e copiar o conteúdo do arquivo ~/.config/quoti-cli/credentials.json para a variável de ambiente.`
      )
    }
    fs.writeFileSync(this.credentialsPath, beyondCredentials)
    this.load()
    return this.credentialsPath
  }

  deleteSessionId () {
    delete this.devSessionId
    this.save()
  }
}
module.exports = Credentials
