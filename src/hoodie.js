// Hoodie
// --------
//
// the door to world domination (apps)
//

window.Hoodie = window.Hoodie || (function(_super) {

  'use strict';

  // Constructor
  // -------------

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

    this._handleCheckConnectionError = this._handleCheckConnectionError.bind(this);
    this._handleCheckConnectionSuccess = this._handleCheckConnectionSuccess.bind(this);
    this._pipeRequestError = this._pipeRequestError.bind(this);
    this.rejectWith = this.rejectWith.bind(this);
    this.resolveWith = this.resolveWith.bind(this);
    this.reject = this.reject.bind(this);
    this.resolve = this.resolve.bind(this);
    this.checkConnection = this.checkConnection.bind(this);

    // remove trailing slash(es)
    this.baseUrl = this.baseUrl ? this.baseUrl.replace(/\/+$/, '') : "/_api";

    // init core modules
    this.store = new this.constructor.LocalStore(this);
    this.config = new this.constructor.Config(this);
    this.account = new this.constructor.Account(this);
    this.remote = new this.constructor.AccountRemote(this);

    this._loadExtensions();
    this.checkConnection();
  }

  Object.deepExtend(Hoodie, _super);

  // Settings
  // ----------

  // `online` (read-only)
  Hoodie.prototype.online = true;

  // `checkConnectionInterval` (read-only)
  Hoodie.prototype.checkConnectionInterval = 30000;

  // Requests
  // ----------

  // use this method to send requests to the hoodie backend.
  //
  //     promise = hoodie.request('GET', '/user_database/doc_id')
  //
  Hoodie.prototype.request = function(type, url, options) {
    options = options || {};

    // if a relative path passed, prefix with @baseUrl
    if (!/^http/.test(url)) {
      url = "" + this.baseUrl + url;
    }

    var defaults = {
      type: type,
      url: url,
      xhrFields: {
        withCredentials: true
      },
      crossDomain: true,
      dataType: 'json'
    };

    return $.ajax($.extend(defaults, options)).then( null, this._pipeRequestError );
  };


  // Check Connection
  // ------------------

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

    var req = this._checkConnectionRequest;

    if (req && req.state() === 'pending') {
      return req;
    }

    this._checkConnectionRequest = this.request('GET', '/').pipe(
      this._handleCheckConnectionSuccess,
      this._handleCheckConnectionError
    );

    return this._checkConnectionRequest;
  };


  // Open stores
  // -------------

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


  // uuid
  // ------

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
      var _i, _results = [];

      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        var rand = Math.random() * radix;
        _results.push(chars[0] = String(rand).charAt(0));
      }

      return _results;
    })()).join('');
  };


  // Defers / Promises
  // -------------------

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


  // returns true if passed object is a promise (but not a deferred),
  // otherwise false.
  Hoodie.prototype.isPromise = function(object) {
    return !! (object &&
               typeof object.done === 'function' &&
               typeof object.resolve !== 'function');
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
    var defer = this.defer();
    return defer.resolve.apply(defer, arguments).promise();
  };

  //
  Hoodie.prototype.rejectWith = function() {
    var defer = this.defer();
    return defer.reject.apply(defer, arguments).promise();
  };


  // dispose
  // ---------

  // if a hoodie instance is not needed anymore, it can
  // be disposed using this method. A `dispose` event
  // gets triggered that the modules react on.
  Hoodie.prototype.dispose = function() {
    this.trigger('dispose');
  };


  // Extending hoodie
  // ------------------

  // You can either extend the Hoodie class, or a hoodie
  // instance dooring runtime
  //
  //     Hoodie.extend('magic1', funcion(hoodie) { /* ... */ })
  //     hoodie = new Hoodie
  //     hoodie.extend('magic2', function(hoodie) { /* ... */ })
  //     hoodie.magic1.doSomething()
  //     hoodie.magic2.doSomethingElse()
  //
  Hoodie.extend = function(name, Module) {
    this._extensions = this._extensions || {};
    this._extensions[name] = Module;
  };
  Hoodie.prototype.extend = function(name, Module) {
    this[name] = new Module(this);
  };


  // ## Private

  //
  Hoodie.prototype._loadExtensions = function() {
    var Module, instanceName, extensions;

    extensions = this.constructor._extensions;

    for (instanceName in extensions) {
      if (extensions.hasOwnProperty(instanceName)) {
        Module = extensions[instanceName];
        this[instanceName] = new Module(this);
      }
    }

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

  Hoodie.prototype._pipeRequestError = function(xhr) {
    var error;

    try {
      error = JSON.parse(xhr.responseText);
    } catch (_error) {
      error = {
        error: xhr.responseText || ("Cannot connect to backend at " + this.baseUrl)
      };
    }

    return this.rejectWith(error).promise();
  };

  return Hoodie;

})(window.Events);

// expose Hoodie to module loaders. Based on jQuery's implementation.
if ( typeof module === "object" && module && typeof module.exports === "object" ) {

  // Expose Hoodie as module.exports in loaders that implement the Node
  // module pattern (including browserify). Do not create the global, since
  // the user will be storing it themselves locally, and globals are frowned
  // upon in the Node module world.
  module.exports = Hoodie;
} else {

  // Register as a named AMD module, since Hoodie can be concatenated with other
  // files that may use define, but not via a proper concatenation script that
  // understands anonymous AMD modules. A named AMD is safest and most robust
  // way to register. Lowercase hoodie is used because AMD module names are
  // derived from file names, and Hoodie is normally delivered in a lowercase
  // file name. 
  if ( typeof define === "function" && define.amd ) {
    define( "hoodie", [], function () {
      'use strict';
      return Hoodie;
    } );
  }
}
