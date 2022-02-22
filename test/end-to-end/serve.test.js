const { expect, test } = require('@oclif/test')
var sinon = require('sinon')
const credentials = require('../../src/config/credentials')
const utils = require('../../src/utils/index')
const JSONManager = require('../../src/config/JSONManager')
const path = require('path')
const fs = require('fs')
const VueCliService = require('@vue/cli-service')

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
  })
  afterEach(function () {
    sandbox.restore()
  })

  const setupServeTest = test
    .add('now', Date.now())
    .add('testProjectRootPath', testProjectRootPath)
    .add('extensionsPaths', ctx => {
      return utils.listExtensionsPaths(ctx.testProjectRootPath)
    })
    .add('manifests', ctx => {
      return ctx.extensionsPaths.map(entryPoint => ({ entryPoint: utils.getManifestFromEntryPoint(entryPoint) }))
    })
    .add('distPath', ctx => path.join(ctx.testProjectRootPath, `dist`))
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

  setupServeTest.it('When an extension\'s file is modified vueCliService function must be called with name including dc_extensionUUID', async (ctx, done) => {
    const vueCliServiceArgs = VueCliService.prototype.run.args[0][1]
    expect(vueCliServiceArgs.name).to.equal('dc_b391d67d-3db3-496f-abe0-0dc0d2229dd5')
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
