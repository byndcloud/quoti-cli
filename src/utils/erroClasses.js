class TypedError extends Error {
  constructor (status, type, details = '') {
    super(`${details}`)
    this.status = status
    this.type = type
    this.details = details
  }
}

class ExtensionNotFoundError extends TypedError {
  constructor (msg) {
    super('error', 'extension-not-found', msg || 'Extensão não encontrada')
  }
}

class ExtensionsNotFoundError extends TypedError {
  constructor (msg) {
    super('error', 'extensions-not-found', msg || 'Extensões não encontradas')
  }
}

module.exports = {
  ExtensionNotFoundError,
  ExtensionsNotFoundError
}
