/* global emit, sum */
/* eslint-disable handle-callback-err */
var url = require('url')

var _ = require('lodash')
var async = require('async')
var couchr = require('couchr')
var moment = require('moment')

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI
var utils = require('./lib/utils')

var COUCH = {
  user: 'admin',
  pass: 'password',
  url: 'http://localhost:8985',
  data_dir: __dirname + '/data'
}

var DEFAULT_OPTIONS = {
  name: 'myplugin',
  couchdb: COUCH,
  config: {
    app: {foo: 'bar'},
    plugin: {}
  }
}

exports.setUp = function (callback) {
  var that = this
  utils.setupCouch(COUCH, function (err, couch) {
    that.couch = couch

    var base = url.parse(COUCH.url)
    base.auth = COUCH.user + ':' + COUCH.pass
    base = url.format(base)

    var appconfig = {
      config: {foo: 'bar'}
    }
    async.series([
      async.apply(couchr.put, url.resolve(base, 'plugins')),
      async.apply(couchr.put, url.resolve(base, 'app')),
      async.apply(couchr.put, url.resolve(base, 'app/config'), appconfig)
    ],
      callback)
  })
}

exports.tearDown = function (callback) {
  this.couch.once('stop', function () {
    callback()
  })
  this.couch.stop()
}

exports['task.success'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.task.on('email:add', function (dbname, task) {
    test.same(Object.keys(task).sort(), [
      'to',
      'subject',
      'body',
      'createdBy',
      'updatedAt',
      'createdAt',
      'type',
      '_rev',
      '_id',
      'id'
    ].sort())
    hoodie.task.success(dbname, task, function (err) {
      test.same(Object.keys(task).sort(), [
        'to',
        'subject',
        'body',
        'createdBy',
        'updatedAt',
        'createdAt',
        'type',
        '_rev',
        '_id',
        '$processedAt',
        '_deleted',
        'id'
      ].sort())
      test.ok(task._deleted)
      test.ok(moment(task.$processedAt).isValid())
      test.done(err)
    })
  })
  var email = {
    'to': 'joe@example.com',
    'subject': 'Hey Joe',
    'body': 'wassup?',
    'createdBy': 'confirmed',
    'updatedAt': '2013-08-02T14:47:04.917Z',
    'createdAt': '2013-08-02T14:47:04.917Z',
    'id': '3621161',
    'type': '$email'
  }
  hoodie.database.add('testdb', function (err, db) {
    if (err) {
      return test.done(err)
    }
    db.add('$email', email, function (err, doc) {
      if (err) {
        return test.done(err)
      }
      email._id = doc.id
      email._rev = doc.rev
      hoodie.task.emit('email:add', 'testdb', email)
    })
  })
}

exports['task.success no callback'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.task.on('email:add', function (dbname, task) {
    hoodie.task.success(dbname, task)
    setTimeout(test.done, 200)
  })
  var email = {
    'to': 'joe@example.com',
    'subject': 'Hey Joe',
    'body': 'wassup?',
    'createdBy': 'confirmed',
    'updatedAt': '2013-08-02T14:47:04.917Z',
    'createdAt': '2013-08-02T14:47:04.917Z',
    'id': '3621161',
    'type': '$email'
  }
  hoodie.database.add('testdb', function (err, db) {
    if (err) {
      return test.done(err)
    }
    db.add('$email', email, function (err, doc) {
      if (err) {
        return test.done(err)
      }
      email._id = doc.id
      email._rev = doc.rev
      hoodie.task.emit('email:add', 'testdb', email)
    })
  })
}

exports['task.error'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.task.on('email:add', function (dbname, task) {
    test.same(Object.keys(task).sort(), [
      'to',
      'subject',
      'body',
      'createdBy',
      'updatedAt',
      'createdAt',
      'type',
      '_rev',
      '_id',
      'id'
    ].sort())
    var email_err = {
      error: 'connection_error',
      message: 'email could not be sent'
    }
    hoodie.task.error(dbname, task, email_err, function (err) {
      test.same(Object.keys(task).sort(), [
        'to',
        'subject',
        'body',
        'createdBy',
        'updatedAt',
        'createdAt',
        'type',
        '_rev',
        '_id',
        '$processedAt',
        '$error',
        'id'
      ].sort())
      test.ok(moment(task.$processedAt).isValid())
      test.same(task.$error, {
        error: 'connection_error',
        message: 'email could not be sent'
      })
      test.done(err)
    })
  })
  var email = {
    'to': 'joe@example.com',
    'subject': 'Hey Joe',
    'body': 'wassup?',
    'createdBy': 'confirmed',
    'updatedAt': '2013-08-02T14:47:04.917Z',
    'createdAt': '2013-08-02T14:47:04.917Z',
    'id': '3621161',
    'type': '$email'
  }
  hoodie.database.add('testdb', function (err, db) {
    if (err) {
      return test.done(err)
    }
    db.add('$email', email, function (err, doc) {
      if (err) {
        return test.done(err)
      }
      email._id = doc.id
      email._rev = doc.rev
      hoodie.task.emit('email:add', 'testdb', email)
    })
  })
}

