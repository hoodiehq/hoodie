var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var async = require('async');
var combine = require('combine-streams');

function hr() {
  return _.times(80, function () { return '/'; }).join('') + '\n';
}

// Create readable stream to be piped to http response.
// Argument `paths` is an array with absolute paths to the files to be read and
// concatenated.
function createStream(paths) {
  var cs = combine();
  var count = 0;
  async.eachSeries(paths, function (file, cb) {
    // After the first file (the main hoodie.js) has been added we announce that
    // we start with the plugins.
    if (count++ === 1) {
      cs.append(hr() + '// HOODIE PLUGINS\n' + hr() + '\n');
    }
    // Print the file name in a comment.
    cs.append(hr() + '// ' + file + '\n' + hr());
    fs.exists(file, function (exists) {
      if (!exists) {
        cs.append('// Not found.');
      } else {
        cs.append(fs.createReadStream(file));
      }
      cs.append('\n\n');
      cb();
    });
  }, function () {
    cs.append(null);
  });
  return cs;
}

module.exports = function (config) {

  // Get absolute paths to the files with the frontend javascript for all
  // plugins. Plugins are expected to have a file called
  // `hoodie.<plugin_name>.js` in their root with javascript that needs to get
  // loaded in the the browser.
  var paths = Object.keys(config.plugins).map(function (id) {
    var name = id.replace(/^hoodie-plugin-/, '');
    return path.resolve(
      config.plugins[id].path, 'hoodie.' + name + '.js'
    );
  });

  var hoodie_path = path.resolve(
    __dirname, '../../node_modules/hoodie/dist/hoodie.js'
  );

  // if the user's project has defined a hoodie.js dependency,
  // then favour that over our own dependency.
  if (config.app.hoodie && config.app.hoodie.hoodiejs) {
    hoodie_path = path.resolve(config.project_dir, config.app.hoodie.hoodiejs);
    console.log('Loading alternative hoodie.js from %s', hoodie_path);
  }

  paths.unshift(hoodie_path);

  return createStream(paths);

};

