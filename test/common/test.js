const { expect, test } = require('@oclif/test')
const utilsVueCliService = require('@vue/cli-shared-utils')
const SodaFriendlyErrorsWebpackPlugin = require('@soda/friendly-errors-webpack-plugin')
const credentials = require('../../src/config/credentials')
const fs = require('fs')
const path = require('path')

function createBeyondCredentialPath () {
  const beyondCredentials = process.env.TEST_BEYOND_CREDENTIALS
  const beyondCredentialsPath = path.resolve('./test/beyondCredentials.json')
  fs.writeFileSync(beyondCredentialsPath, beyondCredentials)
  return beyondCredentialsPath
}
/**
 *
 * @param {require('@oclif/test').test} test
 */
function suppressVueCliLogs (test) {
  return test.stub(utilsVueCliService, 'logWithSpinner', () => console.log())
    .stub(utilsVueCliService, 'log', () => console.log())
    .stub(utilsVueCliService, 'done', () => console.log())
    .stub(utilsVueCliService, 'warn', () => console.log())
    .stub(SodaFriendlyErrorsWebpackPlugin.prototype, 'displaySuccess', () => console.log())
}
const myTest = suppressVueCliLogs(test)
module.exports = {
  testStubLoggedIn: myTest.stub(credentials, 'path', createBeyondCredentialPath()),
  test: myTest,
  expect

}
