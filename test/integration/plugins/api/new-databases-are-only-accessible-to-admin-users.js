/* eslint-disable handle-callback-err */

var request = require('request').defaults({json: true})
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')
var COUCH = DEFAULT_OPTIONS.couchdb

require('./lib/setup-teardown')(tap)

test('new databases are only accessible to _admin users', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err) {
    if (err) t.fail()
    request.get(COUCH.url + 'foo/_all_docs', function (err, res, body) {
      t.equal(res.statusCode, 401)
      t.end()
    })
  })
})
