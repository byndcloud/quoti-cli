const path = require('path')
class Extension {
  constructor ({ entryPoint }) {
    this.entryPoint = path.resolve(entryPoint)
    this.manifest = path.join(path.dirname(entryPoint), 'manifest.json')
  }
}
module.exports = Extension
