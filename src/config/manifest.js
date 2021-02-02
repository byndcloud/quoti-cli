const fs = require('fs')

const manifestPath = './manifest.json'

class Manifest {
  exists () {
    return fs.existsSync(manifestPath)
  }

  load () {
    if (!this.exists()) {
      console.log(manifestPath)
      throw new Error("Manifest file doesn't exist. Please run qt selectExtension")
    }

    let raw
    try {
      raw = fs.readFileSync(manifestPath)
    } catch (e) {
      // TODO: Auto remove on build?
      console.error(e)
      throw new Error(`Error reading manifest file ${manifestPath}`)
    }

    let manifest
    try {
      manifest = JSON.parse(raw)
    } catch (e) {
      console.error(e)
      throw new Error(`Error parsing manifest file: ${manifestPath}`)
    }

    Object.assign(this, manifest)

    return manifest
  }

  save (data = {}) {
    try {
      Object.assign(this, data)
      fs.writeFileSync(manifestPath, JSON.stringify(this, null, 2))
    } catch (e) {
      console.error(e)
      throw new Error('Error saving manifest file')
    }
  }
}

module.exports = new Manifest()
