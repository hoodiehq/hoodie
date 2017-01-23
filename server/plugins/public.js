module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-local-public',
  dependencies: 'inert'
}

var pathJoin = require('path').join

function register (server, options, next) {
  var publicFolder = options.config.paths.public
  var hoodieVersion
  try {
    hoodieVersion = require('hoodie/package.json').version
  } catch (err) {
    hoodieVersion = 'development'
  }

  var hoodiePublicPath = pathJoin(require.resolve('../../package.json'), '..', 'public')
  var adminPublicPath = pathJoin(require.resolve('@hoodie/admin/package.json'), '..', 'dist')

  server.route([{
    method: 'GET',
    path: '/{p*}',
    handler: {
      directory: {
        path: publicFolder,
        listing: false,
        index: true
      }
    }
  }, {
    method: 'GET',
    path: '/hoodie/{p*}',
    handler: {
      directory: {
        path: hoodiePublicPath,
        listing: false,
        index: true
      }
    }
  }, {
    method: 'GET',
    path: '/hoodie/admin/{p*}',
    handler: {
      directory: {
        path: adminPublicPath,
        listing: false,
        index: true
      }
    }
  }, {
    method: 'GET',
    path: '/hoodie/info.json',
    handler: function (request, reply) {
      reply({
        hoodie: true,
        name: options.config.name,
        version: hoodieVersion
      })
    }
  }])

  return next()
}
