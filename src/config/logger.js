const { createLogger, format, transports, addColors } = require('winston')
const { combine, timestamp, printf } = format
const dotenv = require('dotenv')
dotenv.config()

const NODE_ENV = process.env.NODE_ENV
const colorizer = format.colorize()

const myCustomLevels = {
  levels: {
    error: 0,
    warning: 1,
    debug: 2,
    info: 3,
    success: 4
  },
  colors: {
    error: 'bold red',
    warning: 'italic yellow',
    debug: 'green',
    info: 'white',
    success: 'bold blue' // fontStyle color
  }
}

const logger = createLogger({
  levels: myCustomLevels.levels,
  format: combine(
    timestamp(),
    printf(msg => {
      if (msg.level === 'debug' && NODE_ENV === 'development') {
        if (msg.tag) {
          return colorizer.colorize(msg.level, `${msg.timestamp} - ${msg.tag} - ${msg.level}: ${msg.message}`)
        } else {
          return colorizer.colorize(msg.level, `${msg.timestamp} - ${msg.level}: ${msg.message}`)
        }
      } else if (msg.stack && NODE_ENV === 'development') {
        return colorizer.colorize(msg.level, `${msg.stack}`)
      }
      return colorizer.colorize(msg.level, `${msg.message}`)
    })
  ),
  transports: [
    new (transports.Console)({
      level: 'success',
      prettyPrint: true,
      colorize: true,
      timestamp: true

    })
  ]
})
addColors(myCustomLevels.colors)
module.exports = logger
