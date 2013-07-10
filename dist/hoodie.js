//  hoodie 0.2.2
'use strict';

Object.deepExtend = function(child, parent) {
  for (var key in parent) {
    if (parent.hasOwnProperty(key)) {
      child[key] = parent[key];
    }
  }
  function Ctor() {
    this.constructor = child;
  }
  Ctor.prototype = parent.prototype;
  child.prototype = new Ctor();
  child.__super__ = parent.prototype;

  return child;
};

//
// Events
// ------
//
// extend any Class with support for
//
// * `object.bind('event', cb)`
// * `object.unbind('event', cb)`
// * `object.trigger('event', args...)`
// * `object.one('ev', cb)`
//
// based on [Events implementations from Spine](https://github.com/maccman/spine/blob/master/src/spine.coffee#L1)
//

window.Events = window.Events || (function() {

  'use strict';

  function Events() {}

  // ## Bind
  //
  // bind a callback to an event triggerd by the object
  //
  //     object.bind 'cheat', blame
  //
  Events.prototype.bind = function(ev, callback) {
    var calls, evs, name, _i, _len, _results = [];

    evs = ev.split(' ');
    calls = this.hasOwnProperty('_callbacks') && this._callbacks || (this._callbacks = {});

    for (_i = 0, _len = evs.length; _i < _len; _i++) {
      name = evs[_i];
      calls[name] = calls[name] || [];
      _results.push(calls[name].push(callback));
    }
    return _results;
  };

  // alias
  Events.prototype.on = Events.prototype.bind;

  // ## one
  //
  // same as `bind`, but does get executed only once
  //
  //     object.one 'groundTouch', gameOver
  //
  Events.prototype.one = function(ev, callback) {
    this.bind(ev, function() {
      this.unbind(ev, callback);
      callback.apply(this, arguments);
    });
  };

  // ## trigger
  //
  // trigger an event and pass optional parameters for binding.
  //     object.trigger 'win', score: 1230
  //
  Events.prototype.trigger = function() {
    var args, callback, ev, list, _i, _len, _ref;

    args = 1 <= arguments.length ? Array.prototype.slice.call(arguments, 0) : [];
    ev = args.shift();
    list = this.hasOwnProperty('_callbacks') && ((_ref = this._callbacks) !== null ? _ref[ev] : null);

    if (!list) {
      return;
    }

    for (_i = 0, _len = list.length; _i < _len; _i++) {
      callback = list[_i];
      callback.apply(this, args);
    }

    return true;
  };

  // ## unbind
  //
  // unbind to from all bindings, from all bindings of a specific event
  // or from a specific binding.
  //
  //     object.unbind()
  //     object.unbind 'move'
  //     object.unbind 'move', follow
  //
  Events.prototype.unbind = function(ev, callback) {
    var cb, i, list, _i, _len, _ref;

    if (!ev) {
      this._callbacks = {};
      return this;
    }

    list = (_ref = this._callbacks) !== null ? _ref[ev] : null;

    if (!list) {
      return this;
    }

    if (!callback) {
      delete this._callbacks[ev];
      return this;
    }

    for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
      cb = list[i];

      if (cb !== callback) {
        continue;
      }

      list = list.slice();
      list.splice(i, 1);
      this._callbacks[ev] = list;
      break;
    }

    return this;
  };

  return Events;

})();

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
    var defaults, requestPromise, pipedPromise;

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

    // we are piping the result of the request to return a nicer
    // error if the request cannot reach the server at all.
    // We can't return the promise of $.ajax directly because of
    // the piping, as for whatever reason the returned promise 
    // does not have the `abort` method any more, maybe others
    // as well. See also http://bugs.jquery.com/ticket/14104
    requestPromise = $.ajax($.extend(defaults, options));
    pipedPromise = requestPromise.then( null, this._pipeRequestError);
    pipedPromise.abort = requestPromise.abort;

    return pipedPromise;
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
      this._handleCheckConnectionSuccess.bind(this),
      this._handleCheckConnectionError.bind(this)
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
        error: xhr.responseText || ("Cannot connect to Hoodie server at " + this.baseUrl)
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

// Hoodie.Account
// ================

// tell something smart in here.
//
Hoodie.Account = (function () {

  'use strict';

  function Account(hoodie) {
    this.hoodie = hoodie;

    this._handleChangeUsernameAndPasswordRequest = this._handleChangeUsernameAndPasswordRequest;
    this._sendChangeUsernameAndPasswordRequest = this._sendChangeUsernameAndPasswordRequest;
    this._cleanupAndTriggerSignOut = this._cleanupAndTriggerSignOut.bind(this);
    this._cleanup = this._cleanup.bind(this);
    this._handleFetchBeforeDestroyError = this._handleFetchBeforeDestroyError.bind(this);
    this._handleFetchBeforeDestroySucces = this._handleFetchBeforeDestroySucces.bind(this);
    this._handlePasswordResetStatusRequestError = this._handlePasswordResetStatusRequestError.bind(this);
    this._handlePasswordResetStatusRequestSuccess = this._handlePasswordResetStatusRequestSuccess.bind(this);
    this._checkPasswordResetStatus = this._checkPasswordResetStatus.bind(this);
    this._handleSignInSuccess = this._handleSignInSuccess.bind(this);
    this._delayedSignIn = this._delayedSignIn.bind(this);
    this._handleSignUpSucces = this._handleSignUpSucces.bind(this);
    this._handleRequestError = this._handleRequestError.bind(this);
    this._handleAuthenticateRequestSuccess = this._handleAuthenticateRequestSuccess.bind(this);

    this.fetch = this.fetch.bind(this);
    this.signOut = this.signOut.bind(this);
    this.authenticate = this.authenticate.bind(this);

    // cache for CouchDB _users doc
    this._doc = {};

    // map of requestPromises. We maintain this list to avoid sending
    // the same requests several times.
    this._requests = {};

    // init account
    this.init();
  }

  // Properties
  // ------------

  // 
  Account.prototype.username = undefined;

  // init
  // ------

  // we've put this into its own method so it's easier to
  // inherit from Hoodie.Account and add custom logic
  Account.prototype.init = function() {
    // handle session
    this.username = this.hoodie.config.get('_account.username');
    this.ownerHash = this.hoodie.config.get('_account.ownerHash');

    // he ownerHash gets stored in every object created by the user.
    // Make sure we have one.
    if (!this.ownerHash) {
      this._setOwner(this.hoodie.uuid());
    }

    // authenticate on next tick
    window.setTimeout(this.authenticate);

    // is there a pending password reset?
    this._checkPasswordResetStatus();
  };


  // Authenticate
  // --------------

  // Use this method to assure that the user is authenticated:
  // `hoodie.account.authenticate().done( doSomething ).fail( handleError )`
  //
  Account.prototype.authenticate = function() {
    var sendAndHandleAuthRequest, _ref, _ref1, self = this;

    if (this._authenticated === false) {
      return this.hoodie.defer().reject().promise();
    }

    if (this._authenticated === true) {
      return this.hoodie.defer().resolve(this.username).promise();
    }

    // if there is a pending signOut request, return its promise,
    // but pipe it so that it always ends up rejected
    //
    if (((_ref = this._requests.signOut) !== undefined ? _ref.state() : null) === 'pending') {
      return this._requests.signOut.then(this.hoodie.rejectWith);
    }

    // if there is apending signIn request, return its promise
    if (((_ref1 = this._requests.signIn) !== undefined ? _ref1.state() : null) === 'pending') {
      return this._requests.signIn;
    }

    // if username is not set, make sure to end the session
    if (this.username === undefined) {
      return this._sendSignOutRequest().then(function() {
        self._authenticated = false;
        return self.hoodie.rejectWith();
      });
    }

    // send request to check for session status. If there is a
    // pending request already, return its promise.
    //
    sendAndHandleAuthRequest = function() {
      return self.request('GET', "/_session").pipe(
        self._handleAuthenticateRequestSuccess,
        self._handleRequestError
      );
    };

    return this._withSingleRequest('authenticate', sendAndHandleAuthRequest);
  };


  // sign up with username & password
  // ----------------------------------

  // uses standard CouchDB API to create a new document in _users db.
  // The backend will automatically create a userDB based on the username
  // address and approve the account by adding a "confirmed" role to the
  // user doc. The account confirmation might take a while, so we keep trying
  // to sign in with a 300ms timeout.
  //
  Account.prototype.signUp = function(username, password) {
    if (password === undefined) {
      password = '';
    }

    if (!username) {
      return this.hoodie.defer().reject({
        error: 'username must be set'
      }).promise();
    }

    if (this.hasAnonymousAccount()) {
      return this._upgradeAnonymousAccount(username, password);
    }

    if (this.hasAccount()) {
      return this.hoodie.defer().reject({
        error: 'you have to sign out first'
      }).promise();
    }

    // downcase username
    username = username.toLowerCase();

    var options = {
      data: JSON.stringify({
        _id: this._key(username),
        name: this._userKey(username),
        type: 'user',
        roles: [],
        password: password,
        ownerHash: this.ownerHash,
        database: this.db(),
        updatedAt: this._now(),
        createdAt: this._now(),
        signedUpAt: username !== this.ownerHash ? this._now() : void 0
      }),
      contentType: 'application/json'
    };

    return this.request('PUT', this._url(username), options).pipe(
      this._handleSignUpSucces(username, password),
      this._handleRequestError
    );
  };


  // anonymous sign up
  // -------------------

  // If the user did not sign up himself yet, but data needs to be transfered
  // to the couch, e.g. to send an email or to share data, the anonymousSignUp
  // method can be used. It generates a random password and stores it locally
  // in the browser.
  //
  // If the user signes up for real later, we "upgrade" his account, meaning we
  // change his username and password internally instead of creating another user.
  //
  Account.prototype.anonymousSignUp = function() {
    var password, username, self = this;

    password = this.hoodie.uuid(10);
    username = this.ownerHash;

    return this.signUp(username, password).done(function() {
      self.setAnonymousPassword(password);
      return self.trigger('signup:anonymous', username);
    });
  };


  // hasAccount
  // ---------------------

  // 
  Account.prototype.hasAccount = function() {
    return !!this.username;
  };


  // hasAnonymousAccount
  // ---------------------

  // 
  Account.prototype.hasAnonymousAccount = function() {
    return this.getAnonymousPassword() !== undefined;
  };


  // set / get / remove anonymous password
  // ---------------------------------------

  //
  Account.prototype._anonymousPasswordKey = '_account.anonymousPassword';

  Account.prototype.setAnonymousPassword = function(password) {
    return this.hoodie.config.set(this._anonymousPasswordKey, password);
  };

  Account.prototype.getAnonymousPassword = function() {
    return this.hoodie.config.get(this._anonymousPasswordKey);
  };

  Account.prototype.removeAnonymousPassword = function() {
    return this.hoodie.config.remove(this._anonymousPasswordKey);
  };


  // sign in with username & password
  // ----------------------------------

  // uses standard CouchDB API to create a new user session (POST /_session).
  // Besides the standard sign in we also check if the account has been confirmed
  // (roles include "confirmed" role).
  //
  // NOTE: When signing in, all local data gets cleared beforehand (with a signOut).
  //       Otherwise data that has been created beforehand (authenticated with
  //       another user account or anonymously) would be merged into the user
  //       account that signs in. That applies only if username isn't the same as
  //       current username.
  //
  Account.prototype.signIn = function(username, password) {
    var self = this;

    if (username === null) {
      username = '';
    }

    if (password === undefined) {
      password = '';
    }

    // downcase
    username = username.toLowerCase();

    if (this.username !== username) {
      return this.signOut({
        silent: true
      }).pipe(function() {
        return self._sendSignInRequest(username, password);
      });
    } else {
      return this._sendSignInRequest(username, password, {
        reauthenticated: true
      });
    }
  };


  // sign out
  // ---------

  // uses standard CouchDB API to invalidate a user session (DELETE /_session)
  //
  Account.prototype.signOut = function(options) {
    var self = this;

    options = options || {};

    if (!this.hasAccount()) {
      return this._cleanup().then(function() {
        if (!options.silent) {
          return self.trigger('signout');
        }
      });
    }
    this.hoodie.remote.disconnect();
    return this._sendSignOutRequest().pipe(this._cleanupAndTriggerSignOut);
  };


  // On
  // ---

  // shortcut for `hoodie.on`
  //
  Account.prototype.on = function(eventName, cb) {
    eventName = eventName.replace(/(^| )([^ ]+)/g, "$1account:$2");
    return this.hoodie.on(eventName, cb);
  };


  // Trigger
  // ---

  // shortcut for `hoodie.trigger`
  //
  Account.prototype.trigger = function() {
    var eventName, parameters;

    eventName = arguments[0],
    parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];

    this.hoodie.trigger.apply(this.hoodie, ["account:" + eventName].concat(Array.prototype.slice.call(parameters)));
  };


  // Request
  // ---

  // shortcut for `hoodie.request`
  //
  Account.prototype.request = function(type, path, options) {
    options = options || {};
    return this.hoodie.request.apply(this.hoodie, arguments);
  };


  // db
  // ----

  // return name of db
  //
  Account.prototype.db = function() {
    return "user/" + this.ownerHash;
  };


  // fetch
  // -------

  // fetches _users doc from CouchDB and caches it in _doc
  //
  Account.prototype.fetch = function(username) {
    var self = this;

    if (username === undefined) {
      username = this.username;
    }

    if (!username) {
      return this.hoodie.defer().reject({
        error: "unauthenticated",
        reason: "not logged in"
      }).promise();
    }

    return this._withSingleRequest('fetch', function() {
      return self.request('GET', self._url(username)).pipe(
        null,
        self._handleRequestError
      ).done(function(response) {
        self._doc = response;
        return self._doc;
      });
    });

  };


  // change password
  // -----------------

  // Note: the hoodie API requires the currentPassword for security reasons,
  // but couchDb doesn't require it for a password change, so it's ignored
  // in this implementation of the hoodie API.
  //
  Account.prototype.changePassword = function(currentPassword, newPassword) {

    if (!this.username) {
      return this.hoodie.defer().reject({
        error: "unauthenticated",
        reason: "not logged in"
      }).promise();
    }

    this.hoodie.remote.disconnect();

    return this.fetch().pipe(
      this._sendChangeUsernameAndPasswordRequest(currentPassword, null, newPassword),
      this._handleRequestError
    );
  };


  // reset password
  // ----------------

  // This is kind of a hack. We need to create an object anonymously
  // that is not exposed to others. The only CouchDB API othering such
  // functionality is the _users database.
  //
  // So we actualy sign up a new couchDB user with some special attributes.
  // It will be picked up by the password reset worker and removeed
  // once the password was resetted.
  //
  Account.prototype.resetPassword = function(username) {
    var data, key, options, resetPasswordId, self = this;
    resetPasswordId = this.hoodie.config.get('_account.resetPasswordId');

    if (resetPasswordId) {
      return this._checkPasswordResetStatus();
    }

    resetPasswordId = "" + username + "/" + (this.hoodie.uuid());

    this.hoodie.config.set('_account.resetPasswordId', resetPasswordId);

    key = "" + this._prefix + ":$passwordReset/" + resetPasswordId;

    data = {
      _id: key,
      name: "$passwordReset/" + resetPasswordId,
      type: 'user',
      roles: [],
      password: resetPasswordId,
      createdAt: this._now(),
      updatedAt: this._now()
    };

    options = {
      data: JSON.stringify(data),
      contentType: "application/json"
    };

    return this._withPreviousRequestsAborted('resetPassword', function() {
      return self.request('PUT', "/_users/" + (encodeURIComponent(key)), options).pipe(
        null, self._handleRequestError
      ).done(self._checkPasswordResetStatus);
    });

  };


  // change username
  // -----------------

  // Note: the hoodie API requires the current password for security reasons,
  // but technically we cannot (yet) prevent the user to change the username
  // without knowing the current password, so it's not impulemented in the current
  // implementation of the hoodie API.
  //
  // But the current password is needed to login with the new username.
  //
  Account.prototype.changeUsername = function(currentPassword, newUsername) {
    newUsername = newUsername || '';
    return this._changeUsernameAndPassword(currentPassword, newUsername.toLowerCase());
  };


  // destroy
  // ---------

  // destroys a user's account
  //
  Account.prototype.destroy = function() {
    if (!this.hasAccount()) {
      return this._cleanupAndTriggerSignOut();
    }

    return this.fetch().pipe(
      this._handleFetchBeforeDestroySucces,
      this._handleFetchBeforeDestroyError
    ).pipe(this._cleanupAndTriggerSignOut);
  };


  // PRIVATE
  // ---------

  // default couchDB user doc prefix
  //
  Account.prototype._prefix = 'org.couchdb.user';

  // setters
  Account.prototype._setUsername = function(username) {
    if (username === this.username) {
      return;
    }

    this.username = username;

    return this.hoodie.config.set('_account.username', this.username);
  };

  Account.prototype._setOwner = function(ownerHash) {

    if (ownerHash === this.ownerHash) {
      return;
    }

    this.ownerHash = ownerHash;
    // `ownerHash` is stored with every new object in the createdBy
    // attribute. It does not get changed once it's set. That's why
    // we have to force it to be change for the `$config/hoodie` object.
    this.hoodie.config.set('createdBy', this.ownerHash);

    return this.hoodie.config.set('_account.ownerHash', this.ownerHash);
  };


  //
  // handle a successful authentication request.
  //
  // As long as there is no server error or internet connection issue,
  // the authenticate request (GET /_session) does always return
  // a 200 status. To differentiate whether the user is signed in or
  // not, we check `userCtx.name` in the response. If the user is not
  // signed in, it's null, otherwise the name the user signed in with
  //
  // If the user is not signed in, we difeerentiate between users that
  // signed in with a username / password or anonymously. For anonymous
  // users, the password is stored in local store, so we don't need
  // to trigger an 'unauthenticated' error, but instead try to sign in.
  //
  Account.prototype._handleAuthenticateRequestSuccess = function(response) {
    if (response.userCtx.name) {
      this._authenticated = true;
      this._setUsername(response.userCtx.name.replace(/^user(_anonymous)?\//, ''));
      this._setOwner(response.userCtx.roles[0]);
      return this.hoodie.defer().resolve(this.username).promise();
    }

    if (this.hasAnonymousAccount()) {
      this.signIn(this.username, this.getAnonymousPassword());
      return;
    }

    this._authenticated = false;
    this.trigger('error:unauthenticated');
    return this.hoodie.defer().reject().promise();
  };


  //
  // standard error handling for AJAX requests
  //
  // in some case we get the object error directly,
  // in others we get an xhr or even just a string back
  // when the couch died entirely. Whe have to handle
  // each case
  //
  Account.prototype._handleRequestError = function(error) {
    var e;

    error = error || {};

    if (error.reason) {
      return this.hoodie.defer().reject(error).promise();
    }

    var xhr = error;

    try {
      error = JSON.parse(xhr.responseText);
    } catch (_error) {
      e = _error;
      error = {
        error: xhr.responseText || "unknown"
      };
    }

    return this.hoodie.defer().reject(error).promise();
  };


  //
  // handle response of a successful signUp request.
  // Response looks like:
  //
  //     {
  //         "ok": true,
  //         "id": "org.couchdb.user:joe",
  //         "rev": "1-e8747d9ae9776706da92810b1baa4248"
  //     }
  //
  Account.prototype._handleSignUpSucces = function(username, password) {
    var self = this;

    return function(response) {
      self.trigger('signup', username);
      self._doc._rev = response.rev;
      return self._delayedSignIn(username, password);
    };
  };


  //
  // a delayed sign in is used after sign up and after a
  // username change.
  //
  Account.prototype._delayedSignIn = function(username, password, options, defer) {
    var self = this;

    // _delayedSignIn might call itself, when the user account
    // is pending. In this case it passes the original defer,
    // to keep a reference and finally resolve / reject it 
    // at some point
    if (!defer) {
      defer = this.hoodie.defer();
    }

    window.setTimeout(function() {
      var promise = self._sendSignInRequest(username, password);
      promise.done(defer.resolve);
      promise.fail(function(error) {
        if (error.error === 'unconfirmed') {

          // It might take a bit until the account has been confirmed
          self._delayedSignIn(username, password, options, defer);
        } else {
          defer.reject.apply(defer, arguments);
        }
      });

    }, 300);

    return defer.promise();
  };


  //
  // parse a successful sign in response from couchDB.
  // Response looks like:
  //
  //     {
  //         "ok": true,
  //         "name": "test1",
  //         "roles": [
  //             "mvu85hy",
  //             "confirmed"
  //         ]
  //     }
  //
  // we want to turn it into "test1", "mvu85hy" or reject the promise
  // in case an error occured ("roles" array contains "error")
  //
  Account.prototype._handleSignInSuccess = function(options) {
    var self = this;
    options = options || {};

    return function(response) {
      var defer, username;

      defer = self.hoodie.defer();
      username = response.name.replace(/^user(_anonymous)?\//, '');

      //
      // if an error occured, the userDB worker stores it to the $error attribute
      // and adds the "error" role to the users doc object. If the user has the
      // "error" role, we need to fetch his _users doc to find out what the error
      // is, before we can reject the promise.
      //
      if (response.roles.indexOf("error") !== -1) {
        self.fetch(username).fail(defer.reject).done(function() {
          return defer.reject({
            error: "error",
            reason: self._doc.$error
          });
        });
        return defer.promise();
      }

      //
      // When the userDB worker created the database for the user and everthing
      // worked out, it adds the role "confirmed" to the user. If the role is
      // not present yet, it might be that the worker didn't pick up the the
      // user doc yet, or there was an error. In this cases, we reject the promise
      // with an "uncofirmed error"
      //
      if (response.roles.indexOf("confirmed") === -1) {
        return defer.reject({
          error: "unconfirmed",
          reason: "account has not been confirmed yet"
        });
      }

      self._setUsername(username);
      self._setOwner(response.roles[0]);
      self._authenticated = true;

      //
      // options.verbose is true, when a user manually signed via hoodie.account.signIn().
      // We need to differentiate to other signIn requests, for example right after
      // the signup or after a session timed out.
      //
      if (!(options.silent || options.reauthenticated)) {
        if (self.hasAnonymousAccount()) {
          self.trigger('signin:anonymous', username);
        } else {
          self.trigger('signin', username);
        }
      }

      // user reauthenticated, meaning
      if (options.reauthenticated) {
        self.trigger('reauthenticated', username);
      }

      self.fetch();
      return defer.resolve(self.username, response.roles[0]);
    };
  };


  //
  // check for the status of a password reset. It might take
  // a while until the password reset worker picks up the job
  // and updates it
  //
  // If a password reset request was successful, the $passwordRequest
  // doc gets removed from _users by the worker, therefore a 401 is
  // what we are waiting for.
  //
  // Once called, it continues to request the status update with a
  // one second timeout.
  //
  Account.prototype._checkPasswordResetStatus = function() {
    var hash, options, resetPasswordId, url, username, self = this;

    // reject if there is no pending password reset request
    resetPasswordId = this.hoodie.config.get('_account.resetPasswordId');

    if (!resetPasswordId) {
      return this.hoodie.defer().reject({
        error: "missing"
      }).promise();
    }

    // send request to check status of password reset
    username = "$passwordReset/" + resetPasswordId;
    url = "/_users/" + (encodeURIComponent("" + this._prefix + ":" + username));
    hash = btoa("" + username + ":" + resetPasswordId);

    options = {
      headers: {
        Authorization: "Basic " + hash
      }
    };

    return this._withPreviousRequestsAborted('passwordResetStatus', function() {
      return self.request('GET', url, options).pipe(
        self._handlePasswordResetStatusRequestSuccess,
        self._handlePasswordResetStatusRequestError
      ).fail(function(error) {
        if (error.error === 'pending') {
          window.setTimeout(self._checkPasswordResetStatus, 1000);
          return;
        }
        return self.trigger('password_reset:error');
      });
    });
  };


  //
  // If the request was successful there might have occured an
  // error, which the worker stored in the special $error attribute.
  // If that happens, we return a rejected promise with the $error,
  // error. Otherwise reject the promise with a 'pending' error,
  // as we are not waiting for a success full response, but a 401
  // error, indicating that our password was changed and our
  // current session has been invalidated
  //
  Account.prototype._handlePasswordResetStatusRequestSuccess = function(response) {
    var defer = this.hoodie.defer();

    if (response.$error) {
      defer.reject(response.$error);
    } else {
      defer.reject({
        error: 'pending'
      });
    }
    return defer.promise();
  };


  //
  // If the error is a 401, it's exactly what we've been waiting for.
  // In this case we resolve the promise.
  //
  Account.prototype._handlePasswordResetStatusRequestError = function(xhr) {
    if (xhr.status === 401) {
      this.hoodie.config.remove('_account.resetPasswordId');
      this.trigger('passwordreset');

      return this.hoodie.defer().resolve();
    } else {
      return this._handleRequestError(xhr);
    }
  };


  //
  // change username and password in 3 steps
  //
  // 1. assure we have a valid session
  // 2. update _users doc with new username and new password (if provided)
  // 3. sign in with new credentials to create new sesion.
  //
  Account.prototype._changeUsernameAndPassword = function(currentPassword, newUsername, newPassword) {
    var self = this;

    return this._sendSignInRequest(this.username, currentPassword, {
      silent: true
    }).pipe(function() {
      return self.fetch().pipe(
        self._sendChangeUsernameAndPasswordRequest(currentPassword, newUsername, newPassword)
      );
    });
  };


  //
  // turn an anonymous account into a real account
  //
  Account.prototype._upgradeAnonymousAccount = function(username, password) {
    var currentPassword, self = this;
    currentPassword = this.getAnonymousPassword();

    return this._changeUsernameAndPassword(currentPassword, username, password).done(function() {
      self.trigger('signup', username);
      self.removeAnonymousPassword();
    });
  };


  //
  // we now can be sure that we fetched the latest _users doc, so we can update it
  // without a potential conflict error.
  //
  Account.prototype._handleFetchBeforeDestroySucces = function() {
    var self = this;

    this.hoodie.remote.disconnect();
    this._doc._deleted = true;

    return this._withPreviousRequestsAborted('updateUsersDoc', function() {
      self.request('PUT', self._url(), {
        data: JSON.stringify(self._doc),
        contentType: 'application/json'
      });
    });
  };


  //
  // dependend on what kind of error we get, we want to ignore
  // it or not.
  // When we get a "not_found" it means that the _users doc habe
  // been removed already, so we don't need to do it anymore, but
  // still want to finish the destroy locally, so we return a
  // resolved promise
  //
  Account.prototype._handleFetchBeforeDestroyError = function(error) {
    if (error.error === 'not_found') {
      return this.hoodie.defer().resolve().promise();
    } else {
      return this.hoodie.defer().reject(error).promise();
    }
  };

  //
  // remove everything form the current account, so a new account can be initiated.
  //
  Account.prototype._cleanup = function(options) {
    options = options || {};

    // hoodie.store is listening on this one
    this.trigger('cleanup');
    this._authenticated = options.authenticated;
    this.hoodie.config.clear();
    this._setUsername(options.username);
    this._setOwner(options.ownerHash || this.hoodie.uuid());

    return this.hoodie.defer().resolve().promise();
  };


  //
  Account.prototype._cleanupAndTriggerSignOut = function() {
    var self = this;
    return this._cleanup().then(function() {
      return self.trigger('signout');
    });
  };


  //
  // depending on wether the user signedUp manually or has been signed up anonymously
  // the prefix in the CouchDB _users doc differentiates.
  // An anonymous user is characterized by its username, that equals
  // its ownerHash (see `anonymousSignUp`)
  //
  // We differentiate with `hasAnonymousAccount()`, because `_userKey`
  // is used within `signUp` method, so we need to be able to differentiate
  // between anonyomus and normal users before an account has been created.
  //
  Account.prototype._userKey = function(username) {
    var prefix;

    if (username === this.ownerHash) {
      prefix = 'user_anonymous';
    } else {
      prefix = 'user';
    }
    return "" + prefix + "/" + username;
  };


  //
  // turn a username into a valid _users doc._id
  //
  Account.prototype._key = function(username) {
    username = username || this.username;
    return "" + this._prefix + ":" + (this._userKey(username));
  };

  //
  // get URL of my _users doc
  //
  Account.prototype._url = function(username) {
    return "/_users/" + (encodeURIComponent(this._key(username)));
  };


  //
  // update my _users doc.
  //
  // If a new username has been passed, we set the special attribut $newUsername.
  // This will let the username change worker create create a new _users doc for
  // the new username and remove the current one
  //
  // If a new password has been passed, salt and password_sha get removed
  // from _users doc and add the password in clear text. CouchDB will replace it with
  // according password_sha and a new salt server side
  //
  Account.prototype._sendChangeUsernameAndPasswordRequest = function(currentPassword, newUsername, newPassword) {
    var self = this;

    return function() {
      // prepare updated _users doc
      var data = $.extend({}, self._doc);

      if (newUsername) {
        data.$newUsername = newUsername;
      }

      data.updatedAt = self._now();
      data.signedUpAt = data.signedUpAt || self._now();

      // trigger password update when newPassword set
      if (newPassword !== null) {
        delete data.salt;
        delete data.password_sha;
        data.password = newPassword;
      }

      var options = {
        data: JSON.stringify(data),
        contentType: 'application/json'
      };

      return self._withPreviousRequestsAborted('updateUsersDoc', function() {
        return self.request('PUT', self._url(), options).pipe(
          self._handleChangeUsernameAndPasswordRequest(newUsername, newPassword || currentPassword),
          self._handleRequestError
        );
      });

    };
  };


  //
  // depending on whether a newUsername has been passed, we can sign in right away
  // or have to use the delayed sign in to give the username change worker some time
  //
  Account.prototype._handleChangeUsernameAndPasswordRequest = function(newUsername, newPassword) {
    var self = this;

    return function() {
      self.hoodie.remote.disconnect();
      if (newUsername) {
        return self._delayedSignIn(newUsername, newPassword, {
          silent: true
        });
      } else {
        return self.signIn(self.username, newPassword);
      }
    };
  };


  //
  // make sure that the same request doesn't get sent twice
  // by cancelling the previous one.
  //
  Account.prototype._withPreviousRequestsAborted = function(name, requestFunction) {
    if (this._requests[name] !== undefined) {
      if (typeof this._requests[name].abort === "function") {
        this._requests[name].abort();
      }
    }
    this._requests[name] = requestFunction();
    return this._requests[name];
  };


  //
  // if there is a pending request, return its promise instead
  // of sending another request
  //
  Account.prototype._withSingleRequest = function(name, requestFunction) {

    if (this._requests[name] !== undefined) {
      if (typeof this._requests[name].state === "function") {
        if (this._requests[name].state() === 'pending') {
          return this._requests[name];
        }
      }
    }

    this._requests[name] = requestFunction();
    return this._requests[name];
  };


  //
  Account.prototype._sendSignOutRequest = function() {
    var self = this;
    return this._withSingleRequest('signOut', function() {
      return self.request('DELETE', '/_session').pipe(null, self._handleRequestError);
    });
  };


  //
  // the sign in request that starts a CouchDB session if
  // it succeeds. We separated the actual sign in request from
  // the signIn method, as the latter also runs signOut intenrtally
  // to clean up local data before starting a new session. But as
  // other methods like signUp or changePassword do also need to
  // sign in the user (again), these need to send the sign in
  // request but without a signOut beforehand, as the user remains
  // the same.
  //
  Account.prototype._sendSignInRequest = function(username, password, options) {
    var self = this,
    requestOptions = {
      data: {
        name: this._userKey(username),
        password: password
      }
    };

    return this._withPreviousRequestsAborted('signIn', function() {
      var promise = self.request('POST', '/_session', requestOptions);

      return promise.pipe(
        self._handleSignInSuccess(options),
        self._handleRequestError
      );
    });

  };


  //
  //
  Account.prototype._now = function() {
    return new Date();
  };

  return Account;

})();

// Hoodie Config API
// ===================

// 
Hoodie.Config = (function() {

  'use strict';

  // Constructor
  // -------------

  //
  function Config(hoodie, options) {
    var self = this;

    options = options || {};

    this.hoodie = hoodie;
    this.clear = this.clear;

    // memory cache
    this.cache = {};

    if (options.type) {
      this.type = options.type;
    }

    if (options.id) {
      this.id = options.id;
    }

    this.hoodie.store.find(this.type, this.id).done(function(obj) {
      self.cache = obj;
      return self.cache;
    });

    this.hoodie.on('account:signedOut', this.clear);
  }

  // used as attribute name in localStorage
  Config.prototype.type = '$config';
  Config.prototype.id = 'hoodie';

  // set
  // ----------

  // adds a configuration
  // 
  Config.prototype.set = function(key, value) {
    var isSilent, update;

    if (this.cache[key] === value) {
      return;
    }

    this.cache[key] = value;

    update = {};
    update[key] = value;
    isSilent = key.charAt(0) === '_';

    return this.hoodie.store.update(this.type, this.id, update, {
      silent: isSilent
    });

  };

  // get
  // ----------

  // receives a configuration
  // 
  Config.prototype.get = function(key) {
    return this.cache[key];
  };

  // clear
  // ----------

  // clears cache and removes object from store
  // 
  Config.prototype.clear = function() {
    this.cache = {};
    return this.hoodie.store.remove(this.type, this.id);
  };

  // remove
  // ----------

  // removes a configuration, is a simple alias for config.set(key, undefined)
  // 
  Config.prototype.remove = function(key) {
    return this.set(key, void 0);
  };

  return Config;

})();

// 
// one place to rule them all!
// 

'use strict';

Hoodie.Errors = {

  // INVALID_KEY
  // --------------

  // thrown when invalid keys are used to store an object
  // 
  INVALID_KEY: function (idOrType) {
    var key = idOrType.id ? 'id' : 'type';

    return new Error("invalid " + key + " '" + idOrType[key] + "': numbers and lowercase letters allowed only");
  },

  // INVALID_ARGUMENTS
  // -------------------

  // 
  INVALID_ARGUMENTS: function (msg) {
    return new Error(msg);
  },

  // NOT_FOUND
  // -----------

  // 
  NOT_FOUND: function (type, id) {
    return new Error("" + type + " with " + id + " could not be found");
  }

};

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


// Remote
// ========

// Connection to a remote Couch Database.
//
// store API
// ----------------
//
// object loading / updating / deleting
//
// * find(type, id)
// * findAll(type )
// * add(type, object)
// * save(type, id, object)
// * update(type, id, new_properties )
// * updateAll( type, new_properties)
// * remove(type, id)
// * removeAll(type)
//
// custom requests
//
// * request(view, params)
// * get(view, params)
// * post(view, params)
//
// synchronization
//
// * connect()
// * disconnect()
// * pull()
// * push()
// * sync()
//
// event binding
//
// * on(event, callback)
//

// 
var ConnectionError;

Hoodie.Remote = (function(_super) {

  'use strict';

  // Constructor 
  // -------------

  // sets name (think: namespace) and some other options
  function Remote(hoodie, options) {
    this.hoodie = hoodie;
    options = options || {};

    this._handlePullResults = this._handlePullResults.bind(this);
    this._handlePullError = this._handlePullError.bind(this);
    this._handlePullSuccess = this._handlePullSuccess.bind(this);
    this._restartPullRequest = this._restartPullRequest.bind(this);
    this._mapDocsFromFindAll = this._mapDocsFromFindAll.bind(this);
    this._parseAllFromRemote = this._parseAllFromRemote.bind(this);
    this._parseFromRemote = this._parseFromRemote.bind(this);
    this.sync = this.sync.bind(this);
    this.push = this.push.bind(this);
    this.pull = this.pull.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.connect = this.connect.bind(this);

    if (options.name !== undefined) {
      this.name = options.name;
    }

    if (options.prefix !== undefined) {
      this.prefix = options.prefix;
    }

    if (options.connected !== undefined) {
      this.connected = options.connected;
    }

    if (options.baseUrl !== null) {
      this.baseUrl = options.baseUrl;
    }

    // in order to differentiate whether an object from remote should trigger a 'new'
    // or an 'update' event, we store a hash of known objects
    this._knownObjects = {};

    if (this.isConnected()) {
      this.connect();
    }
  }

  Object.deepExtend(Remote, _super);


  // properties
  // ------------

  // name

  // the name of the Remote is the name of the
  // CouchDB database and is also used to prefix
  // triggered events
  //
  Remote.prototype.name = null;


  // sync

  // if set to true, updates will be continuously pulled
  // and pushed. Alternatively, `sync` can be set to
  // `pull: true` or `push: true`.
  //
  Remote.prototype.connected = false;


  // prefix

  //prefix for docs in a CouchDB database, e.g. all docs
  // in public user stores are prefixed by '$public/'
  //
  Remote.prototype.prefix = '';


  // request
  // ---------

  // wrapper for hoodie.request, with some store specific defaults
  // and a prefixed path
  //
  Remote.prototype.request = function(type, path, options) {
    options = options || {};

    if (this.name) {
      path = "/" + (encodeURIComponent(this.name)) + path;
    }

    if (this.baseUrl) {
      path = "" + this.baseUrl + path;
    }

    options.contentType = options.contentType || 'application/json';

    if (type === 'POST' || type === 'PUT') {
      options.dataType = options.dataType || 'json';
      options.processData = options.processData || false;
      options.data = JSON.stringify(options.data);
    }
    return this.hoodie.request(type, path, options);
  };


  // get
  // -----

  // send a GET request to the named view
  //
  Remote.prototype.get = function() {
    return console.log.apply(
      console, [".get() not yet implemented"]
      .concat(Array.prototype.slice.call(arguments))
    );
  };


  // post
  // ------

  // sends a POST request to the specified updated_function
  //
  Remote.prototype.post = function() {
    return console.log.apply(
      console, [".post() not yet implemented"]
      .concat(Array.prototype.slice.call(arguments))
    );
  };


  // Store Operations overides
  // ---------------------------

  // find
  // ------

  // find one object
  //
  Remote.prototype.find = function(type, id) {
    var defer, path;

    defer = Remote.__super__.find.apply(this, arguments);

    if (this.hoodie.isPromise(defer)) {
      return defer;
    }

    path = "" + type + "/" + id;

    if (this.prefix) {
      path = this.prefix + path;
    }

    path = "/" + encodeURIComponent(path);

    return this.request("GET", path).pipe(this._parseFromRemote);
  };


  // findAll
  // ---------

  // find all objects, can be filetered by a type
  //
  Remote.prototype.findAll = function(type) {
    var defer, endkey, path, startkey;

    defer = Remote.__super__.findAll.apply(this, arguments);

    if (this.hoodie.isPromise(defer)) {
      return defer;
    }

    path = "/_all_docs?include_docs=true";

    switch (true) {
    case (type !== undefined) && this.prefix !== '':
      startkey = "" + this.prefix + type + "/";
      break;
    case type !== undefined:
      startkey = "" + type + "/";
      break;
    case this.prefix !== '':
      startkey = this.prefix;
      break;
    default:
      startkey = '';
    }

    if (startkey) {

      // make sure that only objects starting with
      // `startkey` will be returned
      endkey = startkey.replace(/.$/, function(chars) {
        var charCode;
        charCode = chars.charCodeAt(0);
        return String.fromCharCode(charCode + 1);
      });
      path = "" + path + "&startkey=\"" + (encodeURIComponent(startkey)) + "\"&endkey=\"" + (encodeURIComponent(endkey)) + "\"";
    }
    return this.request("GET", path).pipe(this._mapDocsFromFindAll).pipe(this._parseAllFromRemote);
  };


  // save
  // ------

  // save a new object. If it existed before, all properties
  // will be overwritten
  //
  Remote.prototype.save = function(type, id, object) {
    var defer, path;
    defer = Remote.__super__.save.apply(this, arguments);
    if (this.hoodie.isPromise(defer)) {
      return defer;
    }
    if (!id) {
      id = this.hoodie.uuid();
    }
    object = $.extend({
      type: type,
      id: id
    }, object);
    object = this._parseForRemote(object);
    path = "/" + encodeURIComponent(object._id);
    return this.request("PUT", path, {
      data: object
    });
  };


  // remove
  // ---------

  // remove one object
  //
  Remote.prototype.remove = function(type, id) {
    return this.update(type, id, {
      _deleted: true
    });
  };


  // removeAll
  // ------------

  // remove all objects, can be filtered by type
  //
  Remote.prototype.removeAll = function(type) {
    return this.updateAll(type, {
      _deleted: true
    });
  };


  // isKnownObject
  // ---------------

  // determine between a known and a new object
  //
  Remote.prototype.isKnownObject = function(object) {
    var key = "" + object.type + "/" + object.id;

    if (this._knownObjects[key] !== undefined) {
      return this._knownObjects[key];
    }
  };


  // markAsKnownObject
  // -------------------

  // determine between a known and a new object
  //
  Remote.prototype.markAsKnownObject = function(object) {
    var key = "" + object.type + "/" + object.id;
    this._knownObjects[key] = 1;
    return this._knownObjects[key];
  };


  // synchronization
  // -----------------

  // Connect
  // ---------

  // start syncing. `this.bootstrap()` will automatically start
  // pulling when `this.connected` remains true.
  // 
  Remote.prototype.connect = function() {
    this.connected = true;
    return this.bootstrap();
  };


  // Disconnect
  // ------------

  // stop syncing changes from remote store
  //
  Remote.prototype.disconnect = function() {
    this.connected = false;

    if (this._pullRequest !== undefined) {
      this._pullRequest.abort();
    }

    if (this._pushRequest !== undefined) {
      this._pushRequest.abort();
    }

  };


  // isConnected
  // -------------

  //
  Remote.prototype.isConnected = function() {
    return this.connected;
  };


  // getSinceNr
  // ------------

  // returns the sequence number from wich to start to find changes in pull
  //
  Remote.prototype.getSinceNr = function() {
    return this._since || 0;
  };


  // setSinceNr
  // ------------

  // sets the sequence number from wich to start to find changes in pull
  //
  Remote.prototype.setSinceNr = function(seq) {
    this._since = seq;
    return this._since;
  };


  // bootstrap
  // -----------

  // inital pull of data of the remote start. By default, we pull all
  // changes since the beginning, but this behavior might be adjusted,
  // e.g for a filtered bootstrap.
  //
  Remote.prototype.bootstrap = function() {
    this.trigger('bootstrap:start');
    return this.pull().done( this._handleBootstrapSuccess.bind(this) );
  };


  // pull changes
  // --------------

  // a.k.a. make a GET request to CouchDB's `_changes` feed.
  // We currently make long poll requests, that we manually abort
  // and restart each 25 seconds.
  //
  Remote.prototype.pull = function() {
    this._pullRequest = this.request('GET', this._pullUrl());

    if (this.isConnected()) {
      window.clearTimeout(this._pullRequestTimeout);
      this._pullRequestTimeout = window.setTimeout(this._restartPullRequest, 25000);
    }

    return this._pullRequest.then(this._handlePullSuccess, this._handlePullError);
  };


  // push changes
  // --------------

  // Push objects to remote store using the `_bulk_docs` API.
  //
  Remote.prototype.push = function(objects) {
    var object, objectsForRemote, _i, _len;

    if (!(objects !== undefined ? objects.length : void 0)) {
      return this.hoodie.resolveWith([]);
    }

    objectsForRemote = [];

    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      object = objects[_i];
      this._addRevisionTo(object);
      object = this._parseForRemote(object);
      objectsForRemote.push(object);
    }
    this._pushRequest = this.request('POST', "/_bulk_docs", {
      data: {
        docs: objectsForRemote,
        new_edits: false
      }
    });

    return this._pushRequest;
  };

  // sync changes
  // --------------

  // push objects, then pull updates.
  //
  Remote.prototype.sync = function(objects) {
    return this.push(objects).pipe(this.pull);
  };


  // Events
  // --------

  // namespaced alias for `hoodie.on`
  //
  Remote.prototype.on = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1" + this.name + ":$2");
    return this.hoodie.on(event, cb);
  };

  Remote.prototype.one = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1" + this.name + ":$2");
    return this.hoodie.one(event, cb);
  };


  // namespaced alias for `hoodie.trigger`
  //
  Remote.prototype.trigger = function() {
    var event, parameters, _ref;
    event = arguments[0],
    parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];
    return (_ref = this.hoodie).trigger.apply(_ref, ["" + this.name + ":" + event].concat(Array.prototype.slice.call(parameters)));
  };


  // Private
  // --------------

  // valid CouchDB doc attributes starting with an underscore
  //
  Remote.prototype._validSpecialAttributes = ['_id', '_rev', '_deleted', '_revisions', '_attachments'];


  // Parse for remote
  // ------------------

  // parse object for remote storage. All properties starting with an
  // `underscore` do not get synchronized despite the special properties
  // `_id`, `_rev` and `_deleted` (see above)
  //
  // Also `id` gets replaced with `_id` which consists of type & id
  //
  Remote.prototype._parseForRemote = function(object) {
    var attr, properties;
    properties = $.extend({}, object);

    for (attr in properties) {
      if (properties.hasOwnProperty(attr)) {
        if (this._validSpecialAttributes.indexOf(attr) !== -1) {
          continue;
        }
        if (!/^_/.test(attr)) {
          continue;
        }
        delete properties[attr];
      }
    }

    // prepare CouchDB id
    properties._id = "" + properties.type + "/" + properties.id;
    if (this.prefix) {
      properties._id = "" + this.prefix + properties._id;
    }
    delete properties.id;
    return properties;
  };


  // ### _parseFromRemote

  // normalize objects coming from remote
  //
  // renames `_id` attribute to `id` and removes the type from the id,
  // e.g. `type/123` -> `123`
  //
  Remote.prototype._parseFromRemote = function(object) {
    var id, ignore, _ref;

    // handle id and type
    id = object._id || object.id;
    delete object._id;

    if (this.prefix) {
      id = id.replace(new RegExp('^' + this.prefix), '');
    }

    // turn doc/123 into type = doc & id = 123
    // NOTE: we don't use a simple id.split(/\//) here,
    // as in some cases IDs might contain "/", too
    //
    _ref = id.match(/([^\/]+)\/(.*)/),
    ignore = _ref[0],
    object.type = _ref[1],
    object.id = _ref[2];

    return object;
  };

  Remote.prototype._parseAllFromRemote = function(objects) {
    var object, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      object = objects[_i];
      _results.push(this._parseFromRemote(object));
    }
    return _results;
  };


  // ### _addRevisionTo

  // extends passed object with a _rev property
  //
  Remote.prototype._addRevisionTo = function(attributes) {
    var currentRevId, currentRevNr, newRevisionId, _ref;
    try {
      _ref = attributes._rev.split(/-/),
      currentRevNr = _ref[0],
      currentRevId = _ref[1];
    } catch (_error) {}
    currentRevNr = parseInt(currentRevNr, 10) || 0;
    newRevisionId = this._generateNewRevisionId();

    // local changes are not meant to be replicated outside of the
    // users database, therefore the `-local` suffix.
    if (attributes._$local) {
      newRevisionId += "-local";
    }

    attributes._rev = "" + (currentRevNr + 1) + "-" + newRevisionId;
    attributes._revisions = {
      start: 1,
      ids: [newRevisionId]
    };

    if (currentRevId) {
      attributes._revisions.start += currentRevNr;
      return attributes._revisions.ids.push(currentRevId);
    }
  };


  // ### generate new revision id

  //
  Remote.prototype._generateNewRevisionId = function() {
    return this.hoodie.uuid(9);
  };


  // ### map docs from findAll

  //
  Remote.prototype._mapDocsFromFindAll = function(response) {
    return response.rows.map(function(row) {
      return row.doc;
    });
  };


  // ### pull url

  // Depending on whether remote is connected, return a longpoll URL or not
  //
  Remote.prototype._pullUrl = function() {
    var since;
    since = this.getSinceNr();
    if (this.isConnected()) {
      return "/_changes?include_docs=true&since=" + since + "&heartbeat=10000&feed=longpoll";
    } else {
      return "/_changes?include_docs=true&since=" + since;
    }
  };


  // ### restart pull request

  // request gets restarted automaticcally 
  // when aborted (see @_handlePullError)
  Remote.prototype._restartPullRequest = function() {
    if (this._pullRequest) {
      this._pullRequest.abort();
    }
  };


  // ### pull success handler

  // request gets restarted automaticcally
  // when aborted (see @_handlePullError)
  //
  Remote.prototype._handlePullSuccess = function(response) {
    this.setSinceNr(response.last_seq);
    this._handlePullResults(response.results);
    if (this.isConnected()) {
      return this.pull();
    }
  };


  // ### pull error handler

  // when there is a change, trigger event,
  // then check for another change
  //
  Remote.prototype._handlePullError = function(xhr, error) {
    if (!this.isConnected()) {
      return;
    }

    switch (xhr.status) {
      // Session is invalid. User is still login, but needs to reauthenticate
      // before sync can be continued
    case 401:
      this.trigger('error:unauthenticated', error);
      return this.disconnect();

     // the 404 comes, when the requested DB has been removed
     // or does not exist yet.
     //
     // BUT: it might also happen that the background workers did
     //      not create a pending database yet. Therefore,
     //      we try it again in 3 seconds
     //
     // TODO: review / rethink that.
     //

    case 404:
      return window.setTimeout(this.pull, 3000);

    case 500:
      //
      // Please server, don't give us these. At least not persistently
      //
      this.trigger('error:server', error);
      window.setTimeout(this.pull, 3000);
      return this.hoodie.checkConnection();
    default:
      // usually a 0, which stands for timeout or server not reachable.
      if (xhr.statusText === 'abort') {
        // manual abort after 25sec. restart pulling changes directly when connected
        return this.pull();
      } else {

        // oops. This might be caused by an unreachable server.
        // Or the server canceled it for what ever reason, e.g.
        // heroku kills the request after ~30s.
        // we'll try again after a 3s timeout
        //
        window.setTimeout(this.pull, 3000);
        return this.hoodie.checkConnection();
      }
    }
  };


  // ### handle changes from remote
  //
  Remote.prototype._handleBootstrapSuccess = function() {
    this.trigger('bootstrap:end');
  };

  // ### handle changes from remote
  //
  Remote.prototype._handlePullResults = function(changes) {
    var doc, event, object, _i, _len, _results = [];

    for (_i = 0, _len = changes.length; _i < _len; _i++) {
      doc = changes[_i].doc;

      if (this.prefix && doc._id.indexOf(this.prefix) !== 0) {
        continue;
      }

      object = this._parseFromRemote(doc);

      if (object._deleted) {
        if (!this.isKnownObject(object)) {
          continue;
        }
        event = 'remove';
        this.isKnownObject(object);
      } else {
        if (this.isKnownObject(object)) {
          event = 'update';
        } else {
          event = 'add';
          this.markAsKnownObject(object);
        }
      }

      this.trigger("" + event, object);
      this.trigger("" + event + ":" + object.type, object);
      this.trigger("" + event + ":" + object.type + ":" + object.id, object);
      this.trigger("change", event, object);
      this.trigger("change:" + object.type, event, object);
      _results.push(this.trigger("change:" + object.type + ":" + object.id, event, object));

    }
    return _results;
  };

  return Remote;

})(Hoodie.Store);

