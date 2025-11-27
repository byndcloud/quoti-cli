const firebase = require('firebase/app')
require('firebase/auth')

const firebaseQuotiConfig = {
  apiKey: 'AIzaSyAH2cJZhaie08QGiIN-kdAozOxqyJ2cie8',
  authDomain: 'uniambiente-firebase.firebaseapp.com',
  projectId: 'uniambiente-firebase',
  storageBucket: 'uniambiente-firebase.firebasestorage.app',
  messagingSenderId: '881377367859',
  appId: '1:881377367859:web:917d39e45b5aab68d7d046'
}
const firebaseExtensionConfig = {
  apiKey: 'AIzaSyDVgx599oCrdlpLdAL6uGmooaxirQyu5Ns',
  authDomain: 'uniambiente-extensions.firebaseapp.com',
  projectId: 'uniambiente-extensions',
  storageBucket: 'uniambiente-extensions.firebasestorage.app',
  messagingSenderId: '715423567713',
  appId: '1:715423567713:web:6312935794994f081aff20'
}

// global.XMLHttpRequest = require('xhr2') // Firebase is for web, not for node. this is a workaround to fix.

// Initialize Firebase
exports.firebase = firebase
exports.app = firebase.initializeApp(firebaseQuotiConfig)
exports.appExtension = firebase.initializeApp(
  firebaseExtensionConfig,
  'Extensions'
)
