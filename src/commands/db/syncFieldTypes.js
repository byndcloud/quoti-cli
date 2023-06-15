const Command = require('../../base.js')
const FieldTypeService = require('../../services/fieldType')

class SyncFieldTypeCommand extends Command {
  async run () {
    const fieldTypeService = new FieldTypeService()
    await fieldTypeService.syncFieldTypes()
  }

  static description =
    'Sincroniza os tipos de campos disponíveis para databases presentes na organização'
}

module.exports = SyncFieldTypeCommand
