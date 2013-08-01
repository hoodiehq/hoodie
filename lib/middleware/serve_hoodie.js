var serve_file = require('./serve_file'),
    plugins = require('../plugins'),
    dispatch = require('dispatch'),
    path = require('path'),
    fs = require('fs'),
    _ = require('underscore');


module.exports = function (config) {
    var names = plugins.getPluginNames(config.app);
    var paths = names.map(function (name) {
        return path.resolve(
            plugins.path(name, config.project_dir),
            'hoodie.' + name + '.js'
        );
    });

    var bufferToString = function (buf) {
        return buf.toString();
    };
    var readString = _.compose(bufferToString, function (filename) {
        return fs.readFileSync(filename);
    });

    var extensions = paths.filter(fs.existsSync).map(readString),
        hoodie_dir = path.resolve(__dirname, '../../node_modules/hoodie/dist'),
        base = readString(hoodie_dir + '/hoodie.js');

    var hoodiejs = base + extensions.join('\n');

    return dispatch({
        '/_api/_files/hoodie.js': function (req, res, next) {
            res.writeHead(200, {'Content-Type': 'application/javascript'});
            res.end(hoodiejs);
        }
    });
};
