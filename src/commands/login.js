const credentials = require('../config/credentials')
const Command = require('../base.js')
const Auth = require('../services/auth')
const { flags } = require('@oclif/command')
class LoginCommand extends Command {
  async run () {
    const { alreadyLoggedIn } = await Auth.silentLogin({
      force: this.flags.force
    })
    if (alreadyLoggedIn) {
      this.logger.info('Você já está logado! Veja os detalhes:\n')

      this.logger.info(`Organização: ${credentials.institution}`)
      this.logger.info(`Usuário: ${credentials.user?.displayName}`)
      this.logger.info(`Email: ${credentials.user?.email}`)
      if (credentials.devSessionId) {
        this.logger.info(
          `ID da sua sessão de desenvolvimento: ${credentials.devSessionId}`
        )
      }

      this.logger.info('\nAlgumas opções de o que fazer agora:\n')
      this.logger.info(
        '1. Execute "qt login -f" para que seja ignorada sessão atual e seja forçado o login com um novo usuário'
      )
      this.logger.info(
        '2. Executar "qt logout" para sair da conta atual e ficar desconectado'
      )

      this.logger.info('3. Só continuar com o login atual')
    } else {
      this.logger.success('Login realizado com sucesso')
    }
  }

  static flags = {
    force: flags.boolean({
      char: 'f',
      description: 'Força o login em uma nova conta'
    })
  }

  static description = 'Realiza login em uma organização do Quoti'
}

module.exports = LoginCommand
