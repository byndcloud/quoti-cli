const { build } = require('vite')
const vuePlugin = require('@vitejs/plugin-vue2')
const pugPlugin = require('vite-plugin-pug').default
const cssPlugin = require('vite-plugin-css-injected-by-js').default
const react = require('@vitejs/plugin-react')
const { firebase } = require('../config/firebase')
const ora = require('ora')
const { randomUUID } = require('crypto')
const api = require('../config/axios')
const credentials = require('../config/credentials')
const Logger = require('../config/logger')
const utils = require('../utils/index')
const { uploadFile } = require('../utils/files')

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
        activated: true,
        meta: this.manifest.meta || {}
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return true
  }

  /**
   *
   * @description Uploads a file content to Firebase Storage.
   * @param {String} extensionCode code of the extension
   * @param {String} filePath path to file be saved on firebase storage
   */
  async upload (extensionCode, filePath) {
    if (!this.manifest.exists()) {
      this.logger.warning('Por favor selecione sua extensão. Execute qt link')
      process.exit(0)
    } else if (!extensionCode) {
      this.logger.warning('O código da extensão não foi gerado')
      throw new Error('O código da extensão não foi gerado')
    }

    this.spinner.start(`Fazendo upload da extensão ${this.manifest.name}...`)
    try {
      this.spinner.start(
        `Fazendo upload da extensão ${this.manifest.name}... ${filePath}`
      )
      const { status, data } = await uploadFile({
        fileContent: extensionCode,
        filePath
      })

      if (status !== 200) {
        this.logger.error('Erro ao fazer upload da extensão', { data })
        throw new Error('Erro ao fazer upload da extensão')
      }
      this.spinner.succeed(
        `Upload da extensão ${this.manifest.name} finalizado!`
      )
    } catch (error) {
      this.spinner.fail('Erro durante o upload', { error })
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

  async ensureExtensionUUIDExists (remoteExtensionUUID) {
    if (this.manifest.extensionUUID) {
      return
    }

    if (remoteExtensionUUID) {
      this.manifest.extensionUUID = remoteExtensionUUID
      this.manifest.save()
    } else {
      await this.createExtensionUUID()
    }
  }

  async build (entry, { mode = 'production', remoteExtensionUUID } = {}) {
    try {
      const frameworkType = this.manifest.meta?.framework || 'vue'

      await this.ensureExtensionUUIDExists(remoteExtensionUUID)
      this.spinner.start(`Fazendo build da extensão ${this.manifest.name} ...`)
      // const dest = `dist/${this.manifest.extensionUUID}`
      const name = `dc_${this.manifest.extensionUUID}`
      const isProduction = mode === 'production'
      const vitePlugins = []
      vitePlugins.push(cssPlugin())

      if (frameworkType === 'react') {
        vitePlugins.push(react())
      } else {
        vitePlugins.push(vuePlugin())
        vitePlugins.push(pugPlugin())
      }

      const result = await build({
        plugins: vitePlugins,
        mode,
        root: utils.getProjectRootPath(),
        define: {
          'process.env': {},
          'process.argv': {}
        },
        build: {
          outDir: 'dist',
          lib: {
            entry,
            name,
            formats: ['umd']
          },
          minify: isProduction,
          rollupOptions: {
            external: [
              'vue',
              'react',
              'react-dom',
              'react/jsx-runtime',
              'react/jsx-dev-runtime',
              'winston',
              'axios',
              'vuex',
              'firebase/app',
              'moment',
              'bluebird'
            ],
            output: {
              globals: {
                vue: 'Vue',
                react: 'React',
                'react-dom': 'ReactDOM',
                'react/jsx-runtime': 'jsxRuntime',
                'react/jsx-dev-runtime': 'jsxDevRuntime',
                winston: 'winston',
                axios: 'axios',
                vuex: 'Vuex',
                'firebase/app': 'firebaseApp',
                moment: 'moment',
                bluebird: 'bluebird'
              }
            }
          },
          commonjsOptions: {
            transformMixedEsModules: true
          }
        }
      })
      this.logger.info(`⇨ Extensão: ${this.manifest.name}\n`)
      this.spinner.succeed('Build finalizado')
      return result?.[0]?.output?.[0]?.code
    } catch (error) {
      this.logger.error(error?.message)
      this.spinner.fail('Erro durante o build: ' + error?.message)
    }
  }
}

module.exports = ExtensionService
