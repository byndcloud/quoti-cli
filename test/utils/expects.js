const { expect } = require('@oclif/test')
/**
 *
 * @param {string|number} buffer
 * @param {number} now
 */
function expectTimestampInFile (buffer, now) {
  const file = buffer?.toString()
  expect(file.includes(now)).to.equal(true)
}

module.exports = {
  expectTimestampInFile
}
