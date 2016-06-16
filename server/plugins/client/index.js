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
  var bundlePromise

  // TODO: add /hoodie/client.min.js path
  // https://github.com/hoodiehq/hoodie-client/issues/34

  server.route([{
    method: 'GET',
    path: '/hoodie/client.js',
    handler: function (request, reply) {
      if (!bundlePromise) {
        bundlePromise = new Promise(function (resolve, reject) {
          log.silly('client', 'bundling')
          bundleClient(hoodieClientPath, bundleTargetPath, options.config, function (error, bundleBuffer, hasUpdate) {
            if (error) {
              return reject(error)
            }

            resolve(bundleBuffer)
          })
        })
      }

      bundlePromise.then(function (buffer) {
        reply(buffer).bytes(buffer.length).type('application/javascript')
      }).catch(reply)
    }
  }])

  next()
}
