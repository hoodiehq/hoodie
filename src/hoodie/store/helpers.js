var extend = require('extend');

var utils = require('../../utils');
var promise = utils.promise;
var getDefer = promise.defer;
var localStorageWrapper = utils.localStorageWrapper;
//
// Private methods
// -----------------
//

var exports = module.exports;
// Cache
// -------

// loads an object specified by `type` and `id` only once from localStorage
// and caches it for faster future access. Updates cache when `value` is passed.
//
// Also checks if object needs to be synched (dirty) or not
//
// Pass `options.remote = true` when object comes from remote
// Pass 'options.silent = true' to avoid events from being triggered.
exports.cache = function(state, type, id, object, options) {
  var key, storedObject;

  if (object === undefined) {
    object = false;
  }

  options = options || {};
  key = '' + type + '/' + id;

  if (object) {
    extend(object, {
      type: type,
      id: id
    });

    // we do not store type & id in localStorage values
    storedObject = extend({}, object);
    delete storedObject.type;
    delete storedObject.id;
    localStorageWrapper.setObject(key, storedObject);

    if (options.remote) {
      exports.clearChanged(state, type, id);
      state.cachedObject[key] = extend(true, {}, object);
      return state.cachedObject[key];
    }

  } else {

    // if the cached key returns false, it means
    // that we have removed that key. We just
    // set it to false for performance reasons, so
    // that we don't need to look it up again in localStorage
    if (state.cachedObject[key] === false) {
      return false;
    }

    // if key is cached, return it. But make sure
    // to make a deep copy beforehand (=> true)
    if (state.cachedObject[key]) {
      return extend(true, {}, state.cachedObject[key]);
    }

    key = '' + type + '/' + id;

    // if object is not yet cached, load it from localStore
    object = localStorageWrapper.getObject(key);

    // stop here if object did not exist in localStore
    // and cache it so we don't need to look it up again
    if (! object) {
      exports.clearChanged(state, type, id);
      state.cachedObject[key] = false;
      return false;
    }

    // add type & id as we don't store these in localStorage values
    object.type = type;
    object.id = id;

  }

  if (exports.isMarkedAsDeleted(state, object)) {
    exports.markAsChanged(state, type, id, object, options);
    state.cachedObject[key] = false;
    return false;
  }

  // here is where we cache the object for
  // future quick access
  state.cachedObject[key] = extend(true, {}, object);

  if (exports.hasLocalChanges(state, object)) {
    exports.markAsChanged(state, type, id, state.cachedObject[key], options);
  } else {
    exports.clearChanged(state, type, id);
  }

  return extend(true, {}, object);
};

//
// Marks object as changed (dirty). Triggers a `store:dirty` event immediately and a
// `store:idle` event once there is no change within 2 seconds
//
exports.markAsChanged = function(state, type, id, object, options) {
  var key;

  options = options || {};
  key = '' + type + '/' + id;

  state.dirty[key] = object;
  exports.saveDirtyIds(state);

  if (options.silent) {
    return;
  }

  exports.triggerDirtyAndIdleEvents(state);
};

// Clear changed
// ---------------

// removes an object from the list of objects that are flagged to by synched (dirty)
// and triggers a `store:dirty` event
exports.clearChanged = function(state, type, id) {
  var key;
  if (type && id) {
    key = '' + type + '/' + id;
    delete state.dirty[key];
  } else {
    state.dirty = {};
  }
  exports.saveDirtyIds(state);
  return global.clearTimeout(state.dirtyTimeout);
};


// Mark all as changed
// ------------------------

// Marks all local object as changed (dirty) to make them sync
// with remote
exports.markAllAsChanged = function(state) {
  return state.hoodie.store.findAll().done(function(objects) {
    var key, object, _i, _len;

    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      object = objects[_i];
      key = '' + object.type + '/' + object.id;
      state.dirty[key] = object;
    }

    exports.saveDirtyIds(state);
    exports.triggerDirtyAndIdleEvents(state);
  });
};


// when a change comes from our remote store, we differentiate
// whether an object has been removed or added / updated and
// reflect the change in our local store.
exports.handleRemoteChange = function(state, typeOfChange, object) {
  var promise;

  if (object.type === '_design') {
    return;
  }

  if (typeOfChange === 'remove') {
    promise = state.hoodie.store.remove(object.type, object.id, {
      remote: true,
      update: object
    });
  } else {
    promise = state.hoodie.store.save(object.type, object.id, object, {
      remote: true
    });
  }

  // avoid "Unhandled promise rejection" errors
  promise.catch(function(){});
};


