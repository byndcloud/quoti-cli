const {  app } = require('./firebase')

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


module.exports = async function () {
  institution = await insertIntitution()
  let customToken = await insertToken()
  const authFirebase = await app.auth().signInWithCustomToken(customToken)
  let data = JSON.stringify({ institution: institution, user: authFirebase.user.toJSON() });
  fs.writeFileSync('credentials.json', data);
}