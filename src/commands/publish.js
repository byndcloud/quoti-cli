const credentials = require('../config/credentials')
const { default: Command, flags } = require('@oclif/command')
const { default: chalk } = require('chalk')
const manifest = require('../config/manifest')
const api = require('../config/axios')
const { firebase } = require('../config/firebase')
const readline = require('readline')
const moment = require('moment')
const semver = require('semver')
const { isYes } = require('../utils/index')
class PublishCommand extends Command {
  async run () {
    // The login itself is done in the hook so just display a message

    try {
      const { flags } = this.parse(PublishCommand)
      if (flags.version && !semver.valid(flags.version)) {
        this.error(`Version must be in x.x.x format`)
        process.exit(0)
      }

      if (!this.commandSintaxeValid(flags)) {
        this.error(`Use only one flag  --version --patch, --minor, --major`)
        process.exit(0)
      }

      if (!manifest.exists()) {
        this.warning('Please select your extension. Try run qt selectExtension')
        process.exit(0)
      }

      await manifest.load()
      const token = await firebase.auth().currentUser.getIdToken()

      const { data } = await api.axios.get(
        `/${credentials.institution}/dynamic-components?where%5Bid%5D=${manifest.extensionId}`,
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
        // publish new extension
        if (this.existIncrementVersion(flags)) { this.warning('Flag [--patch] [--minor] [--major] ignored. You are publishing an extension and therefore the [--patch] [--minor] [--major] flag is unimportant in this scenario. Only use when updating a version of an existing extension') }
        const confirmed = await this.confirmQuestion(`Do you want to publish the "${manifest.name}" extension to the marketplace? Yes/No\n`)
        if (!confirmed) {
          process.exit(0)
        }
        let version
        if (!flags.version) {
          let versionIsValid
          while (!versionIsValid) {
            version = await this.getResponseFromUser('Which version do you want to publish the extension? default(0.0.1)\n', '0.0.1')
            versionIsValid = semver.valid(version)
            if (!versionIsValid) {
              this.error(chalk.red(`Version must be in x.x.x format`))
            }
          }
        } else {
          version = flags.version
        }
        const bodyPublishExtension = { dynamicComponentFileId: dynamicComponentFileActivated.id, version }
        await this.publishExtension(bodyPublishExtension, token)
        this.success('New extension is published with success')
      } else {
        // publish new version
        const confirmed = await this.confirmQuestion(`Do you want to publish a new version for extension "${manifest.name}" already published in the marketplace? Yes/No\n`)
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
          dynamicComponentFileId: dynamicComponentFileActivated.id,
          version: flags.version,
          versionIncrement
        }
        try {
          await this.publishExtensionVersion(bodyPublishExtensionVersion, token)
        } catch (error) {
          if (error.response.status === 422) {
            this.error('Intended version is less than or equal to last version')
          } else {
            this.error(error.response)
          }
          process.exit(0)
        }
        this.success('New version is published with success')
      }
    } catch (error) {
      console.log(chalk.red(`${error}`))
    }
  }
  async confirmVersion (version, date) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    return new Promise((resolve, reject) => {
      rl.question(`Publish version ${chalk.blue(version)} created at ${chalk.blue(moment(date).format('LLLL'))} on the marketplace? Yes/No `, answer => {
        rl.close()
        if (isYes(answer)) {
          resolve(version)
        } else {
          console.log(chalk.red('operation canceled'))
          resolve(false)
        }
      })
    })
  }
  commandSintaxeValid (flags) {
    return Object.keys(flags).length < 2
  }
  async publishExtensionVersion (body, token) {
    await api.axios.post(
      `/${credentials.institution}/marketplace/extensions/publish-version`,
      body,
      { headers: { Authorization: `Bearer ${token}` } }
    )
  }
  async publishExtension (body, token) {
    await api.axios.post(
      `/${credentials.institution}/marketplace/extensions`,
      body,
      { headers: { Authorization: `Bearer ${token}` } }
    )
  }
  async getResponseFromUser (requestText, responseDefault) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    return new Promise(resolve => {
      rl.question(requestText, answer => {
        rl.close()
        if (answer) { resolve(answer) } else resolve(responseDefault)
      })
    })
  }
  async confirmQuestion (requestText, responseText) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    return new Promise((resolve, reject) => {
      rl.question(requestText, answer => {
        rl.close()
        if (isYes(answer)) {
          resolve(answer)
        } else {
          console.log(chalk.red('operation canceled'))
          resolve(false)
        }
      })
    })
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

module.exports = PublishCommand
