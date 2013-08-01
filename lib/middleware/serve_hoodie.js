var serve_file = require('./serve_file'),
    plugins = require('../plugins'),
    dispatch = require('dispatch'),
    path = require('path'),
    fs = require('fs'),
    _ = require('underscore');


module.exports = function (config) {
    var names = plugins.getPluginNames(config.app);
    var paths = names.map(function (name) {
        var id = 'hoodie-plugin-' + name;
        return path.resolve(
            config.project_dir,
            'node_modules/' + id + '/hoodie.' + name + '.js'
        );
    });

    var bufferToString = function (buf) {
        return buf.toString();
    };

    var readString = _.compose(bufferToString, fs.readFileSync),
        extensions = paths.filter(fs.existsSync).map(readString),
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
