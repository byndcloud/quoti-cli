const { expect } = require('../common/test')
const sinon = require('sinon')

const path = require('path')
const fs = require('fs')
const VueCliService = require('@vue/cli-service')
const Socket = require('../../src/config/socket')

const TestProject = require('../services/testProject')
const { expectTimestampInFile } = require('../utils/expects')
const serveSetup = require('../setups/serveSetup')
const testProject = new TestProject()

const delay = n => new Promise((resolve, reject) => setTimeout(resolve, n))

describe('Serve command', function () {
  const sandbox = sinon.createSandbox()
  beforeEach(async function () {
    sandbox.spy(VueCliService.prototype)
    sandbox.spy(Socket.prototype)
    await testProject.setExtensionsOnPackage([
      testProject.extension1WithBuild,
      testProject.extension2NoBuild
    ])
  })
  afterEach(function () {
    sandbox.restore()
  })
  describe('Qt serve extension without build', () => {
    // test 1
    serveSetup
      .noBuild(testProject)
      .it('Test extension without build', async (ctx, done) => {
        const socketSpy = Socket.prototype
        const emitFirstArgs = socketSpy.emit.firstCall.firstArg
        expectTimestampInFile(emitFirstArgs.data.code, ctx.now)
        done()
      })
  })

  describe('General tests on qt serve', () => {
    // test 2
    serveSetup
      .allExtensions(testProject)
      .it(
        "When an extension's file is modified vueCliService function must be called with name including dc_extensionUUID",
        async (ctx, done) => {
          const vueCliServiceSpy = VueCliService.prototype
          const runLastArg = vueCliServiceSpy.run.firstCall.lastArg
          const manifest = testProject.extension1WithBuild.getManifest()
          expect(runLastArg.name).to.equal(`dc_${manifest.extensionUUID}`)
          await delay(1000)
          done()
        }
      )
    // test 3
    serveSetup
      .allExtensions(testProject)
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
  })
})
