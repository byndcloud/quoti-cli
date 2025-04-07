const _7z = require('7zip-min')
const path = require('path')
const fs = require('fs')

/**
 *
 * @param {string[]} input
 * @param {string} output
 */
function compress7z (input, output) {
  _7z.cmd(['a', output, ...input], err => {
    if (err) {
      console.log(err)
    }
  })
}

fs.unlinkSync('./node_modules/quoti-cli')

compress7z(['./node_modules', path.resolve('bin'), 'src'], 'CLI-deploy/qt')
