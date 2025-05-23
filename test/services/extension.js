const path = require('path')
const fs = require('fs')
const ManifestService = require('../../src/services/manifest')
class Extension {
  #manifestBufferBackup
  constructor ({ entryPoint }) {
    this.entryPointPath = path.resolve(entryPoint)
    this.manifestPath = path.join(path.dirname(entryPoint), 'manifest.json')
  }

  getManifestBufferSync () {
    return fs.readFileSync(this.manifestPath)
  }

  getManifest () {
    return new ManifestService(this.manifestPath)
  }

  deleteManifestSync () {
    this.#manifestBufferBackup = this.getManifestBufferSync()
    fs.unlinkSync(this.manifestPath)
  }

  /**
   *
   * @param {number} extensionId
   */
  setExtensionUUIDOnManifest (uuid) {
    const manifestBuffer = this.getManifestBufferSync()
    if (!this.#manifestBufferBackup) {
      this.#manifestBufferBackup = manifestBuffer
    }
    const manifestObject = JSON.parse(manifestBuffer.toString())
    manifestObject.extensionUUID = uuid
    fs.writeFileSync(this.manifestPath, JSON.stringify(manifestObject, null, 2))
  }

  restoreManifestSync () {
    if (this.#manifestBufferBackup) {
      fs.writeFileSync(this.manifestPath, this.#manifestBufferBackup)
    }
  }
}
module.exports = Extension
