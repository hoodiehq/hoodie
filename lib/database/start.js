/**
 * Starts a local PouchDB instance using the Hoodie app's data
 * directory for storage.
 */

var url = require('url')
var path = require('path')

var _ = require('lodash')
var log = require('npmlog')
var request = require('request')
var semver = require('semver')
var spawnPouchDBServer = require('spawn-pouchdb-server')

var exports = module.exports = function (env_config, callback) {
  if (!env_config.db.start) {
    return exports.checkExternalCouch(url.format(env_config.db), callback)
  }

  var spawnConf = {
    port: env_config.db.port,
    directory: env_config.paths.data,
    couchdb: {
      database_dir: path.join(env_config.paths.data, 'couch')
    },
    log: {
      file: path.join(env_config.paths.data, 'pouch.log')
    },
    config: {
      file: path.join(env_config.paths.data, 'pouch-config.json')
    }
  }

  if (env_config.db.inMemory) {
    log.info('database', 'Memory – changes will not be persisted onto disk')
    spawnConf.backend = false
  }

  spawnPouchDBServer(spawnConf, function (err) {
    if (err) {
      log.error('database', 'Could not start PouchDB Server for you', err)
      return callback(err)
    }

    log.info('database', 'PouchDB Server started')

    // create couch admin user
    log.verbose('database', 'Creating database admin')
    request({
      url: url.format(_.omit(env_config.db, 'auth')) + '/_config/admins/_hoodie',
      method: 'PUT',
      json: true,
      body: env_config.db.auth.replace(/^.*:/, '')
    }, callback)
  })
}

/**
 * Checks CouchDB to see if it is at least version 1.2.0
 */

exports.checkExternalCouch = function (couch_url, callback) {
  log.info('database', 'Using external: ' + couch_url)
  log.silly('database', 'Checking for support')

  request(couch_url, function (err, res, body) {
    if (err || (res && res.statusCode !== 200)) {
      log.error('database', 'Could not find CouchDB at ' + couch_url)
      return callback(err)
    }

    var data = JSON.parse(body)

    var version = data.version
    var vendor = _.findKey(data, function (prop) {
      return /^welcome/i.test(prop)
    })

    if (vendor !== 'couchdb' && vendor !== 'express-pouchdb') {
      log.warn(
        'database',
        'You are not running an official CouchDB distribution, ' +
        'but "' + vendor + '". ' +
        'This might not be fully supported. Proceed at your own risk.'
      )

      return callback(null)
    }

    if (vendor === 'express-pouchdb') {
      log.verbose('database', 'External vendor (' + vendor + ') supported')
      return callback(null)
    }

    log.silly('database', 'Checking if CouchDB is above 1.2.0')
    var compatible = semver.gte(version, '1.2.0')

    if (compatible) {
      log.verbose('database', 'CouchDB is above 1.2.0 (' + version + ')')
      return callback(null)
    }

    return callback(new Error(
     'Version ' + version + ' of CouchDB you are using is out of date.\n' +
     'Please update to the latest version of CouchDB.\n'
    ))
  })
}
