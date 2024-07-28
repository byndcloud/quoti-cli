const { expect, test } = require('@oclif/test')
const CredentialsTest = require('../services/credentials')
const utilsTest = require('../utils/index')
const { randomUUID } = require('crypto')
const credentials = new CredentialsTest()
credentials.createBeyondCredential()

let myTest = test
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
myTest = myTest.register('setRandomSessionId', prefix => {
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
