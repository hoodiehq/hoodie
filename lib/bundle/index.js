var fs = require('fs')
var path = require('path')

var browserify = require('browserify')
var log = require('../log')

var hr = Array(81).join('/') + '\n'
var bundleTmpl = fs.readFileSync(path.join(__dirname, 'bundle.template'))

function concatPlugins (plugins) {
  return Object.keys(plugins || {})
    .map(function (id) {
      console.log(id, plugins[id])
      return path.resolve(
        plugins[id].path, 'hoodie.' + id.replace(/^hoodie-plugin-/, '') + '.js'
      )
    })
    .filter(function (path) {
      return fs.existsSync(path)
    })
    .map(function (plugin) {
      var src = fs.readFileSync(plugin)
      // `plugin` is an absolute path. Don’t include real file path, use just
      // two last parts in file path.
      var relative = plugin.split('/').slice(-2).join('/')
      return hr + '// ' + relative + '\n' + hr + '\n' + src
    }).join('\n')
}

module.exports = function (env_config, callback) {
  var hoodiejs = require.resolve('hoodie')
  var hoodieConcat = path.join(path.dirname(hoodiejs), 'hoodie-concat.js')
  var hoodieBundle = path.join(env_config.hoodie.data_path, 'hoodie.bundle.js')
  log.info('bundle', 'Creating hoodie browserify bundle...')
  log.verbose('bundle', 'Writing concat file: ' + hoodieConcat)
  fs.writeFileSync(hoodieConcat, bundleTmpl + concatPlugins(env_config.plugins))
  var b = browserify(hoodieConcat, {
    standalone: 'Hoodie',
    external: 'jquery'
  })

  b.bundle(function (err, bundle) {
    if (err) return log.error(err)
    fs.unlinkSync(hoodieConcat)
    log.verbose('bundle', 'Browserifying done (size: %d)', bundle.length)
    log.verbose('bundle', 'Writing bundle file: ' + hoodieBundle)
    fs.writeFileSync(hoodieBundle, bundle)
    callback()
  })
}
