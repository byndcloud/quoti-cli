const initSetup = require('../setups/initSetup.js')
const {
  expectEntryPointFileToExist,
  expectManifestAccordingRemoteExtension
} = require('../expect/init')

describe('Init command', function () {
  describe('Init common to extension with/without build', () => {
    const types = ['build', 'noBuild']
    types.forEach(type => {
      initSetup
        .init({ preRun: { type } })
        .it(`qt init to extension ${type}`, async (ctx, done) => {
          expectEntryPointFileToExist({ cwd: ctx.cwd, type })
          await expectManifestAccordingRemoteExtension({
            cwd: ctx.cwd,
            type
          })
          done()
        })
    })
  })
})
