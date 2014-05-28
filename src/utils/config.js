// Hoodie Config API
// ===================

var localStorageWrapper = require('../utils/local_storage_wrapper');
var extend = require('extend');

// public API
var config = {};

var CONFIG_STORE_KEY = '_hoodie_config';
var cache;

// set
// ----------

// adds a configuration
//
config.set = function set(key, value) {
  cache[key] = value;
  localStorageWrapper.setObject(CONFIG_STORE_KEY, cache);
};

// get
// ----------

// receives a configuration
//
config.get = function get(key) {
  if (key) {
    return cache[key];
  }
  return extend({}, cache);
};

// clear
// ----------

// clears cache and removes object from localStorageWrapper
//
config.clear = function clear() {
  cache = {};
  return localStorageWrapper.removeItem(CONFIG_STORE_KEY);
};

// unset
// ----------

// unsets a configuration. If configuration is present, calls
// config.set(key, undefined).
//
config.unset = function unset(key) {
  delete cache[key];
  localStorageWrapper.setObject(CONFIG_STORE_KEY, cache);
};

//
// load current configuration from localStore.
// The init method needs to be called once on startup
//
function init() {
  cache = localStorageWrapper.getObject(CONFIG_STORE_KEY) || {};
}

// initialize
init();

module.exports = config;

