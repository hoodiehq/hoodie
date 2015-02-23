var utils = require('../../utils');
var promise = utils.promise;
var getDefer = promise.defer;
var localStorageWrapper = utils.localStorageWrapper;

var helpers = require('./helpers');

// TODO: remove coffeescript artifacts

// extended public API
// ---------------------
var exports = module.exports;

// index
// -------

// object key index
// TODO: make this cachy
exports.index = function(state) {
  var i, key, keys, _i, _ref;
  keys = [];
  for (i = _i = 0, _ref = localStorageWrapper.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    key = localStorageWrapper.key(i);
    if (helpers.isSemanticKey(state, key)) {
      keys.push(key);
    }
  }
  return keys;
};


// changed objects
// -----------------

// returns an Array of all dirty documents
exports.changedObjects = function(state) {
  var id, key, object, type, _ref, _ref1, _results;

  _ref = state.dirty;
  _results = [];

  for (key in _ref) {
    if (_ref.hasOwnProperty(key)) {
      object = _ref[key];
      _ref1 = key.split('/'),
      type = _ref1[0],
      id = _ref1[1];
      object.type = type;
      object.id = id;
      _results.push(object);
    }
  }
  return _results;
};


// Is dirty?
// ----------

// When no arguments passed, returns `true` or `false` depending on if there are
// dirty objects in the store.
//
// Otherwise it returns `true` or `false` for the passed object. An object is dirty
// if it has no `_syncedAt` attribute or if `updatedAt` is more recent than `_syncedAt`
exports.hasLocalChanges = function(state, type, id) {
  if (!type) {
    return !global.$.isEmptyObject(state.dirty);
  }
  var key = [type,id].join('/');
  if (state.dirty[key]) {
    return true;
  }
  return helpers.hasLocalChanges(state, helpers.cache(state, type, id));
};


// Clear
// ------

// clears localStorage and cache
// TODO: do not clear entire localStorage, clear only the items that have been stored
//       using `hoodie.store` before.
exports.clear = function(state) {
  var defer, key, keys, results;
  defer = getDefer();
  try {
    keys = exports.index(state);
    results = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        if (helpers.isSemanticKey(state, key)) {
          _results.push(localStorageWrapper.removeItem(key));
        }
      }
      return _results;
    }).call(this);
    state.cachedObject = {};
    helpers.clearChanged(state);
    defer.resolve();
    // TODO: get eventEmitter directly from utils.events
    state.hoodie.store.trigger('clear');
  } catch (_error) {
    defer.reject(_error);
  }
  return defer.promise;
};


// isBootstrapping
// -----------------

// returns true if store is currently bootstrapping data from remote,
// otherwise false.
exports.isBootstrapping = function(state) {
  return state.bootstrapping;
};


// isPersistent
exports.isPersistent = function() {
  return localStorageWrapper.isPersistent;
};
