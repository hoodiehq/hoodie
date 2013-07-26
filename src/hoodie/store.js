// Store
// ============

// This class defines the API that other Stores have to implement to assure a
// coherent API.
//
// It also implements some validations and functionality that is the same across
// store impnementations
//

Hoodie.Store = (function() {

  'use strict';

  // Constructor
  // ------------

  // set store.hoodie instance variable
  function Store(hoodie) {
    this.hoodie = hoodie;
  }


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
  Store.prototype.save = function(type, id, object, options) {
    var defer;

    if (options === null) {
      options = {};
    }

    defer = this.hoodie.defer();

    if (typeof object !== 'object' || Array.isArray(object)) {
      defer.reject(Hoodie.Errors.INVALID_ARGUMENTS("invalid object"));
      return defer.promise();
    }

    // validations
    if (id && !this._isValidId(id)) {
      return defer.reject(Hoodie.Errors.INVALID_KEY({
        id: id
      })).promise();
    }
    if (!this._isValidType(type)) {
      return defer.reject(Hoodie.Errors.INVALID_KEY({
        type: type
      })).promise();
    }

    return defer;
  };


  // Add
  // -------------------

  // `.add` is an alias for `.save`, with the difference that there is no id argument.
  // Internally it simply calls `.save(type, undefined, object).
  //
  Store.prototype.add = function(type, object, options) {

    if (object === undefined) {
      object = {};
    }

    options = options || {};

    return this.save(type, object.id, object);
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
  Store.prototype.update = function(type, id, objectUpdate, options) {
    var defer, _loadPromise, self = this;

    defer = this.hoodie.defer();

    _loadPromise = this.find(type, id).pipe(function(currentObj) {
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
      self.save(type, id, newObj, options).then(defer.resolve, defer.reject);
    });

    // if not found, add it
    _loadPromise.fail(function() {
      return self.save(type, id, objectUpdate, options).then(defer.resolve, defer.reject);
    });

    return defer.promise();
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
  Store.prototype.updateAll = function(filterOrObjects, objectUpdate, options) {
    var promise, self = this;
    options = options || {};

    // normalize the input: make sure we have all objects
    switch (true) {
    case typeof filterOrObjects === 'string':
      promise = this.findAll(filterOrObjects);
      break;
    case this.hoodie.isPromise(filterOrObjects):
      promise = filterOrObjects;
      break;
    case $.isArray(filterOrObjects):
      promise = this.hoodie.defer().resolve(filterOrObjects).promise();
      break;
    default: // e.g. null, update all
      promise = this.findAll();
    }

    return promise.pipe(function(objects) {
      // now we update all objects one by one and return a promise
      // that will be resolved once all updates have been finished
      var defer, object, _updatePromises;

      defer = self.hoodie.defer();

      if (!$.isArray(objects)) {
        objects = [objects];
      }

      _updatePromises = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          _results.push(this.update(object.type, object.id, objectUpdate, options));
        }
        return _results;
      }).call(self);

      $.when.apply(null, _updatePromises).then(defer.resolve);
      return defer.promise();
    });
  };


  // find
  // -----------------

  // loads one object from Store, specified by `type` and `id`
  //
  // example usage:
  //
  //     store.find('car', 'abc4567')
  //
  Store.prototype.find = function(type, id) {
    var defer;
    defer = this.hoodie.defer();
    if (!(typeof type === 'string' && typeof id === 'string')) {
      return defer.reject(Hoodie.Errors.INVALID_ARGUMENTS("type & id are required")).promise();
    }
    return defer;
  };


  // find or add
  // -------------

  // 1. Try to find a share by given id
  // 2. If share could be found, return it
  // 3. If not, add one and return it.
  //
  Store.prototype.findOrAdd = function(type, id, attributes) {
    var defer, self = this;

    if (attributes === null) {
      attributes = {};
    }

    defer = this.hoodie.defer();
    this.find(type, id).done(defer.resolve).fail(function() {
      var newAttributes;
      newAttributes = $.extend(true, {
        id: id
      }, attributes);
      return self.add(type, newAttributes).then(defer.resolve, defer.reject);
    });
    return defer.promise();
  };


  // findAll
  // ------------

  // returns all objects from store.
  // Can be optionally filtered by a type or a function
  //
  Store.prototype.findAll = function() {
    return this.hoodie.defer();
  };


  // Remove
  // ------------

  // Removes one object specified by `type` and `id`.
  //
  // when object has been synced before, mark it as deleted.
  // Otherwise remove it from Store.
  //
  Store.prototype.remove = function(type, id, options) {
    var defer;

    if (options === null) {
      options = {};
    }

    defer = this.hoodie.defer();

    if (!(typeof type === 'string' && typeof id === 'string')) {
      return defer.reject(Hoodie.Errors.INVALID_ARGUMENTS("type & id are required")).promise();
    }

    return defer;
  };


  // removeAll
  // -----------

  // Destroyes all objects. Can be filtered by a type
  //
  Store.prototype.removeAll = function(type, options) {
    var self = this;

    options = options || {};

    return this.findAll(type).pipe(function(objects) {
      var object, _i, _len, _results;

      _results = [];

      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        _results.push(self.remove(object.type, object.id, options));
      }

      return _results;
    });

  };

  //
  // ## Private
  //

  Store.prototype._now = function() {
    return new Date();
  };

  // / not allowed for id
  Store.prototype._isValidId = function(key) {
    return new RegExp(/^[^\/]+$/).test(key);
  };

  // / not allowed for type
  Store.prototype._isValidType = function(key) {
    return new RegExp(/^[^\/]+$/).test(key);
  };

  return Store;

})();

