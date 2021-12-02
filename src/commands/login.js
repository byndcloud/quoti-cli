const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const { default: chalk } = require('chalk')

class LoginCommand extends Command {
  async run () {
    // The login itself is done in the hook so just display a message
    if (credentials.exists()) {
      this.log(chalk.blue('Logged in!'))
    } else {
      this.log(chalk.red('Log in error:'))
    }
  }
}
LoginCommand.description = `Logout from the current organization`

module.exports = LoginCommand
