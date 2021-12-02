const Auth = require('../services/auth')
module.exports = async function (options) {
  const command = options.Command
  if (command.id !== 'logout') {
    await Auth.silentLogin()
  }
}
