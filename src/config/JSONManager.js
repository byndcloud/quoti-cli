const fs = require('fs')

class JSONManager {
  /** @type {string} */
  #path

  constructor (jsonPath) {
    this.#path = jsonPath

    if (this.exists()) {
      this.load()
    }
  }

  getPath () {
    return this.#path
  }

  delete () {
    if (!this.exists()) {
      return false
    }
    fs.rmSync(this.#path)
    return true
  }

  exists () {
    return fs.existsSync(this.#path)
  }

  load () {
    if (!this.exists()) {
      throw new Error(`File ${this.#path} doesn't exist`)
    }

    let raw
    try {
      raw = fs.readFileSync(this.#path)
    } catch (e) {
      // TODO: Auto remove on build?
      console.error(e)
      throw new Error(`Error reading file ${this.#path}`)
    }

    let data
    try {
      data = JSON.parse(raw)
    } catch (e) {
      console.error(e)
      throw new Error(`Error parsing file: ${this.#path}`)
    }

    Object.assign(this, data)

    return data
  }

  save (data = {}) {
    try {
      Object.assign(this, data)
      fs.writeFileSync(this.#path, JSON.stringify(this, null, 2))
    } catch (e) {
      console.error(e)
      throw new Error(`Error saving file ${this.#path}`)
    }
  }
}

module.exports = JSONManager
