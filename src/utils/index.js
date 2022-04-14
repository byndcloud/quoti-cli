const path = require('path')
const inquirer = require('inquirer')
const {
  ManifestNotFoundError,
  EntryPointNotFoundInPackageError
} = require('./errorClasses')
const ManifestService = require('../services/manifest')
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
  const manifest = new ManifestService(manifestPath)
  if (!manifest?.exists()) {
    throw new ManifestNotFoundError({ manifestPath: manifestPath })
  }
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
function listExtensionsPaths (projectRootPath) {
  const projectRoot = projectRootPath || getProjectRootPath()
  const pkgInfo = readPkgSync({ cwd: path.resolve(projectRoot) })
  if (!pkgInfo.packageJson?.quoti?.extensions?.length) {
    throw new Error(
      'Você ainda não selecionou suas extensões. Execute qt select-extension.'
    )
  }
  return pkgInfo.packageJson.quoti.extensions.map(extPath =>
    path.resolve(projectRoot, extPath)
  )
}
function validateEntryPointIncludedInPackage (entryPointPath, projectRootPath) {
  const entryPointPaths = listExtensionsPaths(projectRootPath)
  if (!entryPointPaths.includes(path.resolve(entryPointPath))) {
    throw new EntryPointNotFoundInPackageError({ entryPointPath })
  }
}
/**
 *
 * @param {Object} data
 * @param {string[]} [data.extensionsPaths]
 * @param {string} [data.message]
 * @param {boolean} [data.multiSelect]
 * @returns {Promise<string[]>} entryPointsSelected
 */
async function promptExtensionEntryPointsFromUser ({
  extensionsPaths,
  message = 'Selecione uma extensão',
  multiSelect = true
}) {
  let entryPointPath
  const extensionsChoices = extensionsPaths.map(e => ({
    name: path.relative('./', e),
    value: e
  }))
  if (extensionsChoices.length > 1) {
    const { selectedEntryPoint } = await inquirer.prompt([
      {
        name: 'selectedEntryPoint',
        message,
        type: multiSelect ? 'checkbox' : 'list',
        choices: extensionsChoices
      }
    ])
    entryPointPath = selectedEntryPoint
  } else {
    entryPointPath = extensionsChoices[0]?.value
  }
  if (!Array.isArray(entryPointPath) && entryPointPath) {
    return [entryPointPath]
  }
  return entryPointPath || []
}
function getFrontBaseURL () {
  if (process.env.QUOTI_FRONT_BASE_URL) {
    return process.env.QUOTI_FRONT_BASE_URL
  }

  if (process.env.API_BASE_URL) {
    return 'http://localhost:8080'
  }

  return 'https://quoti.cloud'
}
module.exports = {
  isYes,
  isNo,
  confirmQuestion,
  getManifestFromEntryPoint,
  getProjectRootPath,
  listExtensionsPaths,
  validateEntryPointIncludedInPackage,
  getFrontBaseURL,
  promptExtensionEntryPointsFromUser
}
