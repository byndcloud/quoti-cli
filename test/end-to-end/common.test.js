const { expect, testStubLoggedIn } = require('../common/test')
const sinon = require('sinon')
const utils = require('../../src/utils/index')
const ExtensionService = require('../../src/services/extension')

const BaseCommand = require('../../src/base')
const TestProject = require('../services/testProject')
const { ManifestFromAnotherOrgError } = require('../../src/utils/errorClasses')
const CredentialsTest = require('../services/credentials')

const testProject = new TestProject()
const credentials = new CredentialsTest()

describe('Common command', function () {
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
  const commonTestSetup = testStubLoggedIn.stub(
    utils,
    'getProjectRootPath',
    () => testProject.rootPath
  )
  const commands = ['deploy', 'serve', 'publish']
  for (const command of commands) {
    commonTestSetup
      .do(() => {
        credentials.institution = 'marketplace' // could it be any other org
        credentials.save()
      })
      .command([command, testProject.extension1WithBuild.entryPointPath])
      .catch(err => {
        expect(err).to.be.an.instanceof(ManifestFromAnotherOrgError)
      })
      .do(() => {
        credentials.institution = 'beyond' // could it be any other org
        credentials.save()
      })
      .it('qt serve/deploy/publish when manifest has no institution attribute')
  }
})
