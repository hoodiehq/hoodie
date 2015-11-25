var fs = require('fs')
var path = require('path')

var relative = require('require-relative')

exports.register = register
exports.register.attributes = {
  name: 'api',
  dependencies: 'inert'
}

function register (server, options, next) {
  var app = path.join(options.app.paths.www, 'index.html')
  var client = path.dirname(require.resolve('hoodie-client/package.json'))
  var dashboard = path.dirname(require.resolve('hoodie-admin-dashboard'))
  var hoodieVersion
  try {
    hoodieVersion = relative(
      'hoodie/package.json',
      options.app.paths.project
    ).version
  } catch (err) {
    hoodieVersion = 'development'
  }

  // allow clients to request a gzip response, even if the
  // Accept-Encoding headers is missing or mangled due to
  // faulty proxy servers
  // http://www.stevesouders.com/blog/2010/07/12/velocity-forcing-gzip-compression/
  server.ext('onPreHandler', function maybeForceGzip (request, reply) {
    if (request.query.force_gzip === 'true') {
      request.info.acceptEncoding = 'gzip'
    }
    reply.continue()
  })

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
  }, {
    method: 'GET',
    path: '/hoodie',
    handler: function (request, reply) {
      reply({
        hoodie: true,
        name: options.app.name,
        version: hoodieVersion
      })
    }
  }, {
    method: 'GET',
    path: '/hoodie/admin/{p*}',
    handler: {
      directory: {
        path: dashboard,
        listing: false,
        index: true
      }
    }
  }, {
    method: 'GET',
    path: '/hoodie/bundle.js',
    handler: {
      file: path.join(client, 'dist/hoodie.js')
    }
  }, {
    method: 'GET',
    path: '/hoodie/bundle.min.js',
    handler: {
      file: path.join(client, 'dist/hoodie.min.js')
    }
  }])

  // serve app whenever an html page is requested
  // and no other document is available
  server.ext('onPostHandler', function (request, reply) {
    var response = request.response

    if (!response.isBoom) return reply.continue()

    var is404 = response.output.statusCode === 404
    var isHTML = /text\/html/.test(request.headers.accept)

    // We only care about 404 for html requests...
    if (!is404 || !isHTML) return reply.continue()

    // Serve index.html
    reply(fs.createReadStream(app))
  })

  return next()
}
