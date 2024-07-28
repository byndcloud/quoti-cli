const initSetup = require('../setups/initSetup.js')
const {
  expectEntryPointFileToExist,
  expectManifestAccordingRemoteExtension
} = require('../expect/init')

describe('Init command', function () {
  const type = 'build'
  initSetup
    .init({ preRun: { type: 'build' } })
    .it(`qt init to extension ${type}`, async (ctx, done) => {
      expectEntryPointFileToExist({ cwd: ctx.cwd, type })
      await expectManifestAccordingRemoteExtension({
        cwd: ctx.cwd,
        type
      })
      done()
    })
})
