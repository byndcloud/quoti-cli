const credentials = require('../config/credentials')
const { downloadFile, unzip } = require('../utils/index')
const path = require('path')
const fs = require('fs')
class MarketplaceOrganization {
  constructor () {
    this.templatePath = path.dirname(credentials.getPath())
  }

  async downloadTemplate () {
    const gitUrl =
      'https://github.com/byndcloud/quoti-app-template/archive/refs/heads/main.zip'
    const templateZipPath = path.join(this.templatePath, 'template.zip')
    await downloadFile(gitUrl, templateZipPath)
    unzip(templateZipPath, this.templatePath)
  }

  copyTemplateToPath ({ extensionType = 'Com build', to } = {}) {
    const pathAccordingWithBuild =
      extensionType === 'Com build'
        ? 'extension-with-build'
        : 'extension-no-build'

    const from = path.join(
      this.templatePath,
      'quoti-app-template-main',
      pathAccordingWithBuild
    )

    this.copyFolderSync(from, to)
  }

  copyTemplateEntryPointToPath ({ extensionType = 'Com build', extensionFramework = 'vue', entryPointName, to } = {}) {
    let templateSubPath = ''
    // Determine template path based on framework and type
    if (extensionFramework === 'react') {
      if (extensionType === 'Com build') {
        templateSubPath = 'extension-react-with-build/index.jsx' // Placeholder, adjust to actual template name
      } else { // Sem build
        templateSubPath = 'extension-react-no-build/App.jsx' // Placeholder, adjust to actual template name
      }
    } else { // vue (default)
      if (extensionType === 'Com build') {
        templateSubPath = 'extension-vue-with-build/index.vue' // Placeholder, adjust to actual template name
      } else { // Sem build
        templateSubPath = 'extension-vue-no-build/App.vue' // Placeholder, adjust to actual template name
      }
    }

    // If entryPointName is provided and matches expected names, it could also be used to infer/confirm the template
    // For now, templateSubPath directly defines the template file relative to quoti-app-template-main

    const pathAccordingWithBuild = templateSubPath

    const from = path.join(
      this.templatePath,
      'quoti-app-template-main',
      pathAccordingWithBuild
    )

    if (fs.lstatSync(from).isFile()) {
      // The 'to' parameter already includes the entryPointName from CreateCommand
      fs.copyFileSync(from, to)
    } else {
      // It might be useful to log an error or throw if the template file is not found
      console.warn(`Template file not found at: ${from}`)
    }
  }

  copyFolderSync (from, to) {
    if (!fs.existsSync(to)) {
      fs.mkdirSync(path.resolve(to))
    }
    fs.readdirSync(from).forEach(element => {
      if (fs.lstatSync(path.join(from, element)).isFile()) {
        fs.copyFileSync(path.join(from, element), path.join(to, element))
      } else {
        this.copyFolderSync(path.join(from, element), path.join(to, element))
      }
    })
  }
}

module.exports = MarketplaceOrganization
