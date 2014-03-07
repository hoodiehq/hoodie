var _ = require('lodash');

module.exports = function (config, callback) {

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
  }

  config.hooks = {
    runStatic: run.bind(this, 'static'),
    runDynamic: run.bind(this, 'dynamic')
  };

  return callback(null, config);
};
