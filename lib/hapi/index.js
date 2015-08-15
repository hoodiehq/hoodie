var plugins = [require('inert'), require('h2o2')]

module.exports = function (env_config) {
  return plugins.concat([
    require('./api'),
    require('./directories'),
    require('./logger'),
    require('./handle_404')
  ].map(function (plugin) {
    return {
      register: plugin,
      options: {
        app: env_config
      }
    }
  }))
}
