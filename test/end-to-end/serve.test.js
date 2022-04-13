const { expect, testStubLoggedIn } = require('../common/test')
const sinon = require('sinon')
const utils = require('../../src/utils/index')
const path = require('path')
const fs = require('fs')
const VueCliService = require('@vue/cli-service')
const Socket = require('../../src/config/socket')
const utilsTest = require('../utils/index')
const TestProject = require('../services/testProject')
const { expectTimestampInFile } = require('../utils/expects')

const testProject = new TestProject()

const testProjectRootPath = path.resolve('./extensionsToTest')
const delay = n => new Promise((resolve, reject) => setTimeout(resolve, n))

describe('Serve command', () => {
  const sandbox = sinon.createSandbox()
  beforeEach(async function () {
    sandbox.spy(VueCliService.prototype)
    sandbox.spy(Socket.prototype)
    await testProject.setExtensionsOnPackage(
      [
        testProject.extension1WithBuild,
        testProject.extension2NoBuild
      ]
    )
  })
  afterEach(function () {
    sandbox.restore()
  })

  const commonServeTestSetup = testStubLoggedIn
    .add('now', Date.now())
    .add('testProjectRootPath', testProjectRootPath)
    .add('extensionsPaths', ctx => {
      return utils.listExtensionsPaths(ctx.testProjectRootPath)
    })
    .add('distPath', ctx => path.join(ctx.testProjectRootPath, 'dist'))

  const setupServeTestNoBuild = commonServeTestSetup
    .add('modifiedFiles', ctx => {
      return [{
        modifiedFilesPath: testProject.extension2NoBuild.entryPointPath,
        manifestPath: testProject.extension2NoBuild.manifestPath
      }]
    })
    .stub(utils, 'getProjectRootPath', () => testProjectRootPath)
    .command(['serve'])

    .do(async ctx => {
      await delay(1000)
      utilsTest.insertTimestampInFile(ctx.modifiedFiles[0].modifiedFilesPath, ctx.now)
      await delay(1000)
    })

  const setupServeTest = commonServeTestSetup
    .add('modifiedFiles', ctx => {
      return [{
        modifiedFilesPath: testProject.extension1WithBuild.entryPointPath,
        manifestPath: testProject.extension1WithBuild.manifestPath
      }]
    })
    .stub(utils, 'getProjectRootPath', () => testProjectRootPath)
    .command(['serve'])

    .do(async ctx => {
      await delay(1000)
      utilsTest.insertTimestampInFile(ctx.modifiedFiles[0].modifiedFilesPath, ctx.now)
      await delay(1000)
    })

  setupServeTestNoBuild.it('Test extension without build', async (ctx, done) => {
    const socketSpy = Socket.prototype
    const emitFirstArgs = socketSpy.emit.firstCall.firstArg
    expectTimestampInFile(emitFirstArgs.data.code, ctx.now)
    done()
  })

  setupServeTest.it('When an extension\'s file is modified vueCliService function must be called with name including dc_extensionUUID', async (ctx, done) => {
    const vueCliServiceSpy = VueCliService.prototype
    const runLastArg = vueCliServiceSpy.run.firstCall.lastArg
    const manifest = testProject.extension1WithBuild.getManifest()
    expect(runLastArg.name).to.equal(`dc_${manifest.extensionUUID}`)
    await delay(1000)
    done()
  })

  setupServeTest.it('Change in a extension\'s file must be built in dist/dc_uuid.umd.min.js', async (ctx, done) => {
    const manifest = testProject.extension1WithBuild.getManifest()
    const distExtensionPath = path.join(ctx.distPath, `dc_${manifest.extensionUUID}.umd.min.js`)
    while (!fs.existsSync(distExtensionPath)) {
      await delay(100)
    }
    const file = fs.readFileSync(distExtensionPath, { encoding: 'utf8' })
    expect(file.includes(ctx.now)).to.equal(true)
    done()
  })
})
