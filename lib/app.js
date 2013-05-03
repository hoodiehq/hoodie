/**
 * Initializes directories, installs dependencies then starts all
 * configured servers for the Hoodie application
 */

var path = require('path'),
    async = require('async'),
    colors = require('colors'),
    utils = require('./utils'),
    couch = require('./couch'),
    server = require('./server'),
    installer = require('./installer'),
    localtld = require('./localtld'),
    workers = require('./workers'),
    prompt = require('prompt'),
    _ = require('underscore');


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
    exports.asciiLogo();

    // register services with local-tld
    localtld(config, function (err, config) {
        if (err) {
            return callback(err);
        }

        // configuration for the main www server
        var www = server({
            name: 'www',
            host: config.host,
            port: config.www_port,
            root: path.resolve(config.project_dir, 'www'),
            message: (config.local_tld ?
                'WWW:   ' + config.www_local_url:
                'WWW:   http://' + config.host + ':' + config.www_port
            )
        });

        // configuration for the admin server
        var admin = server({
            name: 'admin',
            host: config.host,
            port: config.admin_port,
            root: path.resolve(__dirname, '../node_modules/hoodie-pocket/www'),
            message: (config.local_tld ?
                'Admin: ' + config.admin_local_url:
                'Admin: http://' + config.host + ':' + config.admin_port
            )
        });

        // start the app
        console.log('Initializing...');
        async.applyEachSeries([
            exports.ensurePaths,
            couch.start,
            installer.install,
            utils.linebreak,
            www,
            admin,
            utils.linebreak,
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
 * Outputs the Hoodie logo in color ascii art
 */

exports.asciiLogo = function () {
    var lines = [
        [" __ __ ", " ____ ",  " ____ ",  " ___  ",  " _ ", " ___ " ],
        ["|  U  |", "/    \\", "/    \\", "|   `\\", "| |", "/  _|" ],
        ["|     |",  "     |", "      |", "     ",   "| |", "   -." ],
        ["|__n__|", "\\____/", "\\____/", "|___./",  "|_|", "\\___|"]
    ];
    var logo = _.map(lines, function (line) {
        return colors.blue(line[0]) +
            colors.green(line[1]) +
            colors.yellow(line[2]) +
            colors.red(line[3]) +
            colors.grey(line[4]) +
            colors.red(line[5]);
    }).join('\n');

    console.log('\n' + logo + '\n');
};
