const credentials = require('../config/credentials')
const Command = require('../base.js')

class LoginCommand extends Command {
  async run () {
    // The login itself is done in the hook so just display a message
    if (credentials.exists()) {
      this.logger.success('Usuário com login realizado')
    } else {
      this.logger.error('Erro no login')
    }
  }
}
LoginCommand.description = 'Realiza login em uma organização do Quoti'

module.exports = LoginCommand
