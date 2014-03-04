var _ = require('lodash');

module.exports = function (config, callback) {

  config.hooks = {
    run: function (name, args) {
      console.log('trying to run hook: ' + name);
      // for all plugins
      var ran = false;
      _.each(config.plugins, function (plugin) {
        // find if has hook `name`
        if (plugin.hooks[name]) {
          // call the hook
          plugin.hooks[name].apply(config, args);
          ran = true;
        }
      });
      return ran;
    }
  };

  return callback(null, config);
};
