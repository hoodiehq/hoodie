//  hoodie 0.1.27
'use strict';

window.__bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
},

window.__extends = function(child, parent) {
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

window.Hoodie = window.Hoodie || (function(_super) {

  'use strict';

  function Hoodie(baseUrl) {
    this.baseUrl = baseUrl;
    this._handleCheckConnectionError = __bind(this._handleCheckConnectionError, this);
    this._handleCheckConnectionSuccess = __bind(this._handleCheckConnectionSuccess, this);
    this.rejectWith = __bind(this.rejectWith, this);
    this.resolveWith = __bind(this.resolveWith, this);
    this.reject = __bind(this.reject, this);
    this.resolve = __bind(this.resolve, this);
    this.checkConnection = __bind(this.checkConnection, this);

    this.baseUrl = this.baseUrl ? this.baseUrl.replace(/\/+$/, '') : "/_api";

    this.store = new this.constructor.LocalStore(this);
    this.config = new this.constructor.Config(this);
    this.account = new this.constructor.Account(this);
    this.remote = new this.constructor.AccountRemote(this);
    this._loadExtensions();
    this.checkConnection();
  }

  __extends(Hoodie, _super);

  Hoodie.prototype.online = true;

  Hoodie.prototype.checkConnectionInterval = 30000;

  Hoodie.prototype.request = function(type, url, options) {
    var defaults;
    options = options || {};

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

  Hoodie.prototype._checkConnectionRequest = null;

  Hoodie.prototype.checkConnection = function() {
    var _ref;

    if (((_ref = this._checkConnectionRequest) !== null ? typeof _ref.state === "function" ? _ref.state() : null : null) === 'pending') {
      return this._checkConnectionRequest;
    }
    this._checkConnectionRequest = this.request('GET', '/').pipe(this._handleCheckConnectionSuccess, this._handleCheckConnectionError);
    return this._checkConnectionRequest;
  };

  Hoodie.prototype.open = function(storeName, options) {
    options = options || {};
    $.extend(options, {
      name: storeName
    });
    return new Hoodie.Remote(this, options);
  };

  Hoodie.prototype.uuid = function(len) {
    var chars, i, radix;

    if (len === undefined) {
      len = 7;
    }
    chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
    radix = chars.length;
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

  Hoodie.prototype.defer = $.Deferred;

  Hoodie.prototype.isPromise = function(obj) {
    return typeof (obj !== undefined ? obj.done : null) === 'function' && typeof obj.resolve === 'undefined';
  };

  Hoodie.prototype.resolve = function() {
    return this.defer().resolve().promise();
  };

  Hoodie.prototype.reject = function() {
    return this.defer().reject().promise();
  };

  Hoodie.prototype.resolveWith = function() {
    var _ref;
    return (_ref = this.defer()).resolve.apply(_ref, arguments).promise();
  };

  Hoodie.prototype.rejectWith = function() {
    var _ref;
    return (_ref = this.defer()).reject.apply(_ref, arguments).promise();
  };

  Hoodie.prototype.dispose = function() {
    return this.trigger('dispose');
  };

  Hoodie.extend = function(name, Module) {
    this._extensions = this._extensions || {};
    this._extensions[name] = Module;

    return this._extensions[name];
  };

  Hoodie.prototype.extend = function(name, Module) {
    this[name] = new Module(this);
    return this[name];
  };

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

  Hoodie.prototype._handleCheckConnectionSuccess = function() {
    this.checkConnectionInterval = 30000;

    window.setTimeout(this.checkConnection, this.checkConnectionInterval);

    if (!this.online) {
      this.trigger('reconnected');
      this.online = true;
    }

    return this.defer().resolve();
  };

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


// Hoodie.Account
// ================

// tell something smart in here.
//
//

Hoodie.Account = (function () {

  'use strict';

  function Account(hoodie) {
    this.hoodie = hoodie;

    this._handleChangeUsernameAndPasswordRequest = this._handleChangeUsernameAndPasswordRequest;
    this._sendChangeUsernameAndPasswordRequest = this._sendChangeUsernameAndPasswordRequest;
    this._cleanupAndTriggerSignOut = __bind(this._cleanupAndTriggerSignOut, this);
    this._cleanup = __bind(this._cleanup, this);
    this._handleFetchBeforeDestroyError = __bind(this._handleFetchBeforeDestroyError, this);
    this._handleFetchBeforeDestroySucces = __bind(this._handleFetchBeforeDestroySucces, this);
    this._handlePasswordResetStatusRequestError = __bind(this._handlePasswordResetStatusRequestError, this);
    this._handlePasswordResetStatusRequestSuccess = __bind(this._handlePasswordResetStatusRequestSuccess, this);
    this._checkPasswordResetStatus = __bind(this._checkPasswordResetStatus, this);
    this._handleSignInSuccess = __bind(this._handleSignInSuccess, this);
    this._delayedSignIn = __bind(this._delayedSignIn, this);
    this._handleSignUpSucces = __bind(this._handleSignUpSucces, this);
    this._handleRequestError = __bind(this._handleRequestError, this);
    this._handleAuthenticateRequestSuccess = __bind(this._handleAuthenticateRequestSuccess, this);

    this.fetch = __bind(this.fetch, this);
    this.signOut = __bind(this.signOut, this);
    this.authenticate = __bind(this.authenticate, this);

    // # cache for CouchDB _users doc
    this._doc = {};

    // # map of requestPromises. We maintain this list to avoid sending
    // # the same requests several times.
    this._requests = {};

    // # init account
    // # we've put this into its own method so it's easier to
    // # inherit from Hoodie.Account with custom logic
    this.init();
  }

  // Properties
  // ------------
  Account.prototype.username = undefined;

  Account.prototype.init = function() {
    this.username = this.hoodie.config.get('_account.username');
    this.ownerHash = this.hoodie.config.get('_account.ownerHash');

    if (!this.ownerHash) {
      this._setOwner(this.hoodie.uuid());
    }

    window.setTimeout(this.authenticate);

    return this._checkPasswordResetStatus();
  };

  Account.prototype.authenticate = function() {
    var sendAndHandleAuthRequest, _ref, _ref1, self = this;

    if (this._authenticated === false) {
      return this.hoodie.defer().reject().promise();
    }

    if (this._authenticated === true) {
      return this.hoodie.defer().resolve(this.username).promise();
    }

    if (((_ref = this._requests.signOut) !== undefined ? _ref.state() : null) === 'pending') {
      return this._requests.signOut.then(this.hoodie.rejectWith);
    }

    if (((_ref1 = this._requests.signIn) !== undefined ? _ref1.state() : null) === 'pending') {
      return this._requests.signIn;
    }

    if (this.username === undefined) {
      return this._sendSignOutRequest().then(function() {
        self._authenticated = false;
        return self.hoodie.rejectWith();
      });
    }

    sendAndHandleAuthRequest = function() {
      return self.request('GET', "/_session").pipe(
        self._handleAuthenticateRequestSuccess,
        self._handleRequestError
      );
    };

    return this._withSingleRequest('authenticate', sendAndHandleAuthRequest);
  };

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

  Account.prototype.anonymousSignUp = function() {
    var password, username, self = this;

    password = this.hoodie.uuid(10);
    username = this.ownerHash;

    return this.signUp(username, password).done(function() {
      self.setAnonymousPassword(password);
      return self.trigger('signup:anonymous', username);
    });
  };

  Account.prototype.hasAccount = function() {
    return !!this.username;
  };

  Account.prototype.hasAnonymousAccount = function() {
    return this.getAnonymousPassword() !== undefined;
  };

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

  Account.prototype.signIn = function(username, password) {
    var self = this;

    if (username === null) {
      username = '';
    }

    if (password === undefined) {
      password = '';
    }

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

  Account.prototype.on = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1account:$2");
    return this.hoodie.on(event, cb);
  };

  Account.prototype.trigger = function() {
    var event, parameters, _ref;

    event = arguments[0],
    parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];

    return this.hoodie.trigger.apply(_ref, ["account:" + event].concat(Array.prototype.slice.call(parameters)));
  };

  Account.prototype.request = function(type, path, options) {
    options = options || {};
    return this.hoodie.request.apply(this, arguments);
  };

  Account.prototype.db = function() {
    return "user/" + this.ownerHash;
  };

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
      return self.request('GET', self._url(username)).pipe(null, self._handleRequestError).done(function(response) {
        self._doc = response;
        return self._doc;
      });
    });
  };

  Account.prototype.changePassword = function(currentPassword, newPassword) {
    if (!this.username) {
      return this.hoodie.defer().reject({
        error: "unauthenticated",
        reason: "not logged in"
      }).promise();
    }
    this.hoodie.remote.disconnect();
    return this.fetch().pipe(this._sendChangeUsernameAndPasswordRequest(currentPassword, null, newPassword), this._handleRequestError);
  };

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
      return self.request('PUT', "/_users/" + (encodeURIComponent(key)), options).pipe(null, self._handleRequestError).done(self._checkPasswordResetStatus);
    });
  };

  Account.prototype.changeUsername = function(currentPassword, newUsername) {
    newUsername = newUsername || '';
    return this._changeUsernameAndPassword(currentPassword, newUsername.toLowerCase());
  };

  Account.prototype.destroy = function() {
    if (!this.hasAccount()) {
      return this._cleanupAndTriggerSignOut();
    }
    return this.fetch().pipe(
      this._handleFetchBeforeDestroySucces,
      this._handleFetchBeforeDestroyError
    ).pipe(this._cleanupAndTriggerSignOut);
  };

  Account.prototype._prefix = 'org.couchdb.user';

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
    this.hoodie.config.set('createdBy', this.ownerHash);

    return this.hoodie.config.set('_account.ownerHash', this.ownerHash);
  };

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

  Account.prototype._handleRequestError = function(error) {
    var e, xhr;

    error = error || {};

    if (error.reason) {
      return this.hoodie.defer().reject(error).promise();
    }

    xhr = error;

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

  Account.prototype._handleSignUpSucces = function(username, password) {
    var self = this;
    return function(response) {
      self.trigger('signup', username);
      self._doc._rev = response.rev;
      return self._delayedSignIn(username, password);
    };
  };

  Account.prototype._delayedSignIn = function(username, password, options, defer) {
    var self = this;
    if (!defer) {
      defer = this.hoodie.defer();
    }
    window.setTimeout(function() {
      var promise;
      promise = self._sendSignInRequest(username, password);
      promise.done(defer.resolve);
      return promise.fail(function(error) {
        if (error.error === 'unconfirmed') {
          return self._delayedSignIn(username, password, options, defer);
        } else {
          return defer.reject.apply(defer, arguments);
        }
      });
    }, 300);
    return defer.promise();
  };

  Account.prototype._handleSignInSuccess = function(options) {
    var self = this;
    options = options || {};

    return function(response) {
      var defer, username;

      defer = self.hoodie.defer();
      username = response.name.replace(/^user(_anonymous)?\//, '');

      if (response.roles.indexOf("error") !== -1) {
        self.fetch(username).fail(defer.reject).done(function() {
          return defer.reject({
            error: "error",
            reason: self._doc.$error
          });
        });
        return defer.promise();
      }

      if (response.roles.indexOf("confirmed") === -1) {
        return defer.reject({
          error: "unconfirmed",
          reason: "account has not been confirmed yet"
        });
      }

      self._setUsername(username);
      self._setOwner(response.roles[0]);
      self._authenticated = true;

      if (!(options.silent || options.reauthenticated)) {
        if (self.hasAnonymousAccount()) {
          self.trigger('signin:anonymous', username);
        } else {
          self.trigger('signin', username);
        }
      }
      if (options.reauthenticated) {
        self.trigger('reauthenticated', username);
      }
      self.fetch();
      return defer.resolve(self.username, response.roles[0]);
    };
  };

  Account.prototype._checkPasswordResetStatus = function() {
    var hash, options, resetPasswordId, url, username, self = this;

    resetPasswordId = this.hoodie.config.get('_account.resetPasswordId');

    if (!resetPasswordId) {
      return this.hoodie.defer().reject({
        error: "missing"
      }).promise();
    }

    username = "$passwordReset/" + resetPasswordId;
    url = "/_users/" + (encodeURIComponent("" + this._prefix + ":" + username));
    hash = btoa("" + username + ":" + resetPasswordId);

    options = {
      headers: {
        Authorization: "Basic " + hash
      }
    };

    return this._withPreviousRequestsAborted('passwordResetStatus', function() {
      return self.request('GET', url, options).pipe(self._handlePasswordResetStatusRequestSuccess, self._handlePasswordResetStatusRequestError).fail(function(error) {
        if (error.error === 'pending') {
          window.setTimeout(self._checkPasswordResetStatus, 1000);
          return;
        }
        return self.trigger('password_reset:error');
      });
    });
  };

  Account.prototype._handlePasswordResetStatusRequestSuccess = function(response) {
    var defer;

    defer = this.hoodie.defer();

    if (response.$error) {
      defer.reject(response.$error);
    } else {
      defer.reject({
        error: 'pending'
      });
    }
    return defer.promise();
  };

  Account.prototype._handlePasswordResetStatusRequestError = function(xhr) {
    if (xhr.status === 401) {
      this.hoodie.config.remove('_account.resetPasswordId');
      this.trigger('passwordreset');

      return this.hoodie.defer().resolve();
    } else {
      return this._handleRequestError(xhr);
    }
  };

  Account.prototype._changeUsernameAndPassword = function(currentPassword, newUsername, newPassword) {
    var self = this;
    return this._sendSignInRequest(this.username, currentPassword, {
      silent: true
    }).pipe(function() {
      return self.fetch().pipe(self._sendChangeUsernameAndPasswordRequest(currentPassword, newUsername, newPassword));
    });
  };

  Account.prototype._upgradeAnonymousAccount = function(username, password) {
    var currentPassword, self = this;
    currentPassword = this.getAnonymousPassword();

    return this._changeUsernameAndPassword(currentPassword, username, password).done(function() {
      self.trigger('signup', username);
      self.removeAnonymousPassword();
    });
  };

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

  Account.prototype._handleFetchBeforeDestroyError = function(error) {
    if (error.error === 'not_found') {
      return this.hoodie.defer().resolve().promise();
    } else {
      return this.hoodie.defer().reject(error).promise();
    }
  };

  Account.prototype._cleanup = function(options) {
    options = options || {};

    this.trigger('cleanup');
    this._authenticated = options.authenticated;
    this.hoodie.config.clear();
    this._setUsername(options.username);
    this._setOwner(options.ownerHash || this.hoodie.uuid());

    return this.hoodie.defer().resolve().promise();
  };

  Account.prototype._cleanupAndTriggerSignOut = function() {
    var self = this;
    return this._cleanup().then(function() {
      return self.trigger('signout');
    });
  };

  Account.prototype._userKey = function(username) {
    var prefix;
    if (username === this.ownerHash) {
      prefix = 'user_anonymous';
    } else {
      prefix = 'user';
    }
    return "" + prefix + "/" + username;
  };

  Account.prototype._key = function(username) {
    username = username || this.username;
    return "" + this._prefix + ":" + (this._userKey(username));
  };

  Account.prototype._url = function(username) {
    return "/_users/" + (encodeURIComponent(this._key(username)));
  };

  Account.prototype._sendChangeUsernameAndPasswordRequest = function(currentPassword, newUsername, newPassword) {
    var self = this;

    return function() {
      var data, options;

      data = $.extend({}, self._doc);

      if (newUsername) {
        data.$newUsername = newUsername;
      }

      data.updatedAt = self._now();
      data.signedUpAt = data.signedUpAt || self._now();

      if (newPassword !== null) {
        delete data.salt;
        delete data.password_sha;
        data.password = newPassword;
      }

      options = {
        data: JSON.stringify(data),
        contentType: 'application/json'
      };

      return self._withPreviousRequestsAborted('updateUsersDoc', function() {
        return self.request('PUT', self._url(), options).pipe(self._handleChangeUsernameAndPasswordRequest(newUsername, newPassword || currentPassword), self._handleRequestError);
      });

    };
  };

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

  Account.prototype._withPreviousRequestsAborted = function(name, requestFunction) {
    if (this._requests[name] !== undefined) {
      if (typeof this._requests[name].abort === "function") {
        this._requests[name].abort();
      }
    }
    this._requests[name] = requestFunction();
    return this._requests[name];
  };

  Account.prototype._withSingleRequest = function(name, requestFunction) {
    var _ref;
    if (((_ref = this._requests[name]) !== undefined ? typeof _ref.state === "function" ? _ref.state() : null : null) === 'pending') {
      return this._requests[name];
    }

    this._requests[name] = requestFunction();
    return this._requests[name];
  };

  Account.prototype._sendSignOutRequest = function() {
    var self = this;
    return this._withSingleRequest('signOut', function() {
      return self.request('DELETE', '/_session').pipe(null, self._handleRequestError);
    });
  };

  Account.prototype._sendSignInRequest = function(username, password, options) {
    var requestOptions,
      self = this;
    requestOptions = {
      data: {
        name: this._userKey(username),
        password: password
      }
    };
    return this._withPreviousRequestsAborted('signIn', function() {
      var promise;
      promise = self.request('POST', '/_session', requestOptions);
      return promise.pipe(self._handleSignInSuccess(options), self._handleRequestError);
    });
  };

  Account.prototype._now = function() {
    return new Date();
  };

  return Account;

})();

