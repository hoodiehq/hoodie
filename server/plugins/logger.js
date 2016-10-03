module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-local-logger'
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
  server.register({
    register: require('good'),
    options: {
      opsInterval: 30000,
      reporters: [{
        reporter: GoodEvent,
        config: {
          callback: logger
        },
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

function logger (event) {
  if (event.event === 'error') {
    return log.error(
      event.error.name,
      new Date(event.timestamp).toISOString(),
      event.error.message,
      event.error
    )
  }

  if (event.event === 'response') {
    var path = event.path +
      (Object.keys(event.query).length ? '?' + qs.stringify(event.query) : '')
    return log.http(
      event.event,
      new Date(event.timestamp).toISOString() + ' -',
      event.source.remoteAddress + ' -',
      event.method.toUpperCase(),
      path,
      event.statusCode,
      event.responseTime + 'ms'
    )
  }

  if (event.event === 'request' || event.event === 'log') {
    var level = findLogLevel(Object.keys(log.levels), event.tags) || 'verbose'
    return log[level](
      event.event,
      new Date(event.timestamp).toISOString(),
      event.tags.length ? event.tags : event.data,
      event.tags.length ? event.data : ''
    )
  }

  log.silly(event.event, event)
}

function findLogLevel (levels, tags) {
  for (var i = 0; i < tags.length; i++) {
    for (var j = 0; j < levels.length; j++) {
      if (levels[j] === tags[i]) {
        tags.splice(i, 1)
        return levels[j]
      }
    };
  };
}
