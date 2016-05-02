var test = require('tap').test
require('npmlog').level = 'silent'

var pluginMock = function () {}
pluginMock['@noCallThru'] = true
var proxyquire = require('proxyquire', {
  '@hoodie/store': pluginMock,
  '@hoodie/account': pluginMock
})

var registerPlugins = proxyquire('../../lib/plugins', {

})

test('plugins', function (group) {
  group.test('account registration', function (t) {
    registerPlugins({
      account: 'account options'
    }, function (error, plugins) {
      t.error(error)

      var accountPlugin = plugins[plugins.length - 2]

      t.is(accountPlugin.options, 'account options', 'passes config.account')
      t.is(accountPlugin.routes.prefix, '/hoodie/account/api', 'sets account path prefix')

      t.end()
    })
  })

  group.test('store registration', function (t) {
    registerPlugins({
      store: 'store options'
    }, function (error, plugins) {
      t.error(error)

      var accountPlugin = plugins[plugins.length - 1]

      t.is(accountPlugin.options, 'store options', 'passes config.store')
      t.is(accountPlugin.routes.prefix, '/hoodie/store/api', 'sets store path prefix')

      t.end()
    })
  })

  group.end()
})
