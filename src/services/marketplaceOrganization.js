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
    const { vueContent, reactTsxContent } = require('./extensionTemplates')

    let fileContent = ''
    let ext = ''
    if (extensionFramework === 'react') {
      fileContent = reactTsxContent
      ext = '.tsx'
    } else { // vue (default)
      fileContent = vueContent
      ext = '.vue'
    }

    // Remove any previous extension from 'to' and force the correct one
    const baseName = path.basename(to, path.extname(to))
    const dirName = path.dirname(to)
    const finalPath = path.join(dirName, baseName + ext)

    try {
      // Ensure the directory exists
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true })
      }
      fs.writeFileSync(finalPath, fileContent.trimStart())
    } catch (error) {
      // It might be useful to use a logger instance here if available
      console.error(`Error creating file at ${finalPath}:`, error)
      throw error // Re-throw error to be handled by the caller
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
