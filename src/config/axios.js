const { default: axios } = require('axios')
const qs = require('qs')
const https = require('https')

class Api {
  constructor () {
    this.axios = null
    this.create()
  }

  async create () {
    const config = {
      // note: Essa linha permite realizar requisições para o quoti api usando apenas
      // axios.get(url, params: {}), sem precisar passar o objeto para string
      paramsSerializer: params => {
        return qs.stringify(params)
      }
    }
    if (process.env.API_BASE_URL) {
      config.httpsAgent = new https.Agent({
        rejectUnauthorized: false
      })
      config.baseURL = process.env.API_BASE_URL
    } else {
      config.baseURL = 'https://api.minhafaculdade.app/api/v1/'
    }
    this.axios = axios.create(config)
  }
}
module.exports = new Api()
