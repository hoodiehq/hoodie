var fs = require('fs');
var path = require('path');
var watch = require('watch');
var pack_hoodie = require('./pack_hoodie');


// TODO: extract getPlugins into new module (it's shared with pack_hoodie.js)

// Get absolute paths to the files with the frontend javascript for all
// plugins. Plugins are expected to have a file called
// `hoodie.<plugin_name>.js` in their root with javascript that needs to get
// loaded in the the browser.
function getPlugins(config) {
  return Object.keys(config.plugins)
    .map(function (id) {
      var name = id.replace(/^hoodie-plugin-/, '');
      return path.resolve(
        config.plugins[id].path, 'hoodie.' + name + '.js'
      );
    })
    .filter(function (path) {
      return fs.existsSync(path);
    });
}


module.exports = function (config, callback) {
  console.log('Watching plugin files for changes');

  // Keep track of watched files to make sure we don't watch the same path more
  // than once.
  var watchedPaths = [];

  // When file system watcher emits an update event we invalidate the cache, so
  // the bundle will be recreated on the next request.
  function update(f, curr, prev) {
    if (typeof f === 'object' && prev === null && curr === null) {
      // Finished walking the tree!
      return;
    }
    console.log('Re-building hoodie.js');
    pack_hoodie(config, function (err) {
      if (err) {
        return console.error(err);
      }
      console.log('Done building hoodie.js');
    });
  }

  // Watch file/directory and invoke `update` when changes happen.
  function watchPath(root) {
    // If file is already being watched we don't need to do anything.
    if (watchedPaths.indexOf(root) >= 0) { return; }
    watchedPaths.push(root);
    fs.stat(root, function (err, stats) {
      if (err) { return console.error(err); }
      if (stats.isDirectory()) {
        return watch.watchTree(root, { ignoreDotFiles: true }, update);
      }
      fs.watchFile(root, function (curr, prev) {
        update(root, curr, prev);
      });
    });
  }

  // Absolute path to `hoodie` module (hoodie.js) as resolved by `require`.
  var hoodiejs = require.resolve('hoodie');

  // If custom hoodie.js is specified in package.json we use that.
  // See: https://github.com/hoodiehq/hoodie-server/issues/247
  if (config.app.hoodie && config.app.hoodie.hoodiejs) {
    hoodiejs = path.join(config.project_dir, config.app.hoodie.hoodiejs);
  }

  // Path to `hoodie.js` source directory.
  var hoodiePath = path.dirname(hoodiejs);

  // Watch `hoodie.js` files for changes.
  watchPath(hoodiePath);

  var plugins = getPlugins(config);

  // Watch plugins for changes...
  plugins.forEach(watchPath);

  callback();
};
