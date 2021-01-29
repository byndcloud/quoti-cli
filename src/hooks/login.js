const Auth = require('../services/auth')

module.exports = async function (options) {
  await Auth.silentLogin()
}
