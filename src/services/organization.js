const api = require('../config/axios')
const { firebase } = require('../config/firebase')
const credentials = require('../config/credentials')

credentials.load()
class Organization {
  constructor ({ orgSlug } = {}) {
    this.orgSlug = orgSlug || credentials.institution
  }

  async listDynamicComponents ({
    token,
    orgSlug = this.orgSlug,
    where = {}
  } = {}) {
    if (!token) {
      token = await firebase.auth().currentUser.getIdToken()
    }
    const address = `/${orgSlug}/dynamic-components`
    const { data } = await api.axios.get(address, {
      headers: { Authorization: `Bearer ${token}` },
      params: { where }
    })
    return data
  }

  async listExtensionsPaths ({ token } = {}) {
    const dynamicComponents = await this.listDynamicComponents({ token })
    return dynamicComponents.map(d => d.path)
  }
}

module.exports = Organization