ConnectionError = (function(_super) {

  'use strict';

  function ConnectionError(message, data) {
    this.message = message;
    this.data = data;
    ConnectionError.__super__.constructor.apply(this, arguments);
  }

  Object.deepExtend(ConnectionError, _super);

  ConnectionError.prototype.name = "ConnectionError";

  return ConnectionError;

})(Error);


// AccountRemote
// ===============

// Connection / Socket to our couch
//
// AccountRemote is using CouchDB's `_changes` feed to
// listen to changes and `_bulk_docs` to push local changes
//
// When hoodie.remote is continuously syncing (default),
// it will continuously  synchronize with local store,
// otherwise sync, pull or push can be called manually
//
Hoodie.AccountRemote = (function(_super) {

  'use strict';

  // Constructor
  // -------------

  //
  function AccountRemote(hoodie, options) {
    this.hoodie = hoodie;
    options = options || {};

    // set name to user's DB name
    this.name = this.hoodie.account.db();

    // we're always connected to our own db
    this.connected = true;

    // do not prefix files for my own remote
    options.prefix = '';

    this.push = this.push.bind(this);
    this.hoodie.on('account:signin', this._handleSignIn.bind(this));
    this.hoodie.on('account:reauthenticated', this._connect.bind(this));
    this.hoodie.on('account:signout', this.disconnect.bind(this));
    this.hoodie.on('reconnected', this.connect.bind(this));
    AccountRemote.__super__.constructor.call(this, this.hoodie, options);

    // preset known objects with localstore.
    this.loadListOfKnownObjectsFromLocalStore();
  }

  Object.deepExtend(AccountRemote, _super);

  // connect by default
  AccountRemote.prototype.connected = true;


  // Connect
  // ---------

  // do not start to connect immediately, but authenticate beforehand
  //
  AccountRemote.prototype.connect = function() {
    return this.hoodie.account.authenticate().pipe(this._connect.bind(this));
  };


  // disconnect
  // ------------

  //
  AccountRemote.prototype.disconnect = function() {
    this.hoodie.unbind('store:idle', this.push);
    return AccountRemote.__super__.disconnect.apply(this, arguments);
  };


  // loadListOfKnownObjectsFromLocalStore
  // -------------------------------------------

  // to determine wether to trigger an `add` or `update`
  // event, the known objects from the user get loaded
  // from local store initially.
  // 
  AccountRemote.prototype.loadListOfKnownObjectsFromLocalStore = function() {
    var id, key, type, _i, _len, _ref, _ref1;
    _ref = this.hoodie.store.index();

    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      _ref1 = key.split(/\//),
      type = _ref1[0],
      id = _ref1[1];

      this.markAsKnownObject({
        type: type,
        id: id
      });
    }
  };


  // get and set since nr
  // ----------------------

  // we store the last since number from the current user's store
  // in his config
  //
  AccountRemote.prototype.getSinceNr = function() {
    return this.hoodie.config.get('_remote.since') || 0;
  };

  AccountRemote.prototype.setSinceNr = function(since) {
    return this.hoodie.config.set('_remote.since', since);
  };


  // push
  // ------

  // if no objects passed to be pushed, we default to
  // changed objects in user's local store
  //
  AccountRemote.prototype.push = function(objects) {
    if (!this.isConnected()) {
      var error = new window.ConnectionError("Not connected: could not push local changes to remote");
      return this.hoodie.rejectWith(error);
    }

    if (!$.isArray(objects)) {
      objects = this.hoodie.store.changedObjects();
    }

    var promise = AccountRemote.__super__.push.apply(this, [objects]);
    promise.fail(this.hoodie.checkConnection);

    return promise;
  };


  // Events
  // --------
  //
  // namespaced alias for `hoodie.on`
  //
  AccountRemote.prototype.on = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1remote:$2");
    return this.hoodie.on(event, cb);
  };

  AccountRemote.prototype.one = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1remote:$2");
    return this.hoodie.one(event, cb);
  };


  //
  // namespaced alias for `hoodie.trigger`
  //
  AccountRemote.prototype.trigger = function() {
    var event, parameters, _ref;

    event = arguments[0],
    parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];

    return (_ref = this.hoodie).trigger.apply(_ref, ["remote:" + event].concat(Array.prototype.slice.call(parameters)));
  };



  // Private
  // ---------

  //
  AccountRemote.prototype._connect = function() {
    this.connected = true;
    this.hoodie.on('store:idle', this.push);
    return this.sync();
  };


  //
  AccountRemote.prototype._handleSignIn = function() {
    this.name = this.hoodie.account.db();
    return this._connect();
  };

  return AccountRemote;

})(Hoodie.Remote);

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
  LocalStore.prototype.hasLocalChanges = function(type, id) {
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
    var defer, key, keys, results;
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

  // `_hasLocalChanges` returns true if there is a local change that
  // has not been sync'd yet.
  LocalStore.prototype._hasLocalChanges = function(object) {
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


// Hoodie Email Extension
// ========================

// Sending emails. Not unicorns
// 
Hoodie.Email = (function () {

  'use strict';

  // Constructor
  // -------------

  // 
  function Email(hoodie) {

    // TODO
    // let's subscribe to general `_email` changes and provide
    // an `on` interface, so devs can listen to events like:
    // 
    // * hoodie.email.on 'sent',  -> ...
    // * hoodie.email.on 'error', -> ...
    // 
    this.hoodie = hoodie;
    this._handleEmailUpdate = this._handleEmailUpdate;
  }


  // send
  // -------------

  // sends an email and returns a promise
  // 
  Email.prototype.send = function (emailAttributes) {
    var attributes, defer, self = this;

    if (emailAttributes === null) {
      emailAttributes = {};
    }

    defer = this.hoodie.defer();
    attributes = $.extend({}, emailAttributes);

    if (!this._isValidEmail(emailAttributes.to)) {
      attributes.error = "Invalid email address (" + (attributes.to || 'empty') + ")";
      return defer.reject(attributes).promise();
    }

    this.hoodie.store.add('$email', attributes).then(function (obj) {
      return self._handleEmailUpdate(defer, obj);
    });

    return defer.promise();
  };


  // PRIVATE
  // -------------

  // 
  Email.prototype._isValidEmail = function (email) {
    if (email === null) {
      email = '';
    }

    return new RegExp(/@/).test(email);
  };

  Email.prototype._handleEmailUpdate = function (defer, attributes) {
    var self = this;

    if (attributes === null) {
      attributes = {};
    }

    if (attributes.error) {
      return defer.reject(attributes);
    } else if (attributes.deliveredAt) {
      return defer.resolve(attributes);
    } else {
      return this.hoodie.remote.one("updated:$email:" + attributes.id, function (attributes) {
        return self._handleEmailUpdate(defer, attributes);
      });
    }

  };

  return Email;

})();

// extend Hoodie
Hoodie.extend('email', Hoodie.Email);

// Share Module
// ==============

// When a share gets created, a $share doc gets stored and synched to the user's
// database. From there the $share worker handles the rest:
//
// * creating a share database
// * creating a share user if a password is used (to be done)
// * handling the replications
//
// The worker updates the $share doc status, which gets synched back to the
// frontend. When the user deletes the $share doc, the worker removes the
// database, the user and all replications
//
//
// API
// -----
//
//     // returns a share instance
//     // with share.id set to 'share_id'
//     hoodie.share('share_id')
//
//     // the rest of the API is a standard store API, with the
//     // difference that no type has to be set and the returned
//     // promises are resolved with share instances instead of
//     // simple objects
//     hoodie.share.add(attributes)
//     hoodie.share.find('share_id')
//     hoodie.share.findAll()
//     hoodie.share.findOrAdd(id, attributes)
//     hoodie.share.save(id, attributes)
//     hoodie.share.update(id, changed_attributes)
//     hoodie.share.updateAll(changed_attributes)
//     hoodie.share.remove(id)
//     hoodie.share.removeAll()
//
Hoodie.Share = (function () {

  'use strict';

  // Constructor
  // -------------

  // the constructor returns a function, so it can be called
  // like this: hoodie.share('share_id')
  //
  // The rest of the API is available as usual.
  //
  function Share(hoodie) {
    var api;
    this.hoodie = hoodie;
    this._open = this._open.bind(this);

    // set pointer to Hoodie.ShareInstance
    this.instance = Hoodie.ShareInstance;

    // return custom api which allows direct call
    api = this._open;
    $.extend(api, this);

    this.hoodie.store.decoratePromises({
      shareAt: this._storeShareAt,
      unshareAt: this._storeUnshareAt,
      unshare: this._storeUnshare,
      share: this._storeShare
    });
    return api;
  }


  // add
  // --------

  // creates a new share and returns it
  //
  Share.prototype.add = function (options) {
    var self = this;
    if (options === null) {
      options = {};
    }
    return this.hoodie.store.add('$share', this._filterShareOptions(options)).pipe(function (object) {
      if (!self.hoodie.account.hasAccount()) {
        self.hoodie.account.anonymousSignUp();
      }
      return new self.instance(self.hoodie, object);
    });
  };


  // find
  // ------

  // find an existing share
  //
  Share.prototype.find = function (id) {
    var self = this;
    return this.hoodie.store.find('$share', id).pipe(function (object) {
      return new self.instance(self.hoodie, object);
    });
  };


  // findAll
  // ---------

  // find all my existing shares
  //
  Share.prototype.findAll = function () {
    var self = this;
    return this.hoodie.store.findAll('$share').pipe(function (objects) {
      var obj, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        obj = objects[_i];
        _results.push(new self.instance(self.hoodie, obj));
      }
      return _results;
    });
  };


  // findOrAdd
  // --------------

  // find or add a new share
  //
  Share.prototype.findOrAdd = function (id, options) {
    var self = this;
    return this.hoodie.store.findOrAdd('$share', id, this._filterShareOptions(options)).pipe(function (object) {
      if (!self.hoodie.account.hasAccount()) {
        self.hoodie.account.anonymousSignUp();
      }
      return new self.instance(self.hoodie, object);
    });
  };


  // save
  // ------

  // add or overwrite a share
  //
  Share.prototype.save = function (id, options) {
    var self = this;
    return this.hoodie.store.save('$share', id, this._filterShareOptions(options)).pipe(function (object) {
      return new self.instance(self.hoodie, object);
    });
  };


  // update
  // --------

  // add or overwrite a share
  //
  Share.prototype.update = function (id, changed_options) {
    var self = this;
    return this.hoodie.store.update('$share', id, this._filterShareOptions(changed_options)).pipe(function (object) {
      return new self.instance(self.hoodie, object);
    });
  };


  // updateAll
  // -----------

  // update all my existing shares
  //
  Share.prototype.updateAll = function (changed_options) {
    var self = this;
    return this.hoodie.store.updateAll('$share', this._filterShareOptions(changed_options)).pipe(function (objects) {
      var obj, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        obj = objects[_i];
        _results.push(new self.instance(self.hoodie, obj));
      }
      return _results;
    });
  };


  // remove
  // ---------

  // deletes an existing share
  //
  Share.prototype.remove = function (id) {
    this.hoodie.store.findAll(function (obj) {
      return obj.$shares[id];
    }).unshareAt(id);
    return this.hoodie.store.remove('$share', id);
  };


  // removeAll
  // ------------

  // delete all existing shares
  //
  Share.prototype.removeAll = function () {
    this.hoodie.store.findAll(function (obj) {
      return obj.$shares;
    }).unshare();
    return this.hoodie.store.removeAll('$share');
  };


  // Private
  //---------

  Share.prototype._allowedOptions = ["id", "access", "createdBy"];


  // ### filter share options
  //
  Share.prototype._filterShareOptions = function (options) {
    var filteredOptions, option, _i, _len, _ref;
    options = options || {};

    filteredOptions = {};
    _ref = this._allowedOptions;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      option = _ref[_i];
      if (options.hasOwnProperty(option)) {
        filteredOptions[option] = options[option];
      }
    }
    return filteredOptions;
  };


  // ### open

  // opens a a remote share store, returns a Hoodie.Remote instance
  //
  Share.prototype._open = function (shareId, options) {
    options = options || {};
    $.extend(options, {
      id: shareId
    });
    return new this.instance(this.hoodie, options);
  };


  // hoodie.store decorations
  // --------------------------

  // hoodie.store decorations add custom methods to promises returned
  // by hoodie.store methods like find, add or update. All methods return
  // methods again that will be executed in the scope of the promise, but
  // with access to the current hoodie instance
  //

  // ### shareAt

  //
  Share.prototype._storeShareAt = function (shareId) {
    var self = this;
    return this.pipe(function (objects) {
      var object, updateObject, _i, _len, _results;
      updateObject = function (object) {
        self.hoodie.store.update(object.type, object.id, {
          $sharedAt: shareId
        });
        return object;
      };
      if ($.isArray(objects)) {
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          _results.push(updateObject(object));
        }
        return _results;
      } else {
        return updateObject(objects);
      }
    });
  };


  // ### unshareAt

  //
  Share.prototype._storeUnshareAt = function (shareId) {
    var self = this;
    return this.pipe(function (objects) {
      var object, updateObject, _i, _len, _results;

      updateObject = function (object) {
        if (object.$sharedAt !== shareId) {
          return object;
        }
        self.hoodie.store.update(object.type, object.id, {
          $unshared: true
        });
        return object;
      };

      if ($.isArray(objects)) {
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          _results.push(updateObject(object));
        }
        return _results;
      } else {
        return updateObject(objects);
      }
    });
  };


  // ### unshare

  //
  Share.prototype._storeUnshare = function () {
    var self = this;
    return this.pipe(function (objects) {
      var object, updateObject, _i, _len, _results;
      updateObject = function (object) {
        if (!object.$sharedAt) {
          return object;
        }
        self.hoodie.store.update(object.type, object.id, {
          $unshared: true
        });
        return object;
      };
      if ($.isArray(objects)) {
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          _results.push(updateObject(object));
        }
        return _results;
      } else {
        return updateObject(objects);
      }
    });
  };


  // ### share

  //
  Share.prototype._storeShare = function () {
    var self = this;

    return this.pipe(function (objects) {
      return self.hoodie.share.add().pipe(function (newShare) {
        var object, updateObject, value;
        updateObject = function (object) {
          self.hoodie.store.update(object.type, object.id, {
            $sharedAt: newShare.id
          });
          return object;
        };
        value = (function () {
          var _i, _len, _results;
          if ($.isArray(objects)) {
            _results = [];
            for (_i = 0, _len = objects.length; _i < _len; _i++) {
              object = objects[_i];
              _results.push(updateObject(object));
            }
            return _results;
          } else {
            return updateObject(objects);
          }
        })();
        return self.hoodie.defer().resolve(value, newShare).promise();
      });
    });
  };

  return Share;

})();

