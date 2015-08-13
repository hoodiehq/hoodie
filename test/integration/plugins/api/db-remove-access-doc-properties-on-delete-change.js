var async = require('async')
var request = require('request').defaults({json: true})
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('db.remove: access doc properties on delete change', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var doc = {
    id: 'bar',
    title: 'wibble'
  }
  async.series([
    async.apply(hoodie.database.add, 'foo'),
    async.apply(hoodie.database('foo').add, 'mytype', doc),
    async.apply(hoodie.database('foo').remove, 'mytype', doc.id),
    async.apply(request.get, hoodie._resolve('/foo/_changes'), {qs: {include_docs: true}}),
    async.apply(hoodie.database.remove, 'foo')
  ], function (err, results) {
    if (err) return t.fail()
    var change = results[3][1].results[1]
    delete change.doc._rev
    delete change.doc.createdAt
    t.same(change.doc, {
      _id: 'mytype/' + doc.id,
      _deleted: true,
      title: doc.title,
      id: doc.id,
      type: 'mytype'
    })
    t.end()
  })
})
