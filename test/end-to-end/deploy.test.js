const { expect } = require('../common/test')
const sinon = require('sinon')
const ExtensionService = require('../../src/services/extension')
const BaseCommand = require('../../src/base')
const { expectTimestampInFile } = require('../utils/expects')
const deploySetup = require('../setups/deploySetup')
const TestProject = require('../services/testProject')
const {
  EntryPointNotFoundInPackageError,
  ManifestNotFoundError,
  ExtensionNotFoundError
} = require('../../src/utils/errorClasses')
const testProject = new TestProject()

describe('Deploy command', function () {
  // setup
  const sandbox = sinon.createSandbox()
  beforeEach(async function () {
    sandbox.spy(ExtensionService.prototype)
    sandbox.spy(BaseCommand.prototype)
    await testProject.setExtensionsOnPackage([
      testProject.extension1WithBuild,
      testProject.extension2NoBuild
    ])
  })
  afterEach(async function () {
    await testProject.restore()
    sandbox.restore()
  })

  describe('Deploy no build', () => {
    // test 1
    deploySetup
      .noBuild(testProject)
      .it('qt deploy to extension without build', async (ctx, done) => {
        const extensionServiceSpy = ExtensionService.prototype
        expect(extensionServiceSpy.build.notCalled)
        expect(extensionServiceSpy.upload.callCount).to.equal(1)

        const uploadFirstArgs = extensionServiceSpy.upload.firstCall.args
        const bufferPassedToUploadFunction = uploadFirstArgs[0]
        expectTimestampInFile(bufferPassedToUploadFunction, ctx.now)

        expect(extensionServiceSpy.deployVersion.callCount).to.equal(1)

        done()
      })
    // test 2
    deploySetup
      .deployExtensionNoBuildWithoutArgs(testProject)
      .it(
        'qt deploy to extension no build without argument',
        async (ctx, done) => {
          const extensionServiceSpy = ExtensionService.prototype
          expect(extensionServiceSpy.build.notCalled)
          expect(extensionServiceSpy.upload.callCount).to.equal(1)
          const uploadFirstArgs = extensionServiceSpy.upload.firstCall.args
          const bufferPassedToUploadFunction = uploadFirstArgs[0]
          expectTimestampInFile(bufferPassedToUploadFunction, ctx.now)
          expect(extensionServiceSpy.deployVersion.callCount).to.equal(1)

          done()
        }
      )
  })
  describe('Deploy with build', () => {
    // test 3
    deploySetup
      .withBuild(testProject)
      .it('qt deploy to extension with build', async (ctx, done) => {
        const extensionServiceSpy = ExtensionService.prototype

        expect(extensionServiceSpy.build.callCount).to.equal(1)

        expect(extensionServiceSpy.upload.callCount).to.equal(1)

        const uploadFirstArgs = extensionServiceSpy.upload.firstCall.args
        const bufferPassedToUploadFunction = uploadFirstArgs[0]
        expectTimestampInFile(bufferPassedToUploadFunction, ctx.now)

        expect(extensionServiceSpy.deployVersion.callCount).to.equal(1)

        done()
      })
  })

  describe('General tests on deployment', () => {
    const extensionsToTest = [
      {
        name: 'extension with build',
        testProject,
        extensionA: testProject.extension1WithBuild,
        extensionB: testProject.extension2NoBuild
      },
      {
        name: 'extension no build',
        testProject,
        extensionA: testProject.extension2NoBuild,
        extensionB: testProject.extension1WithBuild
      }
    ]
    extensionsToTest.forEach(extension => {
      // test 4
      deploySetup
        .noEntrypointOnPackage(extension)
        .catch(err => {
          expect(err).to.be.an.instanceof(EntryPointNotFoundInPackageError)
        })
        .it(
          `qt deploy to extension not listed in package [${extension.name}]`,
          async (_, done) => {
            const extensionServiceSpy = ExtensionService.prototype
            expect(extensionServiceSpy.build.notCalled)
            expect(extensionServiceSpy.upload.notCalled)
            expect(extensionServiceSpy.deployVersion.notCalled)
            done()
          }
        )
      // test 5
      deploySetup
        .noManifest(extension)
        .catch(err => {
          expect(err).to.be.an.instanceof(ManifestNotFoundError)
        })
        .it('qt deploy to extension no manifest', async (_, done) => {
          const extensionServiceSpy = ExtensionService.prototype
          expect(extensionServiceSpy.build.notCalled)
          expect(extensionServiceSpy.upload.notCalled)
          expect(extensionServiceSpy.deployVersion.notCalled)
          done()
        })

      // // test 6
      deploySetup
        .remoteExtensionNotFound(extension)
        .catch(err => {
          expect(err).to.be.an.instanceof(ExtensionNotFoundError)
        })
        .it(
          'qt deploy to extension without remote extension',
          async (_, done) => {
            const extensionServiceSpy = ExtensionService.prototype
            expect(extensionServiceSpy.build.notCalled)
            expect(extensionServiceSpy.upload.notCalled)
            expect(extensionServiceSpy.deployVersion.notCalled)
            done()
          }
        )
    })
    // // test 7
    deploySetup
      .deployAllExtensions(testProject)
      .it('qt deploy all extensions', async (ctx, done) => {
        const extensionServiceSpy = ExtensionService.prototype

        expect(extensionServiceSpy.build.callCount).to.equal(1)

        expect(extensionServiceSpy.upload.callCount).to.equal(2)

        const uploadFirstArgs = extensionServiceSpy.upload.firstCall.args
        let bufferPassedToUploadFunction = uploadFirstArgs[0]
        expectTimestampInFile(bufferPassedToUploadFunction, ctx.now)

        const uploadSecondArgs = extensionServiceSpy.upload.firstCall.args
        bufferPassedToUploadFunction = uploadSecondArgs[0]
        expectTimestampInFile(bufferPassedToUploadFunction, ctx.now)

        expect(extensionServiceSpy.deployVersion.callCount).to.equal(2)

        done()
      })
  })
})
