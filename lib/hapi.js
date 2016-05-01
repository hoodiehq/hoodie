module.exports = hapi

var onStorePreAuth = require('./core-modules-glue-code/store-pre-auth')

function hapi (config, couchConfig, callback) {
  var database = require('./database')(config)
  var usersDb = database(couchConfig.authentication_db)

  usersDb.constructor.plugin(require('pouchdb-users'))

  var storeOptions = {
    usersDb: usersDb,
    hooks: {
      onPreAuth: onStorePreAuth
    }
  }

  if (config.db.url) {
    storeOptions.couchdb = removeAuth(config.db.url)
  } else {
    storeOptions.PouchDB = usersDb.constructor
  }

  usersDb.installUsersBehavior()
  .then(function () {
    var options = {config, usersDb}

    var hapiPlugins = [
      require('h2o2'),
      require('inert'),
      require('vision'),
      require('lout')
    ]

    var localPlugins = [
      require('./plugins/log'),
      require('./plugins/public')
    ].map(function (register) { return {options, register} })

    var hoodieCorePlugins = [{
      register: require('@hoodie/account'),
      options: {
        admins: couchConfig.admins,
        secret: config.db.secret,
        database: database,
        usersDb: usersDb,
        notifications: config.account.notifications
      },
      routes: {
        prefix: '/hoodie/account/api'
      }
    }, {
      register: require('@hoodie/store'),
      options: storeOptions,
      routes: {
        prefix: '/hoodie/store/api'
      }
    }]

    callback(null, hapiPlugins.concat(localPlugins, hoodieCorePlugins))
  })

  .catch(callback)
}

function removeAuth (couchUrl) {
  var parts = require('url').parse(couchUrl)
  return couchUrl.replace(parts.auth + '@', '')
}
