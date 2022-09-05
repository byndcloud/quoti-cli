const Command = require('../../base.js')
const DatabaseService = require('../../services/database')
const Logger = require('../../config/logger')

class CreateDatabaseCommand extends Command {
  constructor () {
    super(...arguments)
    const commandName = this.id
    this.logger = Logger.child({
      tag: `command/${commandName}`
    })
  }

  init () {
    super.init({ injectProjectRoot: true })
  }

  async run () {
    const databaseService = new DatabaseService()
    await databaseService.syncDatabases({
      modelsDirectory: this.args.modelsDirectory
    })
  }

  static description =
    'Cria todos os modelos presentes na pasta especificada pelo arg modelDirectory'

  static args = [
    {
      name: 'modelsDirectory',
      description:
        'Endereço onde será salvo sua extensão. (Endereço relativo a pasta ./src/pages. Caso ./src/pages não exista o endereço fica relativo a raiz do projeto)',
      default: './src/models'
    }
  ]
}

module.exports = CreateDatabaseCommand
