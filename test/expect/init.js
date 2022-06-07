const { expect } = require('@oclif/test')
const fs = require('fs')
const path = require('path')
const OrganizationService = require('../../src/services/organization')
const ManifestService = require('../../src/services/manifest')
const organizationService = new OrganizationService()

function getEntryPointPath ({ cwd, type }) {
  const entryPointPath = getEntryPointDirname({ cwd, type })
  const fileName = type === 'build' ? 'index.vue' : 'App.vue'
  return path.join(entryPointPath, fileName)
}

function getManifestPath ({ cwd, type }) {
  const entryPointPath = getEntryPointDirname({ cwd, type })
  return path.join(entryPointPath, 'manifest.json')
}

function getEntryPointDirname ({ cwd, type }) {
  const entryPointPath =
    type === 'build'
      ? path.join(cwd, 'src', 'pages', 'extension1')
      : path.resolve(cwd)
  return entryPointPath
}

/**
 *
 * @param {object} data
 * @param {string} data.cwd
 * @param {'build'|'noBuild'} data.type
 */
function expectEntryPointFileToExist ({ cwd, type }) {
  const entryPointPath = getEntryPointPath({ cwd, type })
  expect(fs.existsSync(entryPointPath), 'Entry point not found').to.equal(true)
}

/**
 *
 * @param {string|number} buffer
 * @param {number} now
 */
async function expectManifestAccordingRemoteExtension ({ cwd, type }) {
  const manifestPath = getManifestPath({ cwd, type })
  const manifest = new ManifestService(manifestPath)
  const where = {
    id: manifest.extensionId,
    type: manifest.type === 'build' ? 'Com build' : 'Sem build',
    title: manifest.name,
    extensionUUID: manifest.extensionUUID
  }
  const data = await organizationService.listDynamicComponents({ where })
  expect(data, 'Remote extension not found').to.have.lengthOf(1)
}

module.exports = {
  expectEntryPointFileToExist,
  expectManifestAccordingRemoteExtension
}
