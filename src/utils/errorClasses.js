class TypedError extends Error {
  constructor (message, type) {
    super(message)
    this.type = type
  }
}

class ExtensionNotFoundError extends TypedError {
  constructor (message) {
    super(message || 'Extensão não encontrada', 'extension-not-found')
  }
}

class ExtensionsNotFoundError extends TypedError {
  constructor (message) {
    super(message || 'Extensões não encontradas', 'extensions-not-found')
  }
}

module.exports = {
  ExtensionNotFoundError,
  ExtensionsNotFoundError
}
