const { firebase } = require('../config/firebase')
const { slugify } = require('../utils/index')
const ora = require('ora')
const fs = require('fs')
const path = require('path')
const api = require('../config/axios')
const credentials = require('../config/credentials')
const Logger = require('../config/logger')
const { InvalidFieldTypeError } = require('../utils/errorClasses')

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
   * @param {string} token
   */
  async createForm (name, token) {
    if (!token) {
      token = await firebase.auth().currentUser.getIdToken()
    }
    const { data } = await api.axios.post(
      `/${credentials.institution}/forms/`,
      { name: `Formulário de dados adicionais ${name}` },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return data.created
  }

  /**
   *
   * @param {object} data
   * @param {number} data.formId
   * @param {string} data.name
   * @param {string} token
   * @returns
   */
  async createTable (data, token) {
    if (!token) {
      token = await firebase.auth().currentUser.getIdToken()
    }
    const body = Object.assign(data, { name: slugify(data.name) })
    const { data: tableCreated } = await api.axios.post(
      `/${credentials.institution}/tables/`,
      body,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return tableCreated
  }

  /**
   *
   * @param {object} fields
   * @param {string} fields.name
   * @param {string} fields.title
   * @param {number} formId
   * @param {string} token
   */
  async syncFields (fields, formId, token) {
    const { data: form } = await api.axios.get(
      `/${credentials.institution}/forms/${formId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!form) {
      throw new Error('Formulário não encontrado')
    }

    let position = 0
    for (const fieldKey in fields) {
      const field = fields[fieldKey]
      if (!field.type) {
        throw new InvalidFieldTypeError({ fieldTypeName: fieldKey })
      }
      const fieldName = field.name || fieldKey
      const remoteField = form.items.find(i => i.name === fieldName)
      const body = {
        correctAnswer: [],
        name: fieldName,
        type: field.type,
        required: false,
        id: remoteField?.id,
        scorePoints: 10,
        position,
        fieldTypeId: field.type.id,
        field_type_id: field.type.id,
        minSelectableQuantity: 0,
        maxSelectableQuantity: 1,
        selectableValues: field.selectableValues || [],
        title: field.title,
        formId
      }
      if (remoteField) {
        await api.axios.put(
          `/${credentials.institution}/form/fields/${remoteField.id}`,
          body,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else {
        await api.axios.post(`/${credentials.institution}/form/fields`, body, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      position += 1
    }
    // delete fields not used
    for (const remoteField of form.items) {
      let isFieldRemoved = true
      for (const fieldKey in fields) {
        if (
          remoteField.name === fields[fieldKey].name ||
          remoteField.name === fieldKey
        ) {
          isFieldRemoved = false
          break
        }
      }
      if (isFieldRemoved) {
        await api.axios.delete(
          `/${credentials.institution}/form/fields/${remoteField.id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
      }
    }
  }

  async createDatabase (name, token) {
    const formCreated = await this.createForm(name, token)
    const dataTable = { name, formId: formCreated.id }
    const tableCreated = await this.createTable(dataTable, token)
    return tableCreated
  }

  async getRemoteTables (token) {
    const { data } = await api.axios.get(`/${credentials.institution}/tables`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  }

  async syncDatabases ({ modelsDirectory }) {
    const cwd = path.resolve(modelsDirectory)
    if (!fs.existsSync(cwd)) {
      throw new Error(`Não existe o diretório ${path.relative('./', cwd)}`)
    }
    const modelsPaths = fs.readdirSync(path.resolve(cwd))
    const token = await firebase.auth().currentUser.getIdToken()
    const remoteModels = await this.getRemoteTables(token)
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

      const modelName = slugify(model.name || model.constructor.name)
      let remoteModel = remoteModels.find(rm => rm.name === modelName)
      if (!remoteModel) {
        remoteModel = await this.createDatabase(modelName, token)
      }
      try {
        await this.syncFields(model.columns, remoteModel.formId, token)
      } catch (error) {
        if (error instanceof InvalidFieldTypeError) {
          throw new Error(
            `FieldType ${error.fieldTypeName} invalido encontrado no model ${modelPathRelative}`
          )
        }
      }

      this.logger.success(
        `Configurou database ${modelName} presente no arquivo ${modelPathRelative}`
      )
    }
  }
}

module.exports = DatabaseService
