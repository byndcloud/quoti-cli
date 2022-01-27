const credentials = require('../config/credentials')
const { default: Command, flags } = require('@oclif/command')
const chalk = require('chalk')
const api = require('../config/axios')
const { firebase } = require('../config/firebase')
const semver = require('semver')
const { getManifestFromEntryPoint, confirmQuestion } = require('../utils/index')
const inquirer = require('inquirer')
const readPkgSync = require('read-pkg-up').sync
const path = require('path')

class PublishCommand extends Command {
  constructor () {
    super(...arguments)

    credentials.load()

    const pkgInfo = readPkgSync()
    if (!pkgInfo?.packageJson) {
      throw new Error(
        'Nenhum arquivo package.json encontrado, tem certeza que o diretório atual é de um projeto Vue?'
      )
    }

    this.projectRoot = path.resolve(path.dirname(pkgInfo.path))
    this.extensionsPaths = pkgInfo.packageJson.quoti.extensions.map(extPath =>
      path.resolve(this.projectRoot, extPath)
    )
    if (this.extensionsPaths.length === 0) {
      throw new Error(
        'Nenhuma extensão declarada no package.json, adicione o entrypoint da sua extensão em um array no path quoti.extensions dentro do package.json'
      )
    }
  }
  async run () {
    try {
      const { flags, args } = this.parse(PublishCommand)
      const { entryPointPath } = args
      const manifest = await this.getManifest(entryPointPath)
      console.log(manifest)
      if (!manifest.extensionUUID) {
        this.error(`For security reasons it is necessary to re-deploy your extension before publishing it on the marketplace. Once deployed, this message will no longer appear, but even with deploy, whenever you want to switch to a version older than today's date, it will be necessary to deploy before.`)
        process.exit(0)
      }
      if (flags.version && !semver.valid(flags.version)) {
        this.error(`Version must be in x.x.x format`)
        process.exit(0)
      }

      if (!this.commandSintaxeValid(flags)) {
        this.error(`Use only one flag  --version --patch, --minor, --major`)
        process.exit(0)
      }

      if (!manifest) {
        this.warning('Please select your extension. Try run qt select-extension')
        process.exit(0)
      }

      const token = await firebase.auth().currentUser.getIdToken()

      const { data } = await api.axios.get(
        decodeURIComponent(`/${credentials.institution}/dynamic-components?where[id]=${manifest.extensionId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      const dynamicComponentFile = data[0]
      if (!dynamicComponentFile) {
        this.error('Extension not found. Check if you still have this extension')
        process.exit(0)
      }
      const dynamicComponentFileActivated = dynamicComponentFile.DynamicComponentsFiles.find(item => item.activated)
      if (!dynamicComponentFileActivated) {
        this.error('No version is active for this extension. To perform the publish we first need to deploy some version')
        process.exit(0)
      }
      if (!dynamicComponentFile.marketplaceExtensionId) {
        await this.publishExtension(flags, dynamicComponentFileActivated.id, token, manifest)
      } else {
        await this.publishNewVersion(flags, dynamicComponentFileActivated.id, token, manifest)
      }
    } catch (error) {
      this.error(error?.response?.data?.error || error)
    }
  }
  async publishExtension (flags, dynamicComponentFileId, token, manifest) {
    if (this.existIncrementVersion(flags)) { this.warning('Flag [--patch] [--minor] [--major] ignored. You are publishing an extension and therefore the [--patch] [--minor] [--major] flag is unimportant in this scenario. Only use when updating a version of an existing extension') }
    const confirmed = await confirmQuestion(`Deseja publicar a extensão "${manifest.name}" no marketplace? Sim/Não\n`)
    if (!confirmed) {
      process.exit(0)
    }
    let version
    if (!flags.version) {
      const { versionName } = await inquirer.prompt([
        {
          name: 'versionName',
          message:
              `Escolha uma versão para sua extensão`,
          type: 'input',
          validate: input => {
            if (!semver.valid(input)) {
              return 'A versão deve está no formato x.x.x'
            }
            return true
          }

        }
      ])
      version = versionName
    } else {
      version = flags.version
    }
    const bodyPublishExtension = { dynamicComponentFileId, version, extensionUUID: manifest.extensionUUID }
    await this.callEndpointPublishExtension(bodyPublishExtension, token)
    this.success('New extension is published with success')
  }
  async publishNewVersion (flags, dynamicComponentFileId, token, manifest) {
    const confirmed = await confirmQuestion(`Deseja publicar uma nova versão para a extensão "${manifest.name}" já publicada no marketplace? Sim/Não\n`)
    if (!confirmed) {
      process.exit(0)
    }
    let versionIncrement
    if (!flags.version) {
      if (Object.keys(flags).length === 0) {
        versionIncrement = 'PATCH'
      } else {
        versionIncrement = Object.keys(flags)[0].toUpperCase()
      }
    }
    const bodyPublishExtensionVersion = {
      dynamicComponentFileId,
      version: flags.version,
      versionIncrement
    }
    try {
      await this.callEndpointPublishExtensionVersion(bodyPublishExtensionVersion, token)
    } catch (error) {
      if (error.response.status === 422) {
        this.error('Intended version is less than or equal to last version')
      } else {
        this.error(JSON.stringify(error, null, 2))
      }
      process.exit(0)
    }
    this.success('New version is published with success')
  }

  commandSintaxeValid (flags) {
    return Object.keys(flags).length < 2
  }
  async callEndpointPublishExtensionVersion (body, token) {
    await api.axios.post(
      `/${credentials.institution}/marketplace/extensions/publish-version`,
      body,
      { headers: { Authorization: `Bearer ${token}` } }
    )
  }
  async callEndpointPublishExtension (body, token) {
    await api.axios.post(
      `/${credentials.institution}/marketplace/extensions`,
      body,
      { headers: { Authorization: `Bearer ${token}` } }
    )
  }

  async getManifest (entryPointPath) {
    if (entryPointPath) {
      return getManifestFromEntryPoint(entryPointPath)
    }
    const extensionsChoices = this.extensionsPaths.map(e => ({ name: path.relative(
      './',
      e
    ),
    value: e }))
    if (extensionsChoices.length > 1) {
      const { selectedExtensionPublish } = await inquirer.prompt([
        {
          name: 'selectedExtensionPublish',
          message: 'Qual extensão deseja publicar ?',
          type: 'list',
          choices: extensionsChoices
        }
      ])
      entryPointPath = selectedExtensionPublish
    } else {
      entryPointPath = extensionsChoices[0].value
    }
    return getManifestFromEntryPoint(entryPointPath)
  }
  // todo: ajustar numa próxima task para termos um logger
  success (text) {
    console.log(chalk.blue('SUCCESS: ' + text))
  }
  warning (text) {
    console.log(chalk.yellow('WARNING: ' + text))
  }
  error (text) {
    console.log(chalk.red('ERROR: ' + text))
  }
  existIncrementVersion (flags) {
    return flags.patch || flags.minor || flags.major
  }
}
PublishCommand.description = `Publish new extension`
PublishCommand.flags = {
  version: flags.string({
    char: 'v',
    description: 'Version of the extension'
  }),

  // incrementVersion [patch, minor, major]
  patch: flags.boolean({
    char: 'p',
    description: 'x.x.x -> x.x.x+1'
  }),

  minor: flags.boolean({
    char: 'm',
    description: 'x.x.x -> x.x+1.x'
  }),

  major: flags.boolean({
    char: 'M',
    description: 'x.x.x -> x+1.x.x'
  })

}
PublishCommand.args = [
  {
    name: 'entryPointPath',
    required: false,
    description: "The path to an Extension's entry point"
  }
]

module.exports = PublishCommand
