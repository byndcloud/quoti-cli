const Logger = require('../config/logger')
const path = require('path')
const pathEnv = path.join(__dirname, '../../.env')
const credentials = require('../config/credentials')
require('dotenv').config({ path: pathEnv })

module.exports = async function () {
  if (process.env.API_BASE_URL?.includes('localhost')) {
    if (credentials.exists()) {
      credentials.load()
      Logger.info(`\n**************** Você está em um ambiente localhost, organização: ${credentials.institution} ****************`)
    } else {
      Logger.info('\n**************** Você está em um ambiente localhost ****************')
    }
  }
}
