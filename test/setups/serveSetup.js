const utils = require('../../src/utils/index')
const { testStubLoggedIn } = require('../common/test')

const path = require('path')

const utilsTest = require('../utils/index')
const TestProject = require('../services/testProject')

const testProjectRootPath = path.resolve('./extensionsToTest')
const delay = n => new Promise((resolve, reject) => setTimeout(resolve, n))

const testProjectServe = new TestProject()
const commonServeTestSetup = testStubLoggedIn
  .add('testProjectRootPath', testProjectServe.rootPath)
  .add('extensionsPaths', ctx => {
    return utils.listExtensionsPaths(ctx.testProjectRootPath)
  })
  .add('distPath', ctx => path.join(ctx.testProjectRootPath, 'dist'))
  .stub(utils, 'getProjectRootPath', () => testProjectRootPath)

function noBuild (testProject, arg) {
  return commonServeTestSetup
    .add('now', Date.now())
    .add('modifiedFiles', ctx => {
      return [
        {
          modifiedFilesPath: testProject.extension2NoBuild.entryPointPath,
          manifestPath: testProject.extension2NoBuild.manifestPath
        }
      ]
    })
    .command(['serve', arg])

    .do(async ctx => {
      await delay(1000)
      utilsTest.insertTimestampInFile(
        ctx.modifiedFiles[0].modifiedFilesPath,
        ctx.now
      )
      await delay(1000)
    })
}

function withBuild (testProject, arg) {
  return commonServeTestSetup
    .add('now', Date.now())
    .add('modifiedFiles', ctx => {
      return [
        {
          modifiedFilesPath: testProject.extension1WithBuild.entryPointPath,
          manifestPath: testProject.extension1WithBuild.manifestPath
        }
      ]
    })
    .command(['serve', arg])

    .do(async ctx => {
      await delay(1000)
      utilsTest.insertTimestampInFile(
        ctx.modifiedFiles[0].modifiedFilesPath,
        ctx.now
      )
      // todo: criar uma abordagem desse delay ficar automático
      await delay(1000)
    })
}

function noEntrypointOnPackage ({ testProject, extensionA, extensionB }) {
  return commonServeTestSetup
    .do(async _ => {
      await testProject.setExtensionsOnPackage([extensionA])
    })
    .command(['serve', extensionB.entryPointPath])
}

function noManifest ({ extensionA }) {
  return commonServeTestSetup
    .do(async _ => {
      extensionA.deleteManifestSync()
    })
    .command(['serve', extensionA.entryPointPath])
}
function remoteExtensionNotFound ({ extensionA }) {
  return commonServeTestSetup
    .do(async _ => {
      extensionA.setExtensionIdOnManifest(99999999)
    })
    .command(['serve', extensionA.entryPointPath])
}

function serve ({
  extensionA,
  args = [],
  preRun: { setRandomDevSessionId = false } = {}
}) {
  let setup = commonServeTestSetup.add('now', Date.now())
  if (setRandomDevSessionId) {
    setup = setup.setRandomSessionId()
  }
  return setup
    .add('modifiedFiles', ctx => {
      return [
        {
          modifiedFilesPath: extensionA.entryPointPath,
          manifestPath: extensionA.manifestPath
        }
      ]
    })
    .command(['serve', ...args])
    .do(async ctx => {
      await delay(1000)
      utilsTest.insertTimestampInFile(
        ctx.modifiedFiles[0].modifiedFilesPath,
        ctx.now
      )
      await delay(1000)
    })
}
function serveWithNewSession (extensionA) {
  return commonServeTestSetup
    .add('now', Date.now())
    .setRandomSessionId()
    .add('modifiedFiles', ctx => {
      return [
        {
          modifiedFilesPath: extensionA.entryPointPath,
          manifestPath: extensionA.manifestPath
        }
      ]
    })
    .command(['serve', '--new-session'])

    .do(async ctx => {
      await delay(1000)
      utilsTest.insertTimestampInFile(
        ctx.modifiedFiles[0].modifiedFilesPath,
        ctx.now
      )
      await delay(1000)
    })
}

module.exports = {
  serve,
  noBuild,
  withBuild,
  noEntrypointOnPackage,
  noManifest,
  remoteExtensionNotFound,
  serveWithNewSession
}
