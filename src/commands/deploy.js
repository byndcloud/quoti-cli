const md5 = require('md5')
const { firebase } = require('../config/firebase')
const ora = require('ora')
const credentials = require('../config/credentials')
const Command = require('../base.js')
const api = require('../config/axios')
const ExtensionService = require('../services/extension')
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const semver = require('semver')
const {
  getManifestFromEntryPoint,
  listExtensionsPaths,
  validateEntryPointIncludedInPackage,
  getRemoteExtensionsByIds
} = require('../utils/index')

const {
  ExtensionNotFoundError
} = require('../utils/erroClasses')

class DeployCommand extends Command {
  constructor () {
    super(...arguments)
    this.spinnerOptions = {
      spinner: 'arrow3',
      color: 'yellow'
    }
    this.spinner = ora(this.spinnerOptions)
    try {
      this.extensionsPaths = listExtensionsPaths()
      if (this.extensionsPaths.length === 0) {
        throw new Error(
          'Nenhuma extensão foi selecionada até agora, execute qt select-extension para escolher extensões para desenvolver.'
        )
      }
    } catch (error) {
      this.logger.error(error)
      process.exit(0)
    }
  }
  async run () {
    credentials.load()
    let { entryPointPath } = this.args
    if (!entryPointPath) {
      entryPointPath = await this.getEntryPointFromUser()
    } else {
      validateEntryPointIncludedInPackage(entryPointPath)
    }
    this.manifest = getManifestFromEntryPoint(entryPointPath)

    const token = await firebase.auth().currentUser.getIdToken()
    const remoteExtension = await getRemoteExtensionsByIds({ ids: [this.manifest.extensionId], orgSlug: credentials.institution, token })
    if (!remoteExtension) {
      throw new ExtensionNotFoundError(`Você não possui a extensão ${path.relative('./', entryPointPath)} em sua organização`)
    }

    this.extensionService = new ExtensionService(this.manifest)

    if (!this.manifest.exists()) {
      this.logger.warning(
        'Por favor selecione sua extensão. Execute qt selectExtension no diretório onde encontra a extensão'
      )
      return
    }
    const currentTime = new Date().getTime()
    const versionName = (await this.inputVersionName()) || currentTime
    const filename = this.getUploadFileNameDeploy(
      currentTime.toString(),
      this.manifest.type === 'build'
    )
    const url = `https://storage.cloud.google.com/dynamic-components/${filename}`

    let extensionPath = entryPointPath
    if (this.manifest.type === 'build') {
      extensionPath = await this.extensionService.build(entryPointPath)
    }

    await this.extensionService.upload(
      fs.readFileSync(extensionPath),
      filename
    )
    try {
      this.spinner.start('Fazendo deploy...')
      await api.axios.put(
        `/${credentials.institution}/dynamic-components/${this.manifest.extensionId}`,
        {
          url: url,
          version: versionName,
          fileVuePrefix: filename,
          activated: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      this.spinner.succeed('Deploy feito com sucesso!')
    } catch (error) {
      let errorMessage = 'Erro durante o deploy. '
      if (error?.response?.data?.message) {
        errorMessage += error?.response?.data?.message
      }
      this.spinner.fail(errorMessage)
    } finally {
      process.exit(0)
    }
  }
  async getEntryPointFromUser () {
    let entryPointPath
    const extensionsChoices = this.extensionsPaths.map(e => ({
      name: path.relative('./', e),
      value: e
    }))
    if (extensionsChoices.length > 1) {
      const { selectedExtensionPublish } = await inquirer.prompt([
        {
          name: 'selectedExtensionPublish',
          message: 'De qual extensão você deseja fazer deploy?',
          type: 'list',
          choices: extensionsChoices
        }
      ])
      entryPointPath = selectedExtensionPublish
    } else {
      entryPointPath = extensionsChoices[0].value
    }
    return entryPointPath
  }
  async inputVersionName () {
    const { versionName } = await inquirer.prompt([
      {
        name: 'versionName',
        message: `Escolha uma versão para sua extensão`,
        type: 'input',
        validate: input => {
          if (!semver.valid(input)) {
            return 'A versão deve está no formato x.x.x'
          }
          return true
        }
      }
    ])
    return versionName
  }
  getUploadFileNameDeploy (currentTime, isBuild) {
    return encodeURI(
      `${credentials.institution}/${md5(currentTime)}.${isBuild ? 'js' : 'vue'}`
    )
  }
}

// TODO: Add documentation and flags specifications

DeployCommand.args = [
  {
    name: 'entryPointPath',
    required: false,
    description: 'Endereço do entry point (arquivo principal) da extensão'
  }
]

DeployCommand.description = `Deploy sua extensão
...
Deploy sua extensão
`

module.exports = DeployCommand
