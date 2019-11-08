var _ = require('lodash')
var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test

var serverMock = {
  register: simple.stub(),
  route: simple.stub(),
  ext: simple.stub()
}

function loadPublicPlugin (options, resolver, done) {
  var mergedOptions = _.merge({
    paths: {
      public: 'my-custom-public-directory'
    },
    plugins: []
  }, options)

  proxyquire('../../../server/plugins/public', {
    './resolver': resolver,
    'hoodie-plugin-with-public/package.json': {
      name: 'plugin-public1'
    },
    'hoodie-plugin-with-public-and-custom-name/package.json': {
      name: 'plugin-public2',
      hoodie: {
        name: 'custom-name'
      }
    },
    'hoodie-plugin-with-public-and-hoodie-option/package.json': {
      name: 'plugin-public3',
      hoodie: {}
    }
  }).register(serverMock, mergedOptions, done)
}

test('public', function (group) {
  group.test('configured public route', function (t) {
    function resolver (path) {
      return path
    }

    loadPublicPlugin({}, resolver, function (error) {
      t.error(error)
      t.equal(serverMock.route.callCount, 1, 'route was called')
      t.type(serverMock.route.lastCall.arg, Array, 'route was called with an array')
      t.contains(serverMock.route.lastCall.arg[0],
        { handler: { directory: { path: /^my-custom-public-directory$/ } } },
        'route was configured to correct public directory')
      t.end()
    })
  })

  group.test('plugin with public path', function (t) {
    function resolver (path) {
      return path
    }

    loadPublicPlugin({
      plugins: ['hoodie-plugin-with-public']
    }, resolver, function (error) {
      t.error(error)

      var pluginRouteOptions = serverMock.route.lastCall.arg.pop()
      t.is(pluginRouteOptions.path, '/hoodie/plugin-public1/{p*}')
      t.end()
    })
  })

  group.test('plugin with custom name and public path', function (t) {
    function resolver (path) {
      return path
    }

    loadPublicPlugin({
      plugins: ['hoodie-plugin-with-public-and-custom-name']
    }, resolver, function (error) {
      t.error(error)

      var pluginRouteOptions = serverMock.route.lastCall.arg.pop()
      t.is(pluginRouteOptions.path, '/hoodie/custom-name/{p*}')
      t.end()
    })
  })

  group.test('plugin with custom name and public path', function (t) {
    function resolver (path) {
      return path
    }

    loadPublicPlugin({
      plugins: ['hoodie-plugin-with-public-and-hoodie-option']
    }, resolver, function (error) {
      t.error(error)

      var pluginRouteOptions = serverMock.route.lastCall.arg.pop()
      t.is(pluginRouteOptions.path, '/hoodie/plugin-public3/{p*}')
      t.end()
    })
  })

  group.test('plugin without public path', function (t) {
    var error = new Error('Module Not Found Error')
    error.code = 'MODULE_NOT_FOUND'

    function resolver (path) {
      if (/hoodie-plugin-without-public/.test(path)) {
        throw error
      }

      return path
    }

    loadPublicPlugin({
      plugins: ['hoodie-plugin-without-public']
    }, resolver, function (error) {
      t.error(error)
      t.end()
    })
  })

  group.test('require error', function (t) {
    function resolver (path) {
      if (/hoodie-plugin-foobar/.test(path)) {
        throw new Error('Oops')
      }

      return path
    }

    t.throws(function () {
      loadPublicPlugin({
        plugins: ['hoodie-plugin-foobar']
      }, resolver, function () {})
    })
    t.end()
  })

  group.end()
})
