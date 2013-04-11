/**
 * Sets up CouchDB admin and Hoodie related dbs
 */

var request = require('request'),
    prompt = require('prompt'),
    config = require('./config'),
    async = require('async'),
    npm = require('npm');


/**
 * Checks CouchDB for required users/dbs, prompts user for info
 * where appropriate
 */

exports.install = function (cfg, callback) {
    async.applyEachSeries([
        exports.pollCouch,
        exports.checkPassword,
        exports.setupModules
    ],
    cfg, callback);
};

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
            exports.getPassword(function (err, password) {
                if (err) {
                    return callback(err);
                }
                // set couchdb admin password
                exports.setPassword(cfg, password, callback)
            });
        }
        else {
            // couchdb admin password already set
            return callback();
        }
    });
}

/**
 * Prompts the user for a password and reads it without outputting
 * characters to the terminal
 */

exports.getPassword = function (callback) {
    prompt.get({
        description: 'Please set an admin password: ',
        name: 'password',
        hidden: true
    },
    function (err, result) {
        return callback(err, result && result.password);
    });
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
    var end = new Date().getTime() + 10000; // 10 second timeout

    process.stdout.write('Waiting for CouchDB..');

    function _poll() {
        request(cfg.couch.url, function (err, res) {
            if (err && err.code === 'ECONNREFUSED') {
                // CouchDB not available yet
                if (new Date().getTime() >= end) {

                    // Exceeded timeout value
                    process.stdout.write('\n');
                    return callback(new Error(
                        'Timed out waiting for CouchDB, please check ' +
                        path.resolve(cfg.hoodie.app_path, 'couch.log')
                    ));
                }
                // wait and try again
                process.stdout.write('.');
                return setTimeout(_poll, 100);
            }
            // We got a response!
            process.stdout.write(' done!\n');
            return callback();
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
