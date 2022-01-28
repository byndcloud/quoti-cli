const { firebase, storage } = require('../config/firebase')
const path = require('path')
const VueCliService = require('@vue/cli-service')
const { randomUUID } = require('crypto')
const vueCliService = new VueCliService(process.cwd())
const api = require('../config/axios')
const credentials = require('../config/credentials')
const Logger = require('../config/logger')

class ExtensionService {
  constructor (manifest) {
    if (!manifest) {
      throw new Error(
        'The manifest parameter is required to use the ExtensionService'
      )
    }
    this.manifest = manifest
    this.logger = Logger.child({
      tag: 'command/publish'
    })
  }
  async upload (buffer, remotePath) {
    if (!this.manifest.exists()) {
      this.logger.warning('Por favor selecione sua extensão. Execute qt select-extension')
      process.exit(0)
    } else if (!buffer) {
      this.logger.error('Buffer é null!')
      process.exit(0)
    }
    // Create a new buffer in the bucket and upload the file data.
    // Uploads a local file to the bucket
    await storage
      .ref()
      .child(remotePath)
      .put(buffer, {
        destination: remotePath,
        gzip: true,
        metadata: {
          cacheControl: 'public, max-age=0'
        }
      })
    this.logger.success(`Arquivo carregado para ${remotePath}.`)
  }

  async createExtensionUUID () {
    this.logger.success('Criando nova extension_UUID')
    this.logger.warning(`Sempre que você atualizar para uma versão anterior a ${new Date()}, você deve compilar primeiro.`)

    const uuid = randomUUID()
    await credentials.load()
    const token = await firebase.auth().currentUser.getIdToken()
    const id = this.manifest.extensionId
    await api.axios.put(
      `/${credentials.institution}/dynamic-components/${id}`,
      { extensionUUID: uuid },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    this.manifest.extensionUUID = uuid
    this.manifest.save()
    return uuid
  }

  async build (entry, { mode } = { mode: 'production' }) {
    if (!this.manifest.extensionUUID) {
      await this.createExtensionUUID()
    }
    vueCliService.init(mode)
    const dest = 'dist/'
    const name = `dc_${this.manifest.extensionUUID}`
    await vueCliService.run('build', {
      mode,
      modern: true,
      target: 'lib',
      formats: 'umd-min',
      dest,
      name,
      entry,
      'inline-vue': true
    })

    return path.join(process.cwd(), dest, `${name}.umd.min.js`)
  }
}

module.exports = ExtensionService
