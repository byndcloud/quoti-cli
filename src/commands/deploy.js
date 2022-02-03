const md5 = require('md5')
const { firebase } = require('../config/firebase')
const ora = require('ora')
const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const api = require('../config/axios')
const ExtensionService = require('../services/extension')
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const semver = require('semver')
const Logger = require('../config/logger')
const {
  getManifestFromEntryPoint,
  listExtensionsPaths
} = require('../utils/index')

class DeployCommand extends Command {
  constructor () {
    super(...arguments)
    this.logger = Logger.child({
      tag: 'command/deploy'
    })
    this.spinnerOptions = {
      spinner: 'arrow3',
      color: 'yellow'
    }
    this.spinner = ora(this.spinnerOptions)
    try {
      this.extensionsPaths = listExtensionsPaths()
    } catch (error) {
      this.logger.error(error)
      process.exit(0)
    }
  }
  async run () {
    credentials.load()
    const { args } = this.parse(DeployCommand)
    let { entryPointPath } = args
    if (!entryPointPath) {
      entryPointPath = await this.getEntryPointFromUser()
    }
    this.manifest = getManifestFromEntryPoint(entryPointPath)
    this.extensionService = new ExtensionService(this.manifest)
    try {
      if (!this.manifest.exists()) {
        this.logger.warning(
          'Por favor selecione sua extensão. Execute qt selectExtension no diretório onde encontra a extensão'
        )
        return
      }
      const currentTime = await firebase.firestore.Timestamp.fromDate(
        new Date()
      ).toMillis()
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

      const token = await firebase.auth().currentUser.getIdToken()
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
      this.spinner.fail(error.message)
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
          message: 'Qual extensão deseja publicar ?',
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
