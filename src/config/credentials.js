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

let credentialsPath = ''
const processArgs = process.argv.find(arg => arg.includes('--org='))
const org = processArgs ? processArgs.split('=')[1] : null
const wantsLocalCredential = process.argv.some(arg => arg.includes('--local'))
const existsLocalCredential = fs.existsSync('.qt/credentials.json')

/**
 * 1. Utiliza a credencial relativa a org passada com o argumento --org
 * 2. Utiliza a credencial local
 * 3. Utiliza a credencial padrão
 */
if (org && org !== 'undefined') {
  credentialsPath = path.join(baseConfigDirectory, `${org}.json`)
} else if (existsLocalCredential || wantsLocalCredential) {
  if (wantsLocalCredential && !existsLocalCredential) {
    fs.mkdirSync('.qt', { recursive: true })
  }

  this.logger.debug(
    'Arquivo de credenciais local encontrado. Utilizando arquivo de credenciais local'
  )
  credentialsPath = '.qt/credentials.json'
} else {
  credentialsPath = path.join(baseConfigDirectory, 'credentials.json')
  if (process.env.NODE_ENV === 'test') {
    credentialsPath = path.resolve(process.env.TEST_BEYOND_CREDENTIALS_PATH)
  }
}

module.exports = new JSONManager(credentialsPath)
