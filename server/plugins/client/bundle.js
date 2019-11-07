module.exports = bundleClient

var fs = require('fs')
var path = require('path')
var parallel = require('async').parallel
var requireResolve = require('../resolver')

function checkModule (module) {
  try {
    requireResolve(module)
    return true
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
    return false
  }
}

/**
 * we compare the mtime (modified time) for the last modified dependency of the
 * Hoodie client and the target bundle file. If the latter does not exist or
 * any dependency was modified more recently, we read out the client and add
 * the `new Hoodie()` init code, otherwise we simply read out the bundle file.
 *
 * This optimisation is in preparation for plugins. Plugins can extend the
 * client, so we need to browserify on-the-fly to avoid dependency duplication,
 * and avoiding unneeded bundling with browserify saves a significant time.
 */
function bundleClient (hoodieClientPath, bundleTargetPath, options, callback) {
  var pluginPaths = options.plugins.map(function (pluginName) {
    return pluginName + '/hoodie/client'
  })

  var plugins = [path.resolve('hoodie/client')]
    .concat(pluginPaths)
    .map(p => p.replace(/\\/g, '/')) // fix backslashes in Windows paths
    .filter(checkModule)

  var getPluginsModifiedTimes = plugins.map(function (pluginPath) {
    return getModifiedTime.bind(null, requireResolve(pluginPath))
  })

  parallel(getPluginsModifiedTimes.concat([
    getModifiedTime.bind(null, hoodieClientPath),
    getModifiedTime.bind(null, bundleTargetPath)
  ]), function (error, results) {
    /* istanbul ignore if */
    if (error) {
      return callback(error)
    }

    var targetTime = results.pop()
    var sourceTime = Math.max.apply(null, results)
    var hasUpdate = sourceTime > targetTime

    var get = hasUpdate ? buildBundle.bind(null, options, plugins) : fs.readFile.bind(null, bundleTargetPath)

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

function buildBundle (options, plugins, callback) {
  var ReadableStream = require('stream').Readable
  var browserify = require('browserify')
  var stream = new ReadableStream()

  var b = browserify(stream, {
    standalone: 'hoodie'
  })
  var hoodieBundleSource = ''

  hoodieBundleSource += 'var Hoodie = require("@hoodie/client")\n'
  hoodieBundleSource += 'var options = {\n'

  if (options.client) {
    Object.keys(options.client).forEach(function (key) {
      hoodieBundleSource += '  "' + key + '": ' + JSON.stringify(options.client[key]) + ',\n'
    })
  }

  if (options.url) {
    hoodieBundleSource += '  url: "' + options.url + '",\n'
  } else {
    hoodieBundleSource += '  url: location.origin,\n'
  }

  hoodieBundleSource += '  PouchDB: require("pouchdb-browser")\n'

  hoodieBundleSource += '}\n'
  hoodieBundleSource += 'module.exports = new Hoodie(options)\n'
  plugins.forEach(function (pluginPath) {
    hoodieBundleSource += '  .plugin(require("' + pluginPath + '"))\n'
  })

  stream.push(hoodieBundleSource)
  stream.push(null)

  b.bundle(callback)
}
