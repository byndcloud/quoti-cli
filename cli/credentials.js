const fs = require('fs')

const credentialsPath = './credentials.json'

class Credentials {
  exists () {
    return fs.existsSync(credentialsPath)
  }

  load () {
    if (!this.exists()) {
      throw new Error("Credentials file doesn't exist")
    }

    let raw
    try {
      raw = fs.readFileSync(credentialsPath)
    } catch (e) {
      // TODO: Auto remove on build?
      console.error(e)
      throw new Error(`Error reading credentials file ${credentialsPath}`)
    }

    let credentials
    try {
      credentials = JSON.parse(raw)
    } catch (e) {
      console.error(e)
      throw new Error(`Error parsing credentials file: ${credentialsPath}`)
    }

    Object.assign(this, credentials)

    return credentials
  }

  save (data) {
    if (!data) {
      data = this
    }
    try {
      fs.writeFileSync(credentialsPath, JSON.stringify(data, null, 2))
    } catch (e) {
      console.error(e)
      throw new Error('Error saving credentials file')
    }
  }
}

module.exports = new Credentials()
