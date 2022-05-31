const { testStubLoggedIn } = require('../common/test')
const { randomUUID } = require('crypto')
const path = require('path')
const InitExtensionService = require('../../src/services/initExtension')
const commonInitTestSetup = testStubLoggedIn

function init ({ args = [], preRun: { type = true, cwd } = {} }) {
  if (!cwd) {
    cwd = path.resolve('./extensionsToTest2')
  }
  const uuid = randomUUID()
  return commonInitTestSetup
    .add('uuid', uuid)
    .add('cwd', cwd)
    .stub(InitExtensionService.prototype, 'getCWD', () => {
      return cwd
    })
    .stub(InitExtensionService.prototype, 'promptExtensionInfo', ctx => {
      console.log('chamou stub', type)
      const extensionName = `test_${uuid}`
      return {
        title: extensionName,
        path: extensionName,
        type: type === 'build' ? 'Com build' : 'Sem build',
        fileVuePrefix: '',
        url: '',
        version: '0.0.1',
        meta: {
          public: false,
          hasToolbar: true
        },
        DynamicComponentsFiles: [],
        id: null
      }
    })
    .command(['init', ...args])
}

module.exports = {
  init
}
