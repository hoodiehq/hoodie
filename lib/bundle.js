var crypto = require('crypto')
var fs = require('fs')
var path = require('path')

var browserify = require('browserify')
var uglify = require('uglify-js')
var _ = require('lodash')

var log = require('./log')

function getPlugins (plugins) {
  return Object.keys(plugins || {})
    .map(function (id) {
      try {
        return require.resolve(id + '/hoodie.' + id.replace(/^hoodie-plugin-/, '') + '.js')
      } catch (e) {
        return './not_found'
      }
    })
    .filter(fs.existsSync)
}

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

function configPath (dataPath) {
  return path.join(dataPath, 'config.json')
}

function readConfig (dataPath) {
  try {
    return JSON.parse(fs.readFileSync(configPath(dataPath), 'utf8'))
  } catch (e) {
    return {}
  }
}

function writeConfig (dataPath, conf) {
  fs.writeFileSync(
    configPath(dataPath),
    JSON.stringify(_.assign(readConfig(dataPath), conf), null, 2) + '\n'
  )
}

module.exports = function (env_config, callback) {
  var shasum = crypto.createHash('sha256')
  .update(JSON.stringify(getPackages(env_config.plugins)))
  .digest('hex')
  var conf = readConfig(env_config.hoodie.data_path)
  var hoodieBundle = path.join(env_config.hoodie.data_path, 'hoodie.bundle.js')
  var hoodieBundleMin = path.join(env_config.hoodie.data_path, 'hoodie.bundle.min.js')
  if (conf.cache &&
    conf.cache.browserifyHash === shasum &&
    fs.existsSync(hoodieBundle) &&
    fs.existsSync(hoodieBundleMin)) {
    log.info('bundle', 'Found cached browserify bundle')
    return callback()
  }
  log.info('bundle', 'Creating hoodie browserify bundle...')
  var hoodiejs = require.resolve('hoodie')
  var files = [hoodiejs].concat(getPlugins(env_config.plugins))
  var b = browserify({
    fullPaths: false,
    standalone: 'Hoodie'
  })

  b.require(hoodiejs, {expose: 'hoodie'})
  b.add(files)

  b.bundle(function (err, bundle) {
    if (err) return log.error(err)
    log.verbose('bundle', 'Browserifying done (size: %d)', bundle.length)
    log.verbose('bundle', 'Writing bundle file: ' + path.relative(env_config.project_dir, hoodieBundle))
    fs.writeFileSync(hoodieBundle, bundle)
    var bundleMin = uglify.minify(bundle.toString(), {fromString: true})
    log.verbose('bundle', 'Minifying done (size: %d)', bundleMin.code.length)
    log.verbose('bundle', 'Writing bundle min file: ' + path.relative(env_config.project_dir, hoodieBundleMin))
    fs.writeFileSync(hoodieBundleMin, bundleMin.code)
    writeConfig(env_config.hoodie.data_path, {cache: {browserifyHash: shasum}})
    callback()
  })
}
