const path = require('path')
const fs = require('fs')
class Extension {
  #manifestBufferBackup
  constructor ({ entryPoint }) {
    this.entryPointPath = path.resolve(entryPoint)
    this.manifestPath = path.join(path.dirname(entryPoint), 'manifest.json')
  }

  getManifestBufferSync () {
    return fs.readFileSync(this.manifestPath)
  }

  deleteManifestSync () {
    this.#manifestBufferBackup = this.getManifestBufferSync()
    fs.unlinkSync(this.manifestPath)
  }

  /**
   *
   * @param {number} extensionId
   */
  setExtensionIdOnManifest (extensionId) {
    const manifestBuffer = this.getManifestBufferSync()
    if (!this.#manifestBufferBackup) {
      this.#manifestBufferBackup = manifestBuffer
    }
    const manifestObject = JSON.parse(manifestBuffer.toString())
    manifestObject.extensionId = extensionId
    fs.writeFileSync(this.manifestPath, JSON.stringify(manifestObject, null, 2))
  }

  restoreManifestSync () {
    if (this.#manifestBufferBackup) {
      fs.writeFileSync(this.manifestPath, this.#manifestBufferBackup)
    }
  }
}
module.exports = Extension
