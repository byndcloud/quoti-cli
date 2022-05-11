const JSONManager = require('./JSONManager')
const fs = require('fs')
const path = require('path')
const home = require('os').homedir()
const Logger = require('../config/logger')
this.logger = Logger.child({
  tag: 'command/publish'
})
const baseConfigDirectory = path.join(home, '.config/quoti-cli/')

try {
  fs.mkdirSync(baseConfigDirectory, { recursive: true })
} catch (e) {
  this.logger.error(
    `Não foi possível criar a pasta em ${baseConfigDirectory}, mensagem `
  )
  this.logger.error(e)
}

let credentialsPath = path.join(baseConfigDirectory, 'credentials.json')
if (process.env.NODE_ENV === 'test') {
  credentialsPath = path.resolve(process.env.TEST_BEYOND_CREDENTIALS_PATH)
}

module.exports = new JSONManager(credentialsPath)
