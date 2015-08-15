var bytes = require('bytes')

var log = require('../log')

exports.register = register
exports.register.attributes = {
  name: 'logger'
}

function register (server, options, next) {
  server.on('response', function (req) {
    var res = req.response

    var len = parseInt(res.headers['content-length'], 10)
    len = isNaN(len) ? '' : ' - ' + bytes(len)

    var color = 32
    var status = res.statusCode
    if (status >= 500) {
      color = 31
    } else if (status >= 400) {
      color = 33
    } else if (status >= 300) {
      color = 36
    }

    var date = new Date()

    log.http(
      date.toISOString() + ' [' + /* admin.settings.labels[0] + */ '] ' +
      req.method.toUpperCase() + ' \u001b[' + color + 'm' + status + '\u001b[0m ' +
      req.url.path + ' ' + (date.getTime() - req.info.received) + 'ms' + len
    )
  })

  next()
}
