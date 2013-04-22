/**
 * Enables Cross-Origin Resource Sharing for requests
 */

module.exports = function () {
    return function (req, res, next) {
        var headers;
        if (req.headers['access-control-request-headers']) {
            headers = req.headers['access-control-request-headers'];
        }
        else {
            headers = 'accept, accept-charset, accept-encoding, ' +
                'accept-language, authorization, content-length, ' +
                'content-type, host, origin, proxy-connection, ' +
                'referer, user-agent, x-requested-with';

            for (var i = 0, len = req.headers.length; i < len; i++) {
                var header = req.headers[i];
                if (req.indexOf('x-') === 0) {
                    headers += ", " + header;
                }
            }
        }
        var methods = 'HEAD, POST, GET, PUT, PATCH, DELETE';
        var cors_headers = {
            'access-control-allow-methods': methods,
            'access-control-max-age': '86400',
            'access-control-allow-headers': headers,
            'access-control-allow-credentials': 'true',
            'access-control-allow-origin': req.headers.origin || '*'
        };
        if (req.method === 'OPTIONS') {
            console.log('responding to OPTIONS request');
            res.writeHead(200, cors_headers);
            res.end();
        }
        else {
            for (var k in cors_headers) {
                res.setHeader(k, cors_headers[k]);
            }
            next();
        }
    };
};
