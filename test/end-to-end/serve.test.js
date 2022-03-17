const { expect, test } = require('@oclif/test')
const sinon = require('sinon')
const credentials = require('../../src/config/credentials')
const utils = require('../../src/utils/index')
const JSONManager = require('../../src/config/JSONManager')
const path = require('path')
const fs = require('fs')
const VueCliService = require('@vue/cli-service')
const Socket = require('../../src/config/socket')

const testProjectRootPath = path.resolve('./extensionsToTest')
const utilsVueCliService = require('@vue/cli-shared-utils')
const SodaFriendlyErrorsWebpackPlugin = require('@soda/friendly-errors-webpack-plugin')

const beyondCredentials = process.env.TEST_BEYOND_CREDENTIALS
const beyondCredentialsPath = path.resolve('./test/beyondCredentials.json')
fs.writeFileSync(beyondCredentialsPath, beyondCredentials)
function changeFile (pathFile, now) {
  if (!fs.existsSync(pathFile)) {
    throw new Error(`${pathFile} is invalid path`)
  }
  const file = fs.readFileSync(pathFile, { encoding: 'utf8' })
  const UUIDRegex = /[0-9]{13}/
  const newFile = file.replace(UUIDRegex, now)
  fs.writeFileSync(pathFile, newFile)
}
const delay = n => new Promise((resolve, reject) => setTimeout(resolve, n))

describe('Serve command', () => {
  const sandbox = sinon.createSandbox()
  beforeEach(function () {
    sandbox.spy(VueCliService.prototype)
    sandbox.spy(Socket.prototype)
  })
  afterEach(function () {
    sandbox.restore()
  })

  const commonServeTestSetup = test
    .add('now', Date.now())
    .add('testProjectRootPath', testProjectRootPath)
    .add('extensionsPaths', ctx => {
      return utils.listExtensionsPaths(ctx.testProjectRootPath)
    })
    .add('manifests', ctx => {
      return ctx.extensionsPaths.map(entryPoint => ({ entryPoint: utils.getManifestFromEntryPoint(entryPoint) }))
    })
    .add('distPath', ctx => path.join(ctx.testProjectRootPath, 'dist'))

  const setupServeTestNoBuild = commonServeTestSetup
    .add('modifiedFiles', ctx => {
      return [{
        modifiedFilesPath: path.join(ctx.testProjectRootPath, 'src', 'extension2', 'App.vue'),
        manifestPath: path.join(ctx.testProjectRootPath, 'src', 'extension2', 'manifest.json')
      }]
    })
    .stub(credentials, 'path', beyondCredentialsPath)
    .stub(utils, 'getProjectRootPath', () => testProjectRootPath)
    // .stdout()
    .command(['serve'])

    .do(async ctx => {
      await delay(1000)
      changeFile(ctx.modifiedFiles[0].modifiedFilesPath, ctx.now)
      await delay(1000)
    })

  const setupServeTest = commonServeTestSetup
    .add('modifiedFiles', ctx => {
      return [{
        modifiedFilesPath: path.join(ctx.testProjectRootPath, 'src', 'extension1', 'views', 'MyComponent.vue'),
        manifestPath: path.join(ctx.testProjectRootPath, 'src', 'extension1', 'manifest.json')
      }]
    })
    .stub(credentials, 'path', beyondCredentialsPath)
    .stub(utils, 'getProjectRootPath', () => testProjectRootPath)
    .stub(utilsVueCliService, 'logWithSpinner', () => console.log())
    .stub(utilsVueCliService, 'log', () => console.log())
    .stub(utilsVueCliService, 'done', () => console.log())
    .stub(utilsVueCliService, 'warn', () => console.log())

    .stub(SodaFriendlyErrorsWebpackPlugin.prototype, 'displaySuccess', () => console.log())
    // .stdout()
    .command(['serve'])

    .do(async ctx => {
      await delay(1000)
      changeFile(ctx.modifiedFiles[0].modifiedFilesPath, ctx.now)
      await delay(1000)
    })

  setupServeTestNoBuild.it('Test extension without build', async (ctx, done) => {
    const argsEmit = Socket.prototype.emit.args[0][0]
    expect(argsEmit?.data?.code.includes(ctx.now)).to.equal(true)
    done()
  })

  setupServeTest.it('When an extension\'s file is modified vueCliService function must be called with name including dc_extensionUUID', async (ctx, done) => {
    const vueCliServiceArgs = VueCliService.prototype.run.args[0][1]
    const manifestPath = ctx.modifiedFiles[0].manifestPath
    const manifest = new JSONManager(manifestPath)
    expect(vueCliServiceArgs.name).to.equal(`dc_${manifest.extensionUUID}`)
    await delay(1000)
    done()
  })

  setupServeTest.it('Change in a extension\'s file must be built in dist/dc_uuid.umd.min.js', async (ctx, done) => {
    const manifestPath = ctx.modifiedFiles[0].manifestPath
    const manifest = new JSONManager(manifestPath)
    const distExtensionPath = path.join(ctx.distPath, `dc_${manifest.extensionUUID}.umd.min.js`)
    while (!fs.existsSync(distExtensionPath)) {
      await delay(100)
    }
    const file = fs.readFileSync(distExtensionPath, { encoding: 'utf8' })
    expect(file.includes(ctx.now)).to.equal(true)
    done()
  })
})
