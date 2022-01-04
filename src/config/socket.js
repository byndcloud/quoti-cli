const credentials = require('../config/credentials')
const Ws = require('ws')

const socketServerUrl =
  process.env.WEBSOCKET_URL || 'wss://develop.ws.quoti.cloud/'

module.exports = new (class Socket {
  constructor () {
    /**
     * @type {WebSocket}
     */
    this.socket = null
    /**
     * @type {Object}
     */
    this.connInterval = null
    /**
     * @type {Map}
     */
    this.eventListeners = new Map()
    this.connect()
  }

  connect () {
    this.connInterval = setInterval(() => {
      if (this.socket !== null) {
        clearInterval(this.connInterval)
      } else if (credentials?.user?.uid) {
        this.socket = new Ws(socketServerUrl, {
          Cookie: `uuid=${credentials.user.uid}`
        })
        this.socket.onerror = err => {
          this.socket = null
          console.error(err)
        }
        this.socket.onopen = this.setup.bind(this)
      }
    }, 1000)
  }

  async setup () {
    try {
      this.socket.onclose = () => {
        this.socket = null
        this.connect()
      }

      this.socket.onerror = err => {
        this.socket = null
        console.error(err)
      }
    } catch (err) {
      console.error(err)
    }
  }

  /**
   *
   * @description A function to emit socket event
   * @param {{
   * event: String,
   * payload: Object
   * }} param0
   */
  emit ({ event = 'reload-extension', data = {} } = {}) {
    return new Promise(resolve =>
      this.socket.send(JSON.stringify({ event, data }), r => resolve(r))
    )
  }
})()
