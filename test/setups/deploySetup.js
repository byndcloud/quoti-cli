const { testStubLoggedIn } = require('../common/test')
const utils = require('../../src/utils/index')
const DeployCommand = require('../../src/commands/deploy')
const inquirer = require('inquirer')
const utilsTest = require('../utils/index')
const TestProject = require('../services/testProject')
const testProjectDeploy = new TestProject()
const version = Date.now()

const commonDeployTestSetup = testStubLoggedIn
  .stub(utils, 'getProjectRootPath', () => testProjectDeploy.rootPath)
  .stub(
    DeployCommand.prototype,
    'promptVersionName',
    () => `Version ${version}`
  )
  .add('version', version)
  .add('now', Date.now())

function noBuild (testProject) {
  return commonDeployTestSetup
    .add('modifiedFiles', ctx => {
      return [
        {
          modifiedFilesPath: testProject.extension2NoBuild.entryPointPath,
          manifestPath: testProject.extension2NoBuild.manifestPath
        }
      ]
    })
    .do(async ctx => {
      utilsTest.insertTimestampInFile(
        ctx.modifiedFiles[0].modifiedFilesPath,
        ctx.now
      )
    })
    .command(['deploy', testProject.extension2NoBuild.entryPointPath])
}

function withBuild (testProject) {
  return commonDeployTestSetup
    .add('modifiedFiles', ctx => {
      return [
        {
          modifiedFilesPath: testProject.extension1WithBuild.entryPointPath,
          manifestPath: testProject.extension1WithBuild.manifestPath
        }
      ]
    })
    .do(async ctx => {
      utilsTest.insertTimestampInFile(
        ctx.modifiedFiles[0].modifiedFilesPath,
        ctx.now
      )
    })
    .command(['deploy', testProject.extension1WithBuild.entryPointPath])
}

function noEntrypointOnPackage ({ testProject, extensionA, extensionB }) {
  return commonDeployTestSetup
    .do(async _ => {
      await testProject.setExtensionsOnPackage([extensionA])
    })
    .command(['deploy', extensionB.entryPointPath])
}

function noManifest ({ extensionA }) {
  return commonDeployTestSetup
    .do(async _ => {
      extensionA.deleteManifestSync()
    })
    .command(['deploy', extensionA.entryPointPath])
}

function remoteExtensionNotFound ({ extensionA }) {
  return commonDeployTestSetup
    .do(async _ => {
      extensionA.setExtensionIdOnManifest(99999999)
    })
    .command(['deploy', extensionA.entryPointPath])
}
function deployExtensionNoBuildWithoutArgs (testProject) {
  return commonDeployTestSetup
    .add('modifiedFiles', ctx => {
      return [
        {
          modifiedFilesPath: testProject.extension2NoBuild.entryPointPath,
          manifestPath: testProject.extension2NoBuild.manifestPath
        }
      ]
    })
    .do(async ctx => {
      utilsTest.insertTimestampInFile(
        ctx.modifiedFiles[0].modifiedFilesPath,
        ctx.now
      )
    })
    .stub(inquirer, 'prompt', arg => {
      const promptName = arg[0].name
      if (promptName === 'versionName') {
        return { versionName: `Version ${version}` }
      } else if (promptName === 'selectedEntryPoint') {
        return {
          selectedEntryPoint: testProject.extension2NoBuild.entryPointPath
        }
      }
    })
    .command(['deploy'])
}

function deployAllExtensions (testProject) {
  return commonDeployTestSetup
    .add('modifiedFiles', ctx => {
      return [
        {
          modifiedFilesPath: testProject.extension1WithBuild.entryPointPath,
          manifestPath: testProject.extension1WithBuild.manifestPath
        },
        {
          modifiedFilesPath: testProject.extension2NoBuild.entryPointPath,
          manifestPath: testProject.extension2NoBuild.manifestPath
        }
      ]
    })
    .do(async ctx => {
      utilsTest.insertTimestampInFile(
        ctx.modifiedFiles[0].modifiedFilesPath,
        ctx.now
      )
      utilsTest.insertTimestampInFile(
        ctx.modifiedFiles[1].modifiedFilesPath,
        ctx.now
      )
    })
    .command(['deploy', '-a'])
}

module.exports = {
  noBuild,
  withBuild,
  noEntrypointOnPackage,
  noManifest,
  remoteExtensionNotFound,
  deployExtensionNoBuildWithoutArgs,
  deployAllExtensions
}
