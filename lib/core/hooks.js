var _ = require('lodash');
var async = require('async');

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

  // todo: refactor run() to use this
  var getHooksFromPlugins = function(type, name) {
    return _.compact(_.map(env_config.plugins, function(plugin) {
      if(plugin.hooks[type] && plugin.hooks[type][name]) {
        return plugin.hooks[type][name];
      }
    }));
  };

  var runAsyncEvery = function(type, name, args, callback) {
    var runHook = function(hook, callback) {
      args.push(callback);
      hook.apply(env_config, args);
    };

    // go through all plugins and fetch hook `name`
    // execute all hooks `name` in `async.every`, passing args + callback
    var hooks = getHooksFromPlugins(type, name);
    async.every(hooks, runHook, callback);
  };

  env_config.hooks = {
    runStatic: run.bind(this, 'static'),
    runDynamic: run.bind(this, 'dynamic'),
    runDynamicForPlugin: runForPlugin.bind(this, 'dynamic'),
    runStaticAsyncEvery: runAsyncEvery.bind(this, 'static'),
    runDynamicAsyncEvery: runAsyncEvery.bind(this, 'dynamic')
  };

  return callback(null, env_config);
};

