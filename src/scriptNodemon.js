// TODO: modificar a porta dinamicamente
console.log('arquivo mudou')
const axios = require('axios')
async function sendExtensionsFile () {
  await axios.get(`http://localhost:1235/sendmodifications`)
}
sendExtensionsFile()
