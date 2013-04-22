/**
 * This module manages the request pooling for changes feeds. New requests
 * for changes are added to a queue to be updated and are then pushed to the
 * idle array until a _db_update event is emitted for that database.
 *
 * The changes pool will only work with a version of CouchDB which includes
 * the /_db_updates API
 */

var async = require('async'),
    db_updates = require('./db_updates'),
    _ = require('underscore');


/**
 * Creates a new changes pool from the provided CouchDB client object,
 * returning a subscription function for the pool
 */

exports.create = function (couch) {
    // idle feeds pool
    var idle = [];

    // number of concurrent db feed refreshes
    var concurrency = 4;

    // the updated db queue, processed feeds are put back in the idle pool
    var updated = async.queue(function (db, callback) {
        // make all requests associated with the db
        exports.doRequests(couch, db, function (err, db) {
            if (err) {
                return callback(err);
            }
            // add the db back into the idle list
            idle.push(db);
            // finish this task
            return callback();
        });
    }, concurrency);

    // periodically pop the oldest databases off the
    // idle pool to check we haven't missed anything
    setInterval(function () {
        exports.refreshOldest(updated, idle);
    }, 5000);

    // start listening to db update events from couchdb
    db_updates.listen(couch.base_url, function (err, data) {
        if (err) {
            console.log('[changes_pool] Error: ' + err);
        }
        // update idle pool and refresh queue
        if (data.type === 'deleted') {
            exports.removeDB(idle, data.db_name);
        }
        else if (data.type === 'updated') {
            exports.refreshDB(updated, idle, data.db_name);
        }
    });

    // the public changes feed subscription function
    return function (db, query, callback) {
        // query parameter is optional
        if (!callback) {
            callback = query;
            query = {};
        }
        if (query.limit || query.descending || query.feed === 'normal') {
            // don't attempt to pool one-off requests
            var url = encodeURIComponent(db) + '/_changes';
            return couch.get(url, q, callback);
        }

        // create a new request object
        var req = {
            // db name
            db: db,
            // authenticated url to db
            db_url: '/' + encodeURIComponent(db),
            // used by the update queue workers
            callback: callback,
            // store the query parameters
            query: query
        };

        // make sure the request has a since parameter set
        exports.updateSince(couch, req, function (err, req) {
            if (err) {
                return callback(err);
            }
            // add the changes request to the pool
            exports.addToPool(idle, req);
            // queue the new request for immediate update
            exports.refreshDB(updated, idle, db);
        });
    };
};

/**
 * Makes all requests registered for the provided db object,
 * returning an updated db object (with the requests including
 * the new since value).
 */

exports.doRequests = function (couch, db, callback) {
    // pre-apply the first argument of requestChanges
    var doRequest = _.partial(exports.requestChanges, couch);
    // make each request in series and return the updated request objects
    async.mapSeries(db.requests, doRequest, function (err, reqs) {
        if (err) {
            // we're passing errors to workers, so this shouldn't happen
            return callback(err);
        }
        // update the db object
        db.requests = reqs;
        return callback(null, db);
    });
};

/**
 * Makes a request to the changes feed, calling the request object's
 * callback with the results returning an updated request object with
 * the new since value.
 */

exports.requestChanges = function (couch, req, callback) {
    // don't do continuous or longpoll feeds
    req.query.feed = 'normal';
    // request the changes feed for the query
    couch.get(req.db_url + '/_changes', req.query, function (err, data) {
        if (err) {
            // let the worker handle errors
            req.callback(err);
        }
        else {
            // update the since value so the next request
            // continues from this point
            req.query.since = data.last_seq;
            data.results.forEach(function (r) {
                req.callback(null, r);
            });
        }
        return callback(null, req);
    });
};

/**
 * Adds a changes request to a pool
 */

exports.addToPool = function (pool, req) {
    var db = _.detect(pool, function (x) {
        return x.db === req.db;
    });
    if (db) {
        db.requests.push(req);
    }
    else {
        pool.push({db: req.db, requests: [req]});
    }
    return pool;
};

/**
 * Remove a db from the changes request pool
 */

exports.removeDB = function (pool, db) {
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].db === db) {
            return pool.splice(i, 1)[0];
        }
    }
}

/**
 * Remove a db from the changes request pool and add it to
 * the refresh queue
 */

exports.refreshDB = function (queue, pool, db) {
    var data = exports.removeDB(pool, db);
    // might not have any subscribers
    if (data) {
        queue.push(data);
    }
}

/**
 * Move the oldest request (longest since last changes update) out
 * of the changes request pool and onto the the update queue
 */

exports.refreshOldest = function (queue, pool) {
    var db = pool.shift();
    if (db) {
        queue.push(db);
    }
};

/**
 * Ensure the request has a value set for the since parameter. If the
 * since parameter is missing or set to 'now', fetch the db-level URL
 * to update it to the current seq
 */

exports.updateSince = function (couch, req, callback) {
    if (!req.query.hasOwnProperty('since') || req.query.since === 'now') {
        // get the latest update seq from couchdb
        couch.get(req.db_url, function (err, data) {
            if (err) {
                return callback(err);
            }
            req.query.since = data.update_seq;
            return callback(null, req);
        });
    }
    else {
        // be consistently asynchronous
        return process.nextTick(function () {
            return callback(null, req);
        });
    }
};