// extend Hoodie
Hoodie.extend('share', Hoodie.Share);

// User
// ======

// the User Module provides a simple API to find objects from other users public
// stores
//
// For example, the syntax to find all objects from user "Joe" looks like this:
//
//     hoodie.user("Joe").findAll().done( handleObjects )
//

Hoodie.User = (function() {

  'use strict';

  function User(hoodie) {
    this.hoodie = hoodie;
    this.api = this.api.bind(this);

    // extend hodie.store promise API
    this.hoodie.store.decoratePromises({
      publish: this._storePublish,
      unpublish: this._storeUnpublish
    });

    // vanilla API syntax:
    // hoodie.user('uuid1234').findAll()
    return this.api;
  }

  // 
  User.prototype.api = function(userHash, options) {
    options = options || {};
    $.extend(options, {
      prefix: '$public'
    });
    return this.hoodie.open("user/" + userHash + "/public", options);
  };


  // hoodie.store decorations
  // --------------------------

  // hoodie.store decorations add custom methods to promises returned
  // by hoodie.store methods like find, add or update. All methods return
  // methods again that will be executed in the scope of the promise, but
  // with access to the current hoodie instance

  // ### publish

  // publish an object. If an array of properties passed, publish only these
  // attributes and hide the remaining ones. If no properties passed, publish
  // the entire object.
  //
  User.prototype._storePublish = function(properties) {
    var _this = this;
    return this.pipe(function(objects) {
      var object, _i, _len, _results;
      if (!$.isArray(objects)) {
        objects = [objects];
      }
      _results = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        _results.push(_this.hoodie.store.update(object.type, object.id, {
          $public: properties || true
        }));
      }
      return _results;
    });
  };


  //`### unpublish`

  //
  User.prototype._storeUnpublish = function() {
    var _this = this;
    return this.pipe(function(objects) {
      var object, _i, _len, _results;
      if (!$.isArray(objects)) {
        objects = [objects];
      }
      _results = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        if (object.$public) {
          _results.push(_this.hoodie.store.update(object.type, object.id, {
            $public: false
          }));
        }
      }
      return _results;
    });
  };

  return User;

})();

