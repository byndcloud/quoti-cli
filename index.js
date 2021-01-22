var firebase = require("firebase/app");
const fs = require('fs');
const readline = require("readline");


require("firebase/auth");
require("firebase/firestore");
const md5 = require("md5");
const axios = require("axios");
const cliSelect = require('cli-select');
const {Storage} = require('@google-cloud/storage');
// Instantiate a storage client
const storage = new Storage();
const bucket = storage.bucket('dynamic-components');





var institution = null
var _token = null
var extensionId = null


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

async function insertIntitution(){
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    return new Promise((resolve, reject) => {
        rl.question('Qual sua instituição? ',  (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}
async function insertToken(){
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    return new Promise((resolve, reject) => {
        rl.question('Informe o seu token de login ',  (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function login() {
    institution = await insertIntitution()
    let customToken = await insertToken()
    const authFirebase = await app.auth().signInWithCustomToken(customToken)
    const token = await firebase.auth().currentUser.getIdToken()
    let data = JSON.stringify({institution:institution, user:authFirebase.user.toJSON()});
    _token = token
    fs.writeFileSync('credentials.json', data);
}

async function silentLogin(callsetup = false) {
    let rawdata = null
    let extensionValue = null
    if (!fs.existsSync('credentials.json')) {
        console.log('fazendo login')
        await login()
    }else{
        try {
            rawdata = fs.readFileSync('credentials.json');
            const userData = (JSON.parse(rawdata)).user
            extensionId = (JSON.parse(rawdata)).extensionId
            extensionValue = (JSON.parse(rawdata)).extensionValue

            const user = new firebase.User(userData, userData.stsTokenManager, userData)
            await firebase.auth().updateCurrentUser(user)
            const token = await firebase.auth().currentUser.getIdToken()
            institution = (JSON.parse(rawdata)).institution
            _token = token
        } catch (error) {
            console.log('erro ao carregar credenciais')
        }
    }
    if(callsetup){
        return extensionId
    }
    else if(!extensionId ){
        console.log("Você já está logado. Agora execute npm run setup para selecionar uma extensão")
        process.exit(0)
    }else{
        console.log('Você está trabalhando na extensão ', extensionValue)
    }
    
}
async function getUploadFileName() {
    return encodeURI(`${institution}/dev/idExtension${extensionId}.vue`)
}
async function sendExtensionsFile() {
    var debug = Args.findIndex(a => a == 'debug') > -1 ? true : false
    console.log("Chamando a API")
    if(debug) console.time("Login")
    await silentLogin()
    if(debug) console.timeEnd("Login")
    // Create a new blob in the bucket and upload the file data.
    // Uploads a local file to the bucket
    let filename = await getUploadFileName()
    if(debug) console.time("Upload")
    await bucket.upload('./index.vue', {
        destination: filename,
        gzip: true,
        metadata: {
          cacheControl: 'public, max-age=0',
        },  
      });
    if(debug) console.timeEnd("Upload")
    const id = 'DdrMeO03Zd7tgDwFE0f7'
    if(debug) console.time("Firebase")
    await firebase.firestore().collection('dynamicComponents').doc(id).update({
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    if(debug) console.timeEnd("Firebase")
    console.log(`${filename} uploaded to ${'dynamic-components'}.`);
    // [END storage_upload_file]
}
async function listExtensions() {
    const result = await axios.get(`https://api.develop.minhaescola.app/api/v1/${institution}/dynamic-components/`,
    {headers:{Authorization:`Bearer ${_token}`}})
    // console.log(result.data)
    return result.data
}
async function setup() {
    await silentLogin('setup')
    
    
    let extensions = await listExtensions()
    rawdata = fs.readFileSync('credentials.json');
    let credenciais = (JSON.parse(rawdata))
    let mappedExt = extensions.map(el =>{
        return el.title
    })
    let choose = await cliSelect({values:mappedExt})
    credenciais.extensionId = extensions[choose.id].id
    credenciais.extensionValue = choose.value
    fs.writeFileSync('credentials.json', JSON.stringify(credenciais));
    console.log("Agora execure npm run serve")

}
(function () {
    if(Args[0] === "setup")
        setup()
    else if (Args[0] === "atualizar")
        login()
    else if (Args[0] === "login")
        login()
    else if (Args[0] === "silent-login")
        silentLogin()
    else 
        sendExtensionsFile()
        
})()