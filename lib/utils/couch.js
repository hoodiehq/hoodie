var async = require('async')
var prmpt = require('prompt')
var request = require('request')

var credentials = require('../couchdb/credentials')
var util = require('./index')
var log = require('./log')

exports.isAdminParty = function (env_config, callback) {
  log.silly('Checking if database is in admin party mode')
  request.get(
    env_config.couch.url + '/_users/_all_docs',
    function (err, res) {
    if (err) {
      return callback(err)
    }

    callback(null, res.statusCode === 200)
  })
}

exports.saveAdminUser = function (env_config, couch_user, couch_pwd, user, callback) {
  log.silly('Creating a admin-dashboard admin user')

  request({
    url: env_config.couch.url + '/_config/admins/' + encodeURIComponent(user.name),
    method: 'PUT',
    body: user.password,
    json: true,
    auth: {
      user: couch_user,
      pass: couch_pwd
    }
  }, callback)
}

exports.promptAdminUser = function (callback) {
  if (process.env.CI) {
    // hardcode username as admin for now
    var result = {}
    result.name = 'admin'
    result.password = 'travis-ci'
    return callback(null, result)
  }

  prmpt.get({
    properties: {
      password: {
        description: 'Please set an admin password ',
        required: true,
        hidden: true
      }
    }
  }, function (err, result) {
    // hardcode username as admin for now
    result.name = 'admin'
    return callback(err, result)
  })
}

exports.checkCouchCredentials = function (env_config, callback) {
  var couchdb = credentials.get(env_config.hoodie.data_path)

  if (!couchdb.username || !couchdb.password) {
    // missing from config, return a failure
    return callback(null, false)
  }

  request({
    url: env_config.couch.url + '/_users/_all_docs',
    method: 'GET',
    auth: {
      user: couchdb.username,
      pass: couchdb.password
    }
  }, function (err, res) {
    if (err) {
      return callback(err)
    }
    callback(null, res.statusCode === 200)
  })
}

exports.updateCouchCredentials = function (env_config, callback) {
  log.silly('Checking if provided database credentials work')

  exports.checkCouchCredentials(env_config, function (err, admin) {
    if (err) {
      return callback(err)
    }

    if (admin) {
      log.verbose('Provided database credentials work')
      return callback()
    }

    exports.promptCouchCredentials(function (err, user, pass) {
      if (err) {
        return callback(err)
      }

      credentials.set(env_config.hoodie.data_path, user, pass)

      exports.updateCouchCredentials(env_config, callback)
    })
  })
}

exports.promptCouchCredentials = function (callback) {
  console.log('Please enter your database _admin credentials:')
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
  }, function (err, result) {
    if (err) {
      return callback(err)
    }
    return callback(null, result.name, result.password)
  })
}

exports.createDB = function (name) {
  return function (env_config, username, password, callback) {
    log.silly('Creating database "' + name + '"')
    var auth = {
      user: username,
      pass: password
    }

    async.series([
      async.apply(request, {
        url: env_config.couch.url + '/' + encodeURIComponent(name),
        method: 'PUT',
        auth: auth
      }),
      async.apply(request, {
        url: env_config.couch.url + '/' + encodeURIComponent(name) + '/_security',
        method: 'PUT',
        auth: auth,
        json: true,
        body: {
          admins: {roles: ['_admin']},
          members: {roles: ['_admin']}
        }
      })
    ], function (err) {
      if (err) {
        log.verbose('Could not create database "' + name + '"')
      }

      log.info('Created database "' + name + '"')
      callback.apply(null, arguments)
    })
  }
}

exports.createCouchCredentials = function (env_config, callback) {
  log.verbose('Generating and storing the admin password in the database')

  var username = '_hoodie'
  var password = util.generatePassword()

  request({
    url: env_config.couch.url + '/_config/admins/' + username,
    method: 'PUT',
    body: JSON.stringify(password)
  }, function (err) {
    if (err) return callback(err)

    credentials.set(env_config.hoodie.data_path, username, password)
    callback(null)
  })
}

exports.setupPlugins = function (env_config, callback) {
  var couchdb = credentials.get(env_config.hoodie.data_path)

  exports.createDB('plugins')(env_config, couchdb.username, couchdb.password, callback)
}

exports.setupApp = function (env_config, callback) {
  var couchdb = credentials.get(env_config.hoodie.data_path)

  async.applyEachSeries([
    exports.createDB('app'),
    exports.createAppConfig
  ], env_config, couchdb.username, couchdb.password, callback)
}

exports.createAdminUser = function (env_config, callback) {
  log.verbose('Creating database user that is an admin of this Hoodie instance')

  var couchdb = credentials.get(env_config.hoodie.data_path)

  if (env_config.admin_password) {
    var user = {
      name: 'admin',
      password: env_config.admin_password
    }

    return exports.saveAdminUser(env_config, couchdb.username, couchdb.password, user, callback)
  }

  exports.promptAdminUser(function (err, user) {
    if (err) {
      return callback(err)
    }

    exports.saveAdminUser(env_config, couchdb.username, couchdb.password, user, callback)
  })
}

exports.createAppConfig = function (env_config, username, password, callback) {
  log.verbose('Creating appconfig document in plugins database')

  var body = JSON.stringify({
    _id: 'config',
    config: {},
    name: env_config.app.name,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  request({
    url: env_config.couch.url + '/app/config',
    method: 'PUT',
    auth: {
      user: username,
      pass: password
    },
    body: body
  }, callback)
}

exports.setConfig = function (env_config, section, key, value, callback) {
  log.silly('Saving database config')

  var couchdb = credentials.get(env_config.hoodie.data_path)

  request({
    url: env_config.couch.url + '/_config/' + section + '/' + key,
    method: 'PUT',
    auth: {
      user: couchdb.username,
      pass: couchdb.password
    },
    body: JSON.stringify(value)
  }, callback)
}

exports.getCouch = function (env) {
  if (!env.COUCH_URL) {
    return {
      run: true // start local couch
    }
  }

  // if COUCH_URL is set in the environment,
  // we don't attempt to start our own instance
  // of CouchDB, but just use the one provided
  // to us there.

  return {
    url: env.COUCH_URL.replace(/\/$/, ''),
    run: false
  }
}
