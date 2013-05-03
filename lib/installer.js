/**
 * Sets up CouchDB admin and Hoodie related dbs
 */

var request = require('request'),
    config = require('./config'),
    couchr = require('couchr'),
    crypto = require('crypto'),
    async = require('async'),
    npm = require('npm');


/**
 * Ensures an admin password has been set and prompts for one
 * if missing
 */

exports.checkPassword = function (cfg, callback) {
    exports.isAdminParty(cfg, function (err, party) {
        if (err) {
            return callback(err);
        }
        if (party) {
            // if we're in admin party, ask user for password
            var password = exports.generatePassword();
            // set couchdb admin password
            exports.setPassword(cfg, password, callback)
        }
        else {
            // couchdb admin password already set
            return callback();
        }
    });
}

/**
 * Generates a password for the internal couch admin user
 * used by hoodie and associated workers
 */

exports.generatePassword = function () {
    return crypto.randomBytes(256).toString('base64');
};

/**
 * Checks if CouchDB is in admin party mode
 */

exports.isAdminParty = function (cfg, callback) {
    request(cfg.couch.url + '/_users/_all_docs', function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(null, res.statusCode !== 403);
    });
};

/**
 * Polls CouchDB during startup so we know when we can make
 * requests against it
 */

exports.pollCouch = function (cfg, callback) {
    // when to stop polling and give up!
    var end = new Date().getTime() + 30000, // 30 second timeout
        logfile = path.resolve(cfg.hoodie.app_path, 'couch.log'),
        interval = 200; // poll every 200ms

    process.stdout.write('Waiting for CouchDB..');

    function _poll() {
        request(cfg.couch.url, function (err, res) {
            if (res && res.statusCode === 200) {
                process.stdout.write(' done!\n');
                return callback();
            }
            else {
                // CouchDB not available yet
                if (new Date().getTime() >= end) {

                    // Exceeded timeout value
                    process.stdout.write('\n');
                    return callback(new Error(
                        'Timed out waiting for CouchDB, please check ' +
                        logfile
                    ));
                }
                // wait and try again
                process.stdout.write('.');
                return setTimeout(_poll, interval);
            }
        });
    }

    // start polling
    _poll();
};

/**
 * Sets the admin password on CouchDB
 */

exports.setPassword = function (cfg, password, callback) {
    request({
        url: cfg.couch.url + '/_config/admins/admin',
        method: 'PUT',
        body: '"' + password + '"'
    },
    function (err) {
        if (err) {
            return callback(err);
        }
        npm.load(function (err, npm) {
            if (err) {
                return callback(err);
            }
            var result = npm.commands.config([
                'set', cfg.app.name + '_admin_pass', password
            ]);
            callback();
        });
    });
};

/**
 * Creates modules DB and appconfig doc
 */

exports.setupModules = function (cfg, callback) {
    // read couchdb admin password from npm
    config.getAdminPassword(cfg.app.name, function (err, password) {

        // create modules db and appconfig doc
        async.applyEachSeries([
            exports.createModulesDB,
            exports.createAppConfig
        ],
        cfg, password, callback);
    });
};

/**
 * Creates modules database
 */

exports.createModulesDB = function (cfg, password, callback) {
    request({
        url: cfg.couch.url + '/modules',
        method: 'PUT',
        auth: {
            user: 'admin',
            pass: password
        }
    }, callback);
};

/**
 * Create appconfig doc in modules database
 */

exports.createAppConfig = function (cfg, password, callback) {
    try {
        var body = JSON.stringify({
            _id : 'module/appconfig',
            config : {},
            name: cfg.app.name,
            createdAt : new Date(),
            updatedAt : new Date()
        });
    }
    catch (e) {
        // catch json parse errors
        return callback(e);
    }
    request({
        url: cfg.couch.url + '/modules/module%2Fappconfig',
        method: 'PUT',
        auth: {
            user: 'admin',
            pass: password
        },
        body: body
    }, callback);
};

/**
 * Checks CouchDB for required users/dbs, prompts user for info
 * where appropriate
 */

exports.install = async.applyEachSeries([
    exports.checkPassword,
    exports.setupModules
]);
