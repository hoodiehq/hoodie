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
        path: options.app.www_root,
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
        path: options.app.admin_root,
        listing: false,
        index: true
      }
    }
  }])

  return next()
}
