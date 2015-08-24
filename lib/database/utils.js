var fs = require('fs')
var path = require('path')

var _ = require('lodash')
var async = require('async')
var crypto = require('crypto')
var inquirer = require('inquirer')
var request = require('request')

var log = require('../log')

var passwordPrompt = {
  type: 'password',
  name: 'password',
  validate: function (input) {
    return !!input.trim()
  },
  filter: function (input) {
    return input.trim()
  }
}

exports.isAdminParty = function (env_config, callback) {
  log.silly('database', 'Checking for admin party mode')
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
  log.silly('database', 'Creating a admin-dashboard admin user')

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
    return callback(null, {
      name: 'admin',
      password: 'travis-ci'
    })
  }

  inquirer.prompt(_.assign(passwordPrompt, {
    message: 'Please set an admin password'
  }), function (answer) {
    // hardcode username as admin for now
    answer.name = 'admin'
    return callback(null, answer)
  })
}

exports.checkCouchCredentials = function (env_config, callback) {
  var couchdb = exports.credentials.get(env_config.hoodie.data_path)

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
  log.silly('database', 'Checking if provided credentials work')

  exports.checkCouchCredentials(env_config, function (err, admin) {
    if (err) {
      return callback(err)
    }

    if (admin) {
      log.verbose('database', 'Provided credentials work')
      return callback()
    }

    exports.promptCouchCredentials(function (err, user, pass) {
      if (err) {
        return callback(err)
      }

      exports.credentials.set(env_config.hoodie.data_path, user, pass)

      exports.updateCouchCredentials(env_config, callback)
    })
  })
}

exports.promptCouchCredentials = function (callback) {
  inquirer.prompt([{
    name: 'username',
    message: 'Please enter your database _admin username',
    validate: passwordPrompt.validate,
    filter: passwordPrompt.filter
  }, _.assign(passwordPrompt, {
    message: 'Please enter your database _admin password'
  })], function (answers) {
    return callback(null, answers.username, answers.password)
  })
}

exports.createDB = function (name) {
  return function (env_config, username, password, callback) {
    log.silly('database', 'Creating "' + name + '"')
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
        log.verbose('database', 'Could not create "' + name + '"')
      }

      log.info('database', 'Created "' + name + '"')
      callback.apply(null, arguments)
    })
  }
}

exports.createCouchCredentials = function (env_config, callback) {
  log.verbose('database', 'Generating and storing the admin password')

  var username = '_hoodie'
  var password = crypto.randomBytes(256).toString('base64')

  request({
    url: env_config.couch.url + '/_config/admins/' + username,
    method: 'PUT',
    body: JSON.stringify(password)
  }, function (err) {
    if (err) return callback(err)

    exports.credentials.set(env_config.hoodie.data_path, username, password)
    callback(null)
  })
}

exports.createAdminUser = function (env_config, callback) {
  log.verbose('database', 'Creating user that is an admin of this Hoodie instance')

  var couchdb = exports.credentials.get(env_config.hoodie.data_path)

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
  log.verbose('database', 'Creating appconfig document in plugins database')

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
  log.silly('database', 'Saving config')

  var couchdb = exports.credentials.get(env_config.hoodie.data_path)

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

exports.credentials = (function () {
  var cache

  function configPath (data_path) {
    return path.resolve(data_path, 'config.json')
  }

  return {
    get: function (data_path) {
      if (cache && cache.couchdb) return cache.couchdb

      try {
        return JSON.parse(fs.readFileSync(configPath(data_path), 'utf8')).couchdb
      } catch (e) {
        return {}
      }
    },
    set: function (data_path, username, password) {
      cache = {
        couchdb: {
          username: username,
          password: password
        }
      }

      fs.writeFileSync(configPath(data_path), JSON.stringify(cache, null, 2))
    }
  }
})()
