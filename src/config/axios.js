const { default: axios } = require('axios')
const dotenv = require('dotenv')
dotenv.config()

class Api {
  constructor () {
    this.axios = null
    this.create()
  }
  async create () {
    console.log(process.env.API_BASE_URL)
    this.axios = axios.create({
      baseURL: process.env.API_BASE_URL || `https://api.minhafaculdade.app/api/v1/`
      // baseURL: process.env.API_BASE_URL || `https://api.develop.minhaescola.app/api/v1/`
    //   baseURL: `https://api.develop.minhaescola.app/api/v1/`
    // https://api.minhafaculdade.app/api/v1/
    })
  }
}
module.exports = new Api()
