const fs = require('fs')

class JSONManager {
  constructor (jsonPath) {
    this.path = jsonPath

    if (this.exists()) {
      this.load()
    }
  }

  exists () {
    return fs.existsSync(this.path)
  }

  load () {
    if (!this.exists()) {
      throw new Error(`File ${this.path} doesn't exist`)
    }

    let raw
    try {
      raw = fs.readFileSync(this.path)
    } catch (e) {
      // TODO: Auto remove on build?
      console.error(e)
      throw new Error(`Error reading file ${this.path}`)
    }

    let manifest
    try {
      manifest = JSON.parse(raw)
    } catch (e) {
      console.error(e)
      throw new Error(`Error parsing file: ${this.path}`)
    }

    Object.assign(this, manifest)

    return manifest
  }

  save (data = {}) {
    try {
      Object.assign(this, data)
      fs.writeFileSync(this.path, JSON.stringify(this, null, 2))
    } catch (e) {
      console.error(e)
      throw new Error(`Error saving file ${this.path}`)
    }
  }
}

module.exports = JSONManager
