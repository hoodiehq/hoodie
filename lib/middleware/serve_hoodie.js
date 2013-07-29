var serve_file = require('./serve_file'),
    dispatch = require('dispatch'),
    path = require('path');

var hoodie_dir = path.resolve(__dirname, '../../node_modules/hoodie/dist');

module.exports = function (req, res, next) {
    console.log('serve file: ' + req.url);
    dispatch({
        '/_api/_files/hoodie.js': serve_file(hoodie_dir + '/hoodie.js'),
        '/_api/_files/hoodie.min.js': serve_file(hoodie_dir + '/hoodie.min.js')
    })(req, res, next);
}
