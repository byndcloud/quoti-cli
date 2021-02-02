const chalk = require('chalk')
const JSONManager = require('./JSONManager')
const fs = require('fs')

try {
  fs.mkdirSync('~/.config/quoti-cli/', { recursive: true })
} catch (e) {
  console.error(
    chalk.red("Couldn't create folder at ~/.config/quoti-cli/, message:")
  )
  console.error(chalk.red(e))
}

module.exports = new JSONManager('~/.config/quoti-cli/credentials.json')
