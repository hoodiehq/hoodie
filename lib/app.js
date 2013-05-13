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
        [".d$b.  .d$b.", "  .d$$$$$$b.  ", "  .d$$$$$$b.  ", ".d$$$$$$b.  ",  ".d$b.", ".d$$$$$$$$b."],
        ["$$$$$..$$$$$", ".$$$$$$$$$$$b ", ".$$$$$$$$$$$b ", "$$$$$$$$$$b ",  "$$$$$", "$$$$$$$$$$P'"],
        ["$$$$$$$$$$$$", "d$$$$$$$$$$$$b", "d$$$$$$$$$$$$b", "$$$$$$$$$$$b",  "$$$$$", "$$$$$$$$$$b."],
        ["$$$$$$$$$$$$", "Q$$$$$$$$$$$$P", "Q$$$$$$$$$$$$P", "$$$$$$$$$$$P",  "$$$$$", "$$$$$$$$$$P'"],
        ["$$$$$´`$$$$$", "'$$$$$$$$$$$$'", "'$$$$$$$$$$$$'", "$$$$$$$$$$P ",  "$$$$$", "$$$$$$$$$$b."],
        ["'Q$P'  'Q$P'", "  'Q$$$$$$P'  ", "  'Q$$$$$$P'  ", "'Q$$$$$$$P  ",  "'Q$P'", "'Q$$$$$$$$P'"],
        ["", "", "", "",  "", ""],
        [" Hi!", "", "", "",  "", ""]
    ];
    var logo = _.map(lines, function (line) {
        var blue = clc.xterm(25);
        var green = clc.xterm(28);
        var yellow = clc.xterm(214);
        var orange = clc.xterm(202);
        var brown = clc.xterm(240);
        var red = clc.xterm(160);
        return blue(line[0]) +
            green(line[1]) +
            yellow(line[2]) +
            orange(line[3]) +
            brown(line[4]) +
            red(line[5]);
    }).join('\n');

    console.log('\n' + logo + '\n');
};
