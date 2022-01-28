const credentials = require('../config/credentials')
const { app } = require('../config/firebase')
const { firebase } = require('../config/firebase')
const logo = require('./logo')
const chalk = require('chalk')
const inquirer = require('inquirer')

class Auth {
  async login () {
    console.log(chalk`${logo}`)
    const institution = await this.insertOrgSLug()
    const customToken = await this.insertToken()
    const authFirebase = await app.auth().signInWithCustomToken(customToken)
    const data = {
      institution: institution,
      user: authFirebase.user.toJSON()
    }
    credentials.save(data)
  }

  async insertOrgSLug () {
    const { inputOrgSlug } = await inquirer.prompt([
      {
        name: 'inputOrgSlug',
        message: 'Qual sua organização',
        type: 'input'
      }
    ])
    return inputOrgSlug
  }

  async insertToken () {
    const { inputToken } = await inquirer.prompt([
      {
        name: 'inputToken',
        message:
          'Informe seu token de login',
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

  async silentLogin () {
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
