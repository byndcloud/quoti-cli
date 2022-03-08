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

  constructor (manifest, orgSlug) {
    if (!manifest) {
      throw new Error(
        'The manifest parameter is required to use the ExtensionService'
      )
    }
    if (!orgSlug) {
      throw new Error(
        'The orgSlug parameter is required to use the RemoteExtensionService'
      )
    }
    this.manifest = manifest
    this.orgSlug = orgSlug
  }

  async loadExtensionVersionsOnMarketplace ({ extensionVersionId, token }) {
    if (!token) {
      token = await firebase.auth().currentUser.getIdToken()
    }

    const address = `/${this.orgSlug}/marketplace/extensions/${extensionVersionId}/versions`
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
  async getRemoteExtensionsByIds ({ ids, orgSlug, token }) {
    const baseURI = `/${orgSlug}/dynamic-components`

    const params = new URLSearchParams()
    params.append('attributes', 'title')
    params.append('attributes', 'id')

    ids.forEach(id => params.append('where[or][id]', id))

    const URI = `${baseURI}?${params}`
    const { data } = await api.axios.get(URI, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!data || data?.length === 0) {
      return
    }

    return data
  }

  async getRemoteExtensions ({ extensionsPathsArg, orgSlug, token }) {
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
      token
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
