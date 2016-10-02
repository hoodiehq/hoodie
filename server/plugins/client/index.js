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
  var hoodieClientPath = path.join(hoodieClientModulePath, 'index.js')
  var bundleTargetPath = path.join(options.config.data || '.hoodie', 'client.js')
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

            writeClientBundle(hasUpdate, options.config.inMemory, bundleTargetPath, bundleBuffer)

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

function writeClientBundle (hasUpdate, inMemory, bundleTargetPath, bundleBuffer) {
  if (!hasUpdate) {
    log.info('client', 'bundle is up to date')
    return
  }

  if (inMemory) {
    log.silly('client', 'running in memory, not writing bundle to ' + bundleTargetPath)
    return
  }

  log.info('client', 'bundle is out of date')
  log.silly('client', 'writing bundle to ' + bundleTargetPath)
  fs.writeFile(bundleTargetPath, bundleBuffer, function (error) {
    if (error) {
      log.warn('client', 'could not write to ' + bundleTargetPath + '. Bundle cannot be cached and will be re-generated on server restart')
      return
    }

    log.info('client', 'bundle written to ' + bundleTargetPath)
  })
}

