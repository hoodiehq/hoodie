module.exports = bundleClient

var fs = require('fs')
var path = require('path')

var log = require('npmlog')
var browserify = require('browserify')
var async = require('async')

function bundleClient (config, callback) {
  var hoodieClientModulePath = path.dirname(require.resolve('@hoodie/client/package.json'))
  var hoodieClientPath = path.join(hoodieClientModulePath, 'index.js')
  var bundleTargetPath = path.join(config.paths.data, 'client.js')
  var bundleTargetMinPath = path.join(config.paths.data, 'client.min.js')

  var bundler = browserify()
  bundler.add(path.join(hoodieClientModulePath, 'index.js'))
  Object.keys(config.plugins).map(function (key) {
    var plugin = config.plugins[key]
    // check we have a client file in place
    try {
      require.resolve(plugin.package + '/client/index.js')
    } catch (e) {
      return false
    }
    var pluginPath = path.dirname(require.resolve(plugin.package + '/package.json'))
    bundler.add(path.join(pluginPath, 'client/index.js'))
  })

  // output client
  log.silly('bundle', 'bundling ' + hoodieClientPath + ' into ' + bundleTargetPath)

  var bundleFs = fs.createWriteStream(bundleTargetPath)
  var bundleFsMin = fs.createWriteStream(bundleTargetMinPath)

  async.series([
    function (callback) {
      bundleFs.on('finish', function () {
        fs.appendFile(bundleTargetPath, '\n\nhoodie = new Hoodie()', function (error) {
          if (error) return new Error(error)
          log.info('bundle', 'bundled Hoodie client into ' + bundleTargetPath)
          callback()
        })
      })
    },
    function (callback) {
      bundleFsMin.on('finish', function () {
        fs.appendFile(bundleTargetMinPath, '\n\nhoodie = new Hoodie()', function (error) {
          if (error) return new Error(error)
          log.info('bundle', 'bundled Hoodie client into ' + bundleTargetMinPath)
          callback()
        })
      })
    }
  ],
  function (err, results) {
    if (err) return callback(err)
    log.info('bundle', 'done')
    callback()
  })

  // process
  bundler.bundle().pipe(bundleFs)
  // and minify
  bundler.transform({
    global: true
  }, 'uglifyify').bundle().pipe(bundleFsMin)
}
