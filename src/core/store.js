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

  function Store(hoodie) {
    this.hoodie = hoodie;
  }

  Store.prototype.save = function(type, id, object, options) {
    var defer;

    if (options === null) {
      options = {};
    }

    defer = this.hoodie.defer();

    if (typeof object !== 'object') {
      defer.reject(Hoodie.Errors.INVALID_ARGUMENTS("object is " + (typeof object)));
      return defer.promise();
    }

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

  Store.prototype.add = function(type, object, options) {

    if (object == null) {
      object = {};
    }

    if (options === null) {
      options = {};
    }

    return this.save(type, object.id, object);
  };

  Store.prototype.update = function(type, id, objectUpdate, options) {
    var defer, _loadPromise, self = this;

    defer = this.hoodie.defer();

    _loadPromise = this.find(type, id).pipe(function(currentObj) {
      var changedProperties, key, newObj, value;
      newObj = $.extend(true, {}, currentObj);
      if (typeof objectUpdate === 'function') {
        objectUpdate = objectUpdate(newObj);
      }
      if (!objectUpdate) {
        return defer.resolve(currentObj);
      }
      changedProperties = (function() {
        var _results;
        _results = [];
        for (key in objectUpdate) {
          value = objectUpdate[key];
          if (!(currentObj[key] !== value)) {
            continue;
          }
          newObj[key] = value;
          _results.push(key);
        }
        return _results;
      })();
      if (!(changedProperties.length || options)) {
        return defer.resolve(newObj);
      }
      return self.save(type, id, newObj, options).then(defer.resolve, defer.reject);
    });
    _loadPromise.fail(function() {
      return self.save(type, id, objectUpdate, options).then(defer.resolve, defer.reject);
    });
    return defer.promise();
  };

  Store.prototype.updateAll = function(filterOrObjects, objectUpdate, options) {
    var promise, self = this;
    if (options == null) {
      options = {};
    }
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
    default:
      promise = this.findAll();
    }

    return promise.pipe(function(objects) {
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

  Store.prototype.find = function(type, id) {
    var defer;
    defer = this.hoodie.defer();
    if (!(typeof type === 'string' && typeof id === 'string')) {
      return defer.reject(Hoodie.Errors.INVALID_ARGUMENTS("type & id are required")).promise();
    }
    return defer;
  };

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

  Store.prototype.findAll = function() {
    return this.hoodie.defer();
  };

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

  Store.prototype.removeAll = function(type, options) {
    var self = this;

    if (options == null) {
      options = {};
    }

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

  Store.prototype._now = function() {
    return new Date();
  };

  Store.prototype._isValidId = function(key) {
    return /^[^\/]+$/.test(key);
  };

  Store.prototype._isValidType = function(key) {
    return /^[^\/]+$/.test(key);
  };

  return Store;

})();

