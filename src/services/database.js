const { firebase } = require('../config/firebase')
const { slugify } = require('../utils/index')
const ora = require('ora')
const fs = require('fs')
const path = require('path')
const api = require('../config/axios')
const credentials = require('../config/credentials')
const Logger = require('../config/logger')
const set = require('lodash/set')

class DatabaseService {
  constructor ({ spinnerOptions } = {}) {
    this.logger = Logger.child({
      tag: 'service/database'
    })
    this.spinner = ora(
      spinnerOptions || {
        spinner: 'arrow3',
        color: 'yellow'
      }
    )
  }

  /**
   *
   * @param {object} tables
   * @param {object} tables.table
   * @param {object} tables.field
   * @param {*} token
   */
  async upsertTable (tables, token) {
    const remoteTables = await this.getRemoteTables(token)
    const tablesForCreation = []
    const tablesForUpdate = []
    for (const table of tables) {
      const remoteTable = remoteTables.find(
        rt => rt.name === slugify(table?.info?.name, '_')
      )
      if (remoteTable) {
        tablesForUpdate.push({ tableId: remoteTable.id, ...table })
      } else {
        tablesForCreation.push(table)
      }
    }
    const hasTableForUpdate = tablesForUpdate.length > 0
    const hasTableForCreation = tablesForCreation.length > 0

    if (hasTableForUpdate) {
      await api.axios.put(
        `/${credentials.institution}/apps/tables/bulk`,
        tablesForUpdate,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
    }
    if (hasTableForCreation) {
      await api.axios.post(
        `/${credentials.institution}/apps/tables/bulk`,
        tablesForCreation,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
    }
  }

  async getRemoteTables (token) {
    const { data } = await api.axios.get(
      `/${credentials.institution}/tables?limit=9999999999`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    return data
  }

  async syncDatabases ({ modelsDirectory }) {
    const cwd = path.resolve(modelsDirectory)
    const cwdRelative = path.relative('./', cwd)
    if (!fs.existsSync(cwd)) {
      throw new Error(
        `Não existe o diretório ${path.relative('./', cwdRelative)}`
      )
    }
    const modelsPaths = fs.readdirSync(path.resolve(cwd))
    const token = await firebase.auth().currentUser.getIdToken()
    const tables = []
    for (const modelPathName of modelsPaths) {
      const modelPath = `${path.join(cwd, modelPathName)}`
      const modelPathRelative = path.relative('./', modelPath)
      let model
      try {
        const Database = require(modelPath)
        model = new Database()
      } catch (error) {
        throw new Error(
          `Erro nas configurações do arquivo ${modelPathRelative}`
        )
      }
      set(
        model,
        'info.name',
        slugify(model?.info?.name || model.constructor.name, '_')
      )
      tables.push(model)
    }
    await this.upsertTable(tables, token)
    this.logger.success(
      `Configurou databases presente no diretório ${cwdRelative}`
    )
  }
}

module.exports = DatabaseService
