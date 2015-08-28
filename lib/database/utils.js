var url = require('url')

var async = require('async')
var log = require('npmlog')
var request = require('request')

exports.checkDbAdmin = function (env_config, callback) {
  request({
    url: url.format(env_config.db) + '/_users/_all_docs',
    method: 'GET'
  }, function (err, res) {
    if (err) {
      return callback(err)
    }
    if (res.statusCode !== 200) {
      return callback(new Error('Could not authenticate with database'))
    }

    callback(null)
  })
}

exports.createDb = function (name, dbUrl, callback) {
  log.silly('database', 'Creating "' + name + '"')

  async.series([
    async.apply(request, {
      url: dbUrl + '/' + encodeURIComponent(name),
      method: 'PUT'
    }),
    async.apply(request, {
      url: dbUrl + '/' + encodeURIComponent(name) + '/_security',
      method: 'PUT',
      json: true,
      body: {
        admins: {roles: ['_admin']},
        members: {roles: ['_admin']}
      }
    })
  ], function (err, results) {
    if (err) {
      log.verbose('database', 'Could not create "' + name + '"')
      return callback(err)
    }

    log.info('database', 'Created "' + name + '"')
    callback(null, results)
  })
}

exports.createAppConfig = function (name, dbUrl, callback) {
  log.verbose('database', 'Creating appconfig document in plugins database')

  var body = {
    _id: 'config',
    config: {},
    name: name,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  request({
    url: dbUrl + '/app/config',
    method: 'PUT',
    json: true,
    body: body
  }, callback)
}

exports.saveAdminUser = function (env_config, callback) {
  log.silly('database', 'Checking if admin-dashboard admin user exists')

  var adminUrl = url.format(env_config.db) + '/_config/admins/admin'

  request(adminUrl, function (err, res, data) {
    if (err) return callback(err)

    if (res.statusCode === 200) {
      log.verbose('database', 'Admin-dashboard admin user exists')
      return callback(null)
    }

    if (!env_config.admin.password) {
      return callback(new Error('No password provided to create an admin-dashboard admin user'))
    }

    log.verbose('database', 'Creating admin-dashboard admin user')
    request({
      url: adminUrl,
      method: 'PUT',
      body: env_config.admin.password,
      json: true
    }, callback)
  })
}
