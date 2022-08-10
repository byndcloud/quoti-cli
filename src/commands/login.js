const credentials = require('../config/credentials')
const Command = require('../base.js')
const Auth = require('../services/auth')
class LoginCommand extends Command {
  async run () {
    const { previouslyLogger } = await Auth.silentLogin()
    if (previouslyLogger) {
      this.logger.info('Você já realizou login anteriormente.\n')

      this.logger.info(`Organização: ${credentials.institution}`)
      this.logger.info(`Usuário: ${credentials.user?.displayName}`)
      this.logger.info(`Email: ${credentials.user?.email}`)
      if (credentials.devSessionId) {
        this.logger.info(`sessionId: ${credentials.devSessionId}`)
      }

      this.logger.info(
        '\n"qt login -f" : Para que seja ignorada sessão atual e seja forçado o login em uma nova conta'
      )
      this.logger.info(
        '"qt logout" : Torna possível sair da conta atual e ficar desconectado'
      )
    } else {
      this.logger.success('Login realizado com sucesso')
    }
  }

  static description = 'Realiza login em uma organização do Quoti'
}

module.exports = LoginCommand
