const JSONManager = require('../config/JSONManager')
const path = require('path')
class Utils {
  isYes (text) {
    return ['s', 'sim', 'yes', 'y'].includes(text.toLowerCase())
  }
  getManifestFromEntryPoint (entrypointPath) {
    const manifestPath = path.resolve(
      path.dirname(entrypointPath),
      'manifest.json'
    )
    const manifest = new JSONManager(manifestPath)
    return manifest
  }
}

module.exports = new Utils()
