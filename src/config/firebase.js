const firebase = require('firebase/app')
require('firebase/auth')
require('firebase/firestore')

const firebaseConfig = {
  apiKey: 'AIzaSyDiicN8xT3lImJY0hfcobQfRLit90zMw8U',
  authDomain: 'beyond-quoti.firebaseapp.com',
  databaseURL: 'https://beyond-quoti.firebaseio.com',
  projectId: 'beyond-quoti',
  storageBucket: 'beyond-quoti.appspot.com',
  messagingSenderId: '40570897776',
  appId: '1:40570897776:web:4f02b3cf8eba78ed763bb5'
}

// Initialize Firebase
exports.firebase = firebase
exports.app = firebase.initializeApp(firebaseConfig)
