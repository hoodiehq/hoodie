var mkdirp = require('mkdirp');
var async = require('async');


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



