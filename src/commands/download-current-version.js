const fs = require('fs')
const { firebase } = require('../config/firebase')
const credentials = require('../config/credentials')
const Command = require('../base.js')
const http = require('https')
const api = require('../config/axios')
const JSONManager = require('../config/JSONManager')
const { confirmQuestion } = require('../utils/index')

class DownloadCurrentVersion extends Command {
  init () {
    super.init()
    this.manifest = new JSONManager('./manifest.json')
  }

  async run () {
    await credentials.load()

    if (!this.manifest.exists()) {
      this.logger.warning('Por favor selecione sua extensão. Execute qt selectExtension')
      process.exit(0)
    }
    await this.manifest.load()
    if (!fs.existsSync(this.args.filePath)) {
      this.logger.error(`${this.args.filePath} não é um endereço válido`)
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
    pathFile = await this.isReplaceFile(this.args.filePath)
    if (pathFile) {
      await this.downloadFile(result.data.url, pathFile)
      this.logger.success(`Arquivo salvo em ${this.args.filePath}`)
    }
    return result.data
  }

  async isReplaceFile (path) {
    let pathFile
    if (path.includes('.vue')) {
      pathFile = path
    } else {
      if (path.slice(-1)[0] === '/') {
        pathFile = path + 'index.vue'
      } else {
        pathFile = path + '/index.vue'
      }
    }
    this.logger.info(pathFile)
    if (fs.existsSync(pathFile)) {
      const confirmReplace = await confirmQuestion(`Já existe um arquivo neste endereço ${pathFile}. Deseja substituir? Sim/Não`)
      if (confirmReplace) {
        return pathFile
      } else {
        return false
      }
    } else {
      return pathFile
    }
  }

  async downloadFile (url, dest, callback) {
    const file = fs.createWriteStream(dest)
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

DownloadCurrentVersion.description = `Baixa a versão da extensão ativa
...

`

module.exports = DownloadCurrentVersion
