/*jshint -W079 */
var extend = require('extend');

var helpers = require('./helpers');

var utils = require('../../../utils');
var promise = utils.promise;
var rejectWith = promise.rejectWith;
var resolveWith = promise.resolveWith;
var isPromise = promise.isPromise;
var Promise = promise.Promise;

// Save
// --------------

// creates or replaces an an eventually existing object in the store
// with same type & id.
//
// When id is undefined, it gets generated and a new object gets saved
//
// example usage:
//
//     store.save('car', undefined, {color: 'red'})
//     store.save('car', 'abc4567', {color: 'red'})
//
exports.save = function(state, type, id, properties, options) {

  if (options) {
    options = extend(true, {}, options);
  } else {
    options = {};
  }

  // don't mess with passed object
  var object = extend(true, {}, properties, {
    type: type,
    id: id
  });

  // validations
  var error = state.validate(object, options || {});

  if (error) {
    return rejectWith(error);
  }

  return helpers.decoratePromise(state, state.backend.save(object, options || {}));
};


// Add
// -------------------

// `.add` is an alias for `.save`, with the difference that there is no id argument.
// Internally it simply calls `.save(type, undefined, object).
//
exports.add = function(state, type, properties, options) {

  if (properties === undefined) {
    properties = {};
  }

  options = options || {};

  if (! properties.id) {
    return exports.save(state, type, properties.id, properties, options);
  }

  return exports.find(state, type, properties.id)
  .then(function(object) {
    return rejectWith({
      name: 'HoodieConflictError',
      message: '"{{type}}" with id "{{id}}" already exists',
      type: object.type,
      id: object.id
    });
  })
  .catch(function(error) {
    if (error.name === 'HoodieNotFoundError') {
      return exports.save(state, type, properties.id, properties, options);
    }

    throw error;
  });
};


// find
// ------

//
exports.find = function(state, type, id) {

  return helpers.decoratePromise(state, state.backend.find(type, id));
};


// find or add
// -------------

// 1. Try to find a share by given id
// 2. If share could be found, return it
// 3. If not, add one and return it.
//
exports.findOrAdd = function(state, type, id, properties) {

  if (properties === null) {
    properties = {};
  }

  function handleNotFound() {
    var newProperties;
    newProperties = extend(true, {
      id: id
    }, properties);
    return exports.add(state, type, newProperties);
  }

  // promise decorations get lost when piped through `then`,
  // that's why we need to decorate the find's promise again.
  var promise = exports.find(state, type, id).then(null, handleNotFound);
  return helpers.decoratePromise(state, promise);
};


// findAll
// ------------

// returns all objects from store.
// Can be optionally filtered by a type or a function
//
exports.findAll = function(state, type, options) {
  return helpers.decoratePromise(state, state.backend.findAll(type, options));
};


// Update
// -------------------

// In contrast to `.save`, the `.update` method does not replace the stored object,
// but only changes the passed attributes of an existing object, if it exists
//
// both a hash of key/values or a function that applies the update to the passed
// object can be passed.
//
// example usage
//
// hoodie.store.update('car', 'abc4567', {sold: true})
// hoodie.store.update('car', 'abc4567', function(obj) { obj.sold = true })
//
exports.update = function(state, type, id, objectUpdate, options) {

  function handleFound(currentObject) {
    var changedProperties, newObj, value;

    // normalize input
    newObj = extend(true, {}, currentObject);

    if (typeof objectUpdate === 'function') {
      objectUpdate = objectUpdate(newObj);
    }

    if (!objectUpdate) {
      return resolveWith(currentObject);
    }

    // check if something changed
    changedProperties = (function() {
      var _results = [];

      for (var key in objectUpdate) {
        if (objectUpdate.hasOwnProperty(key)) {
          value = objectUpdate[key];
          if (currentObject[key] === value) {
            continue;
          }
          // workaround for undefined values, as extend ignores these
          newObj[key] = value;
          _results.push(key);
        }
      }
      return _results;
    })();

    if (!(changedProperties.length || options)) {
      return resolveWith(newObj);
    }

    //apply update
    return exports.save(state, type, id, newObj, options);
  }

  // promise decorations get lost when piped through `then`,
  // that's why we need to decorate the find's promise again.
  var promise = exports.find(state, type, id).then(handleFound);
  return helpers.decoratePromise(state, promise);
};


// updateOrAdd
// -------------

// same as `.update()`, but in case the object cannot be found,
// it gets created
//
exports.updateOrAdd = function(state, type, id, objectUpdate, options) {
  function handleNotFound() {
    var properties = extend(true, {}, objectUpdate, {
      id: id
    });

    return exports.add(state, type, properties, options);
  }

  var promise = exports.update(state, type, id, objectUpdate, options)
    .then(null, handleNotFound);

  return helpers.decoratePromise(state, promise);
};


// updateAll
// -----------------

// update all objects in the store, can be optionally filtered by a function
// As an alternative, an array of objects can be passed
//
// example usage
//
// hoodie.store.updateAll()
//
exports.updateAll = function(state, filterOrObjects, objectUpdate, options) {
  var promise;

  options = options || {};

  // normalize the input: make sure we have all objects
  switch (true) {
  case typeof filterOrObjects === 'string':
    promise = exports.findAll(state, filterOrObjects);
    break;
  case isPromise(filterOrObjects):
    promise = filterOrObjects;
    break;
  case $.isArray(filterOrObjects):
    promise = resolveWith(filterOrObjects);
    break;
  default:
    // e.g. null, update all
    promise = exports.findAll(state);
    options = objectUpdate;
    objectUpdate = filterOrObjects;
  }

  promise = promise.then(function(objects) {
    // now we update all objects one by one and return a promise
    // that will be resolved once all updates have been finished
    var updatePromises;

    if (!$.isArray(objects)) {
      objects = [objects];
    }

    updatePromises = objects.map(function(object) {
      return exports.update(state, object.type, object.id, objectUpdate, options);
    });

    return Promise.all(updatePromises);
  });

  return helpers.decoratePromise(state, promise);
};


// Remove
// ------------

// Removes one object specified by `type` and `id`.
//
// when object has been synced before, mark it as deleted.
// Otherwise remove it from Store.
//
exports.remove = function(state, type, id, options) {
  return helpers.decoratePromise(state, state.backend.remove(type, id, options || {}));
};


// removeAll
// -----------

// Destroy all objects. Can be filtered by a type
//
exports.removeAll = function(state, type, options) {
  return helpers.decoratePromise(state, state.backend.removeAll(type, options || {}));
};


// decorate promises
// -------------------

// extend promises returned by store.api
exports.decoratePromises = function(state, methods) {
  return extend(state.promiseApi, methods);
};
