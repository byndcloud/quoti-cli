const { default: Command } = require('@oclif/command')
const Logger = require('./config/logger')

module.exports = class BaseCommand extends Command {
  constructor () {
    super(...arguments)
    const commandName = this.id
    this.logger = Logger.child({
      tag: `command/${commandName}`
    })
  }

  async init () {
    try {
      const { flags } = this.parse(this.constructor)
      this.flags = flags
    } catch (error) {
      this.logger.error(error)
    }
  }

  async catch (err) {
    this.logger.error(err)
    const oclifHandler = require('@oclif/errors/handle')
    err.code = 'EEXIT'
    return oclifHandler(err)
  }
}