exports['task.error no callback'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.task.on('email:add', function (dbname, task) {
    var email_err = {
      error: 'connection_error',
      message: 'email could not be sent'
    }
    hoodie.task.error(dbname, task, email_err)
    setTimeout(test.done, 200)
  })
  var email = {
    'to': 'joe@example.com',
    'subject': 'Hey Joe',
    'body': 'wassup?',
    'createdBy': 'confirmed',
    'updatedAt': '2013-08-02T14:47:04.917Z',
    'createdAt': '2013-08-02T14:47:04.917Z',
    'id': '3621161',
    'type': '$email'
  }
  hoodie.database.add('testdb', function (err, db) {
    if (err) {
      return test.done(err)
    }
    db.add('$email', email, function (err, doc) {
      if (err) {
        return test.done(err)
      }
      email._id = doc.id
      email._rev = doc.rev
      hoodie.task.emit('email:add', 'testdb', email)
    })
  })
}

exports.request = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.request('GET', '/', {}, function (err, data) {
    if (err) {
      return test.done(err)
    }
    test.equal(data.couchdb, 'Welcome')
    test.done()
  })
}

exports['request as admin'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.request('GET', '/_users/_all_docs', {}, function (err, data, res) {
    if (err) {
      return test.done(err)
    }
    test.equal(res.statusCode, 200)
    test.done()
  })
}

exports['database: add / findAll / remove'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  async.series([
    async.apply(hoodie.database.add, 'foo'),
    async.apply(hoodie.database.add, 'bar'),
    hoodie.database.findAll,
    async.apply(hoodie.database.remove, 'foo'),
    hoodie.database.findAll,
    async.apply(hoodie.database.remove, 'bar'),
    hoodie.database.findAll
  ], function (err, results) {
    var a = results[2][0]
    var b = results[4][0]
    var c = results[6][0]

    test.same(a, ['app', 'bar', 'foo', 'plugins'])
    test.same(b, ['app', 'bar', 'plugins'])
    test.same(c, ['app', 'plugins'])
    test.done()
  })
}

exports['database: get by name'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('wibble', function (err, db) {
    if (err) {
      return test.done(err)
    }
    var db2 = hoodie.database('wibble')
    test.equal(db._resolve('wobble'), db2._resolve('wobble'))
    test.done()
  })
}

exports['db.add / db.get / db.update / db.get'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }
    var doc = {
      id: 'asdf',
      title: 'Test Document'
    }
    async.series([
      function (cb) {
        db.add('mytype', doc, function (err, resp) {
          if (err) {
            return cb(err)
          }
          test.ok(resp.ok)
          return cb()
        })
      },
      function (cb) {
        db.find('mytype', 'asdf', function (err, doc) {
          if (err) {
            return cb(err)
          }
          test.equal(doc.id, 'asdf')
          test.equal(doc.type, 'mytype')
          test.equal(doc.title, 'Test Document')
          return cb()
        })
      },
      function (cb) {
        db.update('mytype', 'asdf', {foo: 'bar'}, cb)
      },
      function (cb) {
        db.find('mytype', 'asdf', function (err, doc) {
          if (err) {
            return cb(err)
          }
          test.equal(doc.id, 'asdf')
          test.equal(doc.type, 'mytype')
          test.equal(doc.title, 'Test Document')
          test.equal(doc.foo, 'bar')
          return cb()
        })
      }
    ],
      test.done)
  })
}

exports['db.add / db.findAll'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }
    var doc1 = {id: 'wibble', title: 'Test Document 1'}
    var doc2 = {id: 'wobble', title: 'Test Document 2'}
    async.parallel([
      async.apply(db.add, 'mytype', doc1),
      async.apply(db.add, 'mytype', doc2)
    ], function (err) {
      if (err) {
        return test.done(err)
      }
      db.findAll(function (err, docs) {
        if (err) {
          return test.done(err)
        }
        test.equal(docs.length, 2)
        test.equal(docs[0].id, 'wibble')
        test.equal(docs[0].type, 'mytype')
        test.equal(docs[0].title, 'Test Document 1')
        test.equal(docs[1].id, 'wobble')
        test.equal(docs[1].type, 'mytype')
        test.equal(docs[1].title, 'Test Document 2')
        test.done()
      })
    })
  })
}

exports['db.add / db.findAll of type'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }
    var doc1 = {id: 'wibble', title: 'Test Document 1'}
    var doc2 = {id: 'wobble', title: 'Test Document 2'}
    var doc3 = {id: 'wubble', title: 'Test Document 3'}
    async.parallel([
      async.apply(db.add, 'mytype', doc1),
      async.apply(db.add, 'mytype', doc2),
      async.apply(db.add, 'othertype', doc3)
    ], function (err) {
      if (err) {
        return test.done(err)
      }
      db.findAll('othertype', function (err, docs) {
        if (err) {
          return test.done(err)
        }
        test.equal(docs.length, 1)
        test.equal(docs[0].id, 'wubble')
        test.equal(docs[0].type, 'othertype')
        test.equal(docs[0].title, 'Test Document 3')
        test.done()
      })
    })
  })
}

