module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie'
}

var path = require('path')
var urlParse = require('url').parse

var corsHeaders = require('hapi-cors-headers')
var hoodieServer = require('@hoodie/server').register
var log = require('npmlog')
var PouchDB = require('pouchdb-core')
var _ = require('lodash')

var registerPlugins = require('./plugins')

function register (server, options, next) {
  options = _.cloneDeep(options)
  if (!options.db) {
    options.db = {}
  }

  // mapreduce is required for `db.query()`
  PouchDB.plugin(require('pouchdb-mapreduce'))

  if (!options.db.url) {
    if (options.inMemory) {
      PouchDB.plugin(require('pouchdb-adapter-memory'))
      log.info('config', 'Storing all data in memory only')
    } else {
      PouchDB.plugin(require('pouchdb-adapter-leveldb'))

      // this is a temporary workaround until we replace options.db with options.PouchDB:
      // https://github.com/hoodiehq/hoodie/issues/555
      if (!options.paths) {
        options.paths = {
          data: '.hoodie',
          public: 'public'
        }
      }
      if (!options.paths.data) {
        options.paths.data = '.hoodie'
      }

      options.db.prefix = path.join(options.paths.data, 'data' + path.sep)
      log.info('config', 'No CouchDB URL provided, falling back to PouchDB')
      log.info('config', 'Writing PouchDB database files to ' + options.db.prefix)
    }
  }

  if (options.db.url) {
    if (!urlParse(options.db.url).auth) {
      return next(new Error('Authentication details missing from database URL: ' + options.db.url))
    }

    PouchDB.plugin(require('pouchdb-adapter-http'))
    options.db.prefix = options.db.url
    delete options.db.url
  }

  options.PouchDB = PouchDB.defaults(options.db)
  delete options.db

  server.ext('onPreResponse', corsHeaders)

  registerPlugins(server, options, function (error) {
    if (error) {
      return next(error)
    }

    server.register({
      register: hoodieServer,
      options: options
    }, function (error) {
      if (error) {
        return next(error)
      }

      next(null, server, options)
    })
  })
}
