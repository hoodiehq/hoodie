/* eslint-disable handle-callback-err */
var url = require('url')

var request = require('request').defaults({json: true})
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('../lib/default-options')

require('../lib/setup-teardown')(tap)

test('new databases are only accessible to _admin users', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err) {
    if (err) t.fail()
    var couchdb = url.parse(DEFAULT_OPTIONS.base_url)
    delete couchdb.auth
    request.get(url.format(couchdb) + 'foo/_all_docs', function (err, res, body) {
      t.equal(res.statusCode, 401)
      t.end()
    })
  })
})
