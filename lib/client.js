/**
 * Client interface to the Hoodie server and CouchDB, an instance of this
 * will be passed to each worker so we can pool changes feed subscriptions.
 */

/**
 * TODO: The changes pooling is quite naive atm. There are certainly futher
 * optimizations that could be made. For example:
 *
 *  - If subscribed to all docs and another feed requests a filter we could use
 *    the single all docs feed and apply the filter locally.
 *  - If one feed requests include docs and another then requests the same
 *    resource without included docs we can strip them from the results locally
 *    (or just provide them anyway).
 *  - We can also detect when feeds requested with different since values are
 *    synchronized and drop down to a single feed.
 *  - If a feed is requested with since='now' and any existing feeds have a
 *    since update seq value that's lower than the current update seq for the
 *    db, we can simply use that feed from this point on.
 */

var url = require('url'),
    async = require('async'),
    couchr = require('couchr'),
    follow = require('follow'),
    db_updates = require('./db_updates'),
    _ = require('underscore');


/**
 * Creates a new client using the provided config and password
 */

// TODO: add callback so we can start listening to db events before starting
// the workers
exports.createClient = function (config, password) {
    return {
        couch: exports.createCouchClient(config, password)
    };
};

/**
 * Provides an authenticated interface to CouchDB with pooling
 * of change feed requests
 */

exports.createCouchClient = function (config, password) {
    var couch = {};

    var base_url = url.parse(config.couch.url);
    base_url.auth = 'admin:' + encodeURIComponent(password);

    function couchURL(path) {
        return url.resolve(base_url, path);
    }

    var methods = ['get', 'post', 'head', 'put', 'del', 'copy'];
    methods.forEach(function (method) {
        couch[method] = function (path, data, opt, callback) {
            return couchr[method](couchURL(path), data, opt, callback);
        };
    });

    // idle feeds pool
    var idle = [];

    // number of concurrent db feed refreshes
    var concurrency = 4;

    // the updated db queue, processed feeds are put back in the idle pool
    var updated = async.queue(function (db, callback) {

        async.mapSeries(db.requests, function (req, cb) {
            // don't do continuous or longpoll feeds
            req.query.feed = 'normal';
            // request the changes feed for the query
            couch.get(req.url + '/_changes', req.query, function (err, data) {
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
                return cb(null, req);
            });
        },
        function (err, requests) {
            if (err) {
                // we're passing errors to workers, so this shouldn't happen
                return callback(err);
            }
            db.requests = requests;
            // move the db to end of the idle list
            idle.push(db);
            return callback();
        });

    }, concurrency);

    // remove a db from the idle list
    function removeDB(db) {
        for (var i = 0; i < idle.length; i++) {
            if (idle[i].db === db) {
                return idle.splice(i, 1)[0];
            }
        }
    }

    // take a db off the idle list and queue it for a refresh
    function refreshDB(db) {
        var data = removeDB(db);
        // might not have any subscribers
        if (data) {
            updated.push(data);
        }
    }

    // periodically pop the oldest databases off the idle pool to check
    // we haven't missed anything
    setInterval(function () {
        var db = idle.shift();
        if (db) {
            updated.push(db);
        }
    }, 5000);

    couch.changes = function (db, query, callback) {
        // query parameter is optional
        if (!callback) {
            callback = query;
            query = {};
        }
        if (query.limit || query.descending) {
            // TODO: don't bother trying to pool these, just make request
        }
        var req = {
            // db name
            db: db,
            // authenticated url to db
            url: couchURL('/' + encodeURIComponent(db)),
            // used by the update queue workers
            callback: callback,
            // store the query parameters
            query: query
        };

        // adds the changes request to the pool and refreshes db
        function start() {
            exports.addToPool(idle, req);
            refreshDB(db);
        }

        // only show changes after subscribe time by default
        if (!query.hasOwnProperty('since') || query.since === 'now') {
            // update the since parameter before gettings changes
            couch.get(req.url, function (err, data) {
                if (err) {
                    return callback(err);
                }
                req.query.since = data.update_seq;
                start();
            });
        }
        else {
            // we already have a 'since' value
            start();
        }
    };

    db_updates.listen(base_url, function (err, data) {
        if (data.type === 'deleted') {
            removeDB(data.db_name);
        }
        else if (data.type === 'updated') {
            refreshDB(data.db_name);
        }
    });

    return couch;
};

/**
 * Adds a request to a pool
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
