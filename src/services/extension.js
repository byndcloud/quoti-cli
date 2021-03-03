const chalk = require('chalk')
const manifest = require('../config/manifest')
const { bucket } = require('../config/storage')
const { firebase, appExtension } = require('../config/firebase')
const fs = require('fs')
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

  async build () {
    vueCliService.init('production')
    await vueCliService.run('build', {
      target: 'lib',
      formats: 'umd-min',
      dest: 'dist/builtComponent',
      name: 'BuiltComponent',
      entry: '/home/nmf2/vue-test/test/src/App.vue'
    })
  }
}

module.exports = ExtensionService