const JSONManager = require('../config/JSONManager')
const path = require('path')
const inquirer = require('inquirer')
function isYes (text) {
  return ['s', 'sim', 'yes', 'y'].includes(text.toLowerCase())
}
function isNo (text) {
  return ['n', 'não', 'nao', 'no'].includes(text.toLowerCase())
}
class Utils {
  async confirmQuestion (text) {
    const { confirmVersion } = await inquirer.prompt([
      {
        name: 'confirmVersion',
        message: text,
        type: 'input',
        validate: input => {
          if (!isYes(input) && !isNo(input)) {
            return 'Só é permitido "Sim" ou "Não" como resposta'
          }
          return true
        }

      }
    ])
    return isYes(confirmVersion)
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
