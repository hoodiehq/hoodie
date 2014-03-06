// Hoodie Config API
// ===================

var resolve = require('../utils/promise/resolve');
var localstorage = require('../utils').localstorage;

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
    var update;

    cache[key] = value;
    localstorage.setObject(CONFIG_STORE_KEY, cache);
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

  // clears cache and removes object from localStorage
  //
  config.clear = function clear() {
    cache = {};
    return localstorage.removeItem(CONFIG_STORE_KEY);
  };

  // unset
  // ----------

  // unsets a configuration. If configuration is present, calls
  // config.set(key, undefined).
  //
  config.unset = function unset(key) {
    delete cache[key];
    localstorage.setObject(CONFIG_STORE_KEY, cache);
  };

  //
  // load current configuration from localStore.
  // The init method to be called on hoodie startup
  //
  function init() {
    cache = localstorage.getObject(CONFIG_STORE_KEY);
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

  // exspose public API
  hoodie.config = config;
}

module.exports = hoodieConfig;

