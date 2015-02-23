// Hoodie Config API
// ===================

var localStorageWrapper = require('humble-localstorage');
var extend = require('extend');

var exports = module.exports = function(storeKey) {
  storeKey = storeKey || '_hoodie_config';

  var store = {
    get: localStorageWrapper.getObject.bind(null, storeKey),
    set: localStorageWrapper.setObject.bind(null, storeKey),
    remove: localStorageWrapper.removeItem.bind(null, storeKey)
  };

  //
  // load current configuration from localStore.
  //
  var config = store.get() || {};

  var state = {config: config, store: store};

  // public API
  return {
    set: exports.set.bind(null, state),
    get: exports.get.bind(null, state),
    clear: exports.clear.bind(null, state),
    unset: exports.unset.bind(null, state)
  };
};

// set
// ----------

// adds a configuration
//
exports.set = function (state, key, value) {
  state.config[key] = value;
  state.store.set(state.config);
};

// get
// ----------

// receives a configuration
//
exports.get = function (state, key) {
  if (key) {
    return state.config[key];
  }
  return extend({}, state.config);
};

// clear
// ----------

// clears config and removes object from localStorageWrapper
//
exports.clear = function (state) {
  state.config = {};
  return state.store.remove();
};

// unset
// ----------

// unsets a configuration. If configuration is present, calls
// config.set(key, undefined).
//
exports.unset = function (state, key) {
  delete state.config[key];
  state.store.set(state.config);
};
