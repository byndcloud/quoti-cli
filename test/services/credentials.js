const path = require('path')
const fs = require('fs')
const JSONManager = require('../../src/config/JSONManager')
const credentialsPath = path.resolve(process.env.TEST_BEYOND_CREDENTIALS_PATH)
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

  deleteSessionId () {
    delete this.devSessionId
    this.save()
  }
}
module.exports = Credentials