//
// Central Config API
//

Hoodie.Config = (function() {

  'use strict';

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

  // ## set
  //
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

  // ## get
  //
  // receives a configuration
  //
  Config.prototype.get = function(key) {
    return this.cache[key];
  };

  // ## clear
  //
  // clears cache and removes object from store
  //
  Config.prototype.clear = function() {
    this.cache = {};
    return this.hoodie.store.remove(this.type, this.id);
  };

  // ## remove
  //
  // removes a configuration, is a simple alias for config.set(key, undefined)
  //
  Config.prototype.remove = function(key) {
    return this.set(key, void 0);
  };

  return Config;

})();

//
// Sending emails. Not unicorns
//

Hoodie.Email = (function () {

  'use strict';

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

  // ## send
  //
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

  //
  // ## PRIVATE
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

//
// one place to rule them all!
//

'use strict';

Hoodie.Errors = {

  // ## INVALID_KEY
  //
  // thrown when invalid keys are used to store an object
  //
  INVALID_KEY: function (idOrType) {
    var key = idOrType.id ? 'id' : 'type';

    return new Error("invalid " + key + " '" + idOrType[key] + "': numbers and lowercase letters allowed only");
  },

  // ## INVALID_ARGUMENTS
  //
  INVALID_ARGUMENTS: function (msg) {
    return new Error(msg);
  },

  // ## NOT_FOUND
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

  function Store(hoodie) {
    this.hoodie = hoodie;
  }

  // ## Save

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

  // ## Add

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

  // ## Update

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

  // ## updateAll

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

  // ## find

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

  // ## find or add

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

  // ## findAll

  // returns all objects from store.
  // Can be optionally filtered by a type or a function
  //
  Store.prototype.findAll = function() {
    return this.hoodie.defer();
  };

  // ## Destroy

  // Destroyes one object specified by `type` and `id`.
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

  // ## removeAll

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

  Store.prototype._isValidId = function(key) {
    return new RegExp(/^[^\/]+$/).test(key);
  };

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
// * update(new_properties )
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

var ConnectionError;

Hoodie.Remote = (function(_super) {

  'use strict';

  function Remote(hoodie, options) {
    this.hoodie = hoodie;
    options = options || {};

    this._handlePullResults = __bind(this._handlePullResults, this);
    this._handlePullError = __bind(this._handlePullError, this);
    this._handlePullSuccess = __bind(this._handlePullSuccess, this);
    this._restartPullRequest = __bind(this._restartPullRequest, this);
    this._mapDocsFromFindAll = __bind(this._mapDocsFromFindAll, this);
    this._parseAllFromRemote = __bind(this._parseAllFromRemote, this);
    this._parseFromRemote = __bind(this._parseFromRemote, this);
    this.sync = __bind(this.sync, this);
    this.push = __bind(this.push, this);
    this.pull = __bind(this.pull, this);
    this.disconnect = __bind(this.disconnect, this);
    this.connect = __bind(this.connect, this);

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

    this._knownObjects = {};

    if (this.isConnected()) {
      this.connect();
    }
  }

  __extends(Remote, _super);

  Remote.prototype.name = null;

  Remote.prototype.connected = false;

  Remote.prototype.prefix = '';

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

  Remote.prototype.get = function() {
    return console.log.apply(
      console, [".get() not yet implemented"]
      .concat(Array.prototype.slice.call(arguments))
    );
  };

  Remote.prototype.post = function() {
    return console.log.apply(
      console, [".post() not yet implemented"]
      .concat(Array.prototype.slice.call(arguments))
    );
  };

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
      endkey = startkey.replace(/.$/, function(chars) {
        var charCode;
        charCode = chars.charCodeAt(0);
        return String.fromCharCode(charCode + 1);
      });
      path = "" + path + "&startkey=\"" + (encodeURIComponent(startkey)) + "\"&endkey=\"" + (encodeURIComponent(endkey)) + "\"";
    }
    return this.request("GET", path).pipe(this._mapDocsFromFindAll).pipe(this._parseAllFromRemote);
  };

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

  Remote.prototype.remove = function(type, id) {
    return this.update(type, id, {
      _deleted: true
    });
  };

  Remote.prototype.removeAll = function(type) {
    return this.updateAll(type, {
      _deleted: true
    });
  };

  Remote.prototype.isKnownObject = function(object) {
    var key = "" + object.type + "/" + object.id;

    if (this._knownObjects[key] !== undefined) {
      return this._knownObjects[key];
    }
  };

  Remote.prototype.markAsKnownObject = function(object) {
    var key = "" + object.type + "/" + object.id;
    this._knownObjects[key] = 1;
    return this._knownObjects[key];
  };

  Remote.prototype.connect = function() {
    this.connected = true;
    return this.pull();
  };

  Remote.prototype.disconnect = function() {
    this.connected = false;

    if (this._pullRequest !== undefined) {
      this._pullRequest.abort();
    }

    if (this._pushRequest !== undefined) {
      this._pushRequest.abort();
    }

  };

  Remote.prototype.isConnected = function() {
    return this.connected;
  };

  Remote.prototype.getSinceNr = function() {
    return this._since || 0;
  };

  Remote.prototype.setSinceNr = function(seq) {
    this._since = seq;
    return this._since;
  };

  Remote.prototype.pull = function() {
    this._pullRequest = this.request('GET', this._pullUrl());

    if (this.isConnected()) {
      window.clearTimeout(this._pullRequestTimeout);
      this._pullRequestTimeout = window.setTimeout(this._restartPullRequest, 25000);
    }

    return this._pullRequest.then(this._handlePullSuccess, this._handlePullError);
  };

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
  };

  Remote.prototype.sync = function(objects) {
    return this.push(objects).pipe(this.pull);
  };

  Remote.prototype.on = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1" + this.name + ":$2");
    return this.hoodie.on(event, cb);
  };

  Remote.prototype.one = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1" + this.name + ":$2");
    return this.hoodie.one(event, cb);
  };

  Remote.prototype.trigger = function() {
    var event, parameters, _ref;
    event = arguments[0],
    parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];
    return (_ref = this.hoodie).trigger.apply(_ref, ["" + this.name + ":" + event].concat(Array.prototype.slice.call(parameters)));
  };

  Remote.prototype._validSpecialAttributes = ['_id', '_rev', '_deleted', '_revisions', '_attachments'];

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
    properties._id = "" + properties.type + "/" + properties.id;
    if (this.prefix) {
      properties._id = "" + this.prefix + properties._id;
    }
    delete properties.id;
    return properties;
  };

  Remote.prototype._parseFromRemote = function(object) {
    var id, ignore, _ref;

    id = object._id || object.id;

    delete object._id;

    if (this.prefix) {
      id = id.replace(new RegExp('^' + this.prefix), '');
    }
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

  Remote.prototype._addRevisionTo = function(attributes) {
    var currentRevId, currentRevNr, newRevisionId, _ref;
    try {
      _ref = attributes._rev.split(/-/),
      currentRevNr = _ref[0],
      currentRevId = _ref[1];
    } catch (_error) {}
    currentRevNr = parseInt(currentRevNr, 10) || 0;
    newRevisionId = this._generateNewRevisionId();
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

  Remote.prototype._generateNewRevisionId = function() {
    return this.hoodie.uuid(9);
  };

  Remote.prototype._mapDocsFromFindAll = function(response) {
    return response.rows.map(function(row) {
      return row.doc;
    });
  };

  Remote.prototype._pullUrl = function() {
    var since;
    since = this.getSinceNr();
    if (this.isConnected()) {
      return "/_changes?include_docs=true&since=" + since + "&heartbeat=10000&feed=longpoll";
    } else {
      return "/_changes?include_docs=true&since=" + since;
    }
  };

  Remote.prototype._restartPullRequest = function() {
    if (this._pullRequest) {
      this._pullRequest.abort();
    }
  };

  Remote.prototype._handlePullSuccess = function(response) {
    this.setSinceNr(response.last_seq);
    this._handlePullResults(response.results);
    if (this.isConnected()) {
      return this.pull();
    }
  };

  Remote.prototype._handlePullError = function(xhr, error) {
    if (!this.isConnected()) {
      return;
    }

    switch (xhr.status) {
    case 401:
      this.trigger('error:unauthenticated', error);
      return this.disconnect();
    case 404:
      return window.setTimeout(this.pull, 3000);
    case 500:
      this.trigger('error:server', error);
      window.setTimeout(this.pull, 3000);
      return this.hoodie.checkConnection();
    default:
      if (xhr.statusText === 'abort') {
        return this.pull();
      } else {
        window.setTimeout(this.pull, 3000);
        return this.hoodie.checkConnection();
      }
    }
  };

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

  __extends(ConnectionError, _super);

  ConnectionError.prototype.name = "ConnectionError";

  return ConnectionError;

})(Error);


