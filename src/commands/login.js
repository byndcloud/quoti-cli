const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')
const chalk = require('chalk')

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
LoginCommand.description = `Login to a Quoti organization`

module.exports = LoginCommand
