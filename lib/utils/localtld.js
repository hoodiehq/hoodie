/**
 * Uses local tld to register appropriate ports and update env_config.
 * This is not part of the env_config module due to side-effects (it will
 * write out ~/.local-tld.json when requesting a port).
 */

var ltld = require('local-tld-lib');

module.exports = function (env_config, callback) {
  // skip this step if local-tld is not available
  if (env_config.local_tld) {
    var domain = env_config.domain;
    var name = env_config.app.name;

    // register ports and alias www
    ltld.setAlias(name, 'www');

    // update ports in env_config object
    env_config.admin_port = ltld.getPort('admin.' + name);
    env_config.www_port   = ltld.getPort(name);

    // record full local domains for each server
    env_config.admin_local_url = 'http://admin.' + name + '.' + domain;
    env_config.www_local_url   = 'http://' + name + '.' + domain;

    // only update couch env_config if using multi-couch
    if (env_config.couch.run) {
      var couch = env_config.couch;

      couch.port = ltld.getPort('couch.' + name);
      couch.local_url = 'http://couch.' + name + '.' + domain + ':80';
      couch.url = couch.local_url;
    }
  }

  return callback(null, env_config);

};

