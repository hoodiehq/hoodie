module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-local-public',
  dependencies: 'inert'
}

var createReadStream = require('fs').createReadStream
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

  // serve app whenever an html page is requested
  // and no other document is available
  var app = pathJoin(publicFolder, 'index.html')
  server.ext('onPostHandler', function (request, reply) {
    var response = request.response

    if (!response.isBoom) {
      return reply.continue()
    }

    var is404 = response.output.statusCode === 404
    var isHtmlRequest = /text\/html/.test(request.headers.accept)
    var isHoodiePath = /^\/hoodie\//.test(request.path)
    var isAdminPublicPath = /^\/hoodie\/admin\//.test(request.path) && !(/^\/hoodie\/admin\/api\//).test(request.path)

    if (isAdminPublicPath && isHtmlRequest) {
      return reply(createReadStream(pathJoin(adminPublicPath, 'index.html')))
    }

    if (isHoodiePath) {
      return reply.continue()
    }

    if (is404 && isHtmlRequest) {
      return reply(createReadStream(app))
    }

    reply.continue()
  })

  return next()
}
