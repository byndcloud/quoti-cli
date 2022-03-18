const fs = require('fs')

/**
 *
 * @param {string} pathFile
 * @param {number} now Date.now()
 */
function insertTimestampInFile (pathFile, now) {
  if (!fs.existsSync(pathFile)) {
    throw new Error(`${pathFile} is invalid path`)
  }
  const file = fs.readFileSync(pathFile, { encoding: 'utf8' })
  const timeRegex = /[0-9]{13}/
  if (!file.match(timeRegex)) {
    throw new Error(`Arquivo ${pathFile} não dá match com timeRegex`)
  }
  const newFile = file.replace(timeRegex, now)

  fs.writeFileSync(pathFile, newFile)
}

/**
 *
 * @param {number} n Time in milliseconds
 * @returns Delay promise
 */
const delay = n => new Promise((resolve, reject) => setTimeout(resolve, n))

module.exports = {
  insertTimestampInFile,
  delay
}
