var path = require('path')

module.exports = register

register.attributes = {
  name: 'directories',
  dependencies: 'inert'
}

function register (server, options, next) {
  server.select('web').route([{
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

  server.select('admin').route([{
    method: 'GET',
    path: '/{p*}',
    handler: {
      directory: {
        path: path.dirname(require.resolve('hoodie-admin-dashboard/www/index.html')),
        listing: false,
        index: true
      }
    }
  }])

  return next()
}
