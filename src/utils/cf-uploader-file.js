const functions = require('firebase-functions')
const admin = require('firebase-admin')
const Busboy = require('busboy')
// const { PassThrough } = require('stream')

admin.initializeApp({
  storageBucket: 'dynamic-components'
})
const bucket = admin.storage().bucket()

exports.stream = functions.https.onRequest((req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  const filepath = req.headers['x-filepath']
  if (!filepath) {
    return res
      .status(400)
      .json({ message: 'You must pass the x-filepath header' })
  }

  const contentType = req.headers['content-type']
  const fileContentType =
    req.headers['x-content-type'] || contentType || 'application/octet-stream'

  const busboy = new Busboy({ headers: req.headers })
  const uploadFinished = false

  console.log('Request received', { headers: req.headers, body: req.body, rawBody: req.rawBody })

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    console.info('file...')
    const blob = bucket.file(filepath)
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: mimetype
      }
    })

    file.pipe(blobStream)

    blobStream.on('error', err => {
      console.error('error', { err })
      uploadError = err
      blobStream.end()
    })

    blobStream.on('finish', () => {
      console.info('finished upload')
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filepath}`

      return res.status(200).json({
        message: 'Upload complete',
        fileUrl: publicUrl
      })
      // File upload finished
    })
  })

  //   busboy.on('finish', () => {
  //     console.info('finish...')
  //     // if (uploadError) {
  //     //   res.status(500).send(uploadError.message);
  //     // } else {
  //     //   res.send('File uploaded successfully.');
  //     // }
  //   });

  //   console.info('adding rawBody...', { rawBody: req.rawBody })
  busboy.end(req.rawBody)
})
