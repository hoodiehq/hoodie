/**
 * Client interface to the Hoodie server and CouchDB, an instance of this
 * will be passed to each worker so we can pool changes feed subscriptions.
 */

var url = require('url'),
    couchr = require('couchr'),
    follow = require('follow'),
    changes_pool = require('./changes_pool');


/**
 * Creates a new client using the provided config and password
 */

exports.createClient = function (config, user, password, callback) {
    exports.createCouchClient(config, user, password, function (err, couch) {
        return callback(err, {couch: couch});
    });
};

/**
 * Provides an authenticated interface to CouchDB with pooling
 * of change feed requests
 */

exports.createCouchClient = function (config, user, password, callback) {
    var couch = {};

    // add auth details to couch url
    couch.base_url = url.parse(config.couch.url);
    couch.base_url.auth = user + ':' + password;

    // makes urls requested by workers authenticated by default
    function couchURL(path) {
        return url.resolve(couch.base_url, path);
    }

    // wrap all HTTP methods from couchr
    var methods = ['get', 'post', 'head', 'put', 'del', 'copy'];
    methods.forEach(function (method) {
        couch[method] = function (path, data, opt, callback) {
            return couchr[method](couchURL(path), data, opt, callback);
        };
    });

    // check if the Couch instance supports /_db_updates
    exports.dbUpdatesAvailable(couch, function (err, enabled) {
        if (err) {
            return callback(err);
        }
        if (enabled) {
            console.log('[changes] using _db_updates based polling');
            couch.changes = changes_pool.create(couch);
        }
        else {
            console.log('[changes] using changes feed fallback');
            couch.changes = function (db, query, callback) {
                var feed = couchr.changes(couchURL(db), query);
                feed.on('change', function (change) {
                    callback(null, change);
                });
                feed.on('error', callback);
            };
        }
        return callback(null, couch);
    });
};


/**
* Tests if the /_db_updates api is available at the provided
* CouchDB URL
*/

exports.dbUpdatesAvailable = function (couch, callback) {
    // bit of a hack to get around the lack of support for feed=normal on
    // the /_db_updates feature branch
    var q = {
        feed: 'longpoll',
        timeout: 0
    };
    couch.get('/_db_updates', q, function (err, data, res) {
        if (res && res.statusCode === 400) {
            // Bad Request response due to 'illegal database name'
            // This means it doesn't recognise /_db_updates as
            // a special root-level handler
            return callback(null, false);
        }
        if (err) {
            return callback(err);
        }
        return callback(null, true);
    });
};
