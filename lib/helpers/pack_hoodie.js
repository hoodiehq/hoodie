var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var watch = require('watch');

var hoodieUtils = require('../utils/hconsole');

// This template is used to generate the `bundleConcat` (see below).
var bundleTmpl = fs.readFileSync(path.join(__dirname, 'hoodie_bundle.js'));

// We use `cache` to keep in memory copy of the hoodie.js bundle.
var cache;

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
  cache = null;
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

// Read plugins source files and return concatenated string.
function concatPlugins(plugins) {
  return plugins.map(function (plugin) {
    var src = fs.readFileSync(plugin);
    // `plugin` is an absolute path. Don’t include real file path, use just two
    // last parts in file path.
    var relative = plugin.split('/').slice(-2).join('/');
    var hr = hoodieUtils.hr();
    return hr + '// ' + relative + '\n' + hr + '\n' + src;
  }).join('\n');
}

module.exports = function (config) {

  // If we have a valid value in `cache` we can simply return that.
  if (cache) { return cache; }

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

  // `bundleConcat` is the absolute path to the file used to build the final
  // bundle including both hoodie.js and the plugins. This file is generated
  // dynamically by concatenating `bundleTmpl` and the plugins code.
  // This file is created in `hoodiePath` to make sure browserify resolves
  // hoodie locally.
  var bundleConcat = path.join(hoodiePath, 'hoodie_bundle_concat.js');

  // Create the `bundleConcat` that we'll use to create the `browserify` bundle.
  fs.writeFileSync(bundleConcat, bundleTmpl + concatPlugins(plugins));

  var b = browserify(bundleConcat);

  return b.bundle({
    standalone: 'Hoodie',
    external: 'jquery'
  }, function (err, bundle) {
    if (err) { return console.error(err); }
    // Store successful bundle in cache.
    cache = bundle;
    // Clean up! Remove dynamically generated file with concatenated scripts
    // once we are done building the bundle.
    fs.unlink(bundleConcat, function (err) {
      if (err) { return console.log(err); }
    });
  });

};

