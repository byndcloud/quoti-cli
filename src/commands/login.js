const credentials = require('../config/credentials')
const { default: Command } = require('@oclif/command')

const Logger = require('../config/logger')
class LoginCommand extends Command {
  constructor () {
    super(...arguments)
    this.logger = Logger.child({
      tag: 'command/login'
    })
  }
  async run () {
    // The login itself is done in the hook so just display a message
    if (credentials.exists()) {
      this.logger.success('Usuário com login realizado')
    } else {
      this.logger.red('Erro no login')
    }
  }
}
LoginCommand.description = `Realiza login em uma organização do Quoti`

module.exports = LoginCommand
