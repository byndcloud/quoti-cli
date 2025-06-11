const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

/**
 * Executa um comando shell e retorna o resultado
 * @param {string} command Comando a ser executado
 * @param {object} options Opções para execução
 * @returns {string} Resultado do comando
 */
function runCommand (command, options = {}) {
  console.log(`Executando: ${command}`)
  try {
    // Quando estamos usando stdio: 'inherit', o retorno é nulo
    execSync(command, { stdio: 'inherit', ...options })
    return true
  } catch (error) {
    console.error(`Erro ao executar comando: ${command}`, error)
    process.exit(1)
  }
}

/**
 * Cria uma build para a arquitetura específica
 * @param {string} archName Nome da arquitetura (arm64 ou x64)
 */
async function createBuildForArch (archName) {
  console.log(
    `\n=== Iniciando build para ${process.platform}-${archName} ===\n`
  )

  // Criar diretório para build da plataforma
  const platformDir = path.join('CLI-deploy', 'platforms', archName)
  if (!fs.existsSync(platformDir)) {
    fs.mkdirSync(platformDir, { recursive: true })
  }

  // Criar diretório temporário para esta arquitetura
  const tempDir = path.join('temp-build', archName)
  if (fs.existsSync(tempDir)) {
    runCommand(`rm -rf ${tempDir}`)
  }
  fs.mkdirSync(tempDir, { recursive: true })

  // Copiar package.json e outros arquivos necessários
  fs.copyFileSync('package.json', path.join(tempDir, 'package.json'))
  fs.copyFileSync('package-lock.json', path.join(tempDir, 'package-lock.json'))

  // Instalar dependências para a arquitetura específica
  console.log(`\nInstalando dependências para ${archName}...`)
  runCommand('npm install --omit=dev', {
    cwd: tempDir,
    env: {
      ...process.env,
      npm_config_arch: archName,
      npm_config_target_arch: archName
    }
  })

  // Criar diretório bin se não existir
  if (!fs.existsSync(path.join(tempDir, 'bin'))) {
    fs.mkdirSync(path.join(tempDir, 'bin'), { recursive: true })
  }

  // Copiar diretório src e bin
  runCommand(`cp -R ./src ${tempDir}/`)
  runCommand(`cp -R ./bin ${tempDir}/`)

  // Criar arquivo zip usando a versão instalada de 7zip para essa arquitetura
  console.log(`\nCompactando build para ${archName}...`)
  runCommand(
    `cd ${tempDir} && node -e "require('7zip-min').cmd(['a', '../../${platformDir}/qt', './*'], console.log)"`
  )

  // Criar metadados da build
  const metadataPath = path.join(platformDir, 'metadata.json')
  fs.writeFileSync(
    metadataPath,
    JSON.stringify(
      {
        platform: process.platform,
        arch: archName,
        nodeVersion: process.version,
        buildDate: new Date().toISOString()
      },
      null,
      2
    )
  )

  console.log(
    `\n✅ Build para ${process.platform}-${archName} concluída em ${platformDir}/qt\n`
  )
}

// Remover link simbólico se existir
const quotiBinPath = './node_modules/quoti-cli'
if (fs.existsSync(quotiBinPath)) {
  fs.unlinkSync(quotiBinPath)
}

// Definir arquiteturas alvo
const architectures = ['arm64', 'x64']

// Processar cada arquitetura sequencialmente
;(async () => {
  console.log(
    `\n🚀 Iniciando processo de build para ${architectures.join(' e ')}\n`
  )

  for (const arch of architectures) {
    await createBuildForArch(arch)
  }

  // Limpar diretórios temporários
  console.log('\nLimpando diretórios temporários...')
  runCommand('rm -rf temp-build')

  console.log(
    `\n🎉 Builds concluídas com sucesso para ${
      process.platform
    } (${architectures.join(' e ')})\n`
  )
})().catch(error => {
  console.error('Erro durante o processo de build:', error)
  process.exit(1)
})
