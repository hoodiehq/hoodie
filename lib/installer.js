/**
 * Sets up CouchDB admin and Hoodie related dbs
 */

var request = require('request'),
    config = require('./config'),
    couchr = require('couchr'),
    crypto = require('crypto'),
    prompt = require('prompt'),
    couchr = require('couchr'),
    async = require('async'),
    url = require('url'),
    npm = require('npm');


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
 * Sets the admin password on CouchDB to a newly generated password
 */

exports.setPassword = function (cfg, callback) {
    var password = exports.generatePassword();

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
            callback(null, password);
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
 * Prompts the user to create a Hoodie admin account
 */

exports.promptAdminUser = function (callback) {
    console.log('Please create a Hoodie admin user');
    prompt.get({
        properties: {
            name: {
                description: 'Username: ',
                required: true
            },
            password: {
                description: 'Password: ',
                required: true,
                hidden: true
            }
        }
    },
    function (err, result) {
        return callback(err, result);
    });
};

/**
 * Creates a hoodie admin user
 */

exports.saveAdminUser = function (cfg, couch_pwd, user, callback) {
    // couchdb user doc
    var doc = {
        _id: 'org.couchdb.user:' + user.name,
        roles: ['hoodie-admin:' + cfg.id],
        type: 'user',
        name: user.name,
        password: user.password
    };
    // add auth info to db url
    var db_url = url.parse(cfg.couch.url);
    db_url.auth = 'admin:' + couch_pwd;

    var path = '/_users/' + encodeURIComponent(doc._id);
    var user_url = url.resolve(db_url, path);
    couchr.put(user_url, doc, callback);
};

/**
 * Creates a CouchDB user with the appropriate roles to be an admin of
 * this Hoodie instance
 */

exports.createAdminUser = function (cfg, callback) {
    config.getAdminPassword(cfg.app.name, function (err, password) {
        if (err) {
            return callback(err);
        }
        exports.promptAdminUser(function (err, user) {
            if (err) {
                return callback(err);
            }
            exports.saveAdminUser(cfg, password, user, callback);
        });
    });
};

/**
 * Creates internal admin user and prompts for Hoodie admin
 */

exports.setupUsers = function (cfg, callback) {
    exports.isAdminParty(cfg, function (err, party) {
        if (err) {
            return callback(err);
        }
        if (party) {
            async.applyEachSeries([
                exports.setPassword,
                exports.createAdminUser
            ],
            cfg, callback);
        }
        else {
            // couchdb admin password already set
            return callback();
        }
    });
};

/**
 * Checks CouchDB for required users/dbs, prompts user for info
 * where appropriate
 */

exports.install = async.applyEachSeries([
    exports.setupUsers,
    exports.setupModules
]);
