const semver = require('semver')
const Logger = require('../config/logger')
module.exports = async function (options) {
  const nodeVersion = process.versions.node
  if (!semver.gte(nodeVersion, '14.17.0')) {
    Logger.error('É necessário que a versão do Node seja no mínimo 14.17.0.')
    process.exit(0)
  }
}
