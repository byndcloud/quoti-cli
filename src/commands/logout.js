const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const Logger = require('../config/logger')

class LogoutCommand extends Command {
  constructor () {
    super(...arguments)
    this.logger = Logger.child({
      tag: 'command/download-current-version'
    })
  }
  async run () {
    try {
      const loggedOut = credentials.delete()
      if (loggedOut) {
        this.logger.success('Usuário deslogado')
      } else {
        this.logger.success('Usuário já realizou logout.')
      }
    } catch (error) {
      this.logger.error(error)
    }
  }
}
LogoutCommand.description = `Logout from the current organization`

module.exports = LogoutCommand
