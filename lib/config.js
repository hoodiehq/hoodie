var fs = require('fs')
var path = require('path')
var url = require('url')

var _ = require('lodash')
var log = require('npmlog')
var mkdirp = require('mkdirp')

module.exports = function (options) {
  var projectPath = options.path || process.cwd()

  var pkg = require(path.join(projectPath, 'package.json'))

  var config = {
    name: pkg.name,
    paths: {
      data: options.data || path.join(projectPath, 'data'),
      project: projectPath,
      www: options.www || path.join(projectPath, 'www')
    },
    db: {}
  }

  var wwwExists
  try {
    wwwExists = fs.statSync(config.paths.www).isDirectory()
  } catch (err) {
    wwwExists = false
  }

  if (!wwwExists) {
    log.info('config', 'The "www" app path does not exist. Using default Hoodie app.')
    config.paths.www = path.dirname(require.resolve('my-first-hoodie'))
  }

  _.each(_.values(config.paths), _.ary(mkdirp.sync, 1))

  config.app = {
    hostname: options.bindAddress || '127.0.0.1',
    port: options.port || 8080,
    protocol: 'http'
  }

  if (options.dbUrl) {
    config.db.url = options.dbUrl
    if (!url.parse(options.dbUrl).auth) {
      log.warn('config', 'Authentication details missing from database URL')
    }
  } else {
    log.warn('config', 'No database URL provided, falling back to PouchDB')
  }

  if (options.inMemory) {
    config.db.db = require('memdown')
  }

  return config
}
