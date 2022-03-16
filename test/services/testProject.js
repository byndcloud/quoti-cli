const path = require('path')
const Extension = require('./extension')
class TestProject {
  constructor () {
    this.rootPath = path.resolve('./extensionsToTest')
    this.packagePath = path.join(this.rootPath, 'package.json')
    this.extension1WithBuild = new Extension({ entryPoint: path.join(this.rootPath, 'src', 'extension1', 'App.vue') })
    this.extension2NotFound = new Extension({ entryPoint: path.join(this.rootPath, 'src', 'extension2', 'App.vue') })
    this.extension3NoBuild = new Extension({ entryPoint: path.join(this.rootPath, 'src', 'extension3', 'App.vue') })
  }
}
module.exports = TestProject
