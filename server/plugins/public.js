module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-local-public',
  dependencies: 'inert'
}

var path = require('path')
var requireResolve = require('./resolver')
var createReadStream = require('fs').createReadStream

function register (server, options, next) {
  var paths = options.paths
  var plugins = options.plugins
  var publicFolder = paths.public

  var hoodieVersion
  try {
    hoodieVersion = require('hoodie/package.json').version
  } catch (err) {
    hoodieVersion = 'development'
  }

  var hoodiePublicPath = path.join(requireResolve('../../package.json'), '..', 'public')
  var adminPublicPath = path.join(requireResolve('@hoodie/admin/package.json'), '..', 'dist')
  var routes = [{
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
        name: options.name,
        version: hoodieVersion
      })
    }
  }]

  // add plugin routes
  plugins.forEach(function (pluginPath) {
    // check if module directory exists
    try {
      var pluginPackagePath = requireResolve(pluginPath + '/package.json')
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error
      }
    }

    if (!pluginPackagePath) {
      return
    }

    var pkg = require(pluginPackagePath)

    var name = pkg.hoodie ? pkg.hoodie.name || pkg.name : pkg.name

    routes.push({
      method: 'GET',
      path: '/hoodie/' + name + '/{p*}',
      handler: {
        directory: {
          path: path.join(path.dirname(pluginPackagePath), 'hoodie', 'public'),
          listing: false,
          index: true
        }
      }
    })
  })

  server.route(routes)

  // serve app whenever an html page is requested
  // and no other document is available
  var app = path.join(publicFolder, 'index.html')
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
      return reply(createReadStream(path.join(adminPublicPath, 'index.html')))
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
