/**
 * Initializes directories, installs dependencies then starts all
 * configured servers for the Hoodie application
 */

var domain = require('domain');

var async = require('async');
var _ = require('lodash');

var utils = require('./utils');
var couch = require('./couchdb');
var hooks = require('./core/hooks');
var server = require('./server');
var plugins = require('./core/plugins');

var installer = require('./couchdb/installer');
var environment = require('./core/environment');

/**
 * Initializes and starts a new Hoodie app server
 */

exports.init = function (env_config, callback) {
  var app_domain = domain.create();

  // wrap in top-level domain, otherwise we sometimes don't get uncaught
  // exceptions printed in node 0.10.x
  app_domain.run(function () {

    var hoodieServer = server(env_config);

    // start the app
    console.log('Initializing...');

    async.applyEachSeries([
      utils.ensurePaths,
      utils.showConfigPath,
      couch.start,
      installer.install,
      plugins.load,
      hooks,
      hoodieServer,
      plugins.startAll,
      utils.processSend
    ], env_config, callback);
  });

  // make sure we print a stack trace in node 0.10.x
  app_domain.on('error', function (err) {
    console.error(err.stack || err.toString());
    process.exit(1);
  });

};

exports.start = function (config, callback) {

  var env_config = environment.getConfig(
    process.platform,   // platform
    process.env,        // environment vars
    process.cwd(),      // project directory
    []                  // command-line arguments
  );

  exports.init(_.merge(env_config, config), callback);

};
