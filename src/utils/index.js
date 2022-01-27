const JSONManager = require('../config/JSONManager')
const path = require('path')
const inquirer = require('inquirer')
class Utils {
  isYes (text) {
    return ['s', 'sim', 'yes', 'y'].includes(text.toLowerCase())
  }
  isNo (text) {
    return ['n', 'não', 'nao', 'no'].includes(text.toLowerCase())
  }
  async confirmQuestion (text) {
    const { confirmVersion } = await inquirer.prompt([
      {
        name: 'versionName',
        message: text,
        type: 'input',
        validate: input => {
          if (!this.isYes(input) && !this.isNo(input)) {
            return 'Só é permitido "Sim" ou "Não" como resposta'
          }
          return true
        }

      }
    ])
    return confirmVersion
  }
  getManifestFromEntryPoint (entrypointPath) {
    const manifestPath = path.resolve(
      path.dirname(entrypointPath),
      'manifest.json'
    )
    const manifest = new JSONManager(manifestPath)
    return manifest
  }
}

module.exports = new Utils()
