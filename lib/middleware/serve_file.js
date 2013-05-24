var send = require('send');

module.exports = function (filename) {
    return function (req, res, next) {
        send(req, filename).pipe(res);
    };
};
