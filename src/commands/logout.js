const credentials = require('../config/credentials')
const Command = require('../base.js')

class LogoutCommand extends Command {
  async run () {
    const loggedOut = credentials.delete()
    if (loggedOut) {
      this.logger.success('Usuário deslogado')
    } else {
      this.logger.success('Usuário já realizou logout.')
    }
  }
}
LogoutCommand.description = 'Logout from the current organization'

module.exports = LogoutCommand
