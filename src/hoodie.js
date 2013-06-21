// Hoodie
// --------
// 
// the door to world domination (apps)
// 

window.Hoodie = window.Hoodie || (function(_super) {

  'use strict';

  // ## Constructor

  // When initializing a hoodie instance, an optional URL
  // can be passed. That's the URL of a hoodie backend.
  // If no URL passed it defaults to the current domain
  // with an `api` subdomain.
  // 
  //     // init a new hoodie instance
  //     hoodie = new Hoodie
  // 
  function Hoodie(baseUrl) {
    this.baseUrl = baseUrl;
    this._handleCheckConnectionError = __bind(this._handleCheckConnectionError, this);
    this._handleCheckConnectionSuccess = __bind(this._handleCheckConnectionSuccess, this);
    this.rejectWith = __bind(this.rejectWith, this);
    this.resolveWith = __bind(this.resolveWith, this);
    this.reject = __bind(this.reject, this);
    this.resolve = __bind(this.resolve, this);
    this.checkConnection = __bind(this.checkConnection, this);

    // remove trailing slash(es)
    this.baseUrl = this.baseUrl ? this.baseUrl.replace(/\/+$/, '') : "/_api";

    // init core modules 
    this.store = new this.constructor.LocalStore(this);
    this.config = new this.constructor.Config(this);
    this.account = new this.constructor.Account(this);
    this.remote = new this.constructor.AccountRemote(this);

    // init extensions
    this._loadExtensions();

    // check connection
    this.checkConnection();
  }

  __extends(Hoodie, _super);

  // ## Settings

  // `online` (read-only)
  Hoodie.prototype.online = true;

  // `checkConnectionInterval` (read-only)
  Hoodie.prototype.checkConnectionInterval = 30000;

  // ## Requests

  // use this method to send requests to the hoodie backend.
  // 
  //     promise = hoodie.request('GET', '/user_database/doc_id')
  // 
  Hoodie.prototype.request = function(type, url, options) {
    var defaults;
    options = options || {};

    // if a relative path passed, prefix with @baseUrl
    if (!/^http/.test(url)) {
      url = "" + this.baseUrl + url;
    }

    defaults = {
      type: type,
      url: url,
      xhrFields: {
        withCredentials: true
      },
      crossDomain: true,
      dataType: 'json'
    };

    return $.ajax($.extend(defaults, options));

  };

  // ## Check Connection

  // the `checkConnection` method is used, well, to check if
  // the hoodie backend is reachable at `baseUrl` or not. 
  // Check Connection is automatically called on startup
  // and then each 30 seconds. If it fails, it 
  // 
  // - sets `hoodie.online = false`
  // - triggers `offline` event
  // - sets `checkConnectionInterval = 3000`
  // 
  // when connection can be reestablished, it
  // 
  // - sets `hoodie.online = true`
  // - triggers `online` event
  // - sets `checkConnectionInterval = 30000`
  // 
  Hoodie.prototype._checkConnectionRequest = null;
  Hoodie.prototype.checkConnection = function() {
    var _ref;

    if (((_ref = this._checkConnectionRequest) !== null ? typeof _ref.state === "function" ? _ref.state() : null : null) === 'pending') {
      return this._checkConnectionRequest;
    }
    this._checkConnectionRequest = this.request('GET', '/').pipe(this._handleCheckConnectionSuccess, this._handleCheckConnectionError);
    return this._checkConnectionRequest;
  };

  // ## Open stores

  // generic method to open a store. Used by
  // 
  // * hoodie.remote
  // * hoodie.user("joe")
  // * hoodie.global
  // * ... and more
  // 
  //     hoodie.open("some_store_name").findAll()
  // 
  Hoodie.prototype.open = function(storeName, options) {
    options = options || {};
    $.extend(options, {
      name: storeName
    });
    return new Hoodie.Remote(this, options);
  };

  // ## uuid

  // helper to generate unique ids.
  Hoodie.prototype.uuid = function(len) {
    var chars, i, radix;

    // default uuid length to 7
    if (len === undefined) {
      len = 7;
    }

    // uuids consist of numbers and lowercase letters only.
    // We stick to lowercase letters to prevent confusion
    // and to prevent issues with CouchDB, e.g. database 
    // names do wonly allow for lowercase letters.
    chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
    radix = chars.length;

    // eehmm, yeah.
    return ((function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        var rand = Math.random() * radix;
        _results.push(chars[0] = String(rand).charAt(0));
      }
      return _results;
    })()).join('');
  };

  // ## Defers / Promises

  // returns a defer object for custom promise handlings.
  // Promises are heavely used throughout the code of hoodie.
  // We currently borrow jQuery's implementation:
  // http://api.jquery.com/category/deferred-object/
  // 
  //     defer = hoodie.defer()
  //     if (good) {
  //       defer.resolve('good.')
  //     } else {
  //       defer.reject('not good.')
  //     }
  //     return defer.promise()
  // 
  Hoodie.prototype.defer = $.Deferred;

  // 
  Hoodie.prototype.isPromise = function(obj) {
    return typeof (obj !== undefined ? obj.done : null) === 'function' && typeof obj.resolve === 'undefined';
  };

  // 
  Hoodie.prototype.resolve = function() {
    return this.defer().resolve().promise();
  };

  // 
  Hoodie.prototype.reject = function() {
    return this.defer().reject().promise();
  };

  // 
  Hoodie.prototype.resolveWith = function() {
    var _ref;
    return (_ref = this.defer()).resolve.apply(_ref, arguments).promise();
  };

  // 
  Hoodie.prototype.rejectWith = function() {
    var _ref;
    return (_ref = this.defer()).reject.apply(_ref, arguments).promise();
  };


  // dispose
  // ---------

  // if a hoodie instance is not needed anymore, it can
  // be disposed using this method. A `dispose` event
  // gets triggered that the modules react on.
  Hoodie.prototype.dispose = function() {
    return this.trigger('dispose');
  };


  // ## Extending hoodie

  // You can either extend the Hoodie class, or a hoodie
  // instance dooring runtime
  // 
  //     Hoodie.extend('magic1', funcion(hoodie) { /* ... */ })
  //     hoodie = new Hoodie
  //     hoodie.extend('magic2', function(hoodie) { /* ... */ })
  //     hoodie.magic1.doSomething()
  //     hoodie.magic2.doSomethingElse()
  Hoodie.extend = function(name, Module) {
    this._extensions = this._extensions || {};
    this._extensions[name] = Module;

    return this._extensions[name];
  };
  Hoodie.prototype.extend = function(name, Module) {
    this[name] = new Module(this);
    return this[name];
  };


  // ## Private

  // 
  Hoodie.prototype._loadExtensions = function() {
    var Module, instanceName, _ref, _results;
    _ref = this.constructor._extensions;
    _results = [];

    for (instanceName in _ref) {
      if (_ref.hasOwnProperty(instanceName)) {
        Module = _ref[instanceName];
        _results.push(this[instanceName] = new Module(this));
      }

    }
    return _results;
  };

  // 
  Hoodie.prototype._handleCheckConnectionSuccess = function() {
    this.checkConnectionInterval = 30000;

    window.setTimeout(this.checkConnection, this.checkConnectionInterval);

    if (!this.online) {
      this.trigger('reconnected');
      this.online = true;
    }

    return this.defer().resolve();
  };

  // 
  Hoodie.prototype._handleCheckConnectionError = function() {
    this.checkConnectionInterval = 3000;

    window.setTimeout(this.checkConnection, this.checkConnectionInterval);

    if (this.online) {
      this.trigger('disconnected');
      this.online = false;
    }

    return this.defer().reject();
  };

  return Hoodie;

})(window.Events);