Hoodie.AccountRemote = (function(_super) {

  'use strict';

  function AccountRemote(hoodie, options) {
    this.hoodie = hoodie;
    options = options || {};
    this._handleSignIn = __bind(this._handleSignIn, this);
    this._connect = __bind(this._connect, this);
    this.push = __bind(this.push, this);
    this.disconnect = __bind(this.disconnect, this);
    this.connect = __bind(this.connect, this);
    this.name = this.hoodie.account.db();
    this.connected = true;
    options.prefix = '';
    this.hoodie.on('account:signin', this._handleSignIn);
    this.hoodie.on('account:reauthenticated', this._connect);
    this.hoodie.on('account:signout', this.disconnect);
    this.hoodie.on('reconnected', this.connect);
    AccountRemote.__super__.constructor.call(this, this.hoodie, options);
    this.bootstrapKnownObjects();
  }

  __extends(AccountRemote, _super);

  AccountRemote.prototype.connected = true;

  AccountRemote.prototype.connect = function() {
    return this.hoodie.account.authenticate().pipe(this._connect);
  };

  AccountRemote.prototype.disconnect = function() {
    this.hoodie.unbind('store:idle', this.push);
    return AccountRemote.__super__.disconnect.apply(this, arguments);
  };

  AccountRemote.prototype.bootstrapKnownObjects = function() {
    var id, key, type, _i, _len, _ref, _ref1, _results = [];
    _ref = this.hoodie.store.index();

    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      _ref1 = key.split(/\//),
      type = _ref1[0],
      id = _ref1[1];

      _results.push(this.markAsKnownObject({
        type: type,
        id: id
      }));
    }
    return _results;
  };

  AccountRemote.prototype.getSinceNr = function() {
    return this.hoodie.config.get('_remote.since') || 0;
  };

  AccountRemote.prototype.setSinceNr = function(since) {
    return this.hoodie.config.set('_remote.since', since);
  };

  AccountRemote.prototype.push = function(objects) {
    if (!this.isConnected()) {
      var error = new window.ConnectionError("Not connected: could not push local changes to remote");
      return this.hoodie.rejectWith(error);
    }

    if (!$.isArray(objects)) {
      objects = this.hoodie.store.changedObjects();
    }

    var promise = AccountRemote.__super__.push.call(this, objects);
    promise.fail(this.hoodie.checkConnection);

    return promise;
  };

  AccountRemote.prototype.on = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1remote:$2");
    return this.hoodie.on(event, cb);
  };

  AccountRemote.prototype.one = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1remote:$2");
    return this.hoodie.one(event, cb);
  };

  AccountRemote.prototype.trigger = function() {
    var event, parameters, _ref;

    event = arguments[0],
    parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];

    return (_ref = this.hoodie).trigger.apply(_ref, ["remote:" + event].concat(Array.prototype.slice.call(parameters)));
  };

  AccountRemote.prototype._connect = function() {
    this.connected = true;
    this.hoodie.on('store:idle', this.push);
    return this.sync();
  };

  AccountRemote.prototype._handleSignIn = function() {
    this.name = this.hoodie.account.db();
    return this._connect();
  };

  return AccountRemote;

})(Hoodie.Remote);

