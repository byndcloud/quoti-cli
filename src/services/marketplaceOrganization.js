const credentials = require('../config/credentials')
const { downloadFile, unzip } = require('../utils/index')
const path = require('path')
const fs = require('fs')
credentials.load()
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

  copyTemplateToPath ({ extensionType = 'build', to } = {}) {
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
