/**
 * This module manages the request pooling for changes feeds. New requests
 * for changes are added to a queue to be updated and are then pushed to the
 * idle array until a _db_update event is emitted for that database.
 *
 * The changes pool will only work with a version of CouchDB which includes
 * the /_db_updates API
 */

var url = require('url')

var _ = require('lodash')
var async = require('async')
var follow = require('follow')
var request = require('request').defaults({json: true})

var db_updates = require('./db_updates')
var log = require('../../log')

/**
 * Creates a new changes pool from the provided CouchDB client object,
 * returning a subscription function for the pool
 */

exports.create = function (couch_url, callback) {
  db_updates.available(couch_url, function (err, exists) {
    if (err) {
      return callback(err)
    }

    var pool = exists ?
      exports.createDbUpdatesPool(couch_url) :
      exports.createLegacyPool(couch_url)

    return callback(null, pool)
  })
}

exports.createDbUpdatesPool = function (couch_url) {
  // idle feeds pool
  var idle = []

  // number of concurrent db feed refreshes
  var concurrency = 4

  // the updated db queue, processed feeds are put back in the idle pool
  var updated = async.queue(function (db, callback) {
    // make all requests associated with the db
    exports.doRequests(db, function (err, db) {
      if (err) {
        return callback(err)
      }

      // add the db back into the idle list
      idle.push(db)
      // finish this task
      return callback()
    })
  }, concurrency)

  // periodically pop the oldest databases off the
  // idle pool to check we haven't missed anything
  var interval = setInterval(function () {
    exports.refreshOldest(updated, idle)
  }, 5000)

  // start listening to db update events from couchdb
  db_updates.listen(couch_url, function (data) {
    // update idle pool and refresh queue
    if (data.type === 'deleted') {
      exports.removeDB(updated, idle, data.db_name)
    } else if (data.type === 'updated') {
      exports.refreshDB(updated, idle, data.db_name)
    }
  })

  // the public changes feed subscription function
  var f = function (db, query, callback) {
    // query parameter is optional
    if (!callback) {
      callback = query
      query = {}
    }

    // create a new request object
    var req = {
      // db name
      db: db,
      // authenticated url to db
      db_url: url.resolve(couch_url, encodeURIComponent(db)),
      // used by the update queue workers
      callback: callback,
      // store the query parameters
      query: query
    }

    // make sure the request has a since parameter set
    exports.updateSince(req, function (err, req) {
      if (err) {
        return callback(err)
      }

      // add the changes request to the pool
      exports.addToPool(idle, req)
    // queue the new request for immediate update
    // exports.refreshDB(updated, idle, db)
    })
  }

  f.isSubscribed = function (db_name) {
    return !!(_.detect(idle.concat(updated.tasks), function (x) {
      return x.db === db_name
    }))
  }

  f.remove = function (db_name) {
    exports.removeDB(updated, idle, db_name)
  }

  f.stop = function (callback) {
    updated.tasks = []
    idle = []
    clearInterval(interval)
    callback()
  }

  return f
}

/**
 * Changes pool for old versions of CouchDB (pre 1.4) without _db_updates
 * - will create a separate changes feed request for each task subscribe call
 */

exports.createLegacyPool = function (couch_url) {
  log.info('Using legacy changes feed pooling (CouchDB < 1.4, PouchDB Server)')

  var feeds = {}

  var f = function (db, query, callback) {
    query = query || {}
    query.db = url.resolve(couch_url, encodeURIComponent(db))
    var feed = follow(query)
    feed.on('change', function (change) {
      if (change.doc) {
        callback(null, change)
      }
    })
    feed.on('error', callback)
    feeds[db] = {feed: feed, db: db, query: query}
  }

  f.isSubscribed = function (db_name) {
    return !!(_.detect(_.values(feeds), function (x) {
      return x.db === db_name
    }))
  }

  f.remove = function (db_name,/* optional */ callback) {
    var feed = feeds[db_name].feed
    if (feed) {
      feed.once('error', function (err) {
        // ignore connection errors during stopping of feed
        if (err.code !== 'ECONNREFUSED' &&
          err.code !== 'ECONNRESET') {
          throw err
        }
      })
      feed.once('stop', function () {
        delete feeds[db_name]
        if (callback) {
          callback()
        }
      })
      feed.stop()
    }
  }

  f.stop = function (callback) {
    var names = Object.keys(feeds)
    async.map(names, f.remove, callback)
  }

  return f
}

/**
 * Makes all requests registered for the provided db object,
 * returning an updated db object (with the requests including
 * the new since value).
 */

exports.doRequests = function (db, callback) {
  // make each request in series and return the updated request objects
  async.mapSeries(db.requests, exports.requestChanges, function (err, reqs) {
    if (err) {
      // we're passing errors to workers, so this shouldn't happen
      return callback(err)
    }
    // update the db object
    db.requests = reqs
    return callback(null, db)
  })
}

/**
 * Makes a request to the changes feed, calling the request object's
 * callback with the results returning an updated request object with
 * the new since value.
 */

exports.requestChanges = function (req, callback) {
  // don't do continuous or longpoll feeds
  req.query.feed = 'normal'
  // request the changes feed for the query
  request.get({
    url: req.db_url + '/_changes',
    qs: req.query
  }, function (err, response, data) {
    if (err) {
      // let the worker handle errors
      req.callback(err)
    } else {
      // update the since value so the next request
      // continues from this point
      req.query.since = data.last_seq
      data.results.forEach(function (r) {
        req.callback(null, r)
      })
    }
    return callback(null, req)
  })
}

/**
 * Adds a changes request to a pool
 */

exports.addToPool = function (pool, req) {
  var db = _.detect(pool, function (x) {
    return x.db === req.db
  })
  if (db) {
    db.requests.push(req)
  } else {
    pool.push({db: req.db, requests: [req]})
  }
  return pool
}

/**
 * Remove a db from the changes request pool
 */

exports.removeDB = function (queue, pool, db) {
  for (var i = 0; i < pool.length; i++) {
    if (pool[i].db === db) {
      return pool.splice(i, 1)[0]
    }
  }

  // not in the pool, check the update queue
  for (var j = 0; j < queue.tasks.length; j++) {
    if (queue.tasks[j].db === db) {
      return queue.tasks.splice(j, 1)[0]
    }
  }
}

/**
 * Remove a db from the changes request pool and add it to
 * the refresh queue
 */

exports.refreshDB = function (queue, pool, db) {
  var data = exports.removeDB(queue, pool, db)
  // might not have any subscribers
  if (data) {
    queue.push(data)
  }
}

/**
 * Move the oldest request (longest since last changes update) out
 * of the changes request pool and onto the the update queue
 */

exports.refreshOldest = function (queue, pool) {
  var db = pool.shift()
  if (db) {
    queue.push(db)
  }
}

/**
 * Ensure the request has a value set for the since parameter. If the
 * since parameter is missing or set to 'now', fetch the db-level URL
 * to update it to the current seq
 */

exports.updateSince = function (req, callback) {
  if (!req.query.hasOwnProperty('since') || req.query.since === 'now') {
    // get the latest update seq from couchdb
    request.get(req.db_url, function (err, response, data) {
      if (err) {
        return callback(err)
      }
      req.query.since = data.update_seq
      return callback(null, req)
    })
  } else {
    // be consistently asynchronous
    return process.nextTick(function () {
      return callback(null, req)
    })
  }
}
