var hoodieStoreApi = require('../../lib/store/api');
var HoodieObjectTypeError = require('../../lib/error/object_type');
var HoodieObjectIdError = require('../../lib/error/object_id');

var api = require('./api');
var bootstrap = require('./bootstrap');
var helpers = require('./helpers');
var localStore = require('./localstore');

var localStorageWrapper = require('../../utils').localStorageWrapper;

//
var exports = module.exports = function(hoodie) {
  var state = {
    // if store is currently bootstrapping data from remote
    bootstrapping: false,
    // cache of localStorage for quicker access
    cachedObject: {},
    dirtyTimeout: undefined,
    // map of dirty objects by their ids
    dirty: {},
    hoodie: hoodie,
    // queue of method calls done during bootstrapping
    queue: [],

    // 2 seconds timeout before triggering the `store:idle` event
    idleTimeout: 2000
  };

  var store = exports.hoodieStoreApi(hoodie, {
    // validate
    validate: exports.validate,
    backend: {
      save: exports.localStore.save.bind(null, state),
      find: exports.localStore.find.bind(null, state),
      findAll: exports.localStore.findAll.bind(null, state),
      remove: exports.localStore.remove.bind(null, state),
      removeAll: exports.localStore.removeAll.bind(null, state)
    }
  });

  // public API
  Object.keys(api).forEach(function(method) {
    if (typeof api[method] === 'function') {
      store[method] = api[method].bind(null, state);
    }
  });

  // account events
  hoodie.on('account:signup', helpers.markAllAsChanged.bind(null, state));
  hoodie.on('account:movedata', helpers.moveData.bind(null, state));
  hoodie.on('account:cleanup', api.clear.bind(null, state));

  // remote events
  hoodie.on('remote:bootstrap:start', bootstrap.start.bind(null, state));
  hoodie.on('remote:bootstrap:end', bootstrap.end.bind(null, state));
  hoodie.on('remote:bootstrap:error', bootstrap.abort.bind(null, state));
  hoodie.on('remote:change', helpers.handleRemoteChange.bind(null, state));
  hoodie.on('remote:push', helpers.handlePushedObject.bind(null, state));

  // expose public API
  // FIXME: must be setup before exports.bootstrapChangedObjects as
  //        it depends on state.hoodie.store ...
  hoodie.store = store;

  exports.bootstrapChangedObjects(state);
};

// bootstrapping dirty objects, to make sure
// that removed objects get pushed after
// page reload.
//
exports.bootstrapChangedObjects = function(state) {
  var keys = localStorageWrapper.getItem('_dirty');

  if (!keys) {
    return;
  }

  keys = keys.split(',');
  for (var i = 0; i < keys.length; i++) {
    var typeAndId = keys[i].split('/');
    helpers.cache(state, typeAndId[0], typeAndId[1]);
  }
};

// validate
// ----------

//
exports.validate = function(object) {

  if (HoodieObjectTypeError.isInvalid(object.type)) {
    return new HoodieObjectTypeError({
      type: object.type
    });
  }

  if (!object.id) {
    return;
  }

  if (HoodieObjectIdError.isInvalid(object.id)) {
    return new HoodieObjectIdError({
      id: object.id
    });
  }
};

// exports for testing
exports.hoodieStoreApi = hoodieStoreApi;
exports.localStore = localStore;
