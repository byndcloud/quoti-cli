const express = require('express')
const app = express()
const { exec, spawn } = require('child_process');
const port = 1235

app.get('/sendmodifications', async (req, res) => {
    await sendExtensionsFile()
    res.status(200).send()
})

app.listen(port, async () => {
    console.log(`Example app listening at http://localhost:${port}`)
    await silentLogin()
    exec('nodemon -e vue index.js', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(stdout);
    })
})

var firebase = require("firebase/app");
const fs = require('fs');
const readline = require("readline");


require("firebase/auth");
require("firebase/firestore");
const md5 = require("md5");
const axios = require("axios");
const cliSelect = require('cli-select');
const { Storage } = require('@google-cloud/storage');
// Instantiate a storage client
const storage = new Storage();
const bucket = storage.bucket('dynamic-components');





var institution = null
var extensionId = null
var extensionIdStorage = null


var firebaseConfig = {
    apiKey: "AIzaSyDiicN8xT3lImJY0hfcobQfRLit90zMw8U",
    authDomain: "beyond-quoti.firebaseapp.com",
    databaseURL: "https://beyond-quoti.firebaseio.com",
    projectId: "beyond-quoti",
    storageBucket: "beyond-quoti.appspot.com",
    messagingSenderId: "40570897776",
    appId: "1:40570897776:web:4f02b3cf8eba78ed763bb5"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var Args = process.argv.slice(2);
console.log('Args: ', Args);


async function silentLogin(callsetup = false) {
    let rawdata = null
    let extensionValue = null
    if (!fs.existsSync('credentials.json')) {
        console.log('Faça o login!!! npm run login')
    } else {
        try {
            rawdata = fs.readFileSync('credentials.json');
            const userData = (JSON.parse(rawdata)).user
            extensionId = (JSON.parse(rawdata)).extensionId
            extensionValue = (JSON.parse(rawdata)).extensionValue
            extensionIdStorage = (JSON.parse(rawdata)).extensionStorageId

            const user = new firebase.User(userData, userData.stsTokenManager, userData)
            await firebase.auth().updateCurrentUser(user)
            institution = (JSON.parse(rawdata)).institution
        } catch (error) {
            console.log('erro ao carregar credenciais')
        }
    }
    if (callsetup) {
        return extensionId
    }
    else if (!extensionId) {
        console.log("\n\n\tVocê já estar logado. Agora execute npm run setup para selecionar uma extensão")
        process.exit(0)
    } else {
        console.log('Você está trabalhando na extensão ', extensionValue)
    }

}
async function getUploadFileName() {
    return encodeURI(`${institution}/dev/idExtension${extensionId}.vue`)
}
async function sendExtensionsFile() {
    var debug = Args.findIndex(a => a == 'debug') > -1 ? true : false
    console.log("Chamando a API")
    // Create a new blob in the bucket and upload the file data.
    // Uploads a local file to the bucket
    let filename = await getUploadFileName()
    if (debug) console.time("Upload")
    await bucket.upload('./index.vue', {
        destination: filename,
        gzip: true,
        metadata: {
            cacheControl: 'public, max-age=0',
        },
    });
    if (debug) console.timeEnd("Upload")
    if (debug) console.time("Firebase")
    await firebase.firestore().collection('dynamicComponents').doc(extensionIdStorage).update({
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    if (debug) console.timeEnd("Firebase")
    console.log(`${filename} uploaded to ${'dynamic-components'}.`);
    // [END storage_upload_file]
}
