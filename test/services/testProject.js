const path = require('path')
const { set } = require('lodash')
const readJSON = require('json-file-plus')
const Extension = require('./extension')

class TestProject {
  constructor () {
    this.rootPath = path.resolve('./extensionsToTest')
    this.packagePath = path.join(this.rootPath, 'package.json')
    this.extension1WithBuild = new Extension({ entryPoint: path.join(this.rootPath, 'src', 'extension1', 'App.vue') })
    this.extension2NoBuild = new Extension({ entryPoint: path.join(this.rootPath, 'src', 'extension2', 'App.vue') })
  }

  /**
   *
   * @param {string} targetPath
   * @returns
   */
  #convertPathToPOSIX = targetPath => {
    if (targetPath.includes('/')) {
      return targetPath
    }
  }

  /**
   *
   * @param {Array<string>} absoluteExtensionsPath
   * @param {string} projectRoot
   */
  #setExtensionsToPackageJson = async (absoluteExtensionsPath, projectRoot) => {
    const extensionsPathRelativeToProjectRootPOSIX = absoluteExtensionsPath.map(absoluteExtensionPath => {
      const pathRelative = path.relative(
        projectRoot,
        absoluteExtensionPath
      )
      return this.#convertPathToPOSIX(
        pathRelative
      )
    })
    const packageJsonEditor = await readJSON(
      path.resolve(projectRoot, 'package.json')
    )

    if (packageJsonEditor?.data) {
      set(
        packageJsonEditor.data,
        'quoti.extensions',
        extensionsPathRelativeToProjectRootPOSIX
      )
    }
    await packageJsonEditor.save()
  }

  /**
   *
   * @param {Array<Extension>} extensions
   */
  async setExtensionsOnPackage (extensions) {
    const extensionsPaths = extensions.map(e => {
      return e.entryPointPath
    })

    await this.#setExtensionsToPackageJson(extensionsPaths, this.rootPath)
  }

  async restore () {
    await this.setExtensionsOnPackage(
      [
        this.extension1WithBuild,
        this.extension2NoBuild
      ]
    )
    this.extension1WithBuild.restoreManifestSync()
    this.extension2NoBuild.restoreManifestSync()
  }
}
module.exports = TestProject
