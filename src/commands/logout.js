const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')

class LogoutCommand extends Command {
  async run () {
    try {
      const loggedOut = credentials.delete()
      if (loggedOut) {
        this.log(chalk.blue('Logged out!'))
      } else {
        this.log(chalk.blue('Already logged out.'))
      }
    } catch (error) {
      this.error(chalk.red(error))
    }
  }
}
LogoutCommand.description = `Logout from the current organization`

module.exports = LogoutCommand
