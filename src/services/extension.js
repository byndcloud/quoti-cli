const chalk = require('chalk')
// const manifest = require('../config/manifest')
const { firebase, appExtension, storage } = require('../config/firebase')
const path = require('path')
const VueCliService = require('@vue/cli-service')
const vueCliService = new VueCliService(process.cwd())

class ExtensionService {
  constructor (manifest) {
    if (!manifest) {
      throw new Error(
        'The manifest parameter is required to use the ExtensionService'
      )
    }
    this.manifest = manifest
  }
  async upload (buffer, remotePath) {
    if (!this.manifest.exists()) {
      console.log(
        chalk.yellow('Please select your extension. Try run qt selectExtension')
      )
      process.exit(0)
    } else if (!buffer) {
      console.log(chalk.red(`Buffer is null!`))
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

    console.log(chalk.blue(`File uploaded to ${remotePath}.`))
  }

  async build (entry, { mode } = { mode: 'production' }) {
    vueCliService.init(mode)
    const dest = 'dist/'
    const name = `dc_${this.manifest.extensionId}`
    console.log(`dest, credentials`)
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
