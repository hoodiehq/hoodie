var request = require('request');
var prmpt = require('prompt');
var semver = require('semver');
var async = require('async');

var configStore = require('../core/config_store');
var util = require('./index');

/**
 * Checks if CouchDB is in admin party mode
 */

exports.isAdminParty = function (env_config, callback) {
  request({
    url: env_config.couch.url + '/_users/_all_docs',
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

exports.saveAdminUser = function (env_config, couch_user, couch_pwd, user, callback) {
  request({
    url: env_config.couch.url + '/_config/admins/' + encodeURIComponent(user.name),
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

exports.checkCouchCredentials = function (env_config, callback) {
  configStore.getCouchCredentials(env_config, function (err, username, password) {
    if (err) {
      return callback(err);
    }

    if (!username || !password) {
      // missing from config, return a failure
      return callback(null, false);
    }

    request({
      url: env_config.couch.url + '/_users/_all_docs',
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

exports.updateCouchCredentials = function (env_config, callback) {
  exports.checkCouchCredentials(env_config, function (err, admin) {
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

      configStore.setCouchCredentials(env_config, user, pass, function (err) {
        if (err) {
          return callback(err);
        }

        // make sure the new credentials work
        exports.updateCouchCredentials(env_config, callback);
      });
    });
  });
};



/**
 * Checks CouchDB to see if it is at least version 1.2.0
 */

exports.checkCouchVersion = function (env_config, callback) {

  // 1.2.0 is our minimum supported version
  var compatible = semver.gte(env_config.couch.version, '1.2.0');

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
  return function (env_config, username, password, callback) {
    async.series([
      async.apply(request, {
        url: env_config.couch.url + '/' + encodeURIComponent(name),
        method: 'PUT',
        auth: {
          user: username,
          pass: password
        }
      }),
      async.apply(request, {
        url: env_config.couch.url + '/' + encodeURIComponent(name) + '/_security',
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

exports.createCouchCredentials = function (env_config, callback) {
  var username = '_hoodie';
  var password = util.generatePassword();

  async.series([
    async.apply(request, {
      url: env_config.couch.url + '/_config/admins/' + username,
      method: 'PUT',
      body: JSON.stringify(password)
    }),
    async.apply(configStore.setCouchCredentials, env_config, username, password)
  ],
  callback);
};

/**
 * Creates plugin DB
 */

exports.setupPlugins = function (env_config, callback) {
  configStore.getCouchCredentials(env_config, function (err, username, password) {
    if (err) {
      return callback(err);
    }

    exports.createDB('plugins')(env_config, username, password, callback);
  });
};

/**
 * Create app DB and config doc
 */

exports.setupApp = function (env_config, callback) {
  configStore.getCouchCredentials(env_config, function (err, username, password) {
    if (err) {
      return callback(err);
    }
    async.applyEachSeries([
      exports.createDB('app'),
      exports.createAppConfig
    ],
    env_config, username, password, callback);
  });
};

/**
 * Creates a CouchDB user with the appropriate roles to be an admin of
 * this Hoodie instance
 */

exports.createAdminUser = function (env_config, callback) {
  configStore.getCouchCredentials(env_config, function (err, username, password) {
    if (err) {
      return callback(err);
    }
    if (env_config.admin_password) {
      var user = {
        name: 'admin',
        password: env_config.admin_password
      };
      exports.saveAdminUser(env_config, username, password, user, callback);
    }
    else {
      exports.promptAdminUser(function (err, user) {
        if (err) {
          return callback(err);
        }
        exports.saveAdminUser(env_config, username, password, user, callback);
      });
    }
  });
};


/**
 * Create appconfig doc in plugins database
 */

exports.createAppConfig = function (env_config, username, password, callback) {
  var body;

  try {
    body = JSON.stringify({
      _id : 'config',
      config : {},
      name: env_config.app.name,
      createdAt : new Date(),
      updatedAt : new Date()
    });
  } catch (e) {
    // catch json parse errors
    return callback(e);
  }

  request({
    url: env_config.couch.url + '/app/config',
    method: 'PUT',
    auth: {
      user: username,
      pass: password
    },
    body: body
  }, callback);
};

/**
 * Changes the CouchDB configuration
 */
exports.setConfig = function (env_config, section, key, value, callback) {
  configStore.getCouchCredentials(env_config, function (err, username, password) {
    if (err) {
      return callback(err);
    }

    request({
      url: env_config.couch.url + '/_config/' + section + '/' + key,
      method: 'PUT',
      auth: {
        user: username,
        pass: password
      },
      body: JSON.stringify(value)
    }, callback);
  });
};


/**
 * Find CouchDB locations
 */

exports.getCouch = function (env) {

  var couch = {
    run: true // start local couch
  };

  // if COUCH_URL is set in the environment,
  // we don't attempt to start our own instance
  // of CouchDB, but just use the one provided
  // to us there.

  if (env.COUCH_URL) {
    couch.url = env.COUCH_URL;
    couch.run = false;
    return couch;
  }

  return couch;
};

