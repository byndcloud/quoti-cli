const Auth = require('../services/auth')

module.exports = async function (options) {
  const command = options.Command
  if (
    command.id !== 'login' &&
    command.id !== 'logout' &&
    command.id !== 'autocomplete'
  ) {
    await Auth.silentLogin()
  }
}
