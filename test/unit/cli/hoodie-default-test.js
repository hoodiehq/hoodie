var proxyquire = require('proxyquire').noCallThru()
var test = require('tap').test

test('hoodie defaults test', function (group) {
  group.test('hoodie defaults set', function (t) {
    var getHoodieDefault = proxyquire('../../../cli/hoodie-defaults', {})
    var defaults = getHoodieDefault()
    t.deepEqual(defaults, {
      address: '127.0.0.1',
      adminPassword: undefined,
      data: '.hoodie',
      dbAdapter: 'pouchdb-adapter-fs',
      dbUrl: undefined,
      dbUrlPassword: undefined,
      dbUrlUsername: undefined,
      inMemory: false,
      loglevel: 'warn',
      port: 8080,
      public: 'public',
      url: undefined
    }, 'setting hoodie defaults')
    t.end()
  })

  group.end()
})
