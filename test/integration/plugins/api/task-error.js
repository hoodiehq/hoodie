var moment = require('moment')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('../lib/default-options')

require('../lib/setup-teardown')(tap)

test('task.error', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.task.on('email:add', function (dbname, task) {
    t.same(Object.keys(task).sort(), [
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
      if (err) t.fail()
      t.same(Object.keys(task).sort(), [
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
      t.ok(moment(task.$processedAt).isValid())
      t.same(task.$error, {
        error: 'connection_error',
        message: 'email could not be sent'
      })
      t.end()
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
    if (err) t.fail()

    db.add('$email', email, function (err, doc) {
      if (err) t.fail()
      email._id = doc.id
      email._rev = doc.rev
      hoodie.task.emit('email:add', 'testdb', email)
    })
  })
})
