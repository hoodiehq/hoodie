/**
 * Initializes directories, installs dependencies then starts all
 * configured servers for the Hoodie application
 */

var path = require('path'),
    async = require('async'),
    clc = require('cli-color'),
    utils = require('./utils'),
    couch = require('./couch'),
    server = require('./server'),
    hconsole = require('./hconsole'),
    installer = require('./installer'),
    localtld = require('./localtld'),
    workers = require('./workers'),
    prompt = require('prompt'),
    nodejitsu_server = require('./nodejitsu_server');


/**
 * Initializes and starts a new Hoodie app server
 */

exports.init = function (config, callback) {
    // start the prompt module and set appropriate options
    prompt.start();
    prompt.message = '';
    prompt.delimiter = '';
    prompt.colors = false;

    // make sure we print a stack trace in node 0.10.x
    process.on('uncaughtException', function (err) {
        console.error(err.stack || err.toString());
        process.exit(1);
    });

    // show an attempt at the hoodie logo in ascii
    if (!config.boring) {
        hconsole.logo();
    }

    // register services with local-tld
    localtld(config, function (err, config) {
        if (err) {
            return callback(err);
        }

        // configuration for the main www server
        var www_link = (config.local_tld ?
            config.www_local_url:
            'http://' + config.host + ':' + config.www_port
        );

        var hoodieBlue = clc.underline.xterm(25);
        var www_link_colored = hoodieBlue(www_link);

        var www = server({
            name: 'www',
            host: config.host,
            port: config.www_port,
            root: path.resolve(config.project_dir, 'www'),
            listen: !(config.run_nodejitsu_server),
            message: (config.boring ?
                'WWW:   ' + www_link:
                'WWW:   ' + www_link_colored
            )
        });

        // configuration for the admin server
        var admin_link = (config.local_tld ?
            config.admin_local_url:
            'http://' + config.host + ':' + config.admin_port
        );

        var admin_link_colored = hoodieBlue(admin_link);
        var admin = server({
            name: 'admin',
            host: config.host,
            port: config.admin_port,
            root: path.resolve(__dirname, '../node_modules/hoodie-pocket/www'),
            listen: !(config.run_nodejitsu_server),
            message: (config.boring ?
                'Admin: ' + admin_link:
                'Admin: ' + admin_link_colored
            )
        });

        // start the app
        console.log('Initializing...');
        async.applyEachSeries([
            exports.ensurePaths,
            exports.exitIfSudo,
            couch.start,
            installer.install,
            hconsole.linebreak,
            www,
            admin,
            nodejitsu_server,
            hconsole.linebreak,
            workers.startAll
        ],
        config, callback);
    });
};

/**
 * Makes sure the appropriate app directories exists
 */

exports.ensurePaths = function (config, callback) {
    var paths = [
        config.hoodie.path,
        config.hoodie.apps_path,
        config.hoodie.app_path
    ];
    async.map(paths, utils.ensureDir, callback);
};


/**
 * Forces Hoodie to exit if run as sudo
 */

exports.exitIfSudo = function (config, callback) {

    if (process.env.SUDO_USER) {
        return callback(new Error(
            'Hoodie does not support being run as sudo.\n' +
            'Please try again.'
        ));
    }
    else {
        return callback();
    }

};
