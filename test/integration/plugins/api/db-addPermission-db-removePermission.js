var _ = require('lodash')
var async = require('async')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('../lib/default-options')

require('../lib/setup-teardown')(tap)

test('db.addPermission / db.removePermission', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var permission_fn = function (newDoc) {
    if (newDoc.type === 'notthis') {
      throw new Error('nope!')
    }
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
    async.apply(hoodie.database('foo').add, 'mytype', doc)
  ], function (err, results) {
    if (err) t.fail()
    t.ok(_.isArray(results))
    hoodie.database('foo').add('notthis', doc, function (err) {
      // saving doc should error
      t.ok(err)
      async.series([
        async.apply(hoodie.database('foo').removePermission,
          'mypermission'
        ),
        async.apply(hoodie.database('foo').add, 'notthis', doc)
      ], function (err) {
        // should be able to save doc now
        if (err) t.fail()
        t.end()
      })
    })
  })
})
