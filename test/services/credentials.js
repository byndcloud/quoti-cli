const path = require('path')
const fs = require('fs')
const JSONManager = require('../../src/config/JSONManager')
const credentialsPath = path.resolve(
  '/home/luizkof/Documentos/quoti/quoti-cli/test/beyondCredentials.json'
)
const dotenv = require('dotenv')
dotenv.config()
class Credentials extends JSONManager {
  constructor () {
    super(credentialsPath)
    this.credentialsPath = credentialsPath
  }

  createBeyondCredential () {
    const beyondCredentials = process.env.TEST_BEYOND_CREDENTIALS
    fs.writeFileSync(this.credentialsPath, beyondCredentials)
    this.load()
    return this.credentialsPath
  }
}
module.exports = Credentials
