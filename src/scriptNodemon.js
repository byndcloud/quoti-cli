// TODO: modificar a porta dinamicamente
const axios = require('axios')
async function sendExtensionsFile () {
  axios.put(`http://localhost:1235/sendmodifications`)
}
sendExtensionsFile()
