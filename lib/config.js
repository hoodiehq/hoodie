var fs = require('fs')
var path = require('path')
var url = require('url')

var _ = require('lodash')
var log = require('npmlog')
var mkdirp = require('mkdirp')
var ports = require('ports')
var randomString = require('random-string')

module.exports = function (options) {
  var projectPath = options.path || process.cwd()

  var pkg = require(path.join(projectPath, 'package.json'))

  var config = {
    name: pkg.name,
    paths: {
      data: options.data || path.join(projectPath, 'data'),
      project: projectPath,
      www: options.www || path.join(projectPath, 'www')
    }
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

  var bindAddress = options.bindAddress || '127.0.0.1'
  var configStore = require('./config-store')(config.paths.data)
  var id

  if (options.id) {
    id = options.id
    configStore.set('id', options.id)
  } else {
    id = configStore.get('id')
  }

  if (!id) {
    id = randomString()
    configStore.set('id', id)
  }

  config.app = {
    hostname: bindAddress,
    port: options.port || ports.getPort(id + '-app'),
    protocol: 'http'
  }

  config.admin = {
    password: options.adminPassword
  }

  if (options.dbUrl) {
    config.db = url.parse(options.dbUrl)
    return config
  }

  config.db = {
    hostname: bindAddress,
    port: options.dbPort || ports.getPort(id + '-db'),
    protocol: 'http',
    start: true,
    inMemory: options.inMemory
  }

  config.db.auth = configStore.get('dbAuth')

  if (config.db.auth && options.dbPassword) {
    log.warn('config', 'Database password already set')
  }

  if (!config.db.auth) {
    config.db.password = options.dbPassword || randomString()
    config.db.auth = '_hoodie:' + config.db.password
    configStore.set('dbAuth', config.db.auth)
  }

  if (!config.db.auth) {
    throw new Error('Authentication details missing from database URL')
  }

  if (!config.db.password) {
    config.db.password = config.db.auth.split(':')[1]
  }

  require('deep-freeze')(config)
  return config
}
