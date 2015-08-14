/**
 * Subscribes to _db_updates events from CouchDB
 */
var url = require('url')

var follow = require('follow')
var request = require('request').defaults({json: true})

var log = require('../../utils/log')

exports.dbUpdatesURL = function (couch_url) {
  return url.resolve(couch_url, '/_db_updates')
}

/**
 * Requests db_updates url from CouchDB, retries forever on errors
 */

exports.listen = function (couch_url, handler,/* opt */ prev_error) {
  var updates_url = exports.dbUpdatesURL(couch_url)

  var feed = follow({
    db: updates_url,
    since: 'now'
  })
  feed.on('change', handler)
  feed.on('error', function (err) {
    log.error('Error in changes_pool', err)
  })
}

/**
* Tests if the /_db_updates api is available at the provided
* CouchDB URL
*/

exports.available = function (couch_url, callback) {
  // bit of a hack to get around the lack of support for feed=normal on
  // the /_db_updates feature branch
  var qs = {
    feed: 'longpoll',
    timeout: 0
  }

  var updates_url = exports.dbUpdatesURL(couch_url)
  request.get({
    url: updates_url,
    qs: qs
  }, function (err, res) {
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
