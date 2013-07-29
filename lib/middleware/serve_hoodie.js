var serve_file = require('./serve_file'),
    dispatch = require('dispatch'),
    path = require('path');

var hoodie_dir = path.resolve(__dirname, '../../node_modules/hoodie/dist');

module.exports = dispatch({
    '/_api/_files/hoodie.js': serve_file(hoodie_dir + '/hoodie.js'),
    '/_api/_files/hoodie.min.js': serve_file(hoodie_dir + '/hoodie.min.js')
})
