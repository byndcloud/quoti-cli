const { expect, test } = require('@oclif/test')
const CredentialsTest = require('../services/credentials')

const credentials = new CredentialsTest()
credentials.createBeyondCredential()

const myTest = test
module.exports = {
  testStubLoggedIn: myTest,
  expect
}