// LocalStore
// ============

// window.localStrage wrapper and more
//
//
//


Hoodie.LocalStore = (function (_super) {

  'use strict';

  function LocalStore(hoodie) {
    this.hoodie = hoodie;
    this._triggerDirtyAndIdleEvents = __bind(this._triggerDirtyAndIdleEvents, this);
    this._handleRemoteChange = __bind(this._handleRemoteChange, this);
    this.clear = __bind(this.clear, this);
    this.markAllAsChanged = __bind(this.markAllAsChanged, this);
    this._cached = {};
    this._dirty = {};
    this._promiseApi = {
      hoodie: this.hoodie
    };
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

  LocalStore.prototype.idleTimeout = 2000;

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

Hoodie.Share = (function () {

  'use strict';

  function Share(hoodie) {
    var api;
    this.hoodie = hoodie;
    this._open = __bind(this._open, this);
    this.instance = Hoodie.ShareInstance;

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

  Share.prototype.find = function (id) {
    var self = this;
    return this.hoodie.store.find('$share', id).pipe(function (object) {
      return new self.instance(self.hoodie, object);
    });
  };

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

  Share.prototype.findOrAdd = function (id, options) {
    var self = this;
    return this.hoodie.store.findOrAdd('$share', id, this._filterShareOptions(options)).pipe(function (object) {
      if (!self.hoodie.account.hasAccount()) {
        self.hoodie.account.anonymousSignUp();
      }
      return new self.instance(self.hoodie, object);
    });
  };

  Share.prototype.save = function (id, options) {
    var self = this;
    return this.hoodie.store.save('$share', id, this._filterShareOptions(options)).pipe(function (object) {
      return new self.instance(self.hoodie, object);
    });
  };

  Share.prototype.update = function (id, changed_options) {
    var self = this;
    return this.hoodie.store.update('$share', id, this._filterShareOptions(changed_options)).pipe(function (object) {
      return new self.instance(self.hoodie, object);
    });
  };

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

  Share.prototype.remove = function (id) {
    this.hoodie.store.findAll(function (obj) {
      return obj.$shares[id];
    }).unshareAt(id);
    return this.hoodie.store.remove('$share', id);
  };

  Share.prototype.removeAll = function () {
    this.hoodie.store.findAll(function (obj) {
      return obj.$shares;
    }).unshare();
    return this.hoodie.store.removeAll('$share');
  };

  Share.prototype._allowedOptions = ["id", "access", "createdBy"];

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

  Share.prototype._open = function (shareId, options) {
    options = options || {};
    $.extend(options, {
      id: shareId
    });
    return new this.instance(this.hoodie, options);
  };

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
    this.api = __bind(this.api, this);
    this.hoodie.store.decoratePromises({
      publish: this._storePublish,
      unpublish: this._storeUnpublish
    });
    return this.api;
  }

  User.prototype.api = function(userHash, options) {
    options = options || {};
    $.extend(options, {
      prefix: '$public'
    });
    return this.hoodie.open("user/" + userHash + "/public", options);
  };

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

Hoodie.ShareInstance = (function(_super) {

  'use strict';

  function ShareInstance(hoodie, options) {
    this.hoodie = hoodie;

    options = options || {};

    this._handleSecurityResponse = __bind(this._handleSecurityResponse, this);
    this._objectBelongsToMe = __bind(this._objectBelongsToMe, this);
    this.id = options.id || this.hoodie.uuid();
    this.name = "share/" + this.id;
    this.prefix = this.name;

    $.extend(this, options);

    ShareInstance.__super__.constructor.apply(this, arguments);
  }

  __extends(ShareInstance, _super);

  ShareInstance.prototype.access = false;

  ShareInstance.prototype.subscribe = function() {
    return this.request('GET', '/_security').pipe(this._handleSecurityResponse);
  };

  ShareInstance.prototype.unsubscribe = function() {
    this.hoodie.share.remove(this.id);
    this.hoodie.store.removeAll(this._objectBelongsToMe, {
      local: true
    });
    return this;
  };

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

  ShareInstance.prototype._objectBelongsToMe = function(object) {
    return object.$sharedAt === this.id;
  };

  ShareInstance.prototype._handleSecurityResponse = function(security) {
    var access, createdBy;
    access = this._parseSecurity(security);
    createdBy = '$subscription';
    return this.hoodie.share.findOrAdd(this.id, {
      access: access,
      createdBy: createdBy
    });
  };

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
