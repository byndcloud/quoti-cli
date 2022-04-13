class TypedError extends Error {
  constructor (message, type) {
    super(message)
    this.type = type
  }
}

class ExtensionNotFoundError extends TypedError {
  constructor (message, { name, orgSlug }) {
    super(message || `A extensão ${name} não foi encontrada na organização "${orgSlug}", na qual você está logado.`)
  }
}

class ExtensionsNotFoundError extends TypedError {
  constructor (message) {
    super(message || 'Extensões não encontradas', 'extensions-not-found')
  }
}

class ManifestNotFoundError extends TypedError {
  constructor ({ message, manifestPath } = {}) {
    super(message || `"manifest.json" não encontrado para a extensão em "${manifestPath}", Execute "qt link-extension"`, 'manifest-not-found')
  }
}
class EntryPointNotFoundInPackageError extends TypedError {
  constructor ({ message, entryPointPath } = {}) {
    super(message || `O entrypoint especificado (${entryPointPath}) não está entre as extensões que já foram selecionadas. Tem certeza que o caminho está correto ou que a extensão já foi selecionada com qt link-extension?`)
  }
}

module.exports = {
  ExtensionNotFoundError,
  ExtensionsNotFoundError,
  ManifestNotFoundError,
  EntryPointNotFoundInPackageError
}
