const axios = require('axios')

var Args = process.argv.slice(2)
console.log('Args: ', Args)

const deploy = require('./options/deploy')
const { setExtension } = require('./options/setup')
const { silentLogin } = require('./options/auth')

async function sendExtensionsFile () {
  await axios.get(`http://localhost:1235/sendmodifications`)
}

(async function () {
  // TODO: Add option to choose extension
  await silentLogin()
  if (Args[0] === 'init') {
    await setExtension()
  } else if (Args[0] === 'set-extension') {
    await setExtension()
  } else if (Args[0] === 'deploy') {
    await deploy()
  } else {
    await sendExtensionsFile()
  }
})()
