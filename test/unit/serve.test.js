const { expect } = require('@oclif/test')
var sinon = require('sinon')
const proxyquire = require('proxyquire')
const getDependencyTree = sinon.stub()

const extensionsPaths = ['/extension1/App.vue', '/extension2/App.vue', '/extension3/App.vue']

describe('[getDependentExtensionPath]', function () {
  it('Must return dependent extension path according with changedFilePath ', function () {
    const ServeCommandWithDependency = proxyquire('../../src/commands/serve', {
      'get-dependency-tree': getDependencyTree
    })
    getDependencyTree.callsFake(function fakeFn (arg) {
      if (arg.entry.includes('extension1')) {
        return { arr: ['/extension1/File1.vue', '/extension1/File2.vue', '/extension1/File3.vue'] }
      }
      if (arg.entry.includes('extension2')) {
        return { arr: ['/extension2/File1.vue', '/extension2/File2.vue', '/extension2/File3.vue'] }
      }
      if (arg.entry.includes('extension3')) {
        return { arr: ['/extension3/File1.vue', '/extension3/File2.vue', '/extension3/File3.vue'] }
      }
      throw new Error('Error on getDependencyTree.callsFake')
    })

    const serveCommand = new ServeCommandWithDependency({ projectRoot: '/', extensionsPaths })
    for (let index = 1; index <= extensionsPaths.length; index++) {
      const result = serveCommand.getDependentExtensionPath({ changedFilePath: `extension${index}/App.vue` })
      expect(result).to.deep.equal([`/extension${index}/App.vue`])
    }
    for (let index = 1; index <= extensionsPaths.length; index++) {
      const result = serveCommand.getDependentExtensionPath({ changedFilePath: `extension${index}/File1.vue` })
      expect(result).to.deep.equal([`/extension${index}/App.vue`])
    }
  })
})
