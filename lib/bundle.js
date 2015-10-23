var crypto = require('crypto')
var fs = require('fs')
var path = require('path')

var _ = require('lodash')
var browserify = require('browserify')
var log = require('npmlog')
var uglify = require('uglify-js')

module.exports = function (env_config, callback) {
  var shasum = getBundleHash(env_config.plugins)

  var paths = {
    bundle: path.join(env_config.paths.data, 'hoodie.bundle.js'),
    min: path.join(env_config.paths.data, 'hoodie.bundle.min.js'),
    raw: path.join(env_config.paths.project, '.hoodie.concat.js')
  }

  var configStore = require('./config-store')(env_config.paths.data)
  if (configStore.get('cache.browserifyHash') === shasum
    && fs.existsSync(paths.bundle)
    && fs.existsSync(paths.min)) {

    log.info('bundle', 'Found cached browserify bundle')
    return callback()
  }

  log.info('bundle', 'Creating hoodie browserify bundle...')
  var pluginPaths = _(env_config.plugins)
  .values()
  .pluck('path')
  .map(function (plugin) {
    return path.relative(env_config.paths.project, path.join(plugin, 'client'))
  })
  .map(function (pluginPath) {
    return `require('${pluginPath}')`
  })
  .value()

  fs.writeFileSync(paths.raw, `
    var plugins = [${pluginPaths.join(', ')}]
    module.exports = (function () {
      var Hoodie =  require('hoodie-client')
      var hoodie = new Hoodie()
      hoodie.plugin(plugins)
      return hoodie
    })()
  `)

  browserify(paths.raw, {
    fullPaths: false,
    standalone: 'Hoodie'
  }).bundle(function (err, bundle) {
    fs.unlinkSync(paths.raw)

    if (err) return log.error(err)

    log.verbose('bundle', 'Browserifying done (size: %d)', bundle.length)

    log.verbose('bundle', 'Writing bundle file: ' + path.relative(env_config.paths.project, paths.bundle))
    fs.writeFileSync(paths.bundle, bundle)

    var bundleMin = uglify.minify(bundle.toString(), {fromString: true})
    log.verbose('bundle', 'Minifying done (size: %d)', bundleMin.code.length)
    log.verbose('bundle', 'Writing bundle min file: ' + path.relative(env_config.paths.project, paths.min))
    fs.writeFileSync(paths.min, bundleMin.code)

    configStore.set('cache.browserifyHash', shasum)
    callback()
  })
}

function getBundleHash (plugins) {
  var content = _(plugins)
  .pluck('pkg')
  .concat(require('hoodie-client/package.json'))
  .map(function (pkg) {
    return pkg.name + '@' + pkg.version
  })
  .sort()
  .value()

  return crypto.createHash('sha256')
  .update(JSON.stringify(content))
  .digest('hex')
}
