const JSONManager = require('../config/JSONManager')
const path = require('path')
const { merge, set, union } = require('lodash')
const readJSON = require('json-file-plus')

class PackageService extends JSONManager {
  convertPathToPOSIX (targetPath) {
    if (targetPath.includes('/')) {
      return targetPath
    }
    return targetPath.replace(/\\/g, '/')
  }

  async addExtensionToPackageJson (entryPointPath, projectRoot) {
    const extensionPathRelativeToProjectRoot = path.relative(
      projectRoot,
      entryPointPath
    )
    const extensionPathRelativeToProjectRootPOSIX = this.convertPathToPOSIX(
      extensionPathRelativeToProjectRoot
    )
    const packageJsonEditor = await readJSON(
      path.resolve(projectRoot, 'package.json')
    )

    const currentQuotiInfo = merge(
      { extensions: [] },
      await packageJsonEditor.get('quoti')
    )
    currentQuotiInfo.extensions = currentQuotiInfo?.extensions?.map(item => {
      return this.convertPathToPOSIX(item)
    })
    currentQuotiInfo.extensions = union(currentQuotiInfo.extensions, [
      extensionPathRelativeToProjectRootPOSIX
    ])
    if (packageJsonEditor?.data) {
      set(
        packageJsonEditor.data,
        'quoti.extensions',
        currentQuotiInfo.extensions
      )
    }
    await packageJsonEditor.save()
  }
}

module.exports = PackageService
