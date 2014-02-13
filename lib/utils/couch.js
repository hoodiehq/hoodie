var request = require('request');
var prmpt = require('prompt');
var semver = require('semver');
var async = require('async');

var config = require('../core/config');
var util = require('./index');

/**
 * Checks if CouchDB is in admin party mode
 */

exports.isAdminParty = function (cfg, callback) {
  request({
    url: cfg.couch.url + '/_users/_all_docs',
    method: 'HEAD'
  },
  function (err, res) {
    if (err) {
      return callback(err);
    }
    callback(null, res.statusCode === 200);
  });
};

/**
 * Creates a Pocket admin user
 */

exports.saveAdminUser = function (cfg, couch_user, couch_pwd, user, callback) {
  request({
    url: cfg.couch.url + '/_config/admins/' + encodeURIComponent(user.name),
    method: 'PUT',
    body: JSON.stringify(user.password),
    json: true,
    auth: {
      user: couch_user,
      pass: couch_pwd
    }
  }, callback);
};

/**
 * Prompts the user to create a Hoodie admin account
 */

exports.promptAdminUser = function (callback) {
  if (process.env.CI) {
    // hardcode username as admin for now
    var result = {};
    result.name = 'admin';
    result.password = 'travis-ci';
    return callback(null, result);
  } else {
    prmpt.get({
      properties: {
        password: {
          description: 'Please set an admin password ',
          required: true,
          hidden: true
        }
      }
    },
    function (err, result) {
      // hardcode username as admin for now
      result.name = 'admin';
      return callback(err, result);
    });
  }
};

/**
 * Checks if CouchDB is in admin party mode
 */

exports.checkCouchCredentials = function (cfg, callback) {
  config.getCouchCredentials(cfg, function (err, username, password) {
    if (err) {
      return callback(err);
    }

    if (!username || !password) {
      // missing from config, return a failure
      return callback(null, false);
    }

    request({
      url: cfg.couch.url + '/_users/_all_docs',
      method: 'HEAD',
      auth: {
        user: username,
        pass: password
      }
    },
    function (err, res) {
      if (err) {
        return callback(err);
      }
      callback(null, res.statusCode === 200);
    });
  });
};


/**
 * Check that the stored couchdb credentials still work, prmpt the user
 * to update them if not.
 */

exports.updateCouchCredentials = function (cfg, callback) {
  exports.checkCouchCredentials(cfg, function (err, admin) {
    if (err) {
      return callback(err);
    }

    if (admin) {
      // stored admin user still works
      return callback();
    }

    // stored admin credentials out of date
    exports.promptCouchCredentials(function (err, user, pass) {
      if (err) {
        return callback(err);
      }

      config.setCouchCredentials(cfg, user, pass, function (err) {
        if (err) {
          return callback(err);
        }

        // make sure the new credentials work
        exports.updateCouchCredentials(cfg, callback);
      });
    });
  });
};



/**
 * Checks CouchDB to see if it is at least version 1.2.0
 */

exports.checkCouchVersion = function (config, callback) {

  // 1.2.0 is our minimum supported version
  var compatible = semver.gte(config.couch.version, '1.2.0');

  if (compatible) {
    return callback();
  } else {
    return callback(new Error(
      'The version of CouchDB you are using is out of date.\n' +
      'Please update to the latest version of CouchDB.\n'
    ));
  }

};



/**
 * Ask the user for the CouchDB admin credentials
 */

exports.promptCouchCredentials = function (callback) {
  console.log('Please enter your CouchDB _admin credentials:');
  prmpt.get({
    properties: {
      name: {
        description: 'Username',
        required: true
      },
      password: {
        description: 'Password',
        required: true,
        hidden: true
      }
    }
  },
  function (err, result) {
    if (err) {
      return callback(err);
    }
    return callback(null, result.name, result.password);
  });
};



/**
 * Returns a function which will create the named database
 */

exports.createDB = function (name) {
  return function (cfg, username, password, callback) {
    async.series([
      async.apply(request, {
        url: cfg.couch.url + '/' + encodeURIComponent(name),
        method: 'PUT',
        auth: {
          user: username,
          pass: password
        }
      }),
      async.apply(request, {
        url: cfg.couch.url + '/' + encodeURIComponent(name) + '/_security',
        method: 'PUT',
        auth: {
          user: username,
          pass: password
        },
        json: true,
        body: {
          admins: {roles: ['_admin']},
          members: {roles: ['_admin']}
        }
      }),
    ], callback);
  };
};

/**
 * Sets the admin password on CouchDB to a newly generated password
 */

exports.createCouchCredentials = function (cfg, callback) {
  var username = '_hoodie';
  var password = util.generatePassword();

  async.series([
    async.apply(request, {
      url: cfg.couch.url + '/_config/admins/' + username,
      method: 'PUT',
      body: JSON.stringify(password)
    }),
    async.apply(config.setCouchCredentials, cfg, username, password)
  ],
  callback);
};

/**
 * Creates plugin DB
 */

exports.setupPlugins = function (cfg, callback) {
  config.getCouchCredentials(cfg, function (err, username, password) {
    if (err) {
      return callback(err);
    }

    exports.createDB('plugins')(cfg, username, password, callback);
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
      exports.createDB('app'),
      exports.createAppConfig
    ],
    cfg, username, password, callback);
  });
};

/**
 * Creates a CouchDB user with the appropriate roles to be an admin of
 * this Hoodie instance
 */

exports.createAdminUser = function (cfg, callback) {
  config.getCouchCredentials(cfg, function (err, username, password) {
    if (err) {
      return callback(err);
    }
    if (cfg.admin_password) {
      var user = {
        name: 'admin',
        password: cfg.admin_password
      };
      exports.saveAdminUser(cfg, username, password, user, callback);
    }
    else {
      exports.promptAdminUser(function (err, user) {
        if (err) {
          return callback(err);
        }
        exports.saveAdminUser(cfg, username, password, user, callback);
      });
    }
  });
};


/**
 * Create appconfig doc in plugins database
 */

exports.createAppConfig = function (cfg, username, password, callback) {
  var body;

  try {
    body = JSON.stringify({
      _id : 'config',
      config : {},
      name: cfg.app.name,
      createdAt : new Date(),
      updatedAt : new Date()
    });
  } catch (e) {
    // catch json parse errors
    return callback(e);
  }

  request({
    url: cfg.couch.url + '/app/config',
    method: 'PUT',
    auth: {
      user: username,
      pass: password
    },
    body: body
  }, callback);
};

