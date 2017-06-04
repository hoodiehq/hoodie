var simple = require('simple-mock')
var test = require('tap').test
var proxyquire = require('proxyquire').noCallThru()

var mockResolver = simple.stub()
var registerPlugins = proxyquire('../../../server/plugins', {
  './resolver': mockResolver,
  'hoodie-plugin-exists/package.json': {
    name: 'exists'
  },
  'hoodie-plugin-exists/hoodie/server': {},
  'hoodie-plugin-exists-with-hoodie-option/package.json': {
    name: 'exists-with-hoodie-option',
    hoodie: {}
  },
  'hoodie-plugin-exists-with-hoodie-option/hoodie/server': {},
  'hoodie-plugin-exists-with-custom-name/package.json': {
    name: 'exists-with-hoodie-option',
    hoodie: {
      name: 'custom-name'
    }
  },
  'hoodie-plugin-exists-with-custom-name/hoodie/server': {},
  'hoodie-plugin-exists-with-register/hoodie/server': {
    register: function () {}
  },
  'hoodie-plugin-exists-with-register/package.json': {
    name: 'exists'
  }
})
var registerPluginsError = new Error('Plugin Register Error')
var serverMock = {
  register: simple.stub().callbackWith(registerPluginsError)
}

test('when require.resolve errors', function (t) {
  var options = {
    paths: {
      public: 'public'
    },
    plugins: [
      'hoodie-plugin-foobar'
    ]
  }

  var error = new Error('Unspecified error')
  mockResolver.throwWith(error)

  t.throws(function () {
    registerPlugins(serverMock, options, function () {
      t.fail('the error has not been rethrown')
    })
  }, error, 'the error is rethrown')
  t.end()
})

test('when requiring plugin succeeds', function (t) {
  var options = {
    paths: {
      public: 'public'
    },
    plugins: [
      'hoodie-plugin-exists'
    ]
  }

  mockResolver.callFn(function (path) {
    return path
  })

  registerPlugins(serverMock, options, function (error) {
    t.ok(error)
    t.equal(error, registerPluginsError)
    t.end()
  })
})

test('when requiring plugin with hoodie', function (t) {
  var options = {
    paths: {
      public: 'public'
    },
    plugins: [
      'hoodie-plugin-exists-with-hoodie-option'
    ]
  }

  mockResolver.callFn(function (path) {
    return path
  })

  registerPlugins(serverMock, options, function (error) {
    t.ok(error)
    t.equal(error, registerPluginsError)
    t.end()
  })
})

test('when requiring plugin with custom name', function (t) {
  var options = {
    paths: {
      public: 'public'
    },
    plugins: [
      'hoodie-plugin-exists-with-custom-name'
    ]
  }

  mockResolver.callFn(function (path) {
    return path
  })

  registerPlugins(serverMock, options, function (error) {
    t.ok(error)
    t.equal(error, registerPluginsError)
    t.end()
  })
})

test('when requiring plugin errors', function (t) {
  var options = {
    paths: {
      public: 'public'
    },
    plugins: [
      'hoodie-plugin-error'
    ]
  }
  var error = new Error('Module Not Found Error')
  error.code = 'MODULE_NOT_FOUND'
  mockResolver.throwWith(error)
  registerPlugins(serverMock, options, function (error) {
    t.ok(error)
    t.equal(error, registerPluginsError)
    t.end()
  })
})

test('when requiring plugin which exports {register: plugin}', function (t) {
  var options = {
    paths: {
      public: 'public'
    },
    plugins: [
      'hoodie-plugin-exists-with-register'
    ]
  }

  mockResolver.callFn(function (path) {
    return path
  })

  registerPlugins(serverMock, options, function (error) {
    t.ok(error)
    t.equal(error, registerPluginsError)
    t.end()
  })
})
