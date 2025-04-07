const { default: axios } = require('axios')
const FormData = require('form-data')
const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 *
 * @description Uploads a file to Firebase Storage.
 * @param {{
 *  buffer: Buffer,
 *  fileContent: string,
 *  filePath: string
 * }} param0
 * @returns
 */
async function uploadFile ({
  buffer = null,
  fileContent = null,
  filePath = null
} = {}) {
  if (!buffer && !fileContent) {
    throw new Error('Buffer or fileContent must be provided')
  }

  if (!filePath) {
    throw new Error('Filename must be provided')
  }

  if (fileContent) {
    buffer = Buffer.from(fileContent, 'utf8')
  }

  const contentLength = buffer.length
  if (!contentLength) {
    throw new Error('Buffer is empty')
  }

  if (contentLength > MAX_UPLOAD_FILE_SIZE) {
    throw new Error('File size exceeds 10MB')
  }

  try {
    const body = new FormData()
    body.append('file', buffer, {
      filename: filePath
    })

    const response = await axios.post(
      'https://us-central1-beyond-quoti.cloudfunctions.net/upload-to-storage',
      body, // Send buffer directly as request body
      {
        headers: {
          ...body.getHeaders(),
          'x-filepath': filePath
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    )

    return response
  } catch (error) {
    console.error('❌ Upload failed:', error.response?.data || error.message)
    throw error
  }
}

module.exports = {
  uploadFile
}
