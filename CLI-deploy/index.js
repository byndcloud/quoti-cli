const _7z = require('7zip-min')
const path = require('path')
const file7zPath = path.join(__dirname, 'qt.7z')

_7z.unpack(file7zPath, __dirname, err => {
  if (err) {
    console.log(err)
  }
})
