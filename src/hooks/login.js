const path = require('path')
const Auth = require('../services/auth')
const pathEnv = path.join(__dirname, '../../.env')
require('dotenv').config({ path: pathEnv })

module.exports = async function (options) {
  const command = options.Command
  if (command.id !== 'logout') {
    await Auth.silentLogin()
  }
}
