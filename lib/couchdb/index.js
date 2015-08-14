/**
 * Starts a local PouchDB instance using the Hoodie app's data
 * directory for storage.
 */

var path = require('path')

var _ = require('lodash')
var clc = require('cli-color')
var request = require('request')
var semver = require('semver')
var spawnPouchDBServer = require('spawn-pouchdb-server')

/**
 * Checks if the provided CouchDB-ish is compatible.
 * If none is provied spawns a PouchDB Server.
 */

exports.start = function (env_config, callback) {
  // If there is an external CouchDB we confirm it's supported
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
  if (env_config.inMemory) {
    console.warn('Database is in-memory! No changes will be saved!')
    spawnConf.backend = false
  }
  spawnPouchDBServer(spawnConf, function (err) {
    if (err) {
      console.error('Could not start PouchDB Server for you', err)
      return callback(err)
    }

    console.error('PouchDB Server started')
    callback(null)
  })
}

/**
 * Checks CouchDB to see if it is at least version 1.2.0
 */

exports.checkExternalCouch = function (couch_url, callback) {
  request(couch_url, function (err, res, body) {
    if (err || (res && res.statusCode !== 200)) {
      console.error('Could not find CouchDB at ' + couch_url)
      return callback(err)
    }

    console.error('Using remote CouchDB: ' + couch_url)

    var data = JSON.parse(body)

    var version = data.version
    var vendor = _.findKey(data, function (prop) {
      return /^welcome/i.test(prop)
    })

    if (vendor !== 'couchdb' || vendor !== 'express-pouchdb') {
      console.error(
        clc.yellow('Warning:') +
        ' You are not running the official CouchDB distribution, ' +
        'but "' + vendor + '". ' +
        'This might not be fully supported. Proceed at your own risk.'
      )

      return callback(null)
    }

    // 1.2.0 is our minimum supported version
    var compatible = semver.gte(version, '1.2.0')

    if (compatible) {
      return callback(null)
    }

    return callback(new Error(
     'Version ' + version + ' of CouchDB you are using is out of date.\n' +
     'Please update to the latest version of CouchDB.\n'
    ))
  })
}