exports['db.add / db.findAll / db.remove / db.findAll'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }
    async.series([
      async.apply(db.add, 'mytype', {id: 'wibble', title: 'Test'}),
      db.findAll,
      async.apply(db.remove, 'mytype', 'wibble'),
      db.findAll
    ], function (err, results) {
      if (err) {
        return test.done(err)
      }
      test.equal(results[1].length, 1)
      test.equal(results[1][0].id, 'wibble')
      test.equal(results[3].length, 0)
      test.done()
    })
  })
}

exports['db.add / db.findAll / db.removeAll / db.findAll'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }
    async.series([
      async.apply(db.add, 'type1', {id: 'wibble'}),
      async.apply(db.add, 'type1', {id: 'wobble'}),
      async.apply(db.add, 'type2', {id: 'wubble'}),
      db.findAll,
      async.apply(db.removeAll, 'type1'),
      db.findAll
    ], function (err, results) {
      if (err) {
        return test.done(err)
      }
      test.equal(results[3].length, 3)
      test.equal(results[3][0].id, 'wibble')
      test.equal(results[3][1].id, 'wobble')
      test.equal(results[3][2].id, 'wubble')
      test.equal(results[5].length, 1)
      test.equal(results[5][0].id, 'wubble')
      test.done()
    })
  })
}

exports['reject a document with no id'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    var doc = { title: 'Test' }

    if (err) {
      return test.done(err)
    }

    db.add('mytype', doc, function (err, results) {
      test.ok(err)
      test.strictEqual(results, undefined)
      return test.done()
    })
  })
}

exports['config.set / config.get'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var hoodie2 = new PluginAPI({
    name: 'otherplugin',
    couchdb: COUCH,
    config: DEFAULT_OPTIONS.config
  })

  // try getting a property that does not exist
  test.strictEqual(hoodie.config.get('asdf'), undefined)

  // set then immediately read a property
  hoodie.config.set('asdf', 123)
  test.equal(hoodie.config.get('asdf'), 123)

  // read global config
  test.equal(hoodie.config.get('foo'), 'bar')

  // override global config value for single plugin only
  hoodie.config.set('foo', 'baz')
  test.equal(hoodie.config.get('foo'), 'baz')
  test.equal(hoodie2.config.get('foo'), 'bar')

  // make sure the config is persistent
  setTimeout(function () {
    var myplugin_url = hoodie._resolve('plugins/plugin%2Fmyplugin')
    var otherplugin_url = hoodie._resolve('plugins/plugin%2Fotherplugin')

    couchr.get(myplugin_url, function (err, doc) {
      if (err) {
        return test.done(err)
      }
      test.equal(doc.config.foo, 'baz')
      couchr.get(otherplugin_url, function (err) {
        test.same(err.error, 'not_found')
        test.done()
      })
    })
  }, 1000)
}

exports['update config from couch'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  test.strictEqual(hoodie.config.get('asdf'), undefined)
  hoodie.config._updateAppConfig({asdf: 1234})
  test.equal(hoodie.config.get('asdf'), 1234)
  hoodie.config._updatePluginConfig({asdf: 5678})
  test.equal(hoodie.config.get('asdf'), 5678)
  test.done()
}

exports['account.add / findAll / get / remove / update'] = function (test) {
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
    if (err) {
      return test.done(err)
    }
    var docs1 = results[0]
    var docs2 = results[2]
    var userdoc1 = results[3]
    var userdoc2 = results[5]
    var docs3 = results[7]
    test.equal(docs1.length, 0)
    test.equal(docs2.length, 1)
    test.equal(docs2[0].name, 'user/testuser')
    test.equal(userdoc1.name, 'user/testuser')
    test.equal(userdoc2.wibble, 'wobble')
    test.equal(docs3.length, 0)
    test.done()
  })
}

exports['pass through user events from plugin manager'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var account_events = []
  hoodie.account.on('change', function (doc) {
    account_events.push('change ' + doc.name)
  })
  hoodie.account.emit('change', {name: 'testuser'})
  test.same(account_events, [
    'change testuser'
  ])
  test.done()
}

exports['pass through task events'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var evs = []
  hoodie.task.on('change', function (doc) {
    evs.push('change ' + doc.name)
  })
  hoodie.task.emit('change', {name: 'test'})
  test.same(evs, [
    'change test'
  ])
  test.done()
}

exports['new databases are only accessible to _admin users'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err) {
    if (err) {
      return test.done(err)
    }
    couchr.get(COUCH.url + '/foo/_all_docs', function (err, body, res) {
      test.equal(res.statusCode, 401)
      test.done()
    })
  })
}

