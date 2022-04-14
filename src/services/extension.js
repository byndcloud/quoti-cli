const { firebase, storage } = require('../config/firebase')
const path = require('path')
const ora = require('ora')
const VueCliService = require('@vue/cli-service')
const { randomUUID } = require('crypto')
const api = require('../config/axios')
const credentials = require('../config/credentials')
const Logger = require('../config/logger')
const utils = require('../utils/index')
class ExtensionService {
  constructor (manifest, { spinnerOptions } = {}) {
    if (!manifest) {
      throw new Error(
        'The manifest parameter is required to use the ExtensionService'
      )
    }
    this.manifest = manifest
    this.logger = Logger.child({
      tag: 'command/publish'
    })
    this.spinner = ora(
      spinnerOptions || {
        spinner: 'arrow3',
        color: 'yellow'
      }
    )
    this.vueCliService = new VueCliService(utils.getProjectRootPath())
  }

  /**
   * Create new dynamicComponentFile
   * @param {Object} data
   * @param {string} [data.url]
   * @param {string} [data.versionName]
   * @param {string} [data.filename]
   * @param {string} token
   */
  async deployVersion ({ url, version, fileVuePrefix }, token) {
    await api.axios.put(
      `/${credentials.institution}/dynamic-components/${this.manifest.extensionId}`,
      {
        url,
        version,
        fileVuePrefix,
        activated: true
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return true
  }

  async upload (buffer, remotePath) {
    if (!this.manifest.exists()) {
      this.logger.warning(
        'Por favor selecione sua extensão. Execute qt select-extension'
      )
      process.exit(0)
    } else if (!buffer) {
      this.logger.error('Buffer é null!')
      process.exit(0)
    }

    this.spinner.start(`Fazendo upload da extensão ${this.manifest.name}...`)
    try {
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
      this.spinner.succeed(
        `Upload da extensão ${this.manifest.name} finalizado!`
      )
    } catch (error) {
      this.spinner.fail('Erro durante o upload')
      throw new Error(error)
    }
  }

  async createExtensionUUID () {
    this.logger.success('Criando nova extension_UUID')
    this.logger.warning(
      `Sempre que você atualizar para uma versão anterior a ${new Date()}, você deve compilar primeiro.`
    )

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
      const extension = await this.getExtension(this.manifest.extensionId)
      if (this.extension?.extensionUUID) {
        this.manifest.extensionUUID = extension.extensionUUID
        this.manifest.save()
      } else {
        await this.createExtensionUUID()
      }
    }
    try {
      this.vueCliService.init(mode)
      this.spinner.start(`Fazendo build da extensão ${this.manifest.name} ...`)
      const dest = 'dist/'
      const name = `dc_${this.manifest.extensionUUID}`
      await this.vueCliService.run('build', {
        mode,
        modern: true,
        target: 'lib',
        formats: 'umd-min',
        dest,
        name,
        entry,
        'inline-vue': true
      })
      this.logger.info(`⇨ Extensão: ${this.manifest.name}\n`)
      this.spinner.succeed('Build finalizado')
      return path.join(utils.getProjectRootPath(), dest, `${name}.umd.min.js`)
    } catch (error) {
      this.spinner.fail('Erro durante o build')
      throw new Error(error)
    }
  }
}

module.exports = ExtensionService
