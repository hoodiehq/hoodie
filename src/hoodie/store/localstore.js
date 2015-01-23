/*jshint -W079 */
var helpers = require('./helpers');

var utils = require('../../utils');

var generateId = utils.generateId;
var localStorageWrapper = utils.localStorageWrapper;

var promise = utils.promise;
var getDefer = promise.defer;
var rejectWith = promise.rejectWith;
var resolveWith = promise.resolveWith;
var Promise = promise.Promise;

// LocalStore
// ============

// ------
//
// saves the passed object into the store and replaces
// an eventually existing object with same type & id.
//
// When id is undefined, it gets generated an new object gets saved
//
// It also adds timestamps along the way:
//
// * `createdAt` unless it already exists
// * `updatedAt` every time
// * `_syncedAt`  if changes comes from remote
//
// example usage:
//
//     store.save('car', undefined, {color: 'red'})
//     store.save('car', 'abc4567', {color: 'red'})
//
exports.save = function(state, object, options) {
  var currentObject, defer, error, event, isNew, key;

  options = options || {};

  // if store is currently bootstrapping data from remote,
  // we're queueing local saves until it's finished.
  if (state.hoodie.store.isBootstrapping(state) && !options.remote) {
    return helpers.enqueue(state, 'save', arguments);
  }

  // generate an id if necessary
  if (object.id) {
    currentObject = helpers.cache(state, object.type, object.id);
    isNew = typeof currentObject !== 'object';
  } else {
    isNew = true;
    object.id = generateId();
  }

  if (isNew) {
    // add createdBy hash
    object.createdBy = object.createdBy || state.hoodie.id();
  } else {
    // leave createdBy hash
    if (currentObject.createdBy) {
      object.createdBy = currentObject.createdBy;
    }
  }

  // handle local properties and hidden properties with $ prefix
  // keep local properties for remote updates
  if (!isNew) {

    // for remote updates, keep local properties (starting with '_')
    // for local updates, keep hidden properties (starting with '$')
    for (key in currentObject) {
      if (!object.hasOwnProperty(key)) {
        switch (key.charAt(0)) {
        case '_':
          if (options.remote) {
            object[key] = currentObject[key];
          }
          break;
        case '$':
          if (!options.remote) {
            object[key] = currentObject[key];
          }
        }
      }
    }
  }

  // add timestamps
  if (options.remote) {
    object._syncedAt = helpers.now(state);
  } else if (!options.silent) {
    object.updatedAt = helpers.now(state);
    object.createdAt = object.createdAt || object.updatedAt;
  }

  // handle local changes
  //
  // A local change is meant to be replicated to the
  // users database, but not beyond. For example when
  // a user subscribes to a share but then decides to unsubscribe,
  // all objects get removed with local: true flag, so that
  // they get removed from the users database, but will remain elsewhere.
  if (options.local) {
    object._$local = true;
  } else {
    delete object._$local;
  }

  defer = getDefer();

  try {
    object = helpers.cache(state, object.type, object.id, object, options);
    defer.resolve(object, isNew);
    event = isNew ? 'add' : 'update';
    if (!options.silent) {
      helpers.triggerEvents(state, event, object, options);
    }
  } catch (_error) {
    error = _error;
    defer.reject(error.toString());
  }

  return defer.promise;
};


// find
// ------

// loads one object from Store, specified by `type` and `id`
//
// example usage:
//
//     store.find('car', 'abc4567')
exports.find = function(state, type, id) {
  var error, object;

  // if store is currently bootstrapping data from remote,
  // we're queueing until it's finished
  if (state.hoodie.store.isBootstrapping()) {
    return helpers.enqueue(state, 'find', arguments);
  }

  try {
    object = helpers.cache(state, type, id);
    if (!object) {
      return rejectWith({
        name: 'HoodieNotFoundError',
        message: '"{{type}}" with id "{{id}}" could not be found',
        type: type,
        id: id
      });
    }
    return resolveWith(object);
  } catch (_error) {
    error = _error;
    return rejectWith(error);
  }
};


