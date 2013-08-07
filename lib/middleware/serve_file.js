var send = require('send');

module.exports = function (filename) {
  return function (req, res) {
    send(req, filename).pipe(res);
  };
};
