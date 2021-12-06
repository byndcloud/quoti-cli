class Tools {
  isYes (text) {
    return ['s', 'sim', 'yes', 'y'].includes(text.toLowerCase())
  }
}

module.exports = new Tools()
