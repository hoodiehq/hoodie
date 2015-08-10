/**
 * Dependencies
 */

var events = require('events')

var _ = require('lodash')

var DatabaseAPI = require('./database').DatabaseAPI

/**
 * Document prepare / parse adapted from:
 * https://github.com/hoodiehq/hoodie.js/blob/master/src/core/remote.js
 */

/**
 * Convert a type and Hoodie ID to a couch _id string which is
 * compatible with the _users database
 */

exports.convertID = function (type, id) {
  return 'org.couchdb.user:' + type + '/' + id
}

/**
 * Convert a CouchDB _users document back into the Hoodie format
 */

exports.parseDoc = function (doc) {
  doc.name = doc._id.replace(/^org\.couchdb\.user:/, '')
  doc.id = doc.name.split('/').slice(1).join('/')
  doc.type = doc.name.split('/')[0]
  delete doc._id
  return doc
}

/**
 * Prepare a hoodie document for CouchDB _users database
 */

exports.prepareDoc = function (doc) {
  var validSpecialAttributes = [
    '_id',
    '_rev',
    '_deleted',
    '_revisions',
    '_attachments'
  ]
  var properties = _.extend({type: 'user', roles: []}, doc)

  for (var attr in properties) {
    if (properties.hasOwnProperty(attr)) {
      if (validSpecialAttributes.indexOf(attr) !== -1) {
        continue
      }
      if (!/^_/.test(attr)) {
        continue
      }
      delete properties[attr]
    }
  }
  // prepare CouchDB id
  properties._id = exports.convertID(properties.type, properties.id)
  delete properties.id

  properties.name = properties._id.substr('org.couchdb.user:'.length)

  // copy type attribute to another property because the _users
  // database expects type to always be 'user'
  properties.type = 'user'

  return properties
}

/**
 * API for interacting with the CouchDB _users database
 */

exports.AccountsAPI = function (hoodie) {
  /**
   * Create a Database API to the _users db, which we
   * can extend with some custom account-related methods
   */

  var account = new DatabaseAPI(hoodie, {
    name: '_users',
    editable_permissions: false,
    _id: exports.convertID,
    prepare: exports.prepareDoc,
    parse: exports.parseDoc
  })

  /**
   * Accounts API is also an event emitter - these events are created
   * by the plugin manager (which will be subscribed to the _users db
   * changes feed)
   */

  var user_events = new events.EventEmitter()

  /**
   * Proxy calls to the on and emit EventEmitter methods
   */

  account.on = _.bind(user_events.on, user_events)
  account.emit = _.bind(user_events.emit, user_events)

  /**
   * Internal method for adding roles to a user, used
   * for managing database security
   */

  account._addRoles = function (type, id, roles, callback) {
    account.find(type, id, function (err, doc) {
      if (err) {
        return callback(err)
      }
      var new_roles = _.uniq(doc.roles.concat(roles))
      account.update(type, id, {roles: new_roles}, callback)
    })
  }

  /**
   * Internal method for removing roles from a user, used
   * for managing database security
   */

  account._removeRoles = function (type, id, roles, callback) {
    account.find(type, id, function (err, doc) {
      if (err) {
        return callback(err)
      }
      var new_roles = _.filter(doc.roles, function (r) {
        for (var i = 0; i < roles.length; i++) {
          if (r === roles[i]) {
            return false
          }
        }
        return true
      })
      account.update(type, id, {roles: new_roles}, callback)
    })
  }

  return account
}
