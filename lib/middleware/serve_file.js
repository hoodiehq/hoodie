var send = require('send');

/* jshint unused:false*/

module.exports = function (filename) {
  return function (req, res, next) {
    send(req, filename).pipe(res);
  };
};
