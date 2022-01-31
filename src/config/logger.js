const { createLogger, format, transports, addColors } = require('winston')
const { combine, timestamp, label, printf } = format

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
    format.timestamp(),
    format.printf(msg => {
      if (msg.level === 'debug') {
        return colorizer.colorize(msg.level, `${msg.timestamp} - ${msg.level}: ${msg.message}`)
      } else {
        return colorizer.colorize(msg.level, `${msg.message}`)
      }
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
