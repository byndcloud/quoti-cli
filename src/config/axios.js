const { default: axios } = require('axios')
const dotenv = require('dotenv')
dotenv.config()

class Api {
  constructor () {
    this.axios = null
    this.create()
  }
  async create () {
    this.axios = axios.create({
      baseURL: process.env.API_BASE_URL || `https://api.develop.minhaescola.app/api/v1/`
    //   baseURL: `https://api.develop.minhaescola.app/api/v1/`
    })
  }
}
module.exports = new Api()
