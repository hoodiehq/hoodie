/**
 * Starts a local PouchDB instance using the Hoodie app's data
 * directory for storage.
 */

var path = require('path')

var _ = require('lodash')
var request = require('request')
var semver = require('semver')
var spawnPouchDBServer = require('spawn-pouchdb-server')

var log = require('../log')

exports.start = function (env_config, callback) {
  if (!env_config.couch.run) {
    return exports.checkExternalCouch(env_config.couch.url, callback)
  }

  var project_dir = env_config.project_dir
  var spawnConf = {
    port: parseInt(env_config.couch.port, 10),
    directory: path.join(project_dir, 'data'),
    couchdb: {
      database_dir: path.join(project_dir, 'data', 'couch')
    },
    log: {
      file: path.join(project_dir, 'data', 'pouch.log')
    },
    config: {
      file: path.join(project_dir, 'data', 'pouch-config.json')
    }
  }
  if (env_config.in_memory) {
    log.info('database', 'Memory – changes will not be persisted onto disk')
    spawnConf.backend = false
  }
  spawnPouchDBServer(spawnConf, function (err) {
    if (err) {
      log.error('database', 'Could not start PouchDB Server for you', err)
      return callback(err)
    }

    log.info('database', 'PouchDB Server started')
    callback(null)
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

    if (vendor !== 'couchdb' || vendor !== 'express-pouchdb') {
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
