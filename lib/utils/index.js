var crypto = require('crypto')

var async = require('async')
var mkdirp = require('mkdirp')

/**
 * Generates a password for the internal couch admin user
 * used by hoodie and associated plugins
 */

exports.generatePassword = function () {
  return crypto.randomBytes(256).toString('base64')
}

/**
 * Ensures a directory exists using mkdir -p.
 *
 * @param {String} path
 * @param {Function} callback
 * @api public
 */

exports.ensureDir = function (path, callback) {
  mkdirp(path, callback)
}

/**
 * Makes sure the appropriate app directories exists
 */

exports.ensurePaths = function (env_config, callback) {
  var paths = [env_config.hoodie.data_path]

  async.map(paths, exports.ensureDir, callback)
}

exports.processSend = function (env_config, callback) {
  if (!process.send) return callback(null)

  process.send({
    app: {
      started: true
    },
    pid: process.pid,
    stack: {
      couch: {
        port: Number(env_config.couch.port),
        host: env_config.host
      },
      www: {
        port: env_config.www_port,
        host: env_config.host
      },
      admin: {
        port: env_config.admin_port,
        host: env_config.host
      }
    }
  })

  return callback(null)
}
