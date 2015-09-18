var crypto = require('crypto')
var fs = require('fs')
var path = require('path')

var _ = require('lodash')
var browserify = require('browserify')
var log = require('npmlog')
var uglify = require('uglify-js')

function getPackages (plugins) {
  return Object.keys(plugins || {})
    .map(function (id) {
      return require.resolve(id + '/package.json')
    })
    .filter(fs.existsSync)
    .concat([require.resolve('hoodie/package.json')])
    .map(function (file) {
      return JSON.parse(fs.readFileSync(file, 'utf8'))
    })
    .map(function (pkg) {
      return pkg.name + '@' + pkg.version
    })
    .sort()
}

var template = (function () {
/*
var plugins = [<PLUGINS>]


module.exports = (function () {
  var Hoodie =  require('hoodie-client')
  var hoodie = new Hoodie()
  hoodie.plugin(plugins)
  return hoodie
})()
*/
}).toString().split(/\n/).slice(2, -2).join('\n')

module.exports = function (env_config, callback) {
  var shasum = crypto.createHash('sha256')
  .update(JSON.stringify(getPackages(env_config.plugins)))
  .digest('hex')
  var configStore = require('./config-store')(env_config.paths.data)
  var hoodieBundle = path.join(env_config.paths.data, 'hoodie.bundle.js')
  var hoodieBundleMin = path.join(env_config.paths.data, 'hoodie.bundle.min.js')
  if (configStore.get('cache.browserifyHash') === shasum &&
    fs.existsSync(hoodieBundle) &&
    fs.existsSync(hoodieBundleMin)) {
    log.info('bundle', 'Found cached browserify bundle')
    return callback()
  }
  log.info('bundle', 'Creating hoodie browserify bundle...')
  var hoodiejs = require.resolve('hoodie')

  var hoodieConcat = path.join(env_config.paths.project, '.hoodie.concat.js')
  fs.writeFileSync(hoodieConcat,
    template.replace('<PLUGINS>', _.pluck(_.values(env_config.plugins), 'path').map(function (p) {
      p = path.relative(env_config.paths.project, path.join(p, 'client'))
      return "require(\'" + p + "\')"
    }).join(', '))
  )

  var b = browserify(hoodieConcat, {
    fullPaths: false,
    standalone: 'Hoodie'
  })

  b.bundle(function (err, bundle) {
    if (err) return log.error(err)
    fs.unlinkSync(hoodieConcat)
    log.verbose('bundle', 'Writing bundle file: ' + path.relative(env_config.paths.project, hoodieBundle))
    fs.writeFileSync(hoodieBundle, bundle)
    log.verbose('bundle', 'Browserifying done (size: %d)', bundle.length)
    var bundleMin = uglify.minify(bundle.toString(), {fromString: true})
    log.verbose('bundle', 'Writing bundle min file: ' + path.relative(env_config.paths.project, hoodieBundleMin))
    fs.writeFileSync(hoodieBundleMin, bundleMin.code)
    log.verbose('bundle', 'Minifying done (size: %d)', bundleMin.code.length)
    configStore.set('cache.browserifyHash', shasum)
    callback()
  })
}
