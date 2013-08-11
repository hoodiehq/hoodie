/* exported hoodieStoreApi */

// Store
// ============

// This class defines the API that other Stores have to implement to assure a
// coherent API.
//
// It also implements some validations and functionality that is the same across
// store impnementations
//

/* jslint unused: false */
function hoodieStoreApi(hoodie, options) {

  // public API
  var api = {};

  // persistance logic
  var backend = {};

  // extend this property with extra functions that will be available
  // on all promises returned by hoodie.store API. It has a reference
  // to current hoodie instance by default
  var promiseApi = {
    hoodie: hoodie
  };

  // name
  var storeName = options.name || 'store';


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
  api.save = function save(type, id, properties, options) {

    if (options === null) {
      options = {};
    }

    if (typeof properties !== 'object' || Array.isArray(properties)) {
      return rejectWith(Hoodie.Errors.INVALID_ARGUMENTS('invalid object'));
    }

    // validations
    var error = backend.validate(type, id, properties);
    if(error) {
      return hoodie.rejectWith(error);
    }

    // don't mess with passed object
    var object = $.extend(true, {}, properties, {type: type, id: id});
    return decoratePromise( backend.save(object) );
  };


  // Add
  // -------------------

  // `.add` is an alias for `.save`, with the difference that there is no id argument.
  // Internally it simply calls `.save(type, undefined, object).
  //
  api.add = function add(type, properties, options) {

    if (properties === undefined) {
      properties = {};
    }

    options = options || {};
    return api.save(type, properties.id, properties);
  };


  // find
  // ------

  //
  api.find = function find(type, id) {

    // validations
    var error = backend.validate(type, id);
    if(error) {
      return hoodie.rejectWith(error);
    }

    return decoratePromise( backend.find(type, id) );
  };


  // find or add
  // -------------

  // 1. Try to find a share by given id
  // 2. If share could be found, return it
  // 3. If not, add one and return it.
  //
  api.findOrAdd = function findOrAdd(type, id, properties) {
    var defer;

    if (properties === null) {
      properties = {};
    }

    function handleNotFound() {
      var newProperties;
      newProperties = $.extend(true, {
        id: id
      }, properties);
      return api.add(type, newProperties);
    }

    return api.find(type, id).then(null, handleNotFound);
  };


  // findAll
  // ------------

  // returns all objects from store.
  // Can be optionally filtered by a type or a function
  //
  api.findAll = function findAll(type) {

    // validations
    if (type) {
      var error = backend.validate(type);
      if(error) {
        return rejectWith(error);
      }
    }

    return decoratePromise( backend.findAll(type) );
  };


  // Update
  // -------------------

  // In contrast to `.save`, the `.update` method does not replace the stored object,
  // but only changes the passed attributes of an exsting object, if it exists
  //
  // both a hash of key/values or a function that applies the update to the passed
  // object can be passed.
  //
  // example usage
  //
  // hoodie.store.update('car', 'abc4567', {sold: true})
  // hoodie.store.update('car', 'abc4567', function(obj) { obj.sold = true })
  //
  api.update = function update(type, id, objectUpdate, options) {

    function handleFound(currentObject) {
      var changedProperties, newObj, value;

      // normalize input
      newObj = $.extend(true, {}, currentObject);

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
            if ((currentObject[key] !== value) === false) {
              continue;
            }
            // workaround for undefined values, as $.extend ignores these
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
      return api.save(type, id, newObj, options);
    }

    function handleNotFound() {
      return api.save(type, id, objectUpdate, options);
    }

    return api.find(type, id).then(handleFound, handleNotFound);
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
  api.updateAll = function updateAll(filterOrObjects, objectUpdate, options) {
    var promise;
    options = options || {};

    // normalize the input: make sure we have all objects
    switch (true) {
    case typeof filterOrObjects === 'string':
      promise = api.findAll(filterOrObjects);
      break;
    case hoodie.isPromise(filterOrObjects):
      promise = filterOrObjects;
      break;
    case $.isArray(filterOrObjects):
      promise = hoodie.defer().resolve(filterOrObjects).promise();
      break;
    default: // e.g. null, update all
      promise = api.findAll();
    }

    return promise.then(function(objects) {
      // now we update all objects one by one and return a promise
      // that will be resolved once all updates have been finished
      var object, _updatePromises;

      if (!$.isArray(objects)) {
        objects = [objects];
      }

      _updatePromises = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          _results.push(api.update(object.type, object.id, objectUpdate, options));
        }
        return _results;
      })();

      return $.when.apply(null, _updatePromises);
    });
  };


  // Remove
  // ------------

  // Removes one object specified by `type` and `id`.
  //
  // when object has been synced before, mark it as deleted.
  // Otherwise remove it from Store.
  //
  api.remove = function remove(type, id, options) {
    var defer;

    if (!options) {
      options = {};
    }

    // validations
    var error = backend.validate(type, id);
    if(error) {
      return rejectWith(error);
    }

    return decoratePromise( backend.remove(type, id, options) );
  };


  // removeAll
  // -----------

  // Destroye all objects. Can be filtered by a type
  //
  api.removeAll = function removeAll(type, options) {
    options = options || {};

    // validations
    if (type) {
      var error = backend.validate(type);
      if(error) {
        return rejectWith(error);
      }
    }

    return decoratePromise( removeAll.findAll(type), options );
  };


  // decorate promises
  // -------------------

  // extend promises returned by store.api
  api.decoratePromises = function decoratePromises(methods) {
    return $.extend(promiseApi, methods);
  };



  // trigger
  // ---------

  // proxies to hoodie.trigger
  event.trigger = function trigger() {
    var eventName, parameters, _ref;
    eventName = arguments[0],
    parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];
    return (_ref = hoodie).trigger.apply(_ref, [storeName + ':' + eventName].concat(Array.prototype.slice.call(parameters)));
  };


  // on
  // ---------

  // proxies to hoodie.on
  event.on = function on(eventName, data) {
    eventName = eventName.replace(/(^| )([^ ]+)/g, '$1'+storeName+':$2');
    return hoodie.on(eventName, data);
  };


  // unbind
  // ---------

  // proxies to hoodie.unbind
  event.unbind = function unbind(eventName, callback) {
    eventName = storeName +':' + eventName;
    return hoodie.unbind(eventName, callback);
  };



  // validate
  // ----------

  // by default, we only check for a valid type & id.
  // the validate method can be overwriten by passing
  // options.validate
  //
  // if `validate` returns nothing, the passed object is
  // valid. Otherwise it returns an error
  //
  backend.validate = options.validate;
  if (! backend.validate) {
    backend.validate = function(type, id, object) {

      if (!isValidType(type)) {
        return Hoodie.Errors.INVALID_KEY({
          type: type
        });
      }

      if (arguments.length > 0 && !isValidId(id)) {
        return Hoodie.Errors.INVALID_KEY({
          id: id
        });
      }
    };
  }


  // required backend methods
  // -------------------------
  if (! options.backend ) {
    throw new Error('options.backend must be passed');
  }
  var required = 'save find findAll remove removeAll'.split(' ');
  required.forEach( function(methodName) {
    if (!options.backend[methodName]) {
      throw new Error('options.backend.'+methodName+' must be passed.');
    }

    backend[methodName] = options.backend[methodName];
  });


  // Private
  // ---------

  // / not allowed for id
  function isValidId(key) {
    return new RegExp(/^[^\/]+$/).test(key);
  }

  // / not allowed for type
  function isValidType(key) {
    return new RegExp(/^[^\/]+$/).test(key);
  }

  //
  function decoratePromise(promise) {
    return $.extend(promise, promiseApi);
  }

  function resolveWith() {
    var promise = hoodie.resolveWith(null, arguments);
    return decoratePromise(promise);
  }
  function rejectWith() {
    var promise = hoodie.rejectWith(null, arguments);
    return decoratePromise(promise);
  }

  return api;
}
