/**
 * Tools for starting Hoodie plugins
 */

var plugins_manager = require('hoodie-plugins-manager/lib/index');
var clc = require('cli-color');
var modulelib = require('module');
var async = require('async');
var path = require('path');
var fs = require('fs');

var configStore = require('./config_store');


/**
 * Read plugins from package.json and load their metadata into env_config object
 */

exports.load = function (env_config, callback) {
  // read package.json files for plugins and add to env_config object
  env_config.plugins = exports.readPlugins(env_config);
  callback(null, env_config);
};

/**
 * Starts all plugins defined in the project's package.json file
 */

exports.startAll = function (env_config, callback) {
  // get couchdb admin password from config.json
  configStore.getCouchCredentials(env_config, function (err, username, password) {
    if (err) {
      return callback(err);
    }

    var pm_configStore = {
      couchdb: {
        url: env_config.couch.url,
        user: username,
        pass: password
      }
    };

    plugins_manager.start(pm_configStore, function (err, manager) {
      if (err) {
        return callback(err);
      }

      // loop through plugins and start
      async.map(Object.keys(env_config.plugins), function (name, cb) {
        var hoodie = manager.createAPI({name: name});
        return exports.startPlugin(name, env_config, hoodie, cb);
      },
      function (err) {
        if (err) {
          return callback(err);
        }
        console.log('All plugins started.');
        callback();
      });

    });
  });
};

/**
 * Starts the named Hoodie plugin
 */

exports.startPlugin = function (name, env_config, hoodie, callback) {
  console.log('Starting Plugin: \'%s\'', name);

  var doStartPlugin = function (hoodie, p, cb) {
    if (exports.hasWorker(p)) {
      var wmodule = require(p);
      return wmodule(hoodie, cb);
    }
    return cb();
  };

  var doInitHooks = function (hoodie, p, cb) {
    var hooksPath = path.resolve(p, 'hooks', 'dynamic.js');
    if (exports.hasHooks(hooksPath)) {
      var hmodule = require(hooksPath);
      env_config.plugins[name].hooks.dynamic = hmodule(hoodie, cb);
    }
    return cb();
  };

  hoodie.env = env_config;
  async.applyEachSeries([
    doStartPlugin,
    doInitHooks
  ], hoodie, env_config.plugins[name].path, callback);
};

/**
 * Returns true if the plugin path has a node.js worker module, false otherwise
 */

exports.hasWorker = function (path) {
  try {
    require.resolve(path);
    return true;
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      return false;
    } else {
      throw e;
    }
  }
};

exports.hasHooks = function (path) {
  return fs.existsSync(path);
};

exports.readPlugins = function (env_config) {
  var paths = exports.getPluginPaths(env_config);

  return paths.reduce(function (acc, p) {
    var meta = exports.readPluginMetadata(p);
    var hooks = exports.readPluginHooks(p);
    acc[meta.name] = {path: p, metadata: meta, hooks: {'static': hooks}};
    return acc;
  }, {});
};

exports.isDirectory = function (p) {
  try {
    return fs.statSync(p).isDirectory();
  }
  catch (e) {
    if (e.code === 'ENOENT') {
      // not found
      return false;
    }
    throw e;
  }
};

exports.resolvePluginPath = function (env_config, p) {
  var dir;

  if (p[0] === '.' || p[0] === '/') {
    // relative or absolute path
    dir = path.resolve(env_config.project_dir, p);
    if (exports.isDirectory(dir)) {
      return dir;
    }
  } else {
    // module lookup
    var id = path.resolve(env_config.project_dir, 'package.json');
    var m = new modulelib.Module(id);
    var paths = modulelib.Module._resolveLookupPaths('./blah', m)[1];

    for (var i = 0; i < paths.length; i++) {
      dir = path.resolve(paths[i], p);
      if (exports.isDirectory(dir)) {
        return dir;
      }
    }
  }
  throw new Error('Plugin not found: ' + p);
};

exports.getPluginPaths = function (env_config) {
  var app = env_config.app;

  if (!app.hoodie) {
    app.hoodie = {};
  }

  if (!app.hoodie.plugins) {
    console.log(clc.yellow(
      'WARNING: No hoodie.plugins property in package.json, ' +
      'no plugins will be loaded!'
    ));
    app.hoodie.plugins = [];
  }

  return app.hoodie.plugins.map(function (p) {
    return exports.resolvePluginPath(env_config, p);
  });

};

exports.readPluginHooks = function (p) {
  try {
    var hooks_file = path.resolve(p, 'hooks', 'static.js');
    var hooks = require(hooks_file);
    return hooks;
  } catch (e) {
    // ignore non-existent hooks/static.js
    return {};
  }
};

exports.readPluginMetadata = function (p) {
  var data = fs.readFileSync(path.resolve(p, 'package.json'));
  return JSON.parse(data);
};

exports.getPluginNames = function (env_config) {
  return Object.keys(env_config.plugins).map(function (id) {
    return id.replace(/^hoodie-plugin-/, '');
  });
};
