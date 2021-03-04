const chalk = require('chalk')
const manifest = require('../config/manifest')
const { bucket } = require('../config/storage')
const { firebase, appExtension } = require('../config/firebase')
const fs = require('fs')
const path = require('path')
const VueCliService = require('@vue/cli-service')
const vueCliService = new VueCliService(process.cwd())

class ExtensionService {
  async upload (localPath, remotePath) {
    if (!manifest.extensionId) {
      console.log(chalk.yellow('Please select your extension. Try run qt selectExtension'))
      process.exit(0)
    } else if (!fs.existsSync(localPath)) {
      console.log(chalk.red(`File ${localPath} not found`))
      process.exit(0)
    }
    // Create a new buffer in the bucket and upload the file data.
    // Uploads a local file to the bucket
    await bucket.upload(localPath, {
      destination: remotePath,
      gzip: true,
      metadata: {
        cacheControl: 'public, max-age=0'
      }
    })
    await appExtension
      .firestore()
      .collection('dynamicComponents')
      .doc(manifest.extensionStorageId)
      .update({
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
    console.log(chalk.blue(`File ${localPath} uploaded.`))
  }

  async build (entry) {
    vueCliService.init('production')
    const dest = 'dist/'
    const name = `${manifest.extensionId}`
    console.log(`dest, credentials`)
    await vueCliService.run('build', {
      mode: 'production',
      modern: true,
      target: 'lib',
      formats: 'umd-min',
      dest,
      name,
      entry
    })

    return path.join(process.cwd(), dest, `${name}.umd.min.js`)
  }
}

module.exports = ExtensionService
