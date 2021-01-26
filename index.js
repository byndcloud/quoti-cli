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
const app = firebase.initializeApp(firebaseConfig);

var Args = process.argv.slice(2);
console.log('Args: ', Args);

async function insertIntitution() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve, reject) => {
        rl.question('Qual sua instituição? ', (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}
async function insertToken() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve, reject) => {
        rl.question('Informe o seu token de login ', (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function login() {
    institution = await insertIntitution()
    let customToken = await insertToken()
    const authFirebase = await app.auth().signInWithCustomToken(customToken)
    let data = JSON.stringify({ institution: institution, user: authFirebase.user.toJSON() });
    fs.writeFileSync('credentials.json', data);
}

async function silentLogin(callsetup = false) {
    let rawdata = null
    let extensionValue = null
    if (!fs.existsSync('credentials.json')) {
        console.log('fazendo login')
        await login()
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
async function sendExtensionsFile() {
    const result = await axios.get(`http://localhost:1235/sendmodifications`)
}
async function listExtensions() {
    let token = await firebase.auth().currentUser.getIdToken()
    const result = await axios.get(`https://api.develop.minhaescola.app/api/v1/${institution}/dynamic-components/`,
        { headers: { Authorization: `Bearer ${token}` } })
    // console.log(result.data)
    return result.data
}
async function getUploadFileNameDeploy(currentTime) {
    return encodeURI(`${institution}/${md5(currentTime)}.vue`)
}
async function setup() {
    await silentLogin('setup')
    let extensions = await listExtensions()
    rawdata = fs.readFileSync('credentials.json');
    let credenciais = (JSON.parse(rawdata))
    let mappedExt = extensions.map(el => {
        return el.title
    })
    console.log(extensions)
    let choose = await cliSelect({ values: mappedExt })
    credenciais.extensionId = extensions[choose.id].id
    credenciais.extensionStorageId = extensions[choose.id].storeId
    credenciais.extensionValue = choose.value
    console.log(credenciais)
    fs.writeFileSync('credentials.json', JSON.stringify(credenciais));
    console.log("\n\n\t\tAgora execure npm run serve")

}
async function deploy() {
    console.log('deploy na aplicação')
    await silentLogin('setup')
    const currentTime = await firebase.firestore.Timestamp.now().toMillis()
    console.log(currentTime)
    let filename = await getUploadFileNameDeploy('asdsad')
    console.log(filename);
    let url = `https://storage.cloud.google.com/dynamic-components/${filename}`
    await bucket.upload('./index.vue', {
        destination: filename,
        gzip: true,
        metadata: {
            cacheControl: 'public, max-age=0',
        },
    });
    let token = await firebase.auth().currentUser.getIdToken()
    const result = await axios.put(
        `http://localhost:8081/api/v1/${institution}/dynamic-components/${extensionId}`,
        {
            url: url,
            version: currentTime,
            fileVuePrefix: filename,
            id: extensionId
        },
        { headers: { Authorization: `Bearer ${token}` } })
    console.log(result)
    await firebase.firestore().collection('dynamicComponents').doc(extensionIdStorage).update({
        updatedAtToDeploy: currentTime
    })
    console.log('Deploy feito')
    process.exit(0)

}
(function () {
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