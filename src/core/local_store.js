// LocalStore
// ============
//
// window.localStrage wrapper and more
//
Hoodie.LocalStore = (function (_super) {

  'use strict';

  function LocalStore(hoodie) {
    this.hoodie = hoodie;

    this.clear = this.clear.bind(this);
    this.markAllAsChanged = this.markAllAsChanged.bind(this);
    this._triggerDirtyAndIdleEvents = this._triggerDirtyAndIdleEvents.bind(this);
    this._handleRemoteChange = this._handleRemoteChange.bind(this);
    this._startBootstrappingMode = this._startBootstrappingMode.bind(this);
    this._endBootstrappingMode = this._endBootstrappingMode.bind(this);

    // cache of localStorage for quicker access
    this._cached = {};

    // map of dirty objects by their ids
    this._dirty = {};

    // queue of method calls done during bootstrapping
    this._queue = [];

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
        getItem: function() { return null; },
        setItem: function() { return null; },
        removeItem: function() { return null; },
        key: function() { return null; },
        length: function() { return 0; },
        clear: function() { return null; }
      };
    }

    this._subscribeToOutsideEvents();
    this._bootstrapDirtyObjects();
  }

  Object.deepExtend(LocalStore, _super);


  // 2 seconds timout before triggering the `store:idle` event
  // 
  LocalStore.prototype.idleTimeout = 2000;


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

    // if store is currently bootstrapping data from remote,
    // we're queueing until it's finished
    if (this.isBootstrapping()) {
      return this._enqueue('save', arguments);
    }

    // make sure we don't mess with the passed object directly
    object = $.extend(true, {}, properties);

    // generate an id if necessary
    if (id) {
      currentObject = this.cache(type, id);
      isNew = typeof currentObject !== 'object';
    } else {
      isNew = true;
      id = this.hoodie.uuid();
    }

    // add createdBy hash to new objects
    // note: we check for `hoodie.account` as in some cases, the code
    //       might get executed before the account module is initiated.
    // todo: move ownerHash into a method on the core hoodie module
    if (isNew && this.hoodie.account) {
      object.createdBy = object.createdBy || this.hoodie.account.ownerHash;
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
      object._syncedAt = this._now();
    } else if (!options.silent) {
      object.updatedAt = this._now();
      object.createdAt = object.createdAt || object.updatedAt;
    }

    // handle local changes
    // 
    // A local change is meant to be replicated to the
    // users database, but not beyond. For example when
    // I subscribed to a share but then decide to unsubscribe,
    // all objects get removed with local: true flag, so that
    // they get removed from my database, but won't anywhere else.
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

  // find
  // ------

  // loads one object from Store, specified by `type` and `id`
  //
  // example usage:
  //
  //     store.find('car', 'abc4567')
  LocalStore.prototype.find = function(type, id) {
    var defer, error, object;
    defer = LocalStore.__super__.find.apply(this, arguments);
    if (this.hoodie.isPromise(defer)) {
      return this._decoratePromise(defer);
    }

    // if store is currently bootstrapping data from remote,
    // we're queueing until it's finished
    if (this.isBootstrapping()) {
      return this._enqueue('find', arguments);
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

    // if store is currently bootstrapping data from remote,
    // we're queueing until it's finished
    if (this.isBootstrapping()) {
      return this._enqueue('findAll', arguments);
    }

    keys = this.index();

    // normalize filter
    if (typeof filter === 'string') {
      type = filter;
      filter = function(obj) {
        return obj.type === type;
      };
    }

    try {

      // 
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
      defer.resolve(results).promise();
    } catch (_error) {
      error = _error;
      defer.reject(error).promise();
    }
    return this._decoratePromise(defer.promise());
  };


  // Remove
  // --------

  // Removes one object specified by `type` and `id`. 
  // 
  // when object has been synced before, mark it as deleted. 
  // Otherwise remove it from Store.
  LocalStore.prototype.remove = function(type, id, options) {

    var defer, key, object, objectWasMarkedAsDeleted, promise;

    options = options || {};
    defer = LocalStore.__super__.remove.apply(this, arguments);

    if (this.hoodie.isPromise(defer)) {
      return this._decoratePromise(defer);
    }

    // if store is currently bootstrapping data from remote,
    // we're queueing until it's finished
    if (this.isBootstrapping()) {
      return this._enqueue('remove', arguments);
    }

    key = "" + type + "/" + id;

    // if change comes from remote, just clean up locally
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


  // update / updateAll / removeAll
  // --------------------------------

  // just decorating returned promises
  LocalStore.prototype.update = function() {
    return this._decoratePromise(LocalStore.__super__.update.apply(this, arguments));
  };
  LocalStore.prototype.updateAll = function() {
    return this._decoratePromise(LocalStore.__super__.updateAll.apply(this, arguments));
  };
  LocalStore.prototype.removeAll = function() {
    return this._decoratePromise(LocalStore.__super__.removeAll.apply(this, arguments));
  };


  // index
  // -------

  // object key index
  // TODO: make this cachy
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


  // Cache
  // -------

  // loads an object specified by `type` and `id` only once from localStorage 
  // and caches it for faster future access. Updates cache when `value` is passed.
  //
  // Also checks if object needs to be synched (dirty) or not 
  //
  // Pass `options.remote = true` when object comes from remote
  // Pass 'options.silent = true' to avoid events from being triggered.
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

      // if the cached key returns false, it means
      // that we have removed that key. We just 
      // set it to false for performance reasons, so
      // that we don't need to look it up again in localStorage
      if (this._cached[key] === false) {
        return false;
      }

      // if key is cached, return it. But make sure
      // to make a deep copy beforehand (=> true)
      if (this._cached[key]) {
        return $.extend(true, {}, this._cached[key]);
      }

      // if object is not yet cached, load it from localStore
      object = this._getObject(type, id);

      // stop here if object did not exist in localStore
      // and cache it so we don't need to look it up again
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

    // here is where we cache the object for
    // future quick access
    this._cached[key] = $.extend(true, {}, object);

    if (this._hasLocalChanges(object)) {
      this.markAsChanged(type, id, this._cached[key], options);
    } else {
      this.clearChanged(type, id);
    }

    return $.extend(true, {}, object);
  };


  // Clear changed 
  // ---------------

  // removes an object from the list of objects that are flagged to by synched (dirty)
  // and triggers a `store:dirty` event
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


  // Marked as deleted?
  // --------------------

  // when an object gets deleted that has been synched before (`_rev` attribute),
  // it cannot be removed from store but gets a `_deleted: true` attribute
  LocalStore.prototype.isMarkedAsDeleted = function(type, id) {
    return this._isMarkedAsDeleted(this.cache(type, id));
  };


  // Mark as changed
  // -----------------

  // Marks object as changed (dirty). Triggers a `store:dirty` event immediately and a 
  // `store:idle` event once there is no change within 2 seconds
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


  // Mark all as changed
  // ------------------------

  // Marks all local object as changed (dirty) to make them sync
  // with remote
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
      self._triggerDirtyAndIdleEvents();
    });
  };



  // changed objects
  // -----------------

  // returns an Array of all dirty documents
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


  // Is dirty?
  // ----------

  // When no arguments passed, returns `true` or `false` depending on if there are
  // dirty objects in the store.
  //
  // Otherwise it returns `true` or `false` for the passed object. An object is dirty
  // if it has no `_syncedAt` attribute or if `updatedAt` is more recent than `_syncedAt`
  LocalStore.prototype.isDirty = function(type, id) {
    if (!type) {
      return !$.isEmptyObject(this._dirty);
    }
    return this._hasLocalChanges(this.cache(type, id));
  };


  // Clear
  // ------

  // clears localStorage and cache
  // TODO: do not clear entire localStorage, clear only the items that have been stored
  //       using `hoodie.store` before.
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
      defer.reject(_error);
    }
    return defer.promise();
  };


  // Is persistant?
  // ----------------

  // returns `true` or `false` depending on whether localStorage is supported or not.
  // Beware that some browsers like Safari do not support localStorage in private mode.
  //
  // inspired by this cappuccino commit
  // https://github.com/cappuccino/cappuccino/commit/063b05d9643c35b303568a28809e4eb3224f71ec
  //
  LocalStore.prototype.isPersistent = function() {
    try {

      // we've to put this in here. I've seen Firefox throwing `Security error: 1000`
      // when cookies have been disabled
      if (!window.localStorage) {
        return false;
      }

      // Just because localStorage exists does not mean it works. In particular it might be disabled
      // as it is when Safari's private browsing mode is active.
      localStorage.setItem('Storage-Test', "1");

      // that should not happen ...
      if (localStorage.getItem('Storage-Test') !== "1") {
        return false;
      }

      // okay, let's clean up if we got here.
      localStorage.removeItem('Storage-Test');
    } catch (_error) {

      // in case of an error, like Safari's Private Pussy, return false
      return false;
    }

    // we're good.
    return true;
  };


  // trigger
  // ---------

  // proxies to hoodie.trigger
  LocalStore.prototype.trigger = function() {
    var eventName, parameters, _ref;
    eventName = arguments[0],
    parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];
    return (_ref = this.hoodie).trigger.apply(_ref, ["store:" + eventName].concat(Array.prototype.slice.call(parameters)));
  };


  // on
  // ---------

  // proxies to hoodie.on
  LocalStore.prototype.on = function(eventName, data) {
    eventName = eventName.replace(/(^| )([^ ]+)/g, "$1store:$2");
    return this.hoodie.on(eventName, data);
  };


  // unbind
  // ---------

  // proxies to hoodie.unbind
  LocalStore.prototype.unbind = function(eventName, callback) {
    eventName = 'store:' + eventName;
    return this.hoodie.unbind(eventName, callback);
  };


  // decorate promises
  // -------------------

  // extend promises returned by store.api
  LocalStore.prototype.decoratePromises = function(methods) {
    return $.extend(this._promiseApi, methods);
  };


  // isBootstrapping
  // -----------------

  // returns true if store is currently bootstrapping data from remote,
  // otherwise false.
  LocalStore.prototype._bootstrapping = false;
  LocalStore.prototype.isBootstrapping = function() {
    return this._bootstrapping;
  };


  // Private
  // ---------

  // bootstrapping dirty objects, to make sure 
  // that removed objects get pushed after 
  // page reload.
  LocalStore.prototype._bootstrapDirtyObjects = function() {
    var id, keys, obj, type, _i, _len, _ref;
    keys = this.db.getItem('_dirty');

    if (!keys) {
      return;
    }

    keys = keys.split(',');
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      _ref = keys[_i].split('/'),
      type = _ref[0],
      id = _ref[1];
      obj = this.cache(type, id);
    }
  };

  // subscribe to events coming from account & our remote store.  
  LocalStore.prototype._subscribeToOutsideEvents = function() {

    // account events
    this.hoodie.on('account:cleanup', this.clear);
    this.hoodie.on('account:signup', this.markAllAsChanged);
    this.hoodie.on('remote:bootstrap:start', this._startBootstrappingMode);
    this.hoodie.on('remote:bootstrap:end', this._endBootstrappingMode);

    // remote events
    this.hoodie.on('remote:change', this._handleRemoteChange);
  };


  // when a change come's from our remote store, we differentiate
  // whether an object has been removed or added / updated and
  // reflect the change in our local store.
  LocalStore.prototype._handleRemoteChange = function(typeOfChange, object) {
    if (typeOfChange === 'remove') {
      this.remove(object.type, object.id, {
        remote: true
      });
    } else {
      this.save(object.type, object.id, object, {
        remote: true
      });
    }
  };


  // more advanced localStorage wrappers to find/save objects
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


  // store IDs of dirty objects
  LocalStore.prototype._saveDirtyIds = function() {
    if ($.isEmptyObject(this._dirty)) {
      return this.db.removeItem('_dirty');
    } else {
      var ids = Object.keys(this._dirty);
      return this.db.setItem('_dirty', ids.join(','));
    }
  };

  // 
  LocalStore.prototype._now = function() {
    return JSON.stringify(new Date()).replace(/"/g, '');
  };

  // only lowercase letters, numbers and dashes are allowed for ids
  LocalStore.prototype._isValidId = function(key) {
    return new RegExp(/^[a-z0-9\-]+$/).test(key);
  };

  // just like ids, but must start with a letter or a $ (internal types)
  LocalStore.prototype._isValidType = function(key) {
    return new RegExp(/^[a-z$][a-z0-9]+$/).test(key);
  };

  // 
  LocalStore.prototype._isSemanticId = function(key) {
    return new RegExp(/^[a-z$][a-z0-9]+\/[a-z0-9]+$/).test(key);
  };

  // `_isDirty` returns true if there is a local change that
  // has not been sync'd yet.
  LocalStore.prototype._isDirty = function(object) {
    if (!object.updatedAt) {
      return false;
    }
    if (!object._syncedAt) {
      return true;
    }
    return object._syncedAt < object.updatedAt;
  };

  // 
  LocalStore.prototype._isMarkedAsDeleted = function(object) {
    return object._deleted === true;
  };

  // this is where all the store events get triggered,
  // like add:task, change:note:abc4567, remove, etc.
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

  // when an object gets changed, two special events get triggerd:
  // 
  // 1. dirty event  
  //    the `dirty` event gets triggered immediately, for every 
  //    change that happens.
  // 2. idle event
  //    the `idle` event gets triggered after a short timeout of
  //    no changes, e.g. 2 seconds.
  LocalStore.prototype._triggerDirtyAndIdleEvents = function() {
    var self = this;

    this.trigger('dirty');

    window.clearTimeout(this._dirtyTimeout);

    this._dirtyTimeout = window.setTimeout(function() {
      self.trigger('idle', self.changedObjects());
    }, this.idleTimeout);
  };

  // 
  LocalStore.prototype._decoratePromise = function(promise) {
    return $.extend(promise, this._promiseApi);
  };

  // 
  LocalStore.prototype._startBootstrappingMode = function() {
    this._bootstrapping = true;
    this.trigger('bootstrap:start');
  };

  // 
  LocalStore.prototype._endBootstrappingMode = function() {
    var methodCall, method, args, defer;

    this._bootstrapping = false;
    while(this._queue.length > 0) {
      methodCall = this._queue.shift();
      method = methodCall[0];
      args = methodCall[1];
      defer = methodCall[2];
      this[method].apply(this, args).then(defer.resolve, defer.reject);
    }

    this.trigger('bootstrap:end');
  };

  // 
  LocalStore.prototype._enqueue = function(method, args) {
    var defer = this.hoodie.defer();
    this._queue.push([method, args, defer]);
    return defer.promise();
  };


  return LocalStore;

})(Hoodie.Store);

