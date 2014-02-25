var fs = require('fs');
var path = require('path');
var browserify = require('browserify');

var hoodieUtils = require('../utils/hconsole');

// Absolute path to `hoodie` module (hoodie.js) as resolved by `require`.
var hoodiePath = path.dirname(require.resolve('hoodie')).replace(/\/src$/, '');

// This template is used to generate the `bundleConcat` (see below).
var bundleTmpl = fs.readFileSync(path.join(__dirname, 'hoodie_bundle.js'));

// `bundleConcat` is the absolute path to the file used to build the final
// bundle including both hoodie.js and the plugins. This file is generated
// dynamically by concatenating `bundleTmpl` and the plugins code.
var bundleConcat = path.join(__dirname, 'hoodie_bundle_concat.js');

// We use `cache` to keep in memory copy of the hoodie.js bundle.
var cache;

// When file system watcher emits an update event we invalidate the cache, so
// the bundle will be recreated on the next request.
function update() {
  cache = null;
}

// Watch file/directory and invoke `update` when changes happen.
function watch(file) {
  fs.watchFile(file, update);
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
    return hoodieUtils.hr() + '// ' + plugin + '\n' + hoodieUtils.hr() + '\n' + src;
  }).join('\n');
}

// Watch `hoodie.js` files for changes.
watch(hoodiePath);


module.exports = function (config) {

  // If we have a valid value in `cache` we can simply return that.
  if (cache) { return cache; }

  var plugins = getPlugins(config);

  // Watch plugins for changes...
  plugins.forEach(watch);

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
  });

};

