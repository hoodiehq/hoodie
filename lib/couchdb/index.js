/**
 * Starts a local CouchDB instance using the Hoodie app's data
 * directory for storage.
 */

var path = require('path')

var async = require('async')
var spinner = require('char-spinner')
var MultiCouch = require('multicouch')
var request = require('request')

var hoodieCouchUtils = require('../utils/couch')
var installer = require('./installer')

exports.installer = installer

/**
 * Starts the CouchDB server using multicouch
 */

exports.startMultiCouch = function (env_config, callback) {
  // skip local couch server on some platforms
  if (!env_config.couch.run) {
    console.log('Using remote CouchDB: ' + env_config.couch.url)
    return process.nextTick(callback)
  }

  // MultiCouch env_config object
  var couch_cfg = {
    port: env_config.couch.port,
    prefix: env_config.hoodie.data_path,
    couchdb_path: env_config.couch.bin,
    default_sys_ini: env_config.couch.default_ini,
    respawn: false, // otherwise causes problems shutting down on ctrl-c
    session_timeout: (60 * 60 * 24 * 2).toString() // 2 days
  }

  // starts a local couchdb server using the Hoodie app's data dir
  var couchdb = new MultiCouch(couch_cfg)

  // used to pass startup errors to callback
  var started = false

  // local couchdb has started
  couchdb.on('start', function () {
    started = true

    return callback()
  })

  // report errors from couchdb
  couchdb.on('error', function (err) {
    if (!started) {
      return callback(err) // pass startup error to callback
    } else {
      // log couchdb errors after server is started
      console.log('CouchDB Error: %j', err)
    }
  })

  // shutdown the couch server if the hoodie-app server is stopped
  process.on('exit', function (code) {
    exports.stop(couchdb, function () {
      process.exit(code)
    })
  })

  // on ctrl-c, stop couchdb first, then exit.
  process.on('SIGINT', function () {
    exports.stop(couchdb, function () {
      process.exit(0)
    })
  })

  // handle SIGTERM gracefully as well
  process.on('SIGTERM', function () {
    exports.stop(couchdb, function () {
      process.exit(0)
    })
  })

  couchdb.start()

  return couchdb
}

/**
 * Polls CouchDB during startup so we know when we can make
 * requests against it
 */

exports.pollCouch = function (env_config, callback) {
  // when to stop polling and give up!
  var end = new Date().getTime() + 20000 // 20 second timeout
  var interval = 200 // poll every 200ms

  // relevant couchdb log files
  var logfiles = [
    '\t' + path.resolve(env_config.hoodie.data_path, 'couch.stderr'),
    '\t' + path.resolve(env_config.hoodie.data_path, 'couch.stdout'),
    '\t' + path.resolve(env_config.hoodie.data_path, 'couch.log')
  ]

  // start drawing a waiting indicator to console
  console.log('Waiting for CouchDB')
  var spinnerInterval = spinner()

  function _poll () {
    request(env_config.couch.url, function (er, res, body) {
      clearInterval(spinnerInterval)

      if (res && res.statusCode === 200) {
        // set Couch version so we can check later
        env_config.couch.version = JSON.parse(body).version

        console.log('CouchDB started')
        return callback()
      }

      // CouchDB not available yet
      if (new Date().getTime() >= end) {
        // Exceeded timeout value

        console.log('CouchDB failed')
        return callback(new Error(
          'Timed out waiting for CouchDB. ' +
          'These logs may help:\n' +
          logfiles.join('\n')
        ))
      }
      // wait and try again
      return setTimeout(_poll, interval)
    })
  }

  // start polling
  _poll()
}

/*
 * Starts the CouchDB server and waits for it to be responsive
 * before calling the callback
 */

exports.start = async.applyEachSeries([
  exports.startMultiCouch,
  exports.pollCouch,
  hoodieCouchUtils.checkCouchVersion
])

/**
 * Stops the provided CouchDB server
 */

exports.stop = function (couchdb, callback) {
  console.log('\nStopping CouchDB...')
  couchdb.once('stop', callback)
  couchdb.stop()
}
