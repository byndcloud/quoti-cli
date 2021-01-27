const Auth = require("../services/auth");

module.exports = async function (options) {
  console.log(`Login hook started`)
  await Auth.silentLogin();
  console.log(`Login hook finished`)
};
