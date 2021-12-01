const firebase = require('firebase/app')
require('firebase/auth')
require('firebase/firestore')
require('firebase/storage')

const firebaseQuotiConfig = {
  apiKey: 'AIzaSyDiicN8xT3lImJY0hfcobQfRLit90zMw8U',
  authDomain: 'beyond-quoti.firebaseapp.com',
  databaseURL: 'https://beyond-quoti.firebaseio.com',
  projectId: 'beyond-quoti',
  storageBucket: 'beyond-quoti.appspot.com',
  messagingSenderId: '40570897776',
  appId: '1:40570897776:web:4f02b3cf8eba78ed763bb5'
}
const firebaseExtensionConfig = {
  apiKey: 'AIzaSyDiTLr7Wu7VFBCj4pySzMPUHD7kHMqrndI',
  authDomain: 'beyond-quoti-extensions.firebaseapp.com',
  databaseURL: 'https://beyond-quoti-extensions.firebaseapp.com',
  projectId: 'beyond-quoti-extensions',
  storageBucket: 'beyond-quoti-extensions.appspot.com',
  messagingSenderId: '236379322440',
  appId: '1:236379322440:web:ab22dafd9a19814b7a407d'
}

// Initialize Firebase
exports.firebase = firebase
exports.app = firebase.initializeApp(firebaseQuotiConfig)
exports.appExtension = firebase.initializeApp(firebaseExtensionConfig, 'Extensions')
exports.storage = this.app.storage('gs://dynamic-components')