exports['db.grantWriteAccess / db.revokeWriteAccess'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)

  var db_url = url.parse(COUCH.url + '/foo')
  db_url.auth = 'user/testuser:testing'
  db_url = url.format(db_url)

  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }
    var ignoreErrs = function (fn) {
      return function (callback) {
        fn(function () {
          var args = Array.prototype.slice.call(arguments, 1)
          return callback.apply(this, [null].concat(args))
        })
      }
    }
    var userdoc = {
      id: 'testuser',
      password: 'testing'
    }
    var tasks = [
      async.apply(hoodie.account.add, 'user', userdoc),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(db.grantWriteAccess, 'user', 'testuser'),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(couchr.put, db_url + '/some_doc', {data: {asdf: 123}}),
      async.apply(db.revokeWriteAccess, 'user', 'testuser'),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(couchr.put, db_url + '/some_doc2', {data: {asdf: 123}})
    ]
    async.series(tasks.map(ignoreErrs), function (err, results) {
      test.equal(results[1][1].statusCode, 401)
      test.equal(results[3][1].statusCode, 200)
      test.equal(results[4][1].statusCode, 201)
      // after revoke - cannot write but can still read!
      test.equal(results[6][1].statusCode, 200)
      test.equal(results[7][1].statusCode, 401)
      test.done()
    })
  })
}

exports['db.grantReadAccess / revokeReadAccess for specific users'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)

  var db_url = url.parse(COUCH.url + '/foo')
  db_url.auth = 'user/testuser:testing'
  db_url = url.format(db_url)

  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }
    var ignoreErrs = function (fn) {
      return function (callback) {
        fn(function () {
          var args = Array.prototype.slice.call(arguments, 1)
          return callback.apply(this, [null].concat(args))
        })
      }
    }
    var userdoc = {
      id: 'testuser',
      password: 'testing'
    }
    var tasks = [
      async.apply(hoodie.account.add, 'user', userdoc),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(db.grantReadAccess, 'user', 'testuser'),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(couchr.put, db_url + '/some_doc', {data: {asdf: 123}}),
      async.apply(db.revokeReadAccess, 'user', 'testuser'),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(couchr.put, db_url + '/some_doc2', {data: {asdf: 123}})
    ]
    async.series(tasks.map(ignoreErrs), function (err, results) {
      test.equal(results[1][1].statusCode, 401)
      test.equal(results[3][1].statusCode, 200)
      test.equal(results[4][1].statusCode, 401)
      // after revoke
      test.equal(results[6][1].statusCode, 401)
      test.equal(results[7][1].statusCode, 401)
      test.done()
    })
  })
}

exports['db.revokeReadAccess for a user with write access'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)

  var db_url = url.parse(COUCH.url + '/foo')
  db_url.auth = 'user/testuser:testing'
  db_url = url.format(db_url)

  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }
    var ignoreErrs = function (fn) {
      return function (callback) {
        fn(function () {
          var args = Array.prototype.slice.call(arguments, 1)
          return callback.apply(this, [null].concat(args))
        })
      }
    }
    var userdoc = {
      id: 'testuser',
      password: 'testing'
    }
    var tasks = [
      async.apply(hoodie.account.add, 'user', userdoc),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(db.grantWriteAccess, 'user', 'testuser'),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(couchr.put, db_url + '/some_doc', {data: {asdf: 123}}),
      async.apply(db.revokeReadAccess, 'user', 'testuser'),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(couchr.put, db_url + '/some_doc2', {data: {asdf: 123}})
    ]
    async.series(tasks.map(ignoreErrs), function (err, results) {
      test.equal(results[1][1].statusCode, 401)
      test.equal(results[3][1].statusCode, 200)
      test.equal(results[4][1].statusCode, 201)
      // after revoke - user cannot read or write
      test.equal(results[6][1].statusCode, 401)
      test.equal(results[7][1].statusCode, 401)
      test.done()
    })
  })
}

exports['db.grantPublicReadAccess / revokePublicReadAccess'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)

  var db_url = COUCH.url + '/foo'

  var db_url_testuser1 = url.parse(db_url)
  db_url_testuser1.auth = 'user/testuser1:testing'
  db_url_testuser1 = url.format(db_url_testuser1)

  var db_url_testuser2 = url.parse(db_url)
  db_url_testuser2.auth = 'user/testuser2:testing'
  db_url_testuser2 = url.format(db_url_testuser2)

  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }
    var ignoreErrs = function (fn) {
      return function (callback) {
        fn(function () {
          var args = Array.prototype.slice.call(arguments, 1)
          return callback.apply(this, [null].concat(args))
        })
      }
    }
    var opt = {data: {asdf: 123}}
    var userdoc1 = {
      id: 'testuser1',
      password: 'testing'
    }
    var userdoc2 = {
      id: 'testuser2',
      password: 'testing'
    }
    var tasks = [
      async.apply(hoodie.account.add, 'user', userdoc1),
      async.apply(hoodie.account.add, 'user', userdoc2),
      async.apply(db.grantWriteAccess, 'user', 'testuser1'),
      db.grantPublicReadAccess,
      async.apply(couchr.get, db_url_testuser1 + '/_all_docs'),
      async.apply(couchr.put, db_url_testuser1 + '/some_doc', opt),
      async.apply(couchr.get, db_url_testuser2 + '/_all_docs'),
      async.apply(couchr.put, db_url_testuser2 + '/some_doc2', opt),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(couchr.put, db_url + '/some_doc3', opt),
      db.revokePublicReadAccess,
      async.apply(couchr.get, db_url_testuser1 + '/_all_docs'),
      async.apply(couchr.put, db_url_testuser1 + '/some_doc4', opt),
      async.apply(couchr.get, db_url_testuser2 + '/_all_docs'),
      async.apply(couchr.put, db_url_testuser2 + '/some_doc5', opt),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(couchr.put, db_url + '/some_doc6', opt)
    ]
    async.series(tasks.map(ignoreErrs), function (err, results) {
      test.equal(results[4][1].statusCode, 200) // testuser1 read
      test.equal(results[5][1].statusCode, 201) // testuser1 write
      test.equal(results[6][1].statusCode, 200) // testuser2 read
      test.equal(results[7][1].statusCode, 401) // testuser2 write
      test.equal(results[8][1].statusCode, 200) // anonyous read
      test.equal(results[9][1].statusCode, 401) // anonymous write
      // after revoke - testuser1 retains original permisisons
      test.equal(results[11][1].statusCode, 200) // testuser1 read
      test.equal(results[12][1].statusCode, 201) // testuser1 write
      test.equal(results[13][1].statusCode, 401) // testuser2 read
      test.equal(results[14][1].statusCode, 401) // testuesr2 write
      test.equal(results[15][1].statusCode, 401) // anonymous read
      test.equal(results[16][1].statusCode, 401) // anonymous write
      test.done()
    })
  })
}

exports['db.grantPublicWriteAccess / revokePublicWriteAccess'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)

  var db_url = COUCH.url + '/foo'

  var db_url_testuser1 = url.parse(db_url)
  db_url_testuser1.auth = 'user/testuser1:testing'
  db_url_testuser1 = url.format(db_url_testuser1)

  var db_url_testuser2 = url.parse(db_url)
  db_url_testuser2.auth = 'user/testuser2:testing'
  db_url_testuser2 = url.format(db_url_testuser2)

  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }
    var ignoreErrs = function (fn) {
      return function (callback) {
        fn(function () {
          var args = Array.prototype.slice.call(arguments, 1)
          return callback.apply(this, [null].concat(args))
        })
      }
    }
    var opt = {data: {asdf: 123}}
    var userdoc1 = {
      id: 'testuser1',
      password: 'testing'
    }
    var userdoc2 = {
      id: 'testuser2',
      password: 'testing'
    }
    var tasks = [
      async.apply(hoodie.account.add, 'user', userdoc1),
      async.apply(hoodie.account.add, 'user', userdoc2),
      async.apply(db.grantWriteAccess, 'user', 'testuser1'),
      db.grantPublicWriteAccess,
      async.apply(couchr.get, db_url_testuser1 + '/_all_docs'),
      async.apply(couchr.put, db_url_testuser1 + '/some_doc1', opt),
      async.apply(couchr.get, db_url_testuser2 + '/_all_docs'),
      async.apply(couchr.put, db_url_testuser2 + '/some_doc2', opt),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(couchr.put, db_url + '/some_doc3', opt),
      db.revokePublicWriteAccess,
      async.apply(couchr.get, db_url_testuser1 + '/_all_docs'),
      async.apply(couchr.put, db_url_testuser1 + '/some_doc4', opt),
      async.apply(couchr.get, db_url_testuser2 + '/_all_docs'),
      async.apply(couchr.put, db_url_testuser2 + '/some_doc5', opt),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(couchr.put, db_url + '/some_doc6', opt)
    ]
    async.series(tasks.map(ignoreErrs), function (err, results) {
      test.equal(results[4][1].statusCode, 200) // testuser1 read
      test.equal(results[5][1].statusCode, 201) // testuser1 write
      test.equal(results[6][1].statusCode, 200) // testuser2 read
      test.equal(results[7][1].statusCode, 201) // testuser2 write
      test.equal(results[8][1].statusCode, 200) // anonyous read
      test.equal(results[9][1].statusCode, 201) // anonymous write
      // after revoke - testuser1 retains original permisisons
      test.equal(results[11][1].statusCode, 200) // testuser1 read
      test.equal(results[12][1].statusCode, 201) // testuser1 write
      test.equal(results[13][1].statusCode, 200) // testuser2 read
      test.equal(results[14][1].statusCode, 401) // testuesr2 write
      test.equal(results[15][1].statusCode, 200) // anonymous read
      test.equal(results[16][1].statusCode, 401) // anonymous write
      test.done()
    })
  })
}

exports['db.revokePublicReadAccess should also revoke public write access'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)

  var db_url = COUCH.url + '/foo'

  var db_url_testuser1 = url.parse(db_url)
  db_url_testuser1.auth = 'user/testuser1:testing'
  db_url_testuser1 = url.format(db_url_testuser1)

  var db_url_testuser2 = url.parse(db_url)
  db_url_testuser2.auth = 'user/testuser2:testing'
  db_url_testuser2 = url.format(db_url_testuser2)

  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }
    var ignoreErrs = function (fn) {
      return function (callback) {
        fn(function () {
          var args = Array.prototype.slice.call(arguments, 1)
          return callback.apply(this, [null].concat(args))
        })
      }
    }
    var opt = {data: {asdf: 123}}
    var userdoc1 = {
      id: 'testuser1',
      password: 'testing'
    }
    var userdoc2 = {
      id: 'testuser2',
      password: 'testing'
    }
    var tasks = [
      async.apply(hoodie.account.add, 'user', userdoc1),
      async.apply(hoodie.account.add, 'user', userdoc2),
      async.apply(db.grantReadAccess, 'user', 'testuser1'),
      db.grantPublicWriteAccess,
      async.apply(couchr.get, db_url_testuser1 + '/_all_docs'),
      async.apply(couchr.put, db_url_testuser1 + '/some_doc1', opt),
      async.apply(couchr.get, db_url_testuser2 + '/_all_docs'),
      async.apply(couchr.put, db_url_testuser2 + '/some_doc2', opt),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(couchr.put, db_url + '/some_doc3', opt),
      db.revokePublicReadAccess,
      async.apply(couchr.get, db_url_testuser1 + '/_all_docs'),
      async.apply(couchr.put, db_url_testuser1 + '/some_doc4', opt),
      async.apply(couchr.get, db_url_testuser2 + '/_all_docs'),
      async.apply(couchr.put, db_url_testuser2 + '/some_doc5', opt),
      async.apply(couchr.get, db_url + '/_all_docs'),
      async.apply(couchr.put, db_url + '/some_doc6', opt)
    ]
    async.series(tasks.map(ignoreErrs), function (err, results) {
      test.equal(results[4][1].statusCode, 200) // testuser1 read
      test.equal(results[5][1].statusCode, 201) // testuser1 write
      test.equal(results[6][1].statusCode, 200) // testuser2 read
      test.equal(results[7][1].statusCode, 201) // testuser2 write
      test.equal(results[8][1].statusCode, 200) // anonyous read
      test.equal(results[9][1].statusCode, 201) // anonymous write
      // after revoke - testuser1 retains original permisisons
      test.equal(results[11][1].statusCode, 200) // testuser1 read
      test.equal(results[12][1].statusCode, 401) // testuser1 write
      test.equal(results[13][1].statusCode, 401) // testuser2 read
      test.equal(results[14][1].statusCode, 401) // testuesr2 write
      test.equal(results[15][1].statusCode, 401) // anonymous read
      test.equal(results[16][1].statusCode, 401) // anonymous write
      test.done()
    })
  })
}

exports['pass subscribe and unsubscribe calls to manager'] = function (test) {
  var sources = []
  var hoodie = new PluginAPI(_.extend(DEFAULT_OPTIONS, {
    addSource: function (name) {
      sources.push(name)
    },
    removeSource: function (name) {
      sources = _.filter(sources, function (n) {
        return n !== name
      })
    }
  }))
  test.same(sources, [])
  hoodie.task.addSource('foo')
  test.same(sources, ['foo'])
  hoodie.task.addSource('bar')
  test.same(sources, ['foo', 'bar'])
  hoodie.task.removeSource('bar')
  test.same(sources, ['foo'])
  hoodie.task.removeSource('foo')
  test.same(sources, [])
  test.done()
}

exports['proxy task events'] = function (test) {
  test.done()
}

exports['accounts.parseDoc'] = function (test) {
  var doc = {
    '_id': 'org.couchdb.user:user/wobble',
    '_rev': '1-3d269028677df88e4e200b0740fa7971',
    'name': 'user/wobble',
    'type': 'user',
    'roles': [],
    'ownerHash': '1msc4g0',
    'database': 'user/1msc4g0',
    'updatedAt': '2013-08-02T13:11:36.646Z',
    'createdAt': '2013-08-02T13:11:36.646Z',
    'signedUpAt': '2013-08-02T13:11:36.646Z',
    'password_sha': '32010a749794347f10b1aea407db8c4230e7f27b',
    'salt': '90b42421db5d65d4126e7a6ce641840e'
  }
  test.same(require('../../../../lib/plugins/api/accounts').parseDoc(doc), {
    '_rev': '1-3d269028677df88e4e200b0740fa7971',
    'name': 'user/wobble',
    'type': 'user',
    'roles': [],
    'ownerHash': '1msc4g0',
    'database': 'user/1msc4g0',
    'updatedAt': '2013-08-02T13:11:36.646Z',
    'createdAt': '2013-08-02T13:11:36.646Z',
    'signedUpAt': '2013-08-02T13:11:36.646Z',
    'password_sha': '32010a749794347f10b1aea407db8c4230e7f27b',
    'salt': '90b42421db5d65d4126e7a6ce641840e',
    'id': 'wobble'
  })
  test.done()
}

exports['accounts.prepareDoc'] = function (test) {
  var doc = {
    '_rev': '1-3d269028677df88e4e200b0740fa7971',
    'name': 'user/wobble',
    'type': 'user',
    'roles': [],
    'ownerHash': '1msc4g0',
    'database': 'user/1msc4g0',
    'updatedAt': '2013-08-02T13:11:36.646Z',
    'createdAt': '2013-08-02T13:11:36.646Z',
    'signedUpAt': '2013-08-02T13:11:36.646Z',
    'password_sha': '32010a749794347f10b1aea407db8c4230e7f27b',
    'salt': '90b42421db5d65d4126e7a6ce641840e',
    'id': 'wobble'
  }
  test.same(require('../../../../lib/plugins/api/accounts').prepareDoc(doc), {
    '_id': 'org.couchdb.user:user/wobble',
    '_rev': '1-3d269028677df88e4e200b0740fa7971',
    'name': 'user/wobble',
    'type': 'user',
    'roles': [],
    'ownerHash': '1msc4g0',
    'database': 'user/1msc4g0',
    'updatedAt': '2013-08-02T13:11:36.646Z',
    'createdAt': '2013-08-02T13:11:36.646Z',
    'signedUpAt': '2013-08-02T13:11:36.646Z',
    'password_sha': '32010a749794347f10b1aea407db8c4230e7f27b',
    'salt': '90b42421db5d65d4126e7a6ce641840e'
  })
  test.done()
}

exports['db.remove: access doc properties on delete change'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var doc = {
    id: 'bar',
    title: 'wibble'
  }
  async.series([
    async.apply(hoodie.database.add, 'foo'),
    async.apply(hoodie.database('foo').add, 'mytype', doc),
    async.apply(hoodie.database('foo').remove, 'mytype', doc.id),
    async.apply(
      couchr.get,
      hoodie._resolve('/foo/_changes'),
      {include_docs: true}
    ),
    async.apply(hoodie.database.remove, 'foo')
  ], function (err, results) {
    if (err) {
      return test.done(err)
    }
    var change = results[3][0].results[1]
    delete change.doc._rev
    delete change.doc.createdAt
    test.same(change.doc, {
      _id: 'mytype/' + doc.id,
      _deleted: true,
      title: doc.title,
      id: doc.id,
      type: 'mytype'
    })
    test.done()
  })
}

exports['pass sendEmail calls to plugins-manager'] = function (test) {
  test.expect(2)
  var email = {
    to: 'to@hood.ie',
    from: 'from@hood.ie',
    subject: 'wibble',
    text: 'wobble'
  }
  var hoodie = new PluginAPI(_.extend(DEFAULT_OPTIONS, {
    sendEmail: function (opt, callback) {
      test.same(opt, email)
      callback('some error')
    }
  }))
  hoodie.sendEmail(email, function (err) {
    // test errors are passed back to hoodie.sendEmail callback
    test.equal(err, 'some error')
    test.done()
  })
}

exports['db.add: set createdAt'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var doc = {
    id: 'bar',
    title: 'wibble'
  }
  async.series([
    async.apply(hoodie.database.add, 'foo'),
    async.apply(hoodie.database('foo').add, 'mytype', doc),
    async.apply(hoodie.database('foo').find, 'mytype', 'bar')
  ],
    function (err, results) {
      if (err) {
        return test.done(err)
      }
      var doc = results[2]
      test.ok(doc.createdAt, 'createdAt property set')
      test.done()
    })
}

exports['db.addPermission / db.removePermission'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var permission_fn = function (newDoc) {
    if (newDoc.type === 'notthis') {
      var err = new Error('nope')
      err.unauthorized = 'nope!'
      throw err
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
    if (err) {
      return test.done(err)
    }
    test.ok(_.isArray(results))
    hoodie.database('foo').add('notthis', doc, function (err) {
      // saving doc should error
      test.ok(err)
      async.series([
        async.apply(hoodie.database('foo').removePermission,
          'mypermission'
        ),
        async.apply(hoodie.database('foo').add, 'notthis', doc)
      ], function (err) {
        // should be able to save doc now
        test.ok(!err)
        test.done()
      })
    })
  })
}

exports['database.add with existing db'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  async.series([
    async.apply(hoodie.database.add, 'foo'),
    async.apply(hoodie.database.add, 'foo')
  ],
    test.done)
}

exports['db.addPermission with existing doc'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var permission_fn = function (newDoc) {
    if (newDoc.type === 'notthis') {
      var err = new Error('nope')
      err.unauthorized = 'nope!'
      throw err
    }
  }
  var permission_fn2 = function () {
    var err = new Error('nope2')
    err.unauthorized = 'nope2!'
    throw err
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
    if (err) {
      return test.done(err)
    }
    test.ok(_.isArray(results))
    hoodie.database('foo').add('mytype', doc, function (err) {
      // saving any doc should now error (thanks to permission_fn2)
      test.ok(err)
      async.series([
        async.apply(hoodie.database('foo').removePermission,
          'mypermission'
        ),
        async.apply(hoodie.database('foo').add, 'notthis', doc)
      ], function (err) {
        // should be able to save doc now
        test.ok(!err)
        test.done()
      })
    })
  })
}

