var simple = require('simple-mock')
var test = require('tap').test
var proxyquire = require('proxyquire').noCallThru()

var registerPlugins = proxyquire('../../lib/plugins', {
  '@hoodie/store': function () {},
  '@hoodie/account': function () {}
})

require('npmlog').level = 'silent'

test('plugins', function (group) {
  group.test('account registration', function (group) {
    var server = {
      register: simple.stub().callbackWith(null)
    }
    var config = { account: 'account options' }
    registerPlugins(server, config, function (error) {
      group.error(error)

      var plugins = server.register.lastCall.arg
      var accountPlugin = plugins[plugins.length - 2]

      group.is(accountPlugin.options, 'account options', 'passes config.account')
      group.is(accountPlugin.routes.prefix, '/hoodie/account/api', 'sets account path prefix')

      group.end()
    })
  })

  group.test('store registration', function (group) {
    var server = {
      register: simple.stub().callbackWith(null)
    }
    var config = { store: 'store options' }
    registerPlugins(server, config, function (error) {
      group.error(error)

      var plugins = server.register.lastCall.arg
      var accountPlugin = plugins[plugins.length - 1]

      group.is(accountPlugin.options, 'store options', 'passes config.store')
      group.is(accountPlugin.routes.prefix, '/hoodie/store/api', 'sets store path prefix')

      group.end()
    })
  })

  group.end()
})
