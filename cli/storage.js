const { Storage } = require('@google-cloud/storage');
// Instantiate a storage client
export const storage = new Storage();
export const bucket = storage.bucket('dynamic-components');

