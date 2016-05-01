module.exports.register = register
module.exports.register.attributes = {
  name: 'logger'
}

var qs = require('querystring')

var log = require('npmlog')
var Squeeze = require('good-squeeze').Squeeze

function GoodEvent (events, config) {
  this._callback = config.callback || function () {}
  this._filter = new Squeeze(events)
}

GoodEvent.prototype.init = function (readstream, emitter, callback) {
  readstream.pipe(this._filter).on('data', this._callback)
  callback()
}

function register (server, options, next) {
  /* istanbul ignore next */
  function logger (event) {
    if (event.event === 'response') {
      var path = event.path +
        (Object.keys(event.query).length ? '?' + qs.stringify(event.query) : '')
      return log.http(
        event.event,
        new Date(event.timestamp).toGMTString() + ' -',
        event.source.remoteAddress + ' -',
        event.method.toUpperCase(),
        path,
        event.statusCode,
        event.responseTime + 'ms'
      )
    }
    if (event.event === 'request' || event.event === 'log') {
      return log.verbose(
        event.event,
        new Date(event.timestamp).toGMTString(),
        event.tags,
        event.data
      )
    }
    log.silly(event.event, event)
  }

  server.register({
    register: require('good'),
    options: {
      opsInterval: 30000,
      reporters: [{
        reporter: GoodEvent,
        config: {callback: logger},
        events: {
          ops: '*',
          response: '*',
          log: '*',
          error: '*',
          request: '*',
          wreck: '*'
        }
      }]
    }
  }, next)
}
