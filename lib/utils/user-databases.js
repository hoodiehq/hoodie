/**
 * TODO: this functionality should be moved into hoodie-store-server. It should
 * expose an API at server.plugins.store.api like the way hoodie-account-server
 * does it: https://github.com/hoodiehq/hoodie-account-server/tree/master/api
 */
module.exports = {
  add: addUserDatabase,
  remove: removeUserDatabase
}

var async = require('async')
var log = require('npmlog')
var request = require('request')

function addUserDatabase (config, server, account) {
  log.info('account', 'created for %s (id: %s)', account.username, account.id)

  // databases & security only created if CouchDB used
  if (!config.db.url) {
    return
  }

  async.series([
    createDatabase.bind(null, config, account),
    createSecurity.bind(null, config, account)
  ], function (error) {
    if (error) {
      log.error('user/%s not created: %s', account.id, error)
      return
    }

    log.info('account', 'database "user/%s" created for %s', account.id, account.username)
  })
}
function removeUserDatabase (config, server, account) {
  log.info('account', 'removed for %s (id: %s)', account.username, account.id)

  // databases & security only created if CouchDB used
  if (!config.db.url) {
    return
  }

  deleteDatabase(config, account, function (error) {
    if (error) {
      log.error('account', 'user/%s not deleted: %s', account.id, error)
      return
    }

    log.info('account', 'database user/%s deleted for %s', account.id, account.username)
  })
}

function createDatabase (config, account, callback) {
  var url = config.db.url + '/user%2f' + account.id
  request.put(url, callback)
}

function createSecurity (config, account, callback) {
  var url = config.db.url + '/user%2f' + account.id + '/_security'
  var security = {
    admins: {
      names: [],
      roles: []
    },
    members: {
      names: [],
      roles: ['id:' + account.id]
    }
  }
  request({
    method: 'PUT',
    url: url,
    json: true,
    body: security
  }, callback)
}

function deleteDatabase (config, account, callback) {
  var url = config.db.url + '/user%2f' + account.id
  request.del(url, callback)
}
