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
        'Endereço relativo a pasta ./src/pages onde será salvo sua extensão. Caso não exista a pasta ./src/pages o endereço fica relativo a raiz do projeto',
      default: './src/models'
    }
  ]
}

module.exports = CreateDatabaseCommand
