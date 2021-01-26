
const fs = require('fs');
const readline = require("readline");

const md5 = require("md5");
const axios = require("axios");

var institution = null
var extensionId = null
var extensionIdStorage = null

var Args = process.argv.slice(2);
console.log('Args: ', Args);

const silentLogin = require('./options/auth')
const login = require('./options/login')
const setup = require('./options/setup')
const deploy = require('./options/deploy')

async function sendExtensionsFile() {
    const result = await axios.get(`http://localhost:1235/sendmodifications`)
}

; (function () {
    if (Args[0] === "setup")
        setup()
    else if (Args[0] === "login")
        login()
    else if (Args[0] === "silent-login")
        silentLogin()
    else if (Args[0] === "deploy")
        deploy()
    else
        sendExtensionsFile()
})()