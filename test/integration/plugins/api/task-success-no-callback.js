var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('task.success no callback', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.task.on('email:add', function (dbname, task) {
    hoodie.task.success(dbname, task)
    setTimeout(t.end, 200)
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
