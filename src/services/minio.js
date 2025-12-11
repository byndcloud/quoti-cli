const Minio = require('minio')
const path = require('path')

// if (!process.env.BUCKET_ACCESS_KEY || !process.env.BUCKET_SECRET_KEY) {
//   throw new Error('Bucket access key and secret key are required')
// }

// MinIO Configuration - você pode mover isso para um arquivo de configuração se necessário
const MINIO_CONFIG = {
  endPoint: 'bucket-api.inea.rj.gov.br',
  port: 443,
  useSSL: true,
  accessKey: 'RcySWkjdfcjo0X1hPIBH',
  secretKey: 'x1siXNElWewLcJcjvxXbFC6WY9Qwcn2i0p9koZl7'
}

const BUCKET_NAME = 'dynamic-components'
const MINIO_BASE_URL = `https://${MINIO_CONFIG.endPoint}`

// Initialize MinIO client
const minioClient = new Minio.Client(MINIO_CONFIG)

/**
 * Get MIME type from file extension
 */
function getMimeTypeFromExtension (filename) {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes = {
    '.js': 'text/javascript',
    '.vue': 'text/plain',
    '.json': 'application/json',
    '.css': 'text/css',
    '.html': 'text/html',
    '.txt': 'text/plain'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Upload file to MinIO using traditional MinIO client
 * @param {Object} options
 * @param {Buffer|string} options.fileContent - File content as buffer or string
 * @param {string} options.fileName - Name of the file to upload
 * @param {string} options.bucketPath - Path within the bucket (e.g., 'inea-edu')
 * @returns {Promise<string>} - The URL of the uploaded file
 */
async function uploadToMinio ({ fileContent, fileName, bucketPath = 'inea-edu' }) {
  try {
    // Convert string to buffer if needed
    let buffer = fileContent
    if (typeof fileContent === 'string') {
      buffer = Buffer.from(fileContent, 'utf8')
    }

    const fileSizeKB = Math.round(buffer.byteLength / 1024)
    console.log(`📊 File size: ${fileSizeKB} KB`)
    console.log(`📤 Uploading to MinIO: ${fileName}`)

    // Construct the object name (path within bucket)
    const objectName = bucketPath ? `${bucketPath}/${fileName}` : fileName
    console.log(`🔗 Object name: ${objectName}`)

    // Check if bucket exists, create if it doesn't
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME)
    if (!bucketExists) {
      console.log(`� Creating bucket: ${BUCKET_NAME}`)
      await minioClient.makeBucket(BUCKET_NAME)
    }

    // Upload file using putObject (creates new object)
    const uploadInfo = await minioClient.putObject(
      BUCKET_NAME,
      objectName,
      buffer,
      buffer.length,
      {
        'Content-Type': getMimeTypeFromExtension(fileName)
      }
    )

    console.log('✅ File uploaded successfully to MinIO')
    console.log('📋 Upload info:', uploadInfo)

    // Return the public URL
    const publicUrl = `${MINIO_BASE_URL}/${BUCKET_NAME}/${objectName}`
    return publicUrl
  } catch (error) {
    console.log('❌ Failed to upload file to MinIO: ' + error.message)
    console.log('📋 Error details:', error.code, error.name)
    if (error.resource) {
      console.log('🔍 Resource:', error.resource)
    }
    throw error
  }
}

/**
 * Upload extension file to MinIO with proper naming
 * @param {Object} options
 * @param {Buffer|string} options.extensionCode - Extension code content
 * @param {string} options.fileName - File name for the extension
 * @param {string} options.institution - Institution name for path organization
 * @returns {Promise<string>} - The URL of the uploaded file
 */
async function uploadExtensionToMinio ({ extensionCode, fileName, institution }) {
  // fileName já vem com o path completo (ex: "inea-edu/arquivo.js")
  // Então não precisamos adicionar bucketPath
  return uploadToMinio({
    fileContent: extensionCode,
    fileName,
    bucketPath: '' // Deixar vazio para evitar duplicação
  })
}

module.exports = {
  uploadToMinio,
  uploadExtensionToMinio,
  getMimeTypeFromExtension,
  MINIO_BASE_URL
}
