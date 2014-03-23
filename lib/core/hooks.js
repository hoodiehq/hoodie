var _ = require('lodash');

module.exports = function (config, callback) {

  // runs a hook for all registered plugins
  var run = function (type, name, args) {

    console.log('run %s hook: %s', type, name);

    var ran = false;

    // for all plugins
    _.each(config.plugins, function (plugin) {
      // find if has hook `name` of `type`
      if (plugin.hooks[type] && plugin.hooks[type][name]) {
        // call the hook
        plugin.hooks[type][name].apply(config, args);
        ran = true;
      }
    });
    return ran;
  };

  // runs hook for a specific plugin
  var runForPlugin = function (type, plugin, name, args) {

    plugin = 'hoodie-plugin-' + plugin;
    if (config.plugins[plugin]
     && config.plugins[plugin].hooks[type][name]) {
      return config.plugins[plugin].hooks[type][name].apply(config, args);
    }
    return false;
  };

  config.hooks = {
    runStatic: run.bind(this, 'static'),
    runDynamic: run.bind(this, 'dynamic'),
    runDynamicForPlugin: runForPlugin.bind(this, 'dynamic')
  };

  return callback(null, config);
};
