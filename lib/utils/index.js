var mkdirp = require('mkdirp');
var async = require('async');
var crypto = require('crypto');

var hconsole = require('./hconsole');
var configStore = require('../core/config_store');

exports.hconsole = hconsole;

/**
 * Generates a password for the internal couch admin user
 * used by hoodie and associated plugins
 */

exports.generatePassword = function () {
  return crypto.randomBytes(256).toString('base64');
};


/**
 * Ensures a directory exists using mkdir -p.
 *
 * @param {String} path
 * @param {Function} callback
 * @api public
 */

exports.ensureDir = function (path, callback) {
  mkdirp(path, callback);
};

/**
 * Creates a deep-clone of a JSON-serializable object
 *
 * @param obj - the object to serialize
 * @api public
 */

exports.jsonClone = function (obj) {
  return JSON.parse(JSON.stringify(obj));
};


/**
 * Makes sure the appropriate app directories exists
 */

exports.ensurePaths = function (env_config, callback) {
  var paths = [env_config.hoodie.data_path];

  async.map(paths, exports.ensureDir, callback);
};

exports.processSend = function (env_config, callback) {
  if (process.send) {
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
    });
  }
  return callback();
};


/**
 * Attempts to detect a Nodejitsu environment
 */

exports.isNodejitsu = function (env) {
  return !!(env.SUBDOMAIN);
};


exports.showConfigPath = function (env_config, callback) {
  if (env_config.verbose) {
    console.log('Reading config from %s.', configStore.path(env_config));
  }
  return callback();
};
