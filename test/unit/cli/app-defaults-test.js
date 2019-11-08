var proxyquire = require('proxyquire').noCallThru()
var test = require('tap').test

var pathMock = {
  join: function () { return './package.json' }
}

test('app options', function (group) {
  group.test('without hoodie setting', function (t) {
    var getAppDefaults = proxyquire('../../../cli/app-defaults', {
      path: pathMock,
      './package.json': {
        name: 'pkg-name'
      }
    })
    var options = getAppDefaults()

    t.deepEqual(options, { name: 'pkg-name' }, 'sets name from pkg.name')

    t.end()
  })

  group.test('with hoodie.port', function (t) {
    var getAppDefaults = proxyquire('../../../cli/app-defaults', {
      path: pathMock,
      './package.json': {
        name: 'pkg-name',
        hoodie: {
          port: 1234
        }
      }
    })
    var options = getAppDefaults()

    t.deepEqual(options.port, 1234, 'sets port from pkg.hoodie.port')

    t.end()
  })

  group.test('with hoodie.name', function (t) {
    var getAppDefaults = proxyquire('../../../cli/app-defaults', {
      path: pathMock,
      './package.json': {
        name: 'pkg-name',
        hoodie: {
          name: 'foo'
        }
      }
    })
    var options = getAppDefaults()

    t.deepEqual(options.name, 'foo', 'sets name from pkg.hoodie.name')

    t.end()
  })

  group.end()
})
