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
  if (!pkgInfo?.packageJson) {
    throw new Error(
      'Para executar esse comando você precisa estar em um projeto Vue com um arquivo package.json. Execute npm init na raiz do projeto ou use um modelo.'
    )
  }

  return path.resolve(path.dirname(pkgInfo.path))
}
function listExtensionsPaths () {
  const projectRoot = getProjectRootPath()
  const pkgInfo = readPkgSync()
  return pkgInfo.packageJson.quoti.extensions.map(extPath =>
    path.resolve(projectRoot, extPath)
  )
}
function validateEntryPointIncludedInPackage (entryPointPath) {
  const entryPointPaths = listExtensionsPaths()
  if (
    !entryPointPaths.includes(path.resolve(entryPointPath))
  ) {
    throw new Error(
      `O entrypoint especificado (${entryPointPath}) não está entre as extensões que já foram selecionadas. Tem certeza que o caminho está correto ou que a extensão já foi selecionada com qt select-extension?`
    )
  }
}

module.exports = {
  isYes,
  isNo,
  confirmQuestion,
  getManifestFromEntryPoint,
  getProjectRootPath,
  listExtensionsPaths,
  validateEntryPointIncludedInPackage
}
