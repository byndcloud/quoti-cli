const { omit } = require('lodash')
const JSONManager = require('../config/JSONManager')

class ManifestService extends JSONManager {
  /** @type {number} The extension id in the organization */
  extensionId

  /** @type {'build'|'noBuild'} type The extension type */
  type

  /** @type {string} */
  name

  /** @type {string} */
  extensionUUID

  /** @type {any[]} */
  permissions

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
