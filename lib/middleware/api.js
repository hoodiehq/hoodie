/**
 * Serves the API, proxying relevant requests to CouchDB
 */

var couch = require('../couch');

module.exports = function (config) {
  var proxy = couch.proxy(config);

  return function (req, res, next) {
    // ignore non-api requests
    if (!/^\/_api/.test(req.url)) {
      return next();
    }
    // remove the /_api part from url before proxying
    var url = req.url.substr('/_api'.length);
    // proxy request to CouchDB
    proxy(url, req, res);
  };
};