exports['db.add / db.addIndex / db.query'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }

    var doc1 = {id: 'rich-tea', name: 'Rich tea'}
    var doc2 = {id: 'digestive', name: 'Digestive'}
    var doc3 = {id: 'chocolate-chip', name: 'Chocolate chip'}

    async.parallel([
      async.apply(db.add, 'biscuit', doc1),
      async.apply(db.add, 'biscuit', doc2),
      async.apply(db.add, 'cookie', doc3)
    ], function (err) {
      if (err) {
        return test.done(err)
      }
      var index = {
        map: function (doc) {
          emit(doc.type, 1)
        },
        reduce: function (key, values) {
          return sum(values)
        }
      }

      db.addIndex('by_type', index, function (err, data) {
        if (err) {
          return test.done(err)
        }
        test.ok(data.ok)
        test.equal(data.id, '_design/views')
        test.equal(typeof data.rev, 'string')

        db.query('by_type', { group_level: 1 }, function (err, rows) {
          if (err) {
            return test.done(err)
          }
          test.ok(_.isArray(rows))
          test.equal(rows.length, 2)
          test.equal(rows[0].key, 'biscuit')
          test.equal(rows[0].value, 2)
          test.equal(rows[1].key, 'cookie')
          test.equal(rows[1].value, 1)
          test.done()
        })
      })
    })
  })
}

exports['db.addIndex / db.add / db.query with and without params.parse'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }

    var index = {
      map: function (doc) {
        emit(doc.type, doc)
      }
    }

    async.parallel([
      async.apply(db.add, 'biscuit', {id: 'rich-tea'}),
      async.apply(db.add, 'biscuit', {id: 'digestive'}),
      async.apply(db.add, 'cookie', {id: 'chocolate-chip'}),
      async.apply(db.addIndex, 'by_type', index)
    ], function (err) {
      if (err) {
        return test.done(err)
      }

      db.query('by_type', { parse: true }, function (err, rows, meta) {
        if (err) {
          return test.done(err)
        }
        test.ok(_.isArray(rows))
        test.equal(rows.length, 3)
        // we expect an array of parsed docs because we used the
        // `params.parse` option.
        rows.forEach(function (row) {
          test.equal(typeof row.id, 'string')
          test.equal(typeof row._rev, 'string')
          test.equal(typeof row.type, 'string')
          test.equal(typeof row.createdAt, 'string')
        })

        test.equal(meta.total_rows, 3)
        test.equal(meta.offset, 0)

        db.query('by_type', function (err, rows, meta) {
          if (err) {
            return test.done(err)
          }
          test.ok(_.isArray(rows))
          test.equal(rows.length, 3)
          // Now we expect array of standard couchdb view results as
          // we did not use `params.parse`.
          rows.forEach(function (row) {
            test.equal(typeof row.id, 'string')
            test.equal(typeof row.key, 'string')
            test.equal(typeof row.value, 'object')
            test.equal(typeof row.value._id, 'string')
            test.equal(typeof row.value._rev, 'string')
            test.equal(typeof row.value.type, 'string')
            test.equal(typeof row.value.createdAt, 'string')
          })

          test.equal(meta.total_rows, 3)
          test.equal(meta.offset, 0)

          test.done()
        })
      })
    })
  })
}

exports['db.addIndex / db.removeIndex'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }

    var index = {
      map: function (doc) {
        emit(doc.type, 1)
      }
    }

    db.addIndex('by_type', index, function (err, data) {
      if (err) {
        return test.done(err)
      }
      test.ok(data.ok)
      test.equal(data.id, '_design/views')
      test.equal(typeof data.rev, 'string')

      db.query('by_type', function (err, rows, meta) {
        if (err) {
          return test.done(err)
        }
        test.ok(_.isArray(rows))
        test.equal(meta.total_rows, 0)
        test.equal(meta.offset, 0)

        db.removeIndex('by_type', function (err, data) {
          if (err) {
            return test.done(err)
          }
          test.ok(data.ok)
          test.equal(data.id, '_design/views')
          test.equal(typeof data.rev, 'string')

          // Now that index has been removed we shouldnt be able to
          // query the non existent view.
          db.query('by_type', function (err) {
            test.equal(err.error, 'not_found')
            test.equal(err.reason, 'missing_named_view')
            test.done()
          })
        })
      })
    })
  })
}

exports['db.addIndex twice without changes to map/reduce'] = function (test) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) {
      return test.done(err)
    }

    var index = {
      map: function (doc) {
        emit(doc.type, 1)
      }
    }

    db.addIndex('by_type', index, function (err, data) {
      if (err) {
        return test.done(err)
      }
      test.ok(data.ok)

      db.addIndex('by_type', index, function (err, data) {
        if (err) {
          return test.done(err)
        }
        // response should be ok but note that rev is still 1 as adding
        // the exact same view more than once won't result in the design
        // document being updated in the database.
        test.equal(data.ok, true)
        test.equal(data.id, '_design/views')
        test.ok(/^1-/.test(data.rev))
        test.done()
      })
    })
  })
}
