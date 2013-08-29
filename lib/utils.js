var mkdirp = require('mkdirp');
var async = require('async');
var fs = require('fs');


/**
 * Ensures a directory exists using mkdir -p.
 *
 * @param {String} path
 * @param {Function} callback
 * @api public
 */

exports.ensureDir = function (path, callback) {
  mkdirp(path, callback);
};

/**
 * Creates a deep-clone of a JSON-serializable object
 *
 * @param obj - the object to serialize
 * @api public
 */

exports.jsonClone = function (obj) {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Send a 302 (Found) redirect response for a HTTP Server
 * Request object
 */

exports.redirect = function (loc, res) {
  res.writeHead(302, {Location: loc});
  return res.end(
    '<html>' +
      '<head>' +
        '<title>302 Found</title>' +
      '</head>' +
      '<body>' +
        '<p>' +
          'Found: <a href=\'' + loc + '\'>' + loc + '</a>' +
        '</p>' +
      '</body>' +
    '</html>'
  );
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

  } else {
    return callback();
  }

};


/**
 * Makes sure the appropriate app directories exists
 */

exports.ensurePaths = function (config, callback) {
  var paths = [config.hoodie.app_path];

  async.map(paths, exports.ensureDir, callback);
};



/**
 * write app config to stack.json
 */

exports.writeConfig = function (config, callback) {

  var stackJSON = config.project_dir + '/data/stack.json';
  var stack = {
    couch: {
      port: Number(config.couch.port),
      host: config.host
    },
    www: {
      port: config.www_port,
      host: config.host
    },
    admin: {
      port: config.admin_port,
      host: config.host
    }
  };

  fs.writeFile(stackJSON, JSON.stringify(stack), function (err) {
    if (err) {
      return callback(new Error(
        'Hoodie could not write stack.json.\n' +
        'Please try again.'
      ));
    } else {
      return callback();
    }
  });

};
