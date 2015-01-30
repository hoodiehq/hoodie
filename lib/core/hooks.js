var _ = require('lodash');

module.exports = function (env_config, callback) {

  // runs a hook for all registered plugins
  var run = function (type, name, args) {

    if (env_config.verbose) {
      console.log('run %s hook: %s', type, name);
    }

    var ran = false;

    // for all plugins
    _.each(env_config.plugins, function (plugin) {
      // find if has hook `name` of `type`
      if (plugin.hooks[type] && plugin.hooks[type][name]) {
        // call the hook
        plugin.hooks[type][name].apply(env_config, args);
        ran = true;
      }
    });
    return ran;
  };

  // runs hook for a specific plugin
  var runForPlugin = function (type, plugin, name, args) {

    plugin = 'hoodie-plugin-' + plugin;
    if (env_config.plugins[plugin] && env_config.plugins[plugin].hooks[type][name]) {
      return env_config.plugins[plugin].hooks[type][name].apply(env_config, args);
    }
    return false;
  };

  env_config.hooks = {
    runStatic: run.bind(this, 'static'),
    runDynamic: run.bind(this, 'dynamic'),
    runDynamicForPlugin: runForPlugin.bind(this, 'dynamic')
  };

  return callback(null, env_config);
};

