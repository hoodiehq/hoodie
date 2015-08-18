var fs = require('fs')
var path = require('path')

var browserify = require('browserify')
var log = require('../log')

function getPlugins (plugins) {
  return (Object.keys(plugins) || [])
    .map(function (id) {
      return require.resolve(id + '/hoodie.' + id.replace(/^hoodie-plugin-/, '') + '.js')
    })
    .filter(fs.existsSync)
}

module.exports = function (env_config, callback) {
  var hoodieBundle = path.join(env_config.hoodie.data_path, 'hoodie.bundle.js')
  log.info('bundle', 'Creating hoodie browserify bundle...')
  var files = [require.resolve('hoodie')].concat(getPlugins(env_config.plugins))
  var b = browserify(files, {
    standalone: 'Hoodie',
    external: 'jquery'
  })

  b.bundle(function (err, bundle) {
    if (err) return log.error(err)
    log.verbose('bundle', 'Browserifying done (size: %d)', bundle.length)
    log.verbose('bundle', 'Writing bundle file: ' + hoodieBundle)
    fs.writeFileSync(hoodieBundle, bundle)
    callback()
  })
}
