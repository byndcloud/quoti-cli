const { expect, test } = require('@oclif/test')
const utilsVueCliService = require('@vue/cli-shared-utils')
const SodaFriendlyErrorsWebpackPlugin = require('@soda/friendly-errors-webpack-plugin')
const CredentialsTest = require('../services/credentials')

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

const myTest = suppressVueCliLogs(test)
module.exports = {
  testStubLoggedIn: myTest,
  expect
}
