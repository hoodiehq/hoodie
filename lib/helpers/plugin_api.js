/**
 * Serves static assets for Hoodie plugins
 *
 */

var path = require('path');

exports.metadata = function (config) {

  return Object.keys(config.plugins).map(function (id) {
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

  return Object.keys(config.plugins).reduce(function (acc, id) {
    var plugin = config.plugins[id];
    var name = plugin.metadata.name.replace(/^hoodie-plugin-/, '');

    acc[name] = path.resolve(config.project_dir, 'node_modules', plugin.path, 'pocket');

    return acc;
  }, {});

};
