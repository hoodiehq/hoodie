var _ = require('lodash')
var async = require('async')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('../lib/default-options')

require('../lib/setup-teardown')(tap)

test('db.addPermission with existing doc', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var permission_fn = function (newDoc) {
    if (newDoc.type === 'notthis') {
      throw new Error('nope!')
    }
  }
  var permission_fn2 = function () {
    throw new Error('nope!')
  }
  var doc = {
    id: 'bar',
    title: 'wibble'
  }
  async.series([
    async.apply(hoodie.database.add, 'foo'),
    async.apply(hoodie.database('foo').addPermission,
      'mypermission', permission_fn
    ),
    async.apply(hoodie.database('foo').addPermission,
      'mypermission', permission_fn2
    )
  ], function (err, results) {
    if (err) t.fail()
    t.ok(_.isArray(results))
    hoodie.database('foo').add('mytype', doc, function (err) {
      // saving any doc should now error (thanks to permission_fn2)
      t.ok(err)
      async.series([
        async.apply(hoodie.database('foo').removePermission,
          'mypermission'
        ),
        async.apply(hoodie.database('foo').add, 'notthis', doc)
      ], function (err) {
        // should be able to save doc now
        t.ok(!err)
        t.end()
      })
    })
  })
})
