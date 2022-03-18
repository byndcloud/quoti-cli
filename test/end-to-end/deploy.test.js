const { expect, testStubLoggedIn } = require('../common/test')
const sinon = require('sinon')
const utils = require('../../src/utils/index')
const ExtensionService = require('../../src/services/extension')

const BaseCommand = require('../../src/base')
const inquirer = require('inquirer')

const utilsTest = require('../utils/index')
const TestProject = require('../services/testProject')
const { expectTimestampInFile } = require('../utils/expects')
const { EntryPointNotFoundInPackageError, ManifestNotFoundError, ExtensionNotFoundError } = require('../../src/utils/errorClasses')
const testProject = new TestProject()

describe('Deploy command', () => {
  // setup
  const sandbox = sinon.createSandbox()
  beforeEach(async function () {
    sandbox.spy(ExtensionService.prototype)
    sandbox.spy(BaseCommand.prototype)
    await testProject.setExtensionsOnPackage(
      [
        testProject.extension1WithBuild,
        testProject.extension2NoBuild
      ]
    )
  })
  afterEach(async function () {
    await testProject.restore()
    sandbox.restore()
  })
  const now = Date.now()
  const commonDeployTestSetup = testStubLoggedIn
    .stub(utils, 'getProjectRootPath', () => testProject.rootPath)
    .stub(inquirer, 'prompt', arg => {
      const promptName = arg[0].name
      if (promptName === 'versionName') {
        return { versionName: `Version ${now}` }
      }
    })

  // test 1
  const setupDeployTestNoBuild = commonDeployTestSetup
    .add('modifiedFiles', ctx => {
      return [{
        modifiedFilesPath: testProject.extension2NoBuild.entryPointPath,
        manifestPath: testProject.extension2NoBuild.manifestPath
      }]
    })
    .do(async ctx => {
      utilsTest.insertTimestampInFile(ctx.modifiedFiles[0].modifiedFilesPath, now)
    })
    .command(['deploy', testProject.extension2NoBuild.entryPointPath])
  setupDeployTestNoBuild.it('qt deploy to extension without build', async (_, done) => {
    const extensionServiceSpy = ExtensionService.prototype

    expect(extensionServiceSpy.build.notCalled)

    expect(extensionServiceSpy.upload.callCount).to.equal(1)

    const uploadFirstArgs = extensionServiceSpy.upload.firstCall.args
    const bufferPassedToUploadFunction = uploadFirstArgs[0]
    expectTimestampInFile(bufferPassedToUploadFunction, now)

    expect(extensionServiceSpy.deployVersion.callCount).to.equal(1)

    done()
  })

  // test 2
  const setupDeployTestWithBuild = commonDeployTestSetup
    .add('modifiedFiles', ctx => {
      return [{
        modifiedFilesPath: testProject.extension1WithBuild.entryPointPath,
        manifestPath: testProject.extension1WithBuild.manifestPath
      }]
    })
    .do(async ctx => {
      utilsTest.insertTimestampInFile(ctx.modifiedFiles[0].modifiedFilesPath, now)
    })
    .command(['deploy', testProject.extension1WithBuild.entryPointPath])

  setupDeployTestWithBuild.it('qt deploy to extension with build', async (_, done) => {
    const extensionServiceSpy = ExtensionService.prototype

    expect(extensionServiceSpy.build.callCount).to.equal(1)

    expect(extensionServiceSpy.upload.callCount).to.equal(1)

    const uploadFirstArgs = extensionServiceSpy.upload.firstCall.args
    const bufferPassedToUploadFunction = uploadFirstArgs[0]
    expectTimestampInFile(bufferPassedToUploadFunction, now)

    expect(extensionServiceSpy.deployVersion.callCount).to.equal(1)

    done()
  })

  // test 3
  const setupDeployTestNoEntrypointOnPackage = commonDeployTestSetup
    .do(async _ => {
      await testProject.setExtensionsOnPackage(
        [
          testProject.extension1WithBuild
        ]
      )
    })
    .command(['deploy', testProject.extension2NoBuild.entryPointPath])
    .catch(err => {
      expect(err).to.be.an.instanceof(EntryPointNotFoundInPackageError)
    })

  setupDeployTestNoEntrypointOnPackage.it('qt deploy to extension not listed in package', async (_, done) => {
    const extensionServiceSpy = ExtensionService.prototype
    expect(extensionServiceSpy.build.notCalled)
    expect(extensionServiceSpy.upload.notCalled)
    expect(extensionServiceSpy.deployVersion.notCalled)
    done()
  })
  // test 4
  const setupDeployTestNoManifest = commonDeployTestSetup
    .do(async _ => {
      testProject.extension1WithBuild.deleteManifestSync()
    })
    .command(['deploy', testProject.extension1WithBuild.entryPointPath])
    .catch(err => {
      expect(err).to.be.an.instanceof(ManifestNotFoundError)
    })

  setupDeployTestNoManifest.it('qt deploy to extension no manifest', async (_, done) => {
    const extensionServiceSpy = ExtensionService.prototype
    expect(extensionServiceSpy.build.notCalled)
    expect(extensionServiceSpy.upload.notCalled)
    expect(extensionServiceSpy.deployVersion.notCalled)
    done()
  })
  // test 5
  const setupDeployTestRemoteExtensionNotFound = commonDeployTestSetup
    .do(async _ => {
      testProject.extension1WithBuild.setExtensionIdOnManifest(99999999)
    })
    .command(['deploy', testProject.extension1WithBuild.entryPointPath])
    .catch(err => {
      expect(err).to.be.an.instanceof(ExtensionNotFoundError)
    })

  setupDeployTestRemoteExtensionNotFound.it('qt deploy to extension without remote extension', async (_, done) => {
    const extensionServiceSpy = ExtensionService.prototype
    expect(extensionServiceSpy.build.notCalled)
    expect(extensionServiceSpy.upload.notCalled)
    expect(extensionServiceSpy.deployVersion.notCalled)
    done()
  })
  // test 6
  const setupDeployTestWithoutArgs = commonDeployTestSetup
    .add('modifiedFiles', ctx => {
      return [{
        modifiedFilesPath: testProject.extension2NoBuild.entryPointPath,
        manifestPath: testProject.extension2NoBuild.manifestPath
      }]
    })
    .do(async ctx => {
      utilsTest.insertTimestampInFile(ctx.modifiedFiles[0].modifiedFilesPath, now)
    })
    .stub(inquirer, 'prompt', arg => {
      const promptName = arg[0].name
      if (promptName === 'versionName') {
        return { versionName: `Version ${now}` }
      } else if (promptName === 'selectedEntryPoint') {
        return {
          selectedEntryPoint: testProject.extension2NoBuild.entryPointPath
        }
      }
    })
    .command(['deploy'])

  setupDeployTestWithoutArgs.it('qt deploy to extension no build without argument', async (_, done) => {
    const extensionServiceSpy = ExtensionService.prototype
    expect(extensionServiceSpy.build.notCalled)
    expect(extensionServiceSpy.upload.callCount).to.equal(1)
    const uploadFirstArgs = extensionServiceSpy.upload.firstCall.args
    const bufferPassedToUploadFunction = uploadFirstArgs[0]
    expectTimestampInFile(bufferPassedToUploadFunction, now)
    expect(extensionServiceSpy.deployVersion.callCount).to.equal(1)

    done()
  })
})
