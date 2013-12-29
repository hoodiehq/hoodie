var path = require('path');
var fs = require('fs');
var _ = require('underscore');

module.exports = function (config) {


  var paths = Object.keys(config.plugins).map(function (id) {
    var name = id.replace(/^hoodie-plugin-/, '');
    return path.resolve(
      config.plugins[id].path, 'hoodie.' + name + '.js'
    );
  });

  var bufferToString = function (buf) {
    return buf.toString();
  };

  var readString = _.compose(bufferToString, function (filename) {
    return fs.readFileSync(filename);
  });

  var extensions = paths.filter(fs.existsSync).map(readString);

  var hoodie_path = path.resolve(
    __dirname, '../../node_modules/hoodie/dist/hoodie.js'
  );

  // if the user's project has defined a hoodie.js dependency,
  // then favour that over our own dependency.
  if (config.app.hoodie && config.app.hoodie.hoodiejs) {
    hoodie_path = path.resolve(config.project_dir, config.app.hoodie.hoodiejs);
    console.log('Loading alternative hoodie.js from %s', hoodie_path);
  }

  var base = readString(hoodie_path);
  var hoodiejs = base + extensions.join('\n');

  return hoodiejs;

};

