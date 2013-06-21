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

    // cache for CouchDB _users doc
    this._doc = {};

    // map of requestPromises. We maintain this list to avoid sending
    // the same requests several times.
    this._requests = {};

    // init account
    // we've put this into its own method so it's easier to
    // inherit from Hoodie.Account with custom logic
    this.init();
  }

  // Properties
  // ------------
  Account.prototype.username = undefined;

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
  //
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
  //
  // shortcut for `hoodie.on`
  //
  Account.prototype.on = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1account:$2");
    return this.hoodie.on(event, cb);
  };


  // Trigger
  // ---
  //
  // shortcut for `hoodie.trigger`
  //
  Account.prototype.trigger = function() {
    var event, parameters, _ref;

    event = arguments[0],
    parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];

    return this.hoodie.trigger.apply(_ref, ["account:" + event].concat(Array.prototype.slice.call(parameters)));
  };


  // Request
  // ---
  //
  // shortcut for `hoodie.request`
  //
  Account.prototype.request = function(type, path, options) {
    options = options || {};
    return this.hoodie.request.apply(this, arguments);
  };


  // db
  // ----
  //
  // return name of db
  //
  Account.prototype.db = function() {
    return "user/" + this.ownerHash;
  };


  // fetch
  // -------
  //
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
      return self.request('GET', self._url(username)).pipe(null, self._handleRequestError).done(function(response) {
        self._doc = response;
        return self._doc;
      });
    });
  };


  // change password
  // -----------------
  //
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
    return this.fetch().pipe(this._sendChangeUsernameAndPasswordRequest(currentPassword, null, newPassword), this._handleRequestError);
  };


  // reset password
  // ----------------
  //
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
      return self.request('PUT', "/_users/" + (encodeURIComponent(key)), options).pipe(null, self._handleRequestError).done(self._checkPasswordResetStatus);
    });
  };


  // change username
  // -----------------
  //
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
  //
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
  //
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
      return self.request('GET', url, options).pipe(self._handlePasswordResetStatusRequestSuccess, self._handlePasswordResetStatusRequestError).fail(function(error) {
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
      return self.fetch().pipe(self._sendChangeUsernameAndPasswordRequest(currentPassword, newUsername, newPassword));
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
      var data, options;

      // prepare updated _users doc
      data = $.extend({}, self._doc);

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

      options = {
        data: JSON.stringify(data),
        contentType: 'application/json'
      };

      return self._withPreviousRequestsAborted('updateUsersDoc', function() {
        return self.request('PUT', self._url(), options).pipe(self._handleChangeUsernameAndPasswordRequest(newUsername, newPassword || currentPassword), self._handleRequestError);
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
    var _ref;
    if (((_ref = this._requests[name]) !== undefined ? typeof _ref.state === "function" ? _ref.state() : null : null) === 'pending') {
      return this._requests[name];
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


  //
  //
  Account.prototype._now = function() {
    return new Date();
  };

  return Account;

})();
