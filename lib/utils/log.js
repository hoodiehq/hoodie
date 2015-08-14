var _ = require('lodash')
var emoji = require('node-emoji')
var log = require('npmlog')

var levels = Object.keys(log.levels)

var exports = module.exports = _(log)

.pick(levels)
.mapValues(function (fn) {
  return fn.bind(log, 'Hoodie')
})
.value()

exports.levels = levels
exports.raw = log

log.style = {
  silly: {inverse: true, bold: true},
  verbose: {fg: 'brightBlue', bold: true},
  info: {fg: 'brightGreen', bold: true},
  http: {fg: 'brightGreen', bold: true},
  warn: {fg: 'brightYellow', bold: true},
  error: {fg: 'brightRed', bold: true},
  silent: undefined
}
log.prefixStyle = {fg: 'magenta'}
log.headingStyle = {}
log.disp = {
  silly: 'Sill' + emoji.get('mega') + ' ',
  verbose: 'Verb' + emoji.get('speech_balloon') + ' ',
  info: 'Info' + emoji.get('mag') + ' ',
  http: 'HTTP' + emoji.get('link') + ' ',
  warn: 'Warn' + emoji.get('zap') + ' ',
  error: 'Err!' + emoji.get('anger') + ' ',
  silent: 'silent'
}
log.heading = emoji.get('dog')
log.level = 'error'
