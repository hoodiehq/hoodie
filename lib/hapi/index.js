var url = require('url')

var _ = require('lodash')

var plugins = [require('inert'), require('h2o2')]

module.exports = function (env_config) {
  var defaultOpts = {
    couchdb: url.format(_.omit(env_config.db, 'auth')),
    prefix: '/hoodie/account'
  }

  return plugins.concat([
    require('./api'),
    require('./directories'),
    require('./logger'),
    require('./handle-404')
  ].map(function (plugin) {
    return {
      register: plugin,
      options: {
        app: env_config
      }
    }
  }), [{
    register: require('hapi-couchdb-store/lib/routes/couchdb-proxy'),
    options: _.defaults({prefix: '/hoodie/store'}, defaultOpts)
  }, {
    register: require('hapi-couchdb-account/lib/routes/session'),
    options: defaultOpts
  }, {
    register: require('hapi-couchdb-account/lib/routes/account'),
    options: defaultOpts
  }],
  _(env_config)
  .values()
  .pluck('hooks.hapi')
  .compact()
  .value())
}
