const { firebase } = require('../config/firebase')
const ora = require('ora')
const fs = require('fs')
const path = require('path')
const api = require('../config/axios')
const credentials = require('../config/credentials')
const Logger = require('../config/logger')
class FieldTypeService {
  constructor ({ spinnerOptions } = {}) {
    this.logger = Logger.child({
      tag: 'service/fieldType'
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
  async getFieldTypes (token) {
    if (!token) {
      token = await firebase.auth().currentUser.getIdToken()
    }
    const { data } = await api.axios.get(
      `/${credentials.institution}/fieldtype/`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return data
  }

  makeModelData () {
    const text = `class Model {
        constructor(fields, options) {
          this.fields = []
          this.info = {}
          for (const key in fields) {
            this.fields.push({
              name:key, 
              fieldTypeId: fields[key]?.type.id,
              ...fields[key]
            })
          }
          for (const key in options) {
            this.info[key] = options[key]
          }
        }
      }
      module.exports = Model`.replace(/^ {6}/gm, '')
    return text
  }

  makeFieldTypeData (fieldTypes) {
    let props = ''
    for (const fieldType of fieldTypes) {
      props += `this.${fieldType.slug} = ${JSON.stringify(
        fieldType,
        null,
        4
      )} \n   `
    }

    const text = `class FieldType {
        constructor() {
          ${props}
        }
      }
      const fieldType = new FieldType()
      module.exports = fieldType`.replace(/^ {6}/gm, '')
    return text
  }

  async upsertFile (fieldTypes, filePath, makeContent) {
    const fileDir = path.dirname(filePath)
    const existsFile = fs.existsSync(fileDir)
    if (!existsFile) {
      fs.mkdirSync(fileDir, { recursive: true })
    }
    const fieldTypeData = makeContent()
    fs.writeFileSync(filePath, fieldTypeData)
  }

  async syncFieldTypes () {
    try {
      this.spinner.start(
        `Sincronizando os fieldTypes da organização '${credentials.institution}' ...`
      )
      const fieldTypes = await this.getFieldTypes()
      const fieldTypesFilePath = path.resolve(
        path.join('node_modules', 'quoti-cli', 'fieldType.js')
      )
      await this.upsertFile(fieldTypes, fieldTypesFilePath, () =>
        this.makeFieldTypeData(fieldTypes)
      )

      const modelFilePath = path.resolve(
        path.join('node_modules', 'quoti-cli', 'model.js')
      )
      await this.upsertFile(fieldTypes, modelFilePath, () =>
        this.makeModelData(fieldTypes)
      )
      this.spinner.succeed(
        `Sincronização dos fieldTypes na organização '${credentials.institution}' realizado com sucesso`
      )
    } catch (error) {
      this.spinner.fail('Erro durante a sincronização dos fieldTypes')
      throw new Error(error)
    }
  }
}

module.exports = FieldTypeService
