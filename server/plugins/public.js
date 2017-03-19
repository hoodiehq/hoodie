module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-local-public',
  dependencies: 'inert'
}

const path = require('path')
const requireResolve = require('./resolver')
var createReadStream = require('fs').createReadStream
var pathJoin = path.join

function register (server, options, next) {
  const { paths, plugins } = options.config
  var publicFolder = paths.public

  var hoodieVersion
  try {
    hoodieVersion = require('hoodie/package.json').version
  } catch (err) {
    hoodieVersion = 'development'
  }

  var hoodiePublicPath = pathJoin(requireResolve('../../package.json'), '..', 'public')
  var adminPublicPath = pathJoin(requireResolve('@hoodie/admin/package.json'), '..', 'dist')
  const routes = [{
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
  }]

  // add plugin routes
  plugins.forEach(i => {
    let module
    // check if module directory exists
    try {
      module = requireResolve(`${i}/package.json`)
    } catch (err) {
      if (err.code !== 'MODULE_NOT_FOUND') {
        throw err
      }
    }

    if (module) {
      routes.push({
        method: 'GET',
        path: `/hoodie/${i}/{p*}`,
        handler: {
          directory: {
            path: pathJoin(path.dirname(require.resolve(module)),  'hoodie', 'public'),
            listing: false,
            index: true,
          }
        }
      })
    }
  })

  server.route(routes)

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
