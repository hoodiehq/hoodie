// Hoodie Config API
// ===================

var resolve = require('../utils/promise/resolve');
var localstorage = require('../utils').localstorage;

//
function hoodieConfig(hoodie) {

  var type = '$config';
  var id = 'hoodie';
  var cache = {};

  // public API
  var config = {};


  // set
  // ----------

  // adds a configuration
  //
  config.set = function set(key, value) {
    var isSilent, update;

    if (cache[key] === value) {
      return;
    }

    cache[key] = value;

    update = {};
    update[key] = value;
    isSilent = key.charAt(0) === '_';

    // we have to assure that _hoodieId has always the
    // same value as createdBy for $config/hoodie
    // Also see config.js:77ff
    if (key === '_hoodieId') {
      localstorage.removeItem(type);
      update = cache;
    }

    localstorage.setItem(type, id);
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
    return localstorage.removeItem(type);
  };

  // unset
  // ----------

  // unsets a configuration. If configuration is present, calls
  // config.set(key, undefined).
  //
  config.unset = function unset(key) {
    if (typeof config.get(key) === 'undefined') {
      return resolve();
    }

    return config.set(key, undefined);
  };

  //
  // load current configuration from localStore.
  // The init method to be called on hoodie startup
  //
  function init() {
    // TODO: I really don't like this being here. And I don't like that if the
    //       store API will be truly async one day, this will fall on our feet.
    //       We should discuss if we make config a simple object in localStorage,
    //       outside of hoodie.store, and use localStorage sync API directly to
    //       interact with it, also in future versions.
    hoodie.store.find(type, id).done(function(obj) {
      cache = obj;
    });
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

