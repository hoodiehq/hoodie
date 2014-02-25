var _ = require('underscore');

module.exports = function (config, callback) {

  config.hooks = {
    run: function (name, args) {
      console.log('trying to run hook: ' + name);
      // for all plugins
      _.each(config.plugins, function (plugin) {
        // find if has hook `name`
        if (plugin.hooks[name]) {
          // call the hook
          return plugin.hooks[name].apply(config, args);
        } else {
          return false;
        }
      });
    }
  };

  return callback(null, config);
};
