module.exports = bundleClient

var EventEmitter = require('events').EventEmitter
var fs = require('fs')
var parallel = require('async').parallel

/**
 * we compare the mtime (modified time) for the Hoodie client and the target
 * bundle file. If the latter does not exist or Hoodie client was modified
 * more recently, we read out the client and add the `new Hoodie()` init code,
 * otherwise we simply read out the bundle file.
 *
 * This optimisation is in preparation for plugins. Plugins can extend the
 * client, so we need to browserify on-the-fly to avoid dependency duplication,
 * and avoiding unneeded bundling with browserify saves a significant time.
 */
function bundleClient (hoodieClientPath, bundleTargetPath, config, callback) {
  parallel([
    getModifiedTime.bind(null, hoodieClientPath),
    getModifiedTime.bind(null, bundleTargetPath)
  ], function (error, results) {
    /* istanbul ignore if */
    if (error) {
      return callback(error)
    }

    var sourceTime = results[0]
    var targetTime = results[1]
    var hasUpdate = sourceTime > targetTime

    var get = hasUpdate ? buildBundle.bind(null, config, hoodieClientPath) : fs.readFile.bind(null, bundleTargetPath)

    get(function (error, buffer) {
      if (error) {
        return callback(error)
      }

      callback(null, buffer, hasUpdate)
    })
  })
}

function getModifiedTime (path, callback) {
  fs.stat(path, function (error, stats) {
    // we can ignore error, it means the file does not exist which is fine
    if (error) {
      return callback(null, -1)
    }

    callback(null, +stats.mtime)
  })
}

function buildBundle (config, hoodieClientPath, callback) {
  var browserify = require('browserify')([], {
    standalone: 'Hoodie'
  })

  browserify.require(hoodieClientPath)

  var bundleEE = new EventEmitter()

  bundleEE.on('done', function (error, buffer) {
    if (error) {
      return callback(error)
    }

    var options = config.url ? '{url: "' + config.url + '"}' : ''
    var initBuffer = Buffer('\n\nhoodie = new Hoodie(' + options + ')')

    callback(null, Buffer.concat([buffer, initBuffer]))
  })

  browserify.bundle(bundleEE.emit.bind(bundleEE, 'done'))
}
