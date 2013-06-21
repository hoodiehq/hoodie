// LocalStore
// ============
// 
// window.localStrage wrapper and more
// 
Hoodie.LocalStore = (function (_super) {

  'use strict';

  function LocalStore(hoodie) {
    this.hoodie = hoodie;
    this._triggerDirtyAndIdleEvents = __bind(this._triggerDirtyAndIdleEvents, this);
    this._handleRemoteChange = __bind(this._handleRemoteChange, this);
    this.clear = __bind(this.clear, this);
    this.markAllAsChanged = __bind(this.markAllAsChanged, this);

    // cache of localStorage for quicker access
    this._cached = {};

    // map of dirty objects by their ids
    this._dirty = {};

    // extend this property with extra functions that will be available
    // on all promises returned by hoodie.store API. It has a reference
    // to current hoodie instance by default
    this._promiseApi = {
      hoodie: this.hoodie
    };


    // if browser does not support local storage persistence,
    // e.g. Safari in private mode, overite the respective methods.
    if (!this.isPersistent()) {
      this.db = {
        getItem: function() {
          return null;
        },
        setItem: function() {
          return null;
        },
        removeItem: function() {
          return null;
        },
        key: function() {
          return null;
        },
        length: function() {
          return 0;
        },
        clear: function() {
          return null;
        }
      };
    }

    this._subscribeToOutsideEvents();
    this._bootstrap();
  }

  __extends(LocalStore, _super);


  // 2 seconds timout before triggering the `store:idle` event
  LocalStore.prototype.idleTimeout = 2000;


  // 
  // localStorage proxy
  // 
  LocalStore.prototype.db = {
    getItem: function(key) {
      return window.localStorage.getItem(key);
    },
    setItem: function(key, value) {
      return window.localStorage.setItem(key, value);
    },
    removeItem: function(key) {
      return window.localStorage.removeItem(key);
    },
    key: function(nr) {
      return window.localStorage.key(nr);
    },
    length: function() {
      return window.localStorage.length;
    },
    clear: function() {
      return window.localStorage.clear();
    }
  };


  // Save
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
  LocalStore.prototype.save = function (type, id, properties, options) {
    var currentObject, defer, error, event, isNew, key, object;

    options = options || {};
    defer = LocalStore.__super__.save.apply(this, arguments);

    if (this.hoodie.isPromise(defer)) {
      return this._decoratePromise(defer);
    }

    object = $.extend(true, {}, properties);

    if (id) {
      currentObject = this.cache(type, id);
      isNew = typeof currentObject !== 'object';
    } else {
      isNew = true;
      id = this.hoodie.uuid();
    }

    if (isNew && this.hoodie.account) {
      object.createdBy = object.createdBy || this.hoodie.account.ownerHash;
    }

    if (!isNew) {
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

    if (options.remote) {
      object._syncedAt = this._now();
    } else if (!options.silent) {
      object.updatedAt = this._now();
      object.createdAt = object.createdAt || object.updatedAt;
    }

    if (options.local) {
      object._$local = true;
    } else {
      delete object._$local;
    }

    try {
      object = this.cache(type, id, object, options);
      defer.resolve(object, isNew).promise();
      event = isNew ? 'add' : 'update';
      this._triggerEvents(event, object, options);
    } catch (_error) {
      error = _error;
      defer.reject(error).promise();
    }

    return this._decoratePromise(defer.promise());
  };

  LocalStore.prototype.find = function(type, id) {
    var defer, error, object;
    defer = LocalStore.__super__.find.apply(this, arguments);
    if (this.hoodie.isPromise(defer)) {
      return this._decoratePromise(defer);
    }
    try {
      object = this.cache(type, id);
      if (!object) {
        defer.reject(Hoodie.Errors.NOT_FOUND(type, id)).promise();
      }
      defer.resolve(object);
    } catch (_error) {
      error = _error;
      defer.reject(error);
    }
    return this._decoratePromise(defer.promise());
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
  LocalStore.prototype.findAll = function(filter) {
    var currentType, defer, error, id, key, keys, obj, results, type;

    if (filter == null) {
      filter = function() {
        return true;
      };
    }

    defer = LocalStore.__super__.findAll.apply(this, arguments);

    if (this.hoodie.isPromise(defer)) {
      return this._decoratePromise(defer);
    }

    keys = this.index();

    if (typeof filter === 'string') {
      type = filter;
      filter = function(obj) {
        return obj.type === type;
      };
    }

    try {
      results = (function() {
        var _i, _len, _ref, _results;
        _results = [];
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          key = keys[_i];
          if (!(this._isSemanticId(key))) {
            continue;
          }
          _ref = key.split('/'),
          currentType = _ref[0],
          id = _ref[1];

          obj = this.cache(currentType, id);
          if (obj && filter(obj)) {
            _results.push(obj);
          } else {
            continue;
          }
        }
        return _results;
      }).call(this);
      results.sort(function(a, b) {
        if (a.createdAt > b.createdAt) {
          return -1;
        } else if (a.createdAt < b.createdAt) {
          return 1;
        } else {
          return 0;
        }
      });
      defer.resolve(results).promise();
    } catch (_error) {
      error = _error;
      defer.reject(error).promise();
    }
    return this._decoratePromise(defer.promise());
  };

  LocalStore.prototype.remove = function(type, id, options) {

    var defer, key, object, objectWasMarkedAsDeleted, promise;

    options = options || {};
    defer = LocalStore.__super__.remove.apply(this, arguments);

    if (this.hoodie.isPromise(defer)) {
      return this._decoratePromise(defer);
    }

    key = "" + type + "/" + id;

    if (options.remote) {
      this.db.removeItem(key);
      objectWasMarkedAsDeleted = this._cached[key] && this._isMarkedAsDeleted(this._cached[key]);
      this._cached[key] = false;
      this.clearChanged(type, id);
      if (objectWasMarkedAsDeleted) {
        return;
      }
    }

    object = this.cache(type, id);

    if (!object) {
      return this._decoratePromise(defer.reject(Hoodie.Errors.NOT_FOUND(type, id)).promise());
    }

    if (object._syncedAt) {
      object._deleted = true;
      this.cache(type, id, object);
    } else {
      key = "" + type + "/" + id;
      this.db.removeItem(key);
      this._cached[key] = false;
      this.clearChanged(type, id);
    }

    this._triggerEvents("remove", object, options);

    promise = defer.resolve(object).promise();

    return this._decoratePromise(promise);
  };

  LocalStore.prototype.update = function() {
    return this._decoratePromise(LocalStore.__super__.update.apply(this, arguments));
  };

  LocalStore.prototype.updateAll = function() {
    return this._decoratePromise(LocalStore.__super__.updateAll.apply(this, arguments));
  };

  LocalStore.prototype.removeAll = function() {
    return this._decoratePromise(LocalStore.__super__.removeAll.apply(this, arguments));
  };

  LocalStore.prototype.index = function() {
    var i, key, keys, _i, _ref;
    keys = [];
    for (i = _i = 0, _ref = this.db.length(); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      key = this.db.key(i);
      if (this._isSemanticId(key)) {
        keys.push(key);
      }
    }
    return keys;
  };

  LocalStore.prototype.cache = function(type, id, object, options) {
    var key;

    if (object === undefined) {
      object = false;
    }

    options = options || {};
    key = "" + type + "/" + id;

    if (object) {
      $.extend(object, {
        type: type,
        id: id
      });

      this._setObject(type, id, object);

      if (options.remote) {
        this.clearChanged(type, id);
        this._cached[key] = $.extend(true, {}, object);
        return this._cached[key];
      }

    } else {

      if (this._cached[key] === false) {
        return false;
      }

      if (this._cached[key]) {
        return $.extend(true, {}, this._cached[key]);
      }

      object = this._getObject(type, id);

      if (object === false) {
        this.clearChanged(type, id);
        this._cached[key] = false;
        return false;
      }

    }


    if (this._isMarkedAsDeleted(object)) {
      this.markAsChanged(type, id, object, options);
      this._cached[key] = false;
      return false;
    }

    this._cached[key] = $.extend(true, {}, object);

    if (this._isDirty(object)) {
      this.markAsChanged(type, id, this._cached[key], options);
    } else {
      this.clearChanged(type, id);
    }

    return $.extend(true, {}, object);
  };

  LocalStore.prototype.clearChanged = function(type, id) {
    var key;
    if (type && id) {
      key = "" + type + "/" + id;
      delete this._dirty[key];
    } else {
      this._dirty = {};
    }
    this._saveDirtyIds();
    return window.clearTimeout(this._dirtyTimeout);
  };

  LocalStore.prototype.isMarkedAsDeleted = function(type, id) {
    return this._isMarkedAsDeleted(this.cache(type, id));
  };

  LocalStore.prototype.markAsChanged = function(type, id, object, options) {
    var key;

    options = options || {};
    key = "" + type + "/" + id;

    this._dirty[key] = object;
    this._saveDirtyIds();

    if (options.silent) {
      return;
    }

    return this._triggerDirtyAndIdleEvents();
  };

  LocalStore.prototype.markAllAsChanged = function() {
    var self = this;

    return this.findAll().pipe(function(objects) {
      var key, object, _i, _len;

      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        key = "" + object.type + "/" + object.id;
        self._dirty[key] = object;
      }

      self._saveDirtyIds();

      return self._triggerDirtyAndIdleEvents();
    });
  };

  LocalStore.prototype.changedObjects = function() {
    var id, key, object, type, _ref, _ref1, _results;

    _ref = this._dirty;
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

  LocalStore.prototype.isDirty = function(type, id) {
    if (!type) {
      return !$.isEmptyObject(this._dirty);
    }
    return this._isDirty(this.cache(type, id));
  };

  LocalStore.prototype.clear = function() {
    var defer, error, key, keys, results;
    defer = this.hoodie.defer();
    try {
      keys = this.index();
      results = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          key = keys[_i];
          if (this._isSemanticId(key)) {
            _results.push(this.db.removeItem(key));
          }
        }
        return _results;
      }).call(this);
      this._cached = {};
      this.clearChanged();
      defer.resolve();
      this.trigger("clear");
    } catch (_error) {
      error = _error;
      defer.reject(error);
    }
    return defer.promise();
  };

  LocalStore.prototype.isPersistent = function() {
    var e;
    try {
      if (!window.localStorage) {
        return false;
      }
      localStorage.setItem('Storage-Test', "1");
      if (localStorage.getItem('Storage-Test') !== "1") {
        return false;
      }
      localStorage.removeItem('Storage-Test');
    } catch (_error) {
      e = _error;
      return false;
    }
    return true;
  };

  LocalStore.prototype.trigger = function() {
    var event, parameters, _ref;
    event = arguments[0],
    parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];
    return (_ref = this.hoodie).trigger.apply(_ref, ["store:" + event].concat(Array.prototype.slice.call(parameters)));
  };

  LocalStore.prototype.on = function(event, data) {
    event = event.replace(/(^| )([^ ]+)/g, "$1store:$2");
    return this.hoodie.on(event, data);
  };

  LocalStore.prototype.decoratePromises = function(methods) {
    return $.extend(this._promiseApi, methods);
  };

  LocalStore.prototype._bootstrap = function() {
    var id, key, keys, obj, type, _i, _len, _ref, _results;
    keys = this.db.getItem('_dirty');
    if (!keys) {
      return;
    }
    keys = keys.split(',');
    _results = [];
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      key = keys[_i];
      _ref = key.split('/'),
      type = _ref[0],
      id = _ref[1];
      _results.push(obj = this.cache(type, id));
    }
    return _results;
  };

  LocalStore.prototype._subscribeToOutsideEvents = function() {
    this.hoodie.on('account:cleanup', this.clear);
    this.hoodie.on('account:signup', this.markAllAsChanged);
    return this.hoodie.on('remote:change', this._handleRemoteChange);
  };

  LocalStore.prototype._handleRemoteChange = function(typeOfChange, object) {
    if (typeOfChange === 'remove') {
      return this.remove(object.type, object.id, {
        remote: true
      });
    } else {
      return this.save(object.type, object.id, object, {
        remote: true
      });
    }
  };

  LocalStore.prototype._setObject = function(type, id, object) {
    var key, store;

    key = "" + type + "/" + id;
    store = $.extend({}, object);

    delete store.type;
    delete store.id;
    return this.db.setItem(key, JSON.stringify(store));
  };

  LocalStore.prototype._getObject = function(type, id) {
    var key, obj;

    key = "" + type + "/" + id;
    var json = this.db.getItem(key);

    if (json) {
      obj = JSON.parse(json);
      obj.type = type;
      obj.id = id;
      return obj;
    } else {
      return false;
    }
  };

  LocalStore.prototype._saveDirtyIds = function() {
    if ($.isEmptyObject(this._dirty)) {
      return this.db.removeItem('_dirty');
    } else {
      var ids = Object.keys(this._dirty);
      return this.db.setItem('_dirty', ids.join(','));
    }
  };

  LocalStore.prototype._now = function() {
    return JSON.stringify(new Date()).replace(/"/g, '');
  };

  LocalStore.prototype._isValidId = function(key) {
    return new RegExp(/^[a-z0-9\-]+$/).test(key);
  };

  LocalStore.prototype._isValidType = function(key) {
    return new RegExp(/^[a-z$][a-z0-9]+$/).test(key);
  };

  LocalStore.prototype._isSemanticId = function(key) {
    return new RegExp(/^[a-z$][a-z0-9]+\/[a-z0-9]+$/).test(key);
  };

  LocalStore.prototype._isDirty = function(object) {
    if (!object.updatedAt) {
      return false;
    }
    if (!object._syncedAt) {
      return true;
    }
    return object._syncedAt < object.updatedAt;
  };

  LocalStore.prototype._isMarkedAsDeleted = function(object) {
    return object._deleted === true;
  };

  LocalStore.prototype._triggerEvents = function(event, object, options) {
    this.trigger(event, object, options);
    this.trigger("" + event + ":" + object.type, object, options);

    if (event !== 'new') {
      this.trigger("" + event + ":" + object.type + ":" + object.id, object, options);
    }

    this.trigger("change", event, object, options);
    this.trigger("change:" + object.type, event, object, options);

    if (event !== 'new') {
      this.trigger("change:" + object.type + ":" + object.id, event, object, options);
    }
  };

  LocalStore.prototype._triggerDirtyAndIdleEvents = function() {
    var self = this;

    this.trigger('dirty');

    window.clearTimeout(this._dirtyTimeout);

    this._dirtyTimeout = window.setTimeout(function() {
      self.trigger('idle', self.changedObjects());
    }, this.idleTimeout);
  };

  LocalStore.prototype._decoratePromise = function(promise) {
    return $.extend(promise, this._promiseApi);
  };

  return LocalStore;

})(Hoodie.Store);

