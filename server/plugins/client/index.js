module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-local-client',
  dependencies: 'inert'
}

var fs = require('fs')
var path = require('path')

var bundleClient = require('./bundle')
var log = require('npmlog')

function register (server, options, next) {
  var hoodieClientModulePath = path.dirname(require.resolve('@hoodie/client/package.json'))
  var hoodieClientPath = path.join(hoodieClientModulePath, 'dist/hoodie.js')
  var bundleTargetPath = path.join(options.config.paths.data, 'client.js')

  server.route([{
    method: 'GET',
    path: '/hoodie/client.js',
    handler: {
      file: path.join(options.config.paths.data, 'client.js')
    }
  // https://github.com/hoodiehq/hoodie-client/issues/34
  // }, {
  //   method: 'GET',
  //   path: '/hoodie/client.min.js',
  //   handler: {
  //     file: path.join(options.config.paths.data, 'client.min.js')
  //   }
  }])

  bundleClient(hoodieClientPath, options.config, function (error, bundleBuffer) {
    if (error) {
      return next(error)
    }

    log.silly('bundle', 'bundling ' + hoodieClientPath + ' into ' + bundleTargetPath)
    fs.writeFile(bundleTargetPath, bundleBuffer, function (error) {
      if (error) {
        return next(error)
      }

      log.info('bundle', 'bundled Hoodie client into ' + bundleTargetPath)
      next()
    })
  })
}
