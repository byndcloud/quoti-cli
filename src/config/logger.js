const { createLogger, format, transports, addColors } = require('winston')
const { combine, timestamp, printf } = format

const NODE_ENV = process.env.NODE_ENV
const isDebug = NODE_ENV === 'development' || process.env.DEBUG === true
const colorizer = format.colorize()

const myCustomLevels = {
  levels: {
    error: 0,
    warning: 1,
    info: 2,
    success: 3,
    debug: 4
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
      if (msg.level === 'debug' && isDebug) {
        if (msg.tag) {
          return colorizer.colorize(
            msg.level,
            `${msg.timestamp} - ${msg.tag} - ${msg.level}: ${msg.message}`
          )
        } else {
          return colorizer.colorize(
            msg.level,
            `${msg.timestamp} - ${msg.level}: ${msg.message}`
          )
        }
      } else if (msg.stack && isDebug) {
        return colorizer.colorize(msg.level, `${msg.stack}`)
      }
      return colorizer.colorize(msg.level, `${msg.message}`)
    })
  ),
  transports: [
    new transports.Console({
      level: isDebug ? 'debug' : 'success',
      prettyPrint: true,
      colorize: true,
      timestamp: true
    })
  ]
})
addColors(myCustomLevels.colors)
module.exports = logger
