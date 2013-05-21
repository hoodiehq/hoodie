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
    prompt = require('prompt');


/**
 * Initializes and starts a new Hoodie app server
 */

exports.init = function (config, callback) {
    // start the prompt module and set appropriate options
    prompt.start();
    prompt.message = '';
    prompt.delimiter = '';
    prompt.colors = false;

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
        var www = server({
            name: 'www',
            host: config.host,
            port: config.www_port,
            root: path.resolve(config.project_dir, 'www'),
            message: (config.boring ?
                'WWW:   ' + www_link:
                'WWW:   ' + clc.underline.blue(www_link)
            )
        });

        // configuration for the admin server
        var admin_link = (config.local_tld ?
            config.admin_local_url:
            'http://' + config.host + ':' + config.admin_port
        );
        var admin = server({
            name: 'admin',
            host: config.host,
            port: config.admin_port,
            root: path.resolve(__dirname, '../node_modules/hoodie-pocket/www'),
            message: (config.boring ?
                'Admin: ' + admin_link:
                'Admin: ' + clc.underline.blue(admin_link)
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
