const { default: axios } = require('axios')
const https = require('https')

class Api {
  constructor () {
    this.axios = null
    this.create()
  }

  async create () {
    if (process.env.API_BASE_URL) {
      this.axios = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        baseURL: process.env.API_BASE_URL
      })
    } else {
      this.axios = axios.create({
        baseURL: 'https://api.minhafaculdade.app/api/v1/'
      })
    }
  }
}
module.exports = new Api()
