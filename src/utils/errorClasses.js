const path = require('path')
const deindent = require('deindent')

class GenericError extends Error {
  constructor (message, originalError, type) {
    super(message)
    this.originalError = originalError
    this.type = type
  }
}

class ExtensionNotFoundError extends GenericError {
  constructor (message, { name, orgSlug } = {}) {
    super(
      message ||
        `A extensão "${name}" não foi encontrada na organização "${orgSlug}", na qual você está logado.`
    )
  }
}

class ExtensionsNotFoundError extends GenericError {
  constructor (message) {
    super(message || 'Extensões não encontradas', 'extensions-not-found')
  }
}

class ManifestNotFoundError extends GenericError {
  constructor ({ message, manifestPath } = {}) {
    super(
      message ||
        `"manifest.json" não encontrado para a extensão em "${manifestPath}", Execute "qt link"`,
      'manifest-not-found'
    )
  }
}
class EntryPointNotFoundInPackageError extends GenericError {
  constructor ({ message, entryPointPath } = {}) {
    super(
      message ||
        `O entrypoint especificado (${entryPointPath}) não está entre as extensões que já foram selecionadas. Tem certeza que o caminho está correto ou que a extensão já foi selecionada com "qt link"?`
    )
  }
}

class CreateDynamicComponentError extends GenericError {
  constructor ({ message, entryPointPath } = {}) {
    super(
      message ||
        'Houve um erro durante criação da extensão. Se possível, entre em contato com a equipe do Quoti.'
    )
  }
}

class ManifestFromAnotherOrgError extends GenericError {
  constructor ({
    message,
    manifestPath,
    manifestInstitution,
    credentialsInstitution
  } = {}) {
    const relativeManifestPath = path.relative('./', manifestPath)
    super(
      message ||
        deindent`O manifest localizado em (${relativeManifestPath}) está registrado com a organização ${manifestInstitution}, porém você está logado na organização ${credentialsInstitution}.
        Execute "qt link" ou realize login na organização ${credentialsInstitution}`
    )
  }
}

module.exports = {
  ExtensionNotFoundError,
  ExtensionsNotFoundError,
  ManifestNotFoundError,
  EntryPointNotFoundInPackageError,
  ManifestFromAnotherOrgError,
  CreateDynamicComponentError,
  GenericError
}
