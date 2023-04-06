const path = require('path')
const inquirer = require('inquirer')
const {
  ManifestNotFoundError,
  EntryPointNotFoundInPackageError,
  ManifestFromAnotherOrgError
} = require('./errorClasses')
const ManifestService = require('../services/manifest')
const readPkgSync = require('read-pkg-up').sync
const credentials = require('../config/credentials')
const fs = require('fs')
const { default: axios } = require('axios')
const unzipper = require('unzipper')
function isYes (input) {
  if (typeof input === 'boolean') {
    return input
  }

  return ['s', 'sim', 'yes', 'y'].includes(input.toLowerCase())
}

function isNo (input) {
  if (typeof input === 'boolean') {
    return input
  }
  return ['n', 'não', 'nao', 'no'].includes(input.toLowerCase())
}

async function confirmQuestion (text, defaultValue) {
  const { confirmQuestion } = await inquirer.prompt([
    {
      name: 'confirmQuestion',
      message: text,
      type: 'confirm',
      default: defaultValue,
      validate: input => {
        if (!isYes(input) && !isNo(input)) {
          return 'Só é permitido "Sim" ou "Não" como resposta'
        }
        return true
      }
    }
  ])
  return isYes(confirmQuestion)
}

/**
 * Returns a the manifest of the extension in the given path
 * @param {string} entrypointPath
 * @returns {ManifestServiceType}
 */
function getManifestFromEntryPoint (entrypointPath) {
  const manifestPath = path.resolve(
    path.dirname(entrypointPath),
    'manifest.json'
  )
  /**
   * @type {ManifestServiceType}
   */
  const manifest = new ManifestService(manifestPath)
  if (!manifest?.exists()) {
    throw new ManifestNotFoundError({ manifestPath: manifestPath })
  }
  const manifestInstitution = manifest.institution
  const credentialsInstitution = credentials.institution
  if (manifestInstitution !== credentialsInstitution) {
    throw new ManifestFromAnotherOrgError({
      manifestPath,
      manifestInstitution,
      credentialsInstitution
    })
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

function listExtensionsPaths (projectRoot) {
  const pkgInfo = readPkgSync({ cwd: path.resolve(projectRoot) })
  if (!pkgInfo.packageJson?.quoti?.extensions?.length) {
    throw new Error(
      'Você ainda não selecionou suas extensões. Execute qt link.'
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
        validate: input => {
          if (input?.length === 0) {
            return 'Você não selecionou nenhuma extensão para fazer deploy. Utilize a tecla espaço para selecionar a extensão que deseja fazer deploy. '
          }
          return true
        },
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

/**
 *
 * @param {Object} message
 * @param {Object} data
 * @param {boolean} [data.multiSelect]
 * @returns {Promise<string[]>} entryPointsSelected
 */
async function prompt (message, choices, { multiSelect = true } = {}) {
  if (!message) {
    throw Error('message is required')
  }
  if (!choices?.[0]) {
    throw Error('choices is required and must have more than one item')
  }
  let answers
  const formattedChoices =
    typeof choices[0] === 'string'
      ? choices.map(c => {
        return {
          name: c,
          value: c
        }
      })
      : choices

  if (formattedChoices.length > 1) {
    const { selectedChoice } = await inquirer.prompt([
      {
        name: 'selectedChoice',
        message,
        type: multiSelect ? 'checkbox' : 'list',
        validate: input => {
          if (input?.length === 0) {
            return 'Você não selecionou nenhuma opção. Utilize a tecla espaço para selecionar a opção desejada. '
          }
          return true
        },
        choices
      }
    ])
    answers = selectedChoice
  } else {
    answers = formattedChoices[0]?.value
  }
  if (!Array.isArray(answers) && answers) {
    return [answers]
  }
  return answers || []
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

function slugify (str, separator = '-') {
  if (!str) {
    return str
  }
  str = str.replace(/^\s+|\s+$/g, '') // trim
  str = str.toLowerCase()

  // remove accents, swap ñ for n, etc
  const from = 'ãàáäâèéëêìíïîòóöôùúüûñç·/_,:;'
  const to = 'aaaaaeeeeiiiioooouuuunc------'
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
  }

  str = str
    .replace(/[^a-zA-Z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, separator) // collapse whitespace and replace by -
    .replace(/-+/g, separator) // collapse dashes

  return str
}

async function downloadFile (url, filePath) {
  return new Promise((resolve, reject) => {
    axios
      .get(url, {
        responseType: 'stream'
      })
      .then(res => {
        if (res.data?.pipe) {
          const stream = fs.createWriteStream(filePath)
          res.data.pipe(stream)

          stream.on('finish', () => {
            resolve(filePath)
          })
          stream.on('error', reject)
        } else {
          throw new Error('erro ao baixar o arquivo')
        }
      })
  })
}

function unzip (pathIn, pathOut) {
  fs.createReadStream(pathIn).pipe(unzipper.Extract({ path: pathOut }))
}

function required (param) {
  throw new Error(`O parâmetro ${param} é obrigatório`)
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
  promptExtensionEntryPointsFromUser,
  slugify,
  downloadFile,
  unzip,
  required,
  prompt
}
