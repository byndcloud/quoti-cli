const semver = require('semver')
const api = require('../config/axios')
const { firebase } = require('../config/firebase')
const utils = require('../utils/index')
const { keyBy } = require('lodash')
const credentials = require('../config/credentials')

class RemoteExtensionService {
  #extensionVersionsOnMarketplace = []
  #isLoadExtensionVersionsOnMarketplace = false

  async getSubscribedOrgs (extensionsId) {
    await credentials.load()
    const token = await firebase.auth().currentUser.getIdToken()
    const { data: subscribedOrgs } = await api.axios.get(
      `/${credentials.institution}/marketplace/extensions/${extensionsId}/subscribed/orgs`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return subscribedOrgs.data
  }

  #checkLoadExtensionVersions = () => {
    if (this.#isLoadExtensionVersionsOnMarketplace) {
      return this.#extensionVersionsOnMarketplace
    }
    throw new Error(
      'You must first perform load loadExtensionVersionsOnMarketplace'
    )
  }

  async loadExtensionVersionsOnMarketplace ({
    extensionVersionId,
    token,
    orgSlug
  }) {
    if (!token) {
      token = await firebase.auth().currentUser.getIdToken()
    }

    const address = `/${orgSlug}/marketplace/extensions/${extensionVersionId}/versions`
    const { data } = await api.axios.get(address, {
      headers: { Authorization: `Bearer ${token}` }
    })
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
    const lastVersion = this.#extensionVersionsOnMarketplace
      .map(item => {
        if (item.version) {
          return semver.valid(item.version)
        }
        return null
      })
      .filter(lv => lv)
      .sort(semver.rcompare)[0]
    return lastVersion
  }

  /**
   * Gets extensions from quoti by their IDs
   * @deprecated use getRemoteExtensionsByUUIDs
   * @param {*} opts
   * @returns
   */
  async getRemoteExtensionsByIds ({
    ids,
    orgSlug,
    token,
    parameters = ['title', 'extension_uuid']
  }) {
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

  /**
   * @param {string[]} uuids The extension's uuids
   * @param {string} orgSlug The organization slug
   * @param {string} token The access token
   * @param {object} options Request parameters
   * @param {string[]} options.parameters The extension's attributes to return
   * @returns
   */
  async listRemoteExtensionsByUUIDs (
    uuids = utils.required('uuids'),
    orgSlug = utils.required('orgSlug'),
    token = utils.required('token'),
    { attributes = ['title', 'extension_uuid'] } = {}
  ) {
    const baseURI = `/${orgSlug}/dynamic-components`

    const params = new URLSearchParams()
    params.append('attributes', 'id')
    params.append('attributes', 'extension_uuid')
    for (const attribute of attributes) {
      params.append('attributes', attribute)
    }

    uuids.forEach(uuid => params.append('where[or][extension_uuid]', uuid))

    const URI = `${baseURI}?${params}`

    const { data } = await api.axios.get(URI, {
      headers: { Authorization: `Bearer ${token}` }
    })

    return data || []
  }

  /**
   * Gets extensions from quoti by their entrypoints
   * @param {object} opts
   * @param {string[]} opts.entrypoints The extension's entrypoints
   * @param {string} opts.orgSlug The organization slug
   * @param {string} opts.token The access token
   * @param {string[]} opts.attributes The extension's attributes to return
   * @returns {Promise<Record<string, IRemoteExtension>>}
   */
  async listRemoteExtensionsByEntrypoints ({
    entrypoints,
    orgSlug,
    token,
    attributes = ['title', 'extension_uuid', 'path']
  }) {
    if (!entrypoints) {
      const projectRoot = utils.getProjectRootPath()
      entrypoints = utils.listExtensionsPaths(projectRoot)
    }
    const manifestsWithEntrypoints = entrypoints.map(entrypoint => {
      const manifest = utils.getManifestFromEntryPoint(entrypoint)

      manifest.entrypoint = entrypoint

      return manifest
    })

    const uuids = manifestsWithEntrypoints.map(
      manifest => manifest.extensionUUID
    )

    const remoteExtensions = await this.listRemoteExtensionsByUUIDs(
      uuids,
      orgSlug,
      token,
      { attributes }
    )

    const remoteExtensionsByEntrypoints = keyBy(remoteExtensions, extension => {
      const manifest = manifestsWithEntrypoints?.find(
        m => m.extensionUUID === extension.extension_uuid
      )

      return manifest?.entrypoint
    })

    return remoteExtensionsByEntrypoints
  }
}

module.exports = RemoteExtensionService
