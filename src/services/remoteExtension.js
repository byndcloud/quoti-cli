const semver = require('semver')
const api = require('../config/axios')
const { firebase } = require('../config/firebase')
const utils = require('../utils/index')

class RemoteExtension {
  #extensionVersionsOnMarketplace = []
  #isLoadExtensionVersionsOnMarketplace = false
  #checkLoadExtensionVersions = () => {
    if (this.#isLoadExtensionVersionsOnMarketplace) {
      return this.#extensionVersionsOnMarketplace
    }
    throw new Error('You must first perform load loadExtensionVersionsOnMarketplace')
  }

  async loadExtensionVersionsOnMarketplace ({ extensionVersionId, token, orgSlug }) {
    if (!token) {
      token = await firebase.auth().currentUser.getIdToken()
    }

    const address = `/${orgSlug}/marketplace/extensions/${extensionVersionId}/versions`
    const { data } = await api.axios.get(
      address,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!data || data?.length === 0) {
      return
    }
    this.#extensionVersionsOnMarketplace = data.data
    this.#isLoadExtensionVersionsOnMarketplace = true
  }

  // extension on Marketplace
  async getExtensionVersionsOnMarketplace () {
    this.#checkLoadExtensionVersions()
    return this.#checkLoadExtensionVersions
  }

  getLastVersionOnMarketplace () {
    this.#checkLoadExtensionVersions()
    const lastVersion = this.#extensionVersionsOnMarketplace.map(item => {
      if (item.version) {
        return semver.valid(item.version)
      }
      return null
    }
    ).filter(lv => lv).sort(semver.rcompare)[0]
    return lastVersion
  }

  // extension on Org
  async getRemoteExtensionsByIds ({ ids, orgSlug, token, parameters = ['title', 'extension_uuid'] }) {
    const baseURI = `/${orgSlug}/dynamic-components`

    const params = new URLSearchParams()
    params.append('attributes', 'id')
    for (const parameter of parameters) {
      params.append('attributes', parameter)
    }

    ids.forEach(id => params.append('where[or][id]', id))

    const URI = `${baseURI}?${params}`
    const { data } = await api.axios.get(URI, {
      headers: { Authorization: `Bearer ${token}` }
    })

    return data || []
  }

  async getRemoteExtensions ({ extensionsPathsArg, orgSlug, token, parameters = ['title', 'extension_uuid'] }) {
    let extensionsPaths = extensionsPathsArg
    if (!extensionsPaths) {
      const projectRoot = utils.getProjectRootPath()
      extensionsPaths = utils.listExtensionsPaths(projectRoot)
    }
    const ids = extensionsPaths.map(extension => {
      const manifest = utils.getManifestFromEntryPoint(extension)

      return manifest.extensionId
    })
    const remoteExtensions = await this.getRemoteExtensionsByIds({
      ids,
      orgSlug,
      token,
      parameters
    })
    const remoteExtensionsObj = {}
    ids.forEach((id, index) => {
      const remoteExtension = remoteExtensions?.find(re => re.id === id)
      remoteExtensionsObj[extensionsPaths[index]] = remoteExtension
    })
    return remoteExtensionsObj
  }
}

module.exports = RemoteExtension
