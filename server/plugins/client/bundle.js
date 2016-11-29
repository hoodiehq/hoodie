module.exports = bundleClient

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

    var get = hasUpdate ? buildBundle.bind(null, config) : fs.readFile.bind(null, bundleTargetPath)

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

function buildBundle (config, callback) {
  var ReadableStream = require('stream').Readable
  var browserify = require('browserify')
  var stream = new ReadableStream()

  var b = browserify(stream, {
    standalone: 'hoodie'
  })
  var hoodieBundleSource = ''

  hoodieBundleSource += 'var Hoodie = require("@hoodie/client")\n'
  hoodieBundleSource += 'var options = {\n'
  if (config.url) {
    hoodieBundleSource += '  url: "' + config.url + '",\n'
  } else {
    hoodieBundleSource += '  url: location.origin,\n'
  }
  hoodieBundleSource += '  PouchDB: require("pouchdb-browser")\n'
  hoodieBundleSource += '}\n'
  hoodieBundleSource += 'module.exports = new Hoodie(options)\n'

  stream.push(hoodieBundleSource)
  stream.push(null)

  b.bundle(callback)
}
