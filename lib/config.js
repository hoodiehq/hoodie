module.exports = getConfig

var fs = require('fs')
var path = require('path')
var url = require('url')

var log = require('npmlog')
var mkdirp = require('mkdirp')

function getConfig (options) {
  var projectPath = process.cwd()

  var pkg = require(path.join(projectPath, 'package.json'))

  var config = {
    name: pkg.name,
    paths: {
      data: options.data || path.join(projectPath, '.hoodie'),
      public: options.public || path.join(projectPath, 'public')
    },
    db: {},
    admin: {},
    account: options.account || {}
  }

  var publicFolderExists
  try {
    publicFolderExists = fs.statSync(config.paths.public).isDirectory()
  } catch (err) {
    publicFolderExists = false
  }

  if (!publicFolderExists) {
    config.paths.public = path.resolve(__dirname, '../public')
    log.info('config', 'The "public" app path does not exist. Serving ' + config.paths.public)
  }

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
    log.info('config', 'No CouchDB URL provided, falling back to PouchDB')

    if (options.inMemory) {
      log.info('config', 'Not writing any files, all data is stored in memory.')
      config.db.db = require('memdown')
    } else {
      config.db.prefix = path.join(config.paths.data, 'data/')
      mkdirp.sync(config.db.prefix)
      log.info('config', 'Writing database files to ' + config.db.prefix)
    }
  }

  return config
}
