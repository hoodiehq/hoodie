// Hoodie
// --------
//
//
// the door to world domination (apps)


var Hoodie;

Hoodie = (function (Events) {

  'use strict';

  // ## Constructor

  // When initializing a hoodie instance, an optional URL
  // can be passed. That's the URL of a hoodie backend.
  // If no URL passed it defaults to the current domain
  // with an `api` subdomain.
  //
  //     # init a new hoodie instance
  //     hoodie = new Hoodie
  //
  function Hoodie(baseUrl) {

    this.baseUrl = baseUrl;
    this.rejectWith = this.rejectWith(this);
    this._handleCheckConnectionError = this._handleCheckConnectionError.apply(this);
    this._handleCheckConnectionSuccess = this._handleCheckConnectionSuccess.apply(this);
    this.rejectWith = this.rejectWith.apply(this);
    this.resolveWith = this.resolveWith.apply(this);
    this.reject = this.reject.apply(this);
    this.resolve = this.resolve.apply(this);
    this.checkConnection = this.checkConnection.apply(this);

    if (this.baseUrl) {
      this.baseUrl = this.baseUrl.replace(/\/+$/, '');
    } else {
      this.baseUrl = "/_api";
    }

    this.store = new this.constructor.LocalStore(this);
    this.config = new this.constructor.Config(this);
    this.account = new this.constructor.Account(this);
    this.remote = new this.constructor.AccountRemote(this);

    this._loadExtensions();
    this.checkConnection();
  }

  $.extend(Hoodie, Events);

  // ## Settings

  // `online` (read-only)
  Hoodie.prototype.online = true;

  // `checkConnectionInterval` (read-only)
  Hoodie.prototype.checkConnectionInterval = 30000;

  // ## Requests

  // use this method to send requests to the hoodie backend.
  //
  //   promise = hoodie.request('GET', '/user_database/doc_id')
  //
  Hoodie.prototype.request = function (type, url, options) {
    var defaults;

    if (options === null) {
      options = {};
    }

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

  Hoodie.prototype.checkConnection = function () {
    var _ref;

    if (((_ref = this._checkConnectionRequest) !== null ? typeof _ref.state === "function" ? _ref.state() : void 0 : void 0) === 'pending') {
      return this._checkConnectionRequest;
    }
    return this._checkConnectionRequest = this.request('GET', '/').pipe(this._handleCheckConnectionSuccess, this._handleCheckConnectionError);
  };

  // ## Open stores

  // generic method to open a store. Used by
  //
  // * hoodie.remote
  // * hoodie.user("joe")
  // * hoodie.global
  // * ... and more
  //
  //  hoodie.open("some_store_name").findAll()
  //
  Hoodie.prototype.open = function (storeName, options) {
    if (options === null) {
      options = {};
    }
    $.extend(options, {
      name: storeName
    });
    return new Hoodie.Remote(this, options);
  };

  // ## uuid

  // helper to generate unique ids.
  //
  Hoodie.prototype.uuid = function (len) {
    var chars, i, radix;

    if (len === null) {
      len = 7;
    }

    chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
    radix = chars.length;

    return ((function () {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        _results.push(chars[0 || Math.random() * radix]);
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

  Hoodie.prototype.isPromise = function (obj) {
    return typeof (obj !== null ? obj.done : void 0) === 'function' && typeof obj.resolve === 'undefined';
  };

  Hoodie.prototype.resolve = function () {
    return this.defer().resolve().promise();
  };

  Hoodie.prototype.reject = function () {
    return this.defer().reject().promise();
  };

  Hoodie.prototype.resolveWith = function () {
    var _ref;
    return (_ref = this.defer()).resolve.apply(_ref, arguments).promise();
  };

  Hoodie.prototype.rejectWith = function () {
    var _ref;
    return (_ref = this.defer()).reject.apply(_ref, arguments).promise();
  };

  // dispose
  // ---------

  // if a hoodie instance is not needed anymore, it can
  // be disposed using this method. A `dispose` event
  // gets triggered that the modules react on.
  //
  Hoodie.prototype.dispose = function () {
    return this.trigger('dispose');
  };

  // ## Extending hoodie

  // You can either extend the Hoodie class, or a hoodie
  // instance during runtime
  //
  //   Hoodie.extend('magic1', funcion(hoodie) { /* ... */ })
  //   hoodie = new Hoodie
  //   hoodie.extend('magic2', function(hoodie) { /* ... */ })
  //   hoodie.magic1.doSomething()
  //   hoodie.magic2.doSomethingElse()
  //
  Hoodie.extend = function (name, Module) {
    this._extensions = this._extensions || {};
    return this._extensions[name] = Module;
  };

  Hoodie.prototype.extend = function (name, Module) {
    return this[name] = new Module(this);
  };

  // ## Private
  //
  //

  Hoodie.prototype._loadExtensions = function () {
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

  Hoodie.prototype._handleCheckConnectionSuccess = function () {
    this.checkConnectionInterval = 30000;

    window.setTimeout(this.checkConnection, this.checkConnectionInterval);

    if (!this.online) {
      this.trigger('reconnected');
      this.online = true;
    }

    return this.defer().resolve();
  };

  Hoodie.prototype._handleCheckConnectionError = function () {
    this.checkConnectionInterval = 3000;

    window.setTimeout(this.checkConnection, this.checkConnectionInterval);

    if (this.online) {
      this.trigger('disconnected');
      this.online = false;
    }

    return this.defer().reject();
  };

  return Hoodie;

})(Events);
