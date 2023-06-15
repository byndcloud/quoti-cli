const { default: Command } = require('@oclif/command')
const ora = require('ora')
const utils = require('./utils')
const Logger = require('./config/logger')

module.exports = class BaseCommand extends Command {
  constructor () {
    super(...arguments)
    const commandName = this.id
    this.logger = Logger.child({
      tag: `command/${commandName}`
    })
  }

  setupSpinner () {
    this.spinnerOptions = {
      spinner: 'arrow3',
      color: 'yellow'
    }
    this.spinner = ora(this.spinnerOptions)
  }

  async init ({
    injectProjectRoot = false,
    injectExtensionsPaths = false
  } = {}) {
    try {
      const { flags, args } = this.parse(this.constructor)
      this.flags = flags
      this.args = args

      this.setupSpinner()

      if (injectProjectRoot) {
        this.projectRoot = utils.getProjectRootPath()
      }

      if (injectExtensionsPaths) {
        this.extensionsPaths = utils.listExtensionsPaths(this.projectRoot)
      }
    } catch (error) {
      this.logger.error(error)
    }
  }

  async catch (err) {
    if (err.isAxiosError) {
      err.message = err?.response.data
    }
    this.logger.error(err)
    if (process.env.NODE_ENV === 'test') {
      throw err
    } else {
      const oclifHandler = require('@oclif/errors/handle')
      err.code = 'EEXIT'
      return oclifHandler(err)
    }
  }
}
