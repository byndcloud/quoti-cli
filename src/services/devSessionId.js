const { randomUUID } = require('crypto')
const credentials = require('../config/credentials')
class DevSessionIdService {
  /**
   * Get session id
   * @param {Object} data
   * @param {boolean} [data.forceCreateDevSessionId]
   * @returns {Promise<string>} sessionId
   */
  async getSessionId ({ forceCreateDevSessionId = false }) {
    let sessionId
    if (forceCreateDevSessionId) {
      sessionId = this.createNewDevSessionId()
    } else {
      sessionId = await this.getDevSessionIdFromCredentials()
      if (!sessionId) {
        sessionId = this.createNewDevSessionId()
      }
    }
    return sessionId
  }

  createNewDevSessionId () {
    const devSessionId = randomUUID()
    credentials.load()
    credentials.devSessionId = devSessionId
    credentials.save()
    return devSessionId
  }

  async getDevSessionIdFromCredentials () {
    await credentials.load()
    return credentials.devSessionId
  }
}

module.exports = DevSessionIdService