//
// all local changes get bulk pushed. For each object with local
// changes that have been pushed we trigger a sync event.
// Besides that, we also remove objects that have only been marked
// as _deleted and mark the others as synced.
exports.handlePushedObject = function(state, object) {
  var promise;

  exports.triggerEvents(state, 'sync', object);

  if (object._deleted) {
    promise = state.hoodie.store.remove(object.type, object.id, {
      remote: true,
      silent: true
    });
  } else {
    promise = state.hoodie.store.save(object.type, object.id, object, {
      remote: true,
      silent: true
    });
  }

  // avoid "Unhandled promise rejection" errors
  promise.catch(function(){});
};

// store IDs of dirty objects
exports.saveDirtyIds = function(state) {
  if (global.$.isEmptyObject(state.dirty)) {
    localStorageWrapper.removeItem('_dirty');
  } else {
    var ids = Object.keys(state.dirty);
    localStorageWrapper.setItem('_dirty', ids.join(','));
  }
};

//
exports.now = function() {
  return JSON.stringify(new Date()).replace(/['"]/g, '');
};


// a semantic key consists of a valid type & id, separated by a "/"
exports.SEMANTIC_ID_PATTERN = new RegExp(/^[a-z$][a-z0-9-]+\/[a-z0-9]+$/);
exports.isSemanticKey = function(state, key) {
  return exports.SEMANTIC_ID_PATTERN.test(key);
};

// `hasLocalChanges` returns true if there is a local change that
// has not been synced yet.
exports.hasLocalChanges = function(state, object) {
  if (!object.updatedAt) {
    return false;
  }
  if (!object._syncedAt) {
    return true;
  }
  return object._syncedAt < object.updatedAt;
};

//
exports.isMarkedAsDeleted = function(state, object) {
  return object._deleted === true;
};

// this is where all the store events get triggered,
// like add:task, change:note:abc4567, remove, etc.
exports.triggerEvents = function(state, eventName, object, options) {
  // TODO: get eventEmitter directly from utils.events
  state.hoodie.store.trigger(eventName, extend(true, {}, object), options);
  state.hoodie.store.trigger(object.type + ':' + eventName, extend(true, {}, object), options);

  if (eventName !== 'new') {
    state.hoodie.store.trigger( object.type + ':' + object.id+ ':' + eventName, extend(true, {}, object), options);
  }



  // sync events have no changes, so we don't trigger
  // "change" events.
  if (eventName === 'sync') {
    return;
  }

  state.hoodie.store.trigger('change', eventName, extend(true, {}, object), options);
  state.hoodie.store.trigger(object.type + ':change', eventName, extend(true, {}, object), options);

  if (eventName !== 'new') {
    state.hoodie.store.trigger(object.type + ':' + object.id + ':change', eventName, extend(true, {}, object), options);

  }
};

// when an object gets changed, two special events get triggered:
//
// 1. dirty event
//    the `dirty` event gets triggered immediately, for every
//    change that happens.
// 2. idle event
//    the `idle` event gets triggered after a short timeout of
//    no changes, e.g. 2 seconds.
exports.triggerDirtyAndIdleEvents = function(state) {
  state.hoodie.store.trigger('dirty');
  global.clearTimeout(state.dirtyTimeout);

  state.dirtyTimeout = global.setTimeout(function() {
    state.hoodie.store.trigger('idle', state.hoodie.store.changedObjects());
  }, state.idleTimeout);
};

//
exports.enqueue = function(state, method, args) {
  var defer = getDefer();
  state.queue.push([method, args, defer]);
  return defer.promise;
};

//
// 1. we store all existing data and config in memory
// 2. we write it back on signin, with new hoodieId/username
//
exports.moveData = function (state) {
  var oldObjects = [];
  var oldHoodieId;

  state.hoodie.store.findAll().done( function(data) {
    oldObjects = data;

    if (! oldObjects.length) {
      return;
    }
    oldHoodieId = state.hoodie.id();

    state.hoodie.once('account:signin', function(newUsername, newHoodieId) {
      oldObjects.forEach(function(object) {
        if (object.createdBy === oldHoodieId) {
          object.createdBy = newHoodieId;
        }
        object = exports.cache(state, object.type, object.id, object);
        exports.markAsChanged(state, object.type, object.id, object, {silent: true});
      });

      exports.triggerDirtyAndIdleEvents(state);
    });
  });
};
