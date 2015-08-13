var _ = require('lodash')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('pass sendEmail calls to plugins-manager', function (t) {
  t.plan(2)
  var email = {
    to: 'to@hood.ie',
    from: 'from@hood.ie',
    subject: 'wibble',
    text: 'wobble'
  }
  var hoodie = new PluginAPI(_.extend(DEFAULT_OPTIONS, {
    sendEmail: function (opt, callback) {
      t.same(opt, email)
      callback('some error')
    }
  }))
  hoodie.sendEmail(email, function (err) {
    // test errors are passed back to hoodie.sendEmail callback
    t.equal(err, 'some error')
    t.end()
  })
})
