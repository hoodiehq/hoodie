module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-local-public',
  dependencies: 'inert'
}

var fs = require('fs')
var path = require('path')

function register (server, options, next) {
  var publicFolder = options.config.paths.public || 'public'
  var app = path.join(publicFolder, 'index.html')
  var hoodieVersion
  try {
    hoodieVersion = require('hoodie/package.json').version
  } catch (err) {
    hoodieVersion = 'development'
  }

  var hoodiePublicPath = path.join(require.resolve('../../package.json'), '..', 'public')
  var accountPublicPath = path.join(require.resolve('@hoodie/account/package.json'), '..', 'public')
  var storePublicPath = path.join(require.resolve('@hoodie/store/package.json'), '..', 'public')
  var adminPublicPath = path.join(require.resolve('@hoodie/admin/package.json'), '..', 'dist')

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

  // serve app whenever an html page is requested
  // and no other document is available
  server.ext('onPostHandler', function (request, reply) {
    var response = request.response

    if (!response.isBoom) {
      return reply.continue()
    }

    var is404 = response.output.statusCode === 404
    var isHTML = /text\/html/.test(request.headers.accept)
    var isAccountPath = /^\/hoodie\/account\//.test(request.path)
    var isAdminPath = /^\/hoodie\/admin\//.test(request.path)
    var isStorePath = /^\/hoodie\/store\//.test(request.path)
    var isHoodiePath = /^\/hoodie\//.test(request.path)

    // We only care about 404 for html requests...
    if (!is404 || !isHTML) {
      return reply.continue()
    }

    if (isAccountPath) {
      return reply(fs.createReadStream(path.join(accountPublicPath, 'index.html')))
    }
    if (isAdminPath) {
      return reply(fs.createReadStream(path.join(adminPublicPath, 'index.html')))
    }
    if (isStorePath) {
      return reply(fs.createReadStream(path.join(storePublicPath, 'index.html')))
    }
    if (isHoodiePath) {
      return reply.continue()
    }

    // Serve index.html
    reply(fs.createReadStream(app))
  })

  return next()
}
