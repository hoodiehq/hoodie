module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-public',
  dependencies: 'inert'
}

var fs = require('fs')
var path = require('path')

function register (server, options, next) {
  var app = path.join(options.config.paths.public, 'index.html')
  var hoodieVersion
  try {
    hoodieVersion = require('hoodie/package.json').version
  } catch (err) {
    hoodieVersion = 'development'
  }

  var hoodiePublicPath = path.join(require.resolve('../../package.json'), '..', 'public')
  var accountPublicPath = path.join(require.resolve('@hoodie/account/package.json'), '..', 'public')
  var storePublicPath = path.join(require.resolve('@hoodie/store/package.json'), '..', 'public')

  server.route([{
    method: 'GET',
    path: '/{p*}',
    handler: {
      directory: {
        path: options.config.paths.public,
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
    path: '/hoodie/account/{p*}',
    handler: {
      directory: {
        path: accountPublicPath,
        listing: false,
        index: true
      }
    }
  }, {
    method: 'GET',
    path: '/hoodie/store/{p*}',
    handler: {
      directory: {
        path: storePublicPath,
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
  }, {
    method: 'GET',
    path: '/hoodie/client.js',
    handler: {
      file: path.join(options.config.paths.data, 'client.js')
    }
  }, {
    method: 'GET',
    path: '/hoodie/client.min.js',
    handler: {
      file: path.join(options.config.paths.data, 'client.min.js')
    }
  }])

  // serve app whenever an html page is requested
  // and no other document is available
  // TODO: do not serve app when request.path starts with `/hoodie/`
  server.ext('onPostHandler', function (request, reply) {
    var response = request.response

    if (!response.isBoom) {
      return reply.continue()
    }

    var is404 = response.output.statusCode === 404
    var isHTML = /text\/html/.test(request.headers.accept)
    var isHoodiePath = /^\/hoodie\//.test(request.path)

    // We only care about 404 for html requests...
    if (!is404 || !isHTML || isHoodiePath) {
      return reply.continue()
    }

    // Serve index.html
    reply(fs.createReadStream(app))
  })

  return next()
}