// extend Hoodie
Hoodie.extend('user', Hoodie.User);

// Global
// ========

// the Global Module provides a simple API to find objects from the global
// stores
// 
// For example, the syntax to find all objects from the global store
// looks like this:
// 
//     hoodie.global.findAll().done( handleObjects )
// 
// okay, might not be the best idea to do that with 1+ million objects, but
// you get the point
// 
Hoodie.Global = (function () {

  'use strict';

  function Global(hoodie) {

    // vanilla API syntax:
    // hoodie.global.findAll()
    return hoodie.open("global");
  }

  return Global;

})();

// extend Hoodie
Hoodie.extend('global', Hoodie.Global);

// Share Instance
// ========================

// A share instance provides an API to interact with a
// share. It's extending the default Remote Store by methods
// to grant or revoke read / write access.
//
// By default, a share is only accessible to me. If I want
// it to share it, I explicatly need to grant access
// by calling `share.grantReadAccess()`. I can also grant
// access to only specific users by passing an array:
// `share.grantReadAccess(['joe','lisa'])`
//
// It's plannend to secure a public share with a password,
// but this feature is not yet implemented.
//
// To subscribe to a share created by somebody else, run
// this code: `hoodie.share('shareId').subscribe()`.
//
Hoodie.ShareInstance = (function(_super) {

  'use strict';

  // constructor
  // -------------

  // initializes a new share
  //
  function ShareInstance(hoodie, options) {
    this.hoodie = hoodie;

    options = options || {};

    this._handleSecurityResponse = this._handleSecurityResponse.bind(this);
    this._objectBelongsToMe = this._objectBelongsToMe.bind(this);

    // make sure that we have an id
    this.id = options.id || this.hoodie.uuid();

    // set name from id
    this.name = "share/" + this.id;

    // set prefix from name
    this.prefix = this.name;

    // set options
    $.extend(this, options);

    ShareInstance.__super__.constructor.apply(this, arguments);
  }

  Object.deepExtend(ShareInstance, _super);


  // default values
  // ----------------

  // shares are not accessible to others by default.
  //
  ShareInstance.prototype.access = false;


  // subscribe
  // ---------

  //
  //
  ShareInstance.prototype.subscribe = function() {
    return this.request('GET', '/_security').pipe(this._handleSecurityResponse);
  };


  // unsubscribe
  // -----------

  //
  //
  ShareInstance.prototype.unsubscribe = function() {
    this.hoodie.share.remove(this.id);
    this.hoodie.store.removeAll(this._objectBelongsToMe, {
      local: true
    });
    return this;
  };


  // grant read access
  // -------------------

  // grant read access to the share. If no users passed,
  // everybody can read the share objects. If one or multiple
  // users passed, only these users get read access.
  //
  // examples:
  //
  //     share.grantReadAccess()
  //     share.grantReadAccess('joe@example.com')
  //     share.grantReadAccess(['joe@example.com', 'lisa@example.com'])
  //
  ShareInstance.prototype.grantReadAccess = function(users) {
    var currentUsers, user, _i, _len;

    if (this.access === true || this.access.read === true) {
      return this.hoodie.resolveWith(this);
    }

    if (typeof users === 'string') {
      users = [users];
    }

    if (this.access === false || this.access.read === false) {
      if (this.access.read !== undefined) {
        this.access.read = users || true;
      } else {
        this.access = users || true;
      }
    }

    if (users) {
      currentUsers = this.access.read || this.access;

      for (_i = 0, _len = users.length; _i < _len; _i++) {
        user = users[_i];
        if (currentUsers.indexOf(user) === -1) {
          currentUsers.push(user);
        }
      }

      this.access.read !== undefined ? this.access.read = currentUsers : this.access = currentUsers;
    } else {
      this.access.read !== undefined ? this.access.read = true : this.access = true;
    }

    return this.hoodie.share.update(this.id, {
      access: this.access
    });

  };


  // revoke read access
  // --------------------

  // revoke read access to the share. If one or multiple
  // users passed, only these users' access gets revoked.
  // Revoking reading access always includes revoking write
  // access as well.
  //
  // examples:
  //
  //     share.revokeReadAccess()
  //     share.revokeReadAccess('joe@example.com')
  //     share.revokeReadAccess(['joe@example.com', 'lisa@example.com'])
  //
  ShareInstance.prototype.revokeReadAccess = function(users) {
    var changed, currentUsers, idx, user, _i, _len;
    this.revokeWriteAccess(users);
    if (this.access === false || this.access.read === false) {
      return this.hoodie.resolveWith(this);
    }
    if (users) {
      if (this.access === true || this.access.read === true) {
        return this.hoodie.rejectWith(this);
      }
      if (typeof users === 'string') {
        users = [users];
      }
      currentUsers = this.access.read || this.access;
      changed = false;
      for (_i = 0, _len = users.length; _i < _len; _i++) {
        user = users[_i];
        idx = currentUsers.indexOf(user);
        if (idx !== -1) {
          currentUsers.splice(idx, 1);
          changed = true;
        }
      }
      if (!changed) {
        return this.hoodie.resolveWith(this);
      }
      if (currentUsers.length === 0) {
        currentUsers = false;
      }
      if (this.access.read !== undefined) {
        this.access.read = currentUsers;
      } else {
        this.access = currentUsers;
      }
    } else {
      this.access = false;
    }
    return this.hoodie.share.update(this.id, {
      access: this.access
    });
  };


  // grant write access
  // --------------------

  // grant write access to the share. If no users passed,
  // everybody can edit the share objects. If one or multiple
  // users passed, only these users get write access. Granting
  // writing reads always also includes reading rights.
  //
  // examples:
  //
  //     share.grantWriteAccess()
  //     share.grantWriteAccess('joe@example.com')
  //     share.grantWriteAccess(['joe@example.com', 'lisa@example.com'])
  //
  ShareInstance.prototype.grantWriteAccess = function(users) {
    this.grantReadAccess(users);

    if (this.access.read === undefined) {
      this.access = {
        read: this.access
      };
    }
    if (this.access.write === true) {
      return this.hoodie.resolveWith(this);
    }
    if (users) {
      if (typeof users === 'string') {
        users = [users];
      }
      this.access.write = users;
    } else {
      this.access.write = true;
    }
    return this.hoodie.share.update(this.id, {
      access: this.access
    });
  };


  // revoke write access
  // --------------------

  // revoke write access to the share. If one or multiple
  // users passed, only these users' write access gets revoked.
  //
  // examples:
  //
  //     share.revokeWriteAccess()
  //     share.revokeWriteAccess('joe@example.com')
  //     share.revokeWriteAccess(['joe@example.com', 'lisa@example.com'])
  //
  ShareInstance.prototype.revokeWriteAccess = function(users) {
    var idx, user, _i, _len;

    if (this.access.write === undefined) {
      return this.hoodie.resolveWith(this);
    }
    if (users) {
      if (typeof this.access.write === 'boolean') {
        return this.hoodie.rejectWith(this);
      }
      if (typeof users === 'string') {
        users = [users];
      }
      for (_i = 0, _len = users.length; _i < _len; _i++) {
        user = users[_i];
        idx = this.access.write.indexOf(user);
        if (idx !== -1) {
          this.access.write.splice(idx, 1);
        }
      }
      if (this.access.write.length === 0) {
        this.access = this.access.read;
      }
    } else {
      this.access = this.access.read;
    }
    return this.hoodie.share.update(this.id, {
      access: this.access
    });
  };


  // PRIVATE
  // ---------

  // 
  // 
  ShareInstance.prototype._objectBelongsToMe = function(object) {
    return object.$sharedAt === this.id;
  };

  // 
  // 
  ShareInstance.prototype._handleSecurityResponse = function(security) {
    var access, createdBy;
    access = this._parseSecurity(security);
    createdBy = '$subscription';
    return this.hoodie.share.findOrAdd(this.id, {
      access: access,
      createdBy: createdBy
    });
  };


  // a db _security response looks like this:
  //
  //     {
  //       members: {
  //           names: [],
  //           roles: ["1ihhzfy"]
  //       },
  //       writers: {
  //           names: [],
  //           roles: ["1ihhzfy"]
  //       }
  //     }
  //
  // we want to turn it into
  //
  //     {read: true, write: true}
  //
  // given that users ownerHash is "1ihhzfy"
  //
  ShareInstance.prototype._parseSecurity = function(security) {
    var access, read, write, _ref, _ref1;
    read = (_ref = security.members) !== null ? _ref.roles : void 0;
    write = (_ref1 = security.writers) !== null ? _ref1.roles : void 0;
    access = {};

    if (read !== undefined) {
      access.read = read === true || read.length === 0;
      if (read.length) {
        access.read = -1 !== read.indexOf(this.hoodie.account.ownerHash);
      }
    }

    if (write !== undefined) {
      access.write = write === true || write.length === 0;
      if (write.length) {
        access.write = -1 !== write.indexOf(this.hoodie.account.ownerHash);
      }
    }
    return access;
  };

  return ShareInstance;

})(Hoodie.Remote);
