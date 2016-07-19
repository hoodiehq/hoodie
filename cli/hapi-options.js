module.exports = getHapiOptions

var url = require('url')

function getHapiOptions (options) {
  var hapiOptions = {
    server: {},
    connection: {
      port: options.port,
      address: options.bindAddress
    }
  }

  if (options.loglevel === 'debug') {
    hapiOptions.server.debug = {
      request: ['error'],
      log: ['error']
    }
  }

  if (options.url) {
    hapiOptions.connection.host = url.parse(options.url).hostname
  }

  return hapiOptions
}
