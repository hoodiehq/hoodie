/**
 * Subscribes to _db_updates events from CouchDB
 */

var couchr = require('couchr'),
    url = require('url');

/**
 * Requests db_updates url from CouchDB, retries forever on errors
 */

exports.listen = function (couch_url, handler, /*opt*/prev_error) {
    var updates_url  = url.resolve(couch_url, '/_db_updates');
    var q = {
        feed: 'continuous',
        heartbeat: true
    };
    var opt = {
        callback_on_data: handler,
        headers: {'Connection': 'Keep-Alive'}
    };
    couchr.request('GET', updates_url, q, opt, function (err, data) {
        if (err) {
            // log error from /_db_updates
            console.log('[db_updates] ' + err);
            // retry request, if first error, retry immediately,
            // otherwise wait 1 second before trying again
            return setTimeout(function () {
                exports.listen(couch_url, handler, true);
            }, prev_error ? 1000: 0);
        }
        else {
            // successfully received db_update event
            return exports.listen(couch_url, handler, false);
        }
    });
};
