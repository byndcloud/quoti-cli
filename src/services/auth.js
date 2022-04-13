const credentials = require('../config/credentials')
const { app } = require('../config/firebase')
const { firebase } = require('../config/firebase')
const logo = require('./logo')
const chalk = require('chalk')
const inquirer = require('inquirer')
const api = require('../config/axios')
const Logger = require('../config/logger')

class Auth {
  async login() {
    console.log(chalk`${logo}`)
    const institution = await this.insertOrgSLug()
    const customToken = await this.insertToken()
    try {
      const authFirebase = await app.auth().signInWithCustomToken(customToken)
      const token = await firebase.auth().currentUser.getIdToken()
      const data = {
        institution: institution,
        user: authFirebase.user.toJSON()
      }
      await api.axios.get(`/${data.institution}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      credentials.save(data)
    } catch (e) {
      if (e?.response?.status === 406) {
        Logger.error(
          'Falha ao realizar login. Verifique se escreveu o nome da organização corretamente'
        )
      } else {
        Logger.error('Falha ao realizar login.')
      }
      process.exit(0)
    }
  }

  async insertOrgSLug() {
    const { inputOrgSlug } = await inquirer.prompt([
      {
        name: 'inputOrgSlug',
        message: 'Qual sua organização',
        type: 'input'
      }
    ])
    return inputOrgSlug
  }

  async insertToken() {
    const { inputToken } = await inquirer.prompt([
      {
        name: 'inputToken',
        message: 'Informe seu token de login',
        type: 'input',
        transformer: input => {
          if (!input) {
            return ''
          } else {
            return '********...'
          }
        }
      }
    ])
    return inputToken
  }

  async silentLogin() {
    if (!credentials.exists()) {
      await this.login()
      credentials.load()
    } else {
      credentials.load()
      try {
        const userData = credentials.user
        const user = new firebase.User(
          userData,
          userData.stsTokenManager,
          userData
        )
        await firebase.auth().updateCurrentUser(user)
      } catch (error) {
        this.logger.error(error)
        this.logger.error('Erro ao carregar credenciais')
      }
    }
  }
}

module.exports = new Auth()
