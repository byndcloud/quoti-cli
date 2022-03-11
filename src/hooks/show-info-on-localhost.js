const Logger = require('../config/logger')
const path = require('path')
const pathEnv = path.join(__dirname, '../../.env')
const credentials = require('../config/credentials')
require('dotenv').config({ path: pathEnv })

module.exports = async function () {
  if (process.env.API_BASE_URL?.includes('localhost')) {
    credentials.load()
    Logger.info(`**************** Você está em um ambiente localhost, organização: ${credentials.institution} ****************`)
  }
}
