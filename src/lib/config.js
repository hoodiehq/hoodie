// Hoodie Config API
// ===================

var localStorageWrapper = require('../utils').localStorageWrapperWrapper;

//
function hoodieConfig(hoodie) {

  var CONFIG_STORE_KEY = '_hoodie_config';
  var cache = {};

  // public API
  var config = {};


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
    return cache[key];
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
  // The init method to be called on hoodie startup
  //
  function init() {
    cache = localStorageWrapper.getObject(CONFIG_STORE_KEY);
  }

  // allow to run init only once
  config.init = function() {
    init();
    delete config.init;
  };

  //
  // subscribe to events coming from other modules
  //
  function subscribeToOutsideEvents() {
    hoodie.on('account:cleanup', config.clear);
  }

  // allow to run this once from outside
  config.subscribeToOutsideEvents = function() {
    subscribeToOutsideEvents();
    delete config.subscribeToOutsideEvents;
  };

}

module.exports = hoodieConfig;

