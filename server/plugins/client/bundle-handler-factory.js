module.exports = createBundleHandler

var log = require('npmlog')

var bundleClient = require('./bundle')
var writeClientBundle = require('./bundle-writer')

function createBundleHandler (hoodieClientPath, bundleTargetPath, bundleConfig) {
  var bundlePromise

  return function (request, reply) {
    if (!bundlePromise) {
      bundlePromise = new Promise(function (resolve, reject) {
        log.silly('client', 'bundling')
        bundleClient(hoodieClientPath, bundleTargetPath, bundleConfig, function (error, bundleBuffer, hasUpdate) {
          if (error) {
            return reject(error)
          }

          writeClientBundle(hasUpdate, bundleConfig.inMemory, bundleTargetPath, bundleBuffer)

          resolve(bundleBuffer)
        })
      })
    }
    bundlePromise.then(function (buffer) {
      reply(buffer).bytes(buffer.length).type('application/javascript')
    }).catch(reply)
  }
}
