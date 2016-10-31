var simple = require('simple-mock')
var test = require('tap').test

test('public', function (group) {
  var serverMock

  group.beforeEach(function (done) {
    serverMock = {
      register: simple.stub(),
      route: simple.stub(),
      ext: simple.stub()
    }

    require('../../../server/plugins/public').register(serverMock, {
      config: {
        paths: {
          public: 'my-custom-public-directory'
        }
      }
    }, function () { return })

    done()
  })

  group.test('configured public route', function (t) {
    t.equal(serverMock.route.callCount, 1, 'route was called')
    t.type(serverMock.route.lastCall.args[0], Array, 'route was called with an array')
    t.contains(serverMock.route.lastCall.args[0][0],
      {'handler': {'directory': {'path': /^my-custom-public-directory$/}}},
      'route was configured to correct public directory')
    t.end()
  })

  group.end()
})
