const { omit } = require('lodash')
const JSONManager = require('../config/JSONManager')

class ManifestService extends JSONManager {
  /**
   * Returns the manifests' data without the extensionId, type, name and extensionUUID properties
   * returns {@link ManifestService}
   */
  getManifestToPublish () {
    const manifestToPublish = omit(this, [
      'extensionId',
      'type',
      'name',
      'extensionUUID'
    ])

    if (Object.keys(manifestToPublish).length === 0) {
      return
    }
    return manifestToPublish
  }
}

module.exports = ManifestService
