var plugins = [require('inert'), require('h2o2')]
var rootPathFactory = require('./root_path_factory')

module.exports = function (env_config) {
  return plugins.concat([
    require('./api'),
    rootPathFactory('admin', 'admin_root'),
    rootPathFactory('web', 'www_root'),
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
