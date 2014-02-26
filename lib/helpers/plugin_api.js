/**
 * Serves static assets for Hoodie plugins
 *
 */

var path = require('path');

var pluginsFrom = function (config) {
  return Object.keys(config.plugins);
};

exports.metadata = function (config) {

  return pluginsFrom(config).map(function (id) {
    var meta = config.plugins[id].metadata;
    var name = meta.name.replace(/^hoodie-plugin-/, '');
    return {
      name: name,
      title: meta.title || name,
      description: meta.description,
      version: meta.version
    };
  });

};

exports.pockets = function (config) {

  return pluginsFrom(config).reduce(function (acc, id) {
    var plugin = config.plugins[id];
    var name = plugin.metadata.name.replace(/^hoodie-plugin-/, '');

    acc[name] = path.resolve(config.project_dir, 'node_modules', plugin.path, 'pocket');

    return acc;
  }, {});

};

/*
  Return an object of plugin names and paths to all plugin's `api.js` files
*/
exports.pluginsWithApi = function (config) {
  var makePath = function (acc, id) {
    var plugin = config.plugins[id];
    var name = plugin.metadata.name.replace(/^hoodie-plugin-/, '');
    var plugin_path = path.resolve(config.project_dir, 'node_modules', plugin.path, 'api.js');
    acc[name] = plugin_path;
    return acc;
  };

  return pluginsFrom(config).reduce(makePath, {});
};
