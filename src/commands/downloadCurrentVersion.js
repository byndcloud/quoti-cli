const fs = require('fs')
const chalk = require('chalk')
const { firebase } = require('../config/firebase')
const credentials = require('../config/credentials')
const manifest = require('../config/manifest')
const { default: Command } = require('@oclif/command')
const readline = require('readline')
var http = require('https')
const api = require('../config/axios')

class DownloadCurrentVersion extends Command {
  async run () {
    await credentials.load()
    await manifest.load()
    try {
      const { args } = this.parse(DownloadCurrentVersion)
      const token = await firebase.auth().currentUser.getIdToken()
      const result = await api.axios.get(
        `/${credentials.institution}/dynamic-components/url-file-active/${manifest.extensionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      let confirmSave = true
      if (fs.existsSync(args.filePath)) {
        confirmSave = await this.isReplaceFile(args.filePath)
      }

      if (confirmSave) this.downloadFile(result.data.url, args.filePath)
      console.log(chalk.green(`File saved in ${args.filePath}`))
      return result.data
    } catch (error) {
      console.log(chalk.red(`${error}`))
    }
  }
  async isReplaceFile (path) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    return new Promise((resolve, reject) => {
      rl.question(`Already there is file with this name in ${path}. Do you want replace? Yes/No `, answer => {
        rl.close()
        if (
          answer.toLowerCase() === 's' ||
          answer.toLowerCase() === 'sim' ||
          answer.toLowerCase() === 'yes' ||
          answer.toLowerCase() === 'y'
        ) {
          resolve(true)
        } else {
          console.log(chalk.red('operation canceled'))
          resolve(false)
        }
      })
    })
  }
  async downloadFile (url, dest, callback) {
    var file = fs.createWriteStream(dest)
    http.get(url, function (response) {
      response.pipe(file)
      file.on('finish', function () {
        file.close(callback) // close() is async, call callback after close completes.
      })
      file.on('error', function (err) {
        fs.unlink(dest) // Delete the file async. (But we don't check the result)
        if (callback) { callback(err.message) }
      })
    })
  }
}
// TODO: Add documentation and flags specifications

DownloadCurrentVersion.args = [
  {
    name: 'filePath',
    required: false,
    description: 'Download current version',
    default: './src/index.vue'
  }
]

DownloadCurrentVersion.description = `Download your extension active
...

`

module.exports = DownloadCurrentVersion
