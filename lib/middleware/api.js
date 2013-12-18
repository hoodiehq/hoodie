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

    // block /_api/_all_dbs
    if (/^\/_api\/_all_dbs/.test(req.url)) {
      var body = '{"error":"not found"}\n';
      res.writeHead(404, {
        'Content-Length': body.length,
        'Content-Type': 'application/json'
      });
      res.end(body);
      return;
    }

    // remove the /_api part from url before proxying
    var url = req.url.substr('/_api'.length);
    // proxy request to CouchDB
    proxy(url, req, res);
  };
};
