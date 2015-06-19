var _ = require('lodash');
var async = require('async');

module.exports = function (env_config, callback) {

  var getHooksFromPlugins = function(type, name, args) {
    return _.compact(_.map(env_config.plugins, function(plugin) {
      if(plugin.hooks[type] && typeof plugin.hooks[type][name] === 'function') {
        return Function.prototype.bind.apply(
          plugin.hooks[type][name],
          [ env_config ].concat(args || [])
        );
      }
    }));
  };

  // runs a hook for all registered plugins
  var run = function (type, name, args) {
    if (env_config.verbose) {
      console.log('run %s hook: %s', type, name);
    }

    var hooks = getHooksFromPlugins(type, name, args);
    hooks.forEach(function (hook) {
      hook();
    });

    return !!hooks.length;
  };

  // runs hook for a specific plugin
  var runForPlugin = function (type, plugin, name, args) {
    plugin = 'hoodie-plugin-' + plugin;
    if (env_config.plugins[plugin] && env_config.plugins[plugin].hooks[type][name]) {
      return env_config.plugins[plugin].hooks[type][name].apply(env_config, args);
    }
    return false;
  };

  var runAsyncEvery = function(type, name, args, callback) {
    var runHook = function(hook, cb) {
      hook(cb);
    };

    // go through all plugins and fetch hook `name`
    // execute all hooks `name` in `async.every`, passing args + callback
    var hooks = getHooksFromPlugins(type, name, args);
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
