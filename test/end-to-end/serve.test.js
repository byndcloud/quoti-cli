const { expect } = require('../common/test')
const sinon = require('sinon')

const path = require('path')
const fs = require('fs')
const VueCliService = require('@vue/cli-service')
const Socket = require('../../src/config/socket')
const ExtensionService = require('../../src/services/extension')

const TestProject = require('../services/testProject')
const { expectTimestampInFile } = require('../utils/expects')
const serveSetup = require('../setups/serveSetup')
const testProject = new TestProject()
const {
  EntryPointNotFoundInPackageError,
  ManifestNotFoundError
} = require('../../src/utils/errorClasses')
const delay = n => new Promise((resolve, reject) => setTimeout(resolve, n))

const CredentialsTest = require('../services/credentials')

describe('Serve command', function () {
  const sandbox = sinon.createSandbox()
  beforeEach(async function () {
    sandbox.spy(VueCliService.prototype)
    sandbox.spy(Socket.prototype)
    sandbox.spy(ExtensionService.prototype)
    await testProject.setExtensionsOnPackage([
      testProject.extension1WithBuild,
      testProject.extension2NoBuild
    ])
  })
  afterEach(async function () {
    await testProject.restore()
    sandbox.restore()
  })
  describe('Qt serve extension without build', () => {
    const args = ['', testProject.extension2NoBuild.entryPointPath]
    for (const arg of args) {
      serveSetup
        .noBuild(testProject, arg)
        .it(`Test extension without build -> arg: ${arg}`, (ctx, done) => {
          const extensionServiceSpy = ExtensionService.prototype
          expect(extensionServiceSpy.build.callCount).to.equal(0)

          const socketSpy = Socket.prototype
          const emitFirstArgs = socketSpy.emit.firstCall.firstArg
          expectTimestampInFile(emitFirstArgs.data.code, ctx.now)
          done()
        })
    }
  })

  describe('Qt serve extension with build', () => {
    const args = [testProject.extension1WithBuild.entryPointPath, '']
    for (const arg of args) {
      serveSetup
        .withBuild(testProject, arg)
        .it(`Test extension with build -> arg: ${arg}`, async (ctx, done) => {
          const extensionServiceSpy = ExtensionService.prototype
          expect(extensionServiceSpy.build.callCount).to.equal(1)

          await delay(1000)
          const socketSpy = Socket.prototype
          const emitFirstArgs = socketSpy.emit.firstCall.firstArg
          expectTimestampInFile(emitFirstArgs.data.code, ctx.now)
          done()
        })
    }
  })
  serveSetup
    .serve({ extensionA: testProject.extension1WithBuild })
    .it(
      "When an extension's file is modified vueCliService function must be called with name including dc_extensionUUID",
      async (ctx, done) => {
        const vueCliServiceSpy = VueCliService.prototype
        const runLastArg = vueCliServiceSpy.run.firstCall.lastArg
        const manifest = testProject.extension1WithBuild.getManifest()
        expect(runLastArg.name).to.equal(`dc_${manifest.extensionUUID}`)
        done()
      }
    )
  serveSetup
    .serve({ extensionA: testProject.extension1WithBuild })
    .it(
      "Change in a extension's file must be built in dist/dc_uuid.umd.min.js",
      async (ctx, done) => {
        const manifest = testProject.extension1WithBuild.getManifest()
        const distExtensionPath = path.join(
          ctx.distPath,
          `dc_${manifest.extensionUUID}.umd.min.js`
        )
        while (!fs.existsSync(distExtensionPath)) {
          await delay(100)
        }
        const file = fs.readFileSync(distExtensionPath, { encoding: 'utf8' })
        expect(file.includes(ctx.now)).to.equal(true)
        done()
      }
    )

  describe('General tests on qt serve', () => {
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
      serveSetup
        .serve({
          extensionA: extension.extensionA,
          preRun: { setRandomDevSessionId: true }
        })
        .it(
          `qt serve when devSessionId already exists[${extension.name}]`,
          async (ctx, done) => {
            const newCredentials = new CredentialsTest()
            expect(ctx.devSessionIdCreateDuringTest).to.equal(
              newCredentials.devSessionId
            )
            done()
          }
        )
      serveSetup
        .serve({ extensionA: extension.extensionA })
        .it(
          `Must create devSessionId when user runs qt serve to extension without devSessionId[${extension.name}]`,
          async (_, done) => {
            const newCredentials = new CredentialsTest()
            const regexUUID =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/
            expect(
              newCredentials.devSessionId.match(regexUUID).length
            ).to.equal(1)
            done()
          }
        )
      serveSetup
        .serve({
          extensionA: extension.extensionA,
          args: ['--new-session'],
          preRun: { setRandomDevSessionId: true }
        })
        .it(
          `Must not create devSessionId when user runs qt serve to extension thar already has devSessionId[${extension.name}]`,
          async (ctx, done) => {
            const newCredentials = new CredentialsTest()
            expect(ctx.devSessionIdCreateDuringTest).to.not.equal(
              newCredentials.devSessionId
            )
            done()
          }
        )
      serveSetup
        .serve({ extensionA: extension.extensionA, args: ['--new-session'] })
        .it(
          `qt serve with --new-session flag when there is no devSessionId[${extension.name}]`,
          async (ctx, done) => {
            const newCredentials = new CredentialsTest()
            expect(newCredentials.devSessionId).to.not.equal(undefined)
            expect(newCredentials.devSessionId).to.not.equal(null)
            expect(newCredentials.devSessionId).to.not.equal('')
            done()
          }
        )
      serveSetup
        .noEntrypointOnPackage(extension)
        .catch(err => {
          expect(err).to.be.an.instanceof(EntryPointNotFoundInPackageError)
        })
        .it(
          `qt serve to extension not listed in package [${extension.name}]`,
          async (_, done) => {
            const extensionServiceSpy = ExtensionService.prototype
            expect(extensionServiceSpy.build.notCalled)
            expect(extensionServiceSpy.upload.notCalled)
            expect(extensionServiceSpy.deployVersion.notCalled)
            done()
          }
        )
      serveSetup
        .noManifest(extension)
        .catch(err => {
          expect(err).to.be.an.instanceof(ManifestNotFoundError)
        })
        .it('qt serve to extension no manifest', async (_, done) => {
          const extensionServiceSpy = ExtensionService.prototype
          expect(extensionServiceSpy.build.notCalled)
          expect(extensionServiceSpy.upload.notCalled)
          expect(extensionServiceSpy.deployVersion.notCalled)
          done()
        })
    })
  })
})
