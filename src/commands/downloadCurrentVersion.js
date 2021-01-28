const { default: axios } = require('axios')
const md5 = require('md5')
const fs = require('fs')
const { firebase } = require('../config/firebase')
const { bucket } = require('../config/storage')
const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const readline = require('readline')
var http = require('https')

class DownloadCurrentVersion extends Command {
  async run () {
    await credentials.load()
    const { args } = this.parse(DownloadCurrentVersion)
    const token = await firebase.auth().currentUser.getIdToken()
    const result = await axios.get(
      `http://localhost:8081/api/v1/${credentials.institution}/dynamic-components/url-file-active/${credentials.extensionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    let confirmSave = true
    if (fs.existsSync(args.filePath)) {
      confirmSave = await this.isReplaceFile()
    }
    if (confirmSave) this.downloadFile(result.data.url, args.filePath)

    return result.data
  }
  async isReplaceFile () {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    return new Promise((resolve, reject) => {
      rl.question('Already there is file with this name. Do you want replace? Yes/No ', answer => {
        rl.close()
        if (
          answer.toLowerCase() === 's' ||
          answer.toLowerCase() === 'sim' ||
          answer.toLowerCase() === 'yes' ||
          answer.toLowerCase() === 'y'
        ) {
          resolve(true)
        } else {
          console.log('operation canceled')
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
