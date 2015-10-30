var path = require('path')

module.exports = register

register.attributes = {
  name: 'directories',
  dependencies: 'inert'
}

function register (server, options, next) {
  server.route([{
    method: 'GET',
    path: '/{p*}',
    handler: {
      directory: {
        path: options.app.paths.www,
        listing: false,
        index: true
      }
    }
  }])

  server.route([{
    method: 'GET',
    path: '/hoodie/admin/{p*}',
    handler: {
      directory: {
        path: path.dirname(require.resolve('hoodie-admin-dashboard')),
        listing: false,
        index: true
      }
    }
  }])

  return next()
}
