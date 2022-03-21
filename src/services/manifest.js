const { omit } = require('lodash')
const JSONManager = require('../config/JSONManager')
class ManifestService extends JSONManager {
  getManifestToPublish () {
    const manifestToPublish = omit(
      this,
      [
        'extensionId',
        'type',
        'name',
        'extensionUUID',
        ...Object.getOwnPropertyNames(new JSONManager())
      ])
    if (Object.keys(manifestToPublish).length === 0) {
      return
    }
    return manifestToPublish
  }
}

module.exports = ManifestService
