var emoji = require('node-emoji')
var log = require('npmlog')

var headingPrefix = process.platform === 'darwin' ? emoji.get('dog') + '  ' : ''

log.style = {
  silly: { inverse: true, bold: true },
  verbose: { fg: 'brightBlue', bold: true },
  info: { fg: 'brightGreen', bold: true },
  http: { fg: 'brightGreen', bold: true },
  warn: { fg: 'brightYellow', bold: true },
  error: { fg: 'brightRed', bold: true },
  silent: undefined
}
log.prefixStyle = { fg: 'magenta' }
log.headingStyle = {}
log.disp = {
  silly: 'Sill',
  verbose: 'Verb',
  info: 'Info',
  http: 'HTTP',
  warn: 'Warn',
  error: 'Err!',
  silent: 'silent'
}
log.heading = headingPrefix + 'Hoodie'
