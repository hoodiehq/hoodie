var child_process = require('child_process')
var fs = require('fs')
var urlParse = require('url').parse

var async = require('async')
var mkdirp = require('mkdirp')
var MultiCouch = require('multicouch')
var request = require('request')
var rimraf = require('rimraf')

var couch

var couch_env = (function () {
  var localCouch = {}
  // check filesystem for likely couch paths
  if (fs.existsSync('/usr/local/bin/couchdb')) {
    localCouch.bin = '/usr/local/bin/couchdb'
    localCouch.default_ini = '/usr/local/etc/couchdb/default.ini'
  } else if (fs.existsSync('/opt/local/bin/couchdb')) {
    localCouch.bin = '/opt/local/bin/couchdb'
    localCouch.default_ini = '/opt/local/etc/couchdb/default.ini'
  } else if (fs.existsSync('/usr/bin/couchdb')) {
    localCouch.bin = '/usr/bin/couchdb'
    localCouch.default_ini = '/etc/couchdb/default.ini'
  }

  return localCouch

}())

exports.setupCouch = function (opts, callback) {
  var cmd = 'pkill -fu ' + process.env.LOGNAME + ' ' + opts.data_dir

  child_process.exec(cmd, function () {
    async.series([
      async.apply(rimraf, opts.data_dir),
      async.apply(mkdirp, opts.data_dir),
      async.apply(startCouch, opts),
      async.apply(createAdmin, opts)
    ], function (err) {
      if (err) {
        return callback(err)
      }
      process.setMaxListeners(100)
      process.on('exit', function (code) {
        couch.once('stop', function () {
          process.exit(code)
        })
        couch.stop()
      })
      callback(null, couch)
    })
  })
}

function startCouch (opts, callback) {
  // MultiCouch config object
  var couch_cfg = {
    port: urlParse(opts.url).port,
    prefix: opts.data_dir,
    couchdb_path: couch_env.bin,
    default_sys_ini: couch_env.default_init,
    respawn: false // otherwise causes problems shutting down
  }
  // starts a local couchdb server using the Hoodie app's data dir
  var couchdb = new MultiCouch(couch_cfg)
  couch = couchdb
  // local couchdb has started
  couchdb.on('start', function () {
    // give it time to be ready for requests
    pollCouch(opts, couchdb, function (err) {
      if (err) {
        return callback(err)
      }
      return callback()
    })
  })
  couchdb.on('error', callback)
  couchdb.start()
}

function createAdmin (opts, callback) {
  request({
    url: opts.url + '/_config/admins/' + opts.user,
    method: 'PUT',
    body: JSON.stringify(opts.pass)
  }, callback)
}

function pollCouch (opts, couchdb, callback) {
  function _poll () {
    var options = {
      url: opts.url + '/_all_dbs',
      json: true
    }

    request(options, function (er, res, body) {
      if (res && res.statusCode === 200 && body.length === 2) {
        return callback(null, couchdb)
      } else {
        // wait and try again
        return setTimeout(_poll, 100)
      }
    })
  }
  // start polling
  _poll()
}
