const _7z = require('7zip-min')
const path = require('path')
const os = require('os')
const fs = require('fs')

// Determinar a arquitetura atual
const arch = os.arch()
const archName = arch === 'arm64' ? 'arm64' : 'x64'

// Caminho para o arquivo da plataforma específica
const platformDir = path.join(__dirname, 'platforms', archName)
const file7zPath = path.join(platformDir, 'qt.7z')

console.log(`\n=== Iniciando instalação da CLI para ${archName} ===\n`)

// Verificar se o build para esta arquitetura existe
if (!fs.existsSync(file7zPath)) {
  console.error(
    `Erro: build para arquitetura ${archName} não encontrada em: ${file7zPath}`
  )
  console.error(
    `Verifique se o build foi gerado corretamente para ${archName}.`
  )
  process.exit(1)
}

console.log(`Instalando qt command para arquitetura ${archName}...`)
_7z.unpack(file7zPath, __dirname, err => {
  if (err) {
    console.error('Erro ao descompactar:', err)
    return
  }

  // Verificar se a instalação foi bem-sucedida
  const metadataPath = path.join(platformDir, 'metadata.json')
  if (fs.existsSync(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
      console.log('\nInformações da build instalada:')
      console.log(` - Plataforma: ${metadata.platform}`)
      console.log(` - Arquitetura: ${metadata.arch}`)
      console.log(` - Versão Node: ${metadata.nodeVersion}`)
      console.log(
        ` - Data da build: ${new Date(metadata.buildDate).toLocaleString()}`
      )
    } catch (error) {
      console.log('Não foi possível ler os metadados da build.')
    }
  }

  console.log('\nInstalação da CLI concluída com sucesso!')
})