// findAll
// ---------

// returns all objects from store.
// Can be optionally filtered by a type or a function
//
// example usage:
//
//     store.findAll()
//     store.findAll('car')
//     store.findAll(function(obj) { return obj.brand == 'Tesla' })
//
exports.findAll = function(state, filter) {
  var currentType, defer, error, id, key, keys, obj, results, type;



  if (filter == null) {
    filter = function() {
      return true;
    };
  }

  // if store is currently bootstrapping data from remote,
  // we're queueing until it's finished
  if (state.hoodie.store.isBootstrapping()) {
    return helpers.enqueue(state, 'findAll', arguments);
  }

  keys = state.hoodie.store.index();

  // normalize filter
  if (typeof filter === 'string') {
    type = filter;
    filter = function(obj) {
      return obj.type === type;
    };
  }

  defer = getDefer();

  try {

    //
    results = (function() {
      var _i, _len, _ref, _results;
      _results = [];
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        if (!(helpers.isSemanticKey(state, key))) {
          continue;
        }
        _ref = key.split('/'),
        currentType = _ref[0],
        id = _ref[1];

        obj = helpers.cache(state, currentType, id);
        if (obj && filter(obj)) {
          _results.push(obj);
        } else {
          continue;
        }
      }
      return _results;
    }).call(this);

    // sort from newest to oldest
    results.sort(function(a, b) {
      if (a.createdAt > b.createdAt) {
        return -1;
      } else if (a.createdAt < b.createdAt) {
        return 1;
      } else {
        return 0;
      }
    });
    defer.resolve(results);
  } catch (_error) {
    error = _error;
    defer.reject(error);
  }
  return defer.promise;
};


// Remove
// --------

// Removes one object specified by `type` and `id`.
//
// when object has been synced before, mark it as deleted.
// Otherwise remove it from Store.
exports.remove = function(state, type, id, options) {
  var key, object, objectWasMarkedAsDeleted;

  options = options || {};

  // if store is currently bootstrapping data from remote,
  // we're queueing local removes until it's finished.
  if (state.hoodie.store.isBootstrapping() && !options.remote) {
    return helpers.enqueue(state, 'remove', arguments);
  }

  key = type + '/' + id;
  object = helpers.cache(state, type, id);

  // https://github.com/hoodiehq/hoodie.js/issues/147
  if (options.update) {
    object = options.update;
    delete options.update;
  }

  // if change comes from remote, just clean up locally
  if (options.remote) {
    localStorageWrapper.removeItem(key);
    objectWasMarkedAsDeleted = state.cachedObject[key] && helpers.isMarkedAsDeleted(state, state.cachedObject[key]);
    state.cachedObject[key] = false;
    helpers.clearChanged(state, type, id);
    if (object) {
      if (!objectWasMarkedAsDeleted) {
        helpers.triggerEvents(state, 'remove', object, options);
      }
      return resolveWith(object);
    }
  }


  //
  if (!object) {
    return rejectWith({
      name: 'HoodieNotFoundError',
      message: '"{{type}}" with id "{{id}}" could not be found',
      type: type,
      id: id
    });
  }



  if (object._syncedAt) {
    object._deleted = true;
    helpers.cache(state, type, id, object);
  } else {
    key = type + '/' + id;
    localStorageWrapper.removeItem(key);
    state.cachedObject[key] = false;
    helpers.clearChanged(state, type, id);
  }


  helpers.triggerEvents(state, 'remove', object, options);
  return resolveWith(object);
};


// Remove all
// ----------

// Removes one object specified by `type` and `id`.
//
// when object has been synced before, mark it as deleted.
// Otherwise remove it from Store.
exports.removeAll = function(state, type, options) {
  return state.hoodie.store.findAll(type).then(function(objects) {
    var removePromises;

    removePromises = objects.map(function(object) {
      return state.hoodie.store.remove(object.type, object.id, options);
    });

    return Promise.all(removePromises);
  });
};
