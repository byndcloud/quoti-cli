const chalk = require('chalk')
const JSONManager = require('./JSONManager')
const fs = require('fs')
const path = require('path')

const home = require('os').homedir()
const baseConfigDirectory = path.join(home, '.config/quoti-cli/')

try {
  fs.mkdirSync(baseConfigDirectory, { recursive: true })
} catch (e) {
  console.error(
    chalk.red(`Couldn't create folder at ${baseConfigDirectory}, message:`)
  )
  console.error(chalk.red(e))
}

module.exports = new JSONManager(
  path.join(baseConfigDirectory, 'credentials.json')
)
