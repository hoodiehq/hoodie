/**
 * Utilities for Hoodie's console output
 */

var clc = require('cli-color')

/**
 * Prefixes the error's message with 'ERR!' where possible
 * and prints to console.error
 */

exports.error = function (err) {
  var str = err.stack || err.message || err.toString()
  var lines = str.split('\n').map(function (line) {
    return clc.bgBlack.red('ERR!') + ' ' + line
  })
  console.error('\n' + lines.join('\n'))
}
