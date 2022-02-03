const JSONManager = require('../config/JSONManager')
const path = require('path')
const inquirer = require('inquirer')
const readPkgSync = require('read-pkg-up').sync
function isYes (text) {
  return ['s', 'sim', 'yes', 'y'].includes(text.toLowerCase())
}
function isNo (text) {
  return ['n', 'não', 'nao', 'no'].includes(text.toLowerCase())
}

async function confirmQuestion (text) {
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
function getManifestFromEntryPoint (entrypointPath) {
  const manifestPath = path.resolve(
    path.dirname(entrypointPath),
    'manifest.json'
  )
  const manifest = new JSONManager(manifestPath)
  return manifest
}
function getProjectRootPath () {
  const pkgInfo = readPkgSync()
  if (!pkgInfo) {
    throw new Error(
      'Para executar determinado comando você precisa estar em um projeto Vue com um arquivo package.json. Execute npm init na raiz do projeto ou use um modelo.'
    )
  }

  return path.resolve(path.dirname(pkgInfo.path))
}
function listExtensionsPaths () {
  const pkgInfo = readPkgSync()
  if (!pkgInfo?.packageJson) {
    throw new Error(
      'Nenhum arquivo package.json encontrado, tem certeza que o diretório atual é de um projeto Vue?'
    )
  }
  const projectRoot = getProjectRootPath()
  return pkgInfo.packageJson.quoti.extensions.map(extPath =>
    path.resolve(projectRoot, extPath)
  )
}

module.exports = {
  isYes,
  isNo,
  confirmQuestion,
  getManifestFromEntryPoint,
  getProjectRootPath,
  listExtensionsPaths
}
