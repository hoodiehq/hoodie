/* exported hoodieStoreBase */

// Store
// ============

// This class defines the API that other Stores have to implement to assure a
// coherent API.
//
// It also implements some validations and functionality that is the same across
// store impnementations
//

/* jslint unused: false */
function hoodieStoreBase(hoodie) {

  var store = {
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
    save : function(type, id, object, options) {
      var defer;

      if (options === null) {
        options = {};
      }

      defer = hoodie.defer();

      if (typeof object !== 'object' || Array.isArray(object)) {
        defer.reject(Hoodie.Errors.INVALID_ARGUMENTS("invalid object"));
        return defer.promise();
      }

      // validations
      if (id && !isValidId(id)) {
        return defer.reject(Hoodie.Errors.INVALID_KEY({
          id: id
        })).promise();
      }
      if (!isValidType(type)) {
        return defer.reject(Hoodie.Errors.INVALID_KEY({
          type: type
        })).promise();
      }

      return defer;
    },


    // Add
    // -------------------

    // `.add` is an alias for `.save`, with the difference that there is no id argument.
    // Internally it simply calls `.save(type, undefined, object).
    //
    add : function(type, object, options) {

      if (object === undefined) {
        object = {};
      }

      options = options || {};

      return store.save(type, object.id, object);
    },


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
    update : function(type, id, objectUpdate, options) {
      var defer, _loadPromise;

      defer = hoodie.defer();

      _loadPromise = store.find(type, id).pipe(function(currentObj) {
        var changedProperties, newObj, value;

        // normalize input
        newObj = $.extend(true, {}, currentObj);

        if (typeof objectUpdate === 'function') {
          objectUpdate = objectUpdate(newObj);
        }

        if (!objectUpdate) {
          return defer.resolve(currentObj);
        }

        // check if something changed
        changedProperties = (function() {
          var _results = [];

          for (var key in objectUpdate) {
            if (objectUpdate.hasOwnProperty(key)) {
              value = objectUpdate[key];
              if ((currentObj[key] !== value) === false) {
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
          return defer.resolve(newObj);
        }

        //apply update
        store.save(type, id, newObj, options).then(defer.resolve, defer.reject);
      });

      // if not found, add it
      _loadPromise.fail(function() {
        return store.save(type, id, objectUpdate, options).then(defer.resolve, defer.reject);
      });

      return defer.promise();
    },


    // updateAll
    // -----------------

    // update all objects in the store, can be optionally filtered by a function
    // As an alternative, an array of objects can be passed
    //
    // example usage
    //
    // hoodie.store.updateAll()
    //
    updateAll : function(filterOrObjects, objectUpdate, options) {
      var promise;
      options = options || {};

      // normalize the input: make sure we have all objects
      switch (true) {
      case typeof filterOrObjects === 'string':
        promise = store.findAll(filterOrObjects);
        break;
      case hoodie.isPromise(filterOrObjects):
        promise = filterOrObjects;
        break;
      case $.isArray(filterOrObjects):
        promise = hoodie.defer().resolve(filterOrObjects).promise();
        break;
      default: // e.g. null, update all
        promise = store.findAll();
      }

      return promise.pipe(function(objects) {
        // now we update all objects one by one and return a promise
        // that will be resolved once all updates have been finished
        var defer, object, _updatePromises;

        defer = hoodie.defer();

        if (!$.isArray(objects)) {
          objects = [objects];
        }

        _updatePromises = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = objects.length; _i < _len; _i++) {
            object = objects[_i];
            _results.push(store.update(object.type, object.id, objectUpdate, options));
          }
          return _results;
        })();

        $.when.apply(null, _updatePromises).then(defer.resolve);
        return defer.promise();
      });
    },


    // find
    // -----------------

    // loads one object from Store, specified by `type` and `id`
    //
    // example usage:
    //
    //     store.find('car', 'abc4567')
    //
    find : function(type, id) {
      var defer;
      defer = hoodie.defer();
      if (!(typeof type === 'string' && typeof id === 'string')) {
        return defer.reject(Hoodie.Errors.INVALID_ARGUMENTS("type & id are required")).promise();
      }
      return defer;
    },


    // find or add
    // -------------

    // 1. Try to find a share by given id
    // 2. If share could be found, return it
    // 3. If not, add one and return it.
    //
    findOrAdd : function(type, id, attributes) {
      var defer;

      if (attributes === null) {
        attributes = {};
      }

      defer = hoodie.defer();
      store.find(type, id).done(defer.resolve).fail(function() {
        var newAttributes;
        newAttributes = $.extend(true, {
          id: id
        }, attributes);
        return store.add(type, newAttributes).then(defer.resolve, defer.reject);
      });
      return defer.promise();
    },


    // findAll
    // ------------

    // returns all objects from store.
    // Can be optionally filtered by a type or a function
    //
    findAll : function() {
      return hoodie.defer();
    },


    // Remove
    // ------------

    // Removes one object specified by `type` and `id`.
    //
    // when object has been synced before, mark it as deleted.
    // Otherwise remove it from Store.
    //
    remove : function(type, id, options) {
      var defer;

      if (options === null) {
        options = {};
      }

      defer = hoodie.defer();

      if (!(typeof type === 'string' && typeof id === 'string')) {
        return defer.reject(Hoodie.Errors.INVALID_ARGUMENTS("type & id are required")).promise();
      }

      return defer;
    },


    // removeAll
    // -----------

    // Destroyes all objects. Can be filtered by a type
    //
    removeAll : function(type, options) {
      options = options || {};

      return store.findAll(type).pipe(function(objects) {
        var object, _i, _len, _results;

        _results = [];

        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          _results.push(store.remove(object.type, object.id, options));
        }

        return _results;
      });

    }
  };

  //
  // ## Private
  //

  // / not allowed for id
  function isValidId(key) {
    return new RegExp(/^[^\/]+$/).test(key);
  }

  // / not allowed for type
  function isValidType(key) {
    return new RegExp(/^[^\/]+$/).test(key);
  }

  return store;
}
