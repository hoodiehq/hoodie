/**
 * Uses local tld to register appropriate ports and update config.
 * This is not part of the config module due to side-effects (it will
 * write out ~/.local-tld.json when requesting a port).
 */

module.exports = function (config, callback) {
    // skip this step if local-tld is not available
    if (config.local_tld) {
        var ltld = require('local-tld-lib'),
            domain = config.domain,
            name = config.app.name;

        // register ports and alias www
        var www_port = ltld.getPort(name);
        var admin_port = ltld.getPort('admin.' + name);
        ltld.setAlias(name, 'www');

        // update ports in config object
        config.admin_port = ltld.getPort('admin.' + name);
        config.www_port   = ltld.getPort(name);

        // record full local domains for each server
        config.admin_local_url = 'http://admin.' + name + '.' + domain;
        config.www_local_url   = 'http://' + name + '.' + domain;

        // only update couch config if using multi-couch
        if (config.couch.run) {
            var couch = config.couch;
            couch.port = ltld.getPort('couch.' + name);
            couch.local_url = 'http://couch.' + name + '.' + domain + ':80';
            couch.url = couch.local_url;
        }
    }
    return callback(null, config);
};
