const _7z = require('7zip-min')
const path = require('path')

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

compress7z(['./node_modules', path.resolve('bin'), 'src'], 'CLI-deploy/qt')
