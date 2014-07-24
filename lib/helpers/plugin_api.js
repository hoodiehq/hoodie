/**
 * Serves static assets for Hoodie plugins
 *
 */

var path = require('path');

var pluginsFrom = function (env_config) {
  return Object.keys(env_config.plugins);
};

exports.metadata = function (env_config) {

  return pluginsFrom(env_config).map(function (id) {
    var meta = env_config.plugins[id].metadata;
    var name = meta.name.replace(/^hoodie-plugin-/, '');
    return {
      name: name,
      title: meta.title || name,
      description: meta.description,
      version: meta.version
    };
  });

};

exports.admin_dashboards = function (env_config) {

  return pluginsFrom(env_config).reduce(function (acc, id) {
    var plugin = env_config.plugins[id];
    var name = plugin.metadata.name.replace(/^hoodie-plugin-/, '');

    acc[name] = path.resolve(env_config.project_dir, 'node_modules', plugin.path, 'admin-dashboard');

    return acc;
  }, {});

};

/*
  Return an object of plugin names and paths to all plugin's `api.js` files
*/
exports.pluginsWithApi = function (env_config) {
  var makePath = function (acc, id) {
    var plugin = env_config.plugins[id];
    var name = plugin.metadata.name.replace(/^hoodie-plugin-/, '');
    var plugin_path = path.resolve(env_config.project_dir, 'node_modules', plugin.path, 'api.js');
    acc[name] = plugin_path;
    return acc;
  };

  return pluginsFrom(env_config).reduce(makePath, {});
};
