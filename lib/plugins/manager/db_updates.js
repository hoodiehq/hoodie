/**
 * Subscribes to _db_updates events from CouchDB
 */
var url = require('url')

var _ = require('lodash')
var couchr = require('couchr')

exports.dbUpdatesURL = function (couch_url) {
  return url.resolve(couch_url, '/_db_updates')
}

/**
 * Requests db_updates url from CouchDB, retries forever on errors
 */

exports.listen = function (couch_url, handler,/* opt */ prev_error) {
  var updates_url = exports.dbUpdatesURL(couch_url)

  var q = {
    feed: 'continuous',
    heartbeat: true
  }

  var opt = {
    callback_on_data: handler,
    headers: {'Connection': 'Keep-Alive'}
  }

  couchr.request('GET', updates_url, q, opt, function (err) {
    if (!err) {
      // successfully received db_update event
      return exports.listen(couch_url, handler, false)
    }

    // log error from /_db_updates
    if (!prev_error || !_.isEqual(prev_error, err)) console.error('[db_updates] ' + err)
    // retry request, if first error, retry immediately,
    // otherwise wait 1 second before trying again
    return setTimeout(function () {
      exports.listen(couch_url, handler, err)
    }, prev_error ? 1000 : 0)
  })
}

/**
* Tests if the /_db_updates api is available at the provided
* CouchDB URL
*/

exports.available = function (couch_url, callback) {
  // bit of a hack to get around the lack of support for feed=normal on
  // the /_db_updates feature branch
  var q = {
    feed: 'longpoll',
    timeout: 0
  }

  var updates_url = exports.dbUpdatesURL(couch_url)
  couchr.get(updates_url, q, function (err, data, res) {
    if (res && res.statusCode === 400) {
      // Bad Request response due to 'illegal database name'
      // This means it doesn't recognise /_db_updates as
      // a special root-level handler
      return callback(null, false)
    }

    if (err) {
      return callback(err)
    }

    return callback(null, true)
  })

}
