var async = require('async')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('account.add / findAll / get / remove / update', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var userdoc = {
    id: 'testuser',
    password: 'testing'
  }
  async.series([
    async.apply(hoodie.account.findAll, 'user'),
    async.apply(hoodie.account.add, 'user', userdoc),
    hoodie.account.findAll,
    async.apply(hoodie.account.find, 'user', 'testuser'),
    async.apply(hoodie.account.update, 'user', 'testuser', {wibble: 'wobble'}),
    async.apply(hoodie.account.find, 'user', 'testuser'),
    async.apply(hoodie.account.remove, 'user', 'testuser'),
    hoodie.account.findAll
  ], function (err, results) {
    if (err) t.fail()
    var docs1 = results[0]
    var docs2 = results[2]
    var userdoc1 = results[3]
    var userdoc2 = results[5]
    var docs3 = results[7]
    t.equal(docs1.length, 0)
    t.equal(docs2.length, 1)
    t.equal(docs2[0].name, 'user/testuser')
    t.equal(userdoc1.name, 'user/testuser')
    t.equal(userdoc2.wibble, 'wobble')
    t.equal(docs3.length, 0)
    t.end()
  })
})
