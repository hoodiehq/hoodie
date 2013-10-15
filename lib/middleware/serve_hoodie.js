var dispatch = require('dispatch');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var plugins = require('../plugins');

/* jshint unused:false*/

module.exports = function (config) {
  var names = plugins.getPluginNames(config);

  var paths = names.map(function (name) {
    return path.resolve(
      config.plugins[name].path, 'hoodie.' + name + '.js'
    );
  });

  var bufferToString = function (buf) {
    return buf.toString();
  };

  var readString = _.compose(bufferToString, function (filename) {
    return fs.readFileSync(filename);
  });

  var extensions = paths.filter(fs.existsSync).map(readString);
  var hoodie_dir = path.resolve(__dirname, '../../node_modules/hoodie/dist');
  var base = readString(hoodie_dir + '/hoodie.js');
  var hoodiejs = base + extensions.join('\n');

  return dispatch({
    '/_api/_files/hoodie.js': function (req, res, next) {
      res.writeHead(200, {'Content-Type': 'application/javascript'});
      res.end(hoodiejs);
    }
  });

};
