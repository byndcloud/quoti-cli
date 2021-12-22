const fs = require('fs')
const chalk = require('chalk')
const { firebase } = require('../config/firebase')
const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const readline = require('readline')
var http = require('https')
const api = require('../config/axios')
const JSONManager = require('../config/JSONManager')

class DownloadCurrentVersion extends Command {
  constructor () {
    super(...arguments)
    this.manifest = new JSONManager('./manifest.json')
  }
  async run () {
    await credentials.load()
    try {
      if (!this.manifest.exists()) {
        console.log(chalk.yellow('Please select your extension. Try run qt selectExtension'))
        process.exit(0)
      }
      await this.manifest.load()
      const { args } = this.parse(DownloadCurrentVersion)
      if (!fs.existsSync(args.filePath)) {
        console.log(chalk.red(`Path ${args.filePath} is not directory`))
        process.exit(0)
      }
      const token = await firebase.auth().currentUser.getIdToken()
      const result = await api.axios.get(
        `/${credentials.institution}/dynamic-components/url-file-active/${this.manifest.extensionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      let pathFile = true
      pathFile = await this.isReplaceFile(args.filePath)
      if (pathFile) {
        await this.downloadFile(result.data.url, pathFile)
        console.log(chalk.green(`File saved in ${args.filePath}`))
      }
      return result.data
    } catch (error) {
      console.log(chalk.red(`${error}`))
    }
  }
  async isReplaceFile (path) {
    let pathFile
    if (path.includes('.vue')) {
      pathFile = path
    } else {
      if (path.slice(-1)[ 0 ] === '/') {
        pathFile = path + 'index.vue'
      } else {
        pathFile = path + '/index.vue'
      }
    }
    console.log(pathFile)
    if (fs.existsSync(pathFile)) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      return new Promise((resolve, reject) => {
        rl.question(`Already there is file with this name in ${pathFile}. Do you want replace? Yes/No `, answer => {
          rl.close()
          if (
            answer.toLowerCase() === 's' ||
            answer.toLowerCase() === 'sim' ||
            answer.toLowerCase() === 'yes' ||
            answer.toLowerCase() === 'y'
          ) {
            resolve(pathFile)
          } else {
            console.log(chalk.red('operation canceled'))
            resolve(false)
          }
        })
      })
    } else {
      return pathFile
    }
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
