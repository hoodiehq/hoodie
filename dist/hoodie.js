!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Hoodie=e():"undefined"!=typeof global?global.Hoodie=e():"undefined"!=typeof self&&(self.Hoodie=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// Hoodie Core
// -------------
//
// the door to world domination (apps)
//

var hoodieAccount = require('./hoodie/account');
var hoodieAccountRemote = require('./hoodie/account_remote');
var hoodieConfig = require('./hoodie/config');
var hoodiePromises = require('./hoodie/promises');
var hoodieRequest = require('./hoodie/request');
var hoodieConnection = require('./hoodie/connection');
var hoodieDispose = require('./hoodie/dispose');
var hoodieOpen = require('./hoodie/open');
var hoodieLocalStore = require('./hoodie/local_store');
var hoodieGenerateId = require('./hoodie/generate_id');
var hoodieTask = require('./hoodie/task');
var hoodieEvents = require('./hoodie/events');

// Constructor
// -------------

// When initializing a hoodie instance, an optional URL
// can be passed. That's the URL of the hoodie backend.
// If no URL passed it defaults to the current domain.
//
//     // init a new hoodie instance
//     hoodie = new Hoodie
//
function Hoodie(baseUrl) {
  var hoodie = this;

  // enforce initialization with `new`
  if (!(hoodie instanceof Hoodie)) {
    throw new Error('usage: new Hoodie(url);');
  }

  if (baseUrl) {
    // remove trailing slashes
    hoodie.baseUrl = baseUrl.replace(/\/+$/, '');
  }


  // hoodie.extend
  // ---------------

  // extend hoodie instance:
  //
  //     hoodie.extend(function(hoodie) {} )
  //
  hoodie.extend = function extend(extension) {
    extension(hoodie);
  };


  //
  // Extending hoodie core
  //

  // * hoodie.bind
  // * hoodie.on
  // * hoodie.one
  // * hoodie.trigger
  // * hoodie.unbind
  // * hoodie.off
  hoodie.extend( hoodieEvents );


  // * hoodie.defer
  // * hoodie.isPromise
  // * hoodie.resolve
  // * hoodie.reject
  // * hoodie.resolveWith
  // * hoodie.rejectWith
  hoodie.extend( hoodiePromises );

  // * hoodie.request
  hoodie.extend( hoodieRequest );

  // * hoodie.isOnline
  // * hoodie.checkConnection
  hoodie.extend( hoodieConnection );

  // * hoodie.uuid
  hoodie.extend( hoodieGenerateId );

  // * hoodie.dispose
  hoodie.extend( hoodieDispose );

  // * hoodie.open
  hoodie.extend( hoodieOpen );

  // * hoodie.store
  hoodie.extend( hoodieLocalStore );

  // * hoodie.task
  hoodie.extend( hoodieTask );

  // * hoodie.config
  hoodie.extend( hoodieConfig );

  // * hoodie.account
  hoodie.extend( hoodieAccount );

  // * hoodie.remote
  hoodie.extend( hoodieAccountRemote );


  //
  // Initializations
  //

  // set username from config (local store)
  hoodie.account.username = hoodie.config.get('_account.username');

  // check for pending password reset
  hoodie.account.checkPasswordReset();

  // clear config on sign out
  hoodie.on('account:signout', hoodie.config.clear);

  // hoodie.store
  hoodie.store.patchIfNotPersistant();
  hoodie.store.subscribeToOutsideEvents();
  hoodie.store.bootstrapDirtyObjects();

  // hoodie.remote
  hoodie.remote.subscribeToOutsideEvents();

  // hoodie.task
  hoodie.task.subscribeToOutsideEvents();

  // authenticate
  // we use a closure to not pass the username to connect, as it
  // would set the name of the remote store, which is not the username.
  hoodie.account.authenticate().then( function( /* username */ ) {
    hoodie.remote.connect();
  });

  // check connection when browser goes online / offline
  window.addEventListener('online', hoodie.checkConnection, false);
  window.addEventListener('offline', hoodie.checkConnection, false);

  // start checking connection
  hoodie.checkConnection();

  //
  // loading user extensions
  //
  applyExtensions(hoodie);
}

// Extending hoodie
// ------------------

// You can extend the Hoodie class like so:
//
// Hoodie.extend(funcion(hoodie) { hoodie.myMagic = function() {} })
//

var extensions = [];

Hoodie.extend = function(extension) {
  extensions.push(extension);
};

//
// detect available extensions and attach to Hoodie Object.
//
function applyExtensions(hoodie) {
  for (var i = 0; i < extensions.length; i++) {
    extensions[i](hoodie);
  }
}

//
// expose Hoodie to module loaders. Based on jQuery's implementation.
//
if ( typeof module === 'object' && module && typeof module.exports === 'object' ) {

  // Expose Hoodie as module.exports in loaders that implement the Node
  // module pattern (including browserify). Do not create the global, since
  // the user will be storing it themselves locally, and globals are frowned
  // upon in the Node module world.
  module.exports = Hoodie;


} else if ( typeof define === 'function' && define.amd ) {

  // Register as a named AMD module, since Hoodie can be concatenated with other
  // files that may use define, but not via a proper concatenation script that
  // understands anonymous AMD modules. A named AMD is safest and most robust
  // way to register. Lowercase hoodie is used because AMD module names are
  // derived from file names, and Hoodie is normally delivered in a lowercase
  // file name.
  define(function () {
    return Hoodie;
  });

} else {

  // set global
  global.Hoodie = Hoodie;
}

},{"./hoodie/account":2,"./hoodie/account_remote":3,"./hoodie/config":4,"./hoodie/connection":5,"./hoodie/dispose":6,"./hoodie/events":10,"./hoodie/generate_id":11,"./hoodie/local_store":12,"./hoodie/open":13,"./hoodie/promises":14,"./hoodie/request":16,"./hoodie/task":19}],2:[function(require,module,exports){
// Hoodie.Account
// ================

var hoodieEvents = require('./events');

//
function hoodieAccount (hoodie) {
  // public API
  var account = {};

  // flag whether user is currently authenticated or not
  var authenticated;

  // cache for CouchDB _users doc
  var userDoc = {};

  // map of requestPromises. We maintain this list to avoid sending
  // the same requests several times.
  var requests = {};

  // default couchDB user doc prefix
  var userDocPrefix = 'org.couchdb.user';

  // add events API
  hoodieEvents(hoodie, { context: account, namespace: 'account'});

  // Authenticate
  // --------------

  // Use this method to assure that the user is authenticated:
  // `hoodie.account.authenticate().done( doSomething ).fail( handleError )`
  //
  account.authenticate = function authenticate() {
    var sendAndHandleAuthRequest;

    // already tried to authenticate, and failed
    if (authenticated === false) {
      return hoodie.reject();
    }

    // already tried to authenticate, and succeeded
    if (authenticated === true) {
      return hoodie.resolveWith(account.username);
    }

    // if there is a pending signOut request, return its promise,
    // but pipe it so that it always ends up rejected
    //
    if (requests.signOut && requests.signOut.state() === 'pending') {
      return requests.signOut.then(hoodie.reject);
    }

    // if there is a pending signIn request, return its promise
    //
    if (requests.signIn && requests.signIn.state() === 'pending') {
      return requests.signIn;
    }

    // if user has no account, make sure to end the session
    if (! account.hasAccount()) {
      return sendSignOutRequest().then(function() {
        authenticated = false;
        return hoodie.reject();
      });
    }

    // send request to check for session status. If there is a
    // pending request already, return its promise.
    //
    sendAndHandleAuthRequest = function() {
      return account.request('GET', '/_session').then(
        handleAuthenticateRequestSuccess
      );
    };

    return withSingleRequest('authenticate', sendAndHandleAuthRequest);
  };


  // hasValidSession
  // -----------------

  // returns true if the user is currently signed but has no valid session,
  // meaning that the data cannot be synchronized.
  //
  account.hasValidSession = function() {
    if (! account.hasAccount()) {
      return false;
    }

    return authenticated === true;
  };


  // hasInvalidSession
  // -----------------

  // returns true if the user is currently signed but has no valid session,
  // meaning that the data cannot be synchronized.
  //
  account.hasInvalidSession = function() {
    if (! account.hasAccount()) {
      return false;
    }

    return authenticated === false;
  };


  // sign up with username & password
  // ----------------------------------

  // uses standard CouchDB API to create a new document in _users db.
  // The backend will automatically create a userDB based on the username
  // address and approve the account by adding a 'confirmed' role to the
  // user doc. The account confirmation might take a while, so we keep trying
  // to sign in with a 300ms timeout.
  //
  account.signUp = function signUp(username, password) {

    if (password === undefined) {
      password = '';
    }

    if (!username) {
      return hoodie.rejectWith('Username must be set.');
    }

    if (account.hasAnonymousAccount()) {
      return upgradeAnonymousAccount(username, password);
    }

    if (account.hasAccount()) {
      return hoodie.rejectWith('Must sign out first.');
    }

    // downcase username
    username = username.toLowerCase();

    var options = {
      data: JSON.stringify({
        _id: userDocKey(username),
        name: userTypeAndId(username),
        type: 'user',
        roles: [],
        password: password,
        ownerHash: account.ownerHash,
        database: account.db(),
        updatedAt: now(),
        createdAt: now(),
        signedUpAt: username !== account.ownerHash ? now() : void 0
      }),
      contentType: 'application/json'
    };

    return account.request('PUT', userDocUrl(username), options).then(
      handleSignUpSuccess(username, password),
      handleSignUpError(username)
    );
  };


  // anonymous sign up
  // -------------------

  // If the user did not sign up himself yet, but data needs to be transfered
  // to the couch, e.g. to send an email or to share data, the anonymousSignUp
  // method can be used. It generates a random password and stores it locally
  // in the browser.
  //
  // If the user signes up for real later, we 'upgrade' his account, meaning we
  // change his username and password internally instead of creating another user.
  //
  account.anonymousSignUp = function anonymousSignUp() {
    var password, username;

    password = hoodie.generateId(10);
    username = account.ownerHash;

    return account.signUp(username, password).done(function() {
      setAnonymousPassword(password);
      return account.trigger('signup:anonymous', username);
    });
  };


  // hasAccount
  // ---------------------

  //
  account.hasAccount = function hasAccount() {
    return !!account.username;
  };


  // hasAnonymousAccount
  // ---------------------

  // anonymous accounts get created when data needs to be
  // synced without the user having an account. That happens
  // automatically when the user creates a task, but can also
  // be done manually using hoodie.account.anonymousSignUp(),
  // e.g. to prevent data loss.
  //
  // To determine between anonymous and "real" accounts, we
  // can compare the username to the ownerHash, which is the
  // same for anonymous accounts.
  account.hasAnonymousAccount = function hasAnonymousAccount() {
    return account.username === account.ownerHash;
  };


  // set / get / remove anonymous password
  // ---------------------------------------

  //
  var anonymousPasswordKey = '_account.anonymousPassword';

  function setAnonymousPassword(password) {
    return hoodie.config.set(anonymousPasswordKey, password);
  }

  function getAnonymousPassword() {
    return hoodie.config.get(anonymousPasswordKey);
  }

  function removeAnonymousPassword() {
    return hoodie.config.unset(anonymousPasswordKey);
  }


  // sign in with username & password
  // ----------------------------------

  // uses standard CouchDB API to create a new user session (POST /_session).
  // Besides the standard sign in we also check if the account has been confirmed
  // (roles include 'confirmed' role).
  //
  // When signing in, by default all local data gets cleared beforehand (with a signOut).
  // Otherwise data that has been created beforehand (authenticated with another user
  // account or anonymously) would be merged into the user account that signs in.
  // That applies only if username isn't the same as current username.
  //
  // To prevent data loss, signIn can be called with options.moveData = true, that wll
  // move all data from the anonymous account to the account the user signed into.
  //
  account.signIn = function signIn(username, password, options) {
    var signOutAndSignIn = function() {
      return account.signOut({
        silent: true
      }).then(function() {
        return sendSignInRequest(username, password);
      });
    };
    var currentData;

    options = options || {};

    if (username === null) {
      username = '';
    }

    if (password === undefined) {
      password = '';
    }

    // downcase
    username = username.toLowerCase();

    if (username !== account.username) {
      if (! options.moveData) {
        return signOutAndSignIn();
      }

      return hoodie.store.findAll()
      .then(function(data) {
        currentData = data;
      })
      .then(signOutAndSignIn)
      .done(function() {
        currentData.forEach(function(object) {
          var type = object.type;

          // ignore the account settings
          if (type === '$config' && object.id === 'hoodie') {
            return;
          }

          delete object.type;
          object.createdBy = hoodie.account.ownerHash;
          hoodie.store.add(type, object);
        });
      });

    } else {
      return sendSignInRequest(username, password, {
        reauthenticated: true
      });
    }
  };


  // sign out
  // ---------

  // uses standard CouchDB API to invalidate a user session (DELETE /_session)
  //
  account.signOut = function signOut(options) {

    options = options || {};

    if (!account.hasAccount()) {
      return cleanup().then(function() {
        if (!options.silent) {
          return account.trigger('signout');
        }
      });
    }

    return pushLocalChanges(options)
    .then(hoodie.remote.disconnect)
    .then(sendSignOutRequest)
    .then(cleanupAndTriggerSignOut);
  };


  // Request
  // ---

  // shortcut for `hoodie.request`
  //
  account.request = function request(type, path, options) {
    options = options || {};
    return hoodie.request.apply(hoodie, arguments);
  };


  // db
  // ----

  // return name of db
  //
  account.db = function db() {
    return 'user/' + account.ownerHash;
  };


  // fetch
  // -------

  // fetches _users doc from CouchDB and caches it in _doc
  //
  account.fetch = function fetch(username) {

    if (username === undefined) {
      username = account.username;
    }

    if (!username) {
      return hoodie.rejectWith({
        name: 'HoodieUnauthorizedError',
        message: 'Not signed in'
      });
    }

    return withSingleRequest('fetch', function() {
      return account.request('GET', userDocUrl(username)).done(function(response) {
        userDoc = response;
        return userDoc;
      });
    });
  };


  // change password
  // -----------------

  // Note: the hoodie API requires the currentPassword for security reasons,
  // but couchDb doesn't require it for a password change, so it's ignored
  // in this implementation of the hoodie API.
  //
  account.changePassword = function changePassword(currentPassword, newPassword) {

    if (!account.username) {
      return hoodie.rejectWith({
        name: 'HoodieUnauthorizedError',
        message: 'Not signed in'
      });
    }

    hoodie.remote.disconnect();

    return account.fetch().then(
      sendChangeUsernameAndPasswordRequest(currentPassword, null, newPassword)
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
  account.resetPassword = function resetPassword(username) {
    var data, key, options, resetPasswordId;

    resetPasswordId = hoodie.config.get('_account.resetPasswordId');

    if (resetPasswordId) {
      return account.checkPasswordReset();
    }

    resetPasswordId = '' + username + '/' + (hoodie.generateId());

    hoodie.config.set('_account.resetPasswordId', resetPasswordId);

    key = '' + userDocPrefix + ':$passwordReset/' + resetPasswordId;

    data = {
      _id: key,
      name: '$passwordReset/' + resetPasswordId,
      type: 'user',
      roles: [],
      password: resetPasswordId,
      createdAt: now(),
      updatedAt: now()
    };

    options = {
      data: JSON.stringify(data),
      contentType: 'application/json'
    };

    // TODO: spec that checkPasswordReset gets executed
    return withPreviousRequestsAborted('resetPassword', function() {
      return account.request('PUT', '/_users/' + (encodeURIComponent(key)), options).done( account.checkPasswordReset )
      .then( awaitPasswordResetResult );
    });
  };

  // checkPasswordReset
  // ---------------------

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
  account.checkPasswordReset = function checkPasswordReset() {
    var hash, options, resetPasswordId, url, username;

    // reject if there is no pending password reset request
    resetPasswordId = hoodie.config.get('_account.resetPasswordId');

    if (!resetPasswordId) {
      return hoodie.rejectWith('No pending password reset.');
    }

    // send request to check status of password reset
    username = '$passwordReset/' + resetPasswordId;
    url = '/_users/' + (encodeURIComponent(userDocPrefix + ':' + username));
    hash = btoa(username + ':' + resetPasswordId);

    options = {
      headers: {
        Authorization: 'Basic ' + hash
      }
    };

    return withPreviousRequestsAborted('passwordResetStatus', function() {
      return account.request('GET', url, options).then(
        handlePasswordResetStatusRequestSuccess,
        handlePasswordResetStatusRequestError
      ).fail(function(error) {
        if (error.name === 'HoodiePendingError') {
          window.setTimeout(account.checkPasswordReset, 1000);
          return;
        }
        return account.trigger('passwordreset:error');
      });
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
  account.changeUsername = function changeUsername(currentPassword, newUsername) {
    newUsername = newUsername || '';
    return changeUsernameAndPassword(currentPassword, newUsername.toLowerCase());
  };


  // destroy
  // ---------

  // destroys a user's account
  //
  account.destroy = function destroy() {
    if (!account.hasAccount()) {
      return cleanupAndTriggerSignOut();
    }

    return account.fetch().then(
      handleFetchBeforeDestroySuccess,
      handleFetchBeforeDestroyError
    ).then(cleanupAndTriggerSignOut);
  };


  //
  // subscribe to events coming outside
  //
  function subscribeToOutsideEvents() {
    hoodie.on('remote:error:unauthenticated', reauthenticate);
  }

  // allow to run this once from outside
  account.subscribeToOutsideEvents = function() {
    subscribeToOutsideEvents();
    delete account.subscribeToOutsideEvents;
  };


  // PRIVATE
  // ---------

  // reauthenticate: force hoodie to reauthenticate
  function reauthenticate () {
    authenticated = undefined;
    return account.authenticate();
  }

  // setters
  function setUsername(newUsername) {
    if (account.username === newUsername) {
      return;
    }

    account.username = newUsername;

    return hoodie.config.set('_account.username', newUsername);
  }

  function setOwner(newOwnerHash) {

    if (account.ownerHash === newOwnerHash) {
      return;
    }

    account.ownerHash = newOwnerHash;

    // `ownerHash` is stored with every new object in the createdBy
    // attribute. It does not get changed once it's set. That's why
    // we have to force it to be change for the `$config/hoodie` object.
    hoodie.config.set('createdBy', newOwnerHash);

    return hoodie.config.set('_account.ownerHash', newOwnerHash);
  }


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
  function handleAuthenticateRequestSuccess(response) {
    if (response.userCtx.name) {
      authenticated = true;
      setUsername(response.userCtx.name.replace(/^user(_anonymous)?\//, ''));
      setOwner(response.userCtx.roles[0]);
      return hoodie.resolveWith(account.username);
    }

    if (account.hasAnonymousAccount()) {
      return account.signIn(account.username, getAnonymousPassword());
    }

    authenticated = false;
    account.trigger('error:unauthenticated');
    return hoodie.reject();
  }


  //
  // handle response of a successful signUp request.
  // Response looks like:
  //
  //     {
  //         'ok': true,
  //         'id': 'org.couchdb.user:joe',
  //         'rev': '1-e8747d9ae9776706da92810b1baa4248'
  //     }
  //
  function handleSignUpSuccess(username, password) {

    return function(response) {
      account.trigger('signup', username);
      userDoc._rev = response.rev;
      return delayedSignIn(username, password);
    };
  }

  //
  // handle response of a failed signUp request.
  //
  // In case of a conflict, reject with "username already exists" error
  // https://github.com/hoodiehq/hoodie.js/issues/174
  // Error passed for hoodie.request looks like this
  //
  //     {
  //         "name": "HoodieConflictError",
  //         "message": "Object already exists."
  //     }
  function handleSignUpError(username) {

    return function(error) {
      if (error.name === 'HoodieConflictError') {
        error.message = 'Username ' + username + ' already exists';
      }
      return hoodie.rejectWith(error);
    };
  }


  //
  // a delayed sign in is used after sign up and after a
  // username change.
  //
  function delayedSignIn(username, password, options, defer) {

    // delayedSignIn might call itself, when the user account
    // is pending. In this case it passes the original defer,
    // to keep a reference and finally resolve / reject it
    // at some point
    if (!defer) {
      defer = hoodie.defer();
    }

    window.setTimeout(function() {
      var promise = sendSignInRequest(username, password);
      promise.done(defer.resolve);
      promise.fail(function(error) {
        if (error.name === 'HoodieAccountUnconfirmedError') {

          // It might take a bit until the account has been confirmed
          delayedSignIn(username, password, options, defer);
        } else {
          defer.reject.apply(defer, arguments);
        }
      });

    }, 300);

    return defer.promise();
  }


  //
  // parse a successful sign in response from couchDB.
  // Response looks like:
  //
  //     {
  //         'ok': true,
  //         'name': 'test1',
  //         'roles': [
  //             'mvu85hy',
  //             'confirmed'
  //         ]
  //     }
  //
  // we want to turn it into 'test1', 'mvu85hy' or reject the promise
  // in case an error occured ('roles' array contains 'error')
  //
  function handleSignInSuccess(options) {
    options = options || {};

    return function(response) {
      var defer, username;

      defer = hoodie.defer();
      username = response.name.replace(/^user(_anonymous)?\//, '');

      //
      // if an error occured, the userDB worker stores it to the $error attribute
      // and adds the 'error' role to the users doc object. If the user has the
      // 'error' role, we need to fetch his _users doc to find out what the error
      // is, before we can reject the promise.
      //
      if (response.roles.indexOf('error') !== -1) {
        account.fetch(username).fail(defer.reject).done(function() {
          return defer.reject(userDoc.$error);
        });
        return defer.promise();
      }

      //
      // When the userDB worker created the database for the user and everthing
      // worked out, it adds the role 'confirmed' to the user. If the role is
      // not present yet, it might be that the worker didn't pick up the the
      // user doc yet, or there was an error. In this cases, we reject the promise
      // with an 'uncofirmed error'
      //
      if (response.roles.indexOf('confirmed') === -1) {
        return defer.reject({
          name: 'HoodieAccountUnconfirmedError',
          message: 'Account has not been confirmed yet'
        });
      }

      setUsername(username);
      setOwner(response.roles[0]);
      authenticated = true;

      //
      // options.verbose is true, when a user manually signed via hoodie.account.signIn().
      // We need to differentiate to other signIn requests, for example right after
      // the signup or after a session timed out.
      //
      if (!(options.silent || options.reauthenticated)) {
        if (account.hasAnonymousAccount()) {
          account.trigger('signin:anonymous', username);
        } else {
          account.trigger('signin', username);
        }
      }

      // user reauthenticated, meaning
      if (options.reauthenticated) {
        account.trigger('reauthenticated', username);
      }

      account.fetch();
      return defer.resolve(username, response.roles[0]);
    };
  }


  //
  // If the request was successful there might have occured an
  // error, which the worker stored in the special $error attribute.
  // If that happens, we return a rejected promise with the error
  // Otherwise reject the promise with a 'pending' error,
  // as we are not waiting for a success full response, but a 401
  // error, indicating that our password was changed and our
  // current session has been invalidated
  //
  function handlePasswordResetStatusRequestSuccess(response) {
    var error;

    if (response.$error) {
      error = response.$error;
    } else {
      error = {
        name: 'HoodiePendingError',
        message: 'Password reset is still pending'
      };
    }
    return hoodie.rejectWith(error);
  }


  //
  // If the error is a 401, it's exactly what we've been waiting for.
  // In this case we resolve the promise.
  //
  function handlePasswordResetStatusRequestError(error) {
    if (error.name === 'HoodieUnauthorizedError') {
      hoodie.config.unset('_account.resetPasswordId');
      account.trigger('passwordreset');

      return hoodie.resolve();
    } else {
      return hoodie.rejectWith(error);
    }
  }


  //
  // wait until a password reset gets either completed or marked as failed
  // and resolve / reject respectively
  //
  function awaitPasswordResetResult() {
    var defer = hoodie.defer();

    account.one('passwordreset', defer.resolve );
    account.one('error:passwordreset', defer.reject );

    // clean up callbacks when either gets called
    defer.always( function() {
      account.unbind('passwordreset', defer.resolve );
      account.unbind('error:passwordreset', defer.reject );
    });

    return defer.promise();
  }


  //
  // change username and password in 3 steps
  //
  // 1. assure we have a valid session
  // 2. update _users doc with new username and new password (if provided)
  // 3. sign in with new credentials to create new sesion.
  //
  function changeUsernameAndPassword(currentPassword, newUsername, newPassword) {

    return sendSignInRequest(account.username, currentPassword, {
      silent: true
    }).then(function() {
      return account.fetch().then(
        sendChangeUsernameAndPasswordRequest(currentPassword, newUsername, newPassword)
      );
    });
  }


  //
  // turn an anonymous account into a real account
  //
  function upgradeAnonymousAccount(username, password) {
    var currentPassword = getAnonymousPassword();

    return changeUsernameAndPassword(currentPassword, username, password).done(function() {
      account.trigger('signup', username);
      removeAnonymousPassword();
    });
  }


  //
  // we now can be sure that we fetched the latest _users doc, so we can update it
  // without a potential conflict error.
  //
  function handleFetchBeforeDestroySuccess() {

    hoodie.remote.disconnect();
    userDoc._deleted = true;

    return withPreviousRequestsAborted('updateUsersDoc', function() {
      account.request('PUT', userDocUrl(), {
        data: JSON.stringify(userDoc),
        contentType: 'application/json'
      });
    });
  }


  //
  // dependend on what kind of error we get, we want to ignore
  // it or not.
  // When we get a 'HoodieNotFoundError' it means that the _users doc habe
  // been removed already, so we don't need to do it anymore, but
  // still want to finish the destroy locally, so we return a
  // resolved promise
  //
  function handleFetchBeforeDestroyError(error) {
    if (error.name === 'HoodieNotFoundError') {
      return hoodie.resolve();
    } else {
      return hoodie.rejectWith(error);
    }
  }

  //
  // remove everything form the current account, so a new account can be initiated.
  //
  function cleanup(options) {
    options = options || {};

    // hoodie.store is listening on this one
    account.trigger('cleanup');
    authenticated = options.authenticated;
    hoodie.config.clear();
    setUsername(options.username);
    setOwner(options.ownerHash || hoodie.generateId());

    return hoodie.resolve();
  }


  //
  function cleanupAndTriggerSignOut() {
    return cleanup().then(function() {
      return account.trigger('signout');
    });
  }


  //
  // depending on wether the user signedUp manually or has been signed up
  // anonymously the prefix in the CouchDB _users doc differentiates.
  // An anonymous user is characterized by its username, that equals
  // its ownerHash (see `anonymousSignUp`)
  //
  // We differentiate with `hasAnonymousAccount()`, because `userTypeAndId`
  // is used within `signUp` method, so we need to be able to differentiate
  // between anonymous and normal users before an account has been created.
  //
  function userTypeAndId(username) {
    var type;

    if (username === account.ownerHash) {
      type = 'user_anonymous';
    } else {
      type = 'user';
    }
    return '' + type + '/' + username;
  }


  //
  // turn a username into a valid _users doc._id
  //
  function userDocKey(username) {
    username = username || account.username;
    return '' + userDocPrefix + ':' + (userTypeAndId(username));
  }

  //
  // get URL of my _users doc
  //
  function userDocUrl(username) {
    return '/_users/' + (encodeURIComponent(userDocKey(username)));
  }


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
  function sendChangeUsernameAndPasswordRequest(currentPassword, newUsername, newPassword) {

    return function() {
      // prepare updated _users doc
      var data = $.extend({}, userDoc);

      if (newUsername) {
        data.$newUsername = newUsername;
      }

      data.updatedAt = now();
      data.signedUpAt = data.signedUpAt || now();

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

      return withPreviousRequestsAborted('updateUsersDoc', function() {
        return account.request('PUT', userDocUrl(), options).then(
          handleChangeUsernameAndPasswordRequest(newUsername, newPassword || currentPassword)
        );
      });

    };
  }


  //
  // depending on whether a newUsername has been passed, we can sign in right away
  // or have to use the delayed sign in to give the username change worker some time
  //
  function handleChangeUsernameAndPasswordRequest(newUsername, newPassword) {

    return function() {
      hoodie.remote.disconnect();

      if (newUsername) {
        return delayedSignIn(newUsername, newPassword, {
          silent: true
        });
      } else {
        return account.signIn(account.username, newPassword);
      }
    };
  }


  //
  // make sure that the same request doesn't get sent twice
  // by cancelling the previous one.
  //
  function withPreviousRequestsAborted(name, requestFunction) {
    if (requests[name] !== undefined) {
      if (typeof requests[name].abort === 'function') {
        requests[name].abort();
      }
    }
    requests[name] = requestFunction();
    return requests[name];
  }


  //
  // if there is a pending request, return its promise instead
  // of sending another request
  //
  function withSingleRequest(name, requestFunction) {

    if (requests[name] !== undefined) {
      if (typeof requests[name].state === 'function') {
        if (requests[name].state() === 'pending') {
          return requests[name];
        }
      }
    }

    requests[name] = requestFunction();
    return requests[name];
  }


  //
  // push local changes when user signs out, unless he enforces sign out
  // in any case with `{ignoreLocalChanges: true}`
  //
  function pushLocalChanges(options) {
    if(hoodie.store.hasLocalChanges() && !options.ignoreLocalChanges) {
      return hoodie.remote.push();
    }
    return hoodie.resolve();
  }

  //
  function sendSignOutRequest() {
    return withSingleRequest('signOut', function() {
      return account.request('DELETE', '/_session');
    });
  }


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
  function sendSignInRequest(username, password, options) {
    var requestOptions = {
      data: {
        name: userTypeAndId(username),
        password: password
      }
    };

    return withPreviousRequestsAborted('signIn', function() {
      var promise = account.request('POST', '/_session', requestOptions);

      return promise.then(
        handleSignInSuccess(options)
      );
    });
  }

  //
  function now() {
    return new Date();
  }

  //
  // expose public account API
  //
  hoodie.account = account;

  // TODO: we should move the owner hash on hoodie core, as
  //       other modules depend on it as well, like hoodie.store.
  // the ownerHash gets stored in every object created by the user.
  // Make sure we have one.
  hoodie.account.ownerHash = hoodie.config.get('_account.ownerHash');
  if (!hoodie.account.ownerHash) {
    setOwner(hoodie.generateId());
  }
}

module.exports = hoodieAccount;

},{"./events":10}],3:[function(require,module,exports){
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

function hoodieRemote (hoodie) {
  // inherit from Hoodies Store API
  var remote = hoodie.open(hoodie.account.db(), {

    // we're always connected to our own db
    connected: true,

    // do not prefix files for my own remote
    prefix: '',

    //
    since: sinceNrCallback,

    //
    defaultObjectsToPush: hoodie.store.changedObjects,

    //
    knownObjects: hoodie.store.index().map( function(key) {
      var typeAndId = key.split(/\//);
      return { type: typeAndId[0], id: typeAndId[1]};
    })
  });

  // Connect
  // ---------

  // we slightly extend the original remote.connect method
  // provided by `hoodieRemoteStore`, to check if the user
  // has an account beforehand. We also hardcode the right
  // name for remote (current user's database name)
  //
  var originalConnectMethod = remote.connect;
  remote.connect = function connect() {
    if (! hoodie.account.hasAccount() ) {
      return hoodie.rejectWith('User has no database to connect to');
    }
    return originalConnectMethod( hoodie.account.db() );
  };

  // trigger
  // ---------

  // proxies to hoodie.trigger
  remote.trigger = function trigger() {
    var eventName;

    eventName = arguments[0];

    var parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];

    return hoodie.trigger.apply(hoodie, ['remote:' + eventName].concat(Array.prototype.slice.call(parameters)));
  };


  // on
  // ---------

  // proxies to hoodie.on
  remote.on = function on(eventName, data) {
    eventName = eventName.replace(/(^| )([^ ]+)/g, '$1'+'remote:$2');
    return hoodie.on(eventName, data);
  };


  // unbind
  // ---------

  // proxies to hoodie.unbind
  remote.unbind = function unbind(eventName, callback) {
    eventName = eventName.replace(/(^| )([^ ]+)/g, '$1'+'remote:$2');
    return hoodie.unbind(eventName, callback);
  };


  // Private
  // ---------

  // getter / setter for since number
  //
  function sinceNrCallback(sinceNr) {
    if (sinceNr) {
      return hoodie.config.set('_remote.since', sinceNr);
    }

    return hoodie.config.get('_remote.since') || 0;
  }

  //
  // subscribe to events coming from outside
  //
  function subscribeToOutsideEvents() {

    hoodie.on('remote:connect', function() {
      hoodie.on('store:idle', remote.push);
      remote.push();
    });

    hoodie.on('remote:disconnect', function() {
      hoodie.unbind('store:idle', remote.push);
    });

    hoodie.on('disconnected', remote.disconnect);
    hoodie.on('reconnected', remote.connect);

    // account events
    hoodie.on('account:signin', remote.connect);
    hoodie.on('account:signin:anonymous', remote.connect);

    hoodie.on('account:reauthenticated', remote.connect);
    hoodie.on('account:signout', remote.disconnect);
  }

  // allow to run this once from outside
  remote.subscribeToOutsideEvents = function() {
    subscribeToOutsideEvents();
    delete remote.subscribeToOutsideEvents;
  };

  //
  // expose remote API
  //
  hoodie.remote = remote;
}

module.exports = hoodieRemote;

},{}],4:[function(require,module,exports){
// Hoodie Config API
// ===================

//
function hoodieConfig(hoodie) {
  var type = '$config';
  var id = 'hoodie';
  var cache = {};

  // public API
  var config = {};


  // set
  // ----------

  // adds a configuration
  //
  config.set = function set(key, value) {
    var isSilent, update;

    if (cache[key] === value) {
      return;
    }

    cache[key] = value;

    update = {};
    update[key] = value;
    isSilent = key.charAt(0) === '_';

    return hoodie.store.updateOrAdd(type, id, update, {
      silent: isSilent
    });
  };

  // get
  // ----------

  // receives a configuration
  //
  config.get = function get(key) {
    return cache[key];
  };

  // clear
  // ----------

  // clears cache and removes object from store
  //
  config.clear = function clear() {
    cache = {};
    return hoodie.store.remove(type, id);
  };

  // unset
  // ----------

  // unsets a configuration, is a simple alias for config.set(key, undefined)
  //
  config.unset = function unset(key) {
    return config.set(key, undefined);
  };

  // load cache
  // TODO: I really don't like this being here. And I don't like that if the
  //       store API will be truly async one day, this will fall on our feet.
  hoodie.store.find(type, id).done(function(obj) {
    cache = obj;
  });

  // exspose public API
  hoodie.config = config;
}

module.exports = hoodieConfig;

},{}],5:[function(require,module,exports){
// hoodie.checkConnection() & hoodie.isConnected()
// =================================================

//
function hoodieConnection(hoodie) {
  // state
  var online = true;
  var checkConnectionInterval = 30000;
  var checkConnectionRequest = null;
  var checkConnectionTimeout = null;

  // Check Connection
  // ------------------

  // the `checkConnection` method is used, well, to check if
  // the hoodie backend is reachable at `baseUrl` or not.
  // Check Connection is automatically called on startup
  // and then each 30 seconds. If it fails, it
  //
  // - sets `online = false`
  // - triggers `offline` event
  // - sets `checkConnectionInterval = 3000`
  //
  // when connection can be reestablished, it
  //
  // - sets `online = true`
  // - triggers `online` event
  // - sets `checkConnectionInterval = 30000`
  //
  hoodie.checkConnection = function checkConnection() {
    var req = checkConnectionRequest;

    if (req && req.state() === 'pending') {
      return req;
    }

    window.clearTimeout(checkConnectionTimeout);

    checkConnectionRequest = hoodie.request('GET', '/').then(
      handleCheckConnectionSuccess,
      handleCheckConnectionError
    );

    return checkConnectionRequest;
  };


  // isConnected
  // -------------

  //
  hoodie.isConnected = function isConnected() {
    return online;
  };


  //
  //
  //
  function handleCheckConnectionSuccess() {
    checkConnectionInterval = 30000;

    checkConnectionTimeout = window.setTimeout(hoodie.checkConnection, checkConnectionInterval);

    if (!hoodie.isConnected()) {
      hoodie.trigger('reconnected');
      online = true;
    }

    return hoodie.resolve();
  }


  //
  //
  //
  function handleCheckConnectionError() {
    checkConnectionInterval = 3000;

    checkConnectionTimeout = window.setTimeout(hoodie.checkConnection, checkConnectionInterval);

    if (hoodie.isConnected()) {
      hoodie.trigger('disconnected');
      online = false;
    }

    return hoodie.reject();
  }
}

module.exports = hoodieConnection;

},{}],6:[function(require,module,exports){
// hoodie.dispose
// ================

function hoodieDispose (hoodie) {

  // if a hoodie instance is not needed anymore, it can
  // be disposed using this method. A `dispose` event
  // gets triggered that the modules react on.
  function dispose() {
    hoodie.trigger('dispose');
    hoodie.unbind();
  }

  //
  // Public API
  //
  hoodie.dispose = dispose;
}

module.exports = hoodieDispose;

},{}],7:[function(require,module,exports){
// Hoodie Error
// -------------

// With the custom hoodie error function
// we normalize all errors the get returned
// when using hoodie.rejectWith
//
// The native JavaScript error method has
// a name & a message property. HoodieError
// requires these, but on top allows for
// unlimited custom properties.
//
// Instead of being initialized with just
// the message, HoodieError expects an
// object with properites. The `message`
// property is required. The name will
// fallback to `error`.
//
// `message` can also contain placeholders
// in the form of `{{propertyName}}`` which
// will get replaced automatically with passed
// extra properties.
//
// ### Error Conventions
//
// We follow JavaScript's native error conventions,
// meaning that error names are camelCase with the
// first letter uppercase as well, and the message
// starting with an uppercase letter.
//
var errorMessageReplacePattern = /\{\{\s*\w+\s*\}\}/g;
var errorMessageFindPropertyPattern = /\w+/;
function HoodieError(properties) {

  // normalize arguments
  if (typeof properties === 'string') {
    properties = {
      message: properties
    };
  }

  if (! properties.message) {
    throw 'FATAL: error.message must be set';
  }

  if (! properties.name) {
    properties.name = 'HoodieError';
  }

  $.extend(this, properties);
  properties.message = properties.message.replace(errorMessageReplacePattern, function(match) {
    var property = match.match(errorMessageFindPropertyPattern)[0];
    return properties[property];
  });
}
HoodieError.prototype = new Error();
HoodieError.prototype.constructor = HoodieError;

module.exports = HoodieError;

},{}],8:[function(require,module,exports){
// Hoodie Invalid Type Or Id Error
// -------------------------------

// only lowercase letters, numbers and dashes
// are allowed for object IDs.
//
var HoodieError = require('../error');

//
function HoodieObjectIdError(properties) {
  properties.name = 'HoodieObjectIdError';
  properties.message = '"{{id}}" is invalid object id. {{rules}}.';

  return new HoodieError(properties);
}
var validIdPattern = /^[a-z0-9\-]+$/;
HoodieObjectIdError.isInvalid = function(id, customPattern) {
  return ! (customPattern || validIdPattern).test(id || '');
};
HoodieObjectIdError.isValid = function(id, customPattern) {
  return (customPattern || validIdPattern).test(id || '');
};
HoodieError.prototype.rules = 'Lowercase letters, numbers and dashes allowed only. Must start with a letter';

module.exports = HoodieObjectIdError;

},{"../error":7}],9:[function(require,module,exports){
// Hoodie Invalid Type Or Id Error
// -------------------------------

// only lowercase letters, numbers and dashes
// are allowed for object types, plus must start
// with a letter.
//
var HoodieError = require('../error');

//
function HoodieObjectTypeError(properties) {
  properties.name = 'HoodieObjectTypeError';
  properties.message = '"{{type}}" is invalid object type. {{rules}}.';

  return new HoodieError(properties);
}
var validTypePattern = /^[a-z$][a-z0-9]+$/;
HoodieObjectTypeError.isInvalid = function(type, customPattern) {
  return ! (customPattern || validTypePattern).test(type || '');
};
HoodieObjectTypeError.isValid = function(type, customPattern) {
  return (customPattern || validTypePattern).test(type || '');
};
HoodieObjectTypeError.prototype.rules = 'lowercase letters, numbers and dashes allowed only. Must start with a letter';

module.exports = HoodieObjectTypeError;

},{"../error":7}],10:[function(require,module,exports){
// Events
// ========
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

// callbacks are global, while the events API is used at several places,
// like hoodie.on / hoodie.store.on / hoodie.task.on etc.
//

function hoodieEvents(hoodie, options) {
  var context = hoodie;
  var namespace = '';

  // normalize options hash
  options = options || {};

  // make sure callbacks hash exists
  if (!hoodie.eventsCallbacks) {
    hoodie.eventsCallbacks = {};
  }

  if (options.context) {
    context = options.context;
    namespace = options.namespace + ':';
  }

  // Bind
  // ------
  //
  // bind a callback to an event triggerd by the object
  //
  //     object.bind 'cheat', blame
  //
  function bind(ev, callback) {
    var evs, name, _i, _len;

    evs = ev.split(' ');

    for (_i = 0, _len = evs.length; _i < _len; _i++) {
      name = namespace + evs[_i];
      hoodie.eventsCallbacks[name] = hoodie.eventsCallbacks[name] || [];
      hoodie.eventsCallbacks[name].push(callback);
    }
  }

  // one
  // -----
  //
  // same as `bind`, but does get executed only once
  //
  //     object.one 'groundTouch', gameOver
  //
  function one(ev, callback) {
    ev = namespace + ev;
    var wrapper = function() {
      hoodie.unbind(ev, wrapper);
      callback.apply(null, arguments);
    };
    hoodie.bind(ev, wrapper);
  }

  // trigger
  // ---------
  //
  // trigger an event and pass optional parameters for binding.
  //     object.trigger 'win', score: 1230
  //
  function trigger() {
    var args, callback, ev, list, _i, _len;

    args = 1 <= arguments.length ? Array.prototype.slice.call(arguments, 0) : [];
    ev = args.shift();
    ev = namespace + ev;
    list = hoodie.eventsCallbacks[ev];

    if (!list) {
      return;
    }

    for (_i = 0, _len = list.length; _i < _len; _i++) {
      callback = list[_i];
      callback.apply(null, args);
    }

    return true;
  }

  // unbind
  // --------
  //
  // unbind to from all bindings, from all bindings of a specific event
  // or from a specific binding.
  //
  //     object.unbind()
  //     object.unbind 'move'
  //     object.unbind 'move', follow
  //
  function unbind(ev, callback) {
    var cb, i, list, _i, _len, evNames;

    if (!ev) {
      if (!namespace) {
        hoodie.eventsCallbacks = {};
      }

      evNames = Object.keys(hoodie.eventsCallbacks);
      evNames = evNames.filter(function(key) {
        return key.indexOf(namespace) === 0;
      });
      evNames.forEach(function(key) {
        delete hoodie.eventsCallbacks[key];
      });

      return;
    }

    ev = namespace + ev;

    list = hoodie.eventsCallbacks[ev];

    if (!list) {
      return;
    }

    if (!callback) {
      delete hoodie.eventsCallbacks[ev];
      return;
    }

    for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
      cb = list[i];


      if (cb !== callback) {
        continue;
      }

      list = list.slice();
      list.splice(i, 1);
      hoodie.eventsCallbacks[ev] = list;
      break;
    }

    return;
  }

  context.bind = bind;
  context.on = bind;
  context.one = one;
  context.trigger = trigger;
  context.unbind = unbind;
  context.off = unbind;
}

module.exports = hoodieEvents;

},{}],11:[function(require,module,exports){
// hoodie.generateId
// =============

// helper to generate unique ids.
function hoodieGenerateId (hoodie) {
  var chars, i, radix;

  // uuids consist of numbers and lowercase letters only.
  // We stick to lowercase letters to prevent confusion
  // and to prevent issues with CouchDB, e.g. database
  // names do wonly allow for lowercase letters.
  chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
  radix = chars.length;


  function generateId(length) {
    var id = '';

    // default uuid length to 7
    if (length === undefined) {
      length = 7;
    }

    for (i = 0; i < length; i++) {
      var rand = Math.random() * radix;
      var char = chars[Math.floor(rand)];
      id += String(char).charAt(0);
    }

    return id;
  }

  //
  // Public API
  //
  hoodie.generateId = generateId;
}

module.exports = hoodieGenerateId;

},{}],12:[function(require,module,exports){
// LocalStore
// ============

//
var hoodieStoreApi = require('./store');
var HoodieObjectTypeError = require('./error/object_type');
var HoodieObjectIdError = require('./error/object_id');

//
function hoodieStore (hoodie) {

  var localStore = {};

  //
  // state
  // -------
  //

  // cache of localStorage for quicker access
  var cachedObject = {};

  // map of dirty objects by their ids
  var dirty = {};

  // queue of method calls done during bootstrapping
  var queue = [];

  // 2 seconds timout before triggering the `store:idle` event
  //
  var idleTimeout = 2000;




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
  localStore.save = function save(object, options) {
    var currentObject, defer, error, event, isNew, key;

    options = options || {};

    // if store is currently bootstrapping data from remote,
    // we're queueing local saves until it's finished.
    if (store.isBootstrapping() && !options.remote) {
      return enqueue('save', arguments);
    }

    // generate an id if necessary
    if (object.id) {
      currentObject = cache(object.type, object.id);
      isNew = typeof currentObject !== 'object';
    } else {
      isNew = true;
      object.id = hoodie.generateId();
    }

    if (isNew) {
      // add createdBy hash
      object.createdBy = object.createdBy || hoodie.account.ownerHash;
    }
    else {
      // leave createdBy hash
      if (currentObject.createdBy) {
        object.createdBy = currentObject.createdBy;
      }
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
      object._syncedAt = now();
    } else if (!options.silent) {
      object.updatedAt = now();
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

    defer = hoodie.defer();

    try {
      object = cache(object.type, object.id, object, options);
      defer.resolve(object, isNew).promise();
      event = isNew ? 'add' : 'update';
      triggerEvents(event, object, options);
    } catch (_error) {
      error = _error;
      defer.reject(error.toString());
    }

    return defer.promise();
  };


  // find
  // ------

  // loads one object from Store, specified by `type` and `id`
  //
  // example usage:
  //
  //     store.find('car', 'abc4567')
  localStore.find = function(type, id) {
    var error, object;

    // if store is currently bootstrapping data from remote,
    // we're queueing until it's finished
    if (store.isBootstrapping()) {
      return enqueue('find', arguments);
    }

    try {
      object = cache(type, id);
      if (!object) {
        return hoodie.rejectWith({
          name: 'HoodieNotFoundError',
          message: '"{{type}}" with id "{{id}}" could not be found'
        });
      }
      return hoodie.resolveWith(object);
    } catch (_error) {
      error = _error;
      return hoodie.rejectWith(error);
    }
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
  localStore.findAll = function findAll(filter) {
    var currentType, defer, error, id, key, keys, obj, results, type;



    if (filter == null) {
      filter = function() {
        return true;
      };
    }

    // if store is currently bootstrapping data from remote,
    // we're queueing until it's finished
    if (store.isBootstrapping()) {
      return enqueue('findAll', arguments);
    }

    keys = store.index();

    // normalize filter
    if (typeof filter === 'string') {
      type = filter;
      filter = function(obj) {
        return obj.type === type;
      };
    }

    defer = hoodie.defer();

    try {

      //
      results = (function() {
        var _i, _len, _ref, _results;
        _results = [];
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          key = keys[_i];
          if (!(isSemanticKey(key))) {
            continue;
          }
          _ref = key.split('/'),
          currentType = _ref[0],
          id = _ref[1];

          obj = cache(currentType, id);
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
    return defer.promise();
  };


  // Remove
  // --------

  // Removes one object specified by `type` and `id`.
  //
  // when object has been synced before, mark it as deleted.
  // Otherwise remove it from Store.
  localStore.remove = function remove(type, id, options) {
    var key, object, objectWasMarkedAsDeleted;

    options = options || {};

    // if store is currently bootstrapping data from remote,
    // we're queueing local removes until it's finished.
    if (store.isBootstrapping() && !options.remote) {
      return enqueue('remove', arguments);
    }

    key = type + '/' + id;

    object = cache(type, id);

    // if change comes from remote, just clean up locally
    if (options.remote) {
      db.removeItem(key);
      objectWasMarkedAsDeleted = cachedObject[key] && isMarkedAsDeleted(cachedObject[key]);
      cachedObject[key] = false;
      clearChanged(type, id);
      if (objectWasMarkedAsDeleted && object) {
        return hoodie.resolveWith(object);
      }
    }

    if (!object) {
      return hoodie.rejectWith({
        name: 'HoodieNotFoundError',
        message: '"{{type}}" with id "{{id}}"" could not be found'
      });
    }

    if (object._syncedAt) {
      object._deleted = true;
      cache(type, id, object);
    } else {
      key = type + '/' + id;
      db.removeItem(key);
      cachedObject[key] = false;
      clearChanged(type, id);
    }

    // https://github.com/hoodiehq/hoodie.js/issues/147
    if (options.update) {
      object = options.update;
      delete options.update;
    }
    triggerEvents('remove', object, options);
    return hoodie.resolveWith(object);
  };


  // Remove all
  // ----------

  // Removes one object specified by `type` and `id`.
  //
  // when object has been synced before, mark it as deleted.
  // Otherwise remove it from Store.
  localStore.removeAll = function removeAll(type, options) {
    return store.findAll(type).then(function(objects) {
      var object, _i, _len, results;

      results = [];

      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        results.push(store.remove(object.type, object.id, options));
      }
      return results;
    });
  };


  // validate
  // ----------

  //
  function validate (object) {

    if (HoodieObjectTypeError.isInvalid(object.type)) {
      return new HoodieObjectTypeError({
        type: object.type
      });
    }

    if (arguments.length > 0 && HoodieObjectIdError.isInvalid(object.id)) {
      return new HoodieObjectIdError({
        id: object.id
      });
    }
  }

  var store = hoodieStoreApi(hoodie, {

    // validate
    validate: validate,

    backend: {
      save: localStore.save,
      find: localStore.find,
      findAll: localStore.findAll,
      remove: localStore.remove,
      removeAll: localStore.removeAll,
    }
  });



  // extended public API
  // ---------------------


  // index
  // -------

  // object key index
  // TODO: make this cachy
  store.index = function index() {
    var i, key, keys, _i, _ref;
    keys = [];
    for (i = _i = 0, _ref = db.length(); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      key = db.key(i);
      if (isSemanticKey(key)) {
        keys.push(key);
      }
    }
    return keys;
  };


  // changed objects
  // -----------------

  // returns an Array of all dirty documents
  store.changedObjects = function changedObjects() {
    var id, key, object, type, _ref, _ref1, _results;

    _ref = dirty;
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
  store.hasLocalChanges = function(type, id) {
    if (!type) {
      return !$.isEmptyObject(dirty);
    }
    var key = [type,id].join('/');
    if (dirty[key]) {
      return true;
    }
    return hasLocalChanges(cache(type, id));
  };


  // Clear
  // ------

  // clears localStorage and cache
  // TODO: do not clear entire localStorage, clear only the items that have been stored
  //       using `hoodie.store` before.
  store.clear = function clear() {
    var defer, key, keys, results;
    defer = hoodie.defer();
    try {
      keys = store.index();
      results = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          key = keys[_i];
          if (isSemanticKey(key)) {
            _results.push(db.removeItem(key));
          }
        }
        return _results;
      }).call(this);
      cachedObject = {};
      clearChanged();
      defer.resolve();
      store.trigger('clear');
    } catch (_error) {
      defer.reject(_error);
    }
    return defer.promise();
  };


  // isBootstrapping
  // -----------------

  // returns true if store is currently bootstrapping data from remote,
  // otherwise false.
  var bootstrapping = false;
  store.isBootstrapping = function isBootstrapping() {
    return bootstrapping;
  };


  // Is persistant?
  // ----------------

  // returns `true` or `false` depending on whether localStorage is supported or not.
  // Beware that some browsers like Safari do not support localStorage in private mode.
  //
  // inspired by this cappuccino commit
  // https://github.com/cappuccino/cappuccino/commit/063b05d9643c35b303568a28809e4eb3224f71ec
  //
  store.isPersistent = function isPersistent() {
    try {

      // we've to put this in here. I've seen Firefox throwing `Security error: 1000`
      // when cookies have been disabled
      if (!window.localStorage) {
        return false;
      }

      // Just because localStorage exists does not mean it works. In particular it might be disabled
      // as it is when Safari's private browsing mode is active.
      localStorage.setItem('Storage-Test', '1');

      // that should not happen ...
      if (localStorage.getItem('Storage-Test') !== '1') {
        return false;
      }

      // okay, let's clean up if we got here.
      localStorage.removeItem('Storage-Test');
    } catch (_error) {

      // in case of an error, like Safari's Private Mode, return false
      return false;
    }

    // we're good.
    return true;
  };




  //
  // Private methods
  // -----------------
  //


  // localStorage proxy
  //
  var db = {
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
    }
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
  function cache(type, id, object, options) {
    var key;

    if (object === undefined) {
      object = false;
    }

    options = options || {};
    key = '' + type + '/' + id;

    if (object) {
      $.extend(object, {
        type: type,
        id: id
      });

      setObject(type, id, object);

      if (options.remote) {
        clearChanged(type, id);
        cachedObject[key] = $.extend(true, {}, object);
        return cachedObject[key];
      }

    } else {

      // if the cached key returns false, it means
      // that we have removed that key. We just
      // set it to false for performance reasons, so
      // that we don't need to look it up again in localStorage
      if (cachedObject[key] === false) {
        return false;
      }

      // if key is cached, return it. But make sure
      // to make a deep copy beforehand (=> true)
      if (cachedObject[key]) {
        return $.extend(true, {}, cachedObject[key]);
      }

      // if object is not yet cached, load it from localStore
      object = getObject(type, id);

      // stop here if object did not exist in localStore
      // and cache it so we don't need to look it up again
      if (object === false) {
        clearChanged(type, id);
        cachedObject[key] = false;
        return false;
      }

    }

    if (isMarkedAsDeleted(object)) {
      markAsChanged(type, id, object, options);
      cachedObject[key] = false;
      return false;
    }

    // here is where we cache the object for
    // future quick access
    cachedObject[key] = $.extend(true, {}, object);

    if (hasLocalChanges(object)) {
      markAsChanged(type, id, cachedObject[key], options);
    } else {
      clearChanged(type, id);
    }

    return $.extend(true, {}, object);
  }


  // bootstrapping dirty objects, to make sure
  // that removed objects get pushed after
  // page reload.
  //
  function bootstrapDirtyObjects() {
    var id, keys, obj, type, _i, _len, _ref;
    keys = db.getItem('_dirty');

    if (!keys) {
      return;
    }

    keys = keys.split(',');
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      _ref = keys[_i].split('/'),
      type = _ref[0],
      id = _ref[1];
      obj = cache(type, id);
    }
  }


  //
  // subscribe to events coming from account & our remote store.
  //
  function subscribeToOutsideEvents() {

    // account events
    hoodie.on('account:cleanup', store.clear);
    hoodie.on('account:signup', markAllAsChanged);
    hoodie.on('remote:bootstrap:start', startBootstrappingMode);
    hoodie.on('remote:bootstrap:end', endBootstrappingMode);

    // remote events
    hoodie.on('remote:change', handleRemoteChange);
    hoodie.on('remote:push', handlePushedObject);
  }

  // allow to run this once from outside
  store.subscribeToOutsideEvents = function() {
    subscribeToOutsideEvents();
    delete store.subscribeToOutsideEvents;
  };


  //
  // Marks object as changed (dirty). Triggers a `store:dirty` event immediately and a
  // `store:idle` event once there is no change within 2 seconds
  //
  function markAsChanged(type, id, object, options) {
    var key;

    options = options || {};
    key = '' + type + '/' + id;

    dirty[key] = object;
    saveDirtyIds();

    if (options.silent) {
      return;
    }

    triggerDirtyAndIdleEvents();
  }

  // Clear changed
  // ---------------

  // removes an object from the list of objects that are flagged to by synched (dirty)
  // and triggers a `store:dirty` event
  function clearChanged(type, id) {
    var key;
    if (type && id) {
      key = '' + type + '/' + id;
      delete dirty[key];
    } else {
      dirty = {};
    }
    saveDirtyIds();
    return window.clearTimeout(dirtyTimeout);
  }


  // Mark all as changed
  // ------------------------

  // Marks all local object as changed (dirty) to make them sync
  // with remote
  function markAllAsChanged() {
    return store.findAll().pipe(function(objects) {
      var key, object, _i, _len;

      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        key = '' + object.type + '/' + object.id;
        dirty[key] = object;
      }

      saveDirtyIds();
      triggerDirtyAndIdleEvents();
    });
  }


  // when a change come's from our remote store, we differentiate
  // whether an object has been removed or added / updated and
  // reflect the change in our local store.
  function handleRemoteChange(typeOfChange, object) {
    if (typeOfChange === 'remove') {
      store.remove(object.type, object.id, {
        remote: true,
        update: object
      });
    } else {
      store.save(object.type, object.id, object, {
        remote: true
      });
    }
  }


  //
  // all local changes get bulk pushed. For each object with local
  // changes that has been pushed we  trigger a sync event
  function handlePushedObject(object) {
    triggerEvents('sync', object);
  }


  // more advanced localStorage wrappers to find/save objects
  function setObject(type, id, object) {
    var key, store;

    key = '' + type + '/' + id;
    store = $.extend({}, object);

    delete store.type;
    delete store.id;
    return db.setItem(key, JSON.stringify(store));
  }
  function getObject(type, id) {
    var key, obj;

    key = '' + type + '/' + id;
    var json = db.getItem(key);

    if (json) {
      obj = JSON.parse(json);
      obj.type = type;
      obj.id = id;
      return obj;
    } else {
      return false;
    }
  }


  // store IDs of dirty objects
  function saveDirtyIds() {
    try {
      if ($.isEmptyObject(dirty)) {
        db.removeItem('_dirty');
      } else {
        var ids = Object.keys(dirty);
        db.setItem('_dirty', ids.join(','));
      }
    } catch(e) {}
  }

  //
  function now() {
    return JSON.stringify(new Date()).replace(/['"]/g, '');
  }


  // a semantic key consists of a valid type & id, separated by a "/"
  var semanticIdPattern = new RegExp(/^[a-z$][a-z0-9]+\/[a-z0-9]+$/);
  function isSemanticKey(key) {
    return semanticIdPattern.test(key);
  }

  // `hasLocalChanges` returns true if there is a local change that
  // has not been sync'd yet.
  function hasLocalChanges(object) {
    if (!object.updatedAt) {
      return false;
    }
    if (!object._syncedAt) {
      return true;
    }
    return object._syncedAt < object.updatedAt;
  }

  //
  function isMarkedAsDeleted(object) {
    return object._deleted === true;
  }

  // this is where all the store events get triggered,
  // like add:task, change:note:abc4567, remove, etc.
  function triggerEvents(eventName, object, options) {
    store.trigger(eventName, $.extend(true, {}, object), options);
    store.trigger(object.type + ':' + eventName, $.extend(true, {}, object), options);

    // DEPRECATED
    // https://github.com/hoodiehq/hoodie.js/issues/146
    store.trigger(eventName + ':' + object.type, $.extend(true, {}, object), options);

    if (eventName !== 'new') {
      store.trigger( object.type + ':' + object.id+ ':' + eventName, $.extend(true, {}, object), options);

      // DEPRECATED
      // https://github.com/hoodiehq/hoodie.js/issues/146
      store.trigger( eventName + ':' + object.type + ':' + object.id, $.extend(true, {}, object), options);
    }



    // sync events have no changes, so we don't trigger
    // "change" events.
    if (eventName === 'sync') {
      return;
    }

    store.trigger('change', eventName, $.extend(true, {}, object), options);
    store.trigger(object.type + ':change', eventName, $.extend(true, {}, object), options);

    // DEPRECATED
    // https://github.com/hoodiehq/hoodie.js/issues/146
    store.trigger('change:' + object.type, eventName, $.extend(true, {}, object), options);


    if (eventName !== 'new') {
      store.trigger(object.type + ':' + object.id + ':change', eventName, $.extend(true, {}, object), options);

      // DEPRECATED
      // https://github.com/hoodiehq/hoodie.js/issues/146
      store.trigger('change:' + object.type + ':' + object.id, eventName, $.extend(true, {}, object), options);
    }
  }

  // when an object gets changed, two special events get triggerd:
  //
  // 1. dirty event
  //    the `dirty` event gets triggered immediately, for every
  //    change that happens.
  // 2. idle event
  //    the `idle` event gets triggered after a short timeout of
  //    no changes, e.g. 2 seconds.
  var dirtyTimeout;
  function triggerDirtyAndIdleEvents() {
    store.trigger('dirty');
    window.clearTimeout(dirtyTimeout);

    dirtyTimeout = window.setTimeout(function() {
      store.trigger('idle', store.changedObjects());
    }, idleTimeout);
  }

  //
  function startBootstrappingMode() {
    bootstrapping = true;
    store.trigger('bootstrap:start');
  }

  //
  function endBootstrappingMode() {
    var methodCall, method, args, defer;

    bootstrapping = false;
    while(queue.length > 0) {
      methodCall = queue.shift();
      method = methodCall[0];
      args = methodCall[1];
      defer = methodCall[2];
      localStore[method].apply(localStore, args).then(defer.resolve, defer.reject);
    }

    store.trigger('bootstrap:end');
  }

  //
  function enqueue(method, args) {
    var defer = hoodie.defer();
    queue.push([method, args, defer]);
    return defer.promise();
  }

  //
  // patchIfNotPersistant
  //
  function patchIfNotPersistant () {
    if (!store.isPersistent()) {
      db = {
        getItem: function() { return null; },
        setItem: function() { return null; },
        removeItem: function() { return null; },
        key: function() { return null; },
        length: function() { return 0; }
      };
    }
  }


  //
  // initialization
  // ----------------
  //

  // if browser does not support local storage persistence,
  // e.g. Safari in private mode, overite the respective methods.



  //
  // expose public API
  //
  // inherit from Hoodies Store API
  hoodie.store = store;

  // allow to run this once from outside
  store.bootstrapDirtyObjects = function() {
    bootstrapDirtyObjects();
    delete store.bootstrapDirtyObjects;
  };

  // allow to run this once from outside
  store.patchIfNotPersistant = function() {
    patchIfNotPersistant();
    delete store.patchIfNotPersistant;
  };
}

module.exports = hoodieStore;

},{"./error/object_id":8,"./error/object_type":9,"./store":18}],13:[function(require,module,exports){
// Open stores
// -------------

var hoodieRemoteStore = require('./remote_store');

function hoodieOpen(hoodie) {
  var $extend = window.jQuery.extend;

  // generic method to open a store. Used by
  //
  // * hoodie.remote
  // * hoodie.user("joe")
  // * hoodie.global
  // * ... and more
  //
  //     hoodie.open("some_store_name").findAll()
  //
  function open(storeName, options) {
    options = options || {};

    $extend(options, {
      name: storeName
    });

    return hoodieRemoteStore(hoodie, options);
  }

  //
  // Public API
  //
  hoodie.open = open;
}

module.exports = hoodieOpen;

},{"./remote_store":15}],14:[function(require,module,exports){
// Hoodie Defers / Promises
// ------------------------

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
var HoodieError = require('./error');

//
function hoodiePromises (hoodie) {
  var $defer = window.jQuery.Deferred;

  // returns true if passed object is a promise (but not a deferred),
  // otherwise false.
  function isPromise(object) {
    return !! (object &&
               typeof object.done === 'function' &&
               typeof object.resolve !== 'function');
  }

  //
  function resolve() {
    return $defer().resolve().promise();
  }


  //
  function reject() {
    return $defer().reject().promise();
  }


  //
  function resolveWith() {
    var _defer = $defer();
    return _defer.resolve.apply(_defer, arguments).promise();
  }

  //
  function rejectWith(errorProperties) {
    var _defer = $defer();
    var error = new HoodieError(errorProperties);
    return _defer.reject(error).promise();
  }

  //
  // Public API
  //
  hoodie.defer = $defer;
  hoodie.isPromise = isPromise;
  hoodie.resolve = resolve;
  hoodie.reject = reject;
  hoodie.resolveWith = resolveWith;
  hoodie.rejectWith = rejectWith;
}

module.exports = hoodiePromises;

},{"./error":7}],15:[function(require,module,exports){
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
var hoodieStoreApi = require('./store');

//
function hoodieRemoteStore (hoodie, options) {

  var remoteStore = {};


  // Remote Store Persistance methods
  // ----------------------------------

  // find
  // ------

  // find one object
  //
  remoteStore.find = function find(type, id) {
    var path;

    path = type + '/' + id;

    if (remote.prefix) {
      path = remote.prefix + path;
    }

    path = '/' + encodeURIComponent(path);

    return remote.request('GET', path).then(parseFromRemote);
  };


  // findAll
  // ---------

  // find all objects, can be filetered by a type
  //
  remoteStore.findAll = function findAll(type) {
    var endkey, path, startkey;

    path = '/_all_docs?include_docs=true';

    switch (true) {
    case (type !== undefined) && remote.prefix !== '':
      startkey = remote.prefix + type + '/';
      break;
    case type !== undefined:
      startkey = type + '/';
      break;
    case remote.prefix !== '':
      startkey = remote.prefix;
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
      path = '' + path + '&startkey="' + (encodeURIComponent(startkey)) + '"&endkey="' + (encodeURIComponent(endkey)) + '"';
    }

    return remote.request('GET', path).then(mapDocsFromFindAll).then(parseAllFromRemote);
  };


  // save
  // ------

  // save a new object. If it existed before, all properties
  // will be overwritten
  //
  remoteStore.save = function save(object) {
    var path;

    if (!object.id) {
      object.id = hoodie.generateId();
    }

    object = parseForRemote(object);
    path = '/' + encodeURIComponent(object._id);
    return remote.request('PUT', path, {
      data: object
    });
  };


  // remove
  // ---------

  // remove one object
  //
  remoteStore.remove = function remove(type, id) {
    return remote.update(type, id, {
      _deleted: true
    });
  };


  // removeAll
  // ------------

  // remove all objects, can be filtered by type
  //
  remoteStore.removeAll = function removeAll(type) {
    return remote.updateAll(type, {
      _deleted: true
    });
  };


  var remote = hoodieStoreApi(hoodie, {

    name: options.name,

    backend: {
      save: remoteStore.save,
      find: remoteStore.find,
      findAll: remoteStore.findAll,
      remove: remoteStore.remove,
      removeAll: remoteStore.removeAll
    }
  });





  // properties
  // ------------

  // name

  // the name of the Remote is the name of the
  // CouchDB database and is also used to prefix
  // triggered events
  //
  var remoteName = null;


  // sync

  // if set to true, updates will be continuously pulled
  // and pushed. Alternatively, `sync` can be set to
  // `pull: true` or `push: true`.
  //
  remote.connected = false;


  // prefix

  // prefix for docs in a CouchDB database, e.g. all docs
  // in public user stores are prefixed by '$public/'
  //
  remote.prefix = '';
  var remotePrefixPattern = new RegExp('^');


  // defaults
  // ----------------

  //
  if (options.name !== undefined) {
    remoteName = options.name;
  }

  if (options.prefix !== undefined) {
    remote.prefix = options.prefix;
    remotePrefixPattern = new RegExp('^' + remote.prefix);
  }

  if (options.baseUrl !== null) {
    remote.baseUrl = options.baseUrl;
  }


  // request
  // ---------

  // wrapper for hoodie.request, with some store specific defaults
  // and a prefixed path
  //
  remote.request = function request(type, path, options) {
    options = options || {};

    if (remoteName) {
      path = '/' + (encodeURIComponent(remoteName)) + path;
    }

    if (remote.baseUrl) {
      path = '' + remote.baseUrl + path;
    }

    options.contentType = options.contentType || 'application/json';

    if (type === 'POST' || type === 'PUT') {
      options.dataType = options.dataType || 'json';
      options.processData = options.processData || false;
      options.data = JSON.stringify(options.data);
    }
    return hoodie.request(type, path, options);
  };


  // isKnownObject
  // ---------------

  // determine between a known and a new object
  //
  remote.isKnownObject = function isKnownObject(object) {
    var key = '' + object.type + '/' + object.id;

    if (knownObjects[key] !== undefined) {
      return knownObjects[key];
    }
  };


  // markAsKnownObject
  // -------------------

  // determine between a known and a new object
  //
  remote.markAsKnownObject = function markAsKnownObject(object) {
    var key = '' + object.type + '/' + object.id;
    knownObjects[key] = 1;
    return knownObjects[key];
  };


  // synchronization
  // -----------------

  // Connect
  // ---------

  // start syncing. `remote.bootstrap()` will automatically start
  // pulling when `remote.connected` remains true.
  //
  remote.connect = function connect(name) {
    if (name) {
      remoteName = name;
    }
    remote.connected = true;
    remote.trigger('connect');
    return remote.bootstrap().then( function() { remote.push(); } );
  };


  // Disconnect
  // ------------

  // stop syncing changes from remote store
  //
  remote.disconnect = function disconnect() {
    remote.connected = false;
    remote.trigger('disconnect'); // TODO: spec that

    if (pullRequest) {
      pullRequest.abort();
    }

    if (pushRequest) {
      pushRequest.abort();
    }

  };


  // isConnected
  // -------------

  //
  remote.isConnected = function isConnected() {
    return remote.connected;
  };


  // getSinceNr
  // ------------

  // returns the sequence number from wich to start to find changes in pull
  //
  var since = options.since || 0; // TODO: spec that!
  remote.getSinceNr = function getSinceNr() {
    if (typeof since === 'function') {
      return since();
    }

    return since;
  };


  // bootstrap
  // -----------

  // inital pull of data of the remote store. By default, we pull all
  // changes since the beginning, but this behavior might be adjusted,
  // e.g for a filtered bootstrap.
  //
  var isBootstrapping = false;
  remote.bootstrap = function bootstrap() {
    isBootstrapping = true;
    remote.trigger('bootstrap:start');
    return remote.pull().done( handleBootstrapSuccess );
  };


  // pull changes
  // --------------

  // a.k.a. make a GET request to CouchDB's `_changes` feed.
  // We currently make long poll requests, that we manually abort
  // and restart each 25 seconds.
  //
  var pullRequest, pullRequestTimeout;
  remote.pull = function pull() {
    pullRequest = remote.request('GET', pullUrl());

    if (remote.isConnected()) {
      window.clearTimeout(pullRequestTimeout);
      pullRequestTimeout = window.setTimeout(restartPullRequest, 25000);
    }

    return pullRequest.done(handlePullSuccess).fail(handlePullError);
  };


  // push changes
  // --------------

  // Push objects to remote store using the `_bulk_docs` API.
  //
  var pushRequest;
  remote.push = function push(objects) {
    var object, objectsForRemote, _i, _len;

    if (!$.isArray(objects)) {
      objects = defaultObjectsToPush();
    }

    if (objects.length === 0) {
      return hoodie.resolveWith([]);
    }

    objectsForRemote = [];

    for (_i = 0, _len = objects.length; _i < _len; _i++) {

      // don't mess with original objects
      object = $.extend(true, {}, objects[_i]);
      addRevisionTo(object);
      object = parseForRemote(object);
      objectsForRemote.push(object);
    }
    pushRequest = remote.request('POST', '/_bulk_docs', {
      data: {
        docs: objectsForRemote,
        new_edits: false
      }
    });

    pushRequest.done(function() {
      for (var i = 0; i < objects.length; i++) {
        remote.trigger('push', objects[i]);
      }
    });
    return pushRequest;
  };

  // sync changes
  // --------------

  // push objects, then pull updates.
  //
  remote.sync = function sync(objects) {
    return remote.push(objects).then(remote.pull);
  };

  //
  // Private
  // ---------
  //

  // in order to differentiate whether an object from remote should trigger a 'new'
  // or an 'update' event, we store a hash of known objects
  var knownObjects = {};


  // valid CouchDB doc attributes starting with an underscore
  //
  var validSpecialAttributes = ['_id', '_rev', '_deleted', '_revisions', '_attachments'];


  // default objects to push
  // --------------------------

  // when pushed without passing any objects, the objects returned from
  // this method will be passed. It can be overwritten by passing an
  // array of objects or a function as `options.objects`
  //
  var defaultObjectsToPush = function defaultObjectsToPush() {
    return [];
  };
  if (options.defaultObjectsToPush) {
    if ($.isArray(options.defaultObjectsToPush)) {
      defaultObjectsToPush = function defaultObjectsToPush() {
        return options.defaultObjectsToPush;
      };
    } else {
      defaultObjectsToPush = options.defaultObjectsToPush;
    }
  }


  // setSinceNr
  // ------------

  // sets the sequence number from wich to start to find changes in pull.
  // If remote store was initialized with since : function(nr) { ... },
  // call the function with the seq passed. Otherwise simply set the seq
  // number and return it.
  //
  function setSinceNr(seq) {
    if (typeof since === 'function') {
      return since(seq);
    }

    since = seq;
    return since;
  }


  // Parse for remote
  // ------------------

  // parse object for remote storage. All properties starting with an
  // `underscore` do not get synchronized despite the special properties
  // `_id`, `_rev` and `_deleted` (see above)
  //
  // Also `id` gets replaced with `_id` which consists of type & id
  //
  function parseForRemote(object) {
    var attr, properties;
    properties = $.extend({}, object);

    for (attr in properties) {
      if (properties.hasOwnProperty(attr)) {
        if (validSpecialAttributes.indexOf(attr) !== -1) {
          continue;
        }
        if (!/^_/.test(attr)) {
          continue;
        }
        delete properties[attr];
      }
    }

    // prepare CouchDB id
    properties._id = '' + properties.type + '/' + properties.id;
    if (remote.prefix) {
      properties._id = '' + remote.prefix + properties._id;
    }
    delete properties.id;
    return properties;
  }


  // ### _parseFromRemote

  // normalize objects coming from remote
  //
  // renames `_id` attribute to `id` and removes the type from the id,
  // e.g. `type/123` -> `123`
  //
  function parseFromRemote(object) {
    var id, ignore, _ref;

    // handle id and type
    id = object._id || object.id;
    delete object._id;

    if (remote.prefix) {
      id = id.replace(remotePrefixPattern, '');
      // id = id.replace(new RegExp('^' + remote.prefix), '');
    }

    // turn doc/123 into type = doc & id = 123
    // NOTE: we don't use a simple id.split(/\//) here,
    // as in some cases IDs might contain '/', too
    //
    _ref = id.match(/([^\/]+)\/(.*)/),
    ignore = _ref[0],
    object.type = _ref[1],
    object.id = _ref[2];

    return object;
  }

  function parseAllFromRemote(objects) {
    var object, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      object = objects[_i];
      _results.push(parseFromRemote(object));
    }
    return _results;
  }


  // ### _addRevisionTo

  // extends passed object with a _rev property
  //
  function addRevisionTo(attributes) {
    var currentRevId, currentRevNr, newRevisionId, _ref;
    try {
      _ref = attributes._rev.split(/-/),
      currentRevNr = _ref[0],
      currentRevId = _ref[1];
    } catch (_error) {}
    currentRevNr = parseInt(currentRevNr, 10) || 0;
    newRevisionId = generateNewRevisionId();

    // local changes are not meant to be replicated outside of the
    // users database, therefore the `-local` suffix.
    if (attributes._$local) {
      newRevisionId += '-local';
    }

    attributes._rev = '' + (currentRevNr + 1) + '-' + newRevisionId;
    attributes._revisions = {
      start: 1,
      ids: [newRevisionId]
    };

    if (currentRevId) {
      attributes._revisions.start += currentRevNr;
      return attributes._revisions.ids.push(currentRevId);
    }
  }


  // ### generate new revision id

  //
  function generateNewRevisionId() {
    return hoodie.generateId(9);
  }


  // ### map docs from findAll

  //
  function mapDocsFromFindAll(response) {
    return response.rows.map(function(row) {
      return row.doc;
    });
  }


  // ### pull url

  // Depending on whether remote is connected (= pulling changes continuously)
  // return a longpoll URL or not. If it is a beginning bootstrap request, do
  // not return a longpoll URL, as we want it to finish right away, even if there
  // are no changes on remote.
  //
  function pullUrl() {
    var since;
    since = remote.getSinceNr();
    if (remote.isConnected() && !isBootstrapping) {
      return '/_changes?include_docs=true&since=' + since + '&heartbeat=10000&feed=longpoll';
    } else {
      return '/_changes?include_docs=true&since=' + since;
    }
  }


  // ### restart pull request

  // request gets restarted automaticcally
  // when aborted (see handlePullError)
  function restartPullRequest() {
    if (pullRequest) {
      pullRequest.abort();
    }
  }


  // ### pull success handler

  // request gets restarted automaticcally
  // when aborted (see handlePullError)
  //
  function handlePullSuccess(response) {
    setSinceNr(response.last_seq);
    handlePullResults(response.results);
    if (remote.isConnected()) {
      return remote.pull();
    }
  }


  // ### pull error handler

  // when there is a change, trigger event,
  // then check for another change
  //
  function handlePullError(xhr, error) {
    if (!remote.isConnected()) {
      return;
    }

    switch (xhr.status) {
      // Session is invalid. User is still login, but needs to reauthenticate
      // before sync can be continued
    case 401:
      remote.trigger('error:unauthenticated', error);
      return remote.disconnect();

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
      return window.setTimeout(remote.pull, 3000);

    case 500:
      //
      // Please server, don't give us these. At least not persistently
      //
      remote.trigger('error:server', error);
      window.setTimeout(remote.pull, 3000);
      return hoodie.checkConnection();
    default:
      // usually a 0, which stands for timeout or server not reachable.
      if (xhr.statusText === 'abort') {
        // manual abort after 25sec. restart pulling changes directly when connected
        return remote.pull();
      } else {

        // oops. This might be caused by an unreachable server.
        // Or the server cancelled it for what ever reason, e.g.
        // heroku kills the request after ~30s.
        // we'll try again after a 3s timeout
        //
        window.setTimeout(remote.pull, 3000);
        return hoodie.checkConnection();
      }
    }
  }


  // ### handle changes from remote
  //
  function handleBootstrapSuccess() {
    isBootstrapping = false;
    remote.trigger('bootstrap:end');
  }

  // ### handle changes from remote
  //
  function handlePullResults(changes) {
    var doc, event, object, _i, _len;

    for (_i = 0, _len = changes.length; _i < _len; _i++) {
      doc = changes[_i].doc;

      if (remote.prefix && doc._id.indexOf(remote.prefix) !== 0) {
        continue;
      }

      object = parseFromRemote(doc);

      if (object._deleted) {
        if (!remote.isKnownObject(object)) {
          continue;
        }
        event = 'remove';
        remote.isKnownObject(object);
      } else {
        if (remote.isKnownObject(object)) {
          event = 'update';
        } else {
          event = 'add';
          remote.markAsKnownObject(object);
        }
      }

      remote.trigger(event, object);
      remote.trigger(event + ':' + object.type, object);
      remote.trigger(event + ':' + object.type + ':' + object.id, object);
      remote.trigger('change', event, object);
      remote.trigger('change:' + object.type, event, object);
      remote.trigger('change:' + object.type + ':' + object.id, event, object);
    }
  }


  // bootstrap known objects
  //
  if (options.knownObjects) {
    for (var i = 0; i < options.knownObjects.length; i++) {
      remote.markAsKnownObject({
        type: options.knownObjects[i].type,
        id: options.knownObjects[i].id
      });
    }
  }


  // expose public API
  return remote;
}

module.exports = hoodieRemoteStore;

},{"./store":18}],16:[function(require,module,exports){
//
// hoodie.request
// ================

// Hoodie's central place to send request to its backend.
// At the moment, it's a wrapper around jQuery's ajax method,
// but we might get rid of this dependency in the future.
//
// It has build in support for CORS and a standard error
// handling that normalizes errors returned by CouchDB
// to JavaScript's nativ conventions of errors having
// a name & a message property.
//
// Common errors to expect:
//
// * HoodieRequestError
// * HoodieUnauthorizedError
// * HoodieConflictError
// * HoodieServerError
//
function hoodieRequest(hoodie) {
  var $extend = $.extend;
  var $ajax = $.ajax;

  // Hoodie backend listents to requests prefixed by /_api,
  // so we prefix all requests with relative URLs
  var API_PATH = '/_api';

  // Requests
  // ----------

  // sends requests to the hoodie backend.
  //
  //     promise = hoodie.request('GET', '/user_database/doc_id')
  //
  function request(type, url, options) {
    var defaults, requestPromise, pipedPromise;

    options = options || {};

    defaults = {
      type: type,
      dataType: 'json'
    };

    // if absolute path passed, set CORS headers

    // if relative path passed, prefix with baseUrl
    if (!/^http/.test(url)) {
      url = (hoodie.baseUrl || '') + API_PATH + url;
    }

    // if url is cross domain, set CORS headers
    if (/^http/.test(url)) {
      defaults.xhrFields = {
        withCredentials: true
      };
      defaults.crossDomain = true;
    }

    defaults.url = url;


    // we are piping the result of the request to return a nicer
    // error if the request cannot reach the server at all.
    // We can't return the promise of ajax directly because of
    // the piping, as for whatever reason the returned promise
    // does not have the `abort` method any more, maybe others
    // as well. See also http://bugs.jquery.com/ticket/14104
    requestPromise = $ajax($extend(defaults, options));
    pipedPromise = requestPromise.then( null, handleRequestError);
    pipedPromise.abort = requestPromise.abort;

    return pipedPromise;
  }

  //
  //
  //
  function handleRequestError(xhr) {
    var error;

    try {
      error = parseErrorFromResponse(xhr);
    } catch (_error) {

      if (xhr.responseText) {
        error = xhr.responseText;
      } else {
        error = {
          name: 'HoodieConnectionError',
          message: 'Could not connect to Hoodie server at {{url}}.',
          url: hoodie.baseUrl || '/'
        };
      }
    }

    return hoodie.rejectWith(error).promise();
  }

  //
  // CouchDB returns errors in JSON format, with the properties
  // `error` and `reason`. Hoodie uses JavaScript's native Error
  // properties `name` and `message` instead, so we are normalizing
  // that.
  //
  // Besides the renaming we also do a matching with a map of known
  // errors to make them more clear. For reference, see
  // https://wiki.apache.org/couchdb/Default_http_errors &
  // https://github.com/apache/couchdb/blob/master/src/couchdb/couch_httpd.erl#L807
  //

  function parseErrorFromResponse(xhr) {
    var error = JSON.parse(xhr.responseText);

    // get error name
    error.name = HTTP_STATUS_ERROR_MAP[xhr.status];
    if (! error.name) {
      error.name = hoodiefyRequestErrorName(error.error);
    }

    // store status & message
    error.status = xhr.status;
    error.message = error.reason || '';
    error.message = error.message.charAt(0).toUpperCase() + error.message.slice(1);

    // cleanup
    delete error.error;
    delete error.reason;

    return error;
  }

  // map CouchDB HTTP status codes to Hoodie Errors
  var HTTP_STATUS_ERROR_MAP = {
    400: 'HoodieRequestError', // bad request
    401: 'HoodieUnauthorizedError',
    403: 'HoodieRequestError', // forbidden
    404: 'HoodieNotFoundError', // forbidden
    409: 'HoodieConflictError',
    412: 'HoodieConflictError', // file exist
    500: 'HoodieServerError'
  };


  function hoodiefyRequestErrorName(name) {
    name = name.replace(/(^\w|_\w)/g, function (match) {
      return (match[1] || match[0]).toUpperCase();
    });
    return 'Hoodie' + name + 'Error';
  }


  //
  // public API
  //
  hoodie.request = request;
}

module.exports = hoodieRequest;

},{}],17:[function(require,module,exports){
// scoped Store
// ============

// same as store, but with type preset to an initially
// passed value.
//
var hoodieEvents = require('./events');

//
function hoodieScopedTask(hoodie, taskApi, options) {

  var type = options.type;
  var id = options.id;

  var api = {};

  // scoped by type only
  if (!id) {

    // add events
    hoodieEvents(hoodie, {
      context: api,
      namespace: 'task:' + type
    });

    //
    api.start = function start(properties) {
      return taskApi.start(type, properties);
    };

    //
    api.cancel = function cancel(id) {
      return taskApi.cancel(type, id);
    };

    //
    api.restart = function restart(id, update) {
      return taskApi.restart(type, id, update);
    };

    //
    api.cancelAll = function cancelAll() {
      return taskApi.cancelAll(type);
    };

    //
    api.restartAll = function restartAll(update) {
      return taskApi.restartAll(type, update);
    };
  }

  // scoped by both: type & id
  if (id) {

    // add events
    hoodieEvents(hoodie, {
      context: api,
      namespace: 'task:' + type + ':' + id
    });

    //
    api.cancel = function cancel() {
      return taskApi.cancel(type, id);
    };

    //
    api.restart = function restart(update) {
      return taskApi.restart(type, id, update);
    };
  }

  return api;
}

module.exports = hoodieScopedTask;

},{"./events":10}],18:[function(require,module,exports){
// Store
// ============

// This class defines the API that hoodie.store (local store) and hoodie.open
// (remote store) implement to assure a coherent API. It also implements some
// basic validations.
//
// The returned API provides the following methods:
//
// * validate
// * save
// * add
// * find
// * findOrAdd
// * findAll
// * update
// * updateAll
// * remove
// * removeAll
// * decoratePromises
// * trigger
// * on
// * unbind
//
// At the same time, the returned API can be called as function returning a
// store scoped by the passed type, for example
//
//     var taskStore = hoodie.store('task');
//     taskStore.findAll().then( showAllTasks );
//     taskStore.update('id123', {done: true});
//
var hoodieScopedStoreApi = require('./store');
var hoodieEvents = require('./events');
var HoodieError = require('./error');
var HoodieObjectTypeError = require('./error/object_type');
var HoodieObjectIdError = require('./error/object_id');

//
function hoodieStoreApi(hoodie, options) {

  // persistance logic
  var backend = {};

  // extend this property with extra functions that will be available
  // on all promises returned by hoodie.store API. It has a reference
  // to current hoodie instance by default
  var promiseApi = {
    hoodie: hoodie
  };

  // name
  var storeName = options.name || 'store';

  // public API
  var api = function api(type, id) {
    var scopedOptions = $.extend(true, {type: type, id: id}, options);
    return hoodieScopedStoreApi(hoodie, api, scopedOptions);
  };

  // add event API
  hoodieEvents(hoodie, { context: api, namespace: storeName });


  // Validate
  // --------------

  // by default, we only check for a valid type & id.
  // the validate method can be overwriten by passing
  // options.validate
  //
  // if `validate` returns nothing, the passed object is
  // valid. Otherwise it returns an error
  //
  api.validate = options.validate;

  if (!options.validate) {
    api.validate = function(object /*, options */) {

      if (!object) {
        return new HoodieError({
          name: 'InvalidObjectError',
          message: 'No object passed.'
        });
      }
      if (HoodieObjectTypeError.isInvalid(object.type, validIdOrTypePattern)) {
        return new HoodieObjectTypeError({
          type: object.type,
          rules: validIdOrTypeRules
        });
      }

      if (!object.id) {
        return;
      }

      if (HoodieObjectIdError.isInvalid(object.id, validIdOrTypePattern)) {
        return new HoodieObjectIdError({
          id: object.id,
          rules: validIdOrTypeRules
        });
      }
    };
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
  api.save = function save(type, id, properties, options) {

    if ( options ) {
      options = $.extend(true, {}, options);
    } else {
      options = {};
    }

    // don't mess with passed object
    var object = $.extend(true, {}, properties, {type: type, id: id});

    // validations
    var error = api.validate(object, options || {});
    if(error) { return hoodie.rejectWith(error); }

    return decoratePromise( backend.save(object, options || {}) );
  };


  // Add
  // -------------------

  // `.add` is an alias for `.save`, with the difference that there is no id argument.
  // Internally it simply calls `.save(type, undefined, object).
  //
  api.add = function add(type, properties, options) {

    if (properties === undefined) {
      properties = {};
    }

    options = options || {};
    return api.save(type, properties.id, properties, options);
  };


  // find
  // ------

  //
  api.find = function find(type, id) {

    return decoratePromise( backend.find(type, id) );
  };


  // find or add
  // -------------

  // 1. Try to find a share by given id
  // 2. If share could be found, return it
  // 3. If not, add one and return it.
  //
  api.findOrAdd = function findOrAdd(type, id, properties) {

    if (properties === null) {
      properties = {};
    }

    function handleNotFound() {
      var newProperties;
      newProperties = $.extend(true, {
        id: id
      }, properties);
      return api.add(type, newProperties);
    }

    // promise decorations get lost when piped through `then`,
    // that's why we need to decorate the find's promise again.
    var promise = api.find(type, id).then(null, handleNotFound);
    return decoratePromise( promise );
  };


  // findAll
  // ------------

  // returns all objects from store.
  // Can be optionally filtered by a type or a function
  //
  api.findAll = function findAll(type, options) {

    return decoratePromise( backend.findAll(type, options) );
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
  api.update = function update(type, id, objectUpdate, options) {

    function handleFound(currentObject) {
      var changedProperties, newObj, value;

      // normalize input
      newObj = $.extend(true, {}, currentObject);

      if (typeof objectUpdate === 'function') {
        objectUpdate = objectUpdate(newObj);
      }

      if (!objectUpdate) {
        return hoodie.resolveWith(currentObject);
      }

      // check if something changed
      changedProperties = (function() {
        var _results = [];

        for (var key in objectUpdate) {
          if (objectUpdate.hasOwnProperty(key)) {
            value = objectUpdate[key];
            if ((currentObject[key] !== value) === false) {
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
        return hoodie.resolveWith(newObj);
      }

      //apply update
      return api.save(type, id, newObj, options);
    }

    // promise decorations get lost when piped through `then`,
    // that's why we need to decorate the find's promise again.
    var promise = api.find(type, id).then(handleFound);
    return decoratePromise( promise );
  };


  // updateOrAdd
  // -------------

  // same as `.update()`, but in case the object cannot be found,
  // it gets created
  //
  api.updateOrAdd = function updateOrAdd(type, id, objectUpdate, options) {
    function handleNotFound() {
      var properties = $.extend(true, {}, objectUpdate, {id: id});
      return api.add(type, properties, options);
    }

    var promise = api.update(type, id, objectUpdate, options).then(null, handleNotFound);
    return decoratePromise( promise );
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
  api.updateAll = function updateAll(filterOrObjects, objectUpdate, options) {
    var promise;

    options = options || {};

    // normalize the input: make sure we have all objects
    switch (true) {
    case typeof filterOrObjects === 'string':
      promise = api.findAll(filterOrObjects);
      break;
    case hoodie.isPromise(filterOrObjects):
      promise = filterOrObjects;
      break;
    case $.isArray(filterOrObjects):
      promise = hoodie.defer().resolve(filterOrObjects).promise();
      break;
    default: // e.g. null, update all
      promise = api.findAll();
    }

    promise = promise.then(function(objects) {
      // now we update all objects one by one and return a promise
      // that will be resolved once all updates have been finished
      var object, _updatePromises;

      if (!$.isArray(objects)) {
        objects = [objects];
      }

      _updatePromises = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          _results.push(api.update(object.type, object.id, objectUpdate, options));
        }
        return _results;
      })();

      return $.when.apply(null, _updatePromises);
    });

    return decoratePromise( promise );
  };


  // Remove
  // ------------

  // Removes one object specified by `type` and `id`.
  //
  // when object has been synced before, mark it as deleted.
  // Otherwise remove it from Store.
  //
  api.remove = function remove(type, id, options) {
    return decoratePromise( backend.remove(type, id, options || {}) );
  };


  // removeAll
  // -----------

  // Destroye all objects. Can be filtered by a type
  //
  api.removeAll = function removeAll(type, options) {
    return decoratePromise( backend.removeAll(type, options || {}) );
  };


  // decorate promises
  // -------------------

  // extend promises returned by store.api
  api.decoratePromises = function decoratePromises(methods) {
    return $.extend(promiseApi, methods);
  };



  // required backend methods
  // -------------------------
  if (!options.backend ) {
    throw new Error('options.backend must be passed');
  }

  var required = 'save find findAll remove removeAll'.split(' ');

  required.forEach( function(methodName) {

    if (!options.backend[methodName]) {
      throw new Error('options.backend.'+methodName+' must be passed.');
    }

    backend[methodName] = options.backend[methodName];
  });


  // Private
  // ---------

  // / not allowed for id
  var validIdOrTypePattern = /^[^\/]+$/;
  var validIdOrTypeRules = '/ not allowed';

  //
  function decoratePromise(promise) {
    return $.extend(promise, promiseApi);
  }

  return api;
}

module.exports = hoodieStoreApi;

},{"./error":7,"./error/object_id":8,"./error/object_type":9,"./events":10,"./store":18}],19:[function(require,module,exports){
// Tasks
// ============

// This class defines the hoodie.task API.
//
// The returned API provides the following methods:
//
// * start
// * cancel
// * restart
// * remove
// * on
// * one
// * unbind
//
// At the same time, the returned API can be called as function returning a
// store scoped by the passed type, for example
//
//     var emailTasks = hoodie.task('email');
//     emailTasks.start( properties );
//     emailTasks.cancel('id123');
//
var hoodieEvents = require('./events');
var hoodieScopedTask = require('./scoped_task');

//
function hoodieTask(hoodie) {

  // public API
  var api = function api(type, id) {
    return hoodieScopedTask(hoodie, api, {type: type, id: id});
  };

  // add events API
  hoodieEvents(hoodie, { context: api, namespace: 'task' });


  // start
  // -------

  // start a new task. If the user has no account yet, hoodie tries to sign up
  // for an anonymous account in the background. If that fails, the returned
  // promise will be rejected.
  //
  api.start = function(type, properties) {
    if (hoodie.account.hasAccount()) {
      return hoodie.store.add('$'+type, properties).then(handleNewTask);
    }

    return hoodie.account.anonymousSignUp().then( function() {
      return api.start(type, properties);
    });
  };


  // cancel
  // -------

  // cancel a running task
  //
  api.cancel = function(type, id) {
    return hoodie.store.update('$'+type, id, { cancelledAt: now() }).then(handleCancelledTask);
  };


  // restart
  // ---------

  // first, we try to cancel a running task. If that succeeds, we start
  // a new one with the same properties as the original
  //
  api.restart = function(type, id, update) {
    var start = function(object) {
      $.extend(object, update);
      delete object.$error;
      delete object.$processedAt;
      delete object.cancelledAt;
      return api.start(object.type, object);
    };
    return api.cancel(type, id).then(start);
  };

  // cancelAll
  // -----------

  //
  api.cancelAll = function(type) {
    return findAll(type).then( cancelTaskObjects );
  };

  // restartAll
  // -----------

  //
  api.restartAll = function(type, update) {
    if (typeof type === 'object') {
      update = type;
    }
    return findAll(type).then( function(taskObjects) {
      restartTaskObjects(taskObjects, update);
    });
  };


  //
  // subscribe to store events
  // we subscribe to all store changes, pipe through the task ones,
  // making a few changes along the way.
  //
  function subscribeToOutsideEvents() {

    // account events
    hoodie.on('store:change', handleStoreChange);
  }

  // allow to run this only once from outside (during Hoodie initialization)
  api.subscribeToOutsideEvents = function() {
    subscribeToOutsideEvents();
    delete api.subscribeToOutsideEvents;
  };


  // Private
  // -------

  //
  function handleNewTask(object) {
    var defer = hoodie.defer();
    var taskStore = hoodie.store(object.type, object.id);

    taskStore.on('remove', function(object) {

      // remove "$" from type
      object.type = object.type.substr(1);

      // task finished by worker.
      if(object.$processedAt) {
        return defer.resolve(object);
      }

      // manually removed / cancelled.
      defer.reject(object);
    });
    taskStore.on('error', function(error, object) {

      // remove "$" from type
      object.type = object.type.substr(1);

      defer.reject(error, object);
    });

    return defer.promise();
  }

  //
  function handleCancelledTask (task) {
    var defer;
    var type = '$'+task.type;
    var id = task.id;
    var removePromise = hoodie.store.remove(type, id);

    if (!task._rev) {
      // task has not yet been synced.
      return removePromise;
    }

    defer = hoodie.defer();
    hoodie.one('store:sync:'+type+':'+id, defer.resolve);
    removePromise.fail(defer.reject);

    return defer.promise();
  }

  //
  function handleStoreChange(eventName, object, options) {
    if (object.type[0] !== '$') {
      return;
    }

    object.type = object.type.substr(1);
    triggerEvents(eventName, object, options);
  }

  //
  function findAll (type) {
    var startsWith = '$';
    var filter;
    if (type) {
      startsWith += type;
    }

    filter = function(object) {
      return object.type.indexOf(startsWith) === 0;
    };
    return hoodie.store.findAll(filter);
  }

  //
  function cancelTaskObjects (taskObjects) {
    return taskObjects.map( function(taskObject) {
      return api.cancel(taskObject.type.substr(1), taskObject.id);
    });
  }

  //
  function restartTaskObjects (taskObjects, update) {
    return taskObjects.map( function(taskObject) {
      return api.restart(taskObject.type.substr(1), taskObject.id, update);
    });
  }

  // this is where all the task events get triggered,
  // like add:message, change:message:abc4567, remove, etc.
  function triggerEvents(eventName, task, options) {
    var error;

    // "new" tasks are trigger as "start" events
    if (eventName === 'new') {
      eventName = 'start';
    }

    if (eventName === 'remove' && task.cancelledAt) {
      eventName = 'cancel';
    }

    if (eventName === 'remove' && task.$processedAt) {
      eventName = 'success';
    }

    if (eventName === 'update' && task.$error) {
      eventName = 'error';
      error = task.$error;
      delete task.$error;

      api.trigger('error', error, task, options);
      api.trigger(task.type + ':error', error, task, options);
      api.trigger(task.type + ':' + task.id + ':error', error, task, options);

      options = $.extend({}, options, {error: error});
      api.trigger('change', 'error', task, options);
      api.trigger(task.type + ':change', 'error', task, options);
      api.trigger(task.type + ':' + task.id + ':change', 'error', task, options);
      return;
    }

    // ignore all the other events
    if (eventName !== 'start' && eventName !== 'cancel' && eventName !== 'success') {
      return;
    }

    api.trigger(eventName, task, options);
    api.trigger(task.type + ':' + eventName, task, options);

    if (eventName !== 'start') {
      api.trigger(task.type + ':' + task.id + ':' + eventName, task, options);
    }

    api.trigger('change', eventName, task, options);
    api.trigger(task.type + ':change', eventName, task, options);

    if (eventName !== 'start') {
      api.trigger(task.type + ':' + task.id + ':change', eventName, task, options);
    }
  }

  //
  function now() {
    return JSON.stringify(new Date()).replace(/['"]/g, '');
  }

  // extend hoodie
  hoodie.task = api;
}

module.exports = hoodieTask;

},{"./events":10,"./scoped_task":17}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL2FjY291bnQuanMiLCIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS9hY2NvdW50X3JlbW90ZS5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL2NvbmZpZy5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL2Nvbm5lY3Rpb24uanMiLCIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS9kaXNwb3NlLmpzIiwiL1VzZXJzL3N2ZW5saXRvL1NpdGVzL3ByaXZhdGUvaG9vZGllLmpzL3NyYy9ob29kaWUvZXJyb3IuanMiLCIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS9lcnJvci9vYmplY3RfaWQuanMiLCIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS9lcnJvci9vYmplY3RfdHlwZS5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL2V2ZW50cy5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL2dlbmVyYXRlX2lkLmpzIiwiL1VzZXJzL3N2ZW5saXRvL1NpdGVzL3ByaXZhdGUvaG9vZGllLmpzL3NyYy9ob29kaWUvbG9jYWxfc3RvcmUuanMiLCIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS9vcGVuLmpzIiwiL1VzZXJzL3N2ZW5saXRvL1NpdGVzL3ByaXZhdGUvaG9vZGllLmpzL3NyYy9ob29kaWUvcHJvbWlzZXMuanMiLCIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS9yZW1vdGVfc3RvcmUuanMiLCIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS9yZXF1ZXN0LmpzIiwiL1VzZXJzL3N2ZW5saXRvL1NpdGVzL3ByaXZhdGUvaG9vZGllLmpzL3NyYy9ob29kaWUvc2NvcGVkX3Rhc2suanMiLCIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS9zdG9yZS5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL3Rhc2suanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsbUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDLzhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3dkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTsvLyBIb29kaWUgQ29yZVxuLy8gLS0tLS0tLS0tLS0tLVxuLy9cbi8vIHRoZSBkb29yIHRvIHdvcmxkIGRvbWluYXRpb24gKGFwcHMpXG4vL1xuXG52YXIgaG9vZGllQWNjb3VudCA9IHJlcXVpcmUoJy4vaG9vZGllL2FjY291bnQnKTtcbnZhciBob29kaWVBY2NvdW50UmVtb3RlID0gcmVxdWlyZSgnLi9ob29kaWUvYWNjb3VudF9yZW1vdGUnKTtcbnZhciBob29kaWVDb25maWcgPSByZXF1aXJlKCcuL2hvb2RpZS9jb25maWcnKTtcbnZhciBob29kaWVQcm9taXNlcyA9IHJlcXVpcmUoJy4vaG9vZGllL3Byb21pc2VzJyk7XG52YXIgaG9vZGllUmVxdWVzdCA9IHJlcXVpcmUoJy4vaG9vZGllL3JlcXVlc3QnKTtcbnZhciBob29kaWVDb25uZWN0aW9uID0gcmVxdWlyZSgnLi9ob29kaWUvY29ubmVjdGlvbicpO1xudmFyIGhvb2RpZURpc3Bvc2UgPSByZXF1aXJlKCcuL2hvb2RpZS9kaXNwb3NlJyk7XG52YXIgaG9vZGllT3BlbiA9IHJlcXVpcmUoJy4vaG9vZGllL29wZW4nKTtcbnZhciBob29kaWVMb2NhbFN0b3JlID0gcmVxdWlyZSgnLi9ob29kaWUvbG9jYWxfc3RvcmUnKTtcbnZhciBob29kaWVHZW5lcmF0ZUlkID0gcmVxdWlyZSgnLi9ob29kaWUvZ2VuZXJhdGVfaWQnKTtcbnZhciBob29kaWVUYXNrID0gcmVxdWlyZSgnLi9ob29kaWUvdGFzaycpO1xudmFyIGhvb2RpZUV2ZW50cyA9IHJlcXVpcmUoJy4vaG9vZGllL2V2ZW50cycpO1xuXG4vLyBDb25zdHJ1Y3RvclxuLy8gLS0tLS0tLS0tLS0tLVxuXG4vLyBXaGVuIGluaXRpYWxpemluZyBhIGhvb2RpZSBpbnN0YW5jZSwgYW4gb3B0aW9uYWwgVVJMXG4vLyBjYW4gYmUgcGFzc2VkLiBUaGF0J3MgdGhlIFVSTCBvZiB0aGUgaG9vZGllIGJhY2tlbmQuXG4vLyBJZiBubyBVUkwgcGFzc2VkIGl0IGRlZmF1bHRzIHRvIHRoZSBjdXJyZW50IGRvbWFpbi5cbi8vXG4vLyAgICAgLy8gaW5pdCBhIG5ldyBob29kaWUgaW5zdGFuY2Vcbi8vICAgICBob29kaWUgPSBuZXcgSG9vZGllXG4vL1xuZnVuY3Rpb24gSG9vZGllKGJhc2VVcmwpIHtcbiAgdmFyIGhvb2RpZSA9IHRoaXM7XG5cbiAgLy8gZW5mb3JjZSBpbml0aWFsaXphdGlvbiB3aXRoIGBuZXdgXG4gIGlmICghKGhvb2RpZSBpbnN0YW5jZW9mIEhvb2RpZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VzYWdlOiBuZXcgSG9vZGllKHVybCk7Jyk7XG4gIH1cblxuICBpZiAoYmFzZVVybCkge1xuICAgIC8vIHJlbW92ZSB0cmFpbGluZyBzbGFzaGVzXG4gICAgaG9vZGllLmJhc2VVcmwgPSBiYXNlVXJsLnJlcGxhY2UoL1xcLyskLywgJycpO1xuICB9XG5cblxuICAvLyBob29kaWUuZXh0ZW5kXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGV4dGVuZCBob29kaWUgaW5zdGFuY2U6XG4gIC8vXG4gIC8vICAgICBob29kaWUuZXh0ZW5kKGZ1bmN0aW9uKGhvb2RpZSkge30gKVxuICAvL1xuICBob29kaWUuZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kKGV4dGVuc2lvbikge1xuICAgIGV4dGVuc2lvbihob29kaWUpO1xuICB9O1xuXG5cbiAgLy9cbiAgLy8gRXh0ZW5kaW5nIGhvb2RpZSBjb3JlXG4gIC8vXG5cbiAgLy8gKiBob29kaWUuYmluZFxuICAvLyAqIGhvb2RpZS5vblxuICAvLyAqIGhvb2RpZS5vbmVcbiAgLy8gKiBob29kaWUudHJpZ2dlclxuICAvLyAqIGhvb2RpZS51bmJpbmRcbiAgLy8gKiBob29kaWUub2ZmXG4gIGhvb2RpZS5leHRlbmQoIGhvb2RpZUV2ZW50cyApO1xuXG5cbiAgLy8gKiBob29kaWUuZGVmZXJcbiAgLy8gKiBob29kaWUuaXNQcm9taXNlXG4gIC8vICogaG9vZGllLnJlc29sdmVcbiAgLy8gKiBob29kaWUucmVqZWN0XG4gIC8vICogaG9vZGllLnJlc29sdmVXaXRoXG4gIC8vICogaG9vZGllLnJlamVjdFdpdGhcbiAgaG9vZGllLmV4dGVuZCggaG9vZGllUHJvbWlzZXMgKTtcblxuICAvLyAqIGhvb2RpZS5yZXF1ZXN0XG4gIGhvb2RpZS5leHRlbmQoIGhvb2RpZVJlcXVlc3QgKTtcblxuICAvLyAqIGhvb2RpZS5pc09ubGluZVxuICAvLyAqIGhvb2RpZS5jaGVja0Nvbm5lY3Rpb25cbiAgaG9vZGllLmV4dGVuZCggaG9vZGllQ29ubmVjdGlvbiApO1xuXG4gIC8vICogaG9vZGllLnV1aWRcbiAgaG9vZGllLmV4dGVuZCggaG9vZGllR2VuZXJhdGVJZCApO1xuXG4gIC8vICogaG9vZGllLmRpc3Bvc2VcbiAgaG9vZGllLmV4dGVuZCggaG9vZGllRGlzcG9zZSApO1xuXG4gIC8vICogaG9vZGllLm9wZW5cbiAgaG9vZGllLmV4dGVuZCggaG9vZGllT3BlbiApO1xuXG4gIC8vICogaG9vZGllLnN0b3JlXG4gIGhvb2RpZS5leHRlbmQoIGhvb2RpZUxvY2FsU3RvcmUgKTtcblxuICAvLyAqIGhvb2RpZS50YXNrXG4gIGhvb2RpZS5leHRlbmQoIGhvb2RpZVRhc2sgKTtcblxuICAvLyAqIGhvb2RpZS5jb25maWdcbiAgaG9vZGllLmV4dGVuZCggaG9vZGllQ29uZmlnICk7XG5cbiAgLy8gKiBob29kaWUuYWNjb3VudFxuICBob29kaWUuZXh0ZW5kKCBob29kaWVBY2NvdW50ICk7XG5cbiAgLy8gKiBob29kaWUucmVtb3RlXG4gIGhvb2RpZS5leHRlbmQoIGhvb2RpZUFjY291bnRSZW1vdGUgKTtcblxuXG4gIC8vXG4gIC8vIEluaXRpYWxpemF0aW9uc1xuICAvL1xuXG4gIC8vIHNldCB1c2VybmFtZSBmcm9tIGNvbmZpZyAobG9jYWwgc3RvcmUpXG4gIGhvb2RpZS5hY2NvdW50LnVzZXJuYW1lID0gaG9vZGllLmNvbmZpZy5nZXQoJ19hY2NvdW50LnVzZXJuYW1lJyk7XG5cbiAgLy8gY2hlY2sgZm9yIHBlbmRpbmcgcGFzc3dvcmQgcmVzZXRcbiAgaG9vZGllLmFjY291bnQuY2hlY2tQYXNzd29yZFJlc2V0KCk7XG5cbiAgLy8gY2xlYXIgY29uZmlnIG9uIHNpZ24gb3V0XG4gIGhvb2RpZS5vbignYWNjb3VudDpzaWdub3V0JywgaG9vZGllLmNvbmZpZy5jbGVhcik7XG5cbiAgLy8gaG9vZGllLnN0b3JlXG4gIGhvb2RpZS5zdG9yZS5wYXRjaElmTm90UGVyc2lzdGFudCgpO1xuICBob29kaWUuc3RvcmUuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG4gIGhvb2RpZS5zdG9yZS5ib290c3RyYXBEaXJ0eU9iamVjdHMoKTtcblxuICAvLyBob29kaWUucmVtb3RlXG4gIGhvb2RpZS5yZW1vdGUuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG5cbiAgLy8gaG9vZGllLnRhc2tcbiAgaG9vZGllLnRhc2suc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG5cbiAgLy8gYXV0aGVudGljYXRlXG4gIC8vIHdlIHVzZSBhIGNsb3N1cmUgdG8gbm90IHBhc3MgdGhlIHVzZXJuYW1lIHRvIGNvbm5lY3QsIGFzIGl0XG4gIC8vIHdvdWxkIHNldCB0aGUgbmFtZSBvZiB0aGUgcmVtb3RlIHN0b3JlLCB3aGljaCBpcyBub3QgdGhlIHVzZXJuYW1lLlxuICBob29kaWUuYWNjb3VudC5hdXRoZW50aWNhdGUoKS50aGVuKCBmdW5jdGlvbiggLyogdXNlcm5hbWUgKi8gKSB7XG4gICAgaG9vZGllLnJlbW90ZS5jb25uZWN0KCk7XG4gIH0pO1xuXG4gIC8vIGNoZWNrIGNvbm5lY3Rpb24gd2hlbiBicm93c2VyIGdvZXMgb25saW5lIC8gb2ZmbGluZVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb25saW5lJywgaG9vZGllLmNoZWNrQ29ubmVjdGlvbiwgZmFsc2UpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb2ZmbGluZScsIGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24sIGZhbHNlKTtcblxuICAvLyBzdGFydCBjaGVja2luZyBjb25uZWN0aW9uXG4gIGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24oKTtcblxuICAvL1xuICAvLyBsb2FkaW5nIHVzZXIgZXh0ZW5zaW9uc1xuICAvL1xuICBhcHBseUV4dGVuc2lvbnMoaG9vZGllKTtcbn1cblxuLy8gRXh0ZW5kaW5nIGhvb2RpZVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFlvdSBjYW4gZXh0ZW5kIHRoZSBIb29kaWUgY2xhc3MgbGlrZSBzbzpcbi8vXG4vLyBIb29kaWUuZXh0ZW5kKGZ1bmNpb24oaG9vZGllKSB7IGhvb2RpZS5teU1hZ2ljID0gZnVuY3Rpb24oKSB7fSB9KVxuLy9cblxudmFyIGV4dGVuc2lvbnMgPSBbXTtcblxuSG9vZGllLmV4dGVuZCA9IGZ1bmN0aW9uKGV4dGVuc2lvbikge1xuICBleHRlbnNpb25zLnB1c2goZXh0ZW5zaW9uKTtcbn07XG5cbi8vXG4vLyBkZXRlY3QgYXZhaWxhYmxlIGV4dGVuc2lvbnMgYW5kIGF0dGFjaCB0byBIb29kaWUgT2JqZWN0LlxuLy9cbmZ1bmN0aW9uIGFwcGx5RXh0ZW5zaW9ucyhob29kaWUpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBleHRlbnNpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgZXh0ZW5zaW9uc1tpXShob29kaWUpO1xuICB9XG59XG5cbi8vXG4vLyBleHBvc2UgSG9vZGllIHRvIG1vZHVsZSBsb2FkZXJzLiBCYXNlZCBvbiBqUXVlcnkncyBpbXBsZW1lbnRhdGlvbi5cbi8vXG5pZiAoIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZSAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuXG4gIC8vIEV4cG9zZSBIb29kaWUgYXMgbW9kdWxlLmV4cG9ydHMgaW4gbG9hZGVycyB0aGF0IGltcGxlbWVudCB0aGUgTm9kZVxuICAvLyBtb2R1bGUgcGF0dGVybiAoaW5jbHVkaW5nIGJyb3dzZXJpZnkpLiBEbyBub3QgY3JlYXRlIHRoZSBnbG9iYWwsIHNpbmNlXG4gIC8vIHRoZSB1c2VyIHdpbGwgYmUgc3RvcmluZyBpdCB0aGVtc2VsdmVzIGxvY2FsbHksIGFuZCBnbG9iYWxzIGFyZSBmcm93bmVkXG4gIC8vIHVwb24gaW4gdGhlIE5vZGUgbW9kdWxlIHdvcmxkLlxuICBtb2R1bGUuZXhwb3J0cyA9IEhvb2RpZTtcblxuXG59IGVsc2UgaWYgKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG5cbiAgLy8gUmVnaXN0ZXIgYXMgYSBuYW1lZCBBTUQgbW9kdWxlLCBzaW5jZSBIb29kaWUgY2FuIGJlIGNvbmNhdGVuYXRlZCB3aXRoIG90aGVyXG4gIC8vIGZpbGVzIHRoYXQgbWF5IHVzZSBkZWZpbmUsIGJ1dCBub3QgdmlhIGEgcHJvcGVyIGNvbmNhdGVuYXRpb24gc2NyaXB0IHRoYXRcbiAgLy8gdW5kZXJzdGFuZHMgYW5vbnltb3VzIEFNRCBtb2R1bGVzLiBBIG5hbWVkIEFNRCBpcyBzYWZlc3QgYW5kIG1vc3Qgcm9idXN0XG4gIC8vIHdheSB0byByZWdpc3Rlci4gTG93ZXJjYXNlIGhvb2RpZSBpcyB1c2VkIGJlY2F1c2UgQU1EIG1vZHVsZSBuYW1lcyBhcmVcbiAgLy8gZGVyaXZlZCBmcm9tIGZpbGUgbmFtZXMsIGFuZCBIb29kaWUgaXMgbm9ybWFsbHkgZGVsaXZlcmVkIGluIGEgbG93ZXJjYXNlXG4gIC8vIGZpbGUgbmFtZS5cbiAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gSG9vZGllO1xuICB9KTtcblxufSBlbHNlIHtcblxuICAvLyBzZXQgZ2xvYmFsXG4gIGdsb2JhbC5Ib29kaWUgPSBIb29kaWU7XG59XG4iLCIvLyBIb29kaWUuQWNjb3VudFxuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgaG9vZGllRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxuLy9cbmZ1bmN0aW9uIGhvb2RpZUFjY291bnQgKGhvb2RpZSkge1xuICAvLyBwdWJsaWMgQVBJXG4gIHZhciBhY2NvdW50ID0ge307XG5cbiAgLy8gZmxhZyB3aGV0aGVyIHVzZXIgaXMgY3VycmVudGx5IGF1dGhlbnRpY2F0ZWQgb3Igbm90XG4gIHZhciBhdXRoZW50aWNhdGVkO1xuXG4gIC8vIGNhY2hlIGZvciBDb3VjaERCIF91c2VycyBkb2NcbiAgdmFyIHVzZXJEb2MgPSB7fTtcblxuICAvLyBtYXAgb2YgcmVxdWVzdFByb21pc2VzLiBXZSBtYWludGFpbiB0aGlzIGxpc3QgdG8gYXZvaWQgc2VuZGluZ1xuICAvLyB0aGUgc2FtZSByZXF1ZXN0cyBzZXZlcmFsIHRpbWVzLlxuICB2YXIgcmVxdWVzdHMgPSB7fTtcblxuICAvLyBkZWZhdWx0IGNvdWNoREIgdXNlciBkb2MgcHJlZml4XG4gIHZhciB1c2VyRG9jUHJlZml4ID0gJ29yZy5jb3VjaGRiLnVzZXInO1xuXG4gIC8vIGFkZCBldmVudHMgQVBJXG4gIGhvb2RpZUV2ZW50cyhob29kaWUsIHsgY29udGV4dDogYWNjb3VudCwgbmFtZXNwYWNlOiAnYWNjb3VudCd9KTtcblxuICAvLyBBdXRoZW50aWNhdGVcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBVc2UgdGhpcyBtZXRob2QgdG8gYXNzdXJlIHRoYXQgdGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZDpcbiAgLy8gYGhvb2RpZS5hY2NvdW50LmF1dGhlbnRpY2F0ZSgpLmRvbmUoIGRvU29tZXRoaW5nICkuZmFpbCggaGFuZGxlRXJyb3IgKWBcbiAgLy9cbiAgYWNjb3VudC5hdXRoZW50aWNhdGUgPSBmdW5jdGlvbiBhdXRoZW50aWNhdGUoKSB7XG4gICAgdmFyIHNlbmRBbmRIYW5kbGVBdXRoUmVxdWVzdDtcblxuICAgIC8vIGFscmVhZHkgdHJpZWQgdG8gYXV0aGVudGljYXRlLCBhbmQgZmFpbGVkXG4gICAgaWYgKGF1dGhlbnRpY2F0ZWQgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdCgpO1xuICAgIH1cblxuICAgIC8vIGFscmVhZHkgdHJpZWQgdG8gYXV0aGVudGljYXRlLCBhbmQgc3VjY2VlZGVkXG4gICAgaWYgKGF1dGhlbnRpY2F0ZWQgPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZVdpdGgoYWNjb3VudC51c2VybmFtZSk7XG4gICAgfVxuXG4gICAgLy8gaWYgdGhlcmUgaXMgYSBwZW5kaW5nIHNpZ25PdXQgcmVxdWVzdCwgcmV0dXJuIGl0cyBwcm9taXNlLFxuICAgIC8vIGJ1dCBwaXBlIGl0IHNvIHRoYXQgaXQgYWx3YXlzIGVuZHMgdXAgcmVqZWN0ZWRcbiAgICAvL1xuICAgIGlmIChyZXF1ZXN0cy5zaWduT3V0ICYmIHJlcXVlc3RzLnNpZ25PdXQuc3RhdGUoKSA9PT0gJ3BlbmRpbmcnKSB7XG4gICAgICByZXR1cm4gcmVxdWVzdHMuc2lnbk91dC50aGVuKGhvb2RpZS5yZWplY3QpO1xuICAgIH1cblxuICAgIC8vIGlmIHRoZXJlIGlzIGEgcGVuZGluZyBzaWduSW4gcmVxdWVzdCwgcmV0dXJuIGl0cyBwcm9taXNlXG4gICAgLy9cbiAgICBpZiAocmVxdWVzdHMuc2lnbkluICYmIHJlcXVlc3RzLnNpZ25Jbi5zdGF0ZSgpID09PSAncGVuZGluZycpIHtcbiAgICAgIHJldHVybiByZXF1ZXN0cy5zaWduSW47XG4gICAgfVxuXG4gICAgLy8gaWYgdXNlciBoYXMgbm8gYWNjb3VudCwgbWFrZSBzdXJlIHRvIGVuZCB0aGUgc2Vzc2lvblxuICAgIGlmICghIGFjY291bnQuaGFzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gc2VuZFNpZ25PdXRSZXF1ZXN0KCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gaG9vZGllLnJlamVjdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gc2VuZCByZXF1ZXN0IHRvIGNoZWNrIGZvciBzZXNzaW9uIHN0YXR1cy4gSWYgdGhlcmUgaXMgYVxuICAgIC8vIHBlbmRpbmcgcmVxdWVzdCBhbHJlYWR5LCByZXR1cm4gaXRzIHByb21pc2UuXG4gICAgLy9cbiAgICBzZW5kQW5kSGFuZGxlQXV0aFJlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhY2NvdW50LnJlcXVlc3QoJ0dFVCcsICcvX3Nlc3Npb24nKS50aGVuKFxuICAgICAgICBoYW5kbGVBdXRoZW50aWNhdGVSZXF1ZXN0U3VjY2Vzc1xuICAgICAgKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHdpdGhTaW5nbGVSZXF1ZXN0KCdhdXRoZW50aWNhdGUnLCBzZW5kQW5kSGFuZGxlQXV0aFJlcXVlc3QpO1xuICB9O1xuXG5cbiAgLy8gaGFzVmFsaWRTZXNzaW9uXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmV0dXJucyB0cnVlIGlmIHRoZSB1c2VyIGlzIGN1cnJlbnRseSBzaWduZWQgYnV0IGhhcyBubyB2YWxpZCBzZXNzaW9uLFxuICAvLyBtZWFuaW5nIHRoYXQgdGhlIGRhdGEgY2Fubm90IGJlIHN5bmNocm9uaXplZC5cbiAgLy9cbiAgYWNjb3VudC5oYXNWYWxpZFNlc3Npb24gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoISBhY2NvdW50Lmhhc0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBhdXRoZW50aWNhdGVkID09PSB0cnVlO1xuICB9O1xuXG5cbiAgLy8gaGFzSW52YWxpZFNlc3Npb25cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyByZXR1cm5zIHRydWUgaWYgdGhlIHVzZXIgaXMgY3VycmVudGx5IHNpZ25lZCBidXQgaGFzIG5vIHZhbGlkIHNlc3Npb24sXG4gIC8vIG1lYW5pbmcgdGhhdCB0aGUgZGF0YSBjYW5ub3QgYmUgc3luY2hyb25pemVkLlxuICAvL1xuICBhY2NvdW50Lmhhc0ludmFsaWRTZXNzaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEgYWNjb3VudC5oYXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXV0aGVudGljYXRlZCA9PT0gZmFsc2U7XG4gIH07XG5cblxuICAvLyBzaWduIHVwIHdpdGggdXNlcm5hbWUgJiBwYXNzd29yZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gdXNlcyBzdGFuZGFyZCBDb3VjaERCIEFQSSB0byBjcmVhdGUgYSBuZXcgZG9jdW1lbnQgaW4gX3VzZXJzIGRiLlxuICAvLyBUaGUgYmFja2VuZCB3aWxsIGF1dG9tYXRpY2FsbHkgY3JlYXRlIGEgdXNlckRCIGJhc2VkIG9uIHRoZSB1c2VybmFtZVxuICAvLyBhZGRyZXNzIGFuZCBhcHByb3ZlIHRoZSBhY2NvdW50IGJ5IGFkZGluZyBhICdjb25maXJtZWQnIHJvbGUgdG8gdGhlXG4gIC8vIHVzZXIgZG9jLiBUaGUgYWNjb3VudCBjb25maXJtYXRpb24gbWlnaHQgdGFrZSBhIHdoaWxlLCBzbyB3ZSBrZWVwIHRyeWluZ1xuICAvLyB0byBzaWduIGluIHdpdGggYSAzMDBtcyB0aW1lb3V0LlxuICAvL1xuICBhY2NvdW50LnNpZ25VcCA9IGZ1bmN0aW9uIHNpZ25VcCh1c2VybmFtZSwgcGFzc3dvcmQpIHtcblxuICAgIGlmIChwYXNzd29yZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBwYXNzd29yZCA9ICcnO1xuICAgIH1cblxuICAgIGlmICghdXNlcm5hbWUpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aCgnVXNlcm5hbWUgbXVzdCBiZSBzZXQuJyk7XG4gICAgfVxuXG4gICAgaWYgKGFjY291bnQuaGFzQW5vbnltb3VzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gdXBncmFkZUFub255bW91c0FjY291bnQodXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICB9XG5cbiAgICBpZiAoYWNjb3VudC5oYXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aCgnTXVzdCBzaWduIG91dCBmaXJzdC4nKTtcbiAgICB9XG5cbiAgICAvLyBkb3duY2FzZSB1c2VybmFtZVxuICAgIHVzZXJuYW1lID0gdXNlcm5hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBfaWQ6IHVzZXJEb2NLZXkodXNlcm5hbWUpLFxuICAgICAgICBuYW1lOiB1c2VyVHlwZUFuZElkKHVzZXJuYW1lKSxcbiAgICAgICAgdHlwZTogJ3VzZXInLFxuICAgICAgICByb2xlczogW10sXG4gICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcbiAgICAgICAgb3duZXJIYXNoOiBhY2NvdW50Lm93bmVySGFzaCxcbiAgICAgICAgZGF0YWJhc2U6IGFjY291bnQuZGIoKSxcbiAgICAgICAgdXBkYXRlZEF0OiBub3coKSxcbiAgICAgICAgY3JlYXRlZEF0OiBub3coKSxcbiAgICAgICAgc2lnbmVkVXBBdDogdXNlcm5hbWUgIT09IGFjY291bnQub3duZXJIYXNoID8gbm93KCkgOiB2b2lkIDBcbiAgICAgIH0pLFxuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgIH07XG5cbiAgICByZXR1cm4gYWNjb3VudC5yZXF1ZXN0KCdQVVQnLCB1c2VyRG9jVXJsKHVzZXJuYW1lKSwgb3B0aW9ucykudGhlbihcbiAgICAgIGhhbmRsZVNpZ25VcFN1Y2Nlc3ModXNlcm5hbWUsIHBhc3N3b3JkKSxcbiAgICAgIGhhbmRsZVNpZ25VcEVycm9yKHVzZXJuYW1lKVxuICAgICk7XG4gIH07XG5cblxuICAvLyBhbm9ueW1vdXMgc2lnbiB1cFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gSWYgdGhlIHVzZXIgZGlkIG5vdCBzaWduIHVwIGhpbXNlbGYgeWV0LCBidXQgZGF0YSBuZWVkcyB0byBiZSB0cmFuc2ZlcmVkXG4gIC8vIHRvIHRoZSBjb3VjaCwgZS5nLiB0byBzZW5kIGFuIGVtYWlsIG9yIHRvIHNoYXJlIGRhdGEsIHRoZSBhbm9ueW1vdXNTaWduVXBcbiAgLy8gbWV0aG9kIGNhbiBiZSB1c2VkLiBJdCBnZW5lcmF0ZXMgYSByYW5kb20gcGFzc3dvcmQgYW5kIHN0b3JlcyBpdCBsb2NhbGx5XG4gIC8vIGluIHRoZSBicm93c2VyLlxuICAvL1xuICAvLyBJZiB0aGUgdXNlciBzaWduZXMgdXAgZm9yIHJlYWwgbGF0ZXIsIHdlICd1cGdyYWRlJyBoaXMgYWNjb3VudCwgbWVhbmluZyB3ZVxuICAvLyBjaGFuZ2UgaGlzIHVzZXJuYW1lIGFuZCBwYXNzd29yZCBpbnRlcm5hbGx5IGluc3RlYWQgb2YgY3JlYXRpbmcgYW5vdGhlciB1c2VyLlxuICAvL1xuICBhY2NvdW50LmFub255bW91c1NpZ25VcCA9IGZ1bmN0aW9uIGFub255bW91c1NpZ25VcCgpIHtcbiAgICB2YXIgcGFzc3dvcmQsIHVzZXJuYW1lO1xuXG4gICAgcGFzc3dvcmQgPSBob29kaWUuZ2VuZXJhdGVJZCgxMCk7XG4gICAgdXNlcm5hbWUgPSBhY2NvdW50Lm93bmVySGFzaDtcblxuICAgIHJldHVybiBhY2NvdW50LnNpZ25VcCh1c2VybmFtZSwgcGFzc3dvcmQpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICBzZXRBbm9ueW1vdXNQYXNzd29yZChwYXNzd29yZCk7XG4gICAgICByZXR1cm4gYWNjb3VudC50cmlnZ2VyKCdzaWdudXA6YW5vbnltb3VzJywgdXNlcm5hbWUpO1xuICAgIH0pO1xuICB9O1xuXG5cbiAgLy8gaGFzQWNjb3VudFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvL1xuICBhY2NvdW50Lmhhc0FjY291bnQgPSBmdW5jdGlvbiBoYXNBY2NvdW50KCkge1xuICAgIHJldHVybiAhIWFjY291bnQudXNlcm5hbWU7XG4gIH07XG5cblxuICAvLyBoYXNBbm9ueW1vdXNBY2NvdW50XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGFub255bW91cyBhY2NvdW50cyBnZXQgY3JlYXRlZCB3aGVuIGRhdGEgbmVlZHMgdG8gYmVcbiAgLy8gc3luY2VkIHdpdGhvdXQgdGhlIHVzZXIgaGF2aW5nIGFuIGFjY291bnQuIFRoYXQgaGFwcGVuc1xuICAvLyBhdXRvbWF0aWNhbGx5IHdoZW4gdGhlIHVzZXIgY3JlYXRlcyBhIHRhc2ssIGJ1dCBjYW4gYWxzb1xuICAvLyBiZSBkb25lIG1hbnVhbGx5IHVzaW5nIGhvb2RpZS5hY2NvdW50LmFub255bW91c1NpZ25VcCgpLFxuICAvLyBlLmcuIHRvIHByZXZlbnQgZGF0YSBsb3NzLlxuICAvL1xuICAvLyBUbyBkZXRlcm1pbmUgYmV0d2VlbiBhbm9ueW1vdXMgYW5kIFwicmVhbFwiIGFjY291bnRzLCB3ZVxuICAvLyBjYW4gY29tcGFyZSB0aGUgdXNlcm5hbWUgdG8gdGhlIG93bmVySGFzaCwgd2hpY2ggaXMgdGhlXG4gIC8vIHNhbWUgZm9yIGFub255bW91cyBhY2NvdW50cy5cbiAgYWNjb3VudC5oYXNBbm9ueW1vdXNBY2NvdW50ID0gZnVuY3Rpb24gaGFzQW5vbnltb3VzQWNjb3VudCgpIHtcbiAgICByZXR1cm4gYWNjb3VudC51c2VybmFtZSA9PT0gYWNjb3VudC5vd25lckhhc2g7XG4gIH07XG5cblxuICAvLyBzZXQgLyBnZXQgLyByZW1vdmUgYW5vbnltb3VzIHBhc3N3b3JkXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vXG4gIHZhciBhbm9ueW1vdXNQYXNzd29yZEtleSA9ICdfYWNjb3VudC5hbm9ueW1vdXNQYXNzd29yZCc7XG5cbiAgZnVuY3Rpb24gc2V0QW5vbnltb3VzUGFzc3dvcmQocGFzc3dvcmQpIHtcbiAgICByZXR1cm4gaG9vZGllLmNvbmZpZy5zZXQoYW5vbnltb3VzUGFzc3dvcmRLZXksIHBhc3N3b3JkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEFub255bW91c1Bhc3N3b3JkKCkge1xuICAgIHJldHVybiBob29kaWUuY29uZmlnLmdldChhbm9ueW1vdXNQYXNzd29yZEtleSk7XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVBbm9ueW1vdXNQYXNzd29yZCgpIHtcbiAgICByZXR1cm4gaG9vZGllLmNvbmZpZy51bnNldChhbm9ueW1vdXNQYXNzd29yZEtleSk7XG4gIH1cblxuXG4gIC8vIHNpZ24gaW4gd2l0aCB1c2VybmFtZSAmIHBhc3N3b3JkXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyB1c2VzIHN0YW5kYXJkIENvdWNoREIgQVBJIHRvIGNyZWF0ZSBhIG5ldyB1c2VyIHNlc3Npb24gKFBPU1QgL19zZXNzaW9uKS5cbiAgLy8gQmVzaWRlcyB0aGUgc3RhbmRhcmQgc2lnbiBpbiB3ZSBhbHNvIGNoZWNrIGlmIHRoZSBhY2NvdW50IGhhcyBiZWVuIGNvbmZpcm1lZFxuICAvLyAocm9sZXMgaW5jbHVkZSAnY29uZmlybWVkJyByb2xlKS5cbiAgLy9cbiAgLy8gV2hlbiBzaWduaW5nIGluLCBieSBkZWZhdWx0IGFsbCBsb2NhbCBkYXRhIGdldHMgY2xlYXJlZCBiZWZvcmVoYW5kICh3aXRoIGEgc2lnbk91dCkuXG4gIC8vIE90aGVyd2lzZSBkYXRhIHRoYXQgaGFzIGJlZW4gY3JlYXRlZCBiZWZvcmVoYW5kIChhdXRoZW50aWNhdGVkIHdpdGggYW5vdGhlciB1c2VyXG4gIC8vIGFjY291bnQgb3IgYW5vbnltb3VzbHkpIHdvdWxkIGJlIG1lcmdlZCBpbnRvIHRoZSB1c2VyIGFjY291bnQgdGhhdCBzaWducyBpbi5cbiAgLy8gVGhhdCBhcHBsaWVzIG9ubHkgaWYgdXNlcm5hbWUgaXNuJ3QgdGhlIHNhbWUgYXMgY3VycmVudCB1c2VybmFtZS5cbiAgLy9cbiAgLy8gVG8gcHJldmVudCBkYXRhIGxvc3MsIHNpZ25JbiBjYW4gYmUgY2FsbGVkIHdpdGggb3B0aW9ucy5tb3ZlRGF0YSA9IHRydWUsIHRoYXQgd2xsXG4gIC8vIG1vdmUgYWxsIGRhdGEgZnJvbSB0aGUgYW5vbnltb3VzIGFjY291bnQgdG8gdGhlIGFjY291bnQgdGhlIHVzZXIgc2lnbmVkIGludG8uXG4gIC8vXG4gIGFjY291bnQuc2lnbkluID0gZnVuY3Rpb24gc2lnbkluKHVzZXJuYW1lLCBwYXNzd29yZCwgb3B0aW9ucykge1xuICAgIHZhciBzaWduT3V0QW5kU2lnbkluID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5zaWduT3V0KHtcbiAgICAgICAgc2lsZW50OiB0cnVlXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2VuZFNpZ25JblJlcXVlc3QodXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgdmFyIGN1cnJlbnREYXRhO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAodXNlcm5hbWUgPT09IG51bGwpIHtcbiAgICAgIHVzZXJuYW1lID0gJyc7XG4gICAgfVxuXG4gICAgaWYgKHBhc3N3b3JkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHBhc3N3b3JkID0gJyc7XG4gICAgfVxuXG4gICAgLy8gZG93bmNhc2VcbiAgICB1c2VybmFtZSA9IHVzZXJuYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICBpZiAodXNlcm5hbWUgIT09IGFjY291bnQudXNlcm5hbWUpIHtcbiAgICAgIGlmICghIG9wdGlvbnMubW92ZURhdGEpIHtcbiAgICAgICAgcmV0dXJuIHNpZ25PdXRBbmRTaWduSW4oKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGhvb2RpZS5zdG9yZS5maW5kQWxsKClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgY3VycmVudERhdGEgPSBkYXRhO1xuICAgICAgfSlcbiAgICAgIC50aGVuKHNpZ25PdXRBbmRTaWduSW4pXG4gICAgICAuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgY3VycmVudERhdGEuZm9yRWFjaChmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgICB2YXIgdHlwZSA9IG9iamVjdC50eXBlO1xuXG4gICAgICAgICAgLy8gaWdub3JlIHRoZSBhY2NvdW50IHNldHRpbmdzXG4gICAgICAgICAgaWYgKHR5cGUgPT09ICckY29uZmlnJyAmJiBvYmplY3QuaWQgPT09ICdob29kaWUnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZGVsZXRlIG9iamVjdC50eXBlO1xuICAgICAgICAgIG9iamVjdC5jcmVhdGVkQnkgPSBob29kaWUuYWNjb3VudC5vd25lckhhc2g7XG4gICAgICAgICAgaG9vZGllLnN0b3JlLmFkZCh0eXBlLCBvYmplY3QpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzZW5kU2lnbkluUmVxdWVzdCh1c2VybmFtZSwgcGFzc3dvcmQsIHtcbiAgICAgICAgcmVhdXRoZW50aWNhdGVkOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cblxuICAvLyBzaWduIG91dFxuICAvLyAtLS0tLS0tLS1cblxuICAvLyB1c2VzIHN0YW5kYXJkIENvdWNoREIgQVBJIHRvIGludmFsaWRhdGUgYSB1c2VyIHNlc3Npb24gKERFTEVURSAvX3Nlc3Npb24pXG4gIC8vXG4gIGFjY291bnQuc2lnbk91dCA9IGZ1bmN0aW9uIHNpZ25PdXQob3B0aW9ucykge1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAoIWFjY291bnQuaGFzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gY2xlYW51cCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHtcbiAgICAgICAgICByZXR1cm4gYWNjb3VudC50cmlnZ2VyKCdzaWdub3V0Jyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBwdXNoTG9jYWxDaGFuZ2VzKG9wdGlvbnMpXG4gICAgLnRoZW4oaG9vZGllLnJlbW90ZS5kaXNjb25uZWN0KVxuICAgIC50aGVuKHNlbmRTaWduT3V0UmVxdWVzdClcbiAgICAudGhlbihjbGVhbnVwQW5kVHJpZ2dlclNpZ25PdXQpO1xuICB9O1xuXG5cbiAgLy8gUmVxdWVzdFxuICAvLyAtLS1cblxuICAvLyBzaG9ydGN1dCBmb3IgYGhvb2RpZS5yZXF1ZXN0YFxuICAvL1xuICBhY2NvdW50LnJlcXVlc3QgPSBmdW5jdGlvbiByZXF1ZXN0KHR5cGUsIHBhdGgsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICByZXR1cm4gaG9vZGllLnJlcXVlc3QuYXBwbHkoaG9vZGllLCBhcmd1bWVudHMpO1xuICB9O1xuXG5cbiAgLy8gZGJcbiAgLy8gLS0tLVxuXG4gIC8vIHJldHVybiBuYW1lIG9mIGRiXG4gIC8vXG4gIGFjY291bnQuZGIgPSBmdW5jdGlvbiBkYigpIHtcbiAgICByZXR1cm4gJ3VzZXIvJyArIGFjY291bnQub3duZXJIYXNoO1xuICB9O1xuXG5cbiAgLy8gZmV0Y2hcbiAgLy8gLS0tLS0tLVxuXG4gIC8vIGZldGNoZXMgX3VzZXJzIGRvYyBmcm9tIENvdWNoREIgYW5kIGNhY2hlcyBpdCBpbiBfZG9jXG4gIC8vXG4gIGFjY291bnQuZmV0Y2ggPSBmdW5jdGlvbiBmZXRjaCh1c2VybmFtZSkge1xuXG4gICAgaWYgKHVzZXJuYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHVzZXJuYW1lID0gYWNjb3VudC51c2VybmFtZTtcbiAgICB9XG5cbiAgICBpZiAoIXVzZXJuYW1lKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoe1xuICAgICAgICBuYW1lOiAnSG9vZGllVW5hdXRob3JpemVkRXJyb3InLFxuICAgICAgICBtZXNzYWdlOiAnTm90IHNpZ25lZCBpbidcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB3aXRoU2luZ2xlUmVxdWVzdCgnZmV0Y2gnLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhY2NvdW50LnJlcXVlc3QoJ0dFVCcsIHVzZXJEb2NVcmwodXNlcm5hbWUpKS5kb25lKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHVzZXJEb2MgPSByZXNwb25zZTtcbiAgICAgICAgcmV0dXJuIHVzZXJEb2M7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIGNoYW5nZSBwYXNzd29yZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIE5vdGU6IHRoZSBob29kaWUgQVBJIHJlcXVpcmVzIHRoZSBjdXJyZW50UGFzc3dvcmQgZm9yIHNlY3VyaXR5IHJlYXNvbnMsXG4gIC8vIGJ1dCBjb3VjaERiIGRvZXNuJ3QgcmVxdWlyZSBpdCBmb3IgYSBwYXNzd29yZCBjaGFuZ2UsIHNvIGl0J3MgaWdub3JlZFxuICAvLyBpbiB0aGlzIGltcGxlbWVudGF0aW9uIG9mIHRoZSBob29kaWUgQVBJLlxuICAvL1xuICBhY2NvdW50LmNoYW5nZVBhc3N3b3JkID0gZnVuY3Rpb24gY2hhbmdlUGFzc3dvcmQoY3VycmVudFBhc3N3b3JkLCBuZXdQYXNzd29yZCkge1xuXG4gICAgaWYgKCFhY2NvdW50LnVzZXJuYW1lKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoe1xuICAgICAgICBuYW1lOiAnSG9vZGllVW5hdXRob3JpemVkRXJyb3InLFxuICAgICAgICBtZXNzYWdlOiAnTm90IHNpZ25lZCBpbidcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGhvb2RpZS5yZW1vdGUuZGlzY29ubmVjdCgpO1xuXG4gICAgcmV0dXJuIGFjY291bnQuZmV0Y2goKS50aGVuKFxuICAgICAgc2VuZENoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmRSZXF1ZXN0KGN1cnJlbnRQYXNzd29yZCwgbnVsbCwgbmV3UGFzc3dvcmQpXG4gICAgKTtcbiAgfTtcblxuXG4gIC8vIHJlc2V0IHBhc3N3b3JkXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUaGlzIGlzIGtpbmQgb2YgYSBoYWNrLiBXZSBuZWVkIHRvIGNyZWF0ZSBhbiBvYmplY3QgYW5vbnltb3VzbHlcbiAgLy8gdGhhdCBpcyBub3QgZXhwb3NlZCB0byBvdGhlcnMuIFRoZSBvbmx5IENvdWNoREIgQVBJIG90aGVyaW5nIHN1Y2hcbiAgLy8gZnVuY3Rpb25hbGl0eSBpcyB0aGUgX3VzZXJzIGRhdGFiYXNlLlxuICAvL1xuICAvLyBTbyB3ZSBhY3R1YWx5IHNpZ24gdXAgYSBuZXcgY291Y2hEQiB1c2VyIHdpdGggc29tZSBzcGVjaWFsIGF0dHJpYnV0ZXMuXG4gIC8vIEl0IHdpbGwgYmUgcGlja2VkIHVwIGJ5IHRoZSBwYXNzd29yZCByZXNldCB3b3JrZXIgYW5kIHJlbW92ZWVkXG4gIC8vIG9uY2UgdGhlIHBhc3N3b3JkIHdhcyByZXNldHRlZC5cbiAgLy9cbiAgYWNjb3VudC5yZXNldFBhc3N3b3JkID0gZnVuY3Rpb24gcmVzZXRQYXNzd29yZCh1c2VybmFtZSkge1xuICAgIHZhciBkYXRhLCBrZXksIG9wdGlvbnMsIHJlc2V0UGFzc3dvcmRJZDtcblxuICAgIHJlc2V0UGFzc3dvcmRJZCA9IGhvb2RpZS5jb25maWcuZ2V0KCdfYWNjb3VudC5yZXNldFBhc3N3b3JkSWQnKTtcblxuICAgIGlmIChyZXNldFBhc3N3b3JkSWQpIHtcbiAgICAgIHJldHVybiBhY2NvdW50LmNoZWNrUGFzc3dvcmRSZXNldCgpO1xuICAgIH1cblxuICAgIHJlc2V0UGFzc3dvcmRJZCA9ICcnICsgdXNlcm5hbWUgKyAnLycgKyAoaG9vZGllLmdlbmVyYXRlSWQoKSk7XG5cbiAgICBob29kaWUuY29uZmlnLnNldCgnX2FjY291bnQucmVzZXRQYXNzd29yZElkJywgcmVzZXRQYXNzd29yZElkKTtcblxuICAgIGtleSA9ICcnICsgdXNlckRvY1ByZWZpeCArICc6JHBhc3N3b3JkUmVzZXQvJyArIHJlc2V0UGFzc3dvcmRJZDtcblxuICAgIGRhdGEgPSB7XG4gICAgICBfaWQ6IGtleSxcbiAgICAgIG5hbWU6ICckcGFzc3dvcmRSZXNldC8nICsgcmVzZXRQYXNzd29yZElkLFxuICAgICAgdHlwZTogJ3VzZXInLFxuICAgICAgcm9sZXM6IFtdLFxuICAgICAgcGFzc3dvcmQ6IHJlc2V0UGFzc3dvcmRJZCxcbiAgICAgIGNyZWF0ZWRBdDogbm93KCksXG4gICAgICB1cGRhdGVkQXQ6IG5vdygpXG4gICAgfTtcblxuICAgIG9wdGlvbnMgPSB7XG4gICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9O1xuXG4gICAgLy8gVE9ETzogc3BlYyB0aGF0IGNoZWNrUGFzc3dvcmRSZXNldCBnZXRzIGV4ZWN1dGVkXG4gICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgncmVzZXRQYXNzd29yZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnUFVUJywgJy9fdXNlcnMvJyArIChlbmNvZGVVUklDb21wb25lbnQoa2V5KSksIG9wdGlvbnMpLmRvbmUoIGFjY291bnQuY2hlY2tQYXNzd29yZFJlc2V0IClcbiAgICAgIC50aGVuKCBhd2FpdFBhc3N3b3JkUmVzZXRSZXN1bHQgKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBjaGVja1Bhc3N3b3JkUmVzZXRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gY2hlY2sgZm9yIHRoZSBzdGF0dXMgb2YgYSBwYXNzd29yZCByZXNldC4gSXQgbWlnaHQgdGFrZVxuICAvLyBhIHdoaWxlIHVudGlsIHRoZSBwYXNzd29yZCByZXNldCB3b3JrZXIgcGlja3MgdXAgdGhlIGpvYlxuICAvLyBhbmQgdXBkYXRlcyBpdFxuICAvL1xuICAvLyBJZiBhIHBhc3N3b3JkIHJlc2V0IHJlcXVlc3Qgd2FzIHN1Y2Nlc3NmdWwsIHRoZSAkcGFzc3dvcmRSZXF1ZXN0XG4gIC8vIGRvYyBnZXRzIHJlbW92ZWQgZnJvbSBfdXNlcnMgYnkgdGhlIHdvcmtlciwgdGhlcmVmb3JlIGEgNDAxIGlzXG4gIC8vIHdoYXQgd2UgYXJlIHdhaXRpbmcgZm9yLlxuICAvL1xuICAvLyBPbmNlIGNhbGxlZCwgaXQgY29udGludWVzIHRvIHJlcXVlc3QgdGhlIHN0YXR1cyB1cGRhdGUgd2l0aCBhXG4gIC8vIG9uZSBzZWNvbmQgdGltZW91dC5cbiAgLy9cbiAgYWNjb3VudC5jaGVja1Bhc3N3b3JkUmVzZXQgPSBmdW5jdGlvbiBjaGVja1Bhc3N3b3JkUmVzZXQoKSB7XG4gICAgdmFyIGhhc2gsIG9wdGlvbnMsIHJlc2V0UGFzc3dvcmRJZCwgdXJsLCB1c2VybmFtZTtcblxuICAgIC8vIHJlamVjdCBpZiB0aGVyZSBpcyBubyBwZW5kaW5nIHBhc3N3b3JkIHJlc2V0IHJlcXVlc3RcbiAgICByZXNldFBhc3N3b3JkSWQgPSBob29kaWUuY29uZmlnLmdldCgnX2FjY291bnQucmVzZXRQYXNzd29yZElkJyk7XG5cbiAgICBpZiAoIXJlc2V0UGFzc3dvcmRJZCkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKCdObyBwZW5kaW5nIHBhc3N3b3JkIHJlc2V0LicpO1xuICAgIH1cblxuICAgIC8vIHNlbmQgcmVxdWVzdCB0byBjaGVjayBzdGF0dXMgb2YgcGFzc3dvcmQgcmVzZXRcbiAgICB1c2VybmFtZSA9ICckcGFzc3dvcmRSZXNldC8nICsgcmVzZXRQYXNzd29yZElkO1xuICAgIHVybCA9ICcvX3VzZXJzLycgKyAoZW5jb2RlVVJJQ29tcG9uZW50KHVzZXJEb2NQcmVmaXggKyAnOicgKyB1c2VybmFtZSkpO1xuICAgIGhhc2ggPSBidG9hKHVzZXJuYW1lICsgJzonICsgcmVzZXRQYXNzd29yZElkKTtcblxuICAgIG9wdGlvbnMgPSB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEF1dGhvcml6YXRpb246ICdCYXNpYyAnICsgaGFzaFxuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gd2l0aFByZXZpb3VzUmVxdWVzdHNBYm9ydGVkKCdwYXNzd29yZFJlc2V0U3RhdHVzJywgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5yZXF1ZXN0KCdHRVQnLCB1cmwsIG9wdGlvbnMpLnRoZW4oXG4gICAgICAgIGhhbmRsZVBhc3N3b3JkUmVzZXRTdGF0dXNSZXF1ZXN0U3VjY2VzcyxcbiAgICAgICAgaGFuZGxlUGFzc3dvcmRSZXNldFN0YXR1c1JlcXVlc3RFcnJvclxuICAgICAgKS5mYWlsKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvci5uYW1lID09PSAnSG9vZGllUGVuZGluZ0Vycm9yJykge1xuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGFjY291bnQuY2hlY2tQYXNzd29yZFJlc2V0LCAxMDAwKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjY291bnQudHJpZ2dlcigncGFzc3dvcmRyZXNldDplcnJvcicpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyBjaGFuZ2UgdXNlcm5hbWVcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBOb3RlOiB0aGUgaG9vZGllIEFQSSByZXF1aXJlcyB0aGUgY3VycmVudCBwYXNzd29yZCBmb3Igc2VjdXJpdHkgcmVhc29ucyxcbiAgLy8gYnV0IHRlY2huaWNhbGx5IHdlIGNhbm5vdCAoeWV0KSBwcmV2ZW50IHRoZSB1c2VyIHRvIGNoYW5nZSB0aGUgdXNlcm5hbWVcbiAgLy8gd2l0aG91dCBrbm93aW5nIHRoZSBjdXJyZW50IHBhc3N3b3JkLCBzbyBpdCdzIG5vdCBpbXB1bGVtZW50ZWQgaW4gdGhlIGN1cnJlbnRcbiAgLy8gaW1wbGVtZW50YXRpb24gb2YgdGhlIGhvb2RpZSBBUEkuXG4gIC8vXG4gIC8vIEJ1dCB0aGUgY3VycmVudCBwYXNzd29yZCBpcyBuZWVkZWQgdG8gbG9naW4gd2l0aCB0aGUgbmV3IHVzZXJuYW1lLlxuICAvL1xuICBhY2NvdW50LmNoYW5nZVVzZXJuYW1lID0gZnVuY3Rpb24gY2hhbmdlVXNlcm5hbWUoY3VycmVudFBhc3N3b3JkLCBuZXdVc2VybmFtZSkge1xuICAgIG5ld1VzZXJuYW1lID0gbmV3VXNlcm5hbWUgfHwgJyc7XG4gICAgcmV0dXJuIGNoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmQoY3VycmVudFBhc3N3b3JkLCBuZXdVc2VybmFtZS50b0xvd2VyQ2FzZSgpKTtcbiAgfTtcblxuXG4gIC8vIGRlc3Ryb3lcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gZGVzdHJveXMgYSB1c2VyJ3MgYWNjb3VudFxuICAvL1xuICBhY2NvdW50LmRlc3Ryb3kgPSBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgIGlmICghYWNjb3VudC5oYXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiBjbGVhbnVwQW5kVHJpZ2dlclNpZ25PdXQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWNjb3VudC5mZXRjaCgpLnRoZW4oXG4gICAgICBoYW5kbGVGZXRjaEJlZm9yZURlc3Ryb3lTdWNjZXNzLFxuICAgICAgaGFuZGxlRmV0Y2hCZWZvcmVEZXN0cm95RXJyb3JcbiAgICApLnRoZW4oY2xlYW51cEFuZFRyaWdnZXJTaWduT3V0KTtcbiAgfTtcblxuXG4gIC8vXG4gIC8vIHN1YnNjcmliZSB0byBldmVudHMgY29taW5nIG91dHNpZGVcbiAgLy9cbiAgZnVuY3Rpb24gc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCkge1xuICAgIGhvb2RpZS5vbigncmVtb3RlOmVycm9yOnVuYXV0aGVudGljYXRlZCcsIHJlYXV0aGVudGljYXRlKTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9uY2UgZnJvbSBvdXRzaWRlXG4gIGFjY291bnQuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG4gICAgZGVsZXRlIGFjY291bnQuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzO1xuICB9O1xuXG5cbiAgLy8gUFJJVkFURVxuICAvLyAtLS0tLS0tLS1cblxuICAvLyByZWF1dGhlbnRpY2F0ZTogZm9yY2UgaG9vZGllIHRvIHJlYXV0aGVudGljYXRlXG4gIGZ1bmN0aW9uIHJlYXV0aGVudGljYXRlICgpIHtcbiAgICBhdXRoZW50aWNhdGVkID0gdW5kZWZpbmVkO1xuICAgIHJldHVybiBhY2NvdW50LmF1dGhlbnRpY2F0ZSgpO1xuICB9XG5cbiAgLy8gc2V0dGVyc1xuICBmdW5jdGlvbiBzZXRVc2VybmFtZShuZXdVc2VybmFtZSkge1xuICAgIGlmIChhY2NvdW50LnVzZXJuYW1lID09PSBuZXdVc2VybmFtZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGFjY291bnQudXNlcm5hbWUgPSBuZXdVc2VybmFtZTtcblxuICAgIHJldHVybiBob29kaWUuY29uZmlnLnNldCgnX2FjY291bnQudXNlcm5hbWUnLCBuZXdVc2VybmFtZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRPd25lcihuZXdPd25lckhhc2gpIHtcblxuICAgIGlmIChhY2NvdW50Lm93bmVySGFzaCA9PT0gbmV3T3duZXJIYXNoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYWNjb3VudC5vd25lckhhc2ggPSBuZXdPd25lckhhc2g7XG5cbiAgICAvLyBgb3duZXJIYXNoYCBpcyBzdG9yZWQgd2l0aCBldmVyeSBuZXcgb2JqZWN0IGluIHRoZSBjcmVhdGVkQnlcbiAgICAvLyBhdHRyaWJ1dGUuIEl0IGRvZXMgbm90IGdldCBjaGFuZ2VkIG9uY2UgaXQncyBzZXQuIFRoYXQncyB3aHlcbiAgICAvLyB3ZSBoYXZlIHRvIGZvcmNlIGl0IHRvIGJlIGNoYW5nZSBmb3IgdGhlIGAkY29uZmlnL2hvb2RpZWAgb2JqZWN0LlxuICAgIGhvb2RpZS5jb25maWcuc2V0KCdjcmVhdGVkQnknLCBuZXdPd25lckhhc2gpO1xuXG4gICAgcmV0dXJuIGhvb2RpZS5jb25maWcuc2V0KCdfYWNjb3VudC5vd25lckhhc2gnLCBuZXdPd25lckhhc2gpO1xuICB9XG5cblxuICAvL1xuICAvLyBoYW5kbGUgYSBzdWNjZXNzZnVsIGF1dGhlbnRpY2F0aW9uIHJlcXVlc3QuXG4gIC8vXG4gIC8vIEFzIGxvbmcgYXMgdGhlcmUgaXMgbm8gc2VydmVyIGVycm9yIG9yIGludGVybmV0IGNvbm5lY3Rpb24gaXNzdWUsXG4gIC8vIHRoZSBhdXRoZW50aWNhdGUgcmVxdWVzdCAoR0VUIC9fc2Vzc2lvbikgZG9lcyBhbHdheXMgcmV0dXJuXG4gIC8vIGEgMjAwIHN0YXR1cy4gVG8gZGlmZmVyZW50aWF0ZSB3aGV0aGVyIHRoZSB1c2VyIGlzIHNpZ25lZCBpbiBvclxuICAvLyBub3QsIHdlIGNoZWNrIGB1c2VyQ3R4Lm5hbWVgIGluIHRoZSByZXNwb25zZS4gSWYgdGhlIHVzZXIgaXMgbm90XG4gIC8vIHNpZ25lZCBpbiwgaXQncyBudWxsLCBvdGhlcndpc2UgdGhlIG5hbWUgdGhlIHVzZXIgc2lnbmVkIGluIHdpdGhcbiAgLy9cbiAgLy8gSWYgdGhlIHVzZXIgaXMgbm90IHNpZ25lZCBpbiwgd2UgZGlmZWVyZW50aWF0ZSBiZXR3ZWVuIHVzZXJzIHRoYXRcbiAgLy8gc2lnbmVkIGluIHdpdGggYSB1c2VybmFtZSAvIHBhc3N3b3JkIG9yIGFub255bW91c2x5LiBGb3IgYW5vbnltb3VzXG4gIC8vIHVzZXJzLCB0aGUgcGFzc3dvcmQgaXMgc3RvcmVkIGluIGxvY2FsIHN0b3JlLCBzbyB3ZSBkb24ndCBuZWVkXG4gIC8vIHRvIHRyaWdnZXIgYW4gJ3VuYXV0aGVudGljYXRlZCcgZXJyb3IsIGJ1dCBpbnN0ZWFkIHRyeSB0byBzaWduIGluLlxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVBdXRoZW50aWNhdGVSZXF1ZXN0U3VjY2VzcyhyZXNwb25zZSkge1xuICAgIGlmIChyZXNwb25zZS51c2VyQ3R4Lm5hbWUpIHtcbiAgICAgIGF1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuICAgICAgc2V0VXNlcm5hbWUocmVzcG9uc2UudXNlckN0eC5uYW1lLnJlcGxhY2UoL151c2VyKF9hbm9ueW1vdXMpP1xcLy8sICcnKSk7XG4gICAgICBzZXRPd25lcihyZXNwb25zZS51c2VyQ3R4LnJvbGVzWzBdKTtcbiAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZVdpdGgoYWNjb3VudC51c2VybmFtZSk7XG4gICAgfVxuXG4gICAgaWYgKGFjY291bnQuaGFzQW5vbnltb3VzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5zaWduSW4oYWNjb3VudC51c2VybmFtZSwgZ2V0QW5vbnltb3VzUGFzc3dvcmQoKSk7XG4gICAgfVxuXG4gICAgYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgIGFjY291bnQudHJpZ2dlcignZXJyb3I6dW5hdXRoZW50aWNhdGVkJyk7XG4gICAgcmV0dXJuIGhvb2RpZS5yZWplY3QoKTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gaGFuZGxlIHJlc3BvbnNlIG9mIGEgc3VjY2Vzc2Z1bCBzaWduVXAgcmVxdWVzdC5cbiAgLy8gUmVzcG9uc2UgbG9va3MgbGlrZTpcbiAgLy9cbiAgLy8gICAgIHtcbiAgLy8gICAgICAgICAnb2snOiB0cnVlLFxuICAvLyAgICAgICAgICdpZCc6ICdvcmcuY291Y2hkYi51c2VyOmpvZScsXG4gIC8vICAgICAgICAgJ3Jldic6ICcxLWU4NzQ3ZDlhZTk3NzY3MDZkYTkyODEwYjFiYWE0MjQ4J1xuICAvLyAgICAgfVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVTaWduVXBTdWNjZXNzKHVzZXJuYW1lLCBwYXNzd29yZCkge1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICBhY2NvdW50LnRyaWdnZXIoJ3NpZ251cCcsIHVzZXJuYW1lKTtcbiAgICAgIHVzZXJEb2MuX3JldiA9IHJlc3BvbnNlLnJldjtcbiAgICAgIHJldHVybiBkZWxheWVkU2lnbkluKHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgfTtcbiAgfVxuXG4gIC8vXG4gIC8vIGhhbmRsZSByZXNwb25zZSBvZiBhIGZhaWxlZCBzaWduVXAgcmVxdWVzdC5cbiAgLy9cbiAgLy8gSW4gY2FzZSBvZiBhIGNvbmZsaWN0LCByZWplY3Qgd2l0aCBcInVzZXJuYW1lIGFscmVhZHkgZXhpc3RzXCIgZXJyb3JcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hvb2RpZWhxL2hvb2RpZS5qcy9pc3N1ZXMvMTc0XG4gIC8vIEVycm9yIHBhc3NlZCBmb3IgaG9vZGllLnJlcXVlc3QgbG9va3MgbGlrZSB0aGlzXG4gIC8vXG4gIC8vICAgICB7XG4gIC8vICAgICAgICAgXCJuYW1lXCI6IFwiSG9vZGllQ29uZmxpY3RFcnJvclwiLFxuICAvLyAgICAgICAgIFwibWVzc2FnZVwiOiBcIk9iamVjdCBhbHJlYWR5IGV4aXN0cy5cIlxuICAvLyAgICAgfVxuICBmdW5jdGlvbiBoYW5kbGVTaWduVXBFcnJvcih1c2VybmFtZSkge1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0hvb2RpZUNvbmZsaWN0RXJyb3InKSB7XG4gICAgICAgIGVycm9yLm1lc3NhZ2UgPSAnVXNlcm5hbWUgJyArIHVzZXJuYW1lICsgJyBhbHJlYWR5IGV4aXN0cyc7XG4gICAgICB9XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoZXJyb3IpO1xuICAgIH07XG4gIH1cblxuXG4gIC8vXG4gIC8vIGEgZGVsYXllZCBzaWduIGluIGlzIHVzZWQgYWZ0ZXIgc2lnbiB1cCBhbmQgYWZ0ZXIgYVxuICAvLyB1c2VybmFtZSBjaGFuZ2UuXG4gIC8vXG4gIGZ1bmN0aW9uIGRlbGF5ZWRTaWduSW4odXNlcm5hbWUsIHBhc3N3b3JkLCBvcHRpb25zLCBkZWZlcikge1xuXG4gICAgLy8gZGVsYXllZFNpZ25JbiBtaWdodCBjYWxsIGl0c2VsZiwgd2hlbiB0aGUgdXNlciBhY2NvdW50XG4gICAgLy8gaXMgcGVuZGluZy4gSW4gdGhpcyBjYXNlIGl0IHBhc3NlcyB0aGUgb3JpZ2luYWwgZGVmZXIsXG4gICAgLy8gdG8ga2VlcCBhIHJlZmVyZW5jZSBhbmQgZmluYWxseSByZXNvbHZlIC8gcmVqZWN0IGl0XG4gICAgLy8gYXQgc29tZSBwb2ludFxuICAgIGlmICghZGVmZXIpIHtcbiAgICAgIGRlZmVyID0gaG9vZGllLmRlZmVyKCk7XG4gICAgfVxuXG4gICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IHNlbmRTaWduSW5SZXF1ZXN0KHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgICBwcm9taXNlLmRvbmUoZGVmZXIucmVzb2x2ZSk7XG4gICAgICBwcm9taXNlLmZhaWwoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgaWYgKGVycm9yLm5hbWUgPT09ICdIb29kaWVBY2NvdW50VW5jb25maXJtZWRFcnJvcicpIHtcblxuICAgICAgICAgIC8vIEl0IG1pZ2h0IHRha2UgYSBiaXQgdW50aWwgdGhlIGFjY291bnQgaGFzIGJlZW4gY29uZmlybWVkXG4gICAgICAgICAgZGVsYXllZFNpZ25Jbih1c2VybmFtZSwgcGFzc3dvcmQsIG9wdGlvbnMsIGRlZmVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWZlci5yZWplY3QuYXBwbHkoZGVmZXIsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfSwgMzAwKTtcblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIHBhcnNlIGEgc3VjY2Vzc2Z1bCBzaWduIGluIHJlc3BvbnNlIGZyb20gY291Y2hEQi5cbiAgLy8gUmVzcG9uc2UgbG9va3MgbGlrZTpcbiAgLy9cbiAgLy8gICAgIHtcbiAgLy8gICAgICAgICAnb2snOiB0cnVlLFxuICAvLyAgICAgICAgICduYW1lJzogJ3Rlc3QxJyxcbiAgLy8gICAgICAgICAncm9sZXMnOiBbXG4gIC8vICAgICAgICAgICAgICdtdnU4NWh5JyxcbiAgLy8gICAgICAgICAgICAgJ2NvbmZpcm1lZCdcbiAgLy8gICAgICAgICBdXG4gIC8vICAgICB9XG4gIC8vXG4gIC8vIHdlIHdhbnQgdG8gdHVybiBpdCBpbnRvICd0ZXN0MScsICdtdnU4NWh5JyBvciByZWplY3QgdGhlIHByb21pc2VcbiAgLy8gaW4gY2FzZSBhbiBlcnJvciBvY2N1cmVkICgncm9sZXMnIGFycmF5IGNvbnRhaW5zICdlcnJvcicpXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZVNpZ25JblN1Y2Nlc3Mob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICB2YXIgZGVmZXIsIHVzZXJuYW1lO1xuXG4gICAgICBkZWZlciA9IGhvb2RpZS5kZWZlcigpO1xuICAgICAgdXNlcm5hbWUgPSByZXNwb25zZS5uYW1lLnJlcGxhY2UoL151c2VyKF9hbm9ueW1vdXMpP1xcLy8sICcnKTtcblxuICAgICAgLy9cbiAgICAgIC8vIGlmIGFuIGVycm9yIG9jY3VyZWQsIHRoZSB1c2VyREIgd29ya2VyIHN0b3JlcyBpdCB0byB0aGUgJGVycm9yIGF0dHJpYnV0ZVxuICAgICAgLy8gYW5kIGFkZHMgdGhlICdlcnJvcicgcm9sZSB0byB0aGUgdXNlcnMgZG9jIG9iamVjdC4gSWYgdGhlIHVzZXIgaGFzIHRoZVxuICAgICAgLy8gJ2Vycm9yJyByb2xlLCB3ZSBuZWVkIHRvIGZldGNoIGhpcyBfdXNlcnMgZG9jIHRvIGZpbmQgb3V0IHdoYXQgdGhlIGVycm9yXG4gICAgICAvLyBpcywgYmVmb3JlIHdlIGNhbiByZWplY3QgdGhlIHByb21pc2UuXG4gICAgICAvL1xuICAgICAgaWYgKHJlc3BvbnNlLnJvbGVzLmluZGV4T2YoJ2Vycm9yJykgIT09IC0xKSB7XG4gICAgICAgIGFjY291bnQuZmV0Y2godXNlcm5hbWUpLmZhaWwoZGVmZXIucmVqZWN0KS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBkZWZlci5yZWplY3QodXNlckRvYy4kZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgICAgIH1cblxuICAgICAgLy9cbiAgICAgIC8vIFdoZW4gdGhlIHVzZXJEQiB3b3JrZXIgY3JlYXRlZCB0aGUgZGF0YWJhc2UgZm9yIHRoZSB1c2VyIGFuZCBldmVydGhpbmdcbiAgICAgIC8vIHdvcmtlZCBvdXQsIGl0IGFkZHMgdGhlIHJvbGUgJ2NvbmZpcm1lZCcgdG8gdGhlIHVzZXIuIElmIHRoZSByb2xlIGlzXG4gICAgICAvLyBub3QgcHJlc2VudCB5ZXQsIGl0IG1pZ2h0IGJlIHRoYXQgdGhlIHdvcmtlciBkaWRuJ3QgcGljayB1cCB0aGUgdGhlXG4gICAgICAvLyB1c2VyIGRvYyB5ZXQsIG9yIHRoZXJlIHdhcyBhbiBlcnJvci4gSW4gdGhpcyBjYXNlcywgd2UgcmVqZWN0IHRoZSBwcm9taXNlXG4gICAgICAvLyB3aXRoIGFuICd1bmNvZmlybWVkIGVycm9yJ1xuICAgICAgLy9cbiAgICAgIGlmIChyZXNwb25zZS5yb2xlcy5pbmRleE9mKCdjb25maXJtZWQnKSA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIGRlZmVyLnJlamVjdCh7XG4gICAgICAgICAgbmFtZTogJ0hvb2RpZUFjY291bnRVbmNvbmZpcm1lZEVycm9yJyxcbiAgICAgICAgICBtZXNzYWdlOiAnQWNjb3VudCBoYXMgbm90IGJlZW4gY29uZmlybWVkIHlldCdcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHNldFVzZXJuYW1lKHVzZXJuYW1lKTtcbiAgICAgIHNldE93bmVyKHJlc3BvbnNlLnJvbGVzWzBdKTtcbiAgICAgIGF1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuXG4gICAgICAvL1xuICAgICAgLy8gb3B0aW9ucy52ZXJib3NlIGlzIHRydWUsIHdoZW4gYSB1c2VyIG1hbnVhbGx5IHNpZ25lZCB2aWEgaG9vZGllLmFjY291bnQuc2lnbkluKCkuXG4gICAgICAvLyBXZSBuZWVkIHRvIGRpZmZlcmVudGlhdGUgdG8gb3RoZXIgc2lnbkluIHJlcXVlc3RzLCBmb3IgZXhhbXBsZSByaWdodCBhZnRlclxuICAgICAgLy8gdGhlIHNpZ251cCBvciBhZnRlciBhIHNlc3Npb24gdGltZWQgb3V0LlxuICAgICAgLy9cbiAgICAgIGlmICghKG9wdGlvbnMuc2lsZW50IHx8IG9wdGlvbnMucmVhdXRoZW50aWNhdGVkKSkge1xuICAgICAgICBpZiAoYWNjb3VudC5oYXNBbm9ueW1vdXNBY2NvdW50KCkpIHtcbiAgICAgICAgICBhY2NvdW50LnRyaWdnZXIoJ3NpZ25pbjphbm9ueW1vdXMnLCB1c2VybmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWNjb3VudC50cmlnZ2VyKCdzaWduaW4nLCB1c2VybmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gdXNlciByZWF1dGhlbnRpY2F0ZWQsIG1lYW5pbmdcbiAgICAgIGlmIChvcHRpb25zLnJlYXV0aGVudGljYXRlZCkge1xuICAgICAgICBhY2NvdW50LnRyaWdnZXIoJ3JlYXV0aGVudGljYXRlZCcsIHVzZXJuYW1lKTtcbiAgICAgIH1cblxuICAgICAgYWNjb3VudC5mZXRjaCgpO1xuICAgICAgcmV0dXJuIGRlZmVyLnJlc29sdmUodXNlcm5hbWUsIHJlc3BvbnNlLnJvbGVzWzBdKTtcbiAgICB9O1xuICB9XG5cblxuICAvL1xuICAvLyBJZiB0aGUgcmVxdWVzdCB3YXMgc3VjY2Vzc2Z1bCB0aGVyZSBtaWdodCBoYXZlIG9jY3VyZWQgYW5cbiAgLy8gZXJyb3IsIHdoaWNoIHRoZSB3b3JrZXIgc3RvcmVkIGluIHRoZSBzcGVjaWFsICRlcnJvciBhdHRyaWJ1dGUuXG4gIC8vIElmIHRoYXQgaGFwcGVucywgd2UgcmV0dXJuIGEgcmVqZWN0ZWQgcHJvbWlzZSB3aXRoIHRoZSBlcnJvclxuICAvLyBPdGhlcndpc2UgcmVqZWN0IHRoZSBwcm9taXNlIHdpdGggYSAncGVuZGluZycgZXJyb3IsXG4gIC8vIGFzIHdlIGFyZSBub3Qgd2FpdGluZyBmb3IgYSBzdWNjZXNzIGZ1bGwgcmVzcG9uc2UsIGJ1dCBhIDQwMVxuICAvLyBlcnJvciwgaW5kaWNhdGluZyB0aGF0IG91ciBwYXNzd29yZCB3YXMgY2hhbmdlZCBhbmQgb3VyXG4gIC8vIGN1cnJlbnQgc2Vzc2lvbiBoYXMgYmVlbiBpbnZhbGlkYXRlZFxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVQYXNzd29yZFJlc2V0U3RhdHVzUmVxdWVzdFN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICB2YXIgZXJyb3I7XG5cbiAgICBpZiAocmVzcG9uc2UuJGVycm9yKSB7XG4gICAgICBlcnJvciA9IHJlc3BvbnNlLiRlcnJvcjtcbiAgICB9IGVsc2Uge1xuICAgICAgZXJyb3IgPSB7XG4gICAgICAgIG5hbWU6ICdIb29kaWVQZW5kaW5nRXJyb3InLFxuICAgICAgICBtZXNzYWdlOiAnUGFzc3dvcmQgcmVzZXQgaXMgc3RpbGwgcGVuZGluZydcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aChlcnJvcik7XG4gIH1cblxuXG4gIC8vXG4gIC8vIElmIHRoZSBlcnJvciBpcyBhIDQwMSwgaXQncyBleGFjdGx5IHdoYXQgd2UndmUgYmVlbiB3YWl0aW5nIGZvci5cbiAgLy8gSW4gdGhpcyBjYXNlIHdlIHJlc29sdmUgdGhlIHByb21pc2UuXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZVBhc3N3b3JkUmVzZXRTdGF0dXNSZXF1ZXN0RXJyb3IoZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0hvb2RpZVVuYXV0aG9yaXplZEVycm9yJykge1xuICAgICAgaG9vZGllLmNvbmZpZy51bnNldCgnX2FjY291bnQucmVzZXRQYXNzd29yZElkJyk7XG4gICAgICBhY2NvdW50LnRyaWdnZXIoJ3Bhc3N3b3JkcmVzZXQnKTtcblxuICAgICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aChlcnJvcik7XG4gICAgfVxuICB9XG5cblxuICAvL1xuICAvLyB3YWl0IHVudGlsIGEgcGFzc3dvcmQgcmVzZXQgZ2V0cyBlaXRoZXIgY29tcGxldGVkIG9yIG1hcmtlZCBhcyBmYWlsZWRcbiAgLy8gYW5kIHJlc29sdmUgLyByZWplY3QgcmVzcGVjdGl2ZWx5XG4gIC8vXG4gIGZ1bmN0aW9uIGF3YWl0UGFzc3dvcmRSZXNldFJlc3VsdCgpIHtcbiAgICB2YXIgZGVmZXIgPSBob29kaWUuZGVmZXIoKTtcblxuICAgIGFjY291bnQub25lKCdwYXNzd29yZHJlc2V0JywgZGVmZXIucmVzb2x2ZSApO1xuICAgIGFjY291bnQub25lKCdlcnJvcjpwYXNzd29yZHJlc2V0JywgZGVmZXIucmVqZWN0ICk7XG5cbiAgICAvLyBjbGVhbiB1cCBjYWxsYmFja3Mgd2hlbiBlaXRoZXIgZ2V0cyBjYWxsZWRcbiAgICBkZWZlci5hbHdheXMoIGZ1bmN0aW9uKCkge1xuICAgICAgYWNjb3VudC51bmJpbmQoJ3Bhc3N3b3JkcmVzZXQnLCBkZWZlci5yZXNvbHZlICk7XG4gICAgICBhY2NvdW50LnVuYmluZCgnZXJyb3I6cGFzc3dvcmRyZXNldCcsIGRlZmVyLnJlamVjdCApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gY2hhbmdlIHVzZXJuYW1lIGFuZCBwYXNzd29yZCBpbiAzIHN0ZXBzXG4gIC8vXG4gIC8vIDEuIGFzc3VyZSB3ZSBoYXZlIGEgdmFsaWQgc2Vzc2lvblxuICAvLyAyLiB1cGRhdGUgX3VzZXJzIGRvYyB3aXRoIG5ldyB1c2VybmFtZSBhbmQgbmV3IHBhc3N3b3JkIChpZiBwcm92aWRlZClcbiAgLy8gMy4gc2lnbiBpbiB3aXRoIG5ldyBjcmVkZW50aWFscyB0byBjcmVhdGUgbmV3IHNlc2lvbi5cbiAgLy9cbiAgZnVuY3Rpb24gY2hhbmdlVXNlcm5hbWVBbmRQYXNzd29yZChjdXJyZW50UGFzc3dvcmQsIG5ld1VzZXJuYW1lLCBuZXdQYXNzd29yZCkge1xuXG4gICAgcmV0dXJuIHNlbmRTaWduSW5SZXF1ZXN0KGFjY291bnQudXNlcm5hbWUsIGN1cnJlbnRQYXNzd29yZCwge1xuICAgICAgc2lsZW50OiB0cnVlXG4gICAgfSkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhY2NvdW50LmZldGNoKCkudGhlbihcbiAgICAgICAgc2VuZENoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmRSZXF1ZXN0KGN1cnJlbnRQYXNzd29yZCwgbmV3VXNlcm5hbWUsIG5ld1Bhc3N3b3JkKVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gdHVybiBhbiBhbm9ueW1vdXMgYWNjb3VudCBpbnRvIGEgcmVhbCBhY2NvdW50XG4gIC8vXG4gIGZ1bmN0aW9uIHVwZ3JhZGVBbm9ueW1vdXNBY2NvdW50KHVzZXJuYW1lLCBwYXNzd29yZCkge1xuICAgIHZhciBjdXJyZW50UGFzc3dvcmQgPSBnZXRBbm9ueW1vdXNQYXNzd29yZCgpO1xuXG4gICAgcmV0dXJuIGNoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmQoY3VycmVudFBhc3N3b3JkLCB1c2VybmFtZSwgcGFzc3dvcmQpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICBhY2NvdW50LnRyaWdnZXIoJ3NpZ251cCcsIHVzZXJuYW1lKTtcbiAgICAgIHJlbW92ZUFub255bW91c1Bhc3N3b3JkKCk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIHdlIG5vdyBjYW4gYmUgc3VyZSB0aGF0IHdlIGZldGNoZWQgdGhlIGxhdGVzdCBfdXNlcnMgZG9jLCBzbyB3ZSBjYW4gdXBkYXRlIGl0XG4gIC8vIHdpdGhvdXQgYSBwb3RlbnRpYWwgY29uZmxpY3QgZXJyb3IuXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZUZldGNoQmVmb3JlRGVzdHJveVN1Y2Nlc3MoKSB7XG5cbiAgICBob29kaWUucmVtb3RlLmRpc2Nvbm5lY3QoKTtcbiAgICB1c2VyRG9jLl9kZWxldGVkID0gdHJ1ZTtcblxuICAgIHJldHVybiB3aXRoUHJldmlvdXNSZXF1ZXN0c0Fib3J0ZWQoJ3VwZGF0ZVVzZXJzRG9jJywgZnVuY3Rpb24oKSB7XG4gICAgICBhY2NvdW50LnJlcXVlc3QoJ1BVVCcsIHVzZXJEb2NVcmwoKSwge1xuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh1c2VyRG9jKSxcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIGRlcGVuZGVuZCBvbiB3aGF0IGtpbmQgb2YgZXJyb3Igd2UgZ2V0LCB3ZSB3YW50IHRvIGlnbm9yZVxuICAvLyBpdCBvciBub3QuXG4gIC8vIFdoZW4gd2UgZ2V0IGEgJ0hvb2RpZU5vdEZvdW5kRXJyb3InIGl0IG1lYW5zIHRoYXQgdGhlIF91c2VycyBkb2MgaGFiZVxuICAvLyBiZWVuIHJlbW92ZWQgYWxyZWFkeSwgc28gd2UgZG9uJ3QgbmVlZCB0byBkbyBpdCBhbnltb3JlLCBidXRcbiAgLy8gc3RpbGwgd2FudCB0byBmaW5pc2ggdGhlIGRlc3Ryb3kgbG9jYWxseSwgc28gd2UgcmV0dXJuIGFcbiAgLy8gcmVzb2x2ZWQgcHJvbWlzZVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVGZXRjaEJlZm9yZURlc3Ryb3lFcnJvcihlcnJvcikge1xuICAgIGlmIChlcnJvci5uYW1lID09PSAnSG9vZGllTm90Rm91bmRFcnJvcicpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIC8vXG4gIC8vIHJlbW92ZSBldmVyeXRoaW5nIGZvcm0gdGhlIGN1cnJlbnQgYWNjb3VudCwgc28gYSBuZXcgYWNjb3VudCBjYW4gYmUgaW5pdGlhdGVkLlxuICAvL1xuICBmdW5jdGlvbiBjbGVhbnVwKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIGhvb2RpZS5zdG9yZSBpcyBsaXN0ZW5pbmcgb24gdGhpcyBvbmVcbiAgICBhY2NvdW50LnRyaWdnZXIoJ2NsZWFudXAnKTtcbiAgICBhdXRoZW50aWNhdGVkID0gb3B0aW9ucy5hdXRoZW50aWNhdGVkO1xuICAgIGhvb2RpZS5jb25maWcuY2xlYXIoKTtcbiAgICBzZXRVc2VybmFtZShvcHRpb25zLnVzZXJuYW1lKTtcbiAgICBzZXRPd25lcihvcHRpb25zLm93bmVySGFzaCB8fCBob29kaWUuZ2VuZXJhdGVJZCgpKTtcblxuICAgIHJldHVybiBob29kaWUucmVzb2x2ZSgpO1xuICB9XG5cblxuICAvL1xuICBmdW5jdGlvbiBjbGVhbnVwQW5kVHJpZ2dlclNpZ25PdXQoKSB7XG4gICAgcmV0dXJuIGNsZWFudXAoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFjY291bnQudHJpZ2dlcignc2lnbm91dCcpO1xuICAgIH0pO1xuICB9XG5cblxuICAvL1xuICAvLyBkZXBlbmRpbmcgb24gd2V0aGVyIHRoZSB1c2VyIHNpZ25lZFVwIG1hbnVhbGx5IG9yIGhhcyBiZWVuIHNpZ25lZCB1cFxuICAvLyBhbm9ueW1vdXNseSB0aGUgcHJlZml4IGluIHRoZSBDb3VjaERCIF91c2VycyBkb2MgZGlmZmVyZW50aWF0ZXMuXG4gIC8vIEFuIGFub255bW91cyB1c2VyIGlzIGNoYXJhY3Rlcml6ZWQgYnkgaXRzIHVzZXJuYW1lLCB0aGF0IGVxdWFsc1xuICAvLyBpdHMgb3duZXJIYXNoIChzZWUgYGFub255bW91c1NpZ25VcGApXG4gIC8vXG4gIC8vIFdlIGRpZmZlcmVudGlhdGUgd2l0aCBgaGFzQW5vbnltb3VzQWNjb3VudCgpYCwgYmVjYXVzZSBgdXNlclR5cGVBbmRJZGBcbiAgLy8gaXMgdXNlZCB3aXRoaW4gYHNpZ25VcGAgbWV0aG9kLCBzbyB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gZGlmZmVyZW50aWF0ZVxuICAvLyBiZXR3ZWVuIGFub255bW91cyBhbmQgbm9ybWFsIHVzZXJzIGJlZm9yZSBhbiBhY2NvdW50IGhhcyBiZWVuIGNyZWF0ZWQuXG4gIC8vXG4gIGZ1bmN0aW9uIHVzZXJUeXBlQW5kSWQodXNlcm5hbWUpIHtcbiAgICB2YXIgdHlwZTtcblxuICAgIGlmICh1c2VybmFtZSA9PT0gYWNjb3VudC5vd25lckhhc2gpIHtcbiAgICAgIHR5cGUgPSAndXNlcl9hbm9ueW1vdXMnO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eXBlID0gJ3VzZXInO1xuICAgIH1cbiAgICByZXR1cm4gJycgKyB0eXBlICsgJy8nICsgdXNlcm5hbWU7XG4gIH1cblxuXG4gIC8vXG4gIC8vIHR1cm4gYSB1c2VybmFtZSBpbnRvIGEgdmFsaWQgX3VzZXJzIGRvYy5faWRcbiAgLy9cbiAgZnVuY3Rpb24gdXNlckRvY0tleSh1c2VybmFtZSkge1xuICAgIHVzZXJuYW1lID0gdXNlcm5hbWUgfHwgYWNjb3VudC51c2VybmFtZTtcbiAgICByZXR1cm4gJycgKyB1c2VyRG9jUHJlZml4ICsgJzonICsgKHVzZXJUeXBlQW5kSWQodXNlcm5hbWUpKTtcbiAgfVxuXG4gIC8vXG4gIC8vIGdldCBVUkwgb2YgbXkgX3VzZXJzIGRvY1xuICAvL1xuICBmdW5jdGlvbiB1c2VyRG9jVXJsKHVzZXJuYW1lKSB7XG4gICAgcmV0dXJuICcvX3VzZXJzLycgKyAoZW5jb2RlVVJJQ29tcG9uZW50KHVzZXJEb2NLZXkodXNlcm5hbWUpKSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIHVwZGF0ZSBteSBfdXNlcnMgZG9jLlxuICAvL1xuICAvLyBJZiBhIG5ldyB1c2VybmFtZSBoYXMgYmVlbiBwYXNzZWQsIHdlIHNldCB0aGUgc3BlY2lhbCBhdHRyaWJ1dCAkbmV3VXNlcm5hbWUuXG4gIC8vIFRoaXMgd2lsbCBsZXQgdGhlIHVzZXJuYW1lIGNoYW5nZSB3b3JrZXIgY3JlYXRlIGNyZWF0ZSBhIG5ldyBfdXNlcnMgZG9jIGZvclxuICAvLyB0aGUgbmV3IHVzZXJuYW1lIGFuZCByZW1vdmUgdGhlIGN1cnJlbnQgb25lXG4gIC8vXG4gIC8vIElmIGEgbmV3IHBhc3N3b3JkIGhhcyBiZWVuIHBhc3NlZCwgc2FsdCBhbmQgcGFzc3dvcmRfc2hhIGdldCByZW1vdmVkXG4gIC8vIGZyb20gX3VzZXJzIGRvYyBhbmQgYWRkIHRoZSBwYXNzd29yZCBpbiBjbGVhciB0ZXh0LiBDb3VjaERCIHdpbGwgcmVwbGFjZSBpdCB3aXRoXG4gIC8vIGFjY29yZGluZyBwYXNzd29yZF9zaGEgYW5kIGEgbmV3IHNhbHQgc2VydmVyIHNpZGVcbiAgLy9cbiAgZnVuY3Rpb24gc2VuZENoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmRSZXF1ZXN0KGN1cnJlbnRQYXNzd29yZCwgbmV3VXNlcm5hbWUsIG5ld1Bhc3N3b3JkKSB7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAvLyBwcmVwYXJlIHVwZGF0ZWQgX3VzZXJzIGRvY1xuICAgICAgdmFyIGRhdGEgPSAkLmV4dGVuZCh7fSwgdXNlckRvYyk7XG5cbiAgICAgIGlmIChuZXdVc2VybmFtZSkge1xuICAgICAgICBkYXRhLiRuZXdVc2VybmFtZSA9IG5ld1VzZXJuYW1lO1xuICAgICAgfVxuXG4gICAgICBkYXRhLnVwZGF0ZWRBdCA9IG5vdygpO1xuICAgICAgZGF0YS5zaWduZWRVcEF0ID0gZGF0YS5zaWduZWRVcEF0IHx8IG5vdygpO1xuXG4gICAgICAvLyB0cmlnZ2VyIHBhc3N3b3JkIHVwZGF0ZSB3aGVuIG5ld1Bhc3N3b3JkIHNldFxuICAgICAgaWYgKG5ld1Bhc3N3b3JkICE9PSBudWxsKSB7XG4gICAgICAgIGRlbGV0ZSBkYXRhLnNhbHQ7XG4gICAgICAgIGRlbGV0ZSBkYXRhLnBhc3N3b3JkX3NoYTtcbiAgICAgICAgZGF0YS5wYXNzd29yZCA9IG5ld1Bhc3N3b3JkO1xuICAgICAgfVxuXG4gICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiB3aXRoUHJldmlvdXNSZXF1ZXN0c0Fib3J0ZWQoJ3VwZGF0ZVVzZXJzRG9jJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBhY2NvdW50LnJlcXVlc3QoJ1BVVCcsIHVzZXJEb2NVcmwoKSwgb3B0aW9ucykudGhlbihcbiAgICAgICAgICBoYW5kbGVDaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkUmVxdWVzdChuZXdVc2VybmFtZSwgbmV3UGFzc3dvcmQgfHwgY3VycmVudFBhc3N3b3JkKVxuICAgICAgICApO1xuICAgICAgfSk7XG5cbiAgICB9O1xuICB9XG5cblxuICAvL1xuICAvLyBkZXBlbmRpbmcgb24gd2hldGhlciBhIG5ld1VzZXJuYW1lIGhhcyBiZWVuIHBhc3NlZCwgd2UgY2FuIHNpZ24gaW4gcmlnaHQgYXdheVxuICAvLyBvciBoYXZlIHRvIHVzZSB0aGUgZGVsYXllZCBzaWduIGluIHRvIGdpdmUgdGhlIHVzZXJuYW1lIGNoYW5nZSB3b3JrZXIgc29tZSB0aW1lXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZUNoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmRSZXF1ZXN0KG5ld1VzZXJuYW1lLCBuZXdQYXNzd29yZCkge1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaG9vZGllLnJlbW90ZS5kaXNjb25uZWN0KCk7XG5cbiAgICAgIGlmIChuZXdVc2VybmFtZSkge1xuICAgICAgICByZXR1cm4gZGVsYXllZFNpZ25JbihuZXdVc2VybmFtZSwgbmV3UGFzc3dvcmQsIHtcbiAgICAgICAgICBzaWxlbnQ6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gYWNjb3VudC5zaWduSW4oYWNjb3VudC51c2VybmFtZSwgbmV3UGFzc3dvcmQpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuXG4gIC8vXG4gIC8vIG1ha2Ugc3VyZSB0aGF0IHRoZSBzYW1lIHJlcXVlc3QgZG9lc24ndCBnZXQgc2VudCB0d2ljZVxuICAvLyBieSBjYW5jZWxsaW5nIHRoZSBwcmV2aW91cyBvbmUuXG4gIC8vXG4gIGZ1bmN0aW9uIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZChuYW1lLCByZXF1ZXN0RnVuY3Rpb24pIHtcbiAgICBpZiAocmVxdWVzdHNbbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGVvZiByZXF1ZXN0c1tuYW1lXS5hYm9ydCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXF1ZXN0c1tuYW1lXS5hYm9ydCgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXF1ZXN0c1tuYW1lXSA9IHJlcXVlc3RGdW5jdGlvbigpO1xuICAgIHJldHVybiByZXF1ZXN0c1tuYW1lXTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gaWYgdGhlcmUgaXMgYSBwZW5kaW5nIHJlcXVlc3QsIHJldHVybiBpdHMgcHJvbWlzZSBpbnN0ZWFkXG4gIC8vIG9mIHNlbmRpbmcgYW5vdGhlciByZXF1ZXN0XG4gIC8vXG4gIGZ1bmN0aW9uIHdpdGhTaW5nbGVSZXF1ZXN0KG5hbWUsIHJlcXVlc3RGdW5jdGlvbikge1xuXG4gICAgaWYgKHJlcXVlc3RzW25hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eXBlb2YgcmVxdWVzdHNbbmFtZV0uc3RhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaWYgKHJlcXVlc3RzW25hbWVdLnN0YXRlKCkgPT09ICdwZW5kaW5nJykge1xuICAgICAgICAgIHJldHVybiByZXF1ZXN0c1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJlcXVlc3RzW25hbWVdID0gcmVxdWVzdEZ1bmN0aW9uKCk7XG4gICAgcmV0dXJuIHJlcXVlc3RzW25hbWVdO1xuICB9XG5cblxuICAvL1xuICAvLyBwdXNoIGxvY2FsIGNoYW5nZXMgd2hlbiB1c2VyIHNpZ25zIG91dCwgdW5sZXNzIGhlIGVuZm9yY2VzIHNpZ24gb3V0XG4gIC8vIGluIGFueSBjYXNlIHdpdGggYHtpZ25vcmVMb2NhbENoYW5nZXM6IHRydWV9YFxuICAvL1xuICBmdW5jdGlvbiBwdXNoTG9jYWxDaGFuZ2VzKG9wdGlvbnMpIHtcbiAgICBpZihob29kaWUuc3RvcmUuaGFzTG9jYWxDaGFuZ2VzKCkgJiYgIW9wdGlvbnMuaWdub3JlTG9jYWxDaGFuZ2VzKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlbW90ZS5wdXNoKCk7XG4gICAgfVxuICAgIHJldHVybiBob29kaWUucmVzb2x2ZSgpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gc2VuZFNpZ25PdXRSZXF1ZXN0KCkge1xuICAgIHJldHVybiB3aXRoU2luZ2xlUmVxdWVzdCgnc2lnbk91dCcsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnREVMRVRFJywgJy9fc2Vzc2lvbicpO1xuICAgIH0pO1xuICB9XG5cblxuICAvL1xuICAvLyB0aGUgc2lnbiBpbiByZXF1ZXN0IHRoYXQgc3RhcnRzIGEgQ291Y2hEQiBzZXNzaW9uIGlmXG4gIC8vIGl0IHN1Y2NlZWRzLiBXZSBzZXBhcmF0ZWQgdGhlIGFjdHVhbCBzaWduIGluIHJlcXVlc3QgZnJvbVxuICAvLyB0aGUgc2lnbkluIG1ldGhvZCwgYXMgdGhlIGxhdHRlciBhbHNvIHJ1bnMgc2lnbk91dCBpbnRlbnJ0YWxseVxuICAvLyB0byBjbGVhbiB1cCBsb2NhbCBkYXRhIGJlZm9yZSBzdGFydGluZyBhIG5ldyBzZXNzaW9uLiBCdXQgYXNcbiAgLy8gb3RoZXIgbWV0aG9kcyBsaWtlIHNpZ25VcCBvciBjaGFuZ2VQYXNzd29yZCBkbyBhbHNvIG5lZWQgdG9cbiAgLy8gc2lnbiBpbiB0aGUgdXNlciAoYWdhaW4pLCB0aGVzZSBuZWVkIHRvIHNlbmQgdGhlIHNpZ24gaW5cbiAgLy8gcmVxdWVzdCBidXQgd2l0aG91dCBhIHNpZ25PdXQgYmVmb3JlaGFuZCwgYXMgdGhlIHVzZXIgcmVtYWluc1xuICAvLyB0aGUgc2FtZS5cbiAgLy9cbiAgZnVuY3Rpb24gc2VuZFNpZ25JblJlcXVlc3QodXNlcm5hbWUsIHBhc3N3b3JkLCBvcHRpb25zKSB7XG4gICAgdmFyIHJlcXVlc3RPcHRpb25zID0ge1xuICAgICAgZGF0YToge1xuICAgICAgICBuYW1lOiB1c2VyVHlwZUFuZElkKHVzZXJuYW1lKSxcbiAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkXG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiB3aXRoUHJldmlvdXNSZXF1ZXN0c0Fib3J0ZWQoJ3NpZ25JbicsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHByb21pc2UgPSBhY2NvdW50LnJlcXVlc3QoJ1BPU1QnLCAnL19zZXNzaW9uJywgcmVxdWVzdE9wdGlvbnMpO1xuXG4gICAgICByZXR1cm4gcHJvbWlzZS50aGVuKFxuICAgICAgICBoYW5kbGVTaWduSW5TdWNjZXNzKG9wdGlvbnMpXG4gICAgICApO1xuICAgIH0pO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gbm93KCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpO1xuICB9XG5cbiAgLy9cbiAgLy8gZXhwb3NlIHB1YmxpYyBhY2NvdW50IEFQSVxuICAvL1xuICBob29kaWUuYWNjb3VudCA9IGFjY291bnQ7XG5cbiAgLy8gVE9ETzogd2Ugc2hvdWxkIG1vdmUgdGhlIG93bmVyIGhhc2ggb24gaG9vZGllIGNvcmUsIGFzXG4gIC8vICAgICAgIG90aGVyIG1vZHVsZXMgZGVwZW5kIG9uIGl0IGFzIHdlbGwsIGxpa2UgaG9vZGllLnN0b3JlLlxuICAvLyB0aGUgb3duZXJIYXNoIGdldHMgc3RvcmVkIGluIGV2ZXJ5IG9iamVjdCBjcmVhdGVkIGJ5IHRoZSB1c2VyLlxuICAvLyBNYWtlIHN1cmUgd2UgaGF2ZSBvbmUuXG4gIGhvb2RpZS5hY2NvdW50Lm93bmVySGFzaCA9IGhvb2RpZS5jb25maWcuZ2V0KCdfYWNjb3VudC5vd25lckhhc2gnKTtcbiAgaWYgKCFob29kaWUuYWNjb3VudC5vd25lckhhc2gpIHtcbiAgICBzZXRPd25lcihob29kaWUuZ2VuZXJhdGVJZCgpKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZUFjY291bnQ7XG4iLCIvLyBBY2NvdW50UmVtb3RlXG4vLyA9PT09PT09PT09PT09PT1cblxuLy8gQ29ubmVjdGlvbiAvIFNvY2tldCB0byBvdXIgY291Y2hcbi8vXG4vLyBBY2NvdW50UmVtb3RlIGlzIHVzaW5nIENvdWNoREIncyBgX2NoYW5nZXNgIGZlZWQgdG9cbi8vIGxpc3RlbiB0byBjaGFuZ2VzIGFuZCBgX2J1bGtfZG9jc2AgdG8gcHVzaCBsb2NhbCBjaGFuZ2VzXG4vL1xuLy8gV2hlbiBob29kaWUucmVtb3RlIGlzIGNvbnRpbnVvdXNseSBzeW5jaW5nIChkZWZhdWx0KSxcbi8vIGl0IHdpbGwgY29udGludW91c2x5ICBzeW5jaHJvbml6ZSB3aXRoIGxvY2FsIHN0b3JlLFxuLy8gb3RoZXJ3aXNlIHN5bmMsIHB1bGwgb3IgcHVzaCBjYW4gYmUgY2FsbGVkIG1hbnVhbGx5XG4vL1xuXG5mdW5jdGlvbiBob29kaWVSZW1vdGUgKGhvb2RpZSkge1xuICAvLyBpbmhlcml0IGZyb20gSG9vZGllcyBTdG9yZSBBUElcbiAgdmFyIHJlbW90ZSA9IGhvb2RpZS5vcGVuKGhvb2RpZS5hY2NvdW50LmRiKCksIHtcblxuICAgIC8vIHdlJ3JlIGFsd2F5cyBjb25uZWN0ZWQgdG8gb3VyIG93biBkYlxuICAgIGNvbm5lY3RlZDogdHJ1ZSxcblxuICAgIC8vIGRvIG5vdCBwcmVmaXggZmlsZXMgZm9yIG15IG93biByZW1vdGVcbiAgICBwcmVmaXg6ICcnLFxuXG4gICAgLy9cbiAgICBzaW5jZTogc2luY2VOckNhbGxiYWNrLFxuXG4gICAgLy9cbiAgICBkZWZhdWx0T2JqZWN0c1RvUHVzaDogaG9vZGllLnN0b3JlLmNoYW5nZWRPYmplY3RzLFxuXG4gICAgLy9cbiAgICBrbm93bk9iamVjdHM6IGhvb2RpZS5zdG9yZS5pbmRleCgpLm1hcCggZnVuY3Rpb24oa2V5KSB7XG4gICAgICB2YXIgdHlwZUFuZElkID0ga2V5LnNwbGl0KC9cXC8vKTtcbiAgICAgIHJldHVybiB7IHR5cGU6IHR5cGVBbmRJZFswXSwgaWQ6IHR5cGVBbmRJZFsxXX07XG4gICAgfSlcbiAgfSk7XG5cbiAgLy8gQ29ubmVjdFxuICAvLyAtLS0tLS0tLS1cblxuICAvLyB3ZSBzbGlnaHRseSBleHRlbmQgdGhlIG9yaWdpbmFsIHJlbW90ZS5jb25uZWN0IG1ldGhvZFxuICAvLyBwcm92aWRlZCBieSBgaG9vZGllUmVtb3RlU3RvcmVgLCB0byBjaGVjayBpZiB0aGUgdXNlclxuICAvLyBoYXMgYW4gYWNjb3VudCBiZWZvcmVoYW5kLiBXZSBhbHNvIGhhcmRjb2RlIHRoZSByaWdodFxuICAvLyBuYW1lIGZvciByZW1vdGUgKGN1cnJlbnQgdXNlcidzIGRhdGFiYXNlIG5hbWUpXG4gIC8vXG4gIHZhciBvcmlnaW5hbENvbm5lY3RNZXRob2QgPSByZW1vdGUuY29ubmVjdDtcbiAgcmVtb3RlLmNvbm5lY3QgPSBmdW5jdGlvbiBjb25uZWN0KCkge1xuICAgIGlmICghIGhvb2RpZS5hY2NvdW50Lmhhc0FjY291bnQoKSApIHtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aCgnVXNlciBoYXMgbm8gZGF0YWJhc2UgdG8gY29ubmVjdCB0bycpO1xuICAgIH1cbiAgICByZXR1cm4gb3JpZ2luYWxDb25uZWN0TWV0aG9kKCBob29kaWUuYWNjb3VudC5kYigpICk7XG4gIH07XG5cbiAgLy8gdHJpZ2dlclxuICAvLyAtLS0tLS0tLS1cblxuICAvLyBwcm94aWVzIHRvIGhvb2RpZS50cmlnZ2VyXG4gIHJlbW90ZS50cmlnZ2VyID0gZnVuY3Rpb24gdHJpZ2dlcigpIHtcbiAgICB2YXIgZXZlbnROYW1lO1xuXG4gICAgZXZlbnROYW1lID0gYXJndW1lbnRzWzBdO1xuXG4gICAgdmFyIHBhcmFtZXRlcnMgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG5cbiAgICByZXR1cm4gaG9vZGllLnRyaWdnZXIuYXBwbHkoaG9vZGllLCBbJ3JlbW90ZTonICsgZXZlbnROYW1lXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwocGFyYW1ldGVycykpKTtcbiAgfTtcblxuXG4gIC8vIG9uXG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHByb3hpZXMgdG8gaG9vZGllLm9uXG4gIHJlbW90ZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50TmFtZSwgZGF0YSkge1xuICAgIGV2ZW50TmFtZSA9IGV2ZW50TmFtZS5yZXBsYWNlKC8oXnwgKShbXiBdKykvZywgJyQxJysncmVtb3RlOiQyJyk7XG4gICAgcmV0dXJuIGhvb2RpZS5vbihldmVudE5hbWUsIGRhdGEpO1xuICB9O1xuXG5cbiAgLy8gdW5iaW5kXG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHByb3hpZXMgdG8gaG9vZGllLnVuYmluZFxuICByZW1vdGUudW5iaW5kID0gZnVuY3Rpb24gdW5iaW5kKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgICBldmVudE5hbWUgPSBldmVudE5hbWUucmVwbGFjZSgvKF58ICkoW14gXSspL2csICckMScrJ3JlbW90ZTokMicpO1xuICAgIHJldHVybiBob29kaWUudW5iaW5kKGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuICB9O1xuXG5cbiAgLy8gUHJpdmF0ZVxuICAvLyAtLS0tLS0tLS1cblxuICAvLyBnZXR0ZXIgLyBzZXR0ZXIgZm9yIHNpbmNlIG51bWJlclxuICAvL1xuICBmdW5jdGlvbiBzaW5jZU5yQ2FsbGJhY2soc2luY2VOcikge1xuICAgIGlmIChzaW5jZU5yKSB7XG4gICAgICByZXR1cm4gaG9vZGllLmNvbmZpZy5zZXQoJ19yZW1vdGUuc2luY2UnLCBzaW5jZU5yKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaG9vZGllLmNvbmZpZy5nZXQoJ19yZW1vdGUuc2luY2UnKSB8fCAwO1xuICB9XG5cbiAgLy9cbiAgLy8gc3Vic2NyaWJlIHRvIGV2ZW50cyBjb21pbmcgZnJvbSBvdXRzaWRlXG4gIC8vXG4gIGZ1bmN0aW9uIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpIHtcblxuICAgIGhvb2RpZS5vbigncmVtb3RlOmNvbm5lY3QnLCBmdW5jdGlvbigpIHtcbiAgICAgIGhvb2RpZS5vbignc3RvcmU6aWRsZScsIHJlbW90ZS5wdXNoKTtcbiAgICAgIHJlbW90ZS5wdXNoKCk7XG4gICAgfSk7XG5cbiAgICBob29kaWUub24oJ3JlbW90ZTpkaXNjb25uZWN0JywgZnVuY3Rpb24oKSB7XG4gICAgICBob29kaWUudW5iaW5kKCdzdG9yZTppZGxlJywgcmVtb3RlLnB1c2gpO1xuICAgIH0pO1xuXG4gICAgaG9vZGllLm9uKCdkaXNjb25uZWN0ZWQnLCByZW1vdGUuZGlzY29ubmVjdCk7XG4gICAgaG9vZGllLm9uKCdyZWNvbm5lY3RlZCcsIHJlbW90ZS5jb25uZWN0KTtcblxuICAgIC8vIGFjY291bnQgZXZlbnRzXG4gICAgaG9vZGllLm9uKCdhY2NvdW50OnNpZ25pbicsIHJlbW90ZS5jb25uZWN0KTtcbiAgICBob29kaWUub24oJ2FjY291bnQ6c2lnbmluOmFub255bW91cycsIHJlbW90ZS5jb25uZWN0KTtcblxuICAgIGhvb2RpZS5vbignYWNjb3VudDpyZWF1dGhlbnRpY2F0ZWQnLCByZW1vdGUuY29ubmVjdCk7XG4gICAgaG9vZGllLm9uKCdhY2NvdW50OnNpZ25vdXQnLCByZW1vdGUuZGlzY29ubmVjdCk7XG4gIH1cblxuICAvLyBhbGxvdyB0byBydW4gdGhpcyBvbmNlIGZyb20gb3V0c2lkZVxuICByZW1vdGUuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG4gICAgZGVsZXRlIHJlbW90ZS5zdWJzY3JpYmVUb091dHNpZGVFdmVudHM7XG4gIH07XG5cbiAgLy9cbiAgLy8gZXhwb3NlIHJlbW90ZSBBUElcbiAgLy9cbiAgaG9vZGllLnJlbW90ZSA9IHJlbW90ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVSZW1vdGU7XG4iLCIvLyBIb29kaWUgQ29uZmlnIEFQSVxuLy8gPT09PT09PT09PT09PT09PT09PVxuXG4vL1xuZnVuY3Rpb24gaG9vZGllQ29uZmlnKGhvb2RpZSkge1xuICB2YXIgdHlwZSA9ICckY29uZmlnJztcbiAgdmFyIGlkID0gJ2hvb2RpZSc7XG4gIHZhciBjYWNoZSA9IHt9O1xuXG4gIC8vIHB1YmxpYyBBUElcbiAgdmFyIGNvbmZpZyA9IHt9O1xuXG5cbiAgLy8gc2V0XG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyBhZGRzIGEgY29uZmlndXJhdGlvblxuICAvL1xuICBjb25maWcuc2V0ID0gZnVuY3Rpb24gc2V0KGtleSwgdmFsdWUpIHtcbiAgICB2YXIgaXNTaWxlbnQsIHVwZGF0ZTtcblxuICAgIGlmIChjYWNoZVtrZXldID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNhY2hlW2tleV0gPSB2YWx1ZTtcblxuICAgIHVwZGF0ZSA9IHt9O1xuICAgIHVwZGF0ZVtrZXldID0gdmFsdWU7XG4gICAgaXNTaWxlbnQgPSBrZXkuY2hhckF0KDApID09PSAnXyc7XG5cbiAgICByZXR1cm4gaG9vZGllLnN0b3JlLnVwZGF0ZU9yQWRkKHR5cGUsIGlkLCB1cGRhdGUsIHtcbiAgICAgIHNpbGVudDogaXNTaWxlbnRcbiAgICB9KTtcbiAgfTtcblxuICAvLyBnZXRcbiAgLy8gLS0tLS0tLS0tLVxuXG4gIC8vIHJlY2VpdmVzIGEgY29uZmlndXJhdGlvblxuICAvL1xuICBjb25maWcuZ2V0ID0gZnVuY3Rpb24gZ2V0KGtleSkge1xuICAgIHJldHVybiBjYWNoZVtrZXldO1xuICB9O1xuXG4gIC8vIGNsZWFyXG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyBjbGVhcnMgY2FjaGUgYW5kIHJlbW92ZXMgb2JqZWN0IGZyb20gc3RvcmVcbiAgLy9cbiAgY29uZmlnLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgY2FjaGUgPSB7fTtcbiAgICByZXR1cm4gaG9vZGllLnN0b3JlLnJlbW92ZSh0eXBlLCBpZCk7XG4gIH07XG5cbiAgLy8gdW5zZXRcbiAgLy8gLS0tLS0tLS0tLVxuXG4gIC8vIHVuc2V0cyBhIGNvbmZpZ3VyYXRpb24sIGlzIGEgc2ltcGxlIGFsaWFzIGZvciBjb25maWcuc2V0KGtleSwgdW5kZWZpbmVkKVxuICAvL1xuICBjb25maWcudW5zZXQgPSBmdW5jdGlvbiB1bnNldChrZXkpIHtcbiAgICByZXR1cm4gY29uZmlnLnNldChrZXksIHVuZGVmaW5lZCk7XG4gIH07XG5cbiAgLy8gbG9hZCBjYWNoZVxuICAvLyBUT0RPOiBJIHJlYWxseSBkb24ndCBsaWtlIHRoaXMgYmVpbmcgaGVyZS4gQW5kIEkgZG9uJ3QgbGlrZSB0aGF0IGlmIHRoZVxuICAvLyAgICAgICBzdG9yZSBBUEkgd2lsbCBiZSB0cnVseSBhc3luYyBvbmUgZGF5LCB0aGlzIHdpbGwgZmFsbCBvbiBvdXIgZmVldC5cbiAgaG9vZGllLnN0b3JlLmZpbmQodHlwZSwgaWQpLmRvbmUoZnVuY3Rpb24ob2JqKSB7XG4gICAgY2FjaGUgPSBvYmo7XG4gIH0pO1xuXG4gIC8vIGV4c3Bvc2UgcHVibGljIEFQSVxuICBob29kaWUuY29uZmlnID0gY29uZmlnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZUNvbmZpZztcbiIsIi8vIGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24oKSAmIGhvb2RpZS5pc0Nvbm5lY3RlZCgpXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbi8vXG5mdW5jdGlvbiBob29kaWVDb25uZWN0aW9uKGhvb2RpZSkge1xuICAvLyBzdGF0ZVxuICB2YXIgb25saW5lID0gdHJ1ZTtcbiAgdmFyIGNoZWNrQ29ubmVjdGlvbkludGVydmFsID0gMzAwMDA7XG4gIHZhciBjaGVja0Nvbm5lY3Rpb25SZXF1ZXN0ID0gbnVsbDtcbiAgdmFyIGNoZWNrQ29ubmVjdGlvblRpbWVvdXQgPSBudWxsO1xuXG4gIC8vIENoZWNrIENvbm5lY3Rpb25cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gdGhlIGBjaGVja0Nvbm5lY3Rpb25gIG1ldGhvZCBpcyB1c2VkLCB3ZWxsLCB0byBjaGVjayBpZlxuICAvLyB0aGUgaG9vZGllIGJhY2tlbmQgaXMgcmVhY2hhYmxlIGF0IGBiYXNlVXJsYCBvciBub3QuXG4gIC8vIENoZWNrIENvbm5lY3Rpb24gaXMgYXV0b21hdGljYWxseSBjYWxsZWQgb24gc3RhcnR1cFxuICAvLyBhbmQgdGhlbiBlYWNoIDMwIHNlY29uZHMuIElmIGl0IGZhaWxzLCBpdFxuICAvL1xuICAvLyAtIHNldHMgYG9ubGluZSA9IGZhbHNlYFxuICAvLyAtIHRyaWdnZXJzIGBvZmZsaW5lYCBldmVudFxuICAvLyAtIHNldHMgYGNoZWNrQ29ubmVjdGlvbkludGVydmFsID0gMzAwMGBcbiAgLy9cbiAgLy8gd2hlbiBjb25uZWN0aW9uIGNhbiBiZSByZWVzdGFibGlzaGVkLCBpdFxuICAvL1xuICAvLyAtIHNldHMgYG9ubGluZSA9IHRydWVgXG4gIC8vIC0gdHJpZ2dlcnMgYG9ubGluZWAgZXZlbnRcbiAgLy8gLSBzZXRzIGBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCA9IDMwMDAwYFxuICAvL1xuICBob29kaWUuY2hlY2tDb25uZWN0aW9uID0gZnVuY3Rpb24gY2hlY2tDb25uZWN0aW9uKCkge1xuICAgIHZhciByZXEgPSBjaGVja0Nvbm5lY3Rpb25SZXF1ZXN0O1xuXG4gICAgaWYgKHJlcSAmJiByZXEuc3RhdGUoKSA9PT0gJ3BlbmRpbmcnKSB7XG4gICAgICByZXR1cm4gcmVxO1xuICAgIH1cblxuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoY2hlY2tDb25uZWN0aW9uVGltZW91dCk7XG5cbiAgICBjaGVja0Nvbm5lY3Rpb25SZXF1ZXN0ID0gaG9vZGllLnJlcXVlc3QoJ0dFVCcsICcvJykudGhlbihcbiAgICAgIGhhbmRsZUNoZWNrQ29ubmVjdGlvblN1Y2Nlc3MsXG4gICAgICBoYW5kbGVDaGVja0Nvbm5lY3Rpb25FcnJvclxuICAgICk7XG5cbiAgICByZXR1cm4gY2hlY2tDb25uZWN0aW9uUmVxdWVzdDtcbiAgfTtcblxuXG4gIC8vIGlzQ29ubmVjdGVkXG4gIC8vIC0tLS0tLS0tLS0tLS1cblxuICAvL1xuICBob29kaWUuaXNDb25uZWN0ZWQgPSBmdW5jdGlvbiBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gb25saW5lO1xuICB9O1xuXG5cbiAgLy9cbiAgLy9cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQ2hlY2tDb25uZWN0aW9uU3VjY2VzcygpIHtcbiAgICBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCA9IDMwMDAwO1xuXG4gICAgY2hlY2tDb25uZWN0aW9uVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24sIGNoZWNrQ29ubmVjdGlvbkludGVydmFsKTtcblxuICAgIGlmICghaG9vZGllLmlzQ29ubmVjdGVkKCkpIHtcbiAgICAgIGhvb2RpZS50cmlnZ2VyKCdyZWNvbm5lY3RlZCcpO1xuICAgICAgb25saW5lID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gaG9vZGllLnJlc29sdmUoKTtcbiAgfVxuXG5cbiAgLy9cbiAgLy9cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQ2hlY2tDb25uZWN0aW9uRXJyb3IoKSB7XG4gICAgY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwgPSAzMDAwO1xuXG4gICAgY2hlY2tDb25uZWN0aW9uVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24sIGNoZWNrQ29ubmVjdGlvbkludGVydmFsKTtcblxuICAgIGlmIChob29kaWUuaXNDb25uZWN0ZWQoKSkge1xuICAgICAgaG9vZGllLnRyaWdnZXIoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgb25saW5lID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhvb2RpZS5yZWplY3QoKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZUNvbm5lY3Rpb247XG4iLCIvLyBob29kaWUuZGlzcG9zZVxuLy8gPT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBob29kaWVEaXNwb3NlIChob29kaWUpIHtcblxuICAvLyBpZiBhIGhvb2RpZSBpbnN0YW5jZSBpcyBub3QgbmVlZGVkIGFueW1vcmUsIGl0IGNhblxuICAvLyBiZSBkaXNwb3NlZCB1c2luZyB0aGlzIG1ldGhvZC4gQSBgZGlzcG9zZWAgZXZlbnRcbiAgLy8gZ2V0cyB0cmlnZ2VyZWQgdGhhdCB0aGUgbW9kdWxlcyByZWFjdCBvbi5cbiAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICBob29kaWUudHJpZ2dlcignZGlzcG9zZScpO1xuICAgIGhvb2RpZS51bmJpbmQoKTtcbiAgfVxuXG4gIC8vXG4gIC8vIFB1YmxpYyBBUElcbiAgLy9cbiAgaG9vZGllLmRpc3Bvc2UgPSBkaXNwb3NlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZURpc3Bvc2U7XG4iLCIvLyBIb29kaWUgRXJyb3Jcbi8vIC0tLS0tLS0tLS0tLS1cblxuLy8gV2l0aCB0aGUgY3VzdG9tIGhvb2RpZSBlcnJvciBmdW5jdGlvblxuLy8gd2Ugbm9ybWFsaXplIGFsbCBlcnJvcnMgdGhlIGdldCByZXR1cm5lZFxuLy8gd2hlbiB1c2luZyBob29kaWUucmVqZWN0V2l0aFxuLy9cbi8vIFRoZSBuYXRpdmUgSmF2YVNjcmlwdCBlcnJvciBtZXRob2QgaGFzXG4vLyBhIG5hbWUgJiBhIG1lc3NhZ2UgcHJvcGVydHkuIEhvb2RpZUVycm9yXG4vLyByZXF1aXJlcyB0aGVzZSwgYnV0IG9uIHRvcCBhbGxvd3MgZm9yXG4vLyB1bmxpbWl0ZWQgY3VzdG9tIHByb3BlcnRpZXMuXG4vL1xuLy8gSW5zdGVhZCBvZiBiZWluZyBpbml0aWFsaXplZCB3aXRoIGp1c3Rcbi8vIHRoZSBtZXNzYWdlLCBIb29kaWVFcnJvciBleHBlY3RzIGFuXG4vLyBvYmplY3Qgd2l0aCBwcm9wZXJpdGVzLiBUaGUgYG1lc3NhZ2VgXG4vLyBwcm9wZXJ0eSBpcyByZXF1aXJlZC4gVGhlIG5hbWUgd2lsbFxuLy8gZmFsbGJhY2sgdG8gYGVycm9yYC5cbi8vXG4vLyBgbWVzc2FnZWAgY2FuIGFsc28gY29udGFpbiBwbGFjZWhvbGRlcnNcbi8vIGluIHRoZSBmb3JtIG9mIGB7e3Byb3BlcnR5TmFtZX19YGAgd2hpY2hcbi8vIHdpbGwgZ2V0IHJlcGxhY2VkIGF1dG9tYXRpY2FsbHkgd2l0aCBwYXNzZWRcbi8vIGV4dHJhIHByb3BlcnRpZXMuXG4vL1xuLy8gIyMjIEVycm9yIENvbnZlbnRpb25zXG4vL1xuLy8gV2UgZm9sbG93IEphdmFTY3JpcHQncyBuYXRpdmUgZXJyb3IgY29udmVudGlvbnMsXG4vLyBtZWFuaW5nIHRoYXQgZXJyb3IgbmFtZXMgYXJlIGNhbWVsQ2FzZSB3aXRoIHRoZVxuLy8gZmlyc3QgbGV0dGVyIHVwcGVyY2FzZSBhcyB3ZWxsLCBhbmQgdGhlIG1lc3NhZ2Vcbi8vIHN0YXJ0aW5nIHdpdGggYW4gdXBwZXJjYXNlIGxldHRlci5cbi8vXG52YXIgZXJyb3JNZXNzYWdlUmVwbGFjZVBhdHRlcm4gPSAvXFx7XFx7XFxzKlxcdytcXHMqXFx9XFx9L2c7XG52YXIgZXJyb3JNZXNzYWdlRmluZFByb3BlcnR5UGF0dGVybiA9IC9cXHcrLztcbmZ1bmN0aW9uIEhvb2RpZUVycm9yKHByb3BlcnRpZXMpIHtcblxuICAvLyBub3JtYWxpemUgYXJndW1lbnRzXG4gIGlmICh0eXBlb2YgcHJvcGVydGllcyA9PT0gJ3N0cmluZycpIHtcbiAgICBwcm9wZXJ0aWVzID0ge1xuICAgICAgbWVzc2FnZTogcHJvcGVydGllc1xuICAgIH07XG4gIH1cblxuICBpZiAoISBwcm9wZXJ0aWVzLm1lc3NhZ2UpIHtcbiAgICB0aHJvdyAnRkFUQUw6IGVycm9yLm1lc3NhZ2UgbXVzdCBiZSBzZXQnO1xuICB9XG5cbiAgaWYgKCEgcHJvcGVydGllcy5uYW1lKSB7XG4gICAgcHJvcGVydGllcy5uYW1lID0gJ0hvb2RpZUVycm9yJztcbiAgfVxuXG4gICQuZXh0ZW5kKHRoaXMsIHByb3BlcnRpZXMpO1xuICBwcm9wZXJ0aWVzLm1lc3NhZ2UgPSBwcm9wZXJ0aWVzLm1lc3NhZ2UucmVwbGFjZShlcnJvck1lc3NhZ2VSZXBsYWNlUGF0dGVybiwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICB2YXIgcHJvcGVydHkgPSBtYXRjaC5tYXRjaChlcnJvck1lc3NhZ2VGaW5kUHJvcGVydHlQYXR0ZXJuKVswXTtcbiAgICByZXR1cm4gcHJvcGVydGllc1twcm9wZXJ0eV07XG4gIH0pO1xufVxuSG9vZGllRXJyb3IucHJvdG90eXBlID0gbmV3IEVycm9yKCk7XG5Ib29kaWVFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBIb29kaWVFcnJvcjtcblxubW9kdWxlLmV4cG9ydHMgPSBIb29kaWVFcnJvcjtcbiIsIi8vIEhvb2RpZSBJbnZhbGlkIFR5cGUgT3IgSWQgRXJyb3Jcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gb25seSBsb3dlcmNhc2UgbGV0dGVycywgbnVtYmVycyBhbmQgZGFzaGVzXG4vLyBhcmUgYWxsb3dlZCBmb3Igb2JqZWN0IElEcy5cbi8vXG52YXIgSG9vZGllRXJyb3IgPSByZXF1aXJlKCcuLi9lcnJvcicpO1xuXG4vL1xuZnVuY3Rpb24gSG9vZGllT2JqZWN0SWRFcnJvcihwcm9wZXJ0aWVzKSB7XG4gIHByb3BlcnRpZXMubmFtZSA9ICdIb29kaWVPYmplY3RJZEVycm9yJztcbiAgcHJvcGVydGllcy5tZXNzYWdlID0gJ1wie3tpZH19XCIgaXMgaW52YWxpZCBvYmplY3QgaWQuIHt7cnVsZXN9fS4nO1xuXG4gIHJldHVybiBuZXcgSG9vZGllRXJyb3IocHJvcGVydGllcyk7XG59XG52YXIgdmFsaWRJZFBhdHRlcm4gPSAvXlthLXowLTlcXC1dKyQvO1xuSG9vZGllT2JqZWN0SWRFcnJvci5pc0ludmFsaWQgPSBmdW5jdGlvbihpZCwgY3VzdG9tUGF0dGVybikge1xuICByZXR1cm4gISAoY3VzdG9tUGF0dGVybiB8fCB2YWxpZElkUGF0dGVybikudGVzdChpZCB8fCAnJyk7XG59O1xuSG9vZGllT2JqZWN0SWRFcnJvci5pc1ZhbGlkID0gZnVuY3Rpb24oaWQsIGN1c3RvbVBhdHRlcm4pIHtcbiAgcmV0dXJuIChjdXN0b21QYXR0ZXJuIHx8IHZhbGlkSWRQYXR0ZXJuKS50ZXN0KGlkIHx8ICcnKTtcbn07XG5Ib29kaWVFcnJvci5wcm90b3R5cGUucnVsZXMgPSAnTG93ZXJjYXNlIGxldHRlcnMsIG51bWJlcnMgYW5kIGRhc2hlcyBhbGxvd2VkIG9ubHkuIE11c3Qgc3RhcnQgd2l0aCBhIGxldHRlcic7XG5cbm1vZHVsZS5leHBvcnRzID0gSG9vZGllT2JqZWN0SWRFcnJvcjtcbiIsIi8vIEhvb2RpZSBJbnZhbGlkIFR5cGUgT3IgSWQgRXJyb3Jcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gb25seSBsb3dlcmNhc2UgbGV0dGVycywgbnVtYmVycyBhbmQgZGFzaGVzXG4vLyBhcmUgYWxsb3dlZCBmb3Igb2JqZWN0IHR5cGVzLCBwbHVzIG11c3Qgc3RhcnRcbi8vIHdpdGggYSBsZXR0ZXIuXG4vL1xudmFyIEhvb2RpZUVycm9yID0gcmVxdWlyZSgnLi4vZXJyb3InKTtcblxuLy9cbmZ1bmN0aW9uIEhvb2RpZU9iamVjdFR5cGVFcnJvcihwcm9wZXJ0aWVzKSB7XG4gIHByb3BlcnRpZXMubmFtZSA9ICdIb29kaWVPYmplY3RUeXBlRXJyb3InO1xuICBwcm9wZXJ0aWVzLm1lc3NhZ2UgPSAnXCJ7e3R5cGV9fVwiIGlzIGludmFsaWQgb2JqZWN0IHR5cGUuIHt7cnVsZXN9fS4nO1xuXG4gIHJldHVybiBuZXcgSG9vZGllRXJyb3IocHJvcGVydGllcyk7XG59XG52YXIgdmFsaWRUeXBlUGF0dGVybiA9IC9eW2EteiRdW2EtejAtOV0rJC87XG5Ib29kaWVPYmplY3RUeXBlRXJyb3IuaXNJbnZhbGlkID0gZnVuY3Rpb24odHlwZSwgY3VzdG9tUGF0dGVybikge1xuICByZXR1cm4gISAoY3VzdG9tUGF0dGVybiB8fCB2YWxpZFR5cGVQYXR0ZXJuKS50ZXN0KHR5cGUgfHwgJycpO1xufTtcbkhvb2RpZU9iamVjdFR5cGVFcnJvci5pc1ZhbGlkID0gZnVuY3Rpb24odHlwZSwgY3VzdG9tUGF0dGVybikge1xuICByZXR1cm4gKGN1c3RvbVBhdHRlcm4gfHwgdmFsaWRUeXBlUGF0dGVybikudGVzdCh0eXBlIHx8ICcnKTtcbn07XG5Ib29kaWVPYmplY3RUeXBlRXJyb3IucHJvdG90eXBlLnJ1bGVzID0gJ2xvd2VyY2FzZSBsZXR0ZXJzLCBudW1iZXJzIGFuZCBkYXNoZXMgYWxsb3dlZCBvbmx5LiBNdXN0IHN0YXJ0IHdpdGggYSBsZXR0ZXInO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhvb2RpZU9iamVjdFR5cGVFcnJvcjtcbiIsIi8vIEV2ZW50c1xuLy8gPT09PT09PT1cbi8vXG4vLyBleHRlbmQgYW55IENsYXNzIHdpdGggc3VwcG9ydCBmb3Jcbi8vXG4vLyAqIGBvYmplY3QuYmluZCgnZXZlbnQnLCBjYilgXG4vLyAqIGBvYmplY3QudW5iaW5kKCdldmVudCcsIGNiKWBcbi8vICogYG9iamVjdC50cmlnZ2VyKCdldmVudCcsIGFyZ3MuLi4pYFxuLy8gKiBgb2JqZWN0Lm9uZSgnZXYnLCBjYilgXG4vL1xuLy8gYmFzZWQgb24gW0V2ZW50cyBpbXBsZW1lbnRhdGlvbnMgZnJvbSBTcGluZV0oaHR0cHM6Ly9naXRodWIuY29tL21hY2NtYW4vc3BpbmUvYmxvYi9tYXN0ZXIvc3JjL3NwaW5lLmNvZmZlZSNMMSlcbi8vXG5cbi8vIGNhbGxiYWNrcyBhcmUgZ2xvYmFsLCB3aGlsZSB0aGUgZXZlbnRzIEFQSSBpcyB1c2VkIGF0IHNldmVyYWwgcGxhY2VzLFxuLy8gbGlrZSBob29kaWUub24gLyBob29kaWUuc3RvcmUub24gLyBob29kaWUudGFzay5vbiBldGMuXG4vL1xuXG5mdW5jdGlvbiBob29kaWVFdmVudHMoaG9vZGllLCBvcHRpb25zKSB7XG4gIHZhciBjb250ZXh0ID0gaG9vZGllO1xuICB2YXIgbmFtZXNwYWNlID0gJyc7XG5cbiAgLy8gbm9ybWFsaXplIG9wdGlvbnMgaGFzaFxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAvLyBtYWtlIHN1cmUgY2FsbGJhY2tzIGhhc2ggZXhpc3RzXG4gIGlmICghaG9vZGllLmV2ZW50c0NhbGxiYWNrcykge1xuICAgIGhvb2RpZS5ldmVudHNDYWxsYmFja3MgPSB7fTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmNvbnRleHQpIHtcbiAgICBjb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0O1xuICAgIG5hbWVzcGFjZSA9IG9wdGlvbnMubmFtZXNwYWNlICsgJzonO1xuICB9XG5cbiAgLy8gQmluZFxuICAvLyAtLS0tLS1cbiAgLy9cbiAgLy8gYmluZCBhIGNhbGxiYWNrIHRvIGFuIGV2ZW50IHRyaWdnZXJkIGJ5IHRoZSBvYmplY3RcbiAgLy9cbiAgLy8gICAgIG9iamVjdC5iaW5kICdjaGVhdCcsIGJsYW1lXG4gIC8vXG4gIGZ1bmN0aW9uIGJpbmQoZXYsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGV2cywgbmFtZSwgX2ksIF9sZW47XG5cbiAgICBldnMgPSBldi5zcGxpdCgnICcpO1xuXG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBldnMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIG5hbWUgPSBuYW1lc3BhY2UgKyBldnNbX2ldO1xuICAgICAgaG9vZGllLmV2ZW50c0NhbGxiYWNrc1tuYW1lXSA9IGhvb2RpZS5ldmVudHNDYWxsYmFja3NbbmFtZV0gfHwgW107XG4gICAgICBob29kaWUuZXZlbnRzQ2FsbGJhY2tzW25hbWVdLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbiAgfVxuXG4gIC8vIG9uZVxuICAvLyAtLS0tLVxuICAvL1xuICAvLyBzYW1lIGFzIGBiaW5kYCwgYnV0IGRvZXMgZ2V0IGV4ZWN1dGVkIG9ubHkgb25jZVxuICAvL1xuICAvLyAgICAgb2JqZWN0Lm9uZSAnZ3JvdW5kVG91Y2gnLCBnYW1lT3ZlclxuICAvL1xuICBmdW5jdGlvbiBvbmUoZXYsIGNhbGxiYWNrKSB7XG4gICAgZXYgPSBuYW1lc3BhY2UgKyBldjtcbiAgICB2YXIgd3JhcHBlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaG9vZGllLnVuYmluZChldiwgd3JhcHBlcik7XG4gICAgICBjYWxsYmFjay5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgaG9vZGllLmJpbmQoZXYsIHdyYXBwZXIpO1xuICB9XG5cbiAgLy8gdHJpZ2dlclxuICAvLyAtLS0tLS0tLS1cbiAgLy9cbiAgLy8gdHJpZ2dlciBhbiBldmVudCBhbmQgcGFzcyBvcHRpb25hbCBwYXJhbWV0ZXJzIGZvciBiaW5kaW5nLlxuICAvLyAgICAgb2JqZWN0LnRyaWdnZXIgJ3dpbicsIHNjb3JlOiAxMjMwXG4gIC8vXG4gIGZ1bmN0aW9uIHRyaWdnZXIoKSB7XG4gICAgdmFyIGFyZ3MsIGNhbGxiYWNrLCBldiwgbGlzdCwgX2ksIF9sZW47XG5cbiAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgIGV2ID0gYXJncy5zaGlmdCgpO1xuICAgIGV2ID0gbmFtZXNwYWNlICsgZXY7XG4gICAgbGlzdCA9IGhvb2RpZS5ldmVudHNDYWxsYmFja3NbZXZdO1xuXG4gICAgaWYgKCFsaXN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBsaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBjYWxsYmFjayA9IGxpc3RbX2ldO1xuICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyB1bmJpbmRcbiAgLy8gLS0tLS0tLS1cbiAgLy9cbiAgLy8gdW5iaW5kIHRvIGZyb20gYWxsIGJpbmRpbmdzLCBmcm9tIGFsbCBiaW5kaW5ncyBvZiBhIHNwZWNpZmljIGV2ZW50XG4gIC8vIG9yIGZyb20gYSBzcGVjaWZpYyBiaW5kaW5nLlxuICAvL1xuICAvLyAgICAgb2JqZWN0LnVuYmluZCgpXG4gIC8vICAgICBvYmplY3QudW5iaW5kICdtb3ZlJ1xuICAvLyAgICAgb2JqZWN0LnVuYmluZCAnbW92ZScsIGZvbGxvd1xuICAvL1xuICBmdW5jdGlvbiB1bmJpbmQoZXYsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGNiLCBpLCBsaXN0LCBfaSwgX2xlbiwgZXZOYW1lcztcblxuICAgIGlmICghZXYpIHtcbiAgICAgIGlmICghbmFtZXNwYWNlKSB7XG4gICAgICAgIGhvb2RpZS5ldmVudHNDYWxsYmFja3MgPSB7fTtcbiAgICAgIH1cblxuICAgICAgZXZOYW1lcyA9IE9iamVjdC5rZXlzKGhvb2RpZS5ldmVudHNDYWxsYmFja3MpO1xuICAgICAgZXZOYW1lcyA9IGV2TmFtZXMuZmlsdGVyKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4ga2V5LmluZGV4T2YobmFtZXNwYWNlKSA9PT0gMDtcbiAgICAgIH0pO1xuICAgICAgZXZOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBkZWxldGUgaG9vZGllLmV2ZW50c0NhbGxiYWNrc1trZXldO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldiA9IG5hbWVzcGFjZSArIGV2O1xuXG4gICAgbGlzdCA9IGhvb2RpZS5ldmVudHNDYWxsYmFja3NbZXZdO1xuXG4gICAgaWYgKCFsaXN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgZGVsZXRlIGhvb2RpZS5ldmVudHNDYWxsYmFja3NbZXZdO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoaSA9IF9pID0gMCwgX2xlbiA9IGxpc3QubGVuZ3RoOyBfaSA8IF9sZW47IGkgPSArK19pKSB7XG4gICAgICBjYiA9IGxpc3RbaV07XG5cblxuICAgICAgaWYgKGNiICE9PSBjYWxsYmFjaykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgbGlzdCA9IGxpc3Quc2xpY2UoKTtcbiAgICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgICAgaG9vZGllLmV2ZW50c0NhbGxiYWNrc1tldl0gPSBsaXN0O1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29udGV4dC5iaW5kID0gYmluZDtcbiAgY29udGV4dC5vbiA9IGJpbmQ7XG4gIGNvbnRleHQub25lID0gb25lO1xuICBjb250ZXh0LnRyaWdnZXIgPSB0cmlnZ2VyO1xuICBjb250ZXh0LnVuYmluZCA9IHVuYmluZDtcbiAgY29udGV4dC5vZmYgPSB1bmJpbmQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllRXZlbnRzO1xuIiwiLy8gaG9vZGllLmdlbmVyYXRlSWRcbi8vID09PT09PT09PT09PT1cblxuLy8gaGVscGVyIHRvIGdlbmVyYXRlIHVuaXF1ZSBpZHMuXG5mdW5jdGlvbiBob29kaWVHZW5lcmF0ZUlkIChob29kaWUpIHtcbiAgdmFyIGNoYXJzLCBpLCByYWRpeDtcblxuICAvLyB1dWlkcyBjb25zaXN0IG9mIG51bWJlcnMgYW5kIGxvd2VyY2FzZSBsZXR0ZXJzIG9ubHkuXG4gIC8vIFdlIHN0aWNrIHRvIGxvd2VyY2FzZSBsZXR0ZXJzIHRvIHByZXZlbnQgY29uZnVzaW9uXG4gIC8vIGFuZCB0byBwcmV2ZW50IGlzc3VlcyB3aXRoIENvdWNoREIsIGUuZy4gZGF0YWJhc2VcbiAgLy8gbmFtZXMgZG8gd29ubHkgYWxsb3cgZm9yIGxvd2VyY2FzZSBsZXR0ZXJzLlxuICBjaGFycyA9ICcwMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXonLnNwbGl0KCcnKTtcbiAgcmFkaXggPSBjaGFycy5sZW5ndGg7XG5cblxuICBmdW5jdGlvbiBnZW5lcmF0ZUlkKGxlbmd0aCkge1xuICAgIHZhciBpZCA9ICcnO1xuXG4gICAgLy8gZGVmYXVsdCB1dWlkIGxlbmd0aCB0byA3XG4gICAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZW5ndGggPSA3O1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHJhbmQgPSBNYXRoLnJhbmRvbSgpICogcmFkaXg7XG4gICAgICB2YXIgY2hhciA9IGNoYXJzW01hdGguZmxvb3IocmFuZCldO1xuICAgICAgaWQgKz0gU3RyaW5nKGNoYXIpLmNoYXJBdCgwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICAvL1xuICAvLyBQdWJsaWMgQVBJXG4gIC8vXG4gIGhvb2RpZS5nZW5lcmF0ZUlkID0gZ2VuZXJhdGVJZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVHZW5lcmF0ZUlkO1xuIiwiLy8gTG9jYWxTdG9yZVxuLy8gPT09PT09PT09PT09XG5cbi8vXG52YXIgaG9vZGllU3RvcmVBcGkgPSByZXF1aXJlKCcuL3N0b3JlJyk7XG52YXIgSG9vZGllT2JqZWN0VHlwZUVycm9yID0gcmVxdWlyZSgnLi9lcnJvci9vYmplY3RfdHlwZScpO1xudmFyIEhvb2RpZU9iamVjdElkRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yL29iamVjdF9pZCcpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllU3RvcmUgKGhvb2RpZSkge1xuXG4gIHZhciBsb2NhbFN0b3JlID0ge307XG5cbiAgLy9cbiAgLy8gc3RhdGVcbiAgLy8gLS0tLS0tLVxuICAvL1xuXG4gIC8vIGNhY2hlIG9mIGxvY2FsU3RvcmFnZSBmb3IgcXVpY2tlciBhY2Nlc3NcbiAgdmFyIGNhY2hlZE9iamVjdCA9IHt9O1xuXG4gIC8vIG1hcCBvZiBkaXJ0eSBvYmplY3RzIGJ5IHRoZWlyIGlkc1xuICB2YXIgZGlydHkgPSB7fTtcblxuICAvLyBxdWV1ZSBvZiBtZXRob2QgY2FsbHMgZG9uZSBkdXJpbmcgYm9vdHN0cmFwcGluZ1xuICB2YXIgcXVldWUgPSBbXTtcblxuICAvLyAyIHNlY29uZHMgdGltb3V0IGJlZm9yZSB0cmlnZ2VyaW5nIHRoZSBgc3RvcmU6aWRsZWAgZXZlbnRcbiAgLy9cbiAgdmFyIGlkbGVUaW1lb3V0ID0gMjAwMDtcblxuXG5cblxuICAvLyAtLS0tLS1cbiAgLy9cbiAgLy8gc2F2ZXMgdGhlIHBhc3NlZCBvYmplY3QgaW50byB0aGUgc3RvcmUgYW5kIHJlcGxhY2VzXG4gIC8vIGFuIGV2ZW50dWFsbHkgZXhpc3Rpbmcgb2JqZWN0IHdpdGggc2FtZSB0eXBlICYgaWQuXG4gIC8vXG4gIC8vIFdoZW4gaWQgaXMgdW5kZWZpbmVkLCBpdCBnZXRzIGdlbmVyYXRlZCBhbiBuZXcgb2JqZWN0IGdldHMgc2F2ZWRcbiAgLy9cbiAgLy8gSXQgYWxzbyBhZGRzIHRpbWVzdGFtcHMgYWxvbmcgdGhlIHdheTpcbiAgLy9cbiAgLy8gKiBgY3JlYXRlZEF0YCB1bmxlc3MgaXQgYWxyZWFkeSBleGlzdHNcbiAgLy8gKiBgdXBkYXRlZEF0YCBldmVyeSB0aW1lXG4gIC8vICogYF9zeW5jZWRBdGAgIGlmIGNoYW5nZXMgY29tZXMgZnJvbSByZW1vdGVcbiAgLy9cbiAgLy8gZXhhbXBsZSB1c2FnZTpcbiAgLy9cbiAgLy8gICAgIHN0b3JlLnNhdmUoJ2NhcicsIHVuZGVmaW5lZCwge2NvbG9yOiAncmVkJ30pXG4gIC8vICAgICBzdG9yZS5zYXZlKCdjYXInLCAnYWJjNDU2NycsIHtjb2xvcjogJ3JlZCd9KVxuICAvL1xuICBsb2NhbFN0b3JlLnNhdmUgPSBmdW5jdGlvbiBzYXZlKG9iamVjdCwgb3B0aW9ucykge1xuICAgIHZhciBjdXJyZW50T2JqZWN0LCBkZWZlciwgZXJyb3IsIGV2ZW50LCBpc05ldywga2V5O1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBpZiBzdG9yZSBpcyBjdXJyZW50bHkgYm9vdHN0cmFwcGluZyBkYXRhIGZyb20gcmVtb3RlLFxuICAgIC8vIHdlJ3JlIHF1ZXVlaW5nIGxvY2FsIHNhdmVzIHVudGlsIGl0J3MgZmluaXNoZWQuXG4gICAgaWYgKHN0b3JlLmlzQm9vdHN0cmFwcGluZygpICYmICFvcHRpb25zLnJlbW90ZSkge1xuICAgICAgcmV0dXJuIGVucXVldWUoJ3NhdmUnLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIC8vIGdlbmVyYXRlIGFuIGlkIGlmIG5lY2Vzc2FyeVxuICAgIGlmIChvYmplY3QuaWQpIHtcbiAgICAgIGN1cnJlbnRPYmplY3QgPSBjYWNoZShvYmplY3QudHlwZSwgb2JqZWN0LmlkKTtcbiAgICAgIGlzTmV3ID0gdHlwZW9mIGN1cnJlbnRPYmplY3QgIT09ICdvYmplY3QnO1xuICAgIH0gZWxzZSB7XG4gICAgICBpc05ldyA9IHRydWU7XG4gICAgICBvYmplY3QuaWQgPSBob29kaWUuZ2VuZXJhdGVJZCgpO1xuICAgIH1cblxuICAgIGlmIChpc05ldykge1xuICAgICAgLy8gYWRkIGNyZWF0ZWRCeSBoYXNoXG4gICAgICBvYmplY3QuY3JlYXRlZEJ5ID0gb2JqZWN0LmNyZWF0ZWRCeSB8fCBob29kaWUuYWNjb3VudC5vd25lckhhc2g7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gbGVhdmUgY3JlYXRlZEJ5IGhhc2hcbiAgICAgIGlmIChjdXJyZW50T2JqZWN0LmNyZWF0ZWRCeSkge1xuICAgICAgICBvYmplY3QuY3JlYXRlZEJ5ID0gY3VycmVudE9iamVjdC5jcmVhdGVkQnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaGFuZGxlIGxvY2FsIHByb3BlcnRpZXMgYW5kIGhpZGRlbiBwcm9wZXJ0aWVzIHdpdGggJCBwcmVmaXhcbiAgICAvLyBrZWVwIGxvY2FsIHByb3BlcnRpZXMgZm9yIHJlbW90ZSB1cGRhdGVzXG4gICAgaWYgKCFpc05ldykge1xuXG4gICAgICAvLyBmb3IgcmVtb3RlIHVwZGF0ZXMsIGtlZXAgbG9jYWwgcHJvcGVydGllcyAoc3RhcnRpbmcgd2l0aCAnXycpXG4gICAgICAvLyBmb3IgbG9jYWwgdXBkYXRlcywga2VlcCBoaWRkZW4gcHJvcGVydGllcyAoc3RhcnRpbmcgd2l0aCAnJCcpXG4gICAgICBmb3IgKGtleSBpbiBjdXJyZW50T2JqZWN0KSB7XG4gICAgICAgIGlmICghb2JqZWN0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICBzd2l0Y2ggKGtleS5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlICdfJzpcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbW90ZSkge1xuICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IGN1cnJlbnRPYmplY3Rba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJyQnOlxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnJlbW90ZSkge1xuICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IGN1cnJlbnRPYmplY3Rba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhZGQgdGltZXN0YW1wc1xuICAgIGlmIChvcHRpb25zLnJlbW90ZSkge1xuICAgICAgb2JqZWN0Ll9zeW5jZWRBdCA9IG5vdygpO1xuICAgIH0gZWxzZSBpZiAoIW9wdGlvbnMuc2lsZW50KSB7XG4gICAgICBvYmplY3QudXBkYXRlZEF0ID0gbm93KCk7XG4gICAgICBvYmplY3QuY3JlYXRlZEF0ID0gb2JqZWN0LmNyZWF0ZWRBdCB8fCBvYmplY3QudXBkYXRlZEF0O1xuICAgIH1cblxuICAgIC8vIGhhbmRsZSBsb2NhbCBjaGFuZ2VzXG4gICAgLy9cbiAgICAvLyBBIGxvY2FsIGNoYW5nZSBpcyBtZWFudCB0byBiZSByZXBsaWNhdGVkIHRvIHRoZVxuICAgIC8vIHVzZXJzIGRhdGFiYXNlLCBidXQgbm90IGJleW9uZC4gRm9yIGV4YW1wbGUgd2hlblxuICAgIC8vIEkgc3Vic2NyaWJlZCB0byBhIHNoYXJlIGJ1dCB0aGVuIGRlY2lkZSB0byB1bnN1YnNjcmliZSxcbiAgICAvLyBhbGwgb2JqZWN0cyBnZXQgcmVtb3ZlZCB3aXRoIGxvY2FsOiB0cnVlIGZsYWcsIHNvIHRoYXRcbiAgICAvLyB0aGV5IGdldCByZW1vdmVkIGZyb20gbXkgZGF0YWJhc2UsIGJ1dCB3b24ndCBhbnl3aGVyZSBlbHNlLlxuICAgIGlmIChvcHRpb25zLmxvY2FsKSB7XG4gICAgICBvYmplY3QuXyRsb2NhbCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBvYmplY3QuXyRsb2NhbDtcbiAgICB9XG5cbiAgICBkZWZlciA9IGhvb2RpZS5kZWZlcigpO1xuXG4gICAgdHJ5IHtcbiAgICAgIG9iamVjdCA9IGNhY2hlKG9iamVjdC50eXBlLCBvYmplY3QuaWQsIG9iamVjdCwgb3B0aW9ucyk7XG4gICAgICBkZWZlci5yZXNvbHZlKG9iamVjdCwgaXNOZXcpLnByb21pc2UoKTtcbiAgICAgIGV2ZW50ID0gaXNOZXcgPyAnYWRkJyA6ICd1cGRhdGUnO1xuICAgICAgdHJpZ2dlckV2ZW50cyhldmVudCwgb2JqZWN0LCBvcHRpb25zKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGVycm9yID0gX2Vycm9yO1xuICAgICAgZGVmZXIucmVqZWN0KGVycm9yLnRvU3RyaW5nKCkpO1xuICAgIH1cblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH07XG5cblxuICAvLyBmaW5kXG4gIC8vIC0tLS0tLVxuXG4gIC8vIGxvYWRzIG9uZSBvYmplY3QgZnJvbSBTdG9yZSwgc3BlY2lmaWVkIGJ5IGB0eXBlYCBhbmQgYGlkYFxuICAvL1xuICAvLyBleGFtcGxlIHVzYWdlOlxuICAvL1xuICAvLyAgICAgc3RvcmUuZmluZCgnY2FyJywgJ2FiYzQ1NjcnKVxuICBsb2NhbFN0b3JlLmZpbmQgPSBmdW5jdGlvbih0eXBlLCBpZCkge1xuICAgIHZhciBlcnJvciwgb2JqZWN0O1xuXG4gICAgLy8gaWYgc3RvcmUgaXMgY3VycmVudGx5IGJvb3RzdHJhcHBpbmcgZGF0YSBmcm9tIHJlbW90ZSxcbiAgICAvLyB3ZSdyZSBxdWV1ZWluZyB1bnRpbCBpdCdzIGZpbmlzaGVkXG4gICAgaWYgKHN0b3JlLmlzQm9vdHN0cmFwcGluZygpKSB7XG4gICAgICByZXR1cm4gZW5xdWV1ZSgnZmluZCcsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIG9iamVjdCA9IGNhY2hlKHR5cGUsIGlkKTtcbiAgICAgIGlmICghb2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aCh7XG4gICAgICAgICAgbmFtZTogJ0hvb2RpZU5vdEZvdW5kRXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6ICdcInt7dHlwZX19XCIgd2l0aCBpZCBcInt7aWR9fVwiIGNvdWxkIG5vdCBiZSBmb3VuZCdcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaG9vZGllLnJlc29sdmVXaXRoKG9iamVjdCk7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICBlcnJvciA9IF9lcnJvcjtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aChlcnJvcik7XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gZmluZEFsbFxuICAvLyAtLS0tLS0tLS1cblxuICAvLyByZXR1cm5zIGFsbCBvYmplY3RzIGZyb20gc3RvcmUuXG4gIC8vIENhbiBiZSBvcHRpb25hbGx5IGZpbHRlcmVkIGJ5IGEgdHlwZSBvciBhIGZ1bmN0aW9uXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2U6XG4gIC8vXG4gIC8vICAgICBzdG9yZS5maW5kQWxsKClcbiAgLy8gICAgIHN0b3JlLmZpbmRBbGwoJ2NhcicpXG4gIC8vICAgICBzdG9yZS5maW5kQWxsKGZ1bmN0aW9uKG9iaikgeyByZXR1cm4gb2JqLmJyYW5kID09ICdUZXNsYScgfSlcbiAgLy9cbiAgbG9jYWxTdG9yZS5maW5kQWxsID0gZnVuY3Rpb24gZmluZEFsbChmaWx0ZXIpIHtcbiAgICB2YXIgY3VycmVudFR5cGUsIGRlZmVyLCBlcnJvciwgaWQsIGtleSwga2V5cywgb2JqLCByZXN1bHRzLCB0eXBlO1xuXG5cblxuICAgIGlmIChmaWx0ZXIgPT0gbnVsbCkge1xuICAgICAgZmlsdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBpZiBzdG9yZSBpcyBjdXJyZW50bHkgYm9vdHN0cmFwcGluZyBkYXRhIGZyb20gcmVtb3RlLFxuICAgIC8vIHdlJ3JlIHF1ZXVlaW5nIHVudGlsIGl0J3MgZmluaXNoZWRcbiAgICBpZiAoc3RvcmUuaXNCb290c3RyYXBwaW5nKCkpIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKCdmaW5kQWxsJywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBrZXlzID0gc3RvcmUuaW5kZXgoKTtcblxuICAgIC8vIG5vcm1hbGl6ZSBmaWx0ZXJcbiAgICBpZiAodHlwZW9mIGZpbHRlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHR5cGUgPSBmaWx0ZXI7XG4gICAgICBmaWx0ZXIgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iai50eXBlID09PSB0eXBlO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBkZWZlciA9IGhvb2RpZS5kZWZlcigpO1xuXG4gICAgdHJ5IHtcblxuICAgICAgLy9cbiAgICAgIHJlc3VsdHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0ga2V5cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIGtleSA9IGtleXNbX2ldO1xuICAgICAgICAgIGlmICghKGlzU2VtYW50aWNLZXkoa2V5KSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfcmVmID0ga2V5LnNwbGl0KCcvJyksXG4gICAgICAgICAgY3VycmVudFR5cGUgPSBfcmVmWzBdLFxuICAgICAgICAgIGlkID0gX3JlZlsxXTtcblxuICAgICAgICAgIG9iaiA9IGNhY2hlKGN1cnJlbnRUeXBlLCBpZCk7XG4gICAgICAgICAgaWYgKG9iaiAmJiBmaWx0ZXIob2JqKSkge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChvYmopO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfSkuY2FsbCh0aGlzKTtcblxuICAgICAgLy8gc29ydCBmcm9tIG5ld2VzdCB0byBvbGRlc3RcbiAgICAgIHJlc3VsdHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIGlmIChhLmNyZWF0ZWRBdCA+IGIuY3JlYXRlZEF0KSB7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9IGVsc2UgaWYgKGEuY3JlYXRlZEF0IDwgYi5jcmVhdGVkQXQpIHtcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBkZWZlci5yZXNvbHZlKHJlc3VsdHMpLnByb21pc2UoKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGVycm9yID0gX2Vycm9yO1xuICAgICAgZGVmZXIucmVqZWN0KGVycm9yKS5wcm9taXNlKCk7XG4gICAgfVxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH07XG5cblxuICAvLyBSZW1vdmVcbiAgLy8gLS0tLS0tLS1cblxuICAvLyBSZW1vdmVzIG9uZSBvYmplY3Qgc3BlY2lmaWVkIGJ5IGB0eXBlYCBhbmQgYGlkYC5cbiAgLy9cbiAgLy8gd2hlbiBvYmplY3QgaGFzIGJlZW4gc3luY2VkIGJlZm9yZSwgbWFyayBpdCBhcyBkZWxldGVkLlxuICAvLyBPdGhlcndpc2UgcmVtb3ZlIGl0IGZyb20gU3RvcmUuXG4gIGxvY2FsU3RvcmUucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKHR5cGUsIGlkLCBvcHRpb25zKSB7XG4gICAgdmFyIGtleSwgb2JqZWN0LCBvYmplY3RXYXNNYXJrZWRBc0RlbGV0ZWQ7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIGlmIHN0b3JlIGlzIGN1cnJlbnRseSBib290c3RyYXBwaW5nIGRhdGEgZnJvbSByZW1vdGUsXG4gICAgLy8gd2UncmUgcXVldWVpbmcgbG9jYWwgcmVtb3ZlcyB1bnRpbCBpdCdzIGZpbmlzaGVkLlxuICAgIGlmIChzdG9yZS5pc0Jvb3RzdHJhcHBpbmcoKSAmJiAhb3B0aW9ucy5yZW1vdGUpIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKCdyZW1vdmUnLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIGtleSA9IHR5cGUgKyAnLycgKyBpZDtcblxuICAgIG9iamVjdCA9IGNhY2hlKHR5cGUsIGlkKTtcblxuICAgIC8vIGlmIGNoYW5nZSBjb21lcyBmcm9tIHJlbW90ZSwganVzdCBjbGVhbiB1cCBsb2NhbGx5XG4gICAgaWYgKG9wdGlvbnMucmVtb3RlKSB7XG4gICAgICBkYi5yZW1vdmVJdGVtKGtleSk7XG4gICAgICBvYmplY3RXYXNNYXJrZWRBc0RlbGV0ZWQgPSBjYWNoZWRPYmplY3Rba2V5XSAmJiBpc01hcmtlZEFzRGVsZXRlZChjYWNoZWRPYmplY3Rba2V5XSk7XG4gICAgICBjYWNoZWRPYmplY3Rba2V5XSA9IGZhbHNlO1xuICAgICAgY2xlYXJDaGFuZ2VkKHR5cGUsIGlkKTtcbiAgICAgIGlmIChvYmplY3RXYXNNYXJrZWRBc0RlbGV0ZWQgJiYgb2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZVdpdGgob2JqZWN0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIW9iamVjdCkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKHtcbiAgICAgICAgbmFtZTogJ0hvb2RpZU5vdEZvdW5kRXJyb3InLFxuICAgICAgICBtZXNzYWdlOiAnXCJ7e3R5cGV9fVwiIHdpdGggaWQgXCJ7e2lkfX1cIlwiIGNvdWxkIG5vdCBiZSBmb3VuZCdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChvYmplY3QuX3N5bmNlZEF0KSB7XG4gICAgICBvYmplY3QuX2RlbGV0ZWQgPSB0cnVlO1xuICAgICAgY2FjaGUodHlwZSwgaWQsIG9iamVjdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleSA9IHR5cGUgKyAnLycgKyBpZDtcbiAgICAgIGRiLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICAgIGNhY2hlZE9iamVjdFtrZXldID0gZmFsc2U7XG4gICAgICBjbGVhckNoYW5nZWQodHlwZSwgaWQpO1xuICAgIH1cblxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE0N1xuICAgIGlmIChvcHRpb25zLnVwZGF0ZSkge1xuICAgICAgb2JqZWN0ID0gb3B0aW9ucy51cGRhdGU7XG4gICAgICBkZWxldGUgb3B0aW9ucy51cGRhdGU7XG4gICAgfVxuICAgIHRyaWdnZXJFdmVudHMoJ3JlbW92ZScsIG9iamVjdCwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlV2l0aChvYmplY3QpO1xuICB9O1xuXG5cbiAgLy8gUmVtb3ZlIGFsbFxuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy8gUmVtb3ZlcyBvbmUgb2JqZWN0IHNwZWNpZmllZCBieSBgdHlwZWAgYW5kIGBpZGAuXG4gIC8vXG4gIC8vIHdoZW4gb2JqZWN0IGhhcyBiZWVuIHN5bmNlZCBiZWZvcmUsIG1hcmsgaXQgYXMgZGVsZXRlZC5cbiAgLy8gT3RoZXJ3aXNlIHJlbW92ZSBpdCBmcm9tIFN0b3JlLlxuICBsb2NhbFN0b3JlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uIHJlbW92ZUFsbCh0eXBlLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHN0b3JlLmZpbmRBbGwodHlwZSkudGhlbihmdW5jdGlvbihvYmplY3RzKSB7XG4gICAgICB2YXIgb2JqZWN0LCBfaSwgX2xlbiwgcmVzdWx0cztcblxuICAgICAgcmVzdWx0cyA9IFtdO1xuXG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG9iamVjdHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgb2JqZWN0ID0gb2JqZWN0c1tfaV07XG4gICAgICAgIHJlc3VsdHMucHVzaChzdG9yZS5yZW1vdmUob2JqZWN0LnR5cGUsIG9iamVjdC5pZCwgb3B0aW9ucykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyB2YWxpZGF0ZVxuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy9cbiAgZnVuY3Rpb24gdmFsaWRhdGUgKG9iamVjdCkge1xuXG4gICAgaWYgKEhvb2RpZU9iamVjdFR5cGVFcnJvci5pc0ludmFsaWQob2JqZWN0LnR5cGUpKSB7XG4gICAgICByZXR1cm4gbmV3IEhvb2RpZU9iamVjdFR5cGVFcnJvcih7XG4gICAgICAgIHR5cGU6IG9iamVjdC50eXBlXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgSG9vZGllT2JqZWN0SWRFcnJvci5pc0ludmFsaWQob2JqZWN0LmlkKSkge1xuICAgICAgcmV0dXJuIG5ldyBIb29kaWVPYmplY3RJZEVycm9yKHtcbiAgICAgICAgaWQ6IG9iamVjdC5pZFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIHN0b3JlID0gaG9vZGllU3RvcmVBcGkoaG9vZGllLCB7XG5cbiAgICAvLyB2YWxpZGF0ZVxuICAgIHZhbGlkYXRlOiB2YWxpZGF0ZSxcblxuICAgIGJhY2tlbmQ6IHtcbiAgICAgIHNhdmU6IGxvY2FsU3RvcmUuc2F2ZSxcbiAgICAgIGZpbmQ6IGxvY2FsU3RvcmUuZmluZCxcbiAgICAgIGZpbmRBbGw6IGxvY2FsU3RvcmUuZmluZEFsbCxcbiAgICAgIHJlbW92ZTogbG9jYWxTdG9yZS5yZW1vdmUsXG4gICAgICByZW1vdmVBbGw6IGxvY2FsU3RvcmUucmVtb3ZlQWxsLFxuICAgIH1cbiAgfSk7XG5cblxuXG4gIC8vIGV4dGVuZGVkIHB1YmxpYyBBUElcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuICAvLyBpbmRleFxuICAvLyAtLS0tLS0tXG5cbiAgLy8gb2JqZWN0IGtleSBpbmRleFxuICAvLyBUT0RPOiBtYWtlIHRoaXMgY2FjaHlcbiAgc3RvcmUuaW5kZXggPSBmdW5jdGlvbiBpbmRleCgpIHtcbiAgICB2YXIgaSwga2V5LCBrZXlzLCBfaSwgX3JlZjtcbiAgICBrZXlzID0gW107XG4gICAgZm9yIChpID0gX2kgPSAwLCBfcmVmID0gZGIubGVuZ3RoKCk7IDAgPD0gX3JlZiA/IF9pIDwgX3JlZiA6IF9pID4gX3JlZjsgaSA9IDAgPD0gX3JlZiA/ICsrX2kgOiAtLV9pKSB7XG4gICAgICBrZXkgPSBkYi5rZXkoaSk7XG4gICAgICBpZiAoaXNTZW1hbnRpY0tleShrZXkpKSB7XG4gICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuXG4gIC8vIGNoYW5nZWQgb2JqZWN0c1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHJldHVybnMgYW4gQXJyYXkgb2YgYWxsIGRpcnR5IGRvY3VtZW50c1xuICBzdG9yZS5jaGFuZ2VkT2JqZWN0cyA9IGZ1bmN0aW9uIGNoYW5nZWRPYmplY3RzKCkge1xuICAgIHZhciBpZCwga2V5LCBvYmplY3QsIHR5cGUsIF9yZWYsIF9yZWYxLCBfcmVzdWx0cztcblxuICAgIF9yZWYgPSBkaXJ0eTtcbiAgICBfcmVzdWx0cyA9IFtdO1xuXG4gICAgZm9yIChrZXkgaW4gX3JlZikge1xuICAgICAgaWYgKF9yZWYuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBvYmplY3QgPSBfcmVmW2tleV07XG4gICAgICAgIF9yZWYxID0ga2V5LnNwbGl0KCcvJyksXG4gICAgICAgIHR5cGUgPSBfcmVmMVswXSxcbiAgICAgICAgaWQgPSBfcmVmMVsxXTtcbiAgICAgICAgb2JqZWN0LnR5cGUgPSB0eXBlO1xuICAgICAgICBvYmplY3QuaWQgPSBpZDtcbiAgICAgICAgX3Jlc3VsdHMucHVzaChvYmplY3QpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH07XG5cblxuICAvLyBJcyBkaXJ0eT9cbiAgLy8gLS0tLS0tLS0tLVxuXG4gIC8vIFdoZW4gbm8gYXJndW1lbnRzIHBhc3NlZCwgcmV0dXJucyBgdHJ1ZWAgb3IgYGZhbHNlYCBkZXBlbmRpbmcgb24gaWYgdGhlcmUgYXJlXG4gIC8vIGRpcnR5IG9iamVjdHMgaW4gdGhlIHN0b3JlLlxuICAvL1xuICAvLyBPdGhlcndpc2UgaXQgcmV0dXJucyBgdHJ1ZWAgb3IgYGZhbHNlYCBmb3IgdGhlIHBhc3NlZCBvYmplY3QuIEFuIG9iamVjdCBpcyBkaXJ0eVxuICAvLyBpZiBpdCBoYXMgbm8gYF9zeW5jZWRBdGAgYXR0cmlidXRlIG9yIGlmIGB1cGRhdGVkQXRgIGlzIG1vcmUgcmVjZW50IHRoYW4gYF9zeW5jZWRBdGBcbiAgc3RvcmUuaGFzTG9jYWxDaGFuZ2VzID0gZnVuY3Rpb24odHlwZSwgaWQpIHtcbiAgICBpZiAoIXR5cGUpIHtcbiAgICAgIHJldHVybiAhJC5pc0VtcHR5T2JqZWN0KGRpcnR5KTtcbiAgICB9XG4gICAgdmFyIGtleSA9IFt0eXBlLGlkXS5qb2luKCcvJyk7XG4gICAgaWYgKGRpcnR5W2tleV0pIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gaGFzTG9jYWxDaGFuZ2VzKGNhY2hlKHR5cGUsIGlkKSk7XG4gIH07XG5cblxuICAvLyBDbGVhclxuICAvLyAtLS0tLS1cblxuICAvLyBjbGVhcnMgbG9jYWxTdG9yYWdlIGFuZCBjYWNoZVxuICAvLyBUT0RPOiBkbyBub3QgY2xlYXIgZW50aXJlIGxvY2FsU3RvcmFnZSwgY2xlYXIgb25seSB0aGUgaXRlbXMgdGhhdCBoYXZlIGJlZW4gc3RvcmVkXG4gIC8vICAgICAgIHVzaW5nIGBob29kaWUuc3RvcmVgIGJlZm9yZS5cbiAgc3RvcmUuY2xlYXIgPSBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICB2YXIgZGVmZXIsIGtleSwga2V5cywgcmVzdWx0cztcbiAgICBkZWZlciA9IGhvb2RpZS5kZWZlcigpO1xuICAgIHRyeSB7XG4gICAgICBrZXlzID0gc3RvcmUuaW5kZXgoKTtcbiAgICAgIHJlc3VsdHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0ga2V5cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIGtleSA9IGtleXNbX2ldO1xuICAgICAgICAgIGlmIChpc1NlbWFudGljS2V5KGtleSkpIHtcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goZGIucmVtb3ZlSXRlbShrZXkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfSkuY2FsbCh0aGlzKTtcbiAgICAgIGNhY2hlZE9iamVjdCA9IHt9O1xuICAgICAgY2xlYXJDaGFuZ2VkKCk7XG4gICAgICBkZWZlci5yZXNvbHZlKCk7XG4gICAgICBzdG9yZS50cmlnZ2VyKCdjbGVhcicpO1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgZGVmZXIucmVqZWN0KF9lcnJvcik7XG4gICAgfVxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH07XG5cblxuICAvLyBpc0Jvb3RzdHJhcHBpbmdcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyByZXR1cm5zIHRydWUgaWYgc3RvcmUgaXMgY3VycmVudGx5IGJvb3RzdHJhcHBpbmcgZGF0YSBmcm9tIHJlbW90ZSxcbiAgLy8gb3RoZXJ3aXNlIGZhbHNlLlxuICB2YXIgYm9vdHN0cmFwcGluZyA9IGZhbHNlO1xuICBzdG9yZS5pc0Jvb3RzdHJhcHBpbmcgPSBmdW5jdGlvbiBpc0Jvb3RzdHJhcHBpbmcoKSB7XG4gICAgcmV0dXJuIGJvb3RzdHJhcHBpbmc7XG4gIH07XG5cblxuICAvLyBJcyBwZXJzaXN0YW50P1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmV0dXJucyBgdHJ1ZWAgb3IgYGZhbHNlYCBkZXBlbmRpbmcgb24gd2hldGhlciBsb2NhbFN0b3JhZ2UgaXMgc3VwcG9ydGVkIG9yIG5vdC5cbiAgLy8gQmV3YXJlIHRoYXQgc29tZSBicm93c2VycyBsaWtlIFNhZmFyaSBkbyBub3Qgc3VwcG9ydCBsb2NhbFN0b3JhZ2UgaW4gcHJpdmF0ZSBtb2RlLlxuICAvL1xuICAvLyBpbnNwaXJlZCBieSB0aGlzIGNhcHB1Y2Npbm8gY29tbWl0XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9jYXBwdWNjaW5vL2NhcHB1Y2Npbm8vY29tbWl0LzA2M2IwNWQ5NjQzYzM1YjMwMzU2OGEyODgwOWU0ZWIzMjI0ZjcxZWNcbiAgLy9cbiAgc3RvcmUuaXNQZXJzaXN0ZW50ID0gZnVuY3Rpb24gaXNQZXJzaXN0ZW50KCkge1xuICAgIHRyeSB7XG5cbiAgICAgIC8vIHdlJ3ZlIHRvIHB1dCB0aGlzIGluIGhlcmUuIEkndmUgc2VlbiBGaXJlZm94IHRocm93aW5nIGBTZWN1cml0eSBlcnJvcjogMTAwMGBcbiAgICAgIC8vIHdoZW4gY29va2llcyBoYXZlIGJlZW4gZGlzYWJsZWRcbiAgICAgIGlmICghd2luZG93LmxvY2FsU3RvcmFnZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIEp1c3QgYmVjYXVzZSBsb2NhbFN0b3JhZ2UgZXhpc3RzIGRvZXMgbm90IG1lYW4gaXQgd29ya3MuIEluIHBhcnRpY3VsYXIgaXQgbWlnaHQgYmUgZGlzYWJsZWRcbiAgICAgIC8vIGFzIGl0IGlzIHdoZW4gU2FmYXJpJ3MgcHJpdmF0ZSBicm93c2luZyBtb2RlIGlzIGFjdGl2ZS5cbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdTdG9yYWdlLVRlc3QnLCAnMScpO1xuXG4gICAgICAvLyB0aGF0IHNob3VsZCBub3QgaGFwcGVuIC4uLlxuICAgICAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdTdG9yYWdlLVRlc3QnKSAhPT0gJzEnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gb2theSwgbGV0J3MgY2xlYW4gdXAgaWYgd2UgZ290IGhlcmUuXG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnU3RvcmFnZS1UZXN0Jyk7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG5cbiAgICAgIC8vIGluIGNhc2Ugb2YgYW4gZXJyb3IsIGxpa2UgU2FmYXJpJ3MgUHJpdmF0ZSBNb2RlLCByZXR1cm4gZmFsc2VcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyB3ZSdyZSBnb29kLlxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG5cblxuXG4gIC8vXG4gIC8vIFByaXZhdGUgbWV0aG9kc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuICAvL1xuXG5cbiAgLy8gbG9jYWxTdG9yYWdlIHByb3h5XG4gIC8vXG4gIHZhciBkYiA9IHtcbiAgICBnZXRJdGVtOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcbiAgICB9LFxuICAgIHNldEl0ZW06IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCB2YWx1ZSk7XG4gICAgfSxcbiAgICByZW1vdmVJdGVtOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICB9LFxuICAgIGtleTogZnVuY3Rpb24obnIpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLmtleShucik7XG4gICAgfSxcbiAgICBsZW5ndGg6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2UubGVuZ3RoO1xuICAgIH1cbiAgfTtcblxuXG4gIC8vIENhY2hlXG4gIC8vIC0tLS0tLS1cblxuICAvLyBsb2FkcyBhbiBvYmplY3Qgc3BlY2lmaWVkIGJ5IGB0eXBlYCBhbmQgYGlkYCBvbmx5IG9uY2UgZnJvbSBsb2NhbFN0b3JhZ2VcbiAgLy8gYW5kIGNhY2hlcyBpdCBmb3IgZmFzdGVyIGZ1dHVyZSBhY2Nlc3MuIFVwZGF0ZXMgY2FjaGUgd2hlbiBgdmFsdWVgIGlzIHBhc3NlZC5cbiAgLy9cbiAgLy8gQWxzbyBjaGVja3MgaWYgb2JqZWN0IG5lZWRzIHRvIGJlIHN5bmNoZWQgKGRpcnR5KSBvciBub3RcbiAgLy9cbiAgLy8gUGFzcyBgb3B0aW9ucy5yZW1vdGUgPSB0cnVlYCB3aGVuIG9iamVjdCBjb21lcyBmcm9tIHJlbW90ZVxuICAvLyBQYXNzICdvcHRpb25zLnNpbGVudCA9IHRydWUnIHRvIGF2b2lkIGV2ZW50cyBmcm9tIGJlaW5nIHRyaWdnZXJlZC5cbiAgZnVuY3Rpb24gY2FjaGUodHlwZSwgaWQsIG9iamVjdCwgb3B0aW9ucykge1xuICAgIHZhciBrZXk7XG5cbiAgICBpZiAob2JqZWN0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIG9iamVjdCA9IGZhbHNlO1xuICAgIH1cblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGtleSA9ICcnICsgdHlwZSArICcvJyArIGlkO1xuXG4gICAgaWYgKG9iamVjdCkge1xuICAgICAgJC5leHRlbmQob2JqZWN0LCB7XG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIGlkOiBpZFxuICAgICAgfSk7XG5cbiAgICAgIHNldE9iamVjdCh0eXBlLCBpZCwgb2JqZWN0KTtcblxuICAgICAgaWYgKG9wdGlvbnMucmVtb3RlKSB7XG4gICAgICAgIGNsZWFyQ2hhbmdlZCh0eXBlLCBpZCk7XG4gICAgICAgIGNhY2hlZE9iamVjdFtrZXldID0gJC5leHRlbmQodHJ1ZSwge30sIG9iamVjdCk7XG4gICAgICAgIHJldHVybiBjYWNoZWRPYmplY3Rba2V5XTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIC8vIGlmIHRoZSBjYWNoZWQga2V5IHJldHVybnMgZmFsc2UsIGl0IG1lYW5zXG4gICAgICAvLyB0aGF0IHdlIGhhdmUgcmVtb3ZlZCB0aGF0IGtleS4gV2UganVzdFxuICAgICAgLy8gc2V0IGl0IHRvIGZhbHNlIGZvciBwZXJmb3JtYW5jZSByZWFzb25zLCBzb1xuICAgICAgLy8gdGhhdCB3ZSBkb24ndCBuZWVkIHRvIGxvb2sgaXQgdXAgYWdhaW4gaW4gbG9jYWxTdG9yYWdlXG4gICAgICBpZiAoY2FjaGVkT2JqZWN0W2tleV0gPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gaWYga2V5IGlzIGNhY2hlZCwgcmV0dXJuIGl0LiBCdXQgbWFrZSBzdXJlXG4gICAgICAvLyB0byBtYWtlIGEgZGVlcCBjb3B5IGJlZm9yZWhhbmQgKD0+IHRydWUpXG4gICAgICBpZiAoY2FjaGVkT2JqZWN0W2tleV0pIHtcbiAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBjYWNoZWRPYmplY3Rba2V5XSk7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIG9iamVjdCBpcyBub3QgeWV0IGNhY2hlZCwgbG9hZCBpdCBmcm9tIGxvY2FsU3RvcmVcbiAgICAgIG9iamVjdCA9IGdldE9iamVjdCh0eXBlLCBpZCk7XG5cbiAgICAgIC8vIHN0b3AgaGVyZSBpZiBvYmplY3QgZGlkIG5vdCBleGlzdCBpbiBsb2NhbFN0b3JlXG4gICAgICAvLyBhbmQgY2FjaGUgaXQgc28gd2UgZG9uJ3QgbmVlZCB0byBsb29rIGl0IHVwIGFnYWluXG4gICAgICBpZiAob2JqZWN0ID09PSBmYWxzZSkge1xuICAgICAgICBjbGVhckNoYW5nZWQodHlwZSwgaWQpO1xuICAgICAgICBjYWNoZWRPYmplY3Rba2V5XSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICBpZiAoaXNNYXJrZWRBc0RlbGV0ZWQob2JqZWN0KSkge1xuICAgICAgbWFya0FzQ2hhbmdlZCh0eXBlLCBpZCwgb2JqZWN0LCBvcHRpb25zKTtcbiAgICAgIGNhY2hlZE9iamVjdFtrZXldID0gZmFsc2U7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gaGVyZSBpcyB3aGVyZSB3ZSBjYWNoZSB0aGUgb2JqZWN0IGZvclxuICAgIC8vIGZ1dHVyZSBxdWljayBhY2Nlc3NcbiAgICBjYWNoZWRPYmplY3Rba2V5XSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpO1xuXG4gICAgaWYgKGhhc0xvY2FsQ2hhbmdlcyhvYmplY3QpKSB7XG4gICAgICBtYXJrQXNDaGFuZ2VkKHR5cGUsIGlkLCBjYWNoZWRPYmplY3Rba2V5XSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNsZWFyQ2hhbmdlZCh0eXBlLCBpZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpO1xuICB9XG5cblxuICAvLyBib290c3RyYXBwaW5nIGRpcnR5IG9iamVjdHMsIHRvIG1ha2Ugc3VyZVxuICAvLyB0aGF0IHJlbW92ZWQgb2JqZWN0cyBnZXQgcHVzaGVkIGFmdGVyXG4gIC8vIHBhZ2UgcmVsb2FkLlxuICAvL1xuICBmdW5jdGlvbiBib290c3RyYXBEaXJ0eU9iamVjdHMoKSB7XG4gICAgdmFyIGlkLCBrZXlzLCBvYmosIHR5cGUsIF9pLCBfbGVuLCBfcmVmO1xuICAgIGtleXMgPSBkYi5nZXRJdGVtKCdfZGlydHknKTtcblxuICAgIGlmICgha2V5cykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGtleXMgPSBrZXlzLnNwbGl0KCcsJyk7XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBrZXlzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBfcmVmID0ga2V5c1tfaV0uc3BsaXQoJy8nKSxcbiAgICAgIHR5cGUgPSBfcmVmWzBdLFxuICAgICAgaWQgPSBfcmVmWzFdO1xuICAgICAgb2JqID0gY2FjaGUodHlwZSwgaWQpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy9cbiAgLy8gc3Vic2NyaWJlIHRvIGV2ZW50cyBjb21pbmcgZnJvbSBhY2NvdW50ICYgb3VyIHJlbW90ZSBzdG9yZS5cbiAgLy9cbiAgZnVuY3Rpb24gc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCkge1xuXG4gICAgLy8gYWNjb3VudCBldmVudHNcbiAgICBob29kaWUub24oJ2FjY291bnQ6Y2xlYW51cCcsIHN0b3JlLmNsZWFyKTtcbiAgICBob29kaWUub24oJ2FjY291bnQ6c2lnbnVwJywgbWFya0FsbEFzQ2hhbmdlZCk7XG4gICAgaG9vZGllLm9uKCdyZW1vdGU6Ym9vdHN0cmFwOnN0YXJ0Jywgc3RhcnRCb290c3RyYXBwaW5nTW9kZSk7XG4gICAgaG9vZGllLm9uKCdyZW1vdGU6Ym9vdHN0cmFwOmVuZCcsIGVuZEJvb3RzdHJhcHBpbmdNb2RlKTtcblxuICAgIC8vIHJlbW90ZSBldmVudHNcbiAgICBob29kaWUub24oJ3JlbW90ZTpjaGFuZ2UnLCBoYW5kbGVSZW1vdGVDaGFuZ2UpO1xuICAgIGhvb2RpZS5vbigncmVtb3RlOnB1c2gnLCBoYW5kbGVQdXNoZWRPYmplY3QpO1xuICB9XG5cbiAgLy8gYWxsb3cgdG8gcnVuIHRoaXMgb25jZSBmcm9tIG91dHNpZGVcbiAgc3RvcmUuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG4gICAgZGVsZXRlIHN0b3JlLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cztcbiAgfTtcblxuXG4gIC8vXG4gIC8vIE1hcmtzIG9iamVjdCBhcyBjaGFuZ2VkIChkaXJ0eSkuIFRyaWdnZXJzIGEgYHN0b3JlOmRpcnR5YCBldmVudCBpbW1lZGlhdGVseSBhbmQgYVxuICAvLyBgc3RvcmU6aWRsZWAgZXZlbnQgb25jZSB0aGVyZSBpcyBubyBjaGFuZ2Ugd2l0aGluIDIgc2Vjb25kc1xuICAvL1xuICBmdW5jdGlvbiBtYXJrQXNDaGFuZ2VkKHR5cGUsIGlkLCBvYmplY3QsIG9wdGlvbnMpIHtcbiAgICB2YXIga2V5O1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAga2V5ID0gJycgKyB0eXBlICsgJy8nICsgaWQ7XG5cbiAgICBkaXJ0eVtrZXldID0gb2JqZWN0O1xuICAgIHNhdmVEaXJ0eUlkcygpO1xuXG4gICAgaWYgKG9wdGlvbnMuc2lsZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJpZ2dlckRpcnR5QW5kSWRsZUV2ZW50cygpO1xuICB9XG5cbiAgLy8gQ2xlYXIgY2hhbmdlZFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyByZW1vdmVzIGFuIG9iamVjdCBmcm9tIHRoZSBsaXN0IG9mIG9iamVjdHMgdGhhdCBhcmUgZmxhZ2dlZCB0byBieSBzeW5jaGVkIChkaXJ0eSlcbiAgLy8gYW5kIHRyaWdnZXJzIGEgYHN0b3JlOmRpcnR5YCBldmVudFxuICBmdW5jdGlvbiBjbGVhckNoYW5nZWQodHlwZSwgaWQpIHtcbiAgICB2YXIga2V5O1xuICAgIGlmICh0eXBlICYmIGlkKSB7XG4gICAgICBrZXkgPSAnJyArIHR5cGUgKyAnLycgKyBpZDtcbiAgICAgIGRlbGV0ZSBkaXJ0eVtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICBkaXJ0eSA9IHt9O1xuICAgIH1cbiAgICBzYXZlRGlydHlJZHMoKTtcbiAgICByZXR1cm4gd2luZG93LmNsZWFyVGltZW91dChkaXJ0eVRpbWVvdXQpO1xuICB9XG5cblxuICAvLyBNYXJrIGFsbCBhcyBjaGFuZ2VkXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIE1hcmtzIGFsbCBsb2NhbCBvYmplY3QgYXMgY2hhbmdlZCAoZGlydHkpIHRvIG1ha2UgdGhlbSBzeW5jXG4gIC8vIHdpdGggcmVtb3RlXG4gIGZ1bmN0aW9uIG1hcmtBbGxBc0NoYW5nZWQoKSB7XG4gICAgcmV0dXJuIHN0b3JlLmZpbmRBbGwoKS5waXBlKGZ1bmN0aW9uKG9iamVjdHMpIHtcbiAgICAgIHZhciBrZXksIG9iamVjdCwgX2ksIF9sZW47XG5cbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gb2JqZWN0cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBvYmplY3QgPSBvYmplY3RzW19pXTtcbiAgICAgICAga2V5ID0gJycgKyBvYmplY3QudHlwZSArICcvJyArIG9iamVjdC5pZDtcbiAgICAgICAgZGlydHlba2V5XSA9IG9iamVjdDtcbiAgICAgIH1cblxuICAgICAgc2F2ZURpcnR5SWRzKCk7XG4gICAgICB0cmlnZ2VyRGlydHlBbmRJZGxlRXZlbnRzKCk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vIHdoZW4gYSBjaGFuZ2UgY29tZSdzIGZyb20gb3VyIHJlbW90ZSBzdG9yZSwgd2UgZGlmZmVyZW50aWF0ZVxuICAvLyB3aGV0aGVyIGFuIG9iamVjdCBoYXMgYmVlbiByZW1vdmVkIG9yIGFkZGVkIC8gdXBkYXRlZCBhbmRcbiAgLy8gcmVmbGVjdCB0aGUgY2hhbmdlIGluIG91ciBsb2NhbCBzdG9yZS5cbiAgZnVuY3Rpb24gaGFuZGxlUmVtb3RlQ2hhbmdlKHR5cGVPZkNoYW5nZSwgb2JqZWN0KSB7XG4gICAgaWYgKHR5cGVPZkNoYW5nZSA9PT0gJ3JlbW92ZScpIHtcbiAgICAgIHN0b3JlLnJlbW92ZShvYmplY3QudHlwZSwgb2JqZWN0LmlkLCB7XG4gICAgICAgIHJlbW90ZTogdHJ1ZSxcbiAgICAgICAgdXBkYXRlOiBvYmplY3RcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdG9yZS5zYXZlKG9iamVjdC50eXBlLCBvYmplY3QuaWQsIG9iamVjdCwge1xuICAgICAgICByZW1vdGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG5cbiAgLy9cbiAgLy8gYWxsIGxvY2FsIGNoYW5nZXMgZ2V0IGJ1bGsgcHVzaGVkLiBGb3IgZWFjaCBvYmplY3Qgd2l0aCBsb2NhbFxuICAvLyBjaGFuZ2VzIHRoYXQgaGFzIGJlZW4gcHVzaGVkIHdlICB0cmlnZ2VyIGEgc3luYyBldmVudFxuICBmdW5jdGlvbiBoYW5kbGVQdXNoZWRPYmplY3Qob2JqZWN0KSB7XG4gICAgdHJpZ2dlckV2ZW50cygnc3luYycsIG9iamVjdCk7XG4gIH1cblxuXG4gIC8vIG1vcmUgYWR2YW5jZWQgbG9jYWxTdG9yYWdlIHdyYXBwZXJzIHRvIGZpbmQvc2F2ZSBvYmplY3RzXG4gIGZ1bmN0aW9uIHNldE9iamVjdCh0eXBlLCBpZCwgb2JqZWN0KSB7XG4gICAgdmFyIGtleSwgc3RvcmU7XG5cbiAgICBrZXkgPSAnJyArIHR5cGUgKyAnLycgKyBpZDtcbiAgICBzdG9yZSA9ICQuZXh0ZW5kKHt9LCBvYmplY3QpO1xuXG4gICAgZGVsZXRlIHN0b3JlLnR5cGU7XG4gICAgZGVsZXRlIHN0b3JlLmlkO1xuICAgIHJldHVybiBkYi5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkoc3RvcmUpKTtcbiAgfVxuICBmdW5jdGlvbiBnZXRPYmplY3QodHlwZSwgaWQpIHtcbiAgICB2YXIga2V5LCBvYmo7XG5cbiAgICBrZXkgPSAnJyArIHR5cGUgKyAnLycgKyBpZDtcbiAgICB2YXIganNvbiA9IGRiLmdldEl0ZW0oa2V5KTtcblxuICAgIGlmIChqc29uKSB7XG4gICAgICBvYmogPSBKU09OLnBhcnNlKGpzb24pO1xuICAgICAgb2JqLnR5cGUgPSB0eXBlO1xuICAgICAgb2JqLmlkID0gaWQ7XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cblxuICAvLyBzdG9yZSBJRHMgb2YgZGlydHkgb2JqZWN0c1xuICBmdW5jdGlvbiBzYXZlRGlydHlJZHMoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICgkLmlzRW1wdHlPYmplY3QoZGlydHkpKSB7XG4gICAgICAgIGRiLnJlbW92ZUl0ZW0oJ19kaXJ0eScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGlkcyA9IE9iamVjdC5rZXlzKGRpcnR5KTtcbiAgICAgICAgZGIuc2V0SXRlbSgnX2RpcnR5JywgaWRzLmpvaW4oJywnKSk7XG4gICAgICB9XG4gICAgfSBjYXRjaChlKSB7fVxuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gbm93KCkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShuZXcgRGF0ZSgpKS5yZXBsYWNlKC9bJ1wiXS9nLCAnJyk7XG4gIH1cblxuXG4gIC8vIGEgc2VtYW50aWMga2V5IGNvbnNpc3RzIG9mIGEgdmFsaWQgdHlwZSAmIGlkLCBzZXBhcmF0ZWQgYnkgYSBcIi9cIlxuICB2YXIgc2VtYW50aWNJZFBhdHRlcm4gPSBuZXcgUmVnRXhwKC9eW2EteiRdW2EtejAtOV0rXFwvW2EtejAtOV0rJC8pO1xuICBmdW5jdGlvbiBpc1NlbWFudGljS2V5KGtleSkge1xuICAgIHJldHVybiBzZW1hbnRpY0lkUGF0dGVybi50ZXN0KGtleSk7XG4gIH1cblxuICAvLyBgaGFzTG9jYWxDaGFuZ2VzYCByZXR1cm5zIHRydWUgaWYgdGhlcmUgaXMgYSBsb2NhbCBjaGFuZ2UgdGhhdFxuICAvLyBoYXMgbm90IGJlZW4gc3luYydkIHlldC5cbiAgZnVuY3Rpb24gaGFzTG9jYWxDaGFuZ2VzKG9iamVjdCkge1xuICAgIGlmICghb2JqZWN0LnVwZGF0ZWRBdCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIW9iamVjdC5fc3luY2VkQXQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0Ll9zeW5jZWRBdCA8IG9iamVjdC51cGRhdGVkQXQ7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBpc01hcmtlZEFzRGVsZXRlZChvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0Ll9kZWxldGVkID09PSB0cnVlO1xuICB9XG5cbiAgLy8gdGhpcyBpcyB3aGVyZSBhbGwgdGhlIHN0b3JlIGV2ZW50cyBnZXQgdHJpZ2dlcmVkLFxuICAvLyBsaWtlIGFkZDp0YXNrLCBjaGFuZ2U6bm90ZTphYmM0NTY3LCByZW1vdmUsIGV0Yy5cbiAgZnVuY3Rpb24gdHJpZ2dlckV2ZW50cyhldmVudE5hbWUsIG9iamVjdCwgb3B0aW9ucykge1xuICAgIHN0b3JlLnRyaWdnZXIoZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG4gICAgc3RvcmUudHJpZ2dlcihvYmplY3QudHlwZSArICc6JyArIGV2ZW50TmFtZSwgJC5leHRlbmQodHJ1ZSwge30sIG9iamVjdCksIG9wdGlvbnMpO1xuXG4gICAgLy8gREVQUkVDQVRFRFxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE0NlxuICAgIHN0b3JlLnRyaWdnZXIoZXZlbnROYW1lICsgJzonICsgb2JqZWN0LnR5cGUsICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcblxuICAgIGlmIChldmVudE5hbWUgIT09ICduZXcnKSB7XG4gICAgICBzdG9yZS50cmlnZ2VyKCBvYmplY3QudHlwZSArICc6JyArIG9iamVjdC5pZCsgJzonICsgZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cbiAgICAgIC8vIERFUFJFQ0FURURcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE0NlxuICAgICAgc3RvcmUudHJpZ2dlciggZXZlbnROYW1lICsgJzonICsgb2JqZWN0LnR5cGUgKyAnOicgKyBvYmplY3QuaWQsICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcbiAgICB9XG5cblxuXG4gICAgLy8gc3luYyBldmVudHMgaGF2ZSBubyBjaGFuZ2VzLCBzbyB3ZSBkb24ndCB0cmlnZ2VyXG4gICAgLy8gXCJjaGFuZ2VcIiBldmVudHMuXG4gICAgaWYgKGV2ZW50TmFtZSA9PT0gJ3N5bmMnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3RvcmUudHJpZ2dlcignY2hhbmdlJywgZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG4gICAgc3RvcmUudHJpZ2dlcihvYmplY3QudHlwZSArICc6Y2hhbmdlJywgZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cbiAgICAvLyBERVBSRUNBVEVEXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hvb2RpZWhxL2hvb2RpZS5qcy9pc3N1ZXMvMTQ2XG4gICAgc3RvcmUudHJpZ2dlcignY2hhbmdlOicgKyBvYmplY3QudHlwZSwgZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cblxuICAgIGlmIChldmVudE5hbWUgIT09ICduZXcnKSB7XG4gICAgICBzdG9yZS50cmlnZ2VyKG9iamVjdC50eXBlICsgJzonICsgb2JqZWN0LmlkICsgJzpjaGFuZ2UnLCBldmVudE5hbWUsICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcblxuICAgICAgLy8gREVQUkVDQVRFRFxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hvb2RpZWhxL2hvb2RpZS5qcy9pc3N1ZXMvMTQ2XG4gICAgICBzdG9yZS50cmlnZ2VyKCdjaGFuZ2U6JyArIG9iamVjdC50eXBlICsgJzonICsgb2JqZWN0LmlkLCBldmVudE5hbWUsICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICAvLyB3aGVuIGFuIG9iamVjdCBnZXRzIGNoYW5nZWQsIHR3byBzcGVjaWFsIGV2ZW50cyBnZXQgdHJpZ2dlcmQ6XG4gIC8vXG4gIC8vIDEuIGRpcnR5IGV2ZW50XG4gIC8vICAgIHRoZSBgZGlydHlgIGV2ZW50IGdldHMgdHJpZ2dlcmVkIGltbWVkaWF0ZWx5LCBmb3IgZXZlcnlcbiAgLy8gICAgY2hhbmdlIHRoYXQgaGFwcGVucy5cbiAgLy8gMi4gaWRsZSBldmVudFxuICAvLyAgICB0aGUgYGlkbGVgIGV2ZW50IGdldHMgdHJpZ2dlcmVkIGFmdGVyIGEgc2hvcnQgdGltZW91dCBvZlxuICAvLyAgICBubyBjaGFuZ2VzLCBlLmcuIDIgc2Vjb25kcy5cbiAgdmFyIGRpcnR5VGltZW91dDtcbiAgZnVuY3Rpb24gdHJpZ2dlckRpcnR5QW5kSWRsZUV2ZW50cygpIHtcbiAgICBzdG9yZS50cmlnZ2VyKCdkaXJ0eScpO1xuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoZGlydHlUaW1lb3V0KTtcblxuICAgIGRpcnR5VGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgc3RvcmUudHJpZ2dlcignaWRsZScsIHN0b3JlLmNoYW5nZWRPYmplY3RzKCkpO1xuICAgIH0sIGlkbGVUaW1lb3V0KTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIHN0YXJ0Qm9vdHN0cmFwcGluZ01vZGUoKSB7XG4gICAgYm9vdHN0cmFwcGluZyA9IHRydWU7XG4gICAgc3RvcmUudHJpZ2dlcignYm9vdHN0cmFwOnN0YXJ0Jyk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBlbmRCb290c3RyYXBwaW5nTW9kZSgpIHtcbiAgICB2YXIgbWV0aG9kQ2FsbCwgbWV0aG9kLCBhcmdzLCBkZWZlcjtcblxuICAgIGJvb3RzdHJhcHBpbmcgPSBmYWxzZTtcbiAgICB3aGlsZShxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICBtZXRob2RDYWxsID0gcXVldWUuc2hpZnQoKTtcbiAgICAgIG1ldGhvZCA9IG1ldGhvZENhbGxbMF07XG4gICAgICBhcmdzID0gbWV0aG9kQ2FsbFsxXTtcbiAgICAgIGRlZmVyID0gbWV0aG9kQ2FsbFsyXTtcbiAgICAgIGxvY2FsU3RvcmVbbWV0aG9kXS5hcHBseShsb2NhbFN0b3JlLCBhcmdzKS50aGVuKGRlZmVyLnJlc29sdmUsIGRlZmVyLnJlamVjdCk7XG4gICAgfVxuXG4gICAgc3RvcmUudHJpZ2dlcignYm9vdHN0cmFwOmVuZCcpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gZW5xdWV1ZShtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgZGVmZXIgPSBob29kaWUuZGVmZXIoKTtcbiAgICBxdWV1ZS5wdXNoKFttZXRob2QsIGFyZ3MsIGRlZmVyXSk7XG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIC8vIHBhdGNoSWZOb3RQZXJzaXN0YW50XG4gIC8vXG4gIGZ1bmN0aW9uIHBhdGNoSWZOb3RQZXJzaXN0YW50ICgpIHtcbiAgICBpZiAoIXN0b3JlLmlzUGVyc2lzdGVudCgpKSB7XG4gICAgICBkYiA9IHtcbiAgICAgICAgZ2V0SXRlbTogZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9LFxuICAgICAgICBzZXRJdGVtOiBmdW5jdGlvbigpIHsgcmV0dXJuIG51bGw7IH0sXG4gICAgICAgIHJlbW92ZUl0ZW06IGZ1bmN0aW9uKCkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgICAga2V5OiBmdW5jdGlvbigpIHsgcmV0dXJuIG51bGw7IH0sXG4gICAgICAgIGxlbmd0aDogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG5cbiAgLy9cbiAgLy8gaW5pdGlhbGl6YXRpb25cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuICAvL1xuXG4gIC8vIGlmIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBsb2NhbCBzdG9yYWdlIHBlcnNpc3RlbmNlLFxuICAvLyBlLmcuIFNhZmFyaSBpbiBwcml2YXRlIG1vZGUsIG92ZXJpdGUgdGhlIHJlc3BlY3RpdmUgbWV0aG9kcy5cblxuXG5cbiAgLy9cbiAgLy8gZXhwb3NlIHB1YmxpYyBBUElcbiAgLy9cbiAgLy8gaW5oZXJpdCBmcm9tIEhvb2RpZXMgU3RvcmUgQVBJXG4gIGhvb2RpZS5zdG9yZSA9IHN0b3JlO1xuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9uY2UgZnJvbSBvdXRzaWRlXG4gIHN0b3JlLmJvb3RzdHJhcERpcnR5T2JqZWN0cyA9IGZ1bmN0aW9uKCkge1xuICAgIGJvb3RzdHJhcERpcnR5T2JqZWN0cygpO1xuICAgIGRlbGV0ZSBzdG9yZS5ib290c3RyYXBEaXJ0eU9iamVjdHM7XG4gIH07XG5cbiAgLy8gYWxsb3cgdG8gcnVuIHRoaXMgb25jZSBmcm9tIG91dHNpZGVcbiAgc3RvcmUucGF0Y2hJZk5vdFBlcnNpc3RhbnQgPSBmdW5jdGlvbigpIHtcbiAgICBwYXRjaElmTm90UGVyc2lzdGFudCgpO1xuICAgIGRlbGV0ZSBzdG9yZS5wYXRjaElmTm90UGVyc2lzdGFudDtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVTdG9yZTtcbiIsIi8vIE9wZW4gc3RvcmVzXG4vLyAtLS0tLS0tLS0tLS0tXG5cbnZhciBob29kaWVSZW1vdGVTdG9yZSA9IHJlcXVpcmUoJy4vcmVtb3RlX3N0b3JlJyk7XG5cbmZ1bmN0aW9uIGhvb2RpZU9wZW4oaG9vZGllKSB7XG4gIHZhciAkZXh0ZW5kID0gd2luZG93LmpRdWVyeS5leHRlbmQ7XG5cbiAgLy8gZ2VuZXJpYyBtZXRob2QgdG8gb3BlbiBhIHN0b3JlLiBVc2VkIGJ5XG4gIC8vXG4gIC8vICogaG9vZGllLnJlbW90ZVxuICAvLyAqIGhvb2RpZS51c2VyKFwiam9lXCIpXG4gIC8vICogaG9vZGllLmdsb2JhbFxuICAvLyAqIC4uLiBhbmQgbW9yZVxuICAvL1xuICAvLyAgICAgaG9vZGllLm9wZW4oXCJzb21lX3N0b3JlX25hbWVcIikuZmluZEFsbCgpXG4gIC8vXG4gIGZ1bmN0aW9uIG9wZW4oc3RvcmVOYW1lLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAkZXh0ZW5kKG9wdGlvbnMsIHtcbiAgICAgIG5hbWU6IHN0b3JlTmFtZVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGhvb2RpZVJlbW90ZVN0b3JlKGhvb2RpZSwgb3B0aW9ucyk7XG4gIH1cblxuICAvL1xuICAvLyBQdWJsaWMgQVBJXG4gIC8vXG4gIGhvb2RpZS5vcGVuID0gb3Blbjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVPcGVuO1xuIiwiLy8gSG9vZGllIERlZmVycyAvIFByb21pc2VzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gcmV0dXJucyBhIGRlZmVyIG9iamVjdCBmb3IgY3VzdG9tIHByb21pc2UgaGFuZGxpbmdzLlxuLy8gUHJvbWlzZXMgYXJlIGhlYXZlbHkgdXNlZCB0aHJvdWdob3V0IHRoZSBjb2RlIG9mIGhvb2RpZS5cbi8vIFdlIGN1cnJlbnRseSBib3Jyb3cgalF1ZXJ5J3MgaW1wbGVtZW50YXRpb246XG4vLyBodHRwOi8vYXBpLmpxdWVyeS5jb20vY2F0ZWdvcnkvZGVmZXJyZWQtb2JqZWN0L1xuLy9cbi8vICAgICBkZWZlciA9IGhvb2RpZS5kZWZlcigpXG4vLyAgICAgaWYgKGdvb2QpIHtcbi8vICAgICAgIGRlZmVyLnJlc29sdmUoJ2dvb2QuJylcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgZGVmZXIucmVqZWN0KCdub3QgZ29vZC4nKVxuLy8gICAgIH1cbi8vICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpXG4vL1xudmFyIEhvb2RpZUVycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllUHJvbWlzZXMgKGhvb2RpZSkge1xuICB2YXIgJGRlZmVyID0gd2luZG93LmpRdWVyeS5EZWZlcnJlZDtcblxuICAvLyByZXR1cm5zIHRydWUgaWYgcGFzc2VkIG9iamVjdCBpcyBhIHByb21pc2UgKGJ1dCBub3QgYSBkZWZlcnJlZCksXG4gIC8vIG90aGVyd2lzZSBmYWxzZS5cbiAgZnVuY3Rpb24gaXNQcm9taXNlKG9iamVjdCkge1xuICAgIHJldHVybiAhISAob2JqZWN0ICYmXG4gICAgICAgICAgICAgICB0eXBlb2Ygb2JqZWN0LmRvbmUgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgICAgICAgIHR5cGVvZiBvYmplY3QucmVzb2x2ZSAhPT0gJ2Z1bmN0aW9uJyk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiByZXNvbHZlKCkge1xuICAgIHJldHVybiAkZGVmZXIoKS5yZXNvbHZlKCkucHJvbWlzZSgpO1xuICB9XG5cblxuICAvL1xuICBmdW5jdGlvbiByZWplY3QoKSB7XG4gICAgcmV0dXJuICRkZWZlcigpLnJlamVjdCgpLnByb21pc2UoKTtcbiAgfVxuXG5cbiAgLy9cbiAgZnVuY3Rpb24gcmVzb2x2ZVdpdGgoKSB7XG4gICAgdmFyIF9kZWZlciA9ICRkZWZlcigpO1xuICAgIHJldHVybiBfZGVmZXIucmVzb2x2ZS5hcHBseShfZGVmZXIsIGFyZ3VtZW50cykucHJvbWlzZSgpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gcmVqZWN0V2l0aChlcnJvclByb3BlcnRpZXMpIHtcbiAgICB2YXIgX2RlZmVyID0gJGRlZmVyKCk7XG4gICAgdmFyIGVycm9yID0gbmV3IEhvb2RpZUVycm9yKGVycm9yUHJvcGVydGllcyk7XG4gICAgcmV0dXJuIF9kZWZlci5yZWplY3QoZXJyb3IpLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIC8vIFB1YmxpYyBBUElcbiAgLy9cbiAgaG9vZGllLmRlZmVyID0gJGRlZmVyO1xuICBob29kaWUuaXNQcm9taXNlID0gaXNQcm9taXNlO1xuICBob29kaWUucmVzb2x2ZSA9IHJlc29sdmU7XG4gIGhvb2RpZS5yZWplY3QgPSByZWplY3Q7XG4gIGhvb2RpZS5yZXNvbHZlV2l0aCA9IHJlc29sdmVXaXRoO1xuICBob29kaWUucmVqZWN0V2l0aCA9IHJlamVjdFdpdGg7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllUHJvbWlzZXM7XG4iLCIvLyBSZW1vdGVcbi8vID09PT09PT09XG5cbi8vIENvbm5lY3Rpb24gdG8gYSByZW1vdGUgQ291Y2ggRGF0YWJhc2UuXG4vL1xuLy8gc3RvcmUgQVBJXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG4vL1xuLy8gb2JqZWN0IGxvYWRpbmcgLyB1cGRhdGluZyAvIGRlbGV0aW5nXG4vL1xuLy8gKiBmaW5kKHR5cGUsIGlkKVxuLy8gKiBmaW5kQWxsKHR5cGUgKVxuLy8gKiBhZGQodHlwZSwgb2JqZWN0KVxuLy8gKiBzYXZlKHR5cGUsIGlkLCBvYmplY3QpXG4vLyAqIHVwZGF0ZSh0eXBlLCBpZCwgbmV3X3Byb3BlcnRpZXMgKVxuLy8gKiB1cGRhdGVBbGwoIHR5cGUsIG5ld19wcm9wZXJ0aWVzKVxuLy8gKiByZW1vdmUodHlwZSwgaWQpXG4vLyAqIHJlbW92ZUFsbCh0eXBlKVxuLy9cbi8vIGN1c3RvbSByZXF1ZXN0c1xuLy9cbi8vICogcmVxdWVzdCh2aWV3LCBwYXJhbXMpXG4vLyAqIGdldCh2aWV3LCBwYXJhbXMpXG4vLyAqIHBvc3QodmlldywgcGFyYW1zKVxuLy9cbi8vIHN5bmNocm9uaXphdGlvblxuLy9cbi8vICogY29ubmVjdCgpXG4vLyAqIGRpc2Nvbm5lY3QoKVxuLy8gKiBwdWxsKClcbi8vICogcHVzaCgpXG4vLyAqIHN5bmMoKVxuLy9cbi8vIGV2ZW50IGJpbmRpbmdcbi8vXG4vLyAqIG9uKGV2ZW50LCBjYWxsYmFjaylcbi8vXG52YXIgaG9vZGllU3RvcmVBcGkgPSByZXF1aXJlKCcuL3N0b3JlJyk7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVSZW1vdGVTdG9yZSAoaG9vZGllLCBvcHRpb25zKSB7XG5cbiAgdmFyIHJlbW90ZVN0b3JlID0ge307XG5cblxuICAvLyBSZW1vdGUgU3RvcmUgUGVyc2lzdGFuY2UgbWV0aG9kc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gZmluZFxuICAvLyAtLS0tLS1cblxuICAvLyBmaW5kIG9uZSBvYmplY3RcbiAgLy9cbiAgcmVtb3RlU3RvcmUuZmluZCA9IGZ1bmN0aW9uIGZpbmQodHlwZSwgaWQpIHtcbiAgICB2YXIgcGF0aDtcblxuICAgIHBhdGggPSB0eXBlICsgJy8nICsgaWQ7XG5cbiAgICBpZiAocmVtb3RlLnByZWZpeCkge1xuICAgICAgcGF0aCA9IHJlbW90ZS5wcmVmaXggKyBwYXRoO1xuICAgIH1cblxuICAgIHBhdGggPSAnLycgKyBlbmNvZGVVUklDb21wb25lbnQocGF0aCk7XG5cbiAgICByZXR1cm4gcmVtb3RlLnJlcXVlc3QoJ0dFVCcsIHBhdGgpLnRoZW4ocGFyc2VGcm9tUmVtb3RlKTtcbiAgfTtcblxuXG4gIC8vIGZpbmRBbGxcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gZmluZCBhbGwgb2JqZWN0cywgY2FuIGJlIGZpbGV0ZXJlZCBieSBhIHR5cGVcbiAgLy9cbiAgcmVtb3RlU3RvcmUuZmluZEFsbCA9IGZ1bmN0aW9uIGZpbmRBbGwodHlwZSkge1xuICAgIHZhciBlbmRrZXksIHBhdGgsIHN0YXJ0a2V5O1xuXG4gICAgcGF0aCA9ICcvX2FsbF9kb2NzP2luY2x1ZGVfZG9jcz10cnVlJztcblxuICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgIGNhc2UgKHR5cGUgIT09IHVuZGVmaW5lZCkgJiYgcmVtb3RlLnByZWZpeCAhPT0gJyc6XG4gICAgICBzdGFydGtleSA9IHJlbW90ZS5wcmVmaXggKyB0eXBlICsgJy8nO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSB0eXBlICE9PSB1bmRlZmluZWQ6XG4gICAgICBzdGFydGtleSA9IHR5cGUgKyAnLyc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIHJlbW90ZS5wcmVmaXggIT09ICcnOlxuICAgICAgc3RhcnRrZXkgPSByZW1vdGUucHJlZml4O1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHN0YXJ0a2V5ID0gJyc7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0a2V5KSB7XG5cbiAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IG9ubHkgb2JqZWN0cyBzdGFydGluZyB3aXRoXG4gICAgICAvLyBgc3RhcnRrZXlgIHdpbGwgYmUgcmV0dXJuZWRcbiAgICAgIGVuZGtleSA9IHN0YXJ0a2V5LnJlcGxhY2UoLy4kLywgZnVuY3Rpb24oY2hhcnMpIHtcbiAgICAgICAgdmFyIGNoYXJDb2RlO1xuICAgICAgICBjaGFyQ29kZSA9IGNoYXJzLmNoYXJDb2RlQXQoMCk7XG4gICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNoYXJDb2RlICsgMSk7XG4gICAgICB9KTtcbiAgICAgIHBhdGggPSAnJyArIHBhdGggKyAnJnN0YXJ0a2V5PVwiJyArIChlbmNvZGVVUklDb21wb25lbnQoc3RhcnRrZXkpKSArICdcIiZlbmRrZXk9XCInICsgKGVuY29kZVVSSUNvbXBvbmVudChlbmRrZXkpKSArICdcIic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlbW90ZS5yZXF1ZXN0KCdHRVQnLCBwYXRoKS50aGVuKG1hcERvY3NGcm9tRmluZEFsbCkudGhlbihwYXJzZUFsbEZyb21SZW1vdGUpO1xuICB9O1xuXG5cbiAgLy8gc2F2ZVxuICAvLyAtLS0tLS1cblxuICAvLyBzYXZlIGEgbmV3IG9iamVjdC4gSWYgaXQgZXhpc3RlZCBiZWZvcmUsIGFsbCBwcm9wZXJ0aWVzXG4gIC8vIHdpbGwgYmUgb3ZlcndyaXR0ZW5cbiAgLy9cbiAgcmVtb3RlU3RvcmUuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUob2JqZWN0KSB7XG4gICAgdmFyIHBhdGg7XG5cbiAgICBpZiAoIW9iamVjdC5pZCkge1xuICAgICAgb2JqZWN0LmlkID0gaG9vZGllLmdlbmVyYXRlSWQoKTtcbiAgICB9XG5cbiAgICBvYmplY3QgPSBwYXJzZUZvclJlbW90ZShvYmplY3QpO1xuICAgIHBhdGggPSAnLycgKyBlbmNvZGVVUklDb21wb25lbnQob2JqZWN0Ll9pZCk7XG4gICAgcmV0dXJuIHJlbW90ZS5yZXF1ZXN0KCdQVVQnLCBwYXRoLCB7XG4gICAgICBkYXRhOiBvYmplY3RcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIHJlbW92ZVxuICAvLyAtLS0tLS0tLS1cblxuICAvLyByZW1vdmUgb25lIG9iamVjdFxuICAvL1xuICByZW1vdGVTdG9yZS5yZW1vdmUgPSBmdW5jdGlvbiByZW1vdmUodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gcmVtb3RlLnVwZGF0ZSh0eXBlLCBpZCwge1xuICAgICAgX2RlbGV0ZWQ6IHRydWVcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIHJlbW92ZUFsbFxuICAvLyAtLS0tLS0tLS0tLS1cblxuICAvLyByZW1vdmUgYWxsIG9iamVjdHMsIGNhbiBiZSBmaWx0ZXJlZCBieSB0eXBlXG4gIC8vXG4gIHJlbW90ZVN0b3JlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uIHJlbW92ZUFsbCh0eXBlKSB7XG4gICAgcmV0dXJuIHJlbW90ZS51cGRhdGVBbGwodHlwZSwge1xuICAgICAgX2RlbGV0ZWQ6IHRydWVcbiAgICB9KTtcbiAgfTtcblxuXG4gIHZhciByZW1vdGUgPSBob29kaWVTdG9yZUFwaShob29kaWUsIHtcblxuICAgIG5hbWU6IG9wdGlvbnMubmFtZSxcblxuICAgIGJhY2tlbmQ6IHtcbiAgICAgIHNhdmU6IHJlbW90ZVN0b3JlLnNhdmUsXG4gICAgICBmaW5kOiByZW1vdGVTdG9yZS5maW5kLFxuICAgICAgZmluZEFsbDogcmVtb3RlU3RvcmUuZmluZEFsbCxcbiAgICAgIHJlbW92ZTogcmVtb3RlU3RvcmUucmVtb3ZlLFxuICAgICAgcmVtb3ZlQWxsOiByZW1vdGVTdG9yZS5yZW1vdmVBbGxcbiAgICB9XG4gIH0pO1xuXG5cblxuXG5cbiAgLy8gcHJvcGVydGllc1xuICAvLyAtLS0tLS0tLS0tLS1cblxuICAvLyBuYW1lXG5cbiAgLy8gdGhlIG5hbWUgb2YgdGhlIFJlbW90ZSBpcyB0aGUgbmFtZSBvZiB0aGVcbiAgLy8gQ291Y2hEQiBkYXRhYmFzZSBhbmQgaXMgYWxzbyB1c2VkIHRvIHByZWZpeFxuICAvLyB0cmlnZ2VyZWQgZXZlbnRzXG4gIC8vXG4gIHZhciByZW1vdGVOYW1lID0gbnVsbDtcblxuXG4gIC8vIHN5bmNcblxuICAvLyBpZiBzZXQgdG8gdHJ1ZSwgdXBkYXRlcyB3aWxsIGJlIGNvbnRpbnVvdXNseSBwdWxsZWRcbiAgLy8gYW5kIHB1c2hlZC4gQWx0ZXJuYXRpdmVseSwgYHN5bmNgIGNhbiBiZSBzZXQgdG9cbiAgLy8gYHB1bGw6IHRydWVgIG9yIGBwdXNoOiB0cnVlYC5cbiAgLy9cbiAgcmVtb3RlLmNvbm5lY3RlZCA9IGZhbHNlO1xuXG5cbiAgLy8gcHJlZml4XG5cbiAgLy8gcHJlZml4IGZvciBkb2NzIGluIGEgQ291Y2hEQiBkYXRhYmFzZSwgZS5nLiBhbGwgZG9jc1xuICAvLyBpbiBwdWJsaWMgdXNlciBzdG9yZXMgYXJlIHByZWZpeGVkIGJ5ICckcHVibGljLydcbiAgLy9cbiAgcmVtb3RlLnByZWZpeCA9ICcnO1xuICB2YXIgcmVtb3RlUHJlZml4UGF0dGVybiA9IG5ldyBSZWdFeHAoJ14nKTtcblxuXG4gIC8vIGRlZmF1bHRzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvL1xuICBpZiAob3B0aW9ucy5uYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICByZW1vdGVOYW1lID0gb3B0aW9ucy5uYW1lO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMucHJlZml4ICE9PSB1bmRlZmluZWQpIHtcbiAgICByZW1vdGUucHJlZml4ID0gb3B0aW9ucy5wcmVmaXg7XG4gICAgcmVtb3RlUHJlZml4UGF0dGVybiA9IG5ldyBSZWdFeHAoJ14nICsgcmVtb3RlLnByZWZpeCk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5iYXNlVXJsICE9PSBudWxsKSB7XG4gICAgcmVtb3RlLmJhc2VVcmwgPSBvcHRpb25zLmJhc2VVcmw7XG4gIH1cblxuXG4gIC8vIHJlcXVlc3RcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gd3JhcHBlciBmb3IgaG9vZGllLnJlcXVlc3QsIHdpdGggc29tZSBzdG9yZSBzcGVjaWZpYyBkZWZhdWx0c1xuICAvLyBhbmQgYSBwcmVmaXhlZCBwYXRoXG4gIC8vXG4gIHJlbW90ZS5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdCh0eXBlLCBwYXRoLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAocmVtb3RlTmFtZSkge1xuICAgICAgcGF0aCA9ICcvJyArIChlbmNvZGVVUklDb21wb25lbnQocmVtb3RlTmFtZSkpICsgcGF0aDtcbiAgICB9XG5cbiAgICBpZiAocmVtb3RlLmJhc2VVcmwpIHtcbiAgICAgIHBhdGggPSAnJyArIHJlbW90ZS5iYXNlVXJsICsgcGF0aDtcbiAgICB9XG5cbiAgICBvcHRpb25zLmNvbnRlbnRUeXBlID0gb3B0aW9ucy5jb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24vanNvbic7XG5cbiAgICBpZiAodHlwZSA9PT0gJ1BPU1QnIHx8IHR5cGUgPT09ICdQVVQnKSB7XG4gICAgICBvcHRpb25zLmRhdGFUeXBlID0gb3B0aW9ucy5kYXRhVHlwZSB8fCAnanNvbic7XG4gICAgICBvcHRpb25zLnByb2Nlc3NEYXRhID0gb3B0aW9ucy5wcm9jZXNzRGF0YSB8fCBmYWxzZTtcbiAgICAgIG9wdGlvbnMuZGF0YSA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiBob29kaWUucmVxdWVzdCh0eXBlLCBwYXRoLCBvcHRpb25zKTtcbiAgfTtcblxuXG4gIC8vIGlzS25vd25PYmplY3RcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gZGV0ZXJtaW5lIGJldHdlZW4gYSBrbm93biBhbmQgYSBuZXcgb2JqZWN0XG4gIC8vXG4gIHJlbW90ZS5pc0tub3duT2JqZWN0ID0gZnVuY3Rpb24gaXNLbm93bk9iamVjdChvYmplY3QpIHtcbiAgICB2YXIga2V5ID0gJycgKyBvYmplY3QudHlwZSArICcvJyArIG9iamVjdC5pZDtcblxuICAgIGlmIChrbm93bk9iamVjdHNba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4ga25vd25PYmplY3RzW2tleV07XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gbWFya0FzS25vd25PYmplY3RcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGRldGVybWluZSBiZXR3ZWVuIGEga25vd24gYW5kIGEgbmV3IG9iamVjdFxuICAvL1xuICByZW1vdGUubWFya0FzS25vd25PYmplY3QgPSBmdW5jdGlvbiBtYXJrQXNLbm93bk9iamVjdChvYmplY3QpIHtcbiAgICB2YXIga2V5ID0gJycgKyBvYmplY3QudHlwZSArICcvJyArIG9iamVjdC5pZDtcbiAgICBrbm93bk9iamVjdHNba2V5XSA9IDE7XG4gICAgcmV0dXJuIGtub3duT2JqZWN0c1trZXldO1xuICB9O1xuXG5cbiAgLy8gc3luY2hyb25pemF0aW9uXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gQ29ubmVjdFxuICAvLyAtLS0tLS0tLS1cblxuICAvLyBzdGFydCBzeW5jaW5nLiBgcmVtb3RlLmJvb3RzdHJhcCgpYCB3aWxsIGF1dG9tYXRpY2FsbHkgc3RhcnRcbiAgLy8gcHVsbGluZyB3aGVuIGByZW1vdGUuY29ubmVjdGVkYCByZW1haW5zIHRydWUuXG4gIC8vXG4gIHJlbW90ZS5jb25uZWN0ID0gZnVuY3Rpb24gY29ubmVjdChuYW1lKSB7XG4gICAgaWYgKG5hbWUpIHtcbiAgICAgIHJlbW90ZU5hbWUgPSBuYW1lO1xuICAgIH1cbiAgICByZW1vdGUuY29ubmVjdGVkID0gdHJ1ZTtcbiAgICByZW1vdGUudHJpZ2dlcignY29ubmVjdCcpO1xuICAgIHJldHVybiByZW1vdGUuYm9vdHN0cmFwKCkudGhlbiggZnVuY3Rpb24oKSB7IHJlbW90ZS5wdXNoKCk7IH0gKTtcbiAgfTtcblxuXG4gIC8vIERpc2Nvbm5lY3RcbiAgLy8gLS0tLS0tLS0tLS0tXG5cbiAgLy8gc3RvcCBzeW5jaW5nIGNoYW5nZXMgZnJvbSByZW1vdGUgc3RvcmVcbiAgLy9cbiAgcmVtb3RlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiBkaXNjb25uZWN0KCkge1xuICAgIHJlbW90ZS5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICByZW1vdGUudHJpZ2dlcignZGlzY29ubmVjdCcpOyAvLyBUT0RPOiBzcGVjIHRoYXRcblxuICAgIGlmIChwdWxsUmVxdWVzdCkge1xuICAgICAgcHVsbFJlcXVlc3QuYWJvcnQoKTtcbiAgICB9XG5cbiAgICBpZiAocHVzaFJlcXVlc3QpIHtcbiAgICAgIHB1c2hSZXF1ZXN0LmFib3J0KCk7XG4gICAgfVxuXG4gIH07XG5cblxuICAvLyBpc0Nvbm5lY3RlZFxuICAvLyAtLS0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgcmVtb3RlLmlzQ29ubmVjdGVkID0gZnVuY3Rpb24gaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHJlbW90ZS5jb25uZWN0ZWQ7XG4gIH07XG5cblxuICAvLyBnZXRTaW5jZU5yXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIHJldHVybnMgdGhlIHNlcXVlbmNlIG51bWJlciBmcm9tIHdpY2ggdG8gc3RhcnQgdG8gZmluZCBjaGFuZ2VzIGluIHB1bGxcbiAgLy9cbiAgdmFyIHNpbmNlID0gb3B0aW9ucy5zaW5jZSB8fCAwOyAvLyBUT0RPOiBzcGVjIHRoYXQhXG4gIHJlbW90ZS5nZXRTaW5jZU5yID0gZnVuY3Rpb24gZ2V0U2luY2VOcigpIHtcbiAgICBpZiAodHlwZW9mIHNpbmNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gc2luY2UoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2luY2U7XG4gIH07XG5cblxuICAvLyBib290c3RyYXBcbiAgLy8gLS0tLS0tLS0tLS1cblxuICAvLyBpbml0YWwgcHVsbCBvZiBkYXRhIG9mIHRoZSByZW1vdGUgc3RvcmUuIEJ5IGRlZmF1bHQsIHdlIHB1bGwgYWxsXG4gIC8vIGNoYW5nZXMgc2luY2UgdGhlIGJlZ2lubmluZywgYnV0IHRoaXMgYmVoYXZpb3IgbWlnaHQgYmUgYWRqdXN0ZWQsXG4gIC8vIGUuZyBmb3IgYSBmaWx0ZXJlZCBib290c3RyYXAuXG4gIC8vXG4gIHZhciBpc0Jvb3RzdHJhcHBpbmcgPSBmYWxzZTtcbiAgcmVtb3RlLmJvb3RzdHJhcCA9IGZ1bmN0aW9uIGJvb3RzdHJhcCgpIHtcbiAgICBpc0Jvb3RzdHJhcHBpbmcgPSB0cnVlO1xuICAgIHJlbW90ZS50cmlnZ2VyKCdib290c3RyYXA6c3RhcnQnKTtcbiAgICByZXR1cm4gcmVtb3RlLnB1bGwoKS5kb25lKCBoYW5kbGVCb290c3RyYXBTdWNjZXNzICk7XG4gIH07XG5cblxuICAvLyBwdWxsIGNoYW5nZXNcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBhLmsuYS4gbWFrZSBhIEdFVCByZXF1ZXN0IHRvIENvdWNoREIncyBgX2NoYW5nZXNgIGZlZWQuXG4gIC8vIFdlIGN1cnJlbnRseSBtYWtlIGxvbmcgcG9sbCByZXF1ZXN0cywgdGhhdCB3ZSBtYW51YWxseSBhYm9ydFxuICAvLyBhbmQgcmVzdGFydCBlYWNoIDI1IHNlY29uZHMuXG4gIC8vXG4gIHZhciBwdWxsUmVxdWVzdCwgcHVsbFJlcXVlc3RUaW1lb3V0O1xuICByZW1vdGUucHVsbCA9IGZ1bmN0aW9uIHB1bGwoKSB7XG4gICAgcHVsbFJlcXVlc3QgPSByZW1vdGUucmVxdWVzdCgnR0VUJywgcHVsbFVybCgpKTtcblxuICAgIGlmIChyZW1vdGUuaXNDb25uZWN0ZWQoKSkge1xuICAgICAgd2luZG93LmNsZWFyVGltZW91dChwdWxsUmVxdWVzdFRpbWVvdXQpO1xuICAgICAgcHVsbFJlcXVlc3RUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQocmVzdGFydFB1bGxSZXF1ZXN0LCAyNTAwMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHB1bGxSZXF1ZXN0LmRvbmUoaGFuZGxlUHVsbFN1Y2Nlc3MpLmZhaWwoaGFuZGxlUHVsbEVycm9yKTtcbiAgfTtcblxuXG4gIC8vIHB1c2ggY2hhbmdlc1xuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFB1c2ggb2JqZWN0cyB0byByZW1vdGUgc3RvcmUgdXNpbmcgdGhlIGBfYnVsa19kb2NzYCBBUEkuXG4gIC8vXG4gIHZhciBwdXNoUmVxdWVzdDtcbiAgcmVtb3RlLnB1c2ggPSBmdW5jdGlvbiBwdXNoKG9iamVjdHMpIHtcbiAgICB2YXIgb2JqZWN0LCBvYmplY3RzRm9yUmVtb3RlLCBfaSwgX2xlbjtcblxuICAgIGlmICghJC5pc0FycmF5KG9iamVjdHMpKSB7XG4gICAgICBvYmplY3RzID0gZGVmYXVsdE9iamVjdHNUb1B1c2goKTtcbiAgICB9XG5cbiAgICBpZiAob2JqZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZVdpdGgoW10pO1xuICAgIH1cblxuICAgIG9iamVjdHNGb3JSZW1vdGUgPSBbXTtcblxuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gb2JqZWN0cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuXG4gICAgICAvLyBkb24ndCBtZXNzIHdpdGggb3JpZ2luYWwgb2JqZWN0c1xuICAgICAgb2JqZWN0ID0gJC5leHRlbmQodHJ1ZSwge30sIG9iamVjdHNbX2ldKTtcbiAgICAgIGFkZFJldmlzaW9uVG8ob2JqZWN0KTtcbiAgICAgIG9iamVjdCA9IHBhcnNlRm9yUmVtb3RlKG9iamVjdCk7XG4gICAgICBvYmplY3RzRm9yUmVtb3RlLnB1c2gob2JqZWN0KTtcbiAgICB9XG4gICAgcHVzaFJlcXVlc3QgPSByZW1vdGUucmVxdWVzdCgnUE9TVCcsICcvX2J1bGtfZG9jcycsIHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgZG9jczogb2JqZWN0c0ZvclJlbW90ZSxcbiAgICAgICAgbmV3X2VkaXRzOiBmYWxzZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcHVzaFJlcXVlc3QuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICByZW1vdGUudHJpZ2dlcigncHVzaCcsIG9iamVjdHNbaV0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBwdXNoUmVxdWVzdDtcbiAgfTtcblxuICAvLyBzeW5jIGNoYW5nZXNcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBwdXNoIG9iamVjdHMsIHRoZW4gcHVsbCB1cGRhdGVzLlxuICAvL1xuICByZW1vdGUuc3luYyA9IGZ1bmN0aW9uIHN5bmMob2JqZWN0cykge1xuICAgIHJldHVybiByZW1vdGUucHVzaChvYmplY3RzKS50aGVuKHJlbW90ZS5wdWxsKTtcbiAgfTtcblxuICAvL1xuICAvLyBQcml2YXRlXG4gIC8vIC0tLS0tLS0tLVxuICAvL1xuXG4gIC8vIGluIG9yZGVyIHRvIGRpZmZlcmVudGlhdGUgd2hldGhlciBhbiBvYmplY3QgZnJvbSByZW1vdGUgc2hvdWxkIHRyaWdnZXIgYSAnbmV3J1xuICAvLyBvciBhbiAndXBkYXRlJyBldmVudCwgd2Ugc3RvcmUgYSBoYXNoIG9mIGtub3duIG9iamVjdHNcbiAgdmFyIGtub3duT2JqZWN0cyA9IHt9O1xuXG5cbiAgLy8gdmFsaWQgQ291Y2hEQiBkb2MgYXR0cmlidXRlcyBzdGFydGluZyB3aXRoIGFuIHVuZGVyc2NvcmVcbiAgLy9cbiAgdmFyIHZhbGlkU3BlY2lhbEF0dHJpYnV0ZXMgPSBbJ19pZCcsICdfcmV2JywgJ19kZWxldGVkJywgJ19yZXZpc2lvbnMnLCAnX2F0dGFjaG1lbnRzJ107XG5cblxuICAvLyBkZWZhdWx0IG9iamVjdHMgdG8gcHVzaFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHdoZW4gcHVzaGVkIHdpdGhvdXQgcGFzc2luZyBhbnkgb2JqZWN0cywgdGhlIG9iamVjdHMgcmV0dXJuZWQgZnJvbVxuICAvLyB0aGlzIG1ldGhvZCB3aWxsIGJlIHBhc3NlZC4gSXQgY2FuIGJlIG92ZXJ3cml0dGVuIGJ5IHBhc3NpbmcgYW5cbiAgLy8gYXJyYXkgb2Ygb2JqZWN0cyBvciBhIGZ1bmN0aW9uIGFzIGBvcHRpb25zLm9iamVjdHNgXG4gIC8vXG4gIHZhciBkZWZhdWx0T2JqZWN0c1RvUHVzaCA9IGZ1bmN0aW9uIGRlZmF1bHRPYmplY3RzVG9QdXNoKCkge1xuICAgIHJldHVybiBbXTtcbiAgfTtcbiAgaWYgKG9wdGlvbnMuZGVmYXVsdE9iamVjdHNUb1B1c2gpIHtcbiAgICBpZiAoJC5pc0FycmF5KG9wdGlvbnMuZGVmYXVsdE9iamVjdHNUb1B1c2gpKSB7XG4gICAgICBkZWZhdWx0T2JqZWN0c1RvUHVzaCA9IGZ1bmN0aW9uIGRlZmF1bHRPYmplY3RzVG9QdXNoKCkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5kZWZhdWx0T2JqZWN0c1RvUHVzaDtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlZmF1bHRPYmplY3RzVG9QdXNoID0gb3B0aW9ucy5kZWZhdWx0T2JqZWN0c1RvUHVzaDtcbiAgICB9XG4gIH1cblxuXG4gIC8vIHNldFNpbmNlTnJcbiAgLy8gLS0tLS0tLS0tLS0tXG5cbiAgLy8gc2V0cyB0aGUgc2VxdWVuY2UgbnVtYmVyIGZyb20gd2ljaCB0byBzdGFydCB0byBmaW5kIGNoYW5nZXMgaW4gcHVsbC5cbiAgLy8gSWYgcmVtb3RlIHN0b3JlIHdhcyBpbml0aWFsaXplZCB3aXRoIHNpbmNlIDogZnVuY3Rpb24obnIpIHsgLi4uIH0sXG4gIC8vIGNhbGwgdGhlIGZ1bmN0aW9uIHdpdGggdGhlIHNlcSBwYXNzZWQuIE90aGVyd2lzZSBzaW1wbHkgc2V0IHRoZSBzZXFcbiAgLy8gbnVtYmVyIGFuZCByZXR1cm4gaXQuXG4gIC8vXG4gIGZ1bmN0aW9uIHNldFNpbmNlTnIoc2VxKSB7XG4gICAgaWYgKHR5cGVvZiBzaW5jZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHNpbmNlKHNlcSk7XG4gICAgfVxuXG4gICAgc2luY2UgPSBzZXE7XG4gICAgcmV0dXJuIHNpbmNlO1xuICB9XG5cblxuICAvLyBQYXJzZSBmb3IgcmVtb3RlXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHBhcnNlIG9iamVjdCBmb3IgcmVtb3RlIHN0b3JhZ2UuIEFsbCBwcm9wZXJ0aWVzIHN0YXJ0aW5nIHdpdGggYW5cbiAgLy8gYHVuZGVyc2NvcmVgIGRvIG5vdCBnZXQgc3luY2hyb25pemVkIGRlc3BpdGUgdGhlIHNwZWNpYWwgcHJvcGVydGllc1xuICAvLyBgX2lkYCwgYF9yZXZgIGFuZCBgX2RlbGV0ZWRgIChzZWUgYWJvdmUpXG4gIC8vXG4gIC8vIEFsc28gYGlkYCBnZXRzIHJlcGxhY2VkIHdpdGggYF9pZGAgd2hpY2ggY29uc2lzdHMgb2YgdHlwZSAmIGlkXG4gIC8vXG4gIGZ1bmN0aW9uIHBhcnNlRm9yUmVtb3RlKG9iamVjdCkge1xuICAgIHZhciBhdHRyLCBwcm9wZXJ0aWVzO1xuICAgIHByb3BlcnRpZXMgPSAkLmV4dGVuZCh7fSwgb2JqZWN0KTtcblxuICAgIGZvciAoYXR0ciBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICBpZiAocHJvcGVydGllcy5oYXNPd25Qcm9wZXJ0eShhdHRyKSkge1xuICAgICAgICBpZiAodmFsaWRTcGVjaWFsQXR0cmlidXRlcy5pbmRleE9mKGF0dHIpICE9PSAtMSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghL15fLy50ZXN0KGF0dHIpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgZGVsZXRlIHByb3BlcnRpZXNbYXR0cl07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gcHJlcGFyZSBDb3VjaERCIGlkXG4gICAgcHJvcGVydGllcy5faWQgPSAnJyArIHByb3BlcnRpZXMudHlwZSArICcvJyArIHByb3BlcnRpZXMuaWQ7XG4gICAgaWYgKHJlbW90ZS5wcmVmaXgpIHtcbiAgICAgIHByb3BlcnRpZXMuX2lkID0gJycgKyByZW1vdGUucHJlZml4ICsgcHJvcGVydGllcy5faWQ7XG4gICAgfVxuICAgIGRlbGV0ZSBwcm9wZXJ0aWVzLmlkO1xuICAgIHJldHVybiBwcm9wZXJ0aWVzO1xuICB9XG5cblxuICAvLyAjIyMgX3BhcnNlRnJvbVJlbW90ZVxuXG4gIC8vIG5vcm1hbGl6ZSBvYmplY3RzIGNvbWluZyBmcm9tIHJlbW90ZVxuICAvL1xuICAvLyByZW5hbWVzIGBfaWRgIGF0dHJpYnV0ZSB0byBgaWRgIGFuZCByZW1vdmVzIHRoZSB0eXBlIGZyb20gdGhlIGlkLFxuICAvLyBlLmcuIGB0eXBlLzEyM2AgLT4gYDEyM2BcbiAgLy9cbiAgZnVuY3Rpb24gcGFyc2VGcm9tUmVtb3RlKG9iamVjdCkge1xuICAgIHZhciBpZCwgaWdub3JlLCBfcmVmO1xuXG4gICAgLy8gaGFuZGxlIGlkIGFuZCB0eXBlXG4gICAgaWQgPSBvYmplY3QuX2lkIHx8IG9iamVjdC5pZDtcbiAgICBkZWxldGUgb2JqZWN0Ll9pZDtcblxuICAgIGlmIChyZW1vdGUucHJlZml4KSB7XG4gICAgICBpZCA9IGlkLnJlcGxhY2UocmVtb3RlUHJlZml4UGF0dGVybiwgJycpO1xuICAgICAgLy8gaWQgPSBpZC5yZXBsYWNlKG5ldyBSZWdFeHAoJ14nICsgcmVtb3RlLnByZWZpeCksICcnKTtcbiAgICB9XG5cbiAgICAvLyB0dXJuIGRvYy8xMjMgaW50byB0eXBlID0gZG9jICYgaWQgPSAxMjNcbiAgICAvLyBOT1RFOiB3ZSBkb24ndCB1c2UgYSBzaW1wbGUgaWQuc3BsaXQoL1xcLy8pIGhlcmUsXG4gICAgLy8gYXMgaW4gc29tZSBjYXNlcyBJRHMgbWlnaHQgY29udGFpbiAnLycsIHRvb1xuICAgIC8vXG4gICAgX3JlZiA9IGlkLm1hdGNoKC8oW15cXC9dKylcXC8oLiopLyksXG4gICAgaWdub3JlID0gX3JlZlswXSxcbiAgICBvYmplY3QudHlwZSA9IF9yZWZbMV0sXG4gICAgb2JqZWN0LmlkID0gX3JlZlsyXTtcblxuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUFsbEZyb21SZW1vdGUob2JqZWN0cykge1xuICAgIHZhciBvYmplY3QsIF9pLCBfbGVuLCBfcmVzdWx0cztcbiAgICBfcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gb2JqZWN0cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgb2JqZWN0ID0gb2JqZWN0c1tfaV07XG4gICAgICBfcmVzdWx0cy5wdXNoKHBhcnNlRnJvbVJlbW90ZShvYmplY3QpKTtcbiAgICB9XG4gICAgcmV0dXJuIF9yZXN1bHRzO1xuICB9XG5cblxuICAvLyAjIyMgX2FkZFJldmlzaW9uVG9cblxuICAvLyBleHRlbmRzIHBhc3NlZCBvYmplY3Qgd2l0aCBhIF9yZXYgcHJvcGVydHlcbiAgLy9cbiAgZnVuY3Rpb24gYWRkUmV2aXNpb25UbyhhdHRyaWJ1dGVzKSB7XG4gICAgdmFyIGN1cnJlbnRSZXZJZCwgY3VycmVudFJldk5yLCBuZXdSZXZpc2lvbklkLCBfcmVmO1xuICAgIHRyeSB7XG4gICAgICBfcmVmID0gYXR0cmlidXRlcy5fcmV2LnNwbGl0KC8tLyksXG4gICAgICBjdXJyZW50UmV2TnIgPSBfcmVmWzBdLFxuICAgICAgY3VycmVudFJldklkID0gX3JlZlsxXTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHt9XG4gICAgY3VycmVudFJldk5yID0gcGFyc2VJbnQoY3VycmVudFJldk5yLCAxMCkgfHwgMDtcbiAgICBuZXdSZXZpc2lvbklkID0gZ2VuZXJhdGVOZXdSZXZpc2lvbklkKCk7XG5cbiAgICAvLyBsb2NhbCBjaGFuZ2VzIGFyZSBub3QgbWVhbnQgdG8gYmUgcmVwbGljYXRlZCBvdXRzaWRlIG9mIHRoZVxuICAgIC8vIHVzZXJzIGRhdGFiYXNlLCB0aGVyZWZvcmUgdGhlIGAtbG9jYWxgIHN1ZmZpeC5cbiAgICBpZiAoYXR0cmlidXRlcy5fJGxvY2FsKSB7XG4gICAgICBuZXdSZXZpc2lvbklkICs9ICctbG9jYWwnO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZXMuX3JldiA9ICcnICsgKGN1cnJlbnRSZXZOciArIDEpICsgJy0nICsgbmV3UmV2aXNpb25JZDtcbiAgICBhdHRyaWJ1dGVzLl9yZXZpc2lvbnMgPSB7XG4gICAgICBzdGFydDogMSxcbiAgICAgIGlkczogW25ld1JldmlzaW9uSWRdXG4gICAgfTtcblxuICAgIGlmIChjdXJyZW50UmV2SWQpIHtcbiAgICAgIGF0dHJpYnV0ZXMuX3JldmlzaW9ucy5zdGFydCArPSBjdXJyZW50UmV2TnI7XG4gICAgICByZXR1cm4gYXR0cmlidXRlcy5fcmV2aXNpb25zLmlkcy5wdXNoKGN1cnJlbnRSZXZJZCk7XG4gICAgfVxuICB9XG5cblxuICAvLyAjIyMgZ2VuZXJhdGUgbmV3IHJldmlzaW9uIGlkXG5cbiAgLy9cbiAgZnVuY3Rpb24gZ2VuZXJhdGVOZXdSZXZpc2lvbklkKCkge1xuICAgIHJldHVybiBob29kaWUuZ2VuZXJhdGVJZCg5KTtcbiAgfVxuXG5cbiAgLy8gIyMjIG1hcCBkb2NzIGZyb20gZmluZEFsbFxuXG4gIC8vXG4gIGZ1bmN0aW9uIG1hcERvY3NGcm9tRmluZEFsbChyZXNwb25zZSkge1xuICAgIHJldHVybiByZXNwb25zZS5yb3dzLm1hcChmdW5jdGlvbihyb3cpIHtcbiAgICAgIHJldHVybiByb3cuZG9jO1xuICAgIH0pO1xuICB9XG5cblxuICAvLyAjIyMgcHVsbCB1cmxcblxuICAvLyBEZXBlbmRpbmcgb24gd2hldGhlciByZW1vdGUgaXMgY29ubmVjdGVkICg9IHB1bGxpbmcgY2hhbmdlcyBjb250aW51b3VzbHkpXG4gIC8vIHJldHVybiBhIGxvbmdwb2xsIFVSTCBvciBub3QuIElmIGl0IGlzIGEgYmVnaW5uaW5nIGJvb3RzdHJhcCByZXF1ZXN0LCBkb1xuICAvLyBub3QgcmV0dXJuIGEgbG9uZ3BvbGwgVVJMLCBhcyB3ZSB3YW50IGl0IHRvIGZpbmlzaCByaWdodCBhd2F5LCBldmVuIGlmIHRoZXJlXG4gIC8vIGFyZSBubyBjaGFuZ2VzIG9uIHJlbW90ZS5cbiAgLy9cbiAgZnVuY3Rpb24gcHVsbFVybCgpIHtcbiAgICB2YXIgc2luY2U7XG4gICAgc2luY2UgPSByZW1vdGUuZ2V0U2luY2VOcigpO1xuICAgIGlmIChyZW1vdGUuaXNDb25uZWN0ZWQoKSAmJiAhaXNCb290c3RyYXBwaW5nKSB7XG4gICAgICByZXR1cm4gJy9fY2hhbmdlcz9pbmNsdWRlX2RvY3M9dHJ1ZSZzaW5jZT0nICsgc2luY2UgKyAnJmhlYXJ0YmVhdD0xMDAwMCZmZWVkPWxvbmdwb2xsJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcvX2NoYW5nZXM/aW5jbHVkZV9kb2NzPXRydWUmc2luY2U9JyArIHNpbmNlO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gIyMjIHJlc3RhcnQgcHVsbCByZXF1ZXN0XG5cbiAgLy8gcmVxdWVzdCBnZXRzIHJlc3RhcnRlZCBhdXRvbWF0aWNjYWxseVxuICAvLyB3aGVuIGFib3J0ZWQgKHNlZSBoYW5kbGVQdWxsRXJyb3IpXG4gIGZ1bmN0aW9uIHJlc3RhcnRQdWxsUmVxdWVzdCgpIHtcbiAgICBpZiAocHVsbFJlcXVlc3QpIHtcbiAgICAgIHB1bGxSZXF1ZXN0LmFib3J0KCk7XG4gICAgfVxuICB9XG5cblxuICAvLyAjIyMgcHVsbCBzdWNjZXNzIGhhbmRsZXJcblxuICAvLyByZXF1ZXN0IGdldHMgcmVzdGFydGVkIGF1dG9tYXRpY2NhbGx5XG4gIC8vIHdoZW4gYWJvcnRlZCAoc2VlIGhhbmRsZVB1bGxFcnJvcilcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlUHVsbFN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICBzZXRTaW5jZU5yKHJlc3BvbnNlLmxhc3Rfc2VxKTtcbiAgICBoYW5kbGVQdWxsUmVzdWx0cyhyZXNwb25zZS5yZXN1bHRzKTtcbiAgICBpZiAocmVtb3RlLmlzQ29ubmVjdGVkKCkpIHtcbiAgICAgIHJldHVybiByZW1vdGUucHVsbCgpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gIyMjIHB1bGwgZXJyb3IgaGFuZGxlclxuXG4gIC8vIHdoZW4gdGhlcmUgaXMgYSBjaGFuZ2UsIHRyaWdnZXIgZXZlbnQsXG4gIC8vIHRoZW4gY2hlY2sgZm9yIGFub3RoZXIgY2hhbmdlXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZVB1bGxFcnJvcih4aHIsIGVycm9yKSB7XG4gICAgaWYgKCFyZW1vdGUuaXNDb25uZWN0ZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN3aXRjaCAoeGhyLnN0YXR1cykge1xuICAgICAgLy8gU2Vzc2lvbiBpcyBpbnZhbGlkLiBVc2VyIGlzIHN0aWxsIGxvZ2luLCBidXQgbmVlZHMgdG8gcmVhdXRoZW50aWNhdGVcbiAgICAgIC8vIGJlZm9yZSBzeW5jIGNhbiBiZSBjb250aW51ZWRcbiAgICBjYXNlIDQwMTpcbiAgICAgIHJlbW90ZS50cmlnZ2VyKCdlcnJvcjp1bmF1dGhlbnRpY2F0ZWQnLCBlcnJvcik7XG4gICAgICByZXR1cm4gcmVtb3RlLmRpc2Nvbm5lY3QoKTtcblxuICAgICAvLyB0aGUgNDA0IGNvbWVzLCB3aGVuIHRoZSByZXF1ZXN0ZWQgREIgaGFzIGJlZW4gcmVtb3ZlZFxuICAgICAvLyBvciBkb2VzIG5vdCBleGlzdCB5ZXQuXG4gICAgIC8vXG4gICAgIC8vIEJVVDogaXQgbWlnaHQgYWxzbyBoYXBwZW4gdGhhdCB0aGUgYmFja2dyb3VuZCB3b3JrZXJzIGRpZFxuICAgICAvLyAgICAgIG5vdCBjcmVhdGUgYSBwZW5kaW5nIGRhdGFiYXNlIHlldC4gVGhlcmVmb3JlLFxuICAgICAvLyAgICAgIHdlIHRyeSBpdCBhZ2FpbiBpbiAzIHNlY29uZHNcbiAgICAgLy9cbiAgICAgLy8gVE9ETzogcmV2aWV3IC8gcmV0aGluayB0aGF0LlxuICAgICAvL1xuXG4gICAgY2FzZSA0MDQ6XG4gICAgICByZXR1cm4gd2luZG93LnNldFRpbWVvdXQocmVtb3RlLnB1bGwsIDMwMDApO1xuXG4gICAgY2FzZSA1MDA6XG4gICAgICAvL1xuICAgICAgLy8gUGxlYXNlIHNlcnZlciwgZG9uJ3QgZ2l2ZSB1cyB0aGVzZS4gQXQgbGVhc3Qgbm90IHBlcnNpc3RlbnRseVxuICAgICAgLy9cbiAgICAgIHJlbW90ZS50cmlnZ2VyKCdlcnJvcjpzZXJ2ZXInLCBlcnJvcik7XG4gICAgICB3aW5kb3cuc2V0VGltZW91dChyZW1vdGUucHVsbCwgMzAwMCk7XG4gICAgICByZXR1cm4gaG9vZGllLmNoZWNrQ29ubmVjdGlvbigpO1xuICAgIGRlZmF1bHQ6XG4gICAgICAvLyB1c3VhbGx5IGEgMCwgd2hpY2ggc3RhbmRzIGZvciB0aW1lb3V0IG9yIHNlcnZlciBub3QgcmVhY2hhYmxlLlxuICAgICAgaWYgKHhoci5zdGF0dXNUZXh0ID09PSAnYWJvcnQnKSB7XG4gICAgICAgIC8vIG1hbnVhbCBhYm9ydCBhZnRlciAyNXNlYy4gcmVzdGFydCBwdWxsaW5nIGNoYW5nZXMgZGlyZWN0bHkgd2hlbiBjb25uZWN0ZWRcbiAgICAgICAgcmV0dXJuIHJlbW90ZS5wdWxsKCk7XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIG9vcHMuIFRoaXMgbWlnaHQgYmUgY2F1c2VkIGJ5IGFuIHVucmVhY2hhYmxlIHNlcnZlci5cbiAgICAgICAgLy8gT3IgdGhlIHNlcnZlciBjYW5jZWxsZWQgaXQgZm9yIHdoYXQgZXZlciByZWFzb24sIGUuZy5cbiAgICAgICAgLy8gaGVyb2t1IGtpbGxzIHRoZSByZXF1ZXN0IGFmdGVyIH4zMHMuXG4gICAgICAgIC8vIHdlJ2xsIHRyeSBhZ2FpbiBhZnRlciBhIDNzIHRpbWVvdXRcbiAgICAgICAgLy9cbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQocmVtb3RlLnB1bGwsIDMwMDApO1xuICAgICAgICByZXR1cm4gaG9vZGllLmNoZWNrQ29ubmVjdGlvbigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgLy8gIyMjIGhhbmRsZSBjaGFuZ2VzIGZyb20gcmVtb3RlXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZUJvb3RzdHJhcFN1Y2Nlc3MoKSB7XG4gICAgaXNCb290c3RyYXBwaW5nID0gZmFsc2U7XG4gICAgcmVtb3RlLnRyaWdnZXIoJ2Jvb3RzdHJhcDplbmQnKTtcbiAgfVxuXG4gIC8vICMjIyBoYW5kbGUgY2hhbmdlcyBmcm9tIHJlbW90ZVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVQdWxsUmVzdWx0cyhjaGFuZ2VzKSB7XG4gICAgdmFyIGRvYywgZXZlbnQsIG9iamVjdCwgX2ksIF9sZW47XG5cbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGNoYW5nZXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGRvYyA9IGNoYW5nZXNbX2ldLmRvYztcblxuICAgICAgaWYgKHJlbW90ZS5wcmVmaXggJiYgZG9jLl9pZC5pbmRleE9mKHJlbW90ZS5wcmVmaXgpICE9PSAwKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBvYmplY3QgPSBwYXJzZUZyb21SZW1vdGUoZG9jKTtcblxuICAgICAgaWYgKG9iamVjdC5fZGVsZXRlZCkge1xuICAgICAgICBpZiAoIXJlbW90ZS5pc0tub3duT2JqZWN0KG9iamVjdCkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBldmVudCA9ICdyZW1vdmUnO1xuICAgICAgICByZW1vdGUuaXNLbm93bk9iamVjdChvYmplY3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHJlbW90ZS5pc0tub3duT2JqZWN0KG9iamVjdCkpIHtcbiAgICAgICAgICBldmVudCA9ICd1cGRhdGUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV2ZW50ID0gJ2FkZCc7XG4gICAgICAgICAgcmVtb3RlLm1hcmtBc0tub3duT2JqZWN0KG9iamVjdCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmVtb3RlLnRyaWdnZXIoZXZlbnQsIG9iamVjdCk7XG4gICAgICByZW1vdGUudHJpZ2dlcihldmVudCArICc6JyArIG9iamVjdC50eXBlLCBvYmplY3QpO1xuICAgICAgcmVtb3RlLnRyaWdnZXIoZXZlbnQgKyAnOicgKyBvYmplY3QudHlwZSArICc6JyArIG9iamVjdC5pZCwgb2JqZWN0KTtcbiAgICAgIHJlbW90ZS50cmlnZ2VyKCdjaGFuZ2UnLCBldmVudCwgb2JqZWN0KTtcbiAgICAgIHJlbW90ZS50cmlnZ2VyKCdjaGFuZ2U6JyArIG9iamVjdC50eXBlLCBldmVudCwgb2JqZWN0KTtcbiAgICAgIHJlbW90ZS50cmlnZ2VyKCdjaGFuZ2U6JyArIG9iamVjdC50eXBlICsgJzonICsgb2JqZWN0LmlkLCBldmVudCwgb2JqZWN0KTtcbiAgICB9XG4gIH1cblxuXG4gIC8vIGJvb3RzdHJhcCBrbm93biBvYmplY3RzXG4gIC8vXG4gIGlmIChvcHRpb25zLmtub3duT2JqZWN0cykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5rbm93bk9iamVjdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlbW90ZS5tYXJrQXNLbm93bk9iamVjdCh7XG4gICAgICAgIHR5cGU6IG9wdGlvbnMua25vd25PYmplY3RzW2ldLnR5cGUsXG4gICAgICAgIGlkOiBvcHRpb25zLmtub3duT2JqZWN0c1tpXS5pZFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cblxuICAvLyBleHBvc2UgcHVibGljIEFQSVxuICByZXR1cm4gcmVtb3RlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVJlbW90ZVN0b3JlO1xuIiwiLy9cbi8vIGhvb2RpZS5yZXF1ZXN0XG4vLyA9PT09PT09PT09PT09PT09XG5cbi8vIEhvb2RpZSdzIGNlbnRyYWwgcGxhY2UgdG8gc2VuZCByZXF1ZXN0IHRvIGl0cyBiYWNrZW5kLlxuLy8gQXQgdGhlIG1vbWVudCwgaXQncyBhIHdyYXBwZXIgYXJvdW5kIGpRdWVyeSdzIGFqYXggbWV0aG9kLFxuLy8gYnV0IHdlIG1pZ2h0IGdldCByaWQgb2YgdGhpcyBkZXBlbmRlbmN5IGluIHRoZSBmdXR1cmUuXG4vL1xuLy8gSXQgaGFzIGJ1aWxkIGluIHN1cHBvcnQgZm9yIENPUlMgYW5kIGEgc3RhbmRhcmQgZXJyb3Jcbi8vIGhhbmRsaW5nIHRoYXQgbm9ybWFsaXplcyBlcnJvcnMgcmV0dXJuZWQgYnkgQ291Y2hEQlxuLy8gdG8gSmF2YVNjcmlwdCdzIG5hdGl2IGNvbnZlbnRpb25zIG9mIGVycm9ycyBoYXZpbmdcbi8vIGEgbmFtZSAmIGEgbWVzc2FnZSBwcm9wZXJ0eS5cbi8vXG4vLyBDb21tb24gZXJyb3JzIHRvIGV4cGVjdDpcbi8vXG4vLyAqIEhvb2RpZVJlcXVlc3RFcnJvclxuLy8gKiBIb29kaWVVbmF1dGhvcml6ZWRFcnJvclxuLy8gKiBIb29kaWVDb25mbGljdEVycm9yXG4vLyAqIEhvb2RpZVNlcnZlckVycm9yXG4vL1xuZnVuY3Rpb24gaG9vZGllUmVxdWVzdChob29kaWUpIHtcbiAgdmFyICRleHRlbmQgPSAkLmV4dGVuZDtcbiAgdmFyICRhamF4ID0gJC5hamF4O1xuXG4gIC8vIEhvb2RpZSBiYWNrZW5kIGxpc3RlbnRzIHRvIHJlcXVlc3RzIHByZWZpeGVkIGJ5IC9fYXBpLFxuICAvLyBzbyB3ZSBwcmVmaXggYWxsIHJlcXVlc3RzIHdpdGggcmVsYXRpdmUgVVJMc1xuICB2YXIgQVBJX1BBVEggPSAnL19hcGknO1xuXG4gIC8vIFJlcXVlc3RzXG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyBzZW5kcyByZXF1ZXN0cyB0byB0aGUgaG9vZGllIGJhY2tlbmQuXG4gIC8vXG4gIC8vICAgICBwcm9taXNlID0gaG9vZGllLnJlcXVlc3QoJ0dFVCcsICcvdXNlcl9kYXRhYmFzZS9kb2NfaWQnKVxuICAvL1xuICBmdW5jdGlvbiByZXF1ZXN0KHR5cGUsIHVybCwgb3B0aW9ucykge1xuICAgIHZhciBkZWZhdWx0cywgcmVxdWVzdFByb21pc2UsIHBpcGVkUHJvbWlzZTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgZGVmYXVsdHMgPSB7XG4gICAgICB0eXBlOiB0eXBlLFxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIH07XG5cbiAgICAvLyBpZiBhYnNvbHV0ZSBwYXRoIHBhc3NlZCwgc2V0IENPUlMgaGVhZGVyc1xuXG4gICAgLy8gaWYgcmVsYXRpdmUgcGF0aCBwYXNzZWQsIHByZWZpeCB3aXRoIGJhc2VVcmxcbiAgICBpZiAoIS9eaHR0cC8udGVzdCh1cmwpKSB7XG4gICAgICB1cmwgPSAoaG9vZGllLmJhc2VVcmwgfHwgJycpICsgQVBJX1BBVEggKyB1cmw7XG4gICAgfVxuXG4gICAgLy8gaWYgdXJsIGlzIGNyb3NzIGRvbWFpbiwgc2V0IENPUlMgaGVhZGVyc1xuICAgIGlmICgvXmh0dHAvLnRlc3QodXJsKSkge1xuICAgICAgZGVmYXVsdHMueGhyRmllbGRzID0ge1xuICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWVcbiAgICAgIH07XG4gICAgICBkZWZhdWx0cy5jcm9zc0RvbWFpbiA9IHRydWU7XG4gICAgfVxuXG4gICAgZGVmYXVsdHMudXJsID0gdXJsO1xuXG5cbiAgICAvLyB3ZSBhcmUgcGlwaW5nIHRoZSByZXN1bHQgb2YgdGhlIHJlcXVlc3QgdG8gcmV0dXJuIGEgbmljZXJcbiAgICAvLyBlcnJvciBpZiB0aGUgcmVxdWVzdCBjYW5ub3QgcmVhY2ggdGhlIHNlcnZlciBhdCBhbGwuXG4gICAgLy8gV2UgY2FuJ3QgcmV0dXJuIHRoZSBwcm9taXNlIG9mIGFqYXggZGlyZWN0bHkgYmVjYXVzZSBvZlxuICAgIC8vIHRoZSBwaXBpbmcsIGFzIGZvciB3aGF0ZXZlciByZWFzb24gdGhlIHJldHVybmVkIHByb21pc2VcbiAgICAvLyBkb2VzIG5vdCBoYXZlIHRoZSBgYWJvcnRgIG1ldGhvZCBhbnkgbW9yZSwgbWF5YmUgb3RoZXJzXG4gICAgLy8gYXMgd2VsbC4gU2VlIGFsc28gaHR0cDovL2J1Z3MuanF1ZXJ5LmNvbS90aWNrZXQvMTQxMDRcbiAgICByZXF1ZXN0UHJvbWlzZSA9ICRhamF4KCRleHRlbmQoZGVmYXVsdHMsIG9wdGlvbnMpKTtcbiAgICBwaXBlZFByb21pc2UgPSByZXF1ZXN0UHJvbWlzZS50aGVuKCBudWxsLCBoYW5kbGVSZXF1ZXN0RXJyb3IpO1xuICAgIHBpcGVkUHJvbWlzZS5hYm9ydCA9IHJlcXVlc3RQcm9taXNlLmFib3J0O1xuXG4gICAgcmV0dXJuIHBpcGVkUHJvbWlzZTtcbiAgfVxuXG4gIC8vXG4gIC8vXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZVJlcXVlc3RFcnJvcih4aHIpIHtcbiAgICB2YXIgZXJyb3I7XG5cbiAgICB0cnkge1xuICAgICAgZXJyb3IgPSBwYXJzZUVycm9yRnJvbVJlc3BvbnNlKHhocik7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG5cbiAgICAgIGlmICh4aHIucmVzcG9uc2VUZXh0KSB7XG4gICAgICAgIGVycm9yID0geGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVycm9yID0ge1xuICAgICAgICAgIG5hbWU6ICdIb29kaWVDb25uZWN0aW9uRXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6ICdDb3VsZCBub3QgY29ubmVjdCB0byBIb29kaWUgc2VydmVyIGF0IHt7dXJsfX0uJyxcbiAgICAgICAgICB1cmw6IGhvb2RpZS5iYXNlVXJsIHx8ICcvJ1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aChlcnJvcikucHJvbWlzZSgpO1xuICB9XG5cbiAgLy9cbiAgLy8gQ291Y2hEQiByZXR1cm5zIGVycm9ycyBpbiBKU09OIGZvcm1hdCwgd2l0aCB0aGUgcHJvcGVydGllc1xuICAvLyBgZXJyb3JgIGFuZCBgcmVhc29uYC4gSG9vZGllIHVzZXMgSmF2YVNjcmlwdCdzIG5hdGl2ZSBFcnJvclxuICAvLyBwcm9wZXJ0aWVzIGBuYW1lYCBhbmQgYG1lc3NhZ2VgIGluc3RlYWQsIHNvIHdlIGFyZSBub3JtYWxpemluZ1xuICAvLyB0aGF0LlxuICAvL1xuICAvLyBCZXNpZGVzIHRoZSByZW5hbWluZyB3ZSBhbHNvIGRvIGEgbWF0Y2hpbmcgd2l0aCBhIG1hcCBvZiBrbm93blxuICAvLyBlcnJvcnMgdG8gbWFrZSB0aGVtIG1vcmUgY2xlYXIuIEZvciByZWZlcmVuY2UsIHNlZVxuICAvLyBodHRwczovL3dpa2kuYXBhY2hlLm9yZy9jb3VjaGRiL0RlZmF1bHRfaHR0cF9lcnJvcnMgJlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYXBhY2hlL2NvdWNoZGIvYmxvYi9tYXN0ZXIvc3JjL2NvdWNoZGIvY291Y2hfaHR0cGQuZXJsI0w4MDdcbiAgLy9cblxuICBmdW5jdGlvbiBwYXJzZUVycm9yRnJvbVJlc3BvbnNlKHhocikge1xuICAgIHZhciBlcnJvciA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG5cbiAgICAvLyBnZXQgZXJyb3IgbmFtZVxuICAgIGVycm9yLm5hbWUgPSBIVFRQX1NUQVRVU19FUlJPUl9NQVBbeGhyLnN0YXR1c107XG4gICAgaWYgKCEgZXJyb3IubmFtZSkge1xuICAgICAgZXJyb3IubmFtZSA9IGhvb2RpZWZ5UmVxdWVzdEVycm9yTmFtZShlcnJvci5lcnJvcik7XG4gICAgfVxuXG4gICAgLy8gc3RvcmUgc3RhdHVzICYgbWVzc2FnZVxuICAgIGVycm9yLnN0YXR1cyA9IHhoci5zdGF0dXM7XG4gICAgZXJyb3IubWVzc2FnZSA9IGVycm9yLnJlYXNvbiB8fCAnJztcbiAgICBlcnJvci5tZXNzYWdlID0gZXJyb3IubWVzc2FnZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGVycm9yLm1lc3NhZ2Uuc2xpY2UoMSk7XG5cbiAgICAvLyBjbGVhbnVwXG4gICAgZGVsZXRlIGVycm9yLmVycm9yO1xuICAgIGRlbGV0ZSBlcnJvci5yZWFzb247XG5cbiAgICByZXR1cm4gZXJyb3I7XG4gIH1cblxuICAvLyBtYXAgQ291Y2hEQiBIVFRQIHN0YXR1cyBjb2RlcyB0byBIb29kaWUgRXJyb3JzXG4gIHZhciBIVFRQX1NUQVRVU19FUlJPUl9NQVAgPSB7XG4gICAgNDAwOiAnSG9vZGllUmVxdWVzdEVycm9yJywgLy8gYmFkIHJlcXVlc3RcbiAgICA0MDE6ICdIb29kaWVVbmF1dGhvcml6ZWRFcnJvcicsXG4gICAgNDAzOiAnSG9vZGllUmVxdWVzdEVycm9yJywgLy8gZm9yYmlkZGVuXG4gICAgNDA0OiAnSG9vZGllTm90Rm91bmRFcnJvcicsIC8vIGZvcmJpZGRlblxuICAgIDQwOTogJ0hvb2RpZUNvbmZsaWN0RXJyb3InLFxuICAgIDQxMjogJ0hvb2RpZUNvbmZsaWN0RXJyb3InLCAvLyBmaWxlIGV4aXN0XG4gICAgNTAwOiAnSG9vZGllU2VydmVyRXJyb3InXG4gIH07XG5cblxuICBmdW5jdGlvbiBob29kaWVmeVJlcXVlc3RFcnJvck5hbWUobmFtZSkge1xuICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLyheXFx3fF9cXHcpL2csIGZ1bmN0aW9uIChtYXRjaCkge1xuICAgICAgcmV0dXJuIChtYXRjaFsxXSB8fCBtYXRjaFswXSkudG9VcHBlckNhc2UoKTtcbiAgICB9KTtcbiAgICByZXR1cm4gJ0hvb2RpZScgKyBuYW1lICsgJ0Vycm9yJztcbiAgfVxuXG5cbiAgLy9cbiAgLy8gcHVibGljIEFQSVxuICAvL1xuICBob29kaWUucmVxdWVzdCA9IHJlcXVlc3Q7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllUmVxdWVzdDtcbiIsIi8vIHNjb3BlZCBTdG9yZVxuLy8gPT09PT09PT09PT09XG5cbi8vIHNhbWUgYXMgc3RvcmUsIGJ1dCB3aXRoIHR5cGUgcHJlc2V0IHRvIGFuIGluaXRpYWxseVxuLy8gcGFzc2VkIHZhbHVlLlxuLy9cbnZhciBob29kaWVFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllU2NvcGVkVGFzayhob29kaWUsIHRhc2tBcGksIG9wdGlvbnMpIHtcblxuICB2YXIgdHlwZSA9IG9wdGlvbnMudHlwZTtcbiAgdmFyIGlkID0gb3B0aW9ucy5pZDtcblxuICB2YXIgYXBpID0ge307XG5cbiAgLy8gc2NvcGVkIGJ5IHR5cGUgb25seVxuICBpZiAoIWlkKSB7XG5cbiAgICAvLyBhZGQgZXZlbnRzXG4gICAgaG9vZGllRXZlbnRzKGhvb2RpZSwge1xuICAgICAgY29udGV4dDogYXBpLFxuICAgICAgbmFtZXNwYWNlOiAndGFzazonICsgdHlwZVxuICAgIH0pO1xuXG4gICAgLy9cbiAgICBhcGkuc3RhcnQgPSBmdW5jdGlvbiBzdGFydChwcm9wZXJ0aWVzKSB7XG4gICAgICByZXR1cm4gdGFza0FwaS5zdGFydCh0eXBlLCBwcm9wZXJ0aWVzKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKGlkKSB7XG4gICAgICByZXR1cm4gdGFza0FwaS5jYW5jZWwodHlwZSwgaWQpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5yZXN0YXJ0ID0gZnVuY3Rpb24gcmVzdGFydChpZCwgdXBkYXRlKSB7XG4gICAgICByZXR1cm4gdGFza0FwaS5yZXN0YXJ0KHR5cGUsIGlkLCB1cGRhdGUpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5jYW5jZWxBbGwgPSBmdW5jdGlvbiBjYW5jZWxBbGwoKSB7XG4gICAgICByZXR1cm4gdGFza0FwaS5jYW5jZWxBbGwodHlwZSk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnJlc3RhcnRBbGwgPSBmdW5jdGlvbiByZXN0YXJ0QWxsKHVwZGF0ZSkge1xuICAgICAgcmV0dXJuIHRhc2tBcGkucmVzdGFydEFsbCh0eXBlLCB1cGRhdGUpO1xuICAgIH07XG4gIH1cblxuICAvLyBzY29wZWQgYnkgYm90aDogdHlwZSAmIGlkXG4gIGlmIChpZCkge1xuXG4gICAgLy8gYWRkIGV2ZW50c1xuICAgIGhvb2RpZUV2ZW50cyhob29kaWUsIHtcbiAgICAgIGNvbnRleHQ6IGFwaSxcbiAgICAgIG5hbWVzcGFjZTogJ3Rhc2s6JyArIHR5cGUgKyAnOicgKyBpZFxuICAgIH0pO1xuXG4gICAgLy9cbiAgICBhcGkuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xuICAgICAgcmV0dXJuIHRhc2tBcGkuY2FuY2VsKHR5cGUsIGlkKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkucmVzdGFydCA9IGZ1bmN0aW9uIHJlc3RhcnQodXBkYXRlKSB7XG4gICAgICByZXR1cm4gdGFza0FwaS5yZXN0YXJ0KHR5cGUsIGlkLCB1cGRhdGUpO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gYXBpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVNjb3BlZFRhc2s7XG4iLCIvLyBTdG9yZVxuLy8gPT09PT09PT09PT09XG5cbi8vIFRoaXMgY2xhc3MgZGVmaW5lcyB0aGUgQVBJIHRoYXQgaG9vZGllLnN0b3JlIChsb2NhbCBzdG9yZSkgYW5kIGhvb2RpZS5vcGVuXG4vLyAocmVtb3RlIHN0b3JlKSBpbXBsZW1lbnQgdG8gYXNzdXJlIGEgY29oZXJlbnQgQVBJLiBJdCBhbHNvIGltcGxlbWVudHMgc29tZVxuLy8gYmFzaWMgdmFsaWRhdGlvbnMuXG4vL1xuLy8gVGhlIHJldHVybmVkIEFQSSBwcm92aWRlcyB0aGUgZm9sbG93aW5nIG1ldGhvZHM6XG4vL1xuLy8gKiB2YWxpZGF0ZVxuLy8gKiBzYXZlXG4vLyAqIGFkZFxuLy8gKiBmaW5kXG4vLyAqIGZpbmRPckFkZFxuLy8gKiBmaW5kQWxsXG4vLyAqIHVwZGF0ZVxuLy8gKiB1cGRhdGVBbGxcbi8vICogcmVtb3ZlXG4vLyAqIHJlbW92ZUFsbFxuLy8gKiBkZWNvcmF0ZVByb21pc2VzXG4vLyAqIHRyaWdnZXJcbi8vICogb25cbi8vICogdW5iaW5kXG4vL1xuLy8gQXQgdGhlIHNhbWUgdGltZSwgdGhlIHJldHVybmVkIEFQSSBjYW4gYmUgY2FsbGVkIGFzIGZ1bmN0aW9uIHJldHVybmluZyBhXG4vLyBzdG9yZSBzY29wZWQgYnkgdGhlIHBhc3NlZCB0eXBlLCBmb3IgZXhhbXBsZVxuLy9cbi8vICAgICB2YXIgdGFza1N0b3JlID0gaG9vZGllLnN0b3JlKCd0YXNrJyk7XG4vLyAgICAgdGFza1N0b3JlLmZpbmRBbGwoKS50aGVuKCBzaG93QWxsVGFza3MgKTtcbi8vICAgICB0YXNrU3RvcmUudXBkYXRlKCdpZDEyMycsIHtkb25lOiB0cnVlfSk7XG4vL1xudmFyIGhvb2RpZVNjb3BlZFN0b3JlQXBpID0gcmVxdWlyZSgnLi9zdG9yZScpO1xudmFyIGhvb2RpZUV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgSG9vZGllRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yJyk7XG52YXIgSG9vZGllT2JqZWN0VHlwZUVycm9yID0gcmVxdWlyZSgnLi9lcnJvci9vYmplY3RfdHlwZScpO1xudmFyIEhvb2RpZU9iamVjdElkRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yL29iamVjdF9pZCcpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllU3RvcmVBcGkoaG9vZGllLCBvcHRpb25zKSB7XG5cbiAgLy8gcGVyc2lzdGFuY2UgbG9naWNcbiAgdmFyIGJhY2tlbmQgPSB7fTtcblxuICAvLyBleHRlbmQgdGhpcyBwcm9wZXJ0eSB3aXRoIGV4dHJhIGZ1bmN0aW9ucyB0aGF0IHdpbGwgYmUgYXZhaWxhYmxlXG4gIC8vIG9uIGFsbCBwcm9taXNlcyByZXR1cm5lZCBieSBob29kaWUuc3RvcmUgQVBJLiBJdCBoYXMgYSByZWZlcmVuY2VcbiAgLy8gdG8gY3VycmVudCBob29kaWUgaW5zdGFuY2UgYnkgZGVmYXVsdFxuICB2YXIgcHJvbWlzZUFwaSA9IHtcbiAgICBob29kaWU6IGhvb2RpZVxuICB9O1xuXG4gIC8vIG5hbWVcbiAgdmFyIHN0b3JlTmFtZSA9IG9wdGlvbnMubmFtZSB8fCAnc3RvcmUnO1xuXG4gIC8vIHB1YmxpYyBBUElcbiAgdmFyIGFwaSA9IGZ1bmN0aW9uIGFwaSh0eXBlLCBpZCkge1xuICAgIHZhciBzY29wZWRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge3R5cGU6IHR5cGUsIGlkOiBpZH0sIG9wdGlvbnMpO1xuICAgIHJldHVybiBob29kaWVTY29wZWRTdG9yZUFwaShob29kaWUsIGFwaSwgc2NvcGVkT3B0aW9ucyk7XG4gIH07XG5cbiAgLy8gYWRkIGV2ZW50IEFQSVxuICBob29kaWVFdmVudHMoaG9vZGllLCB7IGNvbnRleHQ6IGFwaSwgbmFtZXNwYWNlOiBzdG9yZU5hbWUgfSk7XG5cblxuICAvLyBWYWxpZGF0ZVxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGJ5IGRlZmF1bHQsIHdlIG9ubHkgY2hlY2sgZm9yIGEgdmFsaWQgdHlwZSAmIGlkLlxuICAvLyB0aGUgdmFsaWRhdGUgbWV0aG9kIGNhbiBiZSBvdmVyd3JpdGVuIGJ5IHBhc3NpbmdcbiAgLy8gb3B0aW9ucy52YWxpZGF0ZVxuICAvL1xuICAvLyBpZiBgdmFsaWRhdGVgIHJldHVybnMgbm90aGluZywgdGhlIHBhc3NlZCBvYmplY3QgaXNcbiAgLy8gdmFsaWQuIE90aGVyd2lzZSBpdCByZXR1cm5zIGFuIGVycm9yXG4gIC8vXG4gIGFwaS52YWxpZGF0ZSA9IG9wdGlvbnMudmFsaWRhdGU7XG5cbiAgaWYgKCFvcHRpb25zLnZhbGlkYXRlKSB7XG4gICAgYXBpLnZhbGlkYXRlID0gZnVuY3Rpb24ob2JqZWN0IC8qLCBvcHRpb25zICovKSB7XG5cbiAgICAgIGlmICghb2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBuZXcgSG9vZGllRXJyb3Ioe1xuICAgICAgICAgIG5hbWU6ICdJbnZhbGlkT2JqZWN0RXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6ICdObyBvYmplY3QgcGFzc2VkLidcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAoSG9vZGllT2JqZWN0VHlwZUVycm9yLmlzSW52YWxpZChvYmplY3QudHlwZSwgdmFsaWRJZE9yVHlwZVBhdHRlcm4pKSB7XG4gICAgICAgIHJldHVybiBuZXcgSG9vZGllT2JqZWN0VHlwZUVycm9yKHtcbiAgICAgICAgICB0eXBlOiBvYmplY3QudHlwZSxcbiAgICAgICAgICBydWxlczogdmFsaWRJZE9yVHlwZVJ1bGVzXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9iamVjdC5pZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChIb29kaWVPYmplY3RJZEVycm9yLmlzSW52YWxpZChvYmplY3QuaWQsIHZhbGlkSWRPclR5cGVQYXR0ZXJuKSkge1xuICAgICAgICByZXR1cm4gbmV3IEhvb2RpZU9iamVjdElkRXJyb3Ioe1xuICAgICAgICAgIGlkOiBvYmplY3QuaWQsXG4gICAgICAgICAgcnVsZXM6IHZhbGlkSWRPclR5cGVSdWxlc1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gU2F2ZVxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGNyZWF0ZXMgb3IgcmVwbGFjZXMgYW4gYW4gZXZlbnR1YWxseSBleGlzdGluZyBvYmplY3QgaW4gdGhlIHN0b3JlXG4gIC8vIHdpdGggc2FtZSB0eXBlICYgaWQuXG4gIC8vXG4gIC8vIFdoZW4gaWQgaXMgdW5kZWZpbmVkLCBpdCBnZXRzIGdlbmVyYXRlZCBhbmQgYSBuZXcgb2JqZWN0IGdldHMgc2F2ZWRcbiAgLy9cbiAgLy8gZXhhbXBsZSB1c2FnZTpcbiAgLy9cbiAgLy8gICAgIHN0b3JlLnNhdmUoJ2NhcicsIHVuZGVmaW5lZCwge2NvbG9yOiAncmVkJ30pXG4gIC8vICAgICBzdG9yZS5zYXZlKCdjYXInLCAnYWJjNDU2NycsIHtjb2xvcjogJ3JlZCd9KVxuICAvL1xuICBhcGkuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUodHlwZSwgaWQsIHByb3BlcnRpZXMsIG9wdGlvbnMpIHtcblxuICAgIGlmICggb3B0aW9ucyApIHtcbiAgICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICAvLyBkb24ndCBtZXNzIHdpdGggcGFzc2VkIG9iamVjdFxuICAgIHZhciBvYmplY3QgPSAkLmV4dGVuZCh0cnVlLCB7fSwgcHJvcGVydGllcywge3R5cGU6IHR5cGUsIGlkOiBpZH0pO1xuXG4gICAgLy8gdmFsaWRhdGlvbnNcbiAgICB2YXIgZXJyb3IgPSBhcGkudmFsaWRhdGUob2JqZWN0LCBvcHRpb25zIHx8IHt9KTtcbiAgICBpZihlcnJvcikgeyByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoZXJyb3IpOyB9XG5cbiAgICByZXR1cm4gZGVjb3JhdGVQcm9taXNlKCBiYWNrZW5kLnNhdmUob2JqZWN0LCBvcHRpb25zIHx8IHt9KSApO1xuICB9O1xuXG5cbiAgLy8gQWRkXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBgLmFkZGAgaXMgYW4gYWxpYXMgZm9yIGAuc2F2ZWAsIHdpdGggdGhlIGRpZmZlcmVuY2UgdGhhdCB0aGVyZSBpcyBubyBpZCBhcmd1bWVudC5cbiAgLy8gSW50ZXJuYWxseSBpdCBzaW1wbHkgY2FsbHMgYC5zYXZlKHR5cGUsIHVuZGVmaW5lZCwgb2JqZWN0KS5cbiAgLy9cbiAgYXBpLmFkZCA9IGZ1bmN0aW9uIGFkZCh0eXBlLCBwcm9wZXJ0aWVzLCBvcHRpb25zKSB7XG5cbiAgICBpZiAocHJvcGVydGllcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBwcm9wZXJ0aWVzID0ge307XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgcmV0dXJuIGFwaS5zYXZlKHR5cGUsIHByb3BlcnRpZXMuaWQsIHByb3BlcnRpZXMsIG9wdGlvbnMpO1xuICB9O1xuXG5cbiAgLy8gZmluZFxuICAvLyAtLS0tLS1cblxuICAvL1xuICBhcGkuZmluZCA9IGZ1bmN0aW9uIGZpbmQodHlwZSwgaWQpIHtcblxuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIGJhY2tlbmQuZmluZCh0eXBlLCBpZCkgKTtcbiAgfTtcblxuXG4gIC8vIGZpbmQgb3IgYWRkXG4gIC8vIC0tLS0tLS0tLS0tLS1cblxuICAvLyAxLiBUcnkgdG8gZmluZCBhIHNoYXJlIGJ5IGdpdmVuIGlkXG4gIC8vIDIuIElmIHNoYXJlIGNvdWxkIGJlIGZvdW5kLCByZXR1cm4gaXRcbiAgLy8gMy4gSWYgbm90LCBhZGQgb25lIGFuZCByZXR1cm4gaXQuXG4gIC8vXG4gIGFwaS5maW5kT3JBZGQgPSBmdW5jdGlvbiBmaW5kT3JBZGQodHlwZSwgaWQsIHByb3BlcnRpZXMpIHtcblxuICAgIGlmIChwcm9wZXJ0aWVzID09PSBudWxsKSB7XG4gICAgICBwcm9wZXJ0aWVzID0ge307XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlTm90Rm91bmQoKSB7XG4gICAgICB2YXIgbmV3UHJvcGVydGllcztcbiAgICAgIG5ld1Byb3BlcnRpZXMgPSAkLmV4dGVuZCh0cnVlLCB7XG4gICAgICAgIGlkOiBpZFxuICAgICAgfSwgcHJvcGVydGllcyk7XG4gICAgICByZXR1cm4gYXBpLmFkZCh0eXBlLCBuZXdQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICAvLyBwcm9taXNlIGRlY29yYXRpb25zIGdldCBsb3N0IHdoZW4gcGlwZWQgdGhyb3VnaCBgdGhlbmAsXG4gICAgLy8gdGhhdCdzIHdoeSB3ZSBuZWVkIHRvIGRlY29yYXRlIHRoZSBmaW5kJ3MgcHJvbWlzZSBhZ2Fpbi5cbiAgICB2YXIgcHJvbWlzZSA9IGFwaS5maW5kKHR5cGUsIGlkKS50aGVuKG51bGwsIGhhbmRsZU5vdEZvdW5kKTtcbiAgICByZXR1cm4gZGVjb3JhdGVQcm9taXNlKCBwcm9taXNlICk7XG4gIH07XG5cblxuICAvLyBmaW5kQWxsXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIHJldHVybnMgYWxsIG9iamVjdHMgZnJvbSBzdG9yZS5cbiAgLy8gQ2FuIGJlIG9wdGlvbmFsbHkgZmlsdGVyZWQgYnkgYSB0eXBlIG9yIGEgZnVuY3Rpb25cbiAgLy9cbiAgYXBpLmZpbmRBbGwgPSBmdW5jdGlvbiBmaW5kQWxsKHR5cGUsIG9wdGlvbnMpIHtcblxuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIGJhY2tlbmQuZmluZEFsbCh0eXBlLCBvcHRpb25zKSApO1xuICB9O1xuXG5cbiAgLy8gVXBkYXRlXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBJbiBjb250cmFzdCB0byBgLnNhdmVgLCB0aGUgYC51cGRhdGVgIG1ldGhvZCBkb2VzIG5vdCByZXBsYWNlIHRoZSBzdG9yZWQgb2JqZWN0LFxuICAvLyBidXQgb25seSBjaGFuZ2VzIHRoZSBwYXNzZWQgYXR0cmlidXRlcyBvZiBhbiBleHN0aW5nIG9iamVjdCwgaWYgaXQgZXhpc3RzXG4gIC8vXG4gIC8vIGJvdGggYSBoYXNoIG9mIGtleS92YWx1ZXMgb3IgYSBmdW5jdGlvbiB0aGF0IGFwcGxpZXMgdGhlIHVwZGF0ZSB0byB0aGUgcGFzc2VkXG4gIC8vIG9iamVjdCBjYW4gYmUgcGFzc2VkLlxuICAvL1xuICAvLyBleGFtcGxlIHVzYWdlXG4gIC8vXG4gIC8vIGhvb2RpZS5zdG9yZS51cGRhdGUoJ2NhcicsICdhYmM0NTY3Jywge3NvbGQ6IHRydWV9KVxuICAvLyBob29kaWUuc3RvcmUudXBkYXRlKCdjYXInLCAnYWJjNDU2NycsIGZ1bmN0aW9uKG9iaikgeyBvYmouc29sZCA9IHRydWUgfSlcbiAgLy9cbiAgYXBpLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSh0eXBlLCBpZCwgb2JqZWN0VXBkYXRlLCBvcHRpb25zKSB7XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVGb3VuZChjdXJyZW50T2JqZWN0KSB7XG4gICAgICB2YXIgY2hhbmdlZFByb3BlcnRpZXMsIG5ld09iaiwgdmFsdWU7XG5cbiAgICAgIC8vIG5vcm1hbGl6ZSBpbnB1dFxuICAgICAgbmV3T2JqID0gJC5leHRlbmQodHJ1ZSwge30sIGN1cnJlbnRPYmplY3QpO1xuXG4gICAgICBpZiAodHlwZW9mIG9iamVjdFVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvYmplY3RVcGRhdGUgPSBvYmplY3RVcGRhdGUobmV3T2JqKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFvYmplY3RVcGRhdGUpIHtcbiAgICAgICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlV2l0aChjdXJyZW50T2JqZWN0KTtcbiAgICAgIH1cblxuICAgICAgLy8gY2hlY2sgaWYgc29tZXRoaW5nIGNoYW5nZWRcbiAgICAgIGNoYW5nZWRQcm9wZXJ0aWVzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX3Jlc3VsdHMgPSBbXTtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0VXBkYXRlKSB7XG4gICAgICAgICAgaWYgKG9iamVjdFVwZGF0ZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG9iamVjdFVwZGF0ZVtrZXldO1xuICAgICAgICAgICAgaWYgKChjdXJyZW50T2JqZWN0W2tleV0gIT09IHZhbHVlKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB3b3JrYXJvdW5kIGZvciB1bmRlZmluZWQgdmFsdWVzLCBhcyAkLmV4dGVuZCBpZ25vcmVzIHRoZXNlXG4gICAgICAgICAgICBuZXdPYmpba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChrZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9KSgpO1xuXG4gICAgICBpZiAoIShjaGFuZ2VkUHJvcGVydGllcy5sZW5ndGggfHwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlV2l0aChuZXdPYmopO1xuICAgICAgfVxuXG4gICAgICAvL2FwcGx5IHVwZGF0ZVxuICAgICAgcmV0dXJuIGFwaS5zYXZlKHR5cGUsIGlkLCBuZXdPYmosIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIHByb21pc2UgZGVjb3JhdGlvbnMgZ2V0IGxvc3Qgd2hlbiBwaXBlZCB0aHJvdWdoIGB0aGVuYCxcbiAgICAvLyB0aGF0J3Mgd2h5IHdlIG5lZWQgdG8gZGVjb3JhdGUgdGhlIGZpbmQncyBwcm9taXNlIGFnYWluLlxuICAgIHZhciBwcm9taXNlID0gYXBpLmZpbmQodHlwZSwgaWQpLnRoZW4oaGFuZGxlRm91bmQpO1xuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIHByb21pc2UgKTtcbiAgfTtcblxuXG4gIC8vIHVwZGF0ZU9yQWRkXG4gIC8vIC0tLS0tLS0tLS0tLS1cblxuICAvLyBzYW1lIGFzIGAudXBkYXRlKClgLCBidXQgaW4gY2FzZSB0aGUgb2JqZWN0IGNhbm5vdCBiZSBmb3VuZCxcbiAgLy8gaXQgZ2V0cyBjcmVhdGVkXG4gIC8vXG4gIGFwaS51cGRhdGVPckFkZCA9IGZ1bmN0aW9uIHVwZGF0ZU9yQWRkKHR5cGUsIGlkLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcbiAgICBmdW5jdGlvbiBoYW5kbGVOb3RGb3VuZCgpIHtcbiAgICAgIHZhciBwcm9wZXJ0aWVzID0gJC5leHRlbmQodHJ1ZSwge30sIG9iamVjdFVwZGF0ZSwge2lkOiBpZH0pO1xuICAgICAgcmV0dXJuIGFwaS5hZGQodHlwZSwgcHJvcGVydGllcywgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgdmFyIHByb21pc2UgPSBhcGkudXBkYXRlKHR5cGUsIGlkLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpLnRoZW4obnVsbCwgaGFuZGxlTm90Rm91bmQpO1xuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIHByb21pc2UgKTtcbiAgfTtcblxuXG4gIC8vIHVwZGF0ZUFsbFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHVwZGF0ZSBhbGwgb2JqZWN0cyBpbiB0aGUgc3RvcmUsIGNhbiBiZSBvcHRpb25hbGx5IGZpbHRlcmVkIGJ5IGEgZnVuY3Rpb25cbiAgLy8gQXMgYW4gYWx0ZXJuYXRpdmUsIGFuIGFycmF5IG9mIG9iamVjdHMgY2FuIGJlIHBhc3NlZFxuICAvL1xuICAvLyBleGFtcGxlIHVzYWdlXG4gIC8vXG4gIC8vIGhvb2RpZS5zdG9yZS51cGRhdGVBbGwoKVxuICAvL1xuICBhcGkudXBkYXRlQWxsID0gZnVuY3Rpb24gdXBkYXRlQWxsKGZpbHRlck9yT2JqZWN0cywgb2JqZWN0VXBkYXRlLCBvcHRpb25zKSB7XG4gICAgdmFyIHByb21pc2U7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIG5vcm1hbGl6ZSB0aGUgaW5wdXQ6IG1ha2Ugc3VyZSB3ZSBoYXZlIGFsbCBvYmplY3RzXG4gICAgc3dpdGNoICh0cnVlKSB7XG4gICAgY2FzZSB0eXBlb2YgZmlsdGVyT3JPYmplY3RzID09PSAnc3RyaW5nJzpcbiAgICAgIHByb21pc2UgPSBhcGkuZmluZEFsbChmaWx0ZXJPck9iamVjdHMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBob29kaWUuaXNQcm9taXNlKGZpbHRlck9yT2JqZWN0cyk6XG4gICAgICBwcm9taXNlID0gZmlsdGVyT3JPYmplY3RzO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAkLmlzQXJyYXkoZmlsdGVyT3JPYmplY3RzKTpcbiAgICAgIHByb21pc2UgPSBob29kaWUuZGVmZXIoKS5yZXNvbHZlKGZpbHRlck9yT2JqZWN0cykucHJvbWlzZSgpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDogLy8gZS5nLiBudWxsLCB1cGRhdGUgYWxsXG4gICAgICBwcm9taXNlID0gYXBpLmZpbmRBbGwoKTtcbiAgICB9XG5cbiAgICBwcm9taXNlID0gcHJvbWlzZS50aGVuKGZ1bmN0aW9uKG9iamVjdHMpIHtcbiAgICAgIC8vIG5vdyB3ZSB1cGRhdGUgYWxsIG9iamVjdHMgb25lIGJ5IG9uZSBhbmQgcmV0dXJuIGEgcHJvbWlzZVxuICAgICAgLy8gdGhhdCB3aWxsIGJlIHJlc29sdmVkIG9uY2UgYWxsIHVwZGF0ZXMgaGF2ZSBiZWVuIGZpbmlzaGVkXG4gICAgICB2YXIgb2JqZWN0LCBfdXBkYXRlUHJvbWlzZXM7XG5cbiAgICAgIGlmICghJC5pc0FycmF5KG9iamVjdHMpKSB7XG4gICAgICAgIG9iamVjdHMgPSBbb2JqZWN0c107XG4gICAgICB9XG5cbiAgICAgIF91cGRhdGVQcm9taXNlcyA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIF9pLCBfbGVuLCBfcmVzdWx0cztcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBvYmplY3RzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgb2JqZWN0ID0gb2JqZWN0c1tfaV07XG4gICAgICAgICAgX3Jlc3VsdHMucHVzaChhcGkudXBkYXRlKG9iamVjdC50eXBlLCBvYmplY3QuaWQsIG9iamVjdFVwZGF0ZSwgb3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH0pKCk7XG5cbiAgICAgIHJldHVybiAkLndoZW4uYXBwbHkobnVsbCwgX3VwZGF0ZVByb21pc2VzKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIHByb21pc2UgKTtcbiAgfTtcblxuXG4gIC8vIFJlbW92ZVxuICAvLyAtLS0tLS0tLS0tLS1cblxuICAvLyBSZW1vdmVzIG9uZSBvYmplY3Qgc3BlY2lmaWVkIGJ5IGB0eXBlYCBhbmQgYGlkYC5cbiAgLy9cbiAgLy8gd2hlbiBvYmplY3QgaGFzIGJlZW4gc3luY2VkIGJlZm9yZSwgbWFyayBpdCBhcyBkZWxldGVkLlxuICAvLyBPdGhlcndpc2UgcmVtb3ZlIGl0IGZyb20gU3RvcmUuXG4gIC8vXG4gIGFwaS5yZW1vdmUgPSBmdW5jdGlvbiByZW1vdmUodHlwZSwgaWQsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gZGVjb3JhdGVQcm9taXNlKCBiYWNrZW5kLnJlbW92ZSh0eXBlLCBpZCwgb3B0aW9ucyB8fCB7fSkgKTtcbiAgfTtcblxuXG4gIC8vIHJlbW92ZUFsbFxuICAvLyAtLS0tLS0tLS0tLVxuXG4gIC8vIERlc3Ryb3llIGFsbCBvYmplY3RzLiBDYW4gYmUgZmlsdGVyZWQgYnkgYSB0eXBlXG4gIC8vXG4gIGFwaS5yZW1vdmVBbGwgPSBmdW5jdGlvbiByZW1vdmVBbGwodHlwZSwgb3B0aW9ucykge1xuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIGJhY2tlbmQucmVtb3ZlQWxsKHR5cGUsIG9wdGlvbnMgfHwge30pICk7XG4gIH07XG5cblxuICAvLyBkZWNvcmF0ZSBwcm9taXNlc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gZXh0ZW5kIHByb21pc2VzIHJldHVybmVkIGJ5IHN0b3JlLmFwaVxuICBhcGkuZGVjb3JhdGVQcm9taXNlcyA9IGZ1bmN0aW9uIGRlY29yYXRlUHJvbWlzZXMobWV0aG9kcykge1xuICAgIHJldHVybiAkLmV4dGVuZChwcm9taXNlQXBpLCBtZXRob2RzKTtcbiAgfTtcblxuXG5cbiAgLy8gcmVxdWlyZWQgYmFja2VuZCBtZXRob2RzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaWYgKCFvcHRpb25zLmJhY2tlbmQgKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdvcHRpb25zLmJhY2tlbmQgbXVzdCBiZSBwYXNzZWQnKTtcbiAgfVxuXG4gIHZhciByZXF1aXJlZCA9ICdzYXZlIGZpbmQgZmluZEFsbCByZW1vdmUgcmVtb3ZlQWxsJy5zcGxpdCgnICcpO1xuXG4gIHJlcXVpcmVkLmZvckVhY2goIGZ1bmN0aW9uKG1ldGhvZE5hbWUpIHtcblxuICAgIGlmICghb3B0aW9ucy5iYWNrZW5kW21ldGhvZE5hbWVdKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ29wdGlvbnMuYmFja2VuZC4nK21ldGhvZE5hbWUrJyBtdXN0IGJlIHBhc3NlZC4nKTtcbiAgICB9XG5cbiAgICBiYWNrZW5kW21ldGhvZE5hbWVdID0gb3B0aW9ucy5iYWNrZW5kW21ldGhvZE5hbWVdO1xuICB9KTtcblxuXG4gIC8vIFByaXZhdGVcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gLyBub3QgYWxsb3dlZCBmb3IgaWRcbiAgdmFyIHZhbGlkSWRPclR5cGVQYXR0ZXJuID0gL15bXlxcL10rJC87XG4gIHZhciB2YWxpZElkT3JUeXBlUnVsZXMgPSAnLyBub3QgYWxsb3dlZCc7XG5cbiAgLy9cbiAgZnVuY3Rpb24gZGVjb3JhdGVQcm9taXNlKHByb21pc2UpIHtcbiAgICByZXR1cm4gJC5leHRlbmQocHJvbWlzZSwgcHJvbWlzZUFwaSk7XG4gIH1cblxuICByZXR1cm4gYXBpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVN0b3JlQXBpO1xuIiwiLy8gVGFza3Ncbi8vID09PT09PT09PT09PVxuXG4vLyBUaGlzIGNsYXNzIGRlZmluZXMgdGhlIGhvb2RpZS50YXNrIEFQSS5cbi8vXG4vLyBUaGUgcmV0dXJuZWQgQVBJIHByb3ZpZGVzIHRoZSBmb2xsb3dpbmcgbWV0aG9kczpcbi8vXG4vLyAqIHN0YXJ0XG4vLyAqIGNhbmNlbFxuLy8gKiByZXN0YXJ0XG4vLyAqIHJlbW92ZVxuLy8gKiBvblxuLy8gKiBvbmVcbi8vICogdW5iaW5kXG4vL1xuLy8gQXQgdGhlIHNhbWUgdGltZSwgdGhlIHJldHVybmVkIEFQSSBjYW4gYmUgY2FsbGVkIGFzIGZ1bmN0aW9uIHJldHVybmluZyBhXG4vLyBzdG9yZSBzY29wZWQgYnkgdGhlIHBhc3NlZCB0eXBlLCBmb3IgZXhhbXBsZVxuLy9cbi8vICAgICB2YXIgZW1haWxUYXNrcyA9IGhvb2RpZS50YXNrKCdlbWFpbCcpO1xuLy8gICAgIGVtYWlsVGFza3Muc3RhcnQoIHByb3BlcnRpZXMgKTtcbi8vICAgICBlbWFpbFRhc2tzLmNhbmNlbCgnaWQxMjMnKTtcbi8vXG52YXIgaG9vZGllRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBob29kaWVTY29wZWRUYXNrID0gcmVxdWlyZSgnLi9zY29wZWRfdGFzaycpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllVGFzayhob29kaWUpIHtcblxuICAvLyBwdWJsaWMgQVBJXG4gIHZhciBhcGkgPSBmdW5jdGlvbiBhcGkodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gaG9vZGllU2NvcGVkVGFzayhob29kaWUsIGFwaSwge3R5cGU6IHR5cGUsIGlkOiBpZH0pO1xuICB9O1xuXG4gIC8vIGFkZCBldmVudHMgQVBJXG4gIGhvb2RpZUV2ZW50cyhob29kaWUsIHsgY29udGV4dDogYXBpLCBuYW1lc3BhY2U6ICd0YXNrJyB9KTtcblxuXG4gIC8vIHN0YXJ0XG4gIC8vIC0tLS0tLS1cblxuICAvLyBzdGFydCBhIG5ldyB0YXNrLiBJZiB0aGUgdXNlciBoYXMgbm8gYWNjb3VudCB5ZXQsIGhvb2RpZSB0cmllcyB0byBzaWduIHVwXG4gIC8vIGZvciBhbiBhbm9ueW1vdXMgYWNjb3VudCBpbiB0aGUgYmFja2dyb3VuZC4gSWYgdGhhdCBmYWlscywgdGhlIHJldHVybmVkXG4gIC8vIHByb21pc2Ugd2lsbCBiZSByZWplY3RlZC5cbiAgLy9cbiAgYXBpLnN0YXJ0ID0gZnVuY3Rpb24odHlwZSwgcHJvcGVydGllcykge1xuICAgIGlmIChob29kaWUuYWNjb3VudC5oYXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiBob29kaWUuc3RvcmUuYWRkKCckJyt0eXBlLCBwcm9wZXJ0aWVzKS50aGVuKGhhbmRsZU5ld1Rhc2spO1xuICAgIH1cblxuICAgIHJldHVybiBob29kaWUuYWNjb3VudC5hbm9ueW1vdXNTaWduVXAoKS50aGVuKCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhcGkuc3RhcnQodHlwZSwgcHJvcGVydGllcyk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyBjYW5jZWxcbiAgLy8gLS0tLS0tLVxuXG4gIC8vIGNhbmNlbCBhIHJ1bm5pbmcgdGFza1xuICAvL1xuICBhcGkuY2FuY2VsID0gZnVuY3Rpb24odHlwZSwgaWQpIHtcbiAgICByZXR1cm4gaG9vZGllLnN0b3JlLnVwZGF0ZSgnJCcrdHlwZSwgaWQsIHsgY2FuY2VsbGVkQXQ6IG5vdygpIH0pLnRoZW4oaGFuZGxlQ2FuY2VsbGVkVGFzayk7XG4gIH07XG5cblxuICAvLyByZXN0YXJ0XG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIGZpcnN0LCB3ZSB0cnkgdG8gY2FuY2VsIGEgcnVubmluZyB0YXNrLiBJZiB0aGF0IHN1Y2NlZWRzLCB3ZSBzdGFydFxuICAvLyBhIG5ldyBvbmUgd2l0aCB0aGUgc2FtZSBwcm9wZXJ0aWVzIGFzIHRoZSBvcmlnaW5hbFxuICAvL1xuICBhcGkucmVzdGFydCA9IGZ1bmN0aW9uKHR5cGUsIGlkLCB1cGRhdGUpIHtcbiAgICB2YXIgc3RhcnQgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICQuZXh0ZW5kKG9iamVjdCwgdXBkYXRlKTtcbiAgICAgIGRlbGV0ZSBvYmplY3QuJGVycm9yO1xuICAgICAgZGVsZXRlIG9iamVjdC4kcHJvY2Vzc2VkQXQ7XG4gICAgICBkZWxldGUgb2JqZWN0LmNhbmNlbGxlZEF0O1xuICAgICAgcmV0dXJuIGFwaS5zdGFydChvYmplY3QudHlwZSwgb2JqZWN0KTtcbiAgICB9O1xuICAgIHJldHVybiBhcGkuY2FuY2VsKHR5cGUsIGlkKS50aGVuKHN0YXJ0KTtcbiAgfTtcblxuICAvLyBjYW5jZWxBbGxcbiAgLy8gLS0tLS0tLS0tLS1cblxuICAvL1xuICBhcGkuY2FuY2VsQWxsID0gZnVuY3Rpb24odHlwZSkge1xuICAgIHJldHVybiBmaW5kQWxsKHR5cGUpLnRoZW4oIGNhbmNlbFRhc2tPYmplY3RzICk7XG4gIH07XG5cbiAgLy8gcmVzdGFydEFsbFxuICAvLyAtLS0tLS0tLS0tLVxuXG4gIC8vXG4gIGFwaS5yZXN0YXJ0QWxsID0gZnVuY3Rpb24odHlwZSwgdXBkYXRlKSB7XG4gICAgaWYgKHR5cGVvZiB0eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgdXBkYXRlID0gdHlwZTtcbiAgICB9XG4gICAgcmV0dXJuIGZpbmRBbGwodHlwZSkudGhlbiggZnVuY3Rpb24odGFza09iamVjdHMpIHtcbiAgICAgIHJlc3RhcnRUYXNrT2JqZWN0cyh0YXNrT2JqZWN0cywgdXBkYXRlKTtcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vXG4gIC8vIHN1YnNjcmliZSB0byBzdG9yZSBldmVudHNcbiAgLy8gd2Ugc3Vic2NyaWJlIHRvIGFsbCBzdG9yZSBjaGFuZ2VzLCBwaXBlIHRocm91Z2ggdGhlIHRhc2sgb25lcyxcbiAgLy8gbWFraW5nIGEgZmV3IGNoYW5nZXMgYWxvbmcgdGhlIHdheS5cbiAgLy9cbiAgZnVuY3Rpb24gc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCkge1xuXG4gICAgLy8gYWNjb3VudCBldmVudHNcbiAgICBob29kaWUub24oJ3N0b3JlOmNoYW5nZScsIGhhbmRsZVN0b3JlQ2hhbmdlKTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9ubHkgb25jZSBmcm9tIG91dHNpZGUgKGR1cmluZyBIb29kaWUgaW5pdGlhbGl6YXRpb24pXG4gIGFwaS5zdWJzY3JpYmVUb091dHNpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKTtcbiAgICBkZWxldGUgYXBpLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cztcbiAgfTtcblxuXG4gIC8vIFByaXZhdGVcbiAgLy8gLS0tLS0tLVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZU5ld1Rhc2sob2JqZWN0KSB7XG4gICAgdmFyIGRlZmVyID0gaG9vZGllLmRlZmVyKCk7XG4gICAgdmFyIHRhc2tTdG9yZSA9IGhvb2RpZS5zdG9yZShvYmplY3QudHlwZSwgb2JqZWN0LmlkKTtcblxuICAgIHRhc2tTdG9yZS5vbigncmVtb3ZlJywgZnVuY3Rpb24ob2JqZWN0KSB7XG5cbiAgICAgIC8vIHJlbW92ZSBcIiRcIiBmcm9tIHR5cGVcbiAgICAgIG9iamVjdC50eXBlID0gb2JqZWN0LnR5cGUuc3Vic3RyKDEpO1xuXG4gICAgICAvLyB0YXNrIGZpbmlzaGVkIGJ5IHdvcmtlci5cbiAgICAgIGlmKG9iamVjdC4kcHJvY2Vzc2VkQXQpIHtcbiAgICAgICAgcmV0dXJuIGRlZmVyLnJlc29sdmUob2JqZWN0KTtcbiAgICAgIH1cblxuICAgICAgLy8gbWFudWFsbHkgcmVtb3ZlZCAvIGNhbmNlbGxlZC5cbiAgICAgIGRlZmVyLnJlamVjdChvYmplY3QpO1xuICAgIH0pO1xuICAgIHRhc2tTdG9yZS5vbignZXJyb3InLCBmdW5jdGlvbihlcnJvciwgb2JqZWN0KSB7XG5cbiAgICAgIC8vIHJlbW92ZSBcIiRcIiBmcm9tIHR5cGVcbiAgICAgIG9iamVjdC50eXBlID0gb2JqZWN0LnR5cGUuc3Vic3RyKDEpO1xuXG4gICAgICBkZWZlci5yZWplY3QoZXJyb3IsIG9iamVjdCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQ2FuY2VsbGVkVGFzayAodGFzaykge1xuICAgIHZhciBkZWZlcjtcbiAgICB2YXIgdHlwZSA9ICckJyt0YXNrLnR5cGU7XG4gICAgdmFyIGlkID0gdGFzay5pZDtcbiAgICB2YXIgcmVtb3ZlUHJvbWlzZSA9IGhvb2RpZS5zdG9yZS5yZW1vdmUodHlwZSwgaWQpO1xuXG4gICAgaWYgKCF0YXNrLl9yZXYpIHtcbiAgICAgIC8vIHRhc2sgaGFzIG5vdCB5ZXQgYmVlbiBzeW5jZWQuXG4gICAgICByZXR1cm4gcmVtb3ZlUHJvbWlzZTtcbiAgICB9XG5cbiAgICBkZWZlciA9IGhvb2RpZS5kZWZlcigpO1xuICAgIGhvb2RpZS5vbmUoJ3N0b3JlOnN5bmM6Jyt0eXBlKyc6JytpZCwgZGVmZXIucmVzb2x2ZSk7XG4gICAgcmVtb3ZlUHJvbWlzZS5mYWlsKGRlZmVyLnJlamVjdCk7XG5cbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlU3RvcmVDaGFuZ2UoZXZlbnROYW1lLCBvYmplY3QsIG9wdGlvbnMpIHtcbiAgICBpZiAob2JqZWN0LnR5cGVbMF0gIT09ICckJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG9iamVjdC50eXBlID0gb2JqZWN0LnR5cGUuc3Vic3RyKDEpO1xuICAgIHRyaWdnZXJFdmVudHMoZXZlbnROYW1lLCBvYmplY3QsIG9wdGlvbnMpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gZmluZEFsbCAodHlwZSkge1xuICAgIHZhciBzdGFydHNXaXRoID0gJyQnO1xuICAgIHZhciBmaWx0ZXI7XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIHN0YXJ0c1dpdGggKz0gdHlwZTtcbiAgICB9XG5cbiAgICBmaWx0ZXIgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgIHJldHVybiBvYmplY3QudHlwZS5pbmRleE9mKHN0YXJ0c1dpdGgpID09PSAwO1xuICAgIH07XG4gICAgcmV0dXJuIGhvb2RpZS5zdG9yZS5maW5kQWxsKGZpbHRlcik7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBjYW5jZWxUYXNrT2JqZWN0cyAodGFza09iamVjdHMpIHtcbiAgICByZXR1cm4gdGFza09iamVjdHMubWFwKCBmdW5jdGlvbih0YXNrT2JqZWN0KSB7XG4gICAgICByZXR1cm4gYXBpLmNhbmNlbCh0YXNrT2JqZWN0LnR5cGUuc3Vic3RyKDEpLCB0YXNrT2JqZWN0LmlkKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIHJlc3RhcnRUYXNrT2JqZWN0cyAodGFza09iamVjdHMsIHVwZGF0ZSkge1xuICAgIHJldHVybiB0YXNrT2JqZWN0cy5tYXAoIGZ1bmN0aW9uKHRhc2tPYmplY3QpIHtcbiAgICAgIHJldHVybiBhcGkucmVzdGFydCh0YXNrT2JqZWN0LnR5cGUuc3Vic3RyKDEpLCB0YXNrT2JqZWN0LmlkLCB1cGRhdGUpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gdGhpcyBpcyB3aGVyZSBhbGwgdGhlIHRhc2sgZXZlbnRzIGdldCB0cmlnZ2VyZWQsXG4gIC8vIGxpa2UgYWRkOm1lc3NhZ2UsIGNoYW5nZTptZXNzYWdlOmFiYzQ1NjcsIHJlbW92ZSwgZXRjLlxuICBmdW5jdGlvbiB0cmlnZ2VyRXZlbnRzKGV2ZW50TmFtZSwgdGFzaywgb3B0aW9ucykge1xuICAgIHZhciBlcnJvcjtcblxuICAgIC8vIFwibmV3XCIgdGFza3MgYXJlIHRyaWdnZXIgYXMgXCJzdGFydFwiIGV2ZW50c1xuICAgIGlmIChldmVudE5hbWUgPT09ICduZXcnKSB7XG4gICAgICBldmVudE5hbWUgPSAnc3RhcnQnO1xuICAgIH1cblxuICAgIGlmIChldmVudE5hbWUgPT09ICdyZW1vdmUnICYmIHRhc2suY2FuY2VsbGVkQXQpIHtcbiAgICAgIGV2ZW50TmFtZSA9ICdjYW5jZWwnO1xuICAgIH1cblxuICAgIGlmIChldmVudE5hbWUgPT09ICdyZW1vdmUnICYmIHRhc2suJHByb2Nlc3NlZEF0KSB7XG4gICAgICBldmVudE5hbWUgPSAnc3VjY2Vzcyc7XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50TmFtZSA9PT0gJ3VwZGF0ZScgJiYgdGFzay4kZXJyb3IpIHtcbiAgICAgIGV2ZW50TmFtZSA9ICdlcnJvcic7XG4gICAgICBlcnJvciA9IHRhc2suJGVycm9yO1xuICAgICAgZGVsZXRlIHRhc2suJGVycm9yO1xuXG4gICAgICBhcGkudHJpZ2dlcignZXJyb3InLCBlcnJvciwgdGFzaywgb3B0aW9ucyk7XG4gICAgICBhcGkudHJpZ2dlcih0YXNrLnR5cGUgKyAnOmVycm9yJywgZXJyb3IsIHRhc2ssIG9wdGlvbnMpO1xuICAgICAgYXBpLnRyaWdnZXIodGFzay50eXBlICsgJzonICsgdGFzay5pZCArICc6ZXJyb3InLCBlcnJvciwgdGFzaywgb3B0aW9ucyk7XG5cbiAgICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucywge2Vycm9yOiBlcnJvcn0pO1xuICAgICAgYXBpLnRyaWdnZXIoJ2NoYW5nZScsICdlcnJvcicsIHRhc2ssIG9wdGlvbnMpO1xuICAgICAgYXBpLnRyaWdnZXIodGFzay50eXBlICsgJzpjaGFuZ2UnLCAnZXJyb3InLCB0YXNrLCBvcHRpb25zKTtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6JyArIHRhc2suaWQgKyAnOmNoYW5nZScsICdlcnJvcicsIHRhc2ssIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGlnbm9yZSBhbGwgdGhlIG90aGVyIGV2ZW50c1xuICAgIGlmIChldmVudE5hbWUgIT09ICdzdGFydCcgJiYgZXZlbnROYW1lICE9PSAnY2FuY2VsJyAmJiBldmVudE5hbWUgIT09ICdzdWNjZXNzJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGFwaS50cmlnZ2VyKGV2ZW50TmFtZSwgdGFzaywgb3B0aW9ucyk7XG4gICAgYXBpLnRyaWdnZXIodGFzay50eXBlICsgJzonICsgZXZlbnROYW1lLCB0YXNrLCBvcHRpb25zKTtcblxuICAgIGlmIChldmVudE5hbWUgIT09ICdzdGFydCcpIHtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6JyArIHRhc2suaWQgKyAnOicgKyBldmVudE5hbWUsIHRhc2ssIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGFwaS50cmlnZ2VyKCdjaGFuZ2UnLCBldmVudE5hbWUsIHRhc2ssIG9wdGlvbnMpO1xuICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6Y2hhbmdlJywgZXZlbnROYW1lLCB0YXNrLCBvcHRpb25zKTtcblxuICAgIGlmIChldmVudE5hbWUgIT09ICdzdGFydCcpIHtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6JyArIHRhc2suaWQgKyAnOmNoYW5nZScsIGV2ZW50TmFtZSwgdGFzaywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gbm93KCkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShuZXcgRGF0ZSgpKS5yZXBsYWNlKC9bJ1wiXS9nLCAnJyk7XG4gIH1cblxuICAvLyBleHRlbmQgaG9vZGllXG4gIGhvb2RpZS50YXNrID0gYXBpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVRhc2s7XG4iXX0=
(1)
});
;