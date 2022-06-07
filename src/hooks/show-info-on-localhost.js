const Logger = require('../config/logger')
const credentials = require('../config/credentials')

module.exports = async function () {
  if (process.env.API_BASE_URL?.includes('localhost')) {
    if (credentials.exists()) {
      credentials.load()
      Logger.info(
        `\n**************** Você está em um ambiente localhost, organização: ${credentials.institution} ****************`
      )
    } else {
      Logger.info(
        '\n**************** Você está em um ambiente localhost ****************'
      )
    }
  }
}
