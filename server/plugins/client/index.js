module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-local-client',
  dependencies: 'inert'
}

var path = require('path')

var createBundleHandler = require('./bundle-handler-factory')

function register (server, options, next) {
  var hoodieClientModulePath = path.dirname(require.resolve('@hoodie/client/package.json'))
  var hoodieClientPath = path.join(hoodieClientModulePath, 'index.js')
  var bundleTargetPath = path.join(options.data || '.hoodie', 'client.js')

  // TODO: add /hoodie/client.min.js path
  // https://github.com/hoodiehq/hoodie-client/issues/34

  server.route([{
    method: 'GET',
    path: '/hoodie/client.js',
    handler: createBundleHandler(hoodieClientPath, bundleTargetPath, options)
  }])

  next()
}
