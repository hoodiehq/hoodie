module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-local-client',
  dependencies: 'inert'
}

var join = require('path').join

var bundleClient = require('./bundle')

function register (server, options, next) {
  server.route([{
    method: 'GET',
    path: '/hoodie/client.js',
    handler: {
      file: join(options.config.paths.data, 'client.js')
    }
  // https://github.com/hoodiehq/hoodie-client/issues/34
  // }, {
  //   method: 'GET',
  //   path: '/hoodie/client.min.js',
  //   handler: {
  //     file: path.join(options.config.paths.data, 'client.min.js')
  //   }
  }])

  bundleClient(options.config, next)
}
