const { default: Command, flags: Flags } = require('@oclif/command')
const Logger = require('./config/logger')

module.exports = class extends Command {
  constructor(){
    super(...arguments)
    const commandName = this.id
    this.logger = Logger.child({
      tag: `command/${commandName}`
    })
  }

  async catch(err) {
    this.logger.error(err);
    const oclifHandler = require('@oclif/errors/handle');
    return oclifHandler({err: 'SIGINT'});
  }
}