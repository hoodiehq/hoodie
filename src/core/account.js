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
  Account.prototype.username = null;

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
    var sendAndHandleAuthRequest, _ref, _ref1,
      self = this;
    if (this._authenticated === false) {
      return this.hoodie.defer().reject().promise();
    }
    if (this._authenticated === true) {
      return this.hoodie.defer().resolve(this.username).promise();
    }
    if (((_ref = this._requests.signOut) != null ? _ref.state() : void 0) === 'pending') {
      return this._requests.signOut.then(this.hoodie.rejectWith);
    }
    if (((_ref1 = this._requests.signIn) != null ? _ref1.state() : void 0) === 'pending') {
      return this._requests.signIn;
    }
    if (this.username === void 0) {
      return this._sendSignOutRequest().then(function() {
        self._authenticated = false;
        return self.hoodie.rejectWith();
      });
    }
    sendAndHandleAuthRequest = function() {
      return self.request('GET', "/_session").pipe(self._handleAuthenticateRequestSuccess, self._handleRequestError);
    };
    return this._withSingleRequest('authenticate', sendAndHandleAuthRequest);
  };

  Account.prototype.signUp = function(username, password) {
    var options;

    if (password == null) {
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

    options = {
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
    return this.request('PUT', this._url(username), options).pipe(this._handleSignUpSucces(username, password), this._handleRequestError);
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
    return this.username != null;
  };

  Account.prototype.hasAnonymousAccount = function() {
    return this.getAnonymousPassword() != null;
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

    if (password == null) {
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

    if (username == null) {
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
    return this.fetch().pipe(this._handleFetchBeforeDestroySucces, this._handleFetchBeforeDestroyError).pipe(this._cleanupAndTriggerSignOut);
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

      if (~response.roles.indexOf("error")) {
        self.fetch(username).fail(defer.reject).done(function() {
          return defer.reject({
            error: "error",
            reason: self._doc.$error
          });
        });
        return defer.promise();
      }

      if (!~response.roles.indexOf("confirmed")) {
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
    username = username || this.username
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
    var _ref;
    if ((_ref = this._requests[name]) != null) {
      if (typeof _ref.abort === "function") {
        _ref.abort();
      }
    }
    this._requests[name] = requestFunction();
    return this._requests[name];
  };

  Account.prototype._withSingleRequest = function(name, requestFunction) {
    var _ref;
    if (((_ref = this._requests[name]) != null ? typeof _ref.state === "function" ? _ref.state() : null : null) === 'pending') {
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
