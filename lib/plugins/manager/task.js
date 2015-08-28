var events = require('events')

var changes_pool = require('./changes-pool')
var databases_api = require('../api/databases')
var log = require('npmlog')

exports.start = function (manager, callback) {
  var tm = {}

  var ev = new events.EventEmitter()
  tm.on = function () {
    return ev.on.apply(ev, arguments)
  }
  tm.emit = function () {
    return ev.emit.apply(ev, arguments)
  }

  changes_pool.create(manager.couch_url, function (err, pool) {
    if (err) {
      return callback(err)
    }

    tm.addSource = function (name,/* optional */ callback) {
      // log.verbose('plugins', 'addSource', name)

      callback = callback || function (err) {
        if (err) {
          log.error('plugins', 'Could not add source "' + name + '"')
          log.verbose('plugins', 'Full source "' + name + '" error', err)
        }
      }

      if (pool.isSubscribed(name)) {
        // already subscribed
        return callback()
      }

      function docChangeEvent (doc) {
        doc = databases_api.parseDoc(doc)
        if (doc.type && doc.type[0] === '$') {
          tm.emit('change', name, {doc: doc})
        }
      }
      pool(name, {since: 0, include_docs: true}, function (err, change) {
        if (err) {
          log.error('plugins', 'Could not get update from changes pool', err)
          return
        }
        if (change.doc) {
          docChangeEvent(change.doc)
        }
      })
      if (callback) {
        return callback()
      }
    }

    tm.removeSource = function (name,/* optional */ callback) {
      pool.remove(name)
      if (callback) {
        return callback()
      }
    }

    tm.stop = function (callback) {
      pool.stop(callback)
    }

    callback(null, tm)
  })
}
