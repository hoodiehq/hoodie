/**
 * Sets up CouchDB admin and Hoodie related dbs
 */

var async = require('async');

var config = require('../core/config');
var couchUtils = require('../utils/couch');


/**
 * Creates internal admin user and prmpts for Hoodie admin
 */

exports.setupUsers = function (cfg, callback) {
  couchUtils.isAdminParty(cfg, function (err, party) {
    if (err) {
      return callback(err);
    }

    if (party) {
      async.applyEachSeries([
        couchUtils.createCouchCredentials,
        couchUtils.createAdminUser
      ],
      cfg, callback);
    } else {
      couchUtils.updateCouchCredentials(cfg, callback);
    }
  });
};

/**
 * Create app DB and config doc
 */

exports.setupApp = function (cfg, callback) {
  config.getCouchCredentials(cfg, function (err, username, password) {
    if (err) {
      return callback(err);
    }
    async.applyEachSeries([
      couchUtils.createDB('app'),
      couchUtils.createAppConfig
    ],
    cfg, username, password, callback);
  });
};

/**
 * Creates plugin DB
 */

exports.setupPlugins = function (cfg, callback) {
  config.getCouchCredentials(cfg, function (err, username, password) {
    if (err) {
      return callback(err);
    }

    couchUtils.createDB('plugins')(cfg, username, password, callback);
  });
};


/**
 * Checks CouchDB for required users/dbs, prmpts user for info
 * where appropriate
 */

exports.install = async.applyEachSeries([
  exports.setupUsers,
  exports.setupApp,
  exports.setupPlugins
]);
