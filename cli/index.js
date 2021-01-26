const fs = require('fs')
const readline = require('readline')

const md5 = require('md5')
const axios = require('axios')

var institution = null
var extensionId = null
var extensionIdStorage = null

var Args = process.argv.slice(2)
console.log('Args: ', Args)

const deploy = require('./options/deploy')
const { setExtension } = require('./options/setup')
const { silentLogin } = require('./options/auth')

async function sendExtensionsFile () {
  const result = await axios.get(`http://localhost:1235/sendmodifications`)
}

(async function () {
  // TODO: Add option to choose extension
  if (Args[0] === 'init') {
    await silentLogin(true)
    // await setExtension()
  } else if (Args[0] === 'set-extension') {
    setExtension()
  } else if (Args[0] === 'deploy') {
    deploy()
  } else {
    sendExtensionsFile()
  }
})()
