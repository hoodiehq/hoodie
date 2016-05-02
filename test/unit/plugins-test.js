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
  group.test('account registration', function (group) {
    registerPlugins({
      account: 'account options'
    }, function (error, plugins) {
      group.error(error)

      var accountPlugin = plugins[plugins.length - 2]

      group.is(accountPlugin.options, 'account options', 'passes config.account')
      group.is(accountPlugin.routes.prefix, '/hoodie/account/api', 'sets account path prefix')

      group.end()
    })
  })

  group.test('store registration', function (group) {
    registerPlugins({
      store: 'store options'
    }, function (error, plugins) {
      group.error(error)

      var accountPlugin = plugins[plugins.length - 1]

      group.is(accountPlugin.options, 'store options', 'passes config.store')
      group.is(accountPlugin.routes.prefix, '/hoodie/store/api', 'sets store path prefix')

      group.end()
    })
  })

  group.end()
})
