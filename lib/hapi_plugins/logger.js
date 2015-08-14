var bytes = require('bytes')

var log = require('../utils/log')

exports.register = register
exports.register.attributes = {
  name: 'logger'
}

function register (server, options, next) {
  server.on('response', function (request) {
    if (!options.app.verbose) {
      return
    }

    var response = request.response
    var status = response.statusCode
    var len = parseInt(response.headers['content-length'], 10)
    var color = 32

    if (status >= 500) {
      color = 31
    } else if (status >= 400) {
      color = 33
    } else if (status >= 300) {
      color = 36
    }

    len = isNaN(len) ? '' : len = ' - ' + bytes(len)
    var date = new Date()

    var logStr = '\u001b[90m' + date.toISOString() + ' [' +
       /* admin.settings.labels[0] + */'] ' + request.method.toUpperCase() + ' ' +
      '\u001b[' + color + 'm' + status + '\u001b[90m' +
      ' ' + request.url.path + ' ' +
      (date.getTime() - request.info.received) +
      'ms' + len +
      '\u001b[0m'

    log.verbose(logStr)
  })

  next()
}
