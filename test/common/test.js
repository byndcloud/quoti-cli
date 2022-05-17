const { expect, test } = require('@oclif/test')
const utilsVueCliService = require('@vue/cli-shared-utils')
const SodaFriendlyErrorsWebpackPlugin = require('@soda/friendly-errors-webpack-plugin')
const CredentialsTest = require('../services/credentials')
const utilsTest = require('../utils/index')

const { randomUUID } = require('crypto')
const credentials = new CredentialsTest()
credentials.createBeyondCredential()
/**
 *
 * @param {require('@oclif/test').test} test
 */
function suppressVueCliLogs (test) {
  return test
    .stub(utilsVueCliService, 'logWithSpinner', () => console.log())
    .stub(utilsVueCliService, 'log', () => console.log())
    .stub(utilsVueCliService, 'done', () => console.log())
    .stub(utilsVueCliService, 'warn', () => console.log())
    .stub(SodaFriendlyErrorsWebpackPlugin.prototype, 'displaySuccess', () =>
      console.log()
    )
}

let myTest = suppressVueCliLogs(test)
myTest = test.register('modifyFiles', extensions => {
  return {
    run (ctx) {
      if (!Array.isArray(ctx.modifiedFiles)) {
        ctx.modifiedFiles = []
      }
      for (const extension of extensions) {
        ctx.modifiedFiles = [
          {
            modifiedFilesPath: extension.entryPointPath,
            manifestPath: extension.manifestPath
          }
        ]
        utilsTest.insertTimestampInFile(
          ctx.modifiedFiles[0].modifiedFilesPath,
          ctx.now
        )
      }
    }
  }
})
myTest = test.register('setRandomSessionId', prefix => {
  return {
    run (ctx) {
      const newCredentials = new CredentialsTest()
      newCredentials.devSessionId = randomUUID()
      newCredentials.save()
      ctx.devSessionIdCreateDuringTest = newCredentials.devSessionId
    }
  }
})
myTest = myTest.register('deleteSessionId', () => {
  return {
    run (ctx) {
      const newCredentials = new CredentialsTest()
      newCredentials.deleteSessionId()
    }
  }
})

module.exports = {
  testStubLoggedIn: myTest,
  expect
}
