const utils = require('../../src/utils/index')
const { testStubLoggedIn } = require('../common/test')

const path = require('path')

const utilsTest = require('../utils/index')
const TestProject = require('../services/testProject')

const testProjectRootPath = path.resolve('./extensionsToTest')
const delay = n => new Promise((resolve, reject) => setTimeout(resolve, n))

const testProjectServe = new TestProject()
const commonServeTestSetup = testStubLoggedIn
  .add('now', Date.now())
  .add('testProjectRootPath', testProjectServe.rootPath)
  .add('extensionsPaths', ctx => {
    return utils.listExtensionsPaths(ctx.testProjectRootPath)
  })
  .add('distPath', ctx => path.join(ctx.testProjectRootPath, 'dist'))

function noBuild (testProject) {
  return commonServeTestSetup
    .add('modifiedFiles', ctx => {
      return [
        {
          modifiedFilesPath: testProject.extension2NoBuild.entryPointPath,
          manifestPath: testProject.extension2NoBuild.manifestPath
        }
      ]
    })
    .stub(utils, 'getProjectRootPath', () => testProjectRootPath)
    .command(['serve'])

    .do(async ctx => {
      await delay(1000)
      utilsTest.insertTimestampInFile(
        ctx.modifiedFiles[0].modifiedFilesPath,
        ctx.now
      )
      await delay(1000)
    })
}
function allExtensions (testProject) {
  return commonServeTestSetup
    .add('modifiedFiles', ctx => {
      return [
        {
          modifiedFilesPath: testProject.extension1WithBuild.entryPointPath,
          manifestPath: testProject.extension1WithBuild.manifestPath
        }
      ]
    })
    .stub(utils, 'getProjectRootPath', () => testProjectRootPath)
    .command(['serve'])

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
  noBuild,
  allExtensions
}
