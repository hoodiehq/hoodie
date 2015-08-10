/**
 * Dependencies
 */

var _ = require('lodash')
var async = require('async')

var DatabaseAPI = require('./database').DatabaseAPI

/**
 * Document prepare / parse adapted from:
 * https://github.com/hoodiehq/hoodie.js/blob/master/src/core/remote.js
 */

/**
 * Convert a type and Hoodie ID to a couch _id string
 */

exports.convertID = function (type, id) {
  return type + '/' + id
}

/**
 * Prepare a hoodie document for CouchDB
 */

exports.prepareDoc = function (doc) {
  var validSpecialAttributes = [
    '_id',
    '_rev',
    '_deleted',
    '_revisions',
    '_attachments'
  ]
  var properties = _.extend({}, doc)

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
  return properties
}

/**
 * Convert a CouchDB document back into the Hoodie format
 */

exports.parseDoc = function (doc) {
  // handle id and type
  var id = doc._id || doc.id
  delete doc._id

  // turn doc/123 into type = doc & id = 123
  // NOTE: we don't use a simple id.split(/\//) here,
  // as in some cases IDs might contain "/", too
  var _ref = id.match(/([^\/]+)\/(.*)/)
  if (_ref) {
    doc.type = _ref[1]
    doc.id = _ref[2]
  }

  return doc
}

/**
 * API for managing / selecting databases
 */

exports.DatabasesAPI = function (hoodie) {
  /**
   * Calling this API with a db name returns a new DatabaseAPI object
   */

  var database = function (name) {
    return new DatabaseAPI(hoodie, {
      name: name,
      editable_permissions: true,
      _id: exports.convertID,
      prepare: exports.prepareDoc,
      parse: exports.parseDoc
    })
  }

  /**
   * Creates a new database
   */

  database.add = function (name, callback) {
    var opt = {data: ''}
    var url = '/' + encodeURIComponent(name) + '/'
    var db = database(name)

    async.series([
      // create database before calling db.* methods
      async.apply(hoodie.request, 'PUT', url, opt),
      db.revokePublicReadAccess
    ], function (err) {
      if (err && err.error === 'file_exists') {
        // ignore existing db
        return callback(null, db)
      } else {
        return callback(err, err ? null : db)
      }
    })
  }

  /**
   * Delete a database
   */

  database.remove = function (name, callback) {
    var url = '/' + encodeURIComponent(name)
    hoodie.request('DELETE', url, {}, callback)
  }

  /**
   * List all databases (couch system dbs are not included in the results)
   */

  database.findAll = function (callback) {
    hoodie.request('GET', '/_all_dbs', {}, function (err, data, res) {
      if (err) {
        return callback(err)
      }
      var dbs = data.filter(function (db) {
        return db[0] !== '_'
      })
      return callback(null, dbs, res)
    })
  }

  return database
}
