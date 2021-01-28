const { Storage } = require('@google-cloud/storage')
// Instantiate a storage client
exports.storage = new Storage()
exports.bucket = this.storage.bucket('dynamic-components')
