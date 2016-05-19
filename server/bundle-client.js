module.exports = bundleClient

var fs = require('fs')
var path = require('path')

var log = require('npmlog')

function bundleClient (config, callback) {
  var hoodieClientModulePath = path.dirname(require.resolve('@hoodie/client/package.json'))
  var hoodieClientPath = path.join(hoodieClientModulePath, 'dist/hoodie.js')
  var bundleTargetPath = path.join(config.paths.data, 'client.js')

  // https://github.com/hoodiehq/hoodie-client/issues/34
  // var hoodieMinPath = path.join(hoodieClientModulePath, 'dist/hoodie.min.js')

  log.silly('bundle', 'bundling ' + hoodieClientPath + ' into ' + bundleTargetPath)

  var stream = fs.createReadStream(hoodieClientPath)
  stream.pipe(fs.createWriteStream(bundleTargetPath))
  stream.on('error', callback)
  stream.on('end', function () {
    // TODO: pass client configuration to constructor
    fs.appendFile(bundleTargetPath, '\n\nhoodie = new Hoodie()', function (error) {
      if (error) {
        return callback(error)
      }

      log.silly('bundle', 'appended Hoodie init code to ' + bundleTargetPath)
      log.info('bundle', 'bundled Hoodie client into ' + bundleTargetPath)

      callback()
    })
  })
}
