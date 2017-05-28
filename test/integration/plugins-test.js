var simple = require('simple-mock')
var test = require('tap').test

var hapiPlugin = require('../../server')
var serverMock = {
  register: simple.stub().callbackWith(null),
  ext: simple.stub()
}

require('npmlog').level = 'error'

test('plugins', function (t) {
  hapiPlugin.register(serverMock, {
    paths: {
      data: '.'
    },
    plugins: ['hoodie-plugin-foobar'],
    app: {}
  }, function (error) {
    t.error(error)
    t.end()
  })
})
