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

},{"./hoodie/account":2,"./hoodie/account_remote":3,"./hoodie/config":4,"./hoodie/connection":5,"./hoodie/dispose":6,"./hoodie/events":10,"./hoodie/generate_id":11,"./hoodie/local_store":12,"./hoodie/open":13,"./hoodie/promises":14,"./hoodie/request":16,"./hoodie/task":20}],2:[function(require,module,exports){
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

  //
  // subscribe to events coming from account & our remote store.
  //
  function subscribeToOutsideEvents() {

    // account events
    hoodie.on('account:cleanup', config.clear);
  }

  // allow to run this once from outside
  config.subscribeToOutsideEvents = function() {
    subscribeToOutsideEvents();
    delete config.subscribeToOutsideEvents;
  };
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
    throw new Error('FATAL: error.message must be set');
  }

  // must check for properties, as this.name is always set.
  if (! properties.name) {
    properties.name = 'HoodieError';
  }

  properties.message = properties.message.replace(errorMessageReplacePattern, function(match) {
    var property = match.match(errorMessageFindPropertyPattern)[0];
    return properties[property];
  });

  $.extend(this, properties);
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
HoodieObjectIdError.prototype.rules = 'Lowercase letters, numbers and dashes allowed only. Must start with a letter';

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

    if (!object.id) {
      return;
    }

    if (HoodieObjectIdError.isInvalid(object.id)) {
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
  // changes that has been pushed we trigger a sync event
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

},{"./error/object_id":8,"./error/object_type":9,"./store":19}],13:[function(require,module,exports){
// Open stores
// -------------

var hoodieRemoteStore = require('./remote_store');

function hoodieOpen(hoodie) {

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

    $.extend(options, {
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

},{"./store":19}],16:[function(require,module,exports){
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
function hoodieScopedStoreApi(hoodie, storeApi, options) {

  // name
  var storeName = options.name || 'store';
  var type = options.type;
  var id = options.id;

  var api = {};

  // scoped by type only
  if (!id) {

    // add events
    hoodieEvents(hoodie, {
      context: api,
      namespace: storeName + ':' + type
    });

    //
    api.save = function save(id, properties, options) {
      return storeApi.save(type, id, properties, options);
    };

    //
    api.add = function add(properties, options) {
      return storeApi.add(type, properties, options);
    };

    //
    api.find = function find(id) {
      return storeApi.find(type, id);
    };

    //
    api.findOrAdd = function findOrAdd(id, properties) {
      return storeApi.findOrAdd(type, id, properties);
    };

    //
    api.findAll = function findAll(options) {
      return storeApi.findAll(type, options);
    };

    //
    api.update = function update(id, objectUpdate, options) {
      return storeApi.update(type, id, objectUpdate, options);
    };

    //
    api.updateAll = function updateAll(objectUpdate, options) {
      return storeApi.updateAll(type, objectUpdate, options);
    };

    //
    api.remove = function remove(id, options) {
      return storeApi.remove(type, id, options);
    };

    //
    api.removeAll = function removeAll(options) {
      return storeApi.removeAll(type, options);
    };
  }

  // scoped by both: type & id
  if (id) {

    // add events
    hoodieEvents(hoodie, {
      context: api,
      namespace: storeName + ':' + type + ':' + id
    });

    //
    api.save = function save(properties, options) {
      return storeApi.save(type, id, properties, options);
    };

    //
    api.find = function find() {
      return storeApi.find(type, id);
    };

    //
    api.update = function update(objectUpdate, options) {
      return storeApi.update(type, id, objectUpdate, options);
    };

    //
    api.remove = function remove(options) {
      return storeApi.remove(type, id, options);
    };
  }

  //
  api.decoratePromises = storeApi.decoratePromises;
  api.validate = storeApi.validate;

  return api;
}

module.exports = hoodieScopedStoreApi;

},{"./events":10}],18:[function(require,module,exports){
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

},{"./events":10}],19:[function(require,module,exports){
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

//
var hoodieScopedStoreApi = require('./scoped_store');
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

},{"./error":7,"./error/object_id":8,"./error/object_type":9,"./events":10,"./scoped_store":17}],20:[function(require,module,exports){
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
var HoodieError = require('./error');

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
    return hoodie.store.update('$'+type, id, { cancelledAt: now() }).then(handleCancelledTaskObject);
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
      defer.reject(new HoodieError({
        message: 'Task has been cancelled',
        task: object
      }));
    });
    taskStore.on('update', function(object) {
      var error = object.$error;
      if (! object.$error) {
        return;
      }

      // remove "$" from type
      object.type = object.type.substr(1);

      delete object.$error;
      error.object = object;
      error.message = error.message || 'Something went wrong';

      defer.reject(new HoodieError(error));

      // remove errored task
      hoodie.store.remove('$' + object.type, object.id);
    });

    return defer.promise();
  }

  //
  function handleCancelledTaskObject (taskObject) {
    var defer;
    var type = taskObject.type; // no need to prefix with $, it's already prefixed.
    var id = taskObject.id;
    var removePromise = hoodie.store.remove(type, id);

    if (!taskObject._rev) {
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

},{"./error":7,"./events":10,"./scoped_task":18}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvYWNjb3VudC5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9hY2NvdW50X3JlbW90ZS5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9jb25maWcuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvY29ubmVjdGlvbi5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9kaXNwb3NlLmpzIiwiL1VzZXJzL2dyZWdvci9KYXZhU2NyaXB0cy9ob29kLmllL2hvb2RpZS5qcy9zcmMvaG9vZGllL2Vycm9yLmpzIiwiL1VzZXJzL2dyZWdvci9KYXZhU2NyaXB0cy9ob29kLmllL2hvb2RpZS5qcy9zcmMvaG9vZGllL2Vycm9yL29iamVjdF9pZC5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9lcnJvci9vYmplY3RfdHlwZS5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9ldmVudHMuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvZ2VuZXJhdGVfaWQuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvbG9jYWxfc3RvcmUuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvb3Blbi5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9wcm9taXNlcy5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9yZW1vdGVfc3RvcmUuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvcmVxdWVzdC5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9zY29wZWRfc3RvcmUuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvc2NvcGVkX3Rhc2suanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvc3RvcmUuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvdGFzay5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xtQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ245QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzd2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGdsb2JhbD10eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge307Ly8gSG9vZGllIENvcmVcbi8vIC0tLS0tLS0tLS0tLS1cbi8vXG4vLyB0aGUgZG9vciB0byB3b3JsZCBkb21pbmF0aW9uIChhcHBzKVxuLy9cblxudmFyIGhvb2RpZUFjY291bnQgPSByZXF1aXJlKCcuL2hvb2RpZS9hY2NvdW50Jyk7XG52YXIgaG9vZGllQWNjb3VudFJlbW90ZSA9IHJlcXVpcmUoJy4vaG9vZGllL2FjY291bnRfcmVtb3RlJyk7XG52YXIgaG9vZGllQ29uZmlnID0gcmVxdWlyZSgnLi9ob29kaWUvY29uZmlnJyk7XG52YXIgaG9vZGllUHJvbWlzZXMgPSByZXF1aXJlKCcuL2hvb2RpZS9wcm9taXNlcycpO1xudmFyIGhvb2RpZVJlcXVlc3QgPSByZXF1aXJlKCcuL2hvb2RpZS9yZXF1ZXN0Jyk7XG52YXIgaG9vZGllQ29ubmVjdGlvbiA9IHJlcXVpcmUoJy4vaG9vZGllL2Nvbm5lY3Rpb24nKTtcbnZhciBob29kaWVEaXNwb3NlID0gcmVxdWlyZSgnLi9ob29kaWUvZGlzcG9zZScpO1xudmFyIGhvb2RpZU9wZW4gPSByZXF1aXJlKCcuL2hvb2RpZS9vcGVuJyk7XG52YXIgaG9vZGllTG9jYWxTdG9yZSA9IHJlcXVpcmUoJy4vaG9vZGllL2xvY2FsX3N0b3JlJyk7XG52YXIgaG9vZGllR2VuZXJhdGVJZCA9IHJlcXVpcmUoJy4vaG9vZGllL2dlbmVyYXRlX2lkJyk7XG52YXIgaG9vZGllVGFzayA9IHJlcXVpcmUoJy4vaG9vZGllL3Rhc2snKTtcbnZhciBob29kaWVFdmVudHMgPSByZXF1aXJlKCcuL2hvb2RpZS9ldmVudHMnKTtcblxuLy8gQ29uc3RydWN0b3Jcbi8vIC0tLS0tLS0tLS0tLS1cblxuLy8gV2hlbiBpbml0aWFsaXppbmcgYSBob29kaWUgaW5zdGFuY2UsIGFuIG9wdGlvbmFsIFVSTFxuLy8gY2FuIGJlIHBhc3NlZC4gVGhhdCdzIHRoZSBVUkwgb2YgdGhlIGhvb2RpZSBiYWNrZW5kLlxuLy8gSWYgbm8gVVJMIHBhc3NlZCBpdCBkZWZhdWx0cyB0byB0aGUgY3VycmVudCBkb21haW4uXG4vL1xuLy8gICAgIC8vIGluaXQgYSBuZXcgaG9vZGllIGluc3RhbmNlXG4vLyAgICAgaG9vZGllID0gbmV3IEhvb2RpZVxuLy9cbmZ1bmN0aW9uIEhvb2RpZShiYXNlVXJsKSB7XG4gIHZhciBob29kaWUgPSB0aGlzO1xuXG4gIC8vIGVuZm9yY2UgaW5pdGlhbGl6YXRpb24gd2l0aCBgbmV3YFxuICBpZiAoIShob29kaWUgaW5zdGFuY2VvZiBIb29kaWUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1c2FnZTogbmV3IEhvb2RpZSh1cmwpOycpO1xuICB9XG5cbiAgaWYgKGJhc2VVcmwpIHtcbiAgICAvLyByZW1vdmUgdHJhaWxpbmcgc2xhc2hlc1xuICAgIGhvb2RpZS5iYXNlVXJsID0gYmFzZVVybC5yZXBsYWNlKC9cXC8rJC8sICcnKTtcbiAgfVxuXG5cbiAgLy8gaG9vZGllLmV4dGVuZFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBleHRlbmQgaG9vZGllIGluc3RhbmNlOlxuICAvL1xuICAvLyAgICAgaG9vZGllLmV4dGVuZChmdW5jdGlvbihob29kaWUpIHt9IClcbiAgLy9cbiAgaG9vZGllLmV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZChleHRlbnNpb24pIHtcbiAgICBleHRlbnNpb24oaG9vZGllKTtcbiAgfTtcblxuXG4gIC8vXG4gIC8vIEV4dGVuZGluZyBob29kaWUgY29yZVxuICAvL1xuXG4gIC8vICogaG9vZGllLmJpbmRcbiAgLy8gKiBob29kaWUub25cbiAgLy8gKiBob29kaWUub25lXG4gIC8vICogaG9vZGllLnRyaWdnZXJcbiAgLy8gKiBob29kaWUudW5iaW5kXG4gIC8vICogaG9vZGllLm9mZlxuICBob29kaWUuZXh0ZW5kKCBob29kaWVFdmVudHMgKTtcblxuXG4gIC8vICogaG9vZGllLmRlZmVyXG4gIC8vICogaG9vZGllLmlzUHJvbWlzZVxuICAvLyAqIGhvb2RpZS5yZXNvbHZlXG4gIC8vICogaG9vZGllLnJlamVjdFxuICAvLyAqIGhvb2RpZS5yZXNvbHZlV2l0aFxuICAvLyAqIGhvb2RpZS5yZWplY3RXaXRoXG4gIGhvb2RpZS5leHRlbmQoIGhvb2RpZVByb21pc2VzICk7XG5cbiAgLy8gKiBob29kaWUucmVxdWVzdFxuICBob29kaWUuZXh0ZW5kKCBob29kaWVSZXF1ZXN0ICk7XG5cbiAgLy8gKiBob29kaWUuaXNPbmxpbmVcbiAgLy8gKiBob29kaWUuY2hlY2tDb25uZWN0aW9uXG4gIGhvb2RpZS5leHRlbmQoIGhvb2RpZUNvbm5lY3Rpb24gKTtcblxuICAvLyAqIGhvb2RpZS51dWlkXG4gIGhvb2RpZS5leHRlbmQoIGhvb2RpZUdlbmVyYXRlSWQgKTtcblxuICAvLyAqIGhvb2RpZS5kaXNwb3NlXG4gIGhvb2RpZS5leHRlbmQoIGhvb2RpZURpc3Bvc2UgKTtcblxuICAvLyAqIGhvb2RpZS5vcGVuXG4gIGhvb2RpZS5leHRlbmQoIGhvb2RpZU9wZW4gKTtcblxuICAvLyAqIGhvb2RpZS5zdG9yZVxuICBob29kaWUuZXh0ZW5kKCBob29kaWVMb2NhbFN0b3JlICk7XG5cbiAgLy8gKiBob29kaWUudGFza1xuICBob29kaWUuZXh0ZW5kKCBob29kaWVUYXNrICk7XG5cbiAgLy8gKiBob29kaWUuY29uZmlnXG4gIGhvb2RpZS5leHRlbmQoIGhvb2RpZUNvbmZpZyApO1xuXG4gIC8vICogaG9vZGllLmFjY291bnRcbiAgaG9vZGllLmV4dGVuZCggaG9vZGllQWNjb3VudCApO1xuXG4gIC8vICogaG9vZGllLnJlbW90ZVxuICBob29kaWUuZXh0ZW5kKCBob29kaWVBY2NvdW50UmVtb3RlICk7XG5cblxuICAvL1xuICAvLyBJbml0aWFsaXphdGlvbnNcbiAgLy9cblxuICAvLyBzZXQgdXNlcm5hbWUgZnJvbSBjb25maWcgKGxvY2FsIHN0b3JlKVxuICBob29kaWUuYWNjb3VudC51c2VybmFtZSA9IGhvb2RpZS5jb25maWcuZ2V0KCdfYWNjb3VudC51c2VybmFtZScpO1xuXG4gIC8vIGNoZWNrIGZvciBwZW5kaW5nIHBhc3N3b3JkIHJlc2V0XG4gIGhvb2RpZS5hY2NvdW50LmNoZWNrUGFzc3dvcmRSZXNldCgpO1xuXG4gIC8vIGNsZWFyIGNvbmZpZyBvbiBzaWduIG91dFxuICBob29kaWUub24oJ2FjY291bnQ6c2lnbm91dCcsIGhvb2RpZS5jb25maWcuY2xlYXIpO1xuXG4gIC8vIGhvb2RpZS5zdG9yZVxuICBob29kaWUuc3RvcmUucGF0Y2hJZk5vdFBlcnNpc3RhbnQoKTtcbiAgaG9vZGllLnN0b3JlLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuICBob29kaWUuc3RvcmUuYm9vdHN0cmFwRGlydHlPYmplY3RzKCk7XG5cbiAgLy8gaG9vZGllLnJlbW90ZVxuICBob29kaWUucmVtb3RlLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuXG4gIC8vIGhvb2RpZS50YXNrXG4gIGhvb2RpZS50YXNrLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuXG4gIC8vIGF1dGhlbnRpY2F0ZVxuICAvLyB3ZSB1c2UgYSBjbG9zdXJlIHRvIG5vdCBwYXNzIHRoZSB1c2VybmFtZSB0byBjb25uZWN0LCBhcyBpdFxuICAvLyB3b3VsZCBzZXQgdGhlIG5hbWUgb2YgdGhlIHJlbW90ZSBzdG9yZSwgd2hpY2ggaXMgbm90IHRoZSB1c2VybmFtZS5cbiAgaG9vZGllLmFjY291bnQuYXV0aGVudGljYXRlKCkudGhlbiggZnVuY3Rpb24oIC8qIHVzZXJuYW1lICovICkge1xuICAgIGhvb2RpZS5yZW1vdGUuY29ubmVjdCgpO1xuICB9KTtcblxuICAvLyBjaGVjayBjb25uZWN0aW9uIHdoZW4gYnJvd3NlciBnb2VzIG9ubGluZSAvIG9mZmxpbmVcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29ubGluZScsIGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24sIGZhbHNlKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29mZmxpbmUnLCBob29kaWUuY2hlY2tDb25uZWN0aW9uLCBmYWxzZSk7XG5cbiAgLy8gc3RhcnQgY2hlY2tpbmcgY29ubmVjdGlvblxuICBob29kaWUuY2hlY2tDb25uZWN0aW9uKCk7XG5cbiAgLy9cbiAgLy8gbG9hZGluZyB1c2VyIGV4dGVuc2lvbnNcbiAgLy9cbiAgYXBwbHlFeHRlbnNpb25zKGhvb2RpZSk7XG59XG5cbi8vIEV4dGVuZGluZyBob29kaWVcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBZb3UgY2FuIGV4dGVuZCB0aGUgSG9vZGllIGNsYXNzIGxpa2Ugc286XG4vL1xuLy8gSG9vZGllLmV4dGVuZChmdW5jaW9uKGhvb2RpZSkgeyBob29kaWUubXlNYWdpYyA9IGZ1bmN0aW9uKCkge30gfSlcbi8vXG5cbnZhciBleHRlbnNpb25zID0gW107XG5cbkhvb2RpZS5leHRlbmQgPSBmdW5jdGlvbihleHRlbnNpb24pIHtcbiAgZXh0ZW5zaW9ucy5wdXNoKGV4dGVuc2lvbik7XG59O1xuXG4vL1xuLy8gZGV0ZWN0IGF2YWlsYWJsZSBleHRlbnNpb25zIGFuZCBhdHRhY2ggdG8gSG9vZGllIE9iamVjdC5cbi8vXG5mdW5jdGlvbiBhcHBseUV4dGVuc2lvbnMoaG9vZGllKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZXh0ZW5zaW9ucy5sZW5ndGg7IGkrKykge1xuICAgIGV4dGVuc2lvbnNbaV0oaG9vZGllKTtcbiAgfVxufVxuXG4vL1xuLy8gZXhwb3NlIEhvb2RpZSB0byBtb2R1bGUgbG9hZGVycy4gQmFzZWQgb24galF1ZXJ5J3MgaW1wbGVtZW50YXRpb24uXG4vL1xuaWYgKCB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0JyApIHtcblxuICAvLyBFeHBvc2UgSG9vZGllIGFzIG1vZHVsZS5leHBvcnRzIGluIGxvYWRlcnMgdGhhdCBpbXBsZW1lbnQgdGhlIE5vZGVcbiAgLy8gbW9kdWxlIHBhdHRlcm4gKGluY2x1ZGluZyBicm93c2VyaWZ5KS4gRG8gbm90IGNyZWF0ZSB0aGUgZ2xvYmFsLCBzaW5jZVxuICAvLyB0aGUgdXNlciB3aWxsIGJlIHN0b3JpbmcgaXQgdGhlbXNlbHZlcyBsb2NhbGx5LCBhbmQgZ2xvYmFscyBhcmUgZnJvd25lZFxuICAvLyB1cG9uIGluIHRoZSBOb2RlIG1vZHVsZSB3b3JsZC5cbiAgbW9kdWxlLmV4cG9ydHMgPSBIb29kaWU7XG5cblxufSBlbHNlIGlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuXG4gIC8vIFJlZ2lzdGVyIGFzIGEgbmFtZWQgQU1EIG1vZHVsZSwgc2luY2UgSG9vZGllIGNhbiBiZSBjb25jYXRlbmF0ZWQgd2l0aCBvdGhlclxuICAvLyBmaWxlcyB0aGF0IG1heSB1c2UgZGVmaW5lLCBidXQgbm90IHZpYSBhIHByb3BlciBjb25jYXRlbmF0aW9uIHNjcmlwdCB0aGF0XG4gIC8vIHVuZGVyc3RhbmRzIGFub255bW91cyBBTUQgbW9kdWxlcy4gQSBuYW1lZCBBTUQgaXMgc2FmZXN0IGFuZCBtb3N0IHJvYnVzdFxuICAvLyB3YXkgdG8gcmVnaXN0ZXIuIExvd2VyY2FzZSBob29kaWUgaXMgdXNlZCBiZWNhdXNlIEFNRCBtb2R1bGUgbmFtZXMgYXJlXG4gIC8vIGRlcml2ZWQgZnJvbSBmaWxlIG5hbWVzLCBhbmQgSG9vZGllIGlzIG5vcm1hbGx5IGRlbGl2ZXJlZCBpbiBhIGxvd2VyY2FzZVxuICAvLyBmaWxlIG5hbWUuXG4gIGRlZmluZShmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEhvb2RpZTtcbiAgfSk7XG5cbn0gZWxzZSB7XG5cbiAgLy8gc2V0IGdsb2JhbFxuICBnbG9iYWwuSG9vZGllID0gSG9vZGllO1xufVxuIiwiLy8gSG9vZGllLkFjY291bnRcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIGhvb2RpZUV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVBY2NvdW50IChob29kaWUpIHtcbiAgLy8gcHVibGljIEFQSVxuICB2YXIgYWNjb3VudCA9IHt9O1xuXG4gIC8vIGZsYWcgd2hldGhlciB1c2VyIGlzIGN1cnJlbnRseSBhdXRoZW50aWNhdGVkIG9yIG5vdFxuICB2YXIgYXV0aGVudGljYXRlZDtcblxuICAvLyBjYWNoZSBmb3IgQ291Y2hEQiBfdXNlcnMgZG9jXG4gIHZhciB1c2VyRG9jID0ge307XG5cbiAgLy8gbWFwIG9mIHJlcXVlc3RQcm9taXNlcy4gV2UgbWFpbnRhaW4gdGhpcyBsaXN0IHRvIGF2b2lkIHNlbmRpbmdcbiAgLy8gdGhlIHNhbWUgcmVxdWVzdHMgc2V2ZXJhbCB0aW1lcy5cbiAgdmFyIHJlcXVlc3RzID0ge307XG5cbiAgLy8gZGVmYXVsdCBjb3VjaERCIHVzZXIgZG9jIHByZWZpeFxuICB2YXIgdXNlckRvY1ByZWZpeCA9ICdvcmcuY291Y2hkYi51c2VyJztcblxuICAvLyBhZGQgZXZlbnRzIEFQSVxuICBob29kaWVFdmVudHMoaG9vZGllLCB7IGNvbnRleHQ6IGFjY291bnQsIG5hbWVzcGFjZTogJ2FjY291bnQnfSk7XG5cbiAgLy8gQXV0aGVudGljYXRlXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVXNlIHRoaXMgbWV0aG9kIHRvIGFzc3VyZSB0aGF0IHRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQ6XG4gIC8vIGBob29kaWUuYWNjb3VudC5hdXRoZW50aWNhdGUoKS5kb25lKCBkb1NvbWV0aGluZyApLmZhaWwoIGhhbmRsZUVycm9yIClgXG4gIC8vXG4gIGFjY291bnQuYXV0aGVudGljYXRlID0gZnVuY3Rpb24gYXV0aGVudGljYXRlKCkge1xuICAgIHZhciBzZW5kQW5kSGFuZGxlQXV0aFJlcXVlc3Q7XG5cbiAgICAvLyBhbHJlYWR5IHRyaWVkIHRvIGF1dGhlbnRpY2F0ZSwgYW5kIGZhaWxlZFxuICAgIGlmIChhdXRoZW50aWNhdGVkID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3QoKTtcbiAgICB9XG5cbiAgICAvLyBhbHJlYWR5IHRyaWVkIHRvIGF1dGhlbnRpY2F0ZSwgYW5kIHN1Y2NlZWRlZFxuICAgIGlmIChhdXRoZW50aWNhdGVkID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlc29sdmVXaXRoKGFjY291bnQudXNlcm5hbWUpO1xuICAgIH1cblxuICAgIC8vIGlmIHRoZXJlIGlzIGEgcGVuZGluZyBzaWduT3V0IHJlcXVlc3QsIHJldHVybiBpdHMgcHJvbWlzZSxcbiAgICAvLyBidXQgcGlwZSBpdCBzbyB0aGF0IGl0IGFsd2F5cyBlbmRzIHVwIHJlamVjdGVkXG4gICAgLy9cbiAgICBpZiAocmVxdWVzdHMuc2lnbk91dCAmJiByZXF1ZXN0cy5zaWduT3V0LnN0YXRlKCkgPT09ICdwZW5kaW5nJykge1xuICAgICAgcmV0dXJuIHJlcXVlc3RzLnNpZ25PdXQudGhlbihob29kaWUucmVqZWN0KTtcbiAgICB9XG5cbiAgICAvLyBpZiB0aGVyZSBpcyBhIHBlbmRpbmcgc2lnbkluIHJlcXVlc3QsIHJldHVybiBpdHMgcHJvbWlzZVxuICAgIC8vXG4gICAgaWYgKHJlcXVlc3RzLnNpZ25JbiAmJiByZXF1ZXN0cy5zaWduSW4uc3RhdGUoKSA9PT0gJ3BlbmRpbmcnKSB7XG4gICAgICByZXR1cm4gcmVxdWVzdHMuc2lnbkluO1xuICAgIH1cblxuICAgIC8vIGlmIHVzZXIgaGFzIG5vIGFjY291bnQsIG1ha2Ugc3VyZSB0byBlbmQgdGhlIHNlc3Npb25cbiAgICBpZiAoISBhY2NvdW50Lmhhc0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIHNlbmRTaWduT3V0UmVxdWVzdCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3QoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHNlbmQgcmVxdWVzdCB0byBjaGVjayBmb3Igc2Vzc2lvbiBzdGF0dXMuIElmIHRoZXJlIGlzIGFcbiAgICAvLyBwZW5kaW5nIHJlcXVlc3QgYWxyZWFkeSwgcmV0dXJuIGl0cyBwcm9taXNlLlxuICAgIC8vXG4gICAgc2VuZEFuZEhhbmRsZUF1dGhSZXF1ZXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5yZXF1ZXN0KCdHRVQnLCAnL19zZXNzaW9uJykudGhlbihcbiAgICAgICAgaGFuZGxlQXV0aGVudGljYXRlUmVxdWVzdFN1Y2Nlc3NcbiAgICAgICk7XG4gICAgfTtcblxuICAgIHJldHVybiB3aXRoU2luZ2xlUmVxdWVzdCgnYXV0aGVudGljYXRlJywgc2VuZEFuZEhhbmRsZUF1dGhSZXF1ZXN0KTtcbiAgfTtcblxuXG4gIC8vIGhhc1ZhbGlkU2Vzc2lvblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXNlciBpcyBjdXJyZW50bHkgc2lnbmVkIGJ1dCBoYXMgbm8gdmFsaWQgc2Vzc2lvbixcbiAgLy8gbWVhbmluZyB0aGF0IHRoZSBkYXRhIGNhbm5vdCBiZSBzeW5jaHJvbml6ZWQuXG4gIC8vXG4gIGFjY291bnQuaGFzVmFsaWRTZXNzaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEgYWNjb3VudC5oYXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXV0aGVudGljYXRlZCA9PT0gdHJ1ZTtcbiAgfTtcblxuXG4gIC8vIGhhc0ludmFsaWRTZXNzaW9uXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmV0dXJucyB0cnVlIGlmIHRoZSB1c2VyIGlzIGN1cnJlbnRseSBzaWduZWQgYnV0IGhhcyBubyB2YWxpZCBzZXNzaW9uLFxuICAvLyBtZWFuaW5nIHRoYXQgdGhlIGRhdGEgY2Fubm90IGJlIHN5bmNocm9uaXplZC5cbiAgLy9cbiAgYWNjb3VudC5oYXNJbnZhbGlkU2Vzc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghIGFjY291bnQuaGFzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF1dGhlbnRpY2F0ZWQgPT09IGZhbHNlO1xuICB9O1xuXG5cbiAgLy8gc2lnbiB1cCB3aXRoIHVzZXJuYW1lICYgcGFzc3dvcmRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHVzZXMgc3RhbmRhcmQgQ291Y2hEQiBBUEkgdG8gY3JlYXRlIGEgbmV3IGRvY3VtZW50IGluIF91c2VycyBkYi5cbiAgLy8gVGhlIGJhY2tlbmQgd2lsbCBhdXRvbWF0aWNhbGx5IGNyZWF0ZSBhIHVzZXJEQiBiYXNlZCBvbiB0aGUgdXNlcm5hbWVcbiAgLy8gYWRkcmVzcyBhbmQgYXBwcm92ZSB0aGUgYWNjb3VudCBieSBhZGRpbmcgYSAnY29uZmlybWVkJyByb2xlIHRvIHRoZVxuICAvLyB1c2VyIGRvYy4gVGhlIGFjY291bnQgY29uZmlybWF0aW9uIG1pZ2h0IHRha2UgYSB3aGlsZSwgc28gd2Uga2VlcCB0cnlpbmdcbiAgLy8gdG8gc2lnbiBpbiB3aXRoIGEgMzAwbXMgdGltZW91dC5cbiAgLy9cbiAgYWNjb3VudC5zaWduVXAgPSBmdW5jdGlvbiBzaWduVXAodXNlcm5hbWUsIHBhc3N3b3JkKSB7XG5cbiAgICBpZiAocGFzc3dvcmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcGFzc3dvcmQgPSAnJztcbiAgICB9XG5cbiAgICBpZiAoIXVzZXJuYW1lKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoJ1VzZXJuYW1lIG11c3QgYmUgc2V0LicpO1xuICAgIH1cblxuICAgIGlmIChhY2NvdW50Lmhhc0Fub255bW91c0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIHVwZ3JhZGVBbm9ueW1vdXNBY2NvdW50KHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgfVxuXG4gICAgaWYgKGFjY291bnQuaGFzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoJ011c3Qgc2lnbiBvdXQgZmlyc3QuJyk7XG4gICAgfVxuXG4gICAgLy8gZG93bmNhc2UgdXNlcm5hbWVcbiAgICB1c2VybmFtZSA9IHVzZXJuYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgX2lkOiB1c2VyRG9jS2V5KHVzZXJuYW1lKSxcbiAgICAgICAgbmFtZTogdXNlclR5cGVBbmRJZCh1c2VybmFtZSksXG4gICAgICAgIHR5cGU6ICd1c2VyJyxcbiAgICAgICAgcm9sZXM6IFtdLFxuICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gICAgICAgIG93bmVySGFzaDogYWNjb3VudC5vd25lckhhc2gsXG4gICAgICAgIGRhdGFiYXNlOiBhY2NvdW50LmRiKCksXG4gICAgICAgIHVwZGF0ZWRBdDogbm93KCksXG4gICAgICAgIGNyZWF0ZWRBdDogbm93KCksXG4gICAgICAgIHNpZ25lZFVwQXQ6IHVzZXJuYW1lICE9PSBhY2NvdW50Lm93bmVySGFzaCA/IG5vdygpIDogdm9pZCAwXG4gICAgICB9KSxcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9O1xuXG4gICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnUFVUJywgdXNlckRvY1VybCh1c2VybmFtZSksIG9wdGlvbnMpLnRoZW4oXG4gICAgICBoYW5kbGVTaWduVXBTdWNjZXNzKHVzZXJuYW1lLCBwYXNzd29yZCksXG4gICAgICBoYW5kbGVTaWduVXBFcnJvcih1c2VybmFtZSlcbiAgICApO1xuICB9O1xuXG5cbiAgLy8gYW5vbnltb3VzIHNpZ24gdXBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIElmIHRoZSB1c2VyIGRpZCBub3Qgc2lnbiB1cCBoaW1zZWxmIHlldCwgYnV0IGRhdGEgbmVlZHMgdG8gYmUgdHJhbnNmZXJlZFxuICAvLyB0byB0aGUgY291Y2gsIGUuZy4gdG8gc2VuZCBhbiBlbWFpbCBvciB0byBzaGFyZSBkYXRhLCB0aGUgYW5vbnltb3VzU2lnblVwXG4gIC8vIG1ldGhvZCBjYW4gYmUgdXNlZC4gSXQgZ2VuZXJhdGVzIGEgcmFuZG9tIHBhc3N3b3JkIGFuZCBzdG9yZXMgaXQgbG9jYWxseVxuICAvLyBpbiB0aGUgYnJvd3Nlci5cbiAgLy9cbiAgLy8gSWYgdGhlIHVzZXIgc2lnbmVzIHVwIGZvciByZWFsIGxhdGVyLCB3ZSAndXBncmFkZScgaGlzIGFjY291bnQsIG1lYW5pbmcgd2VcbiAgLy8gY2hhbmdlIGhpcyB1c2VybmFtZSBhbmQgcGFzc3dvcmQgaW50ZXJuYWxseSBpbnN0ZWFkIG9mIGNyZWF0aW5nIGFub3RoZXIgdXNlci5cbiAgLy9cbiAgYWNjb3VudC5hbm9ueW1vdXNTaWduVXAgPSBmdW5jdGlvbiBhbm9ueW1vdXNTaWduVXAoKSB7XG4gICAgdmFyIHBhc3N3b3JkLCB1c2VybmFtZTtcblxuICAgIHBhc3N3b3JkID0gaG9vZGllLmdlbmVyYXRlSWQoMTApO1xuICAgIHVzZXJuYW1lID0gYWNjb3VudC5vd25lckhhc2g7XG5cbiAgICByZXR1cm4gYWNjb3VudC5zaWduVXAodXNlcm5hbWUsIHBhc3N3b3JkKS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgc2V0QW5vbnltb3VzUGFzc3dvcmQocGFzc3dvcmQpO1xuICAgICAgcmV0dXJuIGFjY291bnQudHJpZ2dlcignc2lnbnVwOmFub255bW91cycsIHVzZXJuYW1lKTtcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIGhhc0FjY291bnRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgYWNjb3VudC5oYXNBY2NvdW50ID0gZnVuY3Rpb24gaGFzQWNjb3VudCgpIHtcbiAgICByZXR1cm4gISFhY2NvdW50LnVzZXJuYW1lO1xuICB9O1xuXG5cbiAgLy8gaGFzQW5vbnltb3VzQWNjb3VudFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBhbm9ueW1vdXMgYWNjb3VudHMgZ2V0IGNyZWF0ZWQgd2hlbiBkYXRhIG5lZWRzIHRvIGJlXG4gIC8vIHN5bmNlZCB3aXRob3V0IHRoZSB1c2VyIGhhdmluZyBhbiBhY2NvdW50LiBUaGF0IGhhcHBlbnNcbiAgLy8gYXV0b21hdGljYWxseSB3aGVuIHRoZSB1c2VyIGNyZWF0ZXMgYSB0YXNrLCBidXQgY2FuIGFsc29cbiAgLy8gYmUgZG9uZSBtYW51YWxseSB1c2luZyBob29kaWUuYWNjb3VudC5hbm9ueW1vdXNTaWduVXAoKSxcbiAgLy8gZS5nLiB0byBwcmV2ZW50IGRhdGEgbG9zcy5cbiAgLy9cbiAgLy8gVG8gZGV0ZXJtaW5lIGJldHdlZW4gYW5vbnltb3VzIGFuZCBcInJlYWxcIiBhY2NvdW50cywgd2VcbiAgLy8gY2FuIGNvbXBhcmUgdGhlIHVzZXJuYW1lIHRvIHRoZSBvd25lckhhc2gsIHdoaWNoIGlzIHRoZVxuICAvLyBzYW1lIGZvciBhbm9ueW1vdXMgYWNjb3VudHMuXG4gIGFjY291bnQuaGFzQW5vbnltb3VzQWNjb3VudCA9IGZ1bmN0aW9uIGhhc0Fub255bW91c0FjY291bnQoKSB7XG4gICAgcmV0dXJuIGFjY291bnQudXNlcm5hbWUgPT09IGFjY291bnQub3duZXJIYXNoO1xuICB9O1xuXG5cbiAgLy8gc2V0IC8gZ2V0IC8gcmVtb3ZlIGFub255bW91cyBwYXNzd29yZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvL1xuICB2YXIgYW5vbnltb3VzUGFzc3dvcmRLZXkgPSAnX2FjY291bnQuYW5vbnltb3VzUGFzc3dvcmQnO1xuXG4gIGZ1bmN0aW9uIHNldEFub255bW91c1Bhc3N3b3JkKHBhc3N3b3JkKSB7XG4gICAgcmV0dXJuIGhvb2RpZS5jb25maWcuc2V0KGFub255bW91c1Bhc3N3b3JkS2V5LCBwYXNzd29yZCk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRBbm9ueW1vdXNQYXNzd29yZCgpIHtcbiAgICByZXR1cm4gaG9vZGllLmNvbmZpZy5nZXQoYW5vbnltb3VzUGFzc3dvcmRLZXkpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlQW5vbnltb3VzUGFzc3dvcmQoKSB7XG4gICAgcmV0dXJuIGhvb2RpZS5jb25maWcudW5zZXQoYW5vbnltb3VzUGFzc3dvcmRLZXkpO1xuICB9XG5cblxuICAvLyBzaWduIGluIHdpdGggdXNlcm5hbWUgJiBwYXNzd29yZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gdXNlcyBzdGFuZGFyZCBDb3VjaERCIEFQSSB0byBjcmVhdGUgYSBuZXcgdXNlciBzZXNzaW9uIChQT1NUIC9fc2Vzc2lvbikuXG4gIC8vIEJlc2lkZXMgdGhlIHN0YW5kYXJkIHNpZ24gaW4gd2UgYWxzbyBjaGVjayBpZiB0aGUgYWNjb3VudCBoYXMgYmVlbiBjb25maXJtZWRcbiAgLy8gKHJvbGVzIGluY2x1ZGUgJ2NvbmZpcm1lZCcgcm9sZSkuXG4gIC8vXG4gIC8vIFdoZW4gc2lnbmluZyBpbiwgYnkgZGVmYXVsdCBhbGwgbG9jYWwgZGF0YSBnZXRzIGNsZWFyZWQgYmVmb3JlaGFuZCAod2l0aCBhIHNpZ25PdXQpLlxuICAvLyBPdGhlcndpc2UgZGF0YSB0aGF0IGhhcyBiZWVuIGNyZWF0ZWQgYmVmb3JlaGFuZCAoYXV0aGVudGljYXRlZCB3aXRoIGFub3RoZXIgdXNlclxuICAvLyBhY2NvdW50IG9yIGFub255bW91c2x5KSB3b3VsZCBiZSBtZXJnZWQgaW50byB0aGUgdXNlciBhY2NvdW50IHRoYXQgc2lnbnMgaW4uXG4gIC8vIFRoYXQgYXBwbGllcyBvbmx5IGlmIHVzZXJuYW1lIGlzbid0IHRoZSBzYW1lIGFzIGN1cnJlbnQgdXNlcm5hbWUuXG4gIC8vXG4gIC8vIFRvIHByZXZlbnQgZGF0YSBsb3NzLCBzaWduSW4gY2FuIGJlIGNhbGxlZCB3aXRoIG9wdGlvbnMubW92ZURhdGEgPSB0cnVlLCB0aGF0IHdsbFxuICAvLyBtb3ZlIGFsbCBkYXRhIGZyb20gdGhlIGFub255bW91cyBhY2NvdW50IHRvIHRoZSBhY2NvdW50IHRoZSB1c2VyIHNpZ25lZCBpbnRvLlxuICAvL1xuICBhY2NvdW50LnNpZ25JbiA9IGZ1bmN0aW9uIHNpZ25Jbih1c2VybmFtZSwgcGFzc3dvcmQsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2lnbk91dEFuZFNpZ25JbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFjY291bnQuc2lnbk91dCh7XG4gICAgICAgIHNpbGVudDogdHJ1ZVxuICAgICAgfSkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNlbmRTaWduSW5SZXF1ZXN0KHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHZhciBjdXJyZW50RGF0YTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKHVzZXJuYW1lID09PSBudWxsKSB7XG4gICAgICB1c2VybmFtZSA9ICcnO1xuICAgIH1cblxuICAgIGlmIChwYXNzd29yZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBwYXNzd29yZCA9ICcnO1xuICAgIH1cblxuICAgIC8vIGRvd25jYXNlXG4gICAgdXNlcm5hbWUgPSB1c2VybmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgaWYgKHVzZXJuYW1lICE9PSBhY2NvdW50LnVzZXJuYW1lKSB7XG4gICAgICBpZiAoISBvcHRpb25zLm1vdmVEYXRhKSB7XG4gICAgICAgIHJldHVybiBzaWduT3V0QW5kU2lnbkluKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBob29kaWUuc3RvcmUuZmluZEFsbCgpXG4gICAgICAudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGN1cnJlbnREYXRhID0gZGF0YTtcbiAgICAgIH0pXG4gICAgICAudGhlbihzaWduT3V0QW5kU2lnbkluKVxuICAgICAgLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnJlbnREYXRhLmZvckVhY2goZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICAgICAgdmFyIHR5cGUgPSBvYmplY3QudHlwZTtcblxuICAgICAgICAgIC8vIGlnbm9yZSB0aGUgYWNjb3VudCBzZXR0aW5nc1xuICAgICAgICAgIGlmICh0eXBlID09PSAnJGNvbmZpZycgJiYgb2JqZWN0LmlkID09PSAnaG9vZGllJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGRlbGV0ZSBvYmplY3QudHlwZTtcbiAgICAgICAgICBvYmplY3QuY3JlYXRlZEJ5ID0gaG9vZGllLmFjY291bnQub3duZXJIYXNoO1xuICAgICAgICAgIGhvb2RpZS5zdG9yZS5hZGQodHlwZSwgb2JqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2VuZFNpZ25JblJlcXVlc3QodXNlcm5hbWUsIHBhc3N3b3JkLCB7XG4gICAgICAgIHJlYXV0aGVudGljYXRlZDogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gc2lnbiBvdXRcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gdXNlcyBzdGFuZGFyZCBDb3VjaERCIEFQSSB0byBpbnZhbGlkYXRlIGEgdXNlciBzZXNzaW9uIChERUxFVEUgL19zZXNzaW9uKVxuICAvL1xuICBhY2NvdW50LnNpZ25PdXQgPSBmdW5jdGlvbiBzaWduT3V0KG9wdGlvbnMpIHtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKCFhY2NvdW50Lmhhc0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIGNsZWFudXAoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB7XG4gICAgICAgICAgcmV0dXJuIGFjY291bnQudHJpZ2dlcignc2lnbm91dCcpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHVzaExvY2FsQ2hhbmdlcyhvcHRpb25zKVxuICAgIC50aGVuKGhvb2RpZS5yZW1vdGUuZGlzY29ubmVjdClcbiAgICAudGhlbihzZW5kU2lnbk91dFJlcXVlc3QpXG4gICAgLnRoZW4oY2xlYW51cEFuZFRyaWdnZXJTaWduT3V0KTtcbiAgfTtcblxuXG4gIC8vIFJlcXVlc3RcbiAgLy8gLS0tXG5cbiAgLy8gc2hvcnRjdXQgZm9yIGBob29kaWUucmVxdWVzdGBcbiAgLy9cbiAgYWNjb3VudC5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdCh0eXBlLCBwYXRoLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgcmV0dXJuIGhvb2RpZS5yZXF1ZXN0LmFwcGx5KGhvb2RpZSwgYXJndW1lbnRzKTtcbiAgfTtcblxuXG4gIC8vIGRiXG4gIC8vIC0tLS1cblxuICAvLyByZXR1cm4gbmFtZSBvZiBkYlxuICAvL1xuICBhY2NvdW50LmRiID0gZnVuY3Rpb24gZGIoKSB7XG4gICAgcmV0dXJuICd1c2VyLycgKyBhY2NvdW50Lm93bmVySGFzaDtcbiAgfTtcblxuXG4gIC8vIGZldGNoXG4gIC8vIC0tLS0tLS1cblxuICAvLyBmZXRjaGVzIF91c2VycyBkb2MgZnJvbSBDb3VjaERCIGFuZCBjYWNoZXMgaXQgaW4gX2RvY1xuICAvL1xuICBhY2NvdW50LmZldGNoID0gZnVuY3Rpb24gZmV0Y2godXNlcm5hbWUpIHtcblxuICAgIGlmICh1c2VybmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB1c2VybmFtZSA9IGFjY291bnQudXNlcm5hbWU7XG4gICAgfVxuXG4gICAgaWYgKCF1c2VybmFtZSkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKHtcbiAgICAgICAgbmFtZTogJ0hvb2RpZVVuYXV0aG9yaXplZEVycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ05vdCBzaWduZWQgaW4nXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gd2l0aFNpbmdsZVJlcXVlc3QoJ2ZldGNoJywgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5yZXF1ZXN0KCdHRVQnLCB1c2VyRG9jVXJsKHVzZXJuYW1lKSkuZG9uZShmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB1c2VyRG9jID0gcmVzcG9uc2U7XG4gICAgICAgIHJldHVybiB1c2VyRG9jO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyBjaGFuZ2UgcGFzc3dvcmRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBOb3RlOiB0aGUgaG9vZGllIEFQSSByZXF1aXJlcyB0aGUgY3VycmVudFBhc3N3b3JkIGZvciBzZWN1cml0eSByZWFzb25zLFxuICAvLyBidXQgY291Y2hEYiBkb2Vzbid0IHJlcXVpcmUgaXQgZm9yIGEgcGFzc3dvcmQgY2hhbmdlLCBzbyBpdCdzIGlnbm9yZWRcbiAgLy8gaW4gdGhpcyBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgaG9vZGllIEFQSS5cbiAgLy9cbiAgYWNjb3VudC5jaGFuZ2VQYXNzd29yZCA9IGZ1bmN0aW9uIGNoYW5nZVBhc3N3b3JkKGN1cnJlbnRQYXNzd29yZCwgbmV3UGFzc3dvcmQpIHtcblxuICAgIGlmICghYWNjb3VudC51c2VybmFtZSkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKHtcbiAgICAgICAgbmFtZTogJ0hvb2RpZVVuYXV0aG9yaXplZEVycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ05vdCBzaWduZWQgaW4nXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBob29kaWUucmVtb3RlLmRpc2Nvbm5lY3QoKTtcblxuICAgIHJldHVybiBhY2NvdW50LmZldGNoKCkudGhlbihcbiAgICAgIHNlbmRDaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkUmVxdWVzdChjdXJyZW50UGFzc3dvcmQsIG51bGwsIG5ld1Bhc3N3b3JkKVxuICAgICk7XG4gIH07XG5cblxuICAvLyByZXNldCBwYXNzd29yZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhpcyBpcyBraW5kIG9mIGEgaGFjay4gV2UgbmVlZCB0byBjcmVhdGUgYW4gb2JqZWN0IGFub255bW91c2x5XG4gIC8vIHRoYXQgaXMgbm90IGV4cG9zZWQgdG8gb3RoZXJzLiBUaGUgb25seSBDb3VjaERCIEFQSSBvdGhlcmluZyBzdWNoXG4gIC8vIGZ1bmN0aW9uYWxpdHkgaXMgdGhlIF91c2VycyBkYXRhYmFzZS5cbiAgLy9cbiAgLy8gU28gd2UgYWN0dWFseSBzaWduIHVwIGEgbmV3IGNvdWNoREIgdXNlciB3aXRoIHNvbWUgc3BlY2lhbCBhdHRyaWJ1dGVzLlxuICAvLyBJdCB3aWxsIGJlIHBpY2tlZCB1cCBieSB0aGUgcGFzc3dvcmQgcmVzZXQgd29ya2VyIGFuZCByZW1vdmVlZFxuICAvLyBvbmNlIHRoZSBwYXNzd29yZCB3YXMgcmVzZXR0ZWQuXG4gIC8vXG4gIGFjY291bnQucmVzZXRQYXNzd29yZCA9IGZ1bmN0aW9uIHJlc2V0UGFzc3dvcmQodXNlcm5hbWUpIHtcbiAgICB2YXIgZGF0YSwga2V5LCBvcHRpb25zLCByZXNldFBhc3N3b3JkSWQ7XG5cbiAgICByZXNldFBhc3N3b3JkSWQgPSBob29kaWUuY29uZmlnLmdldCgnX2FjY291bnQucmVzZXRQYXNzd29yZElkJyk7XG5cbiAgICBpZiAocmVzZXRQYXNzd29yZElkKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5jaGVja1Bhc3N3b3JkUmVzZXQoKTtcbiAgICB9XG5cbiAgICByZXNldFBhc3N3b3JkSWQgPSAnJyArIHVzZXJuYW1lICsgJy8nICsgKGhvb2RpZS5nZW5lcmF0ZUlkKCkpO1xuXG4gICAgaG9vZGllLmNvbmZpZy5zZXQoJ19hY2NvdW50LnJlc2V0UGFzc3dvcmRJZCcsIHJlc2V0UGFzc3dvcmRJZCk7XG5cbiAgICBrZXkgPSAnJyArIHVzZXJEb2NQcmVmaXggKyAnOiRwYXNzd29yZFJlc2V0LycgKyByZXNldFBhc3N3b3JkSWQ7XG5cbiAgICBkYXRhID0ge1xuICAgICAgX2lkOiBrZXksXG4gICAgICBuYW1lOiAnJHBhc3N3b3JkUmVzZXQvJyArIHJlc2V0UGFzc3dvcmRJZCxcbiAgICAgIHR5cGU6ICd1c2VyJyxcbiAgICAgIHJvbGVzOiBbXSxcbiAgICAgIHBhc3N3b3JkOiByZXNldFBhc3N3b3JkSWQsXG4gICAgICBjcmVhdGVkQXQ6IG5vdygpLFxuICAgICAgdXBkYXRlZEF0OiBub3coKVxuICAgIH07XG5cbiAgICBvcHRpb25zID0ge1xuICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfTtcblxuICAgIC8vIFRPRE86IHNwZWMgdGhhdCBjaGVja1Bhc3N3b3JkUmVzZXQgZ2V0cyBleGVjdXRlZFxuICAgIHJldHVybiB3aXRoUHJldmlvdXNSZXF1ZXN0c0Fib3J0ZWQoJ3Jlc2V0UGFzc3dvcmQnLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhY2NvdW50LnJlcXVlc3QoJ1BVVCcsICcvX3VzZXJzLycgKyAoZW5jb2RlVVJJQ29tcG9uZW50KGtleSkpLCBvcHRpb25zKS5kb25lKCBhY2NvdW50LmNoZWNrUGFzc3dvcmRSZXNldCApXG4gICAgICAudGhlbiggYXdhaXRQYXNzd29yZFJlc2V0UmVzdWx0ICk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gY2hlY2tQYXNzd29yZFJlc2V0XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGNoZWNrIGZvciB0aGUgc3RhdHVzIG9mIGEgcGFzc3dvcmQgcmVzZXQuIEl0IG1pZ2h0IHRha2VcbiAgLy8gYSB3aGlsZSB1bnRpbCB0aGUgcGFzc3dvcmQgcmVzZXQgd29ya2VyIHBpY2tzIHVwIHRoZSBqb2JcbiAgLy8gYW5kIHVwZGF0ZXMgaXRcbiAgLy9cbiAgLy8gSWYgYSBwYXNzd29yZCByZXNldCByZXF1ZXN0IHdhcyBzdWNjZXNzZnVsLCB0aGUgJHBhc3N3b3JkUmVxdWVzdFxuICAvLyBkb2MgZ2V0cyByZW1vdmVkIGZyb20gX3VzZXJzIGJ5IHRoZSB3b3JrZXIsIHRoZXJlZm9yZSBhIDQwMSBpc1xuICAvLyB3aGF0IHdlIGFyZSB3YWl0aW5nIGZvci5cbiAgLy9cbiAgLy8gT25jZSBjYWxsZWQsIGl0IGNvbnRpbnVlcyB0byByZXF1ZXN0IHRoZSBzdGF0dXMgdXBkYXRlIHdpdGggYVxuICAvLyBvbmUgc2Vjb25kIHRpbWVvdXQuXG4gIC8vXG4gIGFjY291bnQuY2hlY2tQYXNzd29yZFJlc2V0ID0gZnVuY3Rpb24gY2hlY2tQYXNzd29yZFJlc2V0KCkge1xuICAgIHZhciBoYXNoLCBvcHRpb25zLCByZXNldFBhc3N3b3JkSWQsIHVybCwgdXNlcm5hbWU7XG5cbiAgICAvLyByZWplY3QgaWYgdGhlcmUgaXMgbm8gcGVuZGluZyBwYXNzd29yZCByZXNldCByZXF1ZXN0XG4gICAgcmVzZXRQYXNzd29yZElkID0gaG9vZGllLmNvbmZpZy5nZXQoJ19hY2NvdW50LnJlc2V0UGFzc3dvcmRJZCcpO1xuXG4gICAgaWYgKCFyZXNldFBhc3N3b3JkSWQpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aCgnTm8gcGVuZGluZyBwYXNzd29yZCByZXNldC4nKTtcbiAgICB9XG5cbiAgICAvLyBzZW5kIHJlcXVlc3QgdG8gY2hlY2sgc3RhdHVzIG9mIHBhc3N3b3JkIHJlc2V0XG4gICAgdXNlcm5hbWUgPSAnJHBhc3N3b3JkUmVzZXQvJyArIHJlc2V0UGFzc3dvcmRJZDtcbiAgICB1cmwgPSAnL191c2Vycy8nICsgKGVuY29kZVVSSUNvbXBvbmVudCh1c2VyRG9jUHJlZml4ICsgJzonICsgdXNlcm5hbWUpKTtcbiAgICBoYXNoID0gYnRvYSh1c2VybmFtZSArICc6JyArIHJlc2V0UGFzc3dvcmRJZCk7XG5cbiAgICBvcHRpb25zID0ge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmFzaWMgJyArIGhhc2hcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgncGFzc3dvcmRSZXNldFN0YXR1cycsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnR0VUJywgdXJsLCBvcHRpb25zKS50aGVuKFxuICAgICAgICBoYW5kbGVQYXNzd29yZFJlc2V0U3RhdHVzUmVxdWVzdFN1Y2Nlc3MsXG4gICAgICAgIGhhbmRsZVBhc3N3b3JkUmVzZXRTdGF0dXNSZXF1ZXN0RXJyb3JcbiAgICAgICkuZmFpbChmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0hvb2RpZVBlbmRpbmdFcnJvcicpIHtcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChhY2NvdW50LmNoZWNrUGFzc3dvcmRSZXNldCwgMTAwMCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2NvdW50LnRyaWdnZXIoJ3Bhc3N3b3JkcmVzZXQ6ZXJyb3InKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG5cbiAgLy8gY2hhbmdlIHVzZXJuYW1lXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gTm90ZTogdGhlIGhvb2RpZSBBUEkgcmVxdWlyZXMgdGhlIGN1cnJlbnQgcGFzc3dvcmQgZm9yIHNlY3VyaXR5IHJlYXNvbnMsXG4gIC8vIGJ1dCB0ZWNobmljYWxseSB3ZSBjYW5ub3QgKHlldCkgcHJldmVudCB0aGUgdXNlciB0byBjaGFuZ2UgdGhlIHVzZXJuYW1lXG4gIC8vIHdpdGhvdXQga25vd2luZyB0aGUgY3VycmVudCBwYXNzd29yZCwgc28gaXQncyBub3QgaW1wdWxlbWVudGVkIGluIHRoZSBjdXJyZW50XG4gIC8vIGltcGxlbWVudGF0aW9uIG9mIHRoZSBob29kaWUgQVBJLlxuICAvL1xuICAvLyBCdXQgdGhlIGN1cnJlbnQgcGFzc3dvcmQgaXMgbmVlZGVkIHRvIGxvZ2luIHdpdGggdGhlIG5ldyB1c2VybmFtZS5cbiAgLy9cbiAgYWNjb3VudC5jaGFuZ2VVc2VybmFtZSA9IGZ1bmN0aW9uIGNoYW5nZVVzZXJuYW1lKGN1cnJlbnRQYXNzd29yZCwgbmV3VXNlcm5hbWUpIHtcbiAgICBuZXdVc2VybmFtZSA9IG5ld1VzZXJuYW1lIHx8ICcnO1xuICAgIHJldHVybiBjaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkKGN1cnJlbnRQYXNzd29yZCwgbmV3VXNlcm5hbWUudG9Mb3dlckNhc2UoKSk7XG4gIH07XG5cblxuICAvLyBkZXN0cm95XG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIGRlc3Ryb3lzIGEgdXNlcidzIGFjY291bnRcbiAgLy9cbiAgYWNjb3VudC5kZXN0cm95ID0gZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICBpZiAoIWFjY291bnQuaGFzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gY2xlYW51cEFuZFRyaWdnZXJTaWduT3V0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFjY291bnQuZmV0Y2goKS50aGVuKFxuICAgICAgaGFuZGxlRmV0Y2hCZWZvcmVEZXN0cm95U3VjY2VzcyxcbiAgICAgIGhhbmRsZUZldGNoQmVmb3JlRGVzdHJveUVycm9yXG4gICAgKS50aGVuKGNsZWFudXBBbmRUcmlnZ2VyU2lnbk91dCk7XG4gIH07XG5cblxuICAvL1xuICAvLyBzdWJzY3JpYmUgdG8gZXZlbnRzIGNvbWluZyBvdXRzaWRlXG4gIC8vXG4gIGZ1bmN0aW9uIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpIHtcbiAgICBob29kaWUub24oJ3JlbW90ZTplcnJvcjp1bmF1dGhlbnRpY2F0ZWQnLCByZWF1dGhlbnRpY2F0ZSk7XG4gIH1cblxuICAvLyBhbGxvdyB0byBydW4gdGhpcyBvbmNlIGZyb20gb3V0c2lkZVxuICBhY2NvdW50LnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuICAgIGRlbGV0ZSBhY2NvdW50LnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cztcbiAgfTtcblxuXG4gIC8vIFBSSVZBVEVcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gcmVhdXRoZW50aWNhdGU6IGZvcmNlIGhvb2RpZSB0byByZWF1dGhlbnRpY2F0ZVxuICBmdW5jdGlvbiByZWF1dGhlbnRpY2F0ZSAoKSB7XG4gICAgYXV0aGVudGljYXRlZCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gYWNjb3VudC5hdXRoZW50aWNhdGUoKTtcbiAgfVxuXG4gIC8vIHNldHRlcnNcbiAgZnVuY3Rpb24gc2V0VXNlcm5hbWUobmV3VXNlcm5hbWUpIHtcbiAgICBpZiAoYWNjb3VudC51c2VybmFtZSA9PT0gbmV3VXNlcm5hbWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhY2NvdW50LnVzZXJuYW1lID0gbmV3VXNlcm5hbWU7XG5cbiAgICByZXR1cm4gaG9vZGllLmNvbmZpZy5zZXQoJ19hY2NvdW50LnVzZXJuYW1lJywgbmV3VXNlcm5hbWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0T3duZXIobmV3T3duZXJIYXNoKSB7XG5cbiAgICBpZiAoYWNjb3VudC5vd25lckhhc2ggPT09IG5ld093bmVySGFzaCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGFjY291bnQub3duZXJIYXNoID0gbmV3T3duZXJIYXNoO1xuXG4gICAgLy8gYG93bmVySGFzaGAgaXMgc3RvcmVkIHdpdGggZXZlcnkgbmV3IG9iamVjdCBpbiB0aGUgY3JlYXRlZEJ5XG4gICAgLy8gYXR0cmlidXRlLiBJdCBkb2VzIG5vdCBnZXQgY2hhbmdlZCBvbmNlIGl0J3Mgc2V0LiBUaGF0J3Mgd2h5XG4gICAgLy8gd2UgaGF2ZSB0byBmb3JjZSBpdCB0byBiZSBjaGFuZ2UgZm9yIHRoZSBgJGNvbmZpZy9ob29kaWVgIG9iamVjdC5cbiAgICBob29kaWUuY29uZmlnLnNldCgnY3JlYXRlZEJ5JywgbmV3T3duZXJIYXNoKTtcblxuICAgIHJldHVybiBob29kaWUuY29uZmlnLnNldCgnX2FjY291bnQub3duZXJIYXNoJywgbmV3T3duZXJIYXNoKTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gaGFuZGxlIGEgc3VjY2Vzc2Z1bCBhdXRoZW50aWNhdGlvbiByZXF1ZXN0LlxuICAvL1xuICAvLyBBcyBsb25nIGFzIHRoZXJlIGlzIG5vIHNlcnZlciBlcnJvciBvciBpbnRlcm5ldCBjb25uZWN0aW9uIGlzc3VlLFxuICAvLyB0aGUgYXV0aGVudGljYXRlIHJlcXVlc3QgKEdFVCAvX3Nlc3Npb24pIGRvZXMgYWx3YXlzIHJldHVyblxuICAvLyBhIDIwMCBzdGF0dXMuIFRvIGRpZmZlcmVudGlhdGUgd2hldGhlciB0aGUgdXNlciBpcyBzaWduZWQgaW4gb3JcbiAgLy8gbm90LCB3ZSBjaGVjayBgdXNlckN0eC5uYW1lYCBpbiB0aGUgcmVzcG9uc2UuIElmIHRoZSB1c2VyIGlzIG5vdFxuICAvLyBzaWduZWQgaW4sIGl0J3MgbnVsbCwgb3RoZXJ3aXNlIHRoZSBuYW1lIHRoZSB1c2VyIHNpZ25lZCBpbiB3aXRoXG4gIC8vXG4gIC8vIElmIHRoZSB1c2VyIGlzIG5vdCBzaWduZWQgaW4sIHdlIGRpZmVlcmVudGlhdGUgYmV0d2VlbiB1c2VycyB0aGF0XG4gIC8vIHNpZ25lZCBpbiB3aXRoIGEgdXNlcm5hbWUgLyBwYXNzd29yZCBvciBhbm9ueW1vdXNseS4gRm9yIGFub255bW91c1xuICAvLyB1c2VycywgdGhlIHBhc3N3b3JkIGlzIHN0b3JlZCBpbiBsb2NhbCBzdG9yZSwgc28gd2UgZG9uJ3QgbmVlZFxuICAvLyB0byB0cmlnZ2VyIGFuICd1bmF1dGhlbnRpY2F0ZWQnIGVycm9yLCBidXQgaW5zdGVhZCB0cnkgdG8gc2lnbiBpbi5cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQXV0aGVudGljYXRlUmVxdWVzdFN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICBpZiAocmVzcG9uc2UudXNlckN0eC5uYW1lKSB7XG4gICAgICBhdXRoZW50aWNhdGVkID0gdHJ1ZTtcbiAgICAgIHNldFVzZXJuYW1lKHJlc3BvbnNlLnVzZXJDdHgubmFtZS5yZXBsYWNlKC9edXNlcihfYW5vbnltb3VzKT9cXC8vLCAnJykpO1xuICAgICAgc2V0T3duZXIocmVzcG9uc2UudXNlckN0eC5yb2xlc1swXSk7XG4gICAgICByZXR1cm4gaG9vZGllLnJlc29sdmVXaXRoKGFjY291bnQudXNlcm5hbWUpO1xuICAgIH1cblxuICAgIGlmIChhY2NvdW50Lmhhc0Fub255bW91c0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIGFjY291bnQuc2lnbkluKGFjY291bnQudXNlcm5hbWUsIGdldEFub255bW91c1Bhc3N3b3JkKCkpO1xuICAgIH1cblxuICAgIGF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICBhY2NvdW50LnRyaWdnZXIoJ2Vycm9yOnVuYXV0aGVudGljYXRlZCcpO1xuICAgIHJldHVybiBob29kaWUucmVqZWN0KCk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIGhhbmRsZSByZXNwb25zZSBvZiBhIHN1Y2Nlc3NmdWwgc2lnblVwIHJlcXVlc3QuXG4gIC8vIFJlc3BvbnNlIGxvb2tzIGxpa2U6XG4gIC8vXG4gIC8vICAgICB7XG4gIC8vICAgICAgICAgJ29rJzogdHJ1ZSxcbiAgLy8gICAgICAgICAnaWQnOiAnb3JnLmNvdWNoZGIudXNlcjpqb2UnLFxuICAvLyAgICAgICAgICdyZXYnOiAnMS1lODc0N2Q5YWU5Nzc2NzA2ZGE5MjgxMGIxYmFhNDI0OCdcbiAgLy8gICAgIH1cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlU2lnblVwU3VjY2Vzcyh1c2VybmFtZSwgcGFzc3dvcmQpIHtcblxuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgYWNjb3VudC50cmlnZ2VyKCdzaWdudXAnLCB1c2VybmFtZSk7XG4gICAgICB1c2VyRG9jLl9yZXYgPSByZXNwb25zZS5yZXY7XG4gICAgICByZXR1cm4gZGVsYXllZFNpZ25Jbih1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgIH07XG4gIH1cblxuICAvL1xuICAvLyBoYW5kbGUgcmVzcG9uc2Ugb2YgYSBmYWlsZWQgc2lnblVwIHJlcXVlc3QuXG4gIC8vXG4gIC8vIEluIGNhc2Ugb2YgYSBjb25mbGljdCwgcmVqZWN0IHdpdGggXCJ1c2VybmFtZSBhbHJlYWR5IGV4aXN0c1wiIGVycm9yXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE3NFxuICAvLyBFcnJvciBwYXNzZWQgZm9yIGhvb2RpZS5yZXF1ZXN0IGxvb2tzIGxpa2UgdGhpc1xuICAvL1xuICAvLyAgICAge1xuICAvLyAgICAgICAgIFwibmFtZVwiOiBcIkhvb2RpZUNvbmZsaWN0RXJyb3JcIixcbiAgLy8gICAgICAgICBcIm1lc3NhZ2VcIjogXCJPYmplY3QgYWxyZWFkeSBleGlzdHMuXCJcbiAgLy8gICAgIH1cbiAgZnVuY3Rpb24gaGFuZGxlU2lnblVwRXJyb3IodXNlcm5hbWUpIHtcblxuICAgIHJldHVybiBmdW5jdGlvbihlcnJvcikge1xuICAgICAgaWYgKGVycm9yLm5hbWUgPT09ICdIb29kaWVDb25mbGljdEVycm9yJykge1xuICAgICAgICBlcnJvci5tZXNzYWdlID0gJ1VzZXJuYW1lICcgKyB1c2VybmFtZSArICcgYWxyZWFkeSBleGlzdHMnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKGVycm9yKTtcbiAgICB9O1xuICB9XG5cblxuICAvL1xuICAvLyBhIGRlbGF5ZWQgc2lnbiBpbiBpcyB1c2VkIGFmdGVyIHNpZ24gdXAgYW5kIGFmdGVyIGFcbiAgLy8gdXNlcm5hbWUgY2hhbmdlLlxuICAvL1xuICBmdW5jdGlvbiBkZWxheWVkU2lnbkluKHVzZXJuYW1lLCBwYXNzd29yZCwgb3B0aW9ucywgZGVmZXIpIHtcblxuICAgIC8vIGRlbGF5ZWRTaWduSW4gbWlnaHQgY2FsbCBpdHNlbGYsIHdoZW4gdGhlIHVzZXIgYWNjb3VudFxuICAgIC8vIGlzIHBlbmRpbmcuIEluIHRoaXMgY2FzZSBpdCBwYXNzZXMgdGhlIG9yaWdpbmFsIGRlZmVyLFxuICAgIC8vIHRvIGtlZXAgYSByZWZlcmVuY2UgYW5kIGZpbmFsbHkgcmVzb2x2ZSAvIHJlamVjdCBpdFxuICAgIC8vIGF0IHNvbWUgcG9pbnRcbiAgICBpZiAoIWRlZmVyKSB7XG4gICAgICBkZWZlciA9IGhvb2RpZS5kZWZlcigpO1xuICAgIH1cblxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHByb21pc2UgPSBzZW5kU2lnbkluUmVxdWVzdCh1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgICAgcHJvbWlzZS5kb25lKGRlZmVyLnJlc29sdmUpO1xuICAgICAgcHJvbWlzZS5mYWlsKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvci5uYW1lID09PSAnSG9vZGllQWNjb3VudFVuY29uZmlybWVkRXJyb3InKSB7XG5cbiAgICAgICAgICAvLyBJdCBtaWdodCB0YWtlIGEgYml0IHVudGlsIHRoZSBhY2NvdW50IGhhcyBiZWVuIGNvbmZpcm1lZFxuICAgICAgICAgIGRlbGF5ZWRTaWduSW4odXNlcm5hbWUsIHBhc3N3b3JkLCBvcHRpb25zLCBkZWZlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVmZXIucmVqZWN0LmFwcGx5KGRlZmVyLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH0sIDMwMCk7XG5cbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICB9XG5cblxuICAvL1xuICAvLyBwYXJzZSBhIHN1Y2Nlc3NmdWwgc2lnbiBpbiByZXNwb25zZSBmcm9tIGNvdWNoREIuXG4gIC8vIFJlc3BvbnNlIGxvb2tzIGxpa2U6XG4gIC8vXG4gIC8vICAgICB7XG4gIC8vICAgICAgICAgJ29rJzogdHJ1ZSxcbiAgLy8gICAgICAgICAnbmFtZSc6ICd0ZXN0MScsXG4gIC8vICAgICAgICAgJ3JvbGVzJzogW1xuICAvLyAgICAgICAgICAgICAnbXZ1ODVoeScsXG4gIC8vICAgICAgICAgICAgICdjb25maXJtZWQnXG4gIC8vICAgICAgICAgXVxuICAvLyAgICAgfVxuICAvL1xuICAvLyB3ZSB3YW50IHRvIHR1cm4gaXQgaW50byAndGVzdDEnLCAnbXZ1ODVoeScgb3IgcmVqZWN0IHRoZSBwcm9taXNlXG4gIC8vIGluIGNhc2UgYW4gZXJyb3Igb2NjdXJlZCAoJ3JvbGVzJyBhcnJheSBjb250YWlucyAnZXJyb3InKVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVTaWduSW5TdWNjZXNzKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgdmFyIGRlZmVyLCB1c2VybmFtZTtcblxuICAgICAgZGVmZXIgPSBob29kaWUuZGVmZXIoKTtcbiAgICAgIHVzZXJuYW1lID0gcmVzcG9uc2UubmFtZS5yZXBsYWNlKC9edXNlcihfYW5vbnltb3VzKT9cXC8vLCAnJyk7XG5cbiAgICAgIC8vXG4gICAgICAvLyBpZiBhbiBlcnJvciBvY2N1cmVkLCB0aGUgdXNlckRCIHdvcmtlciBzdG9yZXMgaXQgdG8gdGhlICRlcnJvciBhdHRyaWJ1dGVcbiAgICAgIC8vIGFuZCBhZGRzIHRoZSAnZXJyb3InIHJvbGUgdG8gdGhlIHVzZXJzIGRvYyBvYmplY3QuIElmIHRoZSB1c2VyIGhhcyB0aGVcbiAgICAgIC8vICdlcnJvcicgcm9sZSwgd2UgbmVlZCB0byBmZXRjaCBoaXMgX3VzZXJzIGRvYyB0byBmaW5kIG91dCB3aGF0IHRoZSBlcnJvclxuICAgICAgLy8gaXMsIGJlZm9yZSB3ZSBjYW4gcmVqZWN0IHRoZSBwcm9taXNlLlxuICAgICAgLy9cbiAgICAgIGlmIChyZXNwb25zZS5yb2xlcy5pbmRleE9mKCdlcnJvcicpICE9PSAtMSkge1xuICAgICAgICBhY2NvdW50LmZldGNoKHVzZXJuYW1lKS5mYWlsKGRlZmVyLnJlamVjdCkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gZGVmZXIucmVqZWN0KHVzZXJEb2MuJGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gICAgICB9XG5cbiAgICAgIC8vXG4gICAgICAvLyBXaGVuIHRoZSB1c2VyREIgd29ya2VyIGNyZWF0ZWQgdGhlIGRhdGFiYXNlIGZvciB0aGUgdXNlciBhbmQgZXZlcnRoaW5nXG4gICAgICAvLyB3b3JrZWQgb3V0LCBpdCBhZGRzIHRoZSByb2xlICdjb25maXJtZWQnIHRvIHRoZSB1c2VyLiBJZiB0aGUgcm9sZSBpc1xuICAgICAgLy8gbm90IHByZXNlbnQgeWV0LCBpdCBtaWdodCBiZSB0aGF0IHRoZSB3b3JrZXIgZGlkbid0IHBpY2sgdXAgdGhlIHRoZVxuICAgICAgLy8gdXNlciBkb2MgeWV0LCBvciB0aGVyZSB3YXMgYW4gZXJyb3IuIEluIHRoaXMgY2FzZXMsIHdlIHJlamVjdCB0aGUgcHJvbWlzZVxuICAgICAgLy8gd2l0aCBhbiAndW5jb2Zpcm1lZCBlcnJvcidcbiAgICAgIC8vXG4gICAgICBpZiAocmVzcG9uc2Uucm9sZXMuaW5kZXhPZignY29uZmlybWVkJykgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiBkZWZlci5yZWplY3Qoe1xuICAgICAgICAgIG5hbWU6ICdIb29kaWVBY2NvdW50VW5jb25maXJtZWRFcnJvcicsXG4gICAgICAgICAgbWVzc2FnZTogJ0FjY291bnQgaGFzIG5vdCBiZWVuIGNvbmZpcm1lZCB5ZXQnXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBzZXRVc2VybmFtZSh1c2VybmFtZSk7XG4gICAgICBzZXRPd25lcihyZXNwb25zZS5yb2xlc1swXSk7XG4gICAgICBhdXRoZW50aWNhdGVkID0gdHJ1ZTtcblxuICAgICAgLy9cbiAgICAgIC8vIG9wdGlvbnMudmVyYm9zZSBpcyB0cnVlLCB3aGVuIGEgdXNlciBtYW51YWxseSBzaWduZWQgdmlhIGhvb2RpZS5hY2NvdW50LnNpZ25JbigpLlxuICAgICAgLy8gV2UgbmVlZCB0byBkaWZmZXJlbnRpYXRlIHRvIG90aGVyIHNpZ25JbiByZXF1ZXN0cywgZm9yIGV4YW1wbGUgcmlnaHQgYWZ0ZXJcbiAgICAgIC8vIHRoZSBzaWdudXAgb3IgYWZ0ZXIgYSBzZXNzaW9uIHRpbWVkIG91dC5cbiAgICAgIC8vXG4gICAgICBpZiAoIShvcHRpb25zLnNpbGVudCB8fCBvcHRpb25zLnJlYXV0aGVudGljYXRlZCkpIHtcbiAgICAgICAgaWYgKGFjY291bnQuaGFzQW5vbnltb3VzQWNjb3VudCgpKSB7XG4gICAgICAgICAgYWNjb3VudC50cmlnZ2VyKCdzaWduaW46YW5vbnltb3VzJywgdXNlcm5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFjY291bnQudHJpZ2dlcignc2lnbmluJywgdXNlcm5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHVzZXIgcmVhdXRoZW50aWNhdGVkLCBtZWFuaW5nXG4gICAgICBpZiAob3B0aW9ucy5yZWF1dGhlbnRpY2F0ZWQpIHtcbiAgICAgICAgYWNjb3VudC50cmlnZ2VyKCdyZWF1dGhlbnRpY2F0ZWQnLCB1c2VybmFtZSk7XG4gICAgICB9XG5cbiAgICAgIGFjY291bnQuZmV0Y2goKTtcbiAgICAgIHJldHVybiBkZWZlci5yZXNvbHZlKHVzZXJuYW1lLCByZXNwb25zZS5yb2xlc1swXSk7XG4gICAgfTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gSWYgdGhlIHJlcXVlc3Qgd2FzIHN1Y2Nlc3NmdWwgdGhlcmUgbWlnaHQgaGF2ZSBvY2N1cmVkIGFuXG4gIC8vIGVycm9yLCB3aGljaCB0aGUgd29ya2VyIHN0b3JlZCBpbiB0aGUgc3BlY2lhbCAkZXJyb3IgYXR0cmlidXRlLlxuICAvLyBJZiB0aGF0IGhhcHBlbnMsIHdlIHJldHVybiBhIHJlamVjdGVkIHByb21pc2Ugd2l0aCB0aGUgZXJyb3JcbiAgLy8gT3RoZXJ3aXNlIHJlamVjdCB0aGUgcHJvbWlzZSB3aXRoIGEgJ3BlbmRpbmcnIGVycm9yLFxuICAvLyBhcyB3ZSBhcmUgbm90IHdhaXRpbmcgZm9yIGEgc3VjY2VzcyBmdWxsIHJlc3BvbnNlLCBidXQgYSA0MDFcbiAgLy8gZXJyb3IsIGluZGljYXRpbmcgdGhhdCBvdXIgcGFzc3dvcmQgd2FzIGNoYW5nZWQgYW5kIG91clxuICAvLyBjdXJyZW50IHNlc3Npb24gaGFzIGJlZW4gaW52YWxpZGF0ZWRcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlUGFzc3dvcmRSZXNldFN0YXR1c1JlcXVlc3RTdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgdmFyIGVycm9yO1xuXG4gICAgaWYgKHJlc3BvbnNlLiRlcnJvcikge1xuICAgICAgZXJyb3IgPSByZXNwb25zZS4kZXJyb3I7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9yID0ge1xuICAgICAgICBuYW1lOiAnSG9vZGllUGVuZGluZ0Vycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ1Bhc3N3b3JkIHJlc2V0IGlzIHN0aWxsIHBlbmRpbmcnXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoZXJyb3IpO1xuICB9XG5cblxuICAvL1xuICAvLyBJZiB0aGUgZXJyb3IgaXMgYSA0MDEsIGl0J3MgZXhhY3RseSB3aGF0IHdlJ3ZlIGJlZW4gd2FpdGluZyBmb3IuXG4gIC8vIEluIHRoaXMgY2FzZSB3ZSByZXNvbHZlIHRoZSBwcm9taXNlLlxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVQYXNzd29yZFJlc2V0U3RhdHVzUmVxdWVzdEVycm9yKGVycm9yKSB7XG4gICAgaWYgKGVycm9yLm5hbWUgPT09ICdIb29kaWVVbmF1dGhvcml6ZWRFcnJvcicpIHtcbiAgICAgIGhvb2RpZS5jb25maWcudW5zZXQoJ19hY2NvdW50LnJlc2V0UGFzc3dvcmRJZCcpO1xuICAgICAgYWNjb3VudC50cmlnZ2VyKCdwYXNzd29yZHJlc2V0Jyk7XG5cbiAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy9cbiAgLy8gd2FpdCB1bnRpbCBhIHBhc3N3b3JkIHJlc2V0IGdldHMgZWl0aGVyIGNvbXBsZXRlZCBvciBtYXJrZWQgYXMgZmFpbGVkXG4gIC8vIGFuZCByZXNvbHZlIC8gcmVqZWN0IHJlc3BlY3RpdmVseVxuICAvL1xuICBmdW5jdGlvbiBhd2FpdFBhc3N3b3JkUmVzZXRSZXN1bHQoKSB7XG4gICAgdmFyIGRlZmVyID0gaG9vZGllLmRlZmVyKCk7XG5cbiAgICBhY2NvdW50Lm9uZSgncGFzc3dvcmRyZXNldCcsIGRlZmVyLnJlc29sdmUgKTtcbiAgICBhY2NvdW50Lm9uZSgnZXJyb3I6cGFzc3dvcmRyZXNldCcsIGRlZmVyLnJlamVjdCApO1xuXG4gICAgLy8gY2xlYW4gdXAgY2FsbGJhY2tzIHdoZW4gZWl0aGVyIGdldHMgY2FsbGVkXG4gICAgZGVmZXIuYWx3YXlzKCBmdW5jdGlvbigpIHtcbiAgICAgIGFjY291bnQudW5iaW5kKCdwYXNzd29yZHJlc2V0JywgZGVmZXIucmVzb2x2ZSApO1xuICAgICAgYWNjb3VudC51bmJpbmQoJ2Vycm9yOnBhc3N3b3JkcmVzZXQnLCBkZWZlci5yZWplY3QgKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIGNoYW5nZSB1c2VybmFtZSBhbmQgcGFzc3dvcmQgaW4gMyBzdGVwc1xuICAvL1xuICAvLyAxLiBhc3N1cmUgd2UgaGF2ZSBhIHZhbGlkIHNlc3Npb25cbiAgLy8gMi4gdXBkYXRlIF91c2VycyBkb2Mgd2l0aCBuZXcgdXNlcm5hbWUgYW5kIG5ldyBwYXNzd29yZCAoaWYgcHJvdmlkZWQpXG4gIC8vIDMuIHNpZ24gaW4gd2l0aCBuZXcgY3JlZGVudGlhbHMgdG8gY3JlYXRlIG5ldyBzZXNpb24uXG4gIC8vXG4gIGZ1bmN0aW9uIGNoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmQoY3VycmVudFBhc3N3b3JkLCBuZXdVc2VybmFtZSwgbmV3UGFzc3dvcmQpIHtcblxuICAgIHJldHVybiBzZW5kU2lnbkluUmVxdWVzdChhY2NvdW50LnVzZXJuYW1lLCBjdXJyZW50UGFzc3dvcmQsIHtcbiAgICAgIHNpbGVudDogdHJ1ZVxuICAgIH0pLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5mZXRjaCgpLnRoZW4oXG4gICAgICAgIHNlbmRDaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkUmVxdWVzdChjdXJyZW50UGFzc3dvcmQsIG5ld1VzZXJuYW1lLCBuZXdQYXNzd29yZClcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIHR1cm4gYW4gYW5vbnltb3VzIGFjY291bnQgaW50byBhIHJlYWwgYWNjb3VudFxuICAvL1xuICBmdW5jdGlvbiB1cGdyYWRlQW5vbnltb3VzQWNjb3VudCh1c2VybmFtZSwgcGFzc3dvcmQpIHtcbiAgICB2YXIgY3VycmVudFBhc3N3b3JkID0gZ2V0QW5vbnltb3VzUGFzc3dvcmQoKTtcblxuICAgIHJldHVybiBjaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkKGN1cnJlbnRQYXNzd29yZCwgdXNlcm5hbWUsIHBhc3N3b3JkKS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgYWNjb3VudC50cmlnZ2VyKCdzaWdudXAnLCB1c2VybmFtZSk7XG4gICAgICByZW1vdmVBbm9ueW1vdXNQYXNzd29yZCgpO1xuICAgIH0pO1xuICB9XG5cblxuICAvL1xuICAvLyB3ZSBub3cgY2FuIGJlIHN1cmUgdGhhdCB3ZSBmZXRjaGVkIHRoZSBsYXRlc3QgX3VzZXJzIGRvYywgc28gd2UgY2FuIHVwZGF0ZSBpdFxuICAvLyB3aXRob3V0IGEgcG90ZW50aWFsIGNvbmZsaWN0IGVycm9yLlxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVGZXRjaEJlZm9yZURlc3Ryb3lTdWNjZXNzKCkge1xuXG4gICAgaG9vZGllLnJlbW90ZS5kaXNjb25uZWN0KCk7XG4gICAgdXNlckRvYy5fZGVsZXRlZCA9IHRydWU7XG5cbiAgICByZXR1cm4gd2l0aFByZXZpb3VzUmVxdWVzdHNBYm9ydGVkKCd1cGRhdGVVc2Vyc0RvYycsIGZ1bmN0aW9uKCkge1xuICAgICAgYWNjb3VudC5yZXF1ZXN0KCdQVVQnLCB1c2VyRG9jVXJsKCksIHtcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkodXNlckRvYyksXG4gICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cblxuICAvL1xuICAvLyBkZXBlbmRlbmQgb24gd2hhdCBraW5kIG9mIGVycm9yIHdlIGdldCwgd2Ugd2FudCB0byBpZ25vcmVcbiAgLy8gaXQgb3Igbm90LlxuICAvLyBXaGVuIHdlIGdldCBhICdIb29kaWVOb3RGb3VuZEVycm9yJyBpdCBtZWFucyB0aGF0IHRoZSBfdXNlcnMgZG9jIGhhYmVcbiAgLy8gYmVlbiByZW1vdmVkIGFscmVhZHksIHNvIHdlIGRvbid0IG5lZWQgdG8gZG8gaXQgYW55bW9yZSwgYnV0XG4gIC8vIHN0aWxsIHdhbnQgdG8gZmluaXNoIHRoZSBkZXN0cm95IGxvY2FsbHksIHNvIHdlIHJldHVybiBhXG4gIC8vIHJlc29sdmVkIHByb21pc2VcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlRmV0Y2hCZWZvcmVEZXN0cm95RXJyb3IoZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0hvb2RpZU5vdEZvdW5kRXJyb3InKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlc29sdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICAvL1xuICAvLyByZW1vdmUgZXZlcnl0aGluZyBmb3JtIHRoZSBjdXJyZW50IGFjY291bnQsIHNvIGEgbmV3IGFjY291bnQgY2FuIGJlIGluaXRpYXRlZC5cbiAgLy9cbiAgZnVuY3Rpb24gY2xlYW51cChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBob29kaWUuc3RvcmUgaXMgbGlzdGVuaW5nIG9uIHRoaXMgb25lXG4gICAgYWNjb3VudC50cmlnZ2VyKCdjbGVhbnVwJyk7XG4gICAgYXV0aGVudGljYXRlZCA9IG9wdGlvbnMuYXV0aGVudGljYXRlZDtcblxuICAgIHNldFVzZXJuYW1lKG9wdGlvbnMudXNlcm5hbWUpO1xuICAgIHNldE93bmVyKG9wdGlvbnMub3duZXJIYXNoIHx8IGhvb2RpZS5nZW5lcmF0ZUlkKCkpO1xuXG4gICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlKCk7XG4gIH1cblxuXG4gIC8vXG4gIGZ1bmN0aW9uIGNsZWFudXBBbmRUcmlnZ2VyU2lnbk91dCgpIHtcbiAgICByZXR1cm4gY2xlYW51cCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC50cmlnZ2VyKCdzaWdub3V0Jyk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIGRlcGVuZGluZyBvbiB3ZXRoZXIgdGhlIHVzZXIgc2lnbmVkVXAgbWFudWFsbHkgb3IgaGFzIGJlZW4gc2lnbmVkIHVwXG4gIC8vIGFub255bW91c2x5IHRoZSBwcmVmaXggaW4gdGhlIENvdWNoREIgX3VzZXJzIGRvYyBkaWZmZXJlbnRpYXRlcy5cbiAgLy8gQW4gYW5vbnltb3VzIHVzZXIgaXMgY2hhcmFjdGVyaXplZCBieSBpdHMgdXNlcm5hbWUsIHRoYXQgZXF1YWxzXG4gIC8vIGl0cyBvd25lckhhc2ggKHNlZSBgYW5vbnltb3VzU2lnblVwYClcbiAgLy9cbiAgLy8gV2UgZGlmZmVyZW50aWF0ZSB3aXRoIGBoYXNBbm9ueW1vdXNBY2NvdW50KClgLCBiZWNhdXNlIGB1c2VyVHlwZUFuZElkYFxuICAvLyBpcyB1c2VkIHdpdGhpbiBgc2lnblVwYCBtZXRob2QsIHNvIHdlIG5lZWQgdG8gYmUgYWJsZSB0byBkaWZmZXJlbnRpYXRlXG4gIC8vIGJldHdlZW4gYW5vbnltb3VzIGFuZCBub3JtYWwgdXNlcnMgYmVmb3JlIGFuIGFjY291bnQgaGFzIGJlZW4gY3JlYXRlZC5cbiAgLy9cbiAgZnVuY3Rpb24gdXNlclR5cGVBbmRJZCh1c2VybmFtZSkge1xuICAgIHZhciB0eXBlO1xuXG4gICAgaWYgKHVzZXJuYW1lID09PSBhY2NvdW50Lm93bmVySGFzaCkge1xuICAgICAgdHlwZSA9ICd1c2VyX2Fub255bW91cyc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHR5cGUgPSAndXNlcic7XG4gICAgfVxuICAgIHJldHVybiAnJyArIHR5cGUgKyAnLycgKyB1c2VybmFtZTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gdHVybiBhIHVzZXJuYW1lIGludG8gYSB2YWxpZCBfdXNlcnMgZG9jLl9pZFxuICAvL1xuICBmdW5jdGlvbiB1c2VyRG9jS2V5KHVzZXJuYW1lKSB7XG4gICAgdXNlcm5hbWUgPSB1c2VybmFtZSB8fCBhY2NvdW50LnVzZXJuYW1lO1xuICAgIHJldHVybiAnJyArIHVzZXJEb2NQcmVmaXggKyAnOicgKyAodXNlclR5cGVBbmRJZCh1c2VybmFtZSkpO1xuICB9XG5cbiAgLy9cbiAgLy8gZ2V0IFVSTCBvZiBteSBfdXNlcnMgZG9jXG4gIC8vXG4gIGZ1bmN0aW9uIHVzZXJEb2NVcmwodXNlcm5hbWUpIHtcbiAgICByZXR1cm4gJy9fdXNlcnMvJyArIChlbmNvZGVVUklDb21wb25lbnQodXNlckRvY0tleSh1c2VybmFtZSkpKTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gdXBkYXRlIG15IF91c2VycyBkb2MuXG4gIC8vXG4gIC8vIElmIGEgbmV3IHVzZXJuYW1lIGhhcyBiZWVuIHBhc3NlZCwgd2Ugc2V0IHRoZSBzcGVjaWFsIGF0dHJpYnV0ICRuZXdVc2VybmFtZS5cbiAgLy8gVGhpcyB3aWxsIGxldCB0aGUgdXNlcm5hbWUgY2hhbmdlIHdvcmtlciBjcmVhdGUgY3JlYXRlIGEgbmV3IF91c2VycyBkb2MgZm9yXG4gIC8vIHRoZSBuZXcgdXNlcm5hbWUgYW5kIHJlbW92ZSB0aGUgY3VycmVudCBvbmVcbiAgLy9cbiAgLy8gSWYgYSBuZXcgcGFzc3dvcmQgaGFzIGJlZW4gcGFzc2VkLCBzYWx0IGFuZCBwYXNzd29yZF9zaGEgZ2V0IHJlbW92ZWRcbiAgLy8gZnJvbSBfdXNlcnMgZG9jIGFuZCBhZGQgdGhlIHBhc3N3b3JkIGluIGNsZWFyIHRleHQuIENvdWNoREIgd2lsbCByZXBsYWNlIGl0IHdpdGhcbiAgLy8gYWNjb3JkaW5nIHBhc3N3b3JkX3NoYSBhbmQgYSBuZXcgc2FsdCBzZXJ2ZXIgc2lkZVxuICAvL1xuICBmdW5jdGlvbiBzZW5kQ2hhbmdlVXNlcm5hbWVBbmRQYXNzd29yZFJlcXVlc3QoY3VycmVudFBhc3N3b3JkLCBuZXdVc2VybmFtZSwgbmV3UGFzc3dvcmQpIHtcblxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIHByZXBhcmUgdXBkYXRlZCBfdXNlcnMgZG9jXG4gICAgICB2YXIgZGF0YSA9ICQuZXh0ZW5kKHt9LCB1c2VyRG9jKTtcblxuICAgICAgaWYgKG5ld1VzZXJuYW1lKSB7XG4gICAgICAgIGRhdGEuJG5ld1VzZXJuYW1lID0gbmV3VXNlcm5hbWU7XG4gICAgICB9XG5cbiAgICAgIGRhdGEudXBkYXRlZEF0ID0gbm93KCk7XG4gICAgICBkYXRhLnNpZ25lZFVwQXQgPSBkYXRhLnNpZ25lZFVwQXQgfHwgbm93KCk7XG5cbiAgICAgIC8vIHRyaWdnZXIgcGFzc3dvcmQgdXBkYXRlIHdoZW4gbmV3UGFzc3dvcmQgc2V0XG4gICAgICBpZiAobmV3UGFzc3dvcmQgIT09IG51bGwpIHtcbiAgICAgICAgZGVsZXRlIGRhdGEuc2FsdDtcbiAgICAgICAgZGVsZXRlIGRhdGEucGFzc3dvcmRfc2hhO1xuICAgICAgICBkYXRhLnBhc3N3b3JkID0gbmV3UGFzc3dvcmQ7XG4gICAgICB9XG5cbiAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgndXBkYXRlVXNlcnNEb2MnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnUFVUJywgdXNlckRvY1VybCgpLCBvcHRpb25zKS50aGVuKFxuICAgICAgICAgIGhhbmRsZUNoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmRSZXF1ZXN0KG5ld1VzZXJuYW1lLCBuZXdQYXNzd29yZCB8fCBjdXJyZW50UGFzc3dvcmQpXG4gICAgICAgICk7XG4gICAgICB9KTtcblxuICAgIH07XG4gIH1cblxuXG4gIC8vXG4gIC8vIGRlcGVuZGluZyBvbiB3aGV0aGVyIGEgbmV3VXNlcm5hbWUgaGFzIGJlZW4gcGFzc2VkLCB3ZSBjYW4gc2lnbiBpbiByaWdodCBhd2F5XG4gIC8vIG9yIGhhdmUgdG8gdXNlIHRoZSBkZWxheWVkIHNpZ24gaW4gdG8gZ2l2ZSB0aGUgdXNlcm5hbWUgY2hhbmdlIHdvcmtlciBzb21lIHRpbWVcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQ2hhbmdlVXNlcm5hbWVBbmRQYXNzd29yZFJlcXVlc3QobmV3VXNlcm5hbWUsIG5ld1Bhc3N3b3JkKSB7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBob29kaWUucmVtb3RlLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgaWYgKG5ld1VzZXJuYW1lKSB7XG4gICAgICAgIHJldHVybiBkZWxheWVkU2lnbkluKG5ld1VzZXJuYW1lLCBuZXdQYXNzd29yZCwge1xuICAgICAgICAgIHNpbGVudDogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBhY2NvdW50LnNpZ25JbihhY2NvdW50LnVzZXJuYW1lLCBuZXdQYXNzd29yZCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gbWFrZSBzdXJlIHRoYXQgdGhlIHNhbWUgcmVxdWVzdCBkb2Vzbid0IGdldCBzZW50IHR3aWNlXG4gIC8vIGJ5IGNhbmNlbGxpbmcgdGhlIHByZXZpb3VzIG9uZS5cbiAgLy9cbiAgZnVuY3Rpb24gd2l0aFByZXZpb3VzUmVxdWVzdHNBYm9ydGVkKG5hbWUsIHJlcXVlc3RGdW5jdGlvbikge1xuICAgIGlmIChyZXF1ZXN0c1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZW9mIHJlcXVlc3RzW25hbWVdLmFib3J0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJlcXVlc3RzW25hbWVdLmFib3J0KCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJlcXVlc3RzW25hbWVdID0gcmVxdWVzdEZ1bmN0aW9uKCk7XG4gICAgcmV0dXJuIHJlcXVlc3RzW25hbWVdO1xuICB9XG5cblxuICAvL1xuICAvLyBpZiB0aGVyZSBpcyBhIHBlbmRpbmcgcmVxdWVzdCwgcmV0dXJuIGl0cyBwcm9taXNlIGluc3RlYWRcbiAgLy8gb2Ygc2VuZGluZyBhbm90aGVyIHJlcXVlc3RcbiAgLy9cbiAgZnVuY3Rpb24gd2l0aFNpbmdsZVJlcXVlc3QobmFtZSwgcmVxdWVzdEZ1bmN0aW9uKSB7XG5cbiAgICBpZiAocmVxdWVzdHNbbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGVvZiByZXF1ZXN0c1tuYW1lXS5zdGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAocmVxdWVzdHNbbmFtZV0uc3RhdGUoKSA9PT0gJ3BlbmRpbmcnKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcXVlc3RzW25hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVxdWVzdHNbbmFtZV0gPSByZXF1ZXN0RnVuY3Rpb24oKTtcbiAgICByZXR1cm4gcmVxdWVzdHNbbmFtZV07XG4gIH1cblxuXG4gIC8vXG4gIC8vIHB1c2ggbG9jYWwgY2hhbmdlcyB3aGVuIHVzZXIgc2lnbnMgb3V0LCB1bmxlc3MgaGUgZW5mb3JjZXMgc2lnbiBvdXRcbiAgLy8gaW4gYW55IGNhc2Ugd2l0aCBge2lnbm9yZUxvY2FsQ2hhbmdlczogdHJ1ZX1gXG4gIC8vXG4gIGZ1bmN0aW9uIHB1c2hMb2NhbENoYW5nZXMob3B0aW9ucykge1xuICAgIGlmKGhvb2RpZS5zdG9yZS5oYXNMb2NhbENoYW5nZXMoKSAmJiAhb3B0aW9ucy5pZ25vcmVMb2NhbENoYW5nZXMpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVtb3RlLnB1c2goKTtcbiAgICB9XG4gICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlKCk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBzZW5kU2lnbk91dFJlcXVlc3QoKSB7XG4gICAgcmV0dXJuIHdpdGhTaW5nbGVSZXF1ZXN0KCdzaWduT3V0JywgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5yZXF1ZXN0KCdERUxFVEUnLCAnL19zZXNzaW9uJyk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIHRoZSBzaWduIGluIHJlcXVlc3QgdGhhdCBzdGFydHMgYSBDb3VjaERCIHNlc3Npb24gaWZcbiAgLy8gaXQgc3VjY2VlZHMuIFdlIHNlcGFyYXRlZCB0aGUgYWN0dWFsIHNpZ24gaW4gcmVxdWVzdCBmcm9tXG4gIC8vIHRoZSBzaWduSW4gbWV0aG9kLCBhcyB0aGUgbGF0dGVyIGFsc28gcnVucyBzaWduT3V0IGludGVucnRhbGx5XG4gIC8vIHRvIGNsZWFuIHVwIGxvY2FsIGRhdGEgYmVmb3JlIHN0YXJ0aW5nIGEgbmV3IHNlc3Npb24uIEJ1dCBhc1xuICAvLyBvdGhlciBtZXRob2RzIGxpa2Ugc2lnblVwIG9yIGNoYW5nZVBhc3N3b3JkIGRvIGFsc28gbmVlZCB0b1xuICAvLyBzaWduIGluIHRoZSB1c2VyIChhZ2FpbiksIHRoZXNlIG5lZWQgdG8gc2VuZCB0aGUgc2lnbiBpblxuICAvLyByZXF1ZXN0IGJ1dCB3aXRob3V0IGEgc2lnbk91dCBiZWZvcmVoYW5kLCBhcyB0aGUgdXNlciByZW1haW5zXG4gIC8vIHRoZSBzYW1lLlxuICAvL1xuICBmdW5jdGlvbiBzZW5kU2lnbkluUmVxdWVzdCh1c2VybmFtZSwgcGFzc3dvcmQsIG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxdWVzdE9wdGlvbnMgPSB7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIG5hbWU6IHVzZXJUeXBlQW5kSWQodXNlcm5hbWUpLFxuICAgICAgICBwYXNzd29yZDogcGFzc3dvcmRcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgnc2lnbkluJywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IGFjY291bnQucmVxdWVzdCgnUE9TVCcsICcvX3Nlc3Npb24nLCByZXF1ZXN0T3B0aW9ucyk7XG5cbiAgICAgIHJldHVybiBwcm9taXNlLnRoZW4oXG4gICAgICAgIGhhbmRsZVNpZ25JblN1Y2Nlc3Mob3B0aW9ucylcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBub3coKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCk7XG4gIH1cblxuICAvL1xuICAvLyBleHBvc2UgcHVibGljIGFjY291bnQgQVBJXG4gIC8vXG4gIGhvb2RpZS5hY2NvdW50ID0gYWNjb3VudDtcblxuICAvLyBUT0RPOiB3ZSBzaG91bGQgbW92ZSB0aGUgb3duZXIgaGFzaCBvbiBob29kaWUgY29yZSwgYXNcbiAgLy8gICAgICAgb3RoZXIgbW9kdWxlcyBkZXBlbmQgb24gaXQgYXMgd2VsbCwgbGlrZSBob29kaWUuc3RvcmUuXG4gIC8vIHRoZSBvd25lckhhc2ggZ2V0cyBzdG9yZWQgaW4gZXZlcnkgb2JqZWN0IGNyZWF0ZWQgYnkgdGhlIHVzZXIuXG4gIC8vIE1ha2Ugc3VyZSB3ZSBoYXZlIG9uZS5cbiAgaG9vZGllLmFjY291bnQub3duZXJIYXNoID0gaG9vZGllLmNvbmZpZy5nZXQoJ19hY2NvdW50Lm93bmVySGFzaCcpO1xuICBpZiAoIWhvb2RpZS5hY2NvdW50Lm93bmVySGFzaCkge1xuICAgIHNldE93bmVyKGhvb2RpZS5nZW5lcmF0ZUlkKCkpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllQWNjb3VudDtcbiIsIi8vIEFjY291bnRSZW1vdGVcbi8vID09PT09PT09PT09PT09PVxuXG4vLyBDb25uZWN0aW9uIC8gU29ja2V0IHRvIG91ciBjb3VjaFxuLy9cbi8vIEFjY291bnRSZW1vdGUgaXMgdXNpbmcgQ291Y2hEQidzIGBfY2hhbmdlc2AgZmVlZCB0b1xuLy8gbGlzdGVuIHRvIGNoYW5nZXMgYW5kIGBfYnVsa19kb2NzYCB0byBwdXNoIGxvY2FsIGNoYW5nZXNcbi8vXG4vLyBXaGVuIGhvb2RpZS5yZW1vdGUgaXMgY29udGludW91c2x5IHN5bmNpbmcgKGRlZmF1bHQpLFxuLy8gaXQgd2lsbCBjb250aW51b3VzbHkgIHN5bmNocm9uaXplIHdpdGggbG9jYWwgc3RvcmUsXG4vLyBvdGhlcndpc2Ugc3luYywgcHVsbCBvciBwdXNoIGNhbiBiZSBjYWxsZWQgbWFudWFsbHlcbi8vXG5cbmZ1bmN0aW9uIGhvb2RpZVJlbW90ZSAoaG9vZGllKSB7XG4gIC8vIGluaGVyaXQgZnJvbSBIb29kaWVzIFN0b3JlIEFQSVxuICB2YXIgcmVtb3RlID0gaG9vZGllLm9wZW4oaG9vZGllLmFjY291bnQuZGIoKSwge1xuXG4gICAgLy8gd2UncmUgYWx3YXlzIGNvbm5lY3RlZCB0byBvdXIgb3duIGRiXG4gICAgY29ubmVjdGVkOiB0cnVlLFxuXG4gICAgLy8gZG8gbm90IHByZWZpeCBmaWxlcyBmb3IgbXkgb3duIHJlbW90ZVxuICAgIHByZWZpeDogJycsXG5cbiAgICAvL1xuICAgIHNpbmNlOiBzaW5jZU5yQ2FsbGJhY2ssXG5cbiAgICAvL1xuICAgIGRlZmF1bHRPYmplY3RzVG9QdXNoOiBob29kaWUuc3RvcmUuY2hhbmdlZE9iamVjdHMsXG5cbiAgICAvL1xuICAgIGtub3duT2JqZWN0czogaG9vZGllLnN0b3JlLmluZGV4KCkubWFwKCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciB0eXBlQW5kSWQgPSBrZXkuc3BsaXQoL1xcLy8pO1xuICAgICAgcmV0dXJuIHsgdHlwZTogdHlwZUFuZElkWzBdLCBpZDogdHlwZUFuZElkWzFdfTtcbiAgICB9KVxuICB9KTtcblxuICAvLyBDb25uZWN0XG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHdlIHNsaWdodGx5IGV4dGVuZCB0aGUgb3JpZ2luYWwgcmVtb3RlLmNvbm5lY3QgbWV0aG9kXG4gIC8vIHByb3ZpZGVkIGJ5IGBob29kaWVSZW1vdGVTdG9yZWAsIHRvIGNoZWNrIGlmIHRoZSB1c2VyXG4gIC8vIGhhcyBhbiBhY2NvdW50IGJlZm9yZWhhbmQuIFdlIGFsc28gaGFyZGNvZGUgdGhlIHJpZ2h0XG4gIC8vIG5hbWUgZm9yIHJlbW90ZSAoY3VycmVudCB1c2VyJ3MgZGF0YWJhc2UgbmFtZSlcbiAgLy9cbiAgdmFyIG9yaWdpbmFsQ29ubmVjdE1ldGhvZCA9IHJlbW90ZS5jb25uZWN0O1xuICByZW1vdGUuY29ubmVjdCA9IGZ1bmN0aW9uIGNvbm5lY3QoKSB7XG4gICAgaWYgKCEgaG9vZGllLmFjY291bnQuaGFzQWNjb3VudCgpICkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKCdVc2VyIGhhcyBubyBkYXRhYmFzZSB0byBjb25uZWN0IHRvJyk7XG4gICAgfVxuICAgIHJldHVybiBvcmlnaW5hbENvbm5lY3RNZXRob2QoIGhvb2RpZS5hY2NvdW50LmRiKCkgKTtcbiAgfTtcblxuICAvLyB0cmlnZ2VyXG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHByb3hpZXMgdG8gaG9vZGllLnRyaWdnZXJcbiAgcmVtb3RlLnRyaWdnZXIgPSBmdW5jdGlvbiB0cmlnZ2VyKCkge1xuICAgIHZhciBldmVudE5hbWU7XG5cbiAgICBldmVudE5hbWUgPSBhcmd1bWVudHNbMF07XG5cbiAgICB2YXIgcGFyYW1ldGVycyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcblxuICAgIHJldHVybiBob29kaWUudHJpZ2dlci5hcHBseShob29kaWUsIFsncmVtb3RlOicgKyBldmVudE5hbWVdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChwYXJhbWV0ZXJzKSkpO1xuICB9O1xuXG5cbiAgLy8gb25cbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gcHJveGllcyB0byBob29kaWUub25cbiAgcmVtb3RlLm9uID0gZnVuY3Rpb24gb24oZXZlbnROYW1lLCBkYXRhKSB7XG4gICAgZXZlbnROYW1lID0gZXZlbnROYW1lLnJlcGxhY2UoLyhefCApKFteIF0rKS9nLCAnJDEnKydyZW1vdGU6JDInKTtcbiAgICByZXR1cm4gaG9vZGllLm9uKGV2ZW50TmFtZSwgZGF0YSk7XG4gIH07XG5cblxuICAvLyB1bmJpbmRcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gcHJveGllcyB0byBob29kaWUudW5iaW5kXG4gIHJlbW90ZS51bmJpbmQgPSBmdW5jdGlvbiB1bmJpbmQoZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICAgIGV2ZW50TmFtZSA9IGV2ZW50TmFtZS5yZXBsYWNlKC8oXnwgKShbXiBdKykvZywgJyQxJysncmVtb3RlOiQyJyk7XG4gICAgcmV0dXJuIGhvb2RpZS51bmJpbmQoZXZlbnROYW1lLCBjYWxsYmFjayk7XG4gIH07XG5cblxuICAvLyBQcml2YXRlXG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIGdldHRlciAvIHNldHRlciBmb3Igc2luY2UgbnVtYmVyXG4gIC8vXG4gIGZ1bmN0aW9uIHNpbmNlTnJDYWxsYmFjayhzaW5jZU5yKSB7XG4gICAgaWYgKHNpbmNlTnIpIHtcbiAgICAgIHJldHVybiBob29kaWUuY29uZmlnLnNldCgnX3JlbW90ZS5zaW5jZScsIHNpbmNlTnIpO1xuICAgIH1cblxuICAgIHJldHVybiBob29kaWUuY29uZmlnLmdldCgnX3JlbW90ZS5zaW5jZScpIHx8IDA7XG4gIH1cblxuICAvL1xuICAvLyBzdWJzY3JpYmUgdG8gZXZlbnRzIGNvbWluZyBmcm9tIG91dHNpZGVcbiAgLy9cbiAgZnVuY3Rpb24gc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCkge1xuXG4gICAgaG9vZGllLm9uKCdyZW1vdGU6Y29ubmVjdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgaG9vZGllLm9uKCdzdG9yZTppZGxlJywgcmVtb3RlLnB1c2gpO1xuICAgICAgcmVtb3RlLnB1c2goKTtcbiAgICB9KTtcblxuICAgIGhvb2RpZS5vbigncmVtb3RlOmRpc2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcbiAgICAgIGhvb2RpZS51bmJpbmQoJ3N0b3JlOmlkbGUnLCByZW1vdGUucHVzaCk7XG4gICAgfSk7XG5cbiAgICBob29kaWUub24oJ2Rpc2Nvbm5lY3RlZCcsIHJlbW90ZS5kaXNjb25uZWN0KTtcbiAgICBob29kaWUub24oJ3JlY29ubmVjdGVkJywgcmVtb3RlLmNvbm5lY3QpO1xuXG4gICAgLy8gYWNjb3VudCBldmVudHNcbiAgICBob29kaWUub24oJ2FjY291bnQ6c2lnbmluJywgcmVtb3RlLmNvbm5lY3QpO1xuICAgIGhvb2RpZS5vbignYWNjb3VudDpzaWduaW46YW5vbnltb3VzJywgcmVtb3RlLmNvbm5lY3QpO1xuXG4gICAgaG9vZGllLm9uKCdhY2NvdW50OnJlYXV0aGVudGljYXRlZCcsIHJlbW90ZS5jb25uZWN0KTtcbiAgICBob29kaWUub24oJ2FjY291bnQ6c2lnbm91dCcsIHJlbW90ZS5kaXNjb25uZWN0KTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9uY2UgZnJvbSBvdXRzaWRlXG4gIHJlbW90ZS5zdWJzY3JpYmVUb091dHNpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKTtcbiAgICBkZWxldGUgcmVtb3RlLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cztcbiAgfTtcblxuICAvL1xuICAvLyBleHBvc2UgcmVtb3RlIEFQSVxuICAvL1xuICBob29kaWUucmVtb3RlID0gcmVtb3RlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVJlbW90ZTtcbiIsIi8vIEhvb2RpZSBDb25maWcgQVBJXG4vLyA9PT09PT09PT09PT09PT09PT09XG5cbi8vXG5mdW5jdGlvbiBob29kaWVDb25maWcoaG9vZGllKSB7XG5cbiAgdmFyIHR5cGUgPSAnJGNvbmZpZyc7XG4gIHZhciBpZCA9ICdob29kaWUnO1xuICB2YXIgY2FjaGUgPSB7fTtcblxuICAvLyBwdWJsaWMgQVBJXG4gIHZhciBjb25maWcgPSB7fTtcblxuXG4gIC8vIHNldFxuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy8gYWRkcyBhIGNvbmZpZ3VyYXRpb25cbiAgLy9cbiAgY29uZmlnLnNldCA9IGZ1bmN0aW9uIHNldChrZXksIHZhbHVlKSB7XG4gICAgdmFyIGlzU2lsZW50LCB1cGRhdGU7XG5cbiAgICBpZiAoY2FjaGVba2V5XSA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjYWNoZVtrZXldID0gdmFsdWU7XG5cbiAgICB1cGRhdGUgPSB7fTtcbiAgICB1cGRhdGVba2V5XSA9IHZhbHVlO1xuICAgIGlzU2lsZW50ID0ga2V5LmNoYXJBdCgwKSA9PT0gJ18nO1xuXG4gICAgcmV0dXJuIGhvb2RpZS5zdG9yZS51cGRhdGVPckFkZCh0eXBlLCBpZCwgdXBkYXRlLCB7XG4gICAgICBzaWxlbnQ6IGlzU2lsZW50XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gZ2V0XG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyByZWNlaXZlcyBhIGNvbmZpZ3VyYXRpb25cbiAgLy9cbiAgY29uZmlnLmdldCA9IGZ1bmN0aW9uIGdldChrZXkpIHtcbiAgICByZXR1cm4gY2FjaGVba2V5XTtcbiAgfTtcblxuICAvLyBjbGVhclxuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy8gY2xlYXJzIGNhY2hlIGFuZCByZW1vdmVzIG9iamVjdCBmcm9tIHN0b3JlXG4gIC8vXG4gIGNvbmZpZy5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIGNhY2hlID0ge307XG4gICAgcmV0dXJuIGhvb2RpZS5zdG9yZS5yZW1vdmUodHlwZSwgaWQpO1xuICB9O1xuXG4gIC8vIHVuc2V0XG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyB1bnNldHMgYSBjb25maWd1cmF0aW9uLCBpcyBhIHNpbXBsZSBhbGlhcyBmb3IgY29uZmlnLnNldChrZXksIHVuZGVmaW5lZClcbiAgLy9cbiAgY29uZmlnLnVuc2V0ID0gZnVuY3Rpb24gdW5zZXQoa2V5KSB7XG4gICAgcmV0dXJuIGNvbmZpZy5zZXQoa2V5LCB1bmRlZmluZWQpO1xuICB9O1xuXG4gIC8vIGxvYWQgY2FjaGVcbiAgLy8gVE9ETzogSSByZWFsbHkgZG9uJ3QgbGlrZSB0aGlzIGJlaW5nIGhlcmUuIEFuZCBJIGRvbid0IGxpa2UgdGhhdCBpZiB0aGVcbiAgLy8gICAgICAgc3RvcmUgQVBJIHdpbGwgYmUgdHJ1bHkgYXN5bmMgb25lIGRheSwgdGhpcyB3aWxsIGZhbGwgb24gb3VyIGZlZXQuXG4gIGhvb2RpZS5zdG9yZS5maW5kKHR5cGUsIGlkKS5kb25lKGZ1bmN0aW9uKG9iaikge1xuICAgIGNhY2hlID0gb2JqO1xuICB9KTtcblxuICAvLyBleHNwb3NlIHB1YmxpYyBBUElcbiAgaG9vZGllLmNvbmZpZyA9IGNvbmZpZztcblxuICAvL1xuICAvLyBzdWJzY3JpYmUgdG8gZXZlbnRzIGNvbWluZyBmcm9tIGFjY291bnQgJiBvdXIgcmVtb3RlIHN0b3JlLlxuICAvL1xuICBmdW5jdGlvbiBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKSB7XG5cbiAgICAvLyBhY2NvdW50IGV2ZW50c1xuICAgIGhvb2RpZS5vbignYWNjb3VudDpjbGVhbnVwJywgY29uZmlnLmNsZWFyKTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9uY2UgZnJvbSBvdXRzaWRlXG4gIGNvbmZpZy5zdWJzY3JpYmVUb091dHNpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKTtcbiAgICBkZWxldGUgY29uZmlnLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cztcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVDb25maWc7XG4iLCIvLyBob29kaWUuY2hlY2tDb25uZWN0aW9uKCkgJiBob29kaWUuaXNDb25uZWN0ZWQoKVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4vL1xuZnVuY3Rpb24gaG9vZGllQ29ubmVjdGlvbihob29kaWUpIHtcbiAgLy8gc3RhdGVcbiAgdmFyIG9ubGluZSA9IHRydWU7XG4gIHZhciBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCA9IDMwMDAwO1xuICB2YXIgY2hlY2tDb25uZWN0aW9uUmVxdWVzdCA9IG51bGw7XG4gIHZhciBjaGVja0Nvbm5lY3Rpb25UaW1lb3V0ID0gbnVsbDtcblxuICAvLyBDaGVjayBDb25uZWN0aW9uXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHRoZSBgY2hlY2tDb25uZWN0aW9uYCBtZXRob2QgaXMgdXNlZCwgd2VsbCwgdG8gY2hlY2sgaWZcbiAgLy8gdGhlIGhvb2RpZSBiYWNrZW5kIGlzIHJlYWNoYWJsZSBhdCBgYmFzZVVybGAgb3Igbm90LlxuICAvLyBDaGVjayBDb25uZWN0aW9uIGlzIGF1dG9tYXRpY2FsbHkgY2FsbGVkIG9uIHN0YXJ0dXBcbiAgLy8gYW5kIHRoZW4gZWFjaCAzMCBzZWNvbmRzLiBJZiBpdCBmYWlscywgaXRcbiAgLy9cbiAgLy8gLSBzZXRzIGBvbmxpbmUgPSBmYWxzZWBcbiAgLy8gLSB0cmlnZ2VycyBgb2ZmbGluZWAgZXZlbnRcbiAgLy8gLSBzZXRzIGBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCA9IDMwMDBgXG4gIC8vXG4gIC8vIHdoZW4gY29ubmVjdGlvbiBjYW4gYmUgcmVlc3RhYmxpc2hlZCwgaXRcbiAgLy9cbiAgLy8gLSBzZXRzIGBvbmxpbmUgPSB0cnVlYFxuICAvLyAtIHRyaWdnZXJzIGBvbmxpbmVgIGV2ZW50XG4gIC8vIC0gc2V0cyBgY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwgPSAzMDAwMGBcbiAgLy9cbiAgaG9vZGllLmNoZWNrQ29ubmVjdGlvbiA9IGZ1bmN0aW9uIGNoZWNrQ29ubmVjdGlvbigpIHtcbiAgICB2YXIgcmVxID0gY2hlY2tDb25uZWN0aW9uUmVxdWVzdDtcblxuICAgIGlmIChyZXEgJiYgcmVxLnN0YXRlKCkgPT09ICdwZW5kaW5nJykge1xuICAgICAgcmV0dXJuIHJlcTtcbiAgICB9XG5cbiAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KGNoZWNrQ29ubmVjdGlvblRpbWVvdXQpO1xuXG4gICAgY2hlY2tDb25uZWN0aW9uUmVxdWVzdCA9IGhvb2RpZS5yZXF1ZXN0KCdHRVQnLCAnLycpLnRoZW4oXG4gICAgICBoYW5kbGVDaGVja0Nvbm5lY3Rpb25TdWNjZXNzLFxuICAgICAgaGFuZGxlQ2hlY2tDb25uZWN0aW9uRXJyb3JcbiAgICApO1xuXG4gICAgcmV0dXJuIGNoZWNrQ29ubmVjdGlvblJlcXVlc3Q7XG4gIH07XG5cblxuICAvLyBpc0Nvbm5lY3RlZFxuICAvLyAtLS0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgaG9vZGllLmlzQ29ubmVjdGVkID0gZnVuY3Rpb24gaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIG9ubGluZTtcbiAgfTtcblxuXG4gIC8vXG4gIC8vXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZUNoZWNrQ29ubmVjdGlvblN1Y2Nlc3MoKSB7XG4gICAgY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwgPSAzMDAwMDtcblxuICAgIGNoZWNrQ29ubmVjdGlvblRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dChob29kaWUuY2hlY2tDb25uZWN0aW9uLCBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCk7XG5cbiAgICBpZiAoIWhvb2RpZS5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgICBob29kaWUudHJpZ2dlcigncmVjb25uZWN0ZWQnKTtcbiAgICAgIG9ubGluZSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlKCk7XG4gIH1cblxuXG4gIC8vXG4gIC8vXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZUNoZWNrQ29ubmVjdGlvbkVycm9yKCkge1xuICAgIGNoZWNrQ29ubmVjdGlvbkludGVydmFsID0gMzAwMDtcblxuICAgIGNoZWNrQ29ubmVjdGlvblRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dChob29kaWUuY2hlY2tDb25uZWN0aW9uLCBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCk7XG5cbiAgICBpZiAoaG9vZGllLmlzQ29ubmVjdGVkKCkpIHtcbiAgICAgIGhvb2RpZS50cmlnZ2VyKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgIG9ubGluZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBob29kaWUucmVqZWN0KCk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVDb25uZWN0aW9uO1xuIiwiLy8gaG9vZGllLmRpc3Bvc2Vcbi8vID09PT09PT09PT09PT09PT1cblxuZnVuY3Rpb24gaG9vZGllRGlzcG9zZSAoaG9vZGllKSB7XG5cbiAgLy8gaWYgYSBob29kaWUgaW5zdGFuY2UgaXMgbm90IG5lZWRlZCBhbnltb3JlLCBpdCBjYW5cbiAgLy8gYmUgZGlzcG9zZWQgdXNpbmcgdGhpcyBtZXRob2QuIEEgYGRpc3Bvc2VgIGV2ZW50XG4gIC8vIGdldHMgdHJpZ2dlcmVkIHRoYXQgdGhlIG1vZHVsZXMgcmVhY3Qgb24uXG4gIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgaG9vZGllLnRyaWdnZXIoJ2Rpc3Bvc2UnKTtcbiAgICBob29kaWUudW5iaW5kKCk7XG4gIH1cblxuICAvL1xuICAvLyBQdWJsaWMgQVBJXG4gIC8vXG4gIGhvb2RpZS5kaXNwb3NlID0gZGlzcG9zZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVEaXNwb3NlO1xuIiwiLy8gSG9vZGllIEVycm9yXG4vLyAtLS0tLS0tLS0tLS0tXG5cbi8vIFdpdGggdGhlIGN1c3RvbSBob29kaWUgZXJyb3IgZnVuY3Rpb25cbi8vIHdlIG5vcm1hbGl6ZSBhbGwgZXJyb3JzIHRoZSBnZXQgcmV0dXJuZWRcbi8vIHdoZW4gdXNpbmcgaG9vZGllLnJlamVjdFdpdGhcbi8vXG4vLyBUaGUgbmF0aXZlIEphdmFTY3JpcHQgZXJyb3IgbWV0aG9kIGhhc1xuLy8gYSBuYW1lICYgYSBtZXNzYWdlIHByb3BlcnR5LiBIb29kaWVFcnJvclxuLy8gcmVxdWlyZXMgdGhlc2UsIGJ1dCBvbiB0b3AgYWxsb3dzIGZvclxuLy8gdW5saW1pdGVkIGN1c3RvbSBwcm9wZXJ0aWVzLlxuLy9cbi8vIEluc3RlYWQgb2YgYmVpbmcgaW5pdGlhbGl6ZWQgd2l0aCBqdXN0XG4vLyB0aGUgbWVzc2FnZSwgSG9vZGllRXJyb3IgZXhwZWN0cyBhblxuLy8gb2JqZWN0IHdpdGggcHJvcGVyaXRlcy4gVGhlIGBtZXNzYWdlYFxuLy8gcHJvcGVydHkgaXMgcmVxdWlyZWQuIFRoZSBuYW1lIHdpbGxcbi8vIGZhbGxiYWNrIHRvIGBlcnJvcmAuXG4vL1xuLy8gYG1lc3NhZ2VgIGNhbiBhbHNvIGNvbnRhaW4gcGxhY2Vob2xkZXJzXG4vLyBpbiB0aGUgZm9ybSBvZiBge3twcm9wZXJ0eU5hbWV9fWBgIHdoaWNoXG4vLyB3aWxsIGdldCByZXBsYWNlZCBhdXRvbWF0aWNhbGx5IHdpdGggcGFzc2VkXG4vLyBleHRyYSBwcm9wZXJ0aWVzLlxuLy9cbi8vICMjIyBFcnJvciBDb252ZW50aW9uc1xuLy9cbi8vIFdlIGZvbGxvdyBKYXZhU2NyaXB0J3MgbmF0aXZlIGVycm9yIGNvbnZlbnRpb25zLFxuLy8gbWVhbmluZyB0aGF0IGVycm9yIG5hbWVzIGFyZSBjYW1lbENhc2Ugd2l0aCB0aGVcbi8vIGZpcnN0IGxldHRlciB1cHBlcmNhc2UgYXMgd2VsbCwgYW5kIHRoZSBtZXNzYWdlXG4vLyBzdGFydGluZyB3aXRoIGFuIHVwcGVyY2FzZSBsZXR0ZXIuXG4vL1xudmFyIGVycm9yTWVzc2FnZVJlcGxhY2VQYXR0ZXJuID0gL1xce1xce1xccypcXHcrXFxzKlxcfVxcfS9nO1xudmFyIGVycm9yTWVzc2FnZUZpbmRQcm9wZXJ0eVBhdHRlcm4gPSAvXFx3Ky87XG5mdW5jdGlvbiBIb29kaWVFcnJvcihwcm9wZXJ0aWVzKSB7XG5cbiAgLy8gbm9ybWFsaXplIGFyZ3VtZW50c1xuICBpZiAodHlwZW9mIHByb3BlcnRpZXMgPT09ICdzdHJpbmcnKSB7XG4gICAgcHJvcGVydGllcyA9IHtcbiAgICAgIG1lc3NhZ2U6IHByb3BlcnRpZXNcbiAgICB9O1xuICB9XG5cbiAgaWYgKCEgcHJvcGVydGllcy5tZXNzYWdlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdGQVRBTDogZXJyb3IubWVzc2FnZSBtdXN0IGJlIHNldCcpO1xuICB9XG5cbiAgLy8gbXVzdCBjaGVjayBmb3IgcHJvcGVydGllcywgYXMgdGhpcy5uYW1lIGlzIGFsd2F5cyBzZXQuXG4gIGlmICghIHByb3BlcnRpZXMubmFtZSkge1xuICAgIHByb3BlcnRpZXMubmFtZSA9ICdIb29kaWVFcnJvcic7XG4gIH1cblxuICBwcm9wZXJ0aWVzLm1lc3NhZ2UgPSBwcm9wZXJ0aWVzLm1lc3NhZ2UucmVwbGFjZShlcnJvck1lc3NhZ2VSZXBsYWNlUGF0dGVybiwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICB2YXIgcHJvcGVydHkgPSBtYXRjaC5tYXRjaChlcnJvck1lc3NhZ2VGaW5kUHJvcGVydHlQYXR0ZXJuKVswXTtcbiAgICByZXR1cm4gcHJvcGVydGllc1twcm9wZXJ0eV07XG4gIH0pO1xuXG4gICQuZXh0ZW5kKHRoaXMsIHByb3BlcnRpZXMpO1xufVxuSG9vZGllRXJyb3IucHJvdG90eXBlID0gbmV3IEVycm9yKCk7XG5Ib29kaWVFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBIb29kaWVFcnJvcjtcblxubW9kdWxlLmV4cG9ydHMgPSBIb29kaWVFcnJvcjtcbiIsIi8vIEhvb2RpZSBJbnZhbGlkIFR5cGUgT3IgSWQgRXJyb3Jcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gb25seSBsb3dlcmNhc2UgbGV0dGVycywgbnVtYmVycyBhbmQgZGFzaGVzXG4vLyBhcmUgYWxsb3dlZCBmb3Igb2JqZWN0IElEcy5cbi8vXG52YXIgSG9vZGllRXJyb3IgPSByZXF1aXJlKCcuLi9lcnJvcicpO1xuXG4vL1xuZnVuY3Rpb24gSG9vZGllT2JqZWN0SWRFcnJvcihwcm9wZXJ0aWVzKSB7XG4gIHByb3BlcnRpZXMubmFtZSA9ICdIb29kaWVPYmplY3RJZEVycm9yJztcbiAgcHJvcGVydGllcy5tZXNzYWdlID0gJ1wie3tpZH19XCIgaXMgaW52YWxpZCBvYmplY3QgaWQuIHt7cnVsZXN9fS4nO1xuXG4gIHJldHVybiBuZXcgSG9vZGllRXJyb3IocHJvcGVydGllcyk7XG59XG52YXIgdmFsaWRJZFBhdHRlcm4gPSAvXlthLXowLTlcXC1dKyQvO1xuSG9vZGllT2JqZWN0SWRFcnJvci5pc0ludmFsaWQgPSBmdW5jdGlvbihpZCwgY3VzdG9tUGF0dGVybikge1xuICByZXR1cm4gISAoY3VzdG9tUGF0dGVybiB8fCB2YWxpZElkUGF0dGVybikudGVzdChpZCB8fCAnJyk7XG59O1xuSG9vZGllT2JqZWN0SWRFcnJvci5pc1ZhbGlkID0gZnVuY3Rpb24oaWQsIGN1c3RvbVBhdHRlcm4pIHtcbiAgcmV0dXJuIChjdXN0b21QYXR0ZXJuIHx8IHZhbGlkSWRQYXR0ZXJuKS50ZXN0KGlkIHx8ICcnKTtcbn07XG5Ib29kaWVPYmplY3RJZEVycm9yLnByb3RvdHlwZS5ydWxlcyA9ICdMb3dlcmNhc2UgbGV0dGVycywgbnVtYmVycyBhbmQgZGFzaGVzIGFsbG93ZWQgb25seS4gTXVzdCBzdGFydCB3aXRoIGEgbGV0dGVyJztcblxubW9kdWxlLmV4cG9ydHMgPSBIb29kaWVPYmplY3RJZEVycm9yO1xuIiwiLy8gSG9vZGllIEludmFsaWQgVHlwZSBPciBJZCBFcnJvclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBvbmx5IGxvd2VyY2FzZSBsZXR0ZXJzLCBudW1iZXJzIGFuZCBkYXNoZXNcbi8vIGFyZSBhbGxvd2VkIGZvciBvYmplY3QgdHlwZXMsIHBsdXMgbXVzdCBzdGFydFxuLy8gd2l0aCBhIGxldHRlci5cbi8vXG52YXIgSG9vZGllRXJyb3IgPSByZXF1aXJlKCcuLi9lcnJvcicpO1xuXG4vL1xuZnVuY3Rpb24gSG9vZGllT2JqZWN0VHlwZUVycm9yKHByb3BlcnRpZXMpIHtcbiAgcHJvcGVydGllcy5uYW1lID0gJ0hvb2RpZU9iamVjdFR5cGVFcnJvcic7XG4gIHByb3BlcnRpZXMubWVzc2FnZSA9ICdcInt7dHlwZX19XCIgaXMgaW52YWxpZCBvYmplY3QgdHlwZS4ge3tydWxlc319Lic7XG5cbiAgcmV0dXJuIG5ldyBIb29kaWVFcnJvcihwcm9wZXJ0aWVzKTtcbn1cbnZhciB2YWxpZFR5cGVQYXR0ZXJuID0gL15bYS16JF1bYS16MC05XSskLztcbkhvb2RpZU9iamVjdFR5cGVFcnJvci5pc0ludmFsaWQgPSBmdW5jdGlvbih0eXBlLCBjdXN0b21QYXR0ZXJuKSB7XG4gIHJldHVybiAhIChjdXN0b21QYXR0ZXJuIHx8IHZhbGlkVHlwZVBhdHRlcm4pLnRlc3QodHlwZSB8fCAnJyk7XG59O1xuSG9vZGllT2JqZWN0VHlwZUVycm9yLmlzVmFsaWQgPSBmdW5jdGlvbih0eXBlLCBjdXN0b21QYXR0ZXJuKSB7XG4gIHJldHVybiAoY3VzdG9tUGF0dGVybiB8fCB2YWxpZFR5cGVQYXR0ZXJuKS50ZXN0KHR5cGUgfHwgJycpO1xufTtcbkhvb2RpZU9iamVjdFR5cGVFcnJvci5wcm90b3R5cGUucnVsZXMgPSAnbG93ZXJjYXNlIGxldHRlcnMsIG51bWJlcnMgYW5kIGRhc2hlcyBhbGxvd2VkIG9ubHkuIE11c3Qgc3RhcnQgd2l0aCBhIGxldHRlcic7XG5cbm1vZHVsZS5leHBvcnRzID0gSG9vZGllT2JqZWN0VHlwZUVycm9yO1xuIiwiLy8gRXZlbnRzXG4vLyA9PT09PT09PVxuLy9cbi8vIGV4dGVuZCBhbnkgQ2xhc3Mgd2l0aCBzdXBwb3J0IGZvclxuLy9cbi8vICogYG9iamVjdC5iaW5kKCdldmVudCcsIGNiKWBcbi8vICogYG9iamVjdC51bmJpbmQoJ2V2ZW50JywgY2IpYFxuLy8gKiBgb2JqZWN0LnRyaWdnZXIoJ2V2ZW50JywgYXJncy4uLilgXG4vLyAqIGBvYmplY3Qub25lKCdldicsIGNiKWBcbi8vXG4vLyBiYXNlZCBvbiBbRXZlbnRzIGltcGxlbWVudGF0aW9ucyBmcm9tIFNwaW5lXShodHRwczovL2dpdGh1Yi5jb20vbWFjY21hbi9zcGluZS9ibG9iL21hc3Rlci9zcmMvc3BpbmUuY29mZmVlI0wxKVxuLy9cblxuLy8gY2FsbGJhY2tzIGFyZSBnbG9iYWwsIHdoaWxlIHRoZSBldmVudHMgQVBJIGlzIHVzZWQgYXQgc2V2ZXJhbCBwbGFjZXMsXG4vLyBsaWtlIGhvb2RpZS5vbiAvIGhvb2RpZS5zdG9yZS5vbiAvIGhvb2RpZS50YXNrLm9uIGV0Yy5cbi8vXG5cbmZ1bmN0aW9uIGhvb2RpZUV2ZW50cyhob29kaWUsIG9wdGlvbnMpIHtcbiAgdmFyIGNvbnRleHQgPSBob29kaWU7XG4gIHZhciBuYW1lc3BhY2UgPSAnJztcblxuICAvLyBub3JtYWxpemUgb3B0aW9ucyBoYXNoXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIC8vIG1ha2Ugc3VyZSBjYWxsYmFja3MgaGFzaCBleGlzdHNcbiAgaWYgKCFob29kaWUuZXZlbnRzQ2FsbGJhY2tzKSB7XG4gICAgaG9vZGllLmV2ZW50c0NhbGxiYWNrcyA9IHt9O1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuY29udGV4dCkge1xuICAgIGNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQ7XG4gICAgbmFtZXNwYWNlID0gb3B0aW9ucy5uYW1lc3BhY2UgKyAnOic7XG4gIH1cblxuICAvLyBCaW5kXG4gIC8vIC0tLS0tLVxuICAvL1xuICAvLyBiaW5kIGEgY2FsbGJhY2sgdG8gYW4gZXZlbnQgdHJpZ2dlcmQgYnkgdGhlIG9iamVjdFxuICAvL1xuICAvLyAgICAgb2JqZWN0LmJpbmQgJ2NoZWF0JywgYmxhbWVcbiAgLy9cbiAgZnVuY3Rpb24gYmluZChldiwgY2FsbGJhY2spIHtcbiAgICB2YXIgZXZzLCBuYW1lLCBfaSwgX2xlbjtcblxuICAgIGV2cyA9IGV2LnNwbGl0KCcgJyk7XG5cbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGV2cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgbmFtZSA9IG5hbWVzcGFjZSArIGV2c1tfaV07XG4gICAgICBob29kaWUuZXZlbnRzQ2FsbGJhY2tzW25hbWVdID0gaG9vZGllLmV2ZW50c0NhbGxiYWNrc1tuYW1lXSB8fCBbXTtcbiAgICAgIGhvb2RpZS5ldmVudHNDYWxsYmFja3NbbmFtZV0ucHVzaChjYWxsYmFjayk7XG4gICAgfVxuICB9XG5cbiAgLy8gb25lXG4gIC8vIC0tLS0tXG4gIC8vXG4gIC8vIHNhbWUgYXMgYGJpbmRgLCBidXQgZG9lcyBnZXQgZXhlY3V0ZWQgb25seSBvbmNlXG4gIC8vXG4gIC8vICAgICBvYmplY3Qub25lICdncm91bmRUb3VjaCcsIGdhbWVPdmVyXG4gIC8vXG4gIGZ1bmN0aW9uIG9uZShldiwgY2FsbGJhY2spIHtcbiAgICBldiA9IG5hbWVzcGFjZSArIGV2O1xuICAgIHZhciB3cmFwcGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICBob29kaWUudW5iaW5kKGV2LCB3cmFwcGVyKTtcbiAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBob29kaWUuYmluZChldiwgd3JhcHBlcik7XG4gIH1cblxuICAvLyB0cmlnZ2VyXG4gIC8vIC0tLS0tLS0tLVxuICAvL1xuICAvLyB0cmlnZ2VyIGFuIGV2ZW50IGFuZCBwYXNzIG9wdGlvbmFsIHBhcmFtZXRlcnMgZm9yIGJpbmRpbmcuXG4gIC8vICAgICBvYmplY3QudHJpZ2dlciAnd2luJywgc2NvcmU6IDEyMzBcbiAgLy9cbiAgZnVuY3Rpb24gdHJpZ2dlcigpIHtcbiAgICB2YXIgYXJncywgY2FsbGJhY2ssIGV2LCBsaXN0LCBfaSwgX2xlbjtcblxuICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgZXYgPSBhcmdzLnNoaWZ0KCk7XG4gICAgZXYgPSBuYW1lc3BhY2UgKyBldjtcbiAgICBsaXN0ID0gaG9vZGllLmV2ZW50c0NhbGxiYWNrc1tldl07XG5cbiAgICBpZiAoIWxpc3QpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGxpc3QubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGNhbGxiYWNrID0gbGlzdFtfaV07XG4gICAgICBjYWxsYmFjay5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIHVuYmluZFxuICAvLyAtLS0tLS0tLVxuICAvL1xuICAvLyB1bmJpbmQgdG8gZnJvbSBhbGwgYmluZGluZ3MsIGZyb20gYWxsIGJpbmRpbmdzIG9mIGEgc3BlY2lmaWMgZXZlbnRcbiAgLy8gb3IgZnJvbSBhIHNwZWNpZmljIGJpbmRpbmcuXG4gIC8vXG4gIC8vICAgICBvYmplY3QudW5iaW5kKClcbiAgLy8gICAgIG9iamVjdC51bmJpbmQgJ21vdmUnXG4gIC8vICAgICBvYmplY3QudW5iaW5kICdtb3ZlJywgZm9sbG93XG4gIC8vXG4gIGZ1bmN0aW9uIHVuYmluZChldiwgY2FsbGJhY2spIHtcbiAgICB2YXIgY2IsIGksIGxpc3QsIF9pLCBfbGVuLCBldk5hbWVzO1xuXG4gICAgaWYgKCFldikge1xuICAgICAgaWYgKCFuYW1lc3BhY2UpIHtcbiAgICAgICAgaG9vZGllLmV2ZW50c0NhbGxiYWNrcyA9IHt9O1xuICAgICAgfVxuXG4gICAgICBldk5hbWVzID0gT2JqZWN0LmtleXMoaG9vZGllLmV2ZW50c0NhbGxiYWNrcyk7XG4gICAgICBldk5hbWVzID0gZXZOYW1lcy5maWx0ZXIoZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHJldHVybiBrZXkuaW5kZXhPZihuYW1lc3BhY2UpID09PSAwO1xuICAgICAgfSk7XG4gICAgICBldk5hbWVzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIGRlbGV0ZSBob29kaWUuZXZlbnRzQ2FsbGJhY2tzW2tleV07XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGV2ID0gbmFtZXNwYWNlICsgZXY7XG5cbiAgICBsaXN0ID0gaG9vZGllLmV2ZW50c0NhbGxiYWNrc1tldl07XG5cbiAgICBpZiAoIWxpc3QpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICBkZWxldGUgaG9vZGllLmV2ZW50c0NhbGxiYWNrc1tldl07XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChpID0gX2kgPSAwLCBfbGVuID0gbGlzdC5sZW5ndGg7IF9pIDwgX2xlbjsgaSA9ICsrX2kpIHtcbiAgICAgIGNiID0gbGlzdFtpXTtcblxuXG4gICAgICBpZiAoY2IgIT09IGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBsaXN0ID0gbGlzdC5zbGljZSgpO1xuICAgICAgbGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgICBob29kaWUuZXZlbnRzQ2FsbGJhY2tzW2V2XSA9IGxpc3Q7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb250ZXh0LmJpbmQgPSBiaW5kO1xuICBjb250ZXh0Lm9uID0gYmluZDtcbiAgY29udGV4dC5vbmUgPSBvbmU7XG4gIGNvbnRleHQudHJpZ2dlciA9IHRyaWdnZXI7XG4gIGNvbnRleHQudW5iaW5kID0gdW5iaW5kO1xuICBjb250ZXh0Lm9mZiA9IHVuYmluZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVFdmVudHM7XG4iLCIvLyBob29kaWUuZ2VuZXJhdGVJZFxuLy8gPT09PT09PT09PT09PVxuXG4vLyBoZWxwZXIgdG8gZ2VuZXJhdGUgdW5pcXVlIGlkcy5cbmZ1bmN0aW9uIGhvb2RpZUdlbmVyYXRlSWQgKGhvb2RpZSkge1xuICB2YXIgY2hhcnMsIGksIHJhZGl4O1xuXG4gIC8vIHV1aWRzIGNvbnNpc3Qgb2YgbnVtYmVycyBhbmQgbG93ZXJjYXNlIGxldHRlcnMgb25seS5cbiAgLy8gV2Ugc3RpY2sgdG8gbG93ZXJjYXNlIGxldHRlcnMgdG8gcHJldmVudCBjb25mdXNpb25cbiAgLy8gYW5kIHRvIHByZXZlbnQgaXNzdWVzIHdpdGggQ291Y2hEQiwgZS5nLiBkYXRhYmFzZVxuICAvLyBuYW1lcyBkbyB3b25seSBhbGxvdyBmb3IgbG93ZXJjYXNlIGxldHRlcnMuXG4gIGNoYXJzID0gJzAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eicuc3BsaXQoJycpO1xuICByYWRpeCA9IGNoYXJzLmxlbmd0aDtcblxuXG4gIGZ1bmN0aW9uIGdlbmVyYXRlSWQobGVuZ3RoKSB7XG4gICAgdmFyIGlkID0gJyc7XG5cbiAgICAvLyBkZWZhdWx0IHV1aWQgbGVuZ3RoIHRvIDdcbiAgICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGxlbmd0aCA9IDc7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcmFuZCA9IE1hdGgucmFuZG9tKCkgKiByYWRpeDtcbiAgICAgIHZhciBjaGFyID0gY2hhcnNbTWF0aC5mbG9vcihyYW5kKV07XG4gICAgICBpZCArPSBTdHJpbmcoY2hhcikuY2hhckF0KDApO1xuICAgIH1cblxuICAgIHJldHVybiBpZDtcbiAgfVxuXG4gIC8vXG4gIC8vIFB1YmxpYyBBUElcbiAgLy9cbiAgaG9vZGllLmdlbmVyYXRlSWQgPSBnZW5lcmF0ZUlkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZUdlbmVyYXRlSWQ7XG4iLCIvLyBMb2NhbFN0b3JlXG4vLyA9PT09PT09PT09PT1cblxuLy9cbnZhciBob29kaWVTdG9yZUFwaSA9IHJlcXVpcmUoJy4vc3RvcmUnKTtcbnZhciBIb29kaWVPYmplY3RUeXBlRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yL29iamVjdF90eXBlJyk7XG52YXIgSG9vZGllT2JqZWN0SWRFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3Ivb2JqZWN0X2lkJyk7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVTdG9yZSAoaG9vZGllKSB7XG5cbiAgdmFyIGxvY2FsU3RvcmUgPSB7fTtcblxuICAvL1xuICAvLyBzdGF0ZVxuICAvLyAtLS0tLS0tXG4gIC8vXG5cbiAgLy8gY2FjaGUgb2YgbG9jYWxTdG9yYWdlIGZvciBxdWlja2VyIGFjY2Vzc1xuICB2YXIgY2FjaGVkT2JqZWN0ID0ge307XG5cbiAgLy8gbWFwIG9mIGRpcnR5IG9iamVjdHMgYnkgdGhlaXIgaWRzXG4gIHZhciBkaXJ0eSA9IHt9O1xuXG4gIC8vIHF1ZXVlIG9mIG1ldGhvZCBjYWxscyBkb25lIGR1cmluZyBib290c3RyYXBwaW5nXG4gIHZhciBxdWV1ZSA9IFtdO1xuXG4gIC8vIDIgc2Vjb25kcyB0aW1vdXQgYmVmb3JlIHRyaWdnZXJpbmcgdGhlIGBzdG9yZTppZGxlYCBldmVudFxuICAvL1xuICB2YXIgaWRsZVRpbWVvdXQgPSAyMDAwO1xuXG5cblxuXG4gIC8vIC0tLS0tLVxuICAvL1xuICAvLyBzYXZlcyB0aGUgcGFzc2VkIG9iamVjdCBpbnRvIHRoZSBzdG9yZSBhbmQgcmVwbGFjZXNcbiAgLy8gYW4gZXZlbnR1YWxseSBleGlzdGluZyBvYmplY3Qgd2l0aCBzYW1lIHR5cGUgJiBpZC5cbiAgLy9cbiAgLy8gV2hlbiBpZCBpcyB1bmRlZmluZWQsIGl0IGdldHMgZ2VuZXJhdGVkIGFuIG5ldyBvYmplY3QgZ2V0cyBzYXZlZFxuICAvL1xuICAvLyBJdCBhbHNvIGFkZHMgdGltZXN0YW1wcyBhbG9uZyB0aGUgd2F5OlxuICAvL1xuICAvLyAqIGBjcmVhdGVkQXRgIHVubGVzcyBpdCBhbHJlYWR5IGV4aXN0c1xuICAvLyAqIGB1cGRhdGVkQXRgIGV2ZXJ5IHRpbWVcbiAgLy8gKiBgX3N5bmNlZEF0YCAgaWYgY2hhbmdlcyBjb21lcyBmcm9tIHJlbW90ZVxuICAvL1xuICAvLyBleGFtcGxlIHVzYWdlOlxuICAvL1xuICAvLyAgICAgc3RvcmUuc2F2ZSgnY2FyJywgdW5kZWZpbmVkLCB7Y29sb3I6ICdyZWQnfSlcbiAgLy8gICAgIHN0b3JlLnNhdmUoJ2NhcicsICdhYmM0NTY3Jywge2NvbG9yOiAncmVkJ30pXG4gIC8vXG4gIGxvY2FsU3RvcmUuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUob2JqZWN0LCBvcHRpb25zKSB7XG4gICAgdmFyIGN1cnJlbnRPYmplY3QsIGRlZmVyLCBlcnJvciwgZXZlbnQsIGlzTmV3LCBrZXk7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIGlmIHN0b3JlIGlzIGN1cnJlbnRseSBib290c3RyYXBwaW5nIGRhdGEgZnJvbSByZW1vdGUsXG4gICAgLy8gd2UncmUgcXVldWVpbmcgbG9jYWwgc2F2ZXMgdW50aWwgaXQncyBmaW5pc2hlZC5cbiAgICBpZiAoc3RvcmUuaXNCb290c3RyYXBwaW5nKCkgJiYgIW9wdGlvbnMucmVtb3RlKSB7XG4gICAgICByZXR1cm4gZW5xdWV1ZSgnc2F2ZScsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgLy8gZ2VuZXJhdGUgYW4gaWQgaWYgbmVjZXNzYXJ5XG4gICAgaWYgKG9iamVjdC5pZCkge1xuICAgICAgY3VycmVudE9iamVjdCA9IGNhY2hlKG9iamVjdC50eXBlLCBvYmplY3QuaWQpO1xuICAgICAgaXNOZXcgPSB0eXBlb2YgY3VycmVudE9iamVjdCAhPT0gJ29iamVjdCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlzTmV3ID0gdHJ1ZTtcbiAgICAgIG9iamVjdC5pZCA9IGhvb2RpZS5nZW5lcmF0ZUlkKCk7XG4gICAgfVxuXG4gICAgaWYgKGlzTmV3KSB7XG4gICAgICAvLyBhZGQgY3JlYXRlZEJ5IGhhc2hcbiAgICAgIG9iamVjdC5jcmVhdGVkQnkgPSBvYmplY3QuY3JlYXRlZEJ5IHx8IGhvb2RpZS5hY2NvdW50Lm93bmVySGFzaDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBsZWF2ZSBjcmVhdGVkQnkgaGFzaFxuICAgICAgaWYgKGN1cnJlbnRPYmplY3QuY3JlYXRlZEJ5KSB7XG4gICAgICAgIG9iamVjdC5jcmVhdGVkQnkgPSBjdXJyZW50T2JqZWN0LmNyZWF0ZWRCeTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBoYW5kbGUgbG9jYWwgcHJvcGVydGllcyBhbmQgaGlkZGVuIHByb3BlcnRpZXMgd2l0aCAkIHByZWZpeFxuICAgIC8vIGtlZXAgbG9jYWwgcHJvcGVydGllcyBmb3IgcmVtb3RlIHVwZGF0ZXNcbiAgICBpZiAoIWlzTmV3KSB7XG5cbiAgICAgIC8vIGZvciByZW1vdGUgdXBkYXRlcywga2VlcCBsb2NhbCBwcm9wZXJ0aWVzIChzdGFydGluZyB3aXRoICdfJylcbiAgICAgIC8vIGZvciBsb2NhbCB1cGRhdGVzLCBrZWVwIGhpZGRlbiBwcm9wZXJ0aWVzIChzdGFydGluZyB3aXRoICckJylcbiAgICAgIGZvciAoa2V5IGluIGN1cnJlbnRPYmplY3QpIHtcbiAgICAgICAgaWYgKCFvYmplY3QuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgIHN3aXRjaCAoa2V5LmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgJ18nOlxuICAgICAgICAgICAgaWYgKG9wdGlvbnMucmVtb3RlKSB7XG4gICAgICAgICAgICAgIG9iamVjdFtrZXldID0gY3VycmVudE9iamVjdFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnJCc6XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMucmVtb3RlKSB7XG4gICAgICAgICAgICAgIG9iamVjdFtrZXldID0gY3VycmVudE9iamVjdFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGFkZCB0aW1lc3RhbXBzXG4gICAgaWYgKG9wdGlvbnMucmVtb3RlKSB7XG4gICAgICBvYmplY3QuX3N5bmNlZEF0ID0gbm93KCk7XG4gICAgfSBlbHNlIGlmICghb3B0aW9ucy5zaWxlbnQpIHtcbiAgICAgIG9iamVjdC51cGRhdGVkQXQgPSBub3coKTtcbiAgICAgIG9iamVjdC5jcmVhdGVkQXQgPSBvYmplY3QuY3JlYXRlZEF0IHx8IG9iamVjdC51cGRhdGVkQXQ7XG4gICAgfVxuXG4gICAgLy8gaGFuZGxlIGxvY2FsIGNoYW5nZXNcbiAgICAvL1xuICAgIC8vIEEgbG9jYWwgY2hhbmdlIGlzIG1lYW50IHRvIGJlIHJlcGxpY2F0ZWQgdG8gdGhlXG4gICAgLy8gdXNlcnMgZGF0YWJhc2UsIGJ1dCBub3QgYmV5b25kLiBGb3IgZXhhbXBsZSB3aGVuXG4gICAgLy8gSSBzdWJzY3JpYmVkIHRvIGEgc2hhcmUgYnV0IHRoZW4gZGVjaWRlIHRvIHVuc3Vic2NyaWJlLFxuICAgIC8vIGFsbCBvYmplY3RzIGdldCByZW1vdmVkIHdpdGggbG9jYWw6IHRydWUgZmxhZywgc28gdGhhdFxuICAgIC8vIHRoZXkgZ2V0IHJlbW92ZWQgZnJvbSBteSBkYXRhYmFzZSwgYnV0IHdvbid0IGFueXdoZXJlIGVsc2UuXG4gICAgaWYgKG9wdGlvbnMubG9jYWwpIHtcbiAgICAgIG9iamVjdC5fJGxvY2FsID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIG9iamVjdC5fJGxvY2FsO1xuICAgIH1cblxuICAgIGRlZmVyID0gaG9vZGllLmRlZmVyKCk7XG5cbiAgICB0cnkge1xuICAgICAgb2JqZWN0ID0gY2FjaGUob2JqZWN0LnR5cGUsIG9iamVjdC5pZCwgb2JqZWN0LCBvcHRpb25zKTtcbiAgICAgIGRlZmVyLnJlc29sdmUob2JqZWN0LCBpc05ldykucHJvbWlzZSgpO1xuICAgICAgZXZlbnQgPSBpc05ldyA/ICdhZGQnIDogJ3VwZGF0ZSc7XG4gICAgICB0cmlnZ2VyRXZlbnRzKGV2ZW50LCBvYmplY3QsIG9wdGlvbnMpO1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgZXJyb3IgPSBfZXJyb3I7XG4gICAgICBkZWZlci5yZWplY3QoZXJyb3IudG9TdHJpbmcoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfTtcblxuXG4gIC8vIGZpbmRcbiAgLy8gLS0tLS0tXG5cbiAgLy8gbG9hZHMgb25lIG9iamVjdCBmcm9tIFN0b3JlLCBzcGVjaWZpZWQgYnkgYHR5cGVgIGFuZCBgaWRgXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2U6XG4gIC8vXG4gIC8vICAgICBzdG9yZS5maW5kKCdjYXInLCAnYWJjNDU2NycpXG4gIGxvY2FsU3RvcmUuZmluZCA9IGZ1bmN0aW9uKHR5cGUsIGlkKSB7XG4gICAgdmFyIGVycm9yLCBvYmplY3Q7XG5cbiAgICAvLyBpZiBzdG9yZSBpcyBjdXJyZW50bHkgYm9vdHN0cmFwcGluZyBkYXRhIGZyb20gcmVtb3RlLFxuICAgIC8vIHdlJ3JlIHF1ZXVlaW5nIHVudGlsIGl0J3MgZmluaXNoZWRcbiAgICBpZiAoc3RvcmUuaXNCb290c3RyYXBwaW5nKCkpIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKCdmaW5kJywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgb2JqZWN0ID0gY2FjaGUodHlwZSwgaWQpO1xuICAgICAgaWYgKCFvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKHtcbiAgICAgICAgICBuYW1lOiAnSG9vZGllTm90Rm91bmRFcnJvcicsXG4gICAgICAgICAgbWVzc2FnZTogJ1wie3t0eXBlfX1cIiB3aXRoIGlkIFwie3tpZH19XCIgY291bGQgbm90IGJlIGZvdW5kJ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZVdpdGgob2JqZWN0KTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGVycm9yID0gX2Vycm9yO1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKGVycm9yKTtcbiAgICB9XG4gIH07XG5cblxuICAvLyBmaW5kQWxsXG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHJldHVybnMgYWxsIG9iamVjdHMgZnJvbSBzdG9yZS5cbiAgLy8gQ2FuIGJlIG9wdGlvbmFsbHkgZmlsdGVyZWQgYnkgYSB0eXBlIG9yIGEgZnVuY3Rpb25cbiAgLy9cbiAgLy8gZXhhbXBsZSB1c2FnZTpcbiAgLy9cbiAgLy8gICAgIHN0b3JlLmZpbmRBbGwoKVxuICAvLyAgICAgc3RvcmUuZmluZEFsbCgnY2FyJylcbiAgLy8gICAgIHN0b3JlLmZpbmRBbGwoZnVuY3Rpb24ob2JqKSB7IHJldHVybiBvYmouYnJhbmQgPT0gJ1Rlc2xhJyB9KVxuICAvL1xuICBsb2NhbFN0b3JlLmZpbmRBbGwgPSBmdW5jdGlvbiBmaW5kQWxsKGZpbHRlcikge1xuICAgIHZhciBjdXJyZW50VHlwZSwgZGVmZXIsIGVycm9yLCBpZCwga2V5LCBrZXlzLCBvYmosIHJlc3VsdHMsIHR5cGU7XG5cblxuXG4gICAgaWYgKGZpbHRlciA9PSBudWxsKSB7XG4gICAgICBmaWx0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIGlmIHN0b3JlIGlzIGN1cnJlbnRseSBib290c3RyYXBwaW5nIGRhdGEgZnJvbSByZW1vdGUsXG4gICAgLy8gd2UncmUgcXVldWVpbmcgdW50aWwgaXQncyBmaW5pc2hlZFxuICAgIGlmIChzdG9yZS5pc0Jvb3RzdHJhcHBpbmcoKSkge1xuICAgICAgcmV0dXJuIGVucXVldWUoJ2ZpbmRBbGwnLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIGtleXMgPSBzdG9yZS5pbmRleCgpO1xuXG4gICAgLy8gbm9ybWFsaXplIGZpbHRlclxuICAgIGlmICh0eXBlb2YgZmlsdGVyID09PSAnc3RyaW5nJykge1xuICAgICAgdHlwZSA9IGZpbHRlcjtcbiAgICAgIGZpbHRlciA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqLnR5cGUgPT09IHR5cGU7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGRlZmVyID0gaG9vZGllLmRlZmVyKCk7XG5cbiAgICB0cnkge1xuXG4gICAgICAvL1xuICAgICAgcmVzdWx0cyA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIF9pLCBfbGVuLCBfcmVmLCBfcmVzdWx0cztcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBrZXlzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAga2V5ID0ga2V5c1tfaV07XG4gICAgICAgICAgaWYgKCEoaXNTZW1hbnRpY0tleShrZXkpKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIF9yZWYgPSBrZXkuc3BsaXQoJy8nKSxcbiAgICAgICAgICBjdXJyZW50VHlwZSA9IF9yZWZbMF0sXG4gICAgICAgICAgaWQgPSBfcmVmWzFdO1xuXG4gICAgICAgICAgb2JqID0gY2FjaGUoY3VycmVudFR5cGUsIGlkKTtcbiAgICAgICAgICBpZiAob2JqICYmIGZpbHRlcihvYmopKSB7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKG9iaik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9KS5jYWxsKHRoaXMpO1xuXG4gICAgICAvLyBzb3J0IGZyb20gbmV3ZXN0IHRvIG9sZGVzdFxuICAgICAgcmVzdWx0cy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgaWYgKGEuY3JlYXRlZEF0ID4gYi5jcmVhdGVkQXQpIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0gZWxzZSBpZiAoYS5jcmVhdGVkQXQgPCBiLmNyZWF0ZWRBdCkge1xuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGRlZmVyLnJlc29sdmUocmVzdWx0cykucHJvbWlzZSgpO1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgZXJyb3IgPSBfZXJyb3I7XG4gICAgICBkZWZlci5yZWplY3QoZXJyb3IpLnByb21pc2UoKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfTtcblxuXG4gIC8vIFJlbW92ZVxuICAvLyAtLS0tLS0tLVxuXG4gIC8vIFJlbW92ZXMgb25lIG9iamVjdCBzcGVjaWZpZWQgYnkgYHR5cGVgIGFuZCBgaWRgLlxuICAvL1xuICAvLyB3aGVuIG9iamVjdCBoYXMgYmVlbiBzeW5jZWQgYmVmb3JlLCBtYXJrIGl0IGFzIGRlbGV0ZWQuXG4gIC8vIE90aGVyd2lzZSByZW1vdmUgaXQgZnJvbSBTdG9yZS5cbiAgbG9jYWxTdG9yZS5yZW1vdmUgPSBmdW5jdGlvbiByZW1vdmUodHlwZSwgaWQsIG9wdGlvbnMpIHtcbiAgICB2YXIga2V5LCBvYmplY3QsIG9iamVjdFdhc01hcmtlZEFzRGVsZXRlZDtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLy8gaWYgc3RvcmUgaXMgY3VycmVudGx5IGJvb3RzdHJhcHBpbmcgZGF0YSBmcm9tIHJlbW90ZSxcbiAgICAvLyB3ZSdyZSBxdWV1ZWluZyBsb2NhbCByZW1vdmVzIHVudGlsIGl0J3MgZmluaXNoZWQuXG4gICAgaWYgKHN0b3JlLmlzQm9vdHN0cmFwcGluZygpICYmICFvcHRpb25zLnJlbW90ZSkge1xuICAgICAgcmV0dXJuIGVucXVldWUoJ3JlbW92ZScsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAga2V5ID0gdHlwZSArICcvJyArIGlkO1xuXG4gICAgb2JqZWN0ID0gY2FjaGUodHlwZSwgaWQpO1xuXG4gICAgLy8gaWYgY2hhbmdlIGNvbWVzIGZyb20gcmVtb3RlLCBqdXN0IGNsZWFuIHVwIGxvY2FsbHlcbiAgICBpZiAob3B0aW9ucy5yZW1vdGUpIHtcbiAgICAgIGRiLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICAgIG9iamVjdFdhc01hcmtlZEFzRGVsZXRlZCA9IGNhY2hlZE9iamVjdFtrZXldICYmIGlzTWFya2VkQXNEZWxldGVkKGNhY2hlZE9iamVjdFtrZXldKTtcbiAgICAgIGNhY2hlZE9iamVjdFtrZXldID0gZmFsc2U7XG4gICAgICBjbGVhckNoYW5nZWQodHlwZSwgaWQpO1xuICAgICAgaWYgKG9iamVjdFdhc01hcmtlZEFzRGVsZXRlZCAmJiBvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlV2l0aChvYmplY3QpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghb2JqZWN0KSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoe1xuICAgICAgICBuYW1lOiAnSG9vZGllTm90Rm91bmRFcnJvcicsXG4gICAgICAgIG1lc3NhZ2U6ICdcInt7dHlwZX19XCIgd2l0aCBpZCBcInt7aWR9fVwiXCIgY291bGQgbm90IGJlIGZvdW5kJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG9iamVjdC5fc3luY2VkQXQpIHtcbiAgICAgIG9iamVjdC5fZGVsZXRlZCA9IHRydWU7XG4gICAgICBjYWNoZSh0eXBlLCBpZCwgb2JqZWN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V5ID0gdHlwZSArICcvJyArIGlkO1xuICAgICAgZGIucmVtb3ZlSXRlbShrZXkpO1xuICAgICAgY2FjaGVkT2JqZWN0W2tleV0gPSBmYWxzZTtcbiAgICAgIGNsZWFyQ2hhbmdlZCh0eXBlLCBpZCk7XG4gICAgfVxuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hvb2RpZWhxL2hvb2RpZS5qcy9pc3N1ZXMvMTQ3XG4gICAgaWYgKG9wdGlvbnMudXBkYXRlKSB7XG4gICAgICBvYmplY3QgPSBvcHRpb25zLnVwZGF0ZTtcbiAgICAgIGRlbGV0ZSBvcHRpb25zLnVwZGF0ZTtcbiAgICB9XG4gICAgdHJpZ2dlckV2ZW50cygncmVtb3ZlJywgb2JqZWN0LCBvcHRpb25zKTtcbiAgICByZXR1cm4gaG9vZGllLnJlc29sdmVXaXRoKG9iamVjdCk7XG4gIH07XG5cblxuICAvLyBSZW1vdmUgYWxsXG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyBSZW1vdmVzIG9uZSBvYmplY3Qgc3BlY2lmaWVkIGJ5IGB0eXBlYCBhbmQgYGlkYC5cbiAgLy9cbiAgLy8gd2hlbiBvYmplY3QgaGFzIGJlZW4gc3luY2VkIGJlZm9yZSwgbWFyayBpdCBhcyBkZWxldGVkLlxuICAvLyBPdGhlcndpc2UgcmVtb3ZlIGl0IGZyb20gU3RvcmUuXG4gIGxvY2FsU3RvcmUucmVtb3ZlQWxsID0gZnVuY3Rpb24gcmVtb3ZlQWxsKHR5cGUsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gc3RvcmUuZmluZEFsbCh0eXBlKS50aGVuKGZ1bmN0aW9uKG9iamVjdHMpIHtcbiAgICAgIHZhciBvYmplY3QsIF9pLCBfbGVuLCByZXN1bHRzO1xuXG4gICAgICByZXN1bHRzID0gW107XG5cbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gb2JqZWN0cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBvYmplY3QgPSBvYmplY3RzW19pXTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHN0b3JlLnJlbW92ZShvYmplY3QudHlwZSwgb2JqZWN0LmlkLCBvcHRpb25zKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIHZhbGlkYXRlXG4gIC8vIC0tLS0tLS0tLS1cblxuICAvL1xuICBmdW5jdGlvbiB2YWxpZGF0ZSAob2JqZWN0KSB7XG5cbiAgICBpZiAoSG9vZGllT2JqZWN0VHlwZUVycm9yLmlzSW52YWxpZChvYmplY3QudHlwZSkpIHtcbiAgICAgIHJldHVybiBuZXcgSG9vZGllT2JqZWN0VHlwZUVycm9yKHtcbiAgICAgICAgdHlwZTogb2JqZWN0LnR5cGVcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghb2JqZWN0LmlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKEhvb2RpZU9iamVjdElkRXJyb3IuaXNJbnZhbGlkKG9iamVjdC5pZCkpIHtcbiAgICAgIHJldHVybiBuZXcgSG9vZGllT2JqZWN0SWRFcnJvcih7XG4gICAgICAgIGlkOiBvYmplY3QuaWRcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHZhciBzdG9yZSA9IGhvb2RpZVN0b3JlQXBpKGhvb2RpZSwge1xuXG4gICAgLy8gdmFsaWRhdGVcbiAgICB2YWxpZGF0ZTogdmFsaWRhdGUsXG5cbiAgICBiYWNrZW5kOiB7XG4gICAgICBzYXZlOiBsb2NhbFN0b3JlLnNhdmUsXG4gICAgICBmaW5kOiBsb2NhbFN0b3JlLmZpbmQsXG4gICAgICBmaW5kQWxsOiBsb2NhbFN0b3JlLmZpbmRBbGwsXG4gICAgICByZW1vdmU6IGxvY2FsU3RvcmUucmVtb3ZlLFxuICAgICAgcmVtb3ZlQWxsOiBsb2NhbFN0b3JlLnJlbW92ZUFsbCxcbiAgICB9XG4gIH0pO1xuXG5cblxuICAvLyBleHRlbmRlZCBwdWJsaWMgQVBJXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cbiAgLy8gaW5kZXhcbiAgLy8gLS0tLS0tLVxuXG4gIC8vIG9iamVjdCBrZXkgaW5kZXhcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNhY2h5XG4gIHN0b3JlLmluZGV4ID0gZnVuY3Rpb24gaW5kZXgoKSB7XG4gICAgdmFyIGksIGtleSwga2V5cywgX2ksIF9yZWY7XG4gICAga2V5cyA9IFtdO1xuICAgIGZvciAoaSA9IF9pID0gMCwgX3JlZiA9IGRiLmxlbmd0aCgpOyAwIDw9IF9yZWYgPyBfaSA8IF9yZWYgOiBfaSA+IF9yZWY7IGkgPSAwIDw9IF9yZWYgPyArK19pIDogLS1faSkge1xuICAgICAga2V5ID0gZGIua2V5KGkpO1xuICAgICAgaWYgKGlzU2VtYW50aWNLZXkoa2V5KSkge1xuICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cblxuICAvLyBjaGFuZ2VkIG9iamVjdHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyByZXR1cm5zIGFuIEFycmF5IG9mIGFsbCBkaXJ0eSBkb2N1bWVudHNcbiAgc3RvcmUuY2hhbmdlZE9iamVjdHMgPSBmdW5jdGlvbiBjaGFuZ2VkT2JqZWN0cygpIHtcbiAgICB2YXIgaWQsIGtleSwgb2JqZWN0LCB0eXBlLCBfcmVmLCBfcmVmMSwgX3Jlc3VsdHM7XG5cbiAgICBfcmVmID0gZGlydHk7XG4gICAgX3Jlc3VsdHMgPSBbXTtcblxuICAgIGZvciAoa2V5IGluIF9yZWYpIHtcbiAgICAgIGlmIChfcmVmLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgb2JqZWN0ID0gX3JlZltrZXldO1xuICAgICAgICBfcmVmMSA9IGtleS5zcGxpdCgnLycpLFxuICAgICAgICB0eXBlID0gX3JlZjFbMF0sXG4gICAgICAgIGlkID0gX3JlZjFbMV07XG4gICAgICAgIG9iamVjdC50eXBlID0gdHlwZTtcbiAgICAgICAgb2JqZWN0LmlkID0gaWQ7XG4gICAgICAgIF9yZXN1bHRzLnB1c2gob2JqZWN0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIF9yZXN1bHRzO1xuICB9O1xuXG5cbiAgLy8gSXMgZGlydHk/XG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyBXaGVuIG5vIGFyZ3VtZW50cyBwYXNzZWQsIHJldHVybnMgYHRydWVgIG9yIGBmYWxzZWAgZGVwZW5kaW5nIG9uIGlmIHRoZXJlIGFyZVxuICAvLyBkaXJ0eSBvYmplY3RzIGluIHRoZSBzdG9yZS5cbiAgLy9cbiAgLy8gT3RoZXJ3aXNlIGl0IHJldHVybnMgYHRydWVgIG9yIGBmYWxzZWAgZm9yIHRoZSBwYXNzZWQgb2JqZWN0LiBBbiBvYmplY3QgaXMgZGlydHlcbiAgLy8gaWYgaXQgaGFzIG5vIGBfc3luY2VkQXRgIGF0dHJpYnV0ZSBvciBpZiBgdXBkYXRlZEF0YCBpcyBtb3JlIHJlY2VudCB0aGFuIGBfc3luY2VkQXRgXG4gIHN0b3JlLmhhc0xvY2FsQ2hhbmdlcyA9IGZ1bmN0aW9uKHR5cGUsIGlkKSB7XG4gICAgaWYgKCF0eXBlKSB7XG4gICAgICByZXR1cm4gISQuaXNFbXB0eU9iamVjdChkaXJ0eSk7XG4gICAgfVxuICAgIHZhciBrZXkgPSBbdHlwZSxpZF0uam9pbignLycpO1xuICAgIGlmIChkaXJ0eVtrZXldKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGhhc0xvY2FsQ2hhbmdlcyhjYWNoZSh0eXBlLCBpZCkpO1xuICB9O1xuXG5cbiAgLy8gQ2xlYXJcbiAgLy8gLS0tLS0tXG5cbiAgLy8gY2xlYXJzIGxvY2FsU3RvcmFnZSBhbmQgY2FjaGVcbiAgLy8gVE9ETzogZG8gbm90IGNsZWFyIGVudGlyZSBsb2NhbFN0b3JhZ2UsIGNsZWFyIG9ubHkgdGhlIGl0ZW1zIHRoYXQgaGF2ZSBiZWVuIHN0b3JlZFxuICAvLyAgICAgICB1c2luZyBgaG9vZGllLnN0b3JlYCBiZWZvcmUuXG4gIHN0b3JlLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgdmFyIGRlZmVyLCBrZXksIGtleXMsIHJlc3VsdHM7XG4gICAgZGVmZXIgPSBob29kaWUuZGVmZXIoKTtcbiAgICB0cnkge1xuICAgICAga2V5cyA9IHN0b3JlLmluZGV4KCk7XG4gICAgICByZXN1bHRzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX2ksIF9sZW4sIF9yZXN1bHRzO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGtleXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICBrZXkgPSBrZXlzW19pXTtcbiAgICAgICAgICBpZiAoaXNTZW1hbnRpY0tleShrZXkpKSB7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKGRiLnJlbW92ZUl0ZW0oa2V5KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH0pLmNhbGwodGhpcyk7XG4gICAgICBjYWNoZWRPYmplY3QgPSB7fTtcbiAgICAgIGNsZWFyQ2hhbmdlZCgpO1xuICAgICAgZGVmZXIucmVzb2x2ZSgpO1xuICAgICAgc3RvcmUudHJpZ2dlcignY2xlYXInKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGRlZmVyLnJlamVjdChfZXJyb3IpO1xuICAgIH1cbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICB9O1xuXG5cbiAgLy8gaXNCb290c3RyYXBwaW5nXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmV0dXJucyB0cnVlIGlmIHN0b3JlIGlzIGN1cnJlbnRseSBib290c3RyYXBwaW5nIGRhdGEgZnJvbSByZW1vdGUsXG4gIC8vIG90aGVyd2lzZSBmYWxzZS5cbiAgdmFyIGJvb3RzdHJhcHBpbmcgPSBmYWxzZTtcbiAgc3RvcmUuaXNCb290c3RyYXBwaW5nID0gZnVuY3Rpb24gaXNCb290c3RyYXBwaW5nKCkge1xuICAgIHJldHVybiBib290c3RyYXBwaW5nO1xuICB9O1xuXG5cbiAgLy8gSXMgcGVyc2lzdGFudD9cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHJldHVybnMgYHRydWVgIG9yIGBmYWxzZWAgZGVwZW5kaW5nIG9uIHdoZXRoZXIgbG9jYWxTdG9yYWdlIGlzIHN1cHBvcnRlZCBvciBub3QuXG4gIC8vIEJld2FyZSB0aGF0IHNvbWUgYnJvd3NlcnMgbGlrZSBTYWZhcmkgZG8gbm90IHN1cHBvcnQgbG9jYWxTdG9yYWdlIGluIHByaXZhdGUgbW9kZS5cbiAgLy9cbiAgLy8gaW5zcGlyZWQgYnkgdGhpcyBjYXBwdWNjaW5vIGNvbW1pdFxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vY2FwcHVjY2luby9jYXBwdWNjaW5vL2NvbW1pdC8wNjNiMDVkOTY0M2MzNWIzMDM1NjhhMjg4MDllNGViMzIyNGY3MWVjXG4gIC8vXG4gIHN0b3JlLmlzUGVyc2lzdGVudCA9IGZ1bmN0aW9uIGlzUGVyc2lzdGVudCgpIHtcbiAgICB0cnkge1xuXG4gICAgICAvLyB3ZSd2ZSB0byBwdXQgdGhpcyBpbiBoZXJlLiBJJ3ZlIHNlZW4gRmlyZWZveCB0aHJvd2luZyBgU2VjdXJpdHkgZXJyb3I6IDEwMDBgXG4gICAgICAvLyB3aGVuIGNvb2tpZXMgaGF2ZSBiZWVuIGRpc2FibGVkXG4gICAgICBpZiAoIXdpbmRvdy5sb2NhbFN0b3JhZ2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBKdXN0IGJlY2F1c2UgbG9jYWxTdG9yYWdlIGV4aXN0cyBkb2VzIG5vdCBtZWFuIGl0IHdvcmtzLiBJbiBwYXJ0aWN1bGFyIGl0IG1pZ2h0IGJlIGRpc2FibGVkXG4gICAgICAvLyBhcyBpdCBpcyB3aGVuIFNhZmFyaSdzIHByaXZhdGUgYnJvd3NpbmcgbW9kZSBpcyBhY3RpdmUuXG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnU3RvcmFnZS1UZXN0JywgJzEnKTtcblxuICAgICAgLy8gdGhhdCBzaG91bGQgbm90IGhhcHBlbiAuLi5cbiAgICAgIGlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnU3RvcmFnZS1UZXN0JykgIT09ICcxJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIG9rYXksIGxldCdzIGNsZWFuIHVwIGlmIHdlIGdvdCBoZXJlLlxuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ1N0b3JhZ2UtVGVzdCcpO1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuXG4gICAgICAvLyBpbiBjYXNlIG9mIGFuIGVycm9yLCBsaWtlIFNhZmFyaSdzIFByaXZhdGUgTW9kZSwgcmV0dXJuIGZhbHNlXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gd2UncmUgZ29vZC5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuXG5cblxuICAvL1xuICAvLyBQcml2YXRlIG1ldGhvZHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy9cblxuXG4gIC8vIGxvY2FsU3RvcmFnZSBwcm94eVxuICAvL1xuICB2YXIgZGIgPSB7XG4gICAgZ2V0SXRlbTogZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XG4gICAgfSxcbiAgICBzZXRJdGVtOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgdmFsdWUpO1xuICAgIH0sXG4gICAgcmVtb3ZlSXRlbTogZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XG4gICAgfSxcbiAgICBrZXk6IGZ1bmN0aW9uKG5yKSB7XG4gICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5rZXkobnIpO1xuICAgIH0sXG4gICAgbGVuZ3RoOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLmxlbmd0aDtcbiAgICB9XG4gIH07XG5cblxuICAvLyBDYWNoZVxuICAvLyAtLS0tLS0tXG5cbiAgLy8gbG9hZHMgYW4gb2JqZWN0IHNwZWNpZmllZCBieSBgdHlwZWAgYW5kIGBpZGAgb25seSBvbmNlIGZyb20gbG9jYWxTdG9yYWdlXG4gIC8vIGFuZCBjYWNoZXMgaXQgZm9yIGZhc3RlciBmdXR1cmUgYWNjZXNzLiBVcGRhdGVzIGNhY2hlIHdoZW4gYHZhbHVlYCBpcyBwYXNzZWQuXG4gIC8vXG4gIC8vIEFsc28gY2hlY2tzIGlmIG9iamVjdCBuZWVkcyB0byBiZSBzeW5jaGVkIChkaXJ0eSkgb3Igbm90XG4gIC8vXG4gIC8vIFBhc3MgYG9wdGlvbnMucmVtb3RlID0gdHJ1ZWAgd2hlbiBvYmplY3QgY29tZXMgZnJvbSByZW1vdGVcbiAgLy8gUGFzcyAnb3B0aW9ucy5zaWxlbnQgPSB0cnVlJyB0byBhdm9pZCBldmVudHMgZnJvbSBiZWluZyB0cmlnZ2VyZWQuXG4gIGZ1bmN0aW9uIGNhY2hlKHR5cGUsIGlkLCBvYmplY3QsIG9wdGlvbnMpIHtcbiAgICB2YXIga2V5O1xuXG4gICAgaWYgKG9iamVjdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBvYmplY3QgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBrZXkgPSAnJyArIHR5cGUgKyAnLycgKyBpZDtcblxuICAgIGlmIChvYmplY3QpIHtcbiAgICAgICQuZXh0ZW5kKG9iamVjdCwge1xuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBpZDogaWRcbiAgICAgIH0pO1xuXG4gICAgICBzZXRPYmplY3QodHlwZSwgaWQsIG9iamVjdCk7XG5cbiAgICAgIGlmIChvcHRpb25zLnJlbW90ZSkge1xuICAgICAgICBjbGVhckNoYW5nZWQodHlwZSwgaWQpO1xuICAgICAgICBjYWNoZWRPYmplY3Rba2V5XSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpO1xuICAgICAgICByZXR1cm4gY2FjaGVkT2JqZWN0W2tleV07XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAvLyBpZiB0aGUgY2FjaGVkIGtleSByZXR1cm5zIGZhbHNlLCBpdCBtZWFuc1xuICAgICAgLy8gdGhhdCB3ZSBoYXZlIHJlbW92ZWQgdGhhdCBrZXkuIFdlIGp1c3RcbiAgICAgIC8vIHNldCBpdCB0byBmYWxzZSBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgc29cbiAgICAgIC8vIHRoYXQgd2UgZG9uJ3QgbmVlZCB0byBsb29rIGl0IHVwIGFnYWluIGluIGxvY2FsU3RvcmFnZVxuICAgICAgaWYgKGNhY2hlZE9iamVjdFtrZXldID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIGtleSBpcyBjYWNoZWQsIHJldHVybiBpdC4gQnV0IG1ha2Ugc3VyZVxuICAgICAgLy8gdG8gbWFrZSBhIGRlZXAgY29weSBiZWZvcmVoYW5kICg9PiB0cnVlKVxuICAgICAgaWYgKGNhY2hlZE9iamVjdFtrZXldKSB7XG4gICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgY2FjaGVkT2JqZWN0W2tleV0pO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiBvYmplY3QgaXMgbm90IHlldCBjYWNoZWQsIGxvYWQgaXQgZnJvbSBsb2NhbFN0b3JlXG4gICAgICBvYmplY3QgPSBnZXRPYmplY3QodHlwZSwgaWQpO1xuXG4gICAgICAvLyBzdG9wIGhlcmUgaWYgb2JqZWN0IGRpZCBub3QgZXhpc3QgaW4gbG9jYWxTdG9yZVxuICAgICAgLy8gYW5kIGNhY2hlIGl0IHNvIHdlIGRvbid0IG5lZWQgdG8gbG9vayBpdCB1cCBhZ2FpblxuICAgICAgaWYgKG9iamVjdCA9PT0gZmFsc2UpIHtcbiAgICAgICAgY2xlYXJDaGFuZ2VkKHR5cGUsIGlkKTtcbiAgICAgICAgY2FjaGVkT2JqZWN0W2tleV0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgaWYgKGlzTWFya2VkQXNEZWxldGVkKG9iamVjdCkpIHtcbiAgICAgIG1hcmtBc0NoYW5nZWQodHlwZSwgaWQsIG9iamVjdCwgb3B0aW9ucyk7XG4gICAgICBjYWNoZWRPYmplY3Rba2V5XSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGhlcmUgaXMgd2hlcmUgd2UgY2FjaGUgdGhlIG9iamVjdCBmb3JcbiAgICAvLyBmdXR1cmUgcXVpY2sgYWNjZXNzXG4gICAgY2FjaGVkT2JqZWN0W2tleV0gPSAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KTtcblxuICAgIGlmIChoYXNMb2NhbENoYW5nZXMob2JqZWN0KSkge1xuICAgICAgbWFya0FzQ2hhbmdlZCh0eXBlLCBpZCwgY2FjaGVkT2JqZWN0W2tleV0sIG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjbGVhckNoYW5nZWQodHlwZSwgaWQpO1xuICAgIH1cblxuICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KTtcbiAgfVxuXG5cbiAgLy8gYm9vdHN0cmFwcGluZyBkaXJ0eSBvYmplY3RzLCB0byBtYWtlIHN1cmVcbiAgLy8gdGhhdCByZW1vdmVkIG9iamVjdHMgZ2V0IHB1c2hlZCBhZnRlclxuICAvLyBwYWdlIHJlbG9hZC5cbiAgLy9cbiAgZnVuY3Rpb24gYm9vdHN0cmFwRGlydHlPYmplY3RzKCkge1xuICAgIHZhciBpZCwga2V5cywgb2JqLCB0eXBlLCBfaSwgX2xlbiwgX3JlZjtcbiAgICBrZXlzID0gZGIuZ2V0SXRlbSgnX2RpcnR5Jyk7XG5cbiAgICBpZiAoIWtleXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBrZXlzID0ga2V5cy5zcGxpdCgnLCcpO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0ga2V5cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgX3JlZiA9IGtleXNbX2ldLnNwbGl0KCcvJyksXG4gICAgICB0eXBlID0gX3JlZlswXSxcbiAgICAgIGlkID0gX3JlZlsxXTtcbiAgICAgIG9iaiA9IGNhY2hlKHR5cGUsIGlkKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vXG4gIC8vIHN1YnNjcmliZSB0byBldmVudHMgY29taW5nIGZyb20gYWNjb3VudCAmIG91ciByZW1vdGUgc3RvcmUuXG4gIC8vXG4gIGZ1bmN0aW9uIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpIHtcblxuICAgIC8vIGFjY291bnQgZXZlbnRzXG4gICAgaG9vZGllLm9uKCdhY2NvdW50OmNsZWFudXAnLCBzdG9yZS5jbGVhcik7XG4gICAgaG9vZGllLm9uKCdhY2NvdW50OnNpZ251cCcsIG1hcmtBbGxBc0NoYW5nZWQpO1xuICAgIGhvb2RpZS5vbigncmVtb3RlOmJvb3RzdHJhcDpzdGFydCcsIHN0YXJ0Qm9vdHN0cmFwcGluZ01vZGUpO1xuICAgIGhvb2RpZS5vbigncmVtb3RlOmJvb3RzdHJhcDplbmQnLCBlbmRCb290c3RyYXBwaW5nTW9kZSk7XG5cbiAgICAvLyByZW1vdGUgZXZlbnRzXG4gICAgaG9vZGllLm9uKCdyZW1vdGU6Y2hhbmdlJywgaGFuZGxlUmVtb3RlQ2hhbmdlKTtcbiAgICBob29kaWUub24oJ3JlbW90ZTpwdXNoJywgaGFuZGxlUHVzaGVkT2JqZWN0KTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9uY2UgZnJvbSBvdXRzaWRlXG4gIHN0b3JlLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuICAgIGRlbGV0ZSBzdG9yZS5zdWJzY3JpYmVUb091dHNpZGVFdmVudHM7XG4gIH07XG5cblxuICAvL1xuICAvLyBNYXJrcyBvYmplY3QgYXMgY2hhbmdlZCAoZGlydHkpLiBUcmlnZ2VycyBhIGBzdG9yZTpkaXJ0eWAgZXZlbnQgaW1tZWRpYXRlbHkgYW5kIGFcbiAgLy8gYHN0b3JlOmlkbGVgIGV2ZW50IG9uY2UgdGhlcmUgaXMgbm8gY2hhbmdlIHdpdGhpbiAyIHNlY29uZHNcbiAgLy9cbiAgZnVuY3Rpb24gbWFya0FzQ2hhbmdlZCh0eXBlLCBpZCwgb2JqZWN0LCBvcHRpb25zKSB7XG4gICAgdmFyIGtleTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGtleSA9ICcnICsgdHlwZSArICcvJyArIGlkO1xuXG4gICAgZGlydHlba2V5XSA9IG9iamVjdDtcbiAgICBzYXZlRGlydHlJZHMoKTtcblxuICAgIGlmIChvcHRpb25zLnNpbGVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyaWdnZXJEaXJ0eUFuZElkbGVFdmVudHMoKTtcbiAgfVxuXG4gIC8vIENsZWFyIGNoYW5nZWRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmVtb3ZlcyBhbiBvYmplY3QgZnJvbSB0aGUgbGlzdCBvZiBvYmplY3RzIHRoYXQgYXJlIGZsYWdnZWQgdG8gYnkgc3luY2hlZCAoZGlydHkpXG4gIC8vIGFuZCB0cmlnZ2VycyBhIGBzdG9yZTpkaXJ0eWAgZXZlbnRcbiAgZnVuY3Rpb24gY2xlYXJDaGFuZ2VkKHR5cGUsIGlkKSB7XG4gICAgdmFyIGtleTtcbiAgICBpZiAodHlwZSAmJiBpZCkge1xuICAgICAga2V5ID0gJycgKyB0eXBlICsgJy8nICsgaWQ7XG4gICAgICBkZWxldGUgZGlydHlba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGlydHkgPSB7fTtcbiAgICB9XG4gICAgc2F2ZURpcnR5SWRzKCk7XG4gICAgcmV0dXJuIHdpbmRvdy5jbGVhclRpbWVvdXQoZGlydHlUaW1lb3V0KTtcbiAgfVxuXG5cbiAgLy8gTWFyayBhbGwgYXMgY2hhbmdlZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBNYXJrcyBhbGwgbG9jYWwgb2JqZWN0IGFzIGNoYW5nZWQgKGRpcnR5KSB0byBtYWtlIHRoZW0gc3luY1xuICAvLyB3aXRoIHJlbW90ZVxuICBmdW5jdGlvbiBtYXJrQWxsQXNDaGFuZ2VkKCkge1xuICAgIHJldHVybiBzdG9yZS5maW5kQWxsKCkucGlwZShmdW5jdGlvbihvYmplY3RzKSB7XG4gICAgICB2YXIga2V5LCBvYmplY3QsIF9pLCBfbGVuO1xuXG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG9iamVjdHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgb2JqZWN0ID0gb2JqZWN0c1tfaV07XG4gICAgICAgIGtleSA9ICcnICsgb2JqZWN0LnR5cGUgKyAnLycgKyBvYmplY3QuaWQ7XG4gICAgICAgIGRpcnR5W2tleV0gPSBvYmplY3Q7XG4gICAgICB9XG5cbiAgICAgIHNhdmVEaXJ0eUlkcygpO1xuICAgICAgdHJpZ2dlckRpcnR5QW5kSWRsZUV2ZW50cygpO1xuICAgIH0pO1xuICB9XG5cblxuICAvLyB3aGVuIGEgY2hhbmdlIGNvbWUncyBmcm9tIG91ciByZW1vdGUgc3RvcmUsIHdlIGRpZmZlcmVudGlhdGVcbiAgLy8gd2hldGhlciBhbiBvYmplY3QgaGFzIGJlZW4gcmVtb3ZlZCBvciBhZGRlZCAvIHVwZGF0ZWQgYW5kXG4gIC8vIHJlZmxlY3QgdGhlIGNoYW5nZSBpbiBvdXIgbG9jYWwgc3RvcmUuXG4gIGZ1bmN0aW9uIGhhbmRsZVJlbW90ZUNoYW5nZSh0eXBlT2ZDaGFuZ2UsIG9iamVjdCkge1xuICAgIGlmICh0eXBlT2ZDaGFuZ2UgPT09ICdyZW1vdmUnKSB7XG4gICAgICBzdG9yZS5yZW1vdmUob2JqZWN0LnR5cGUsIG9iamVjdC5pZCwge1xuICAgICAgICByZW1vdGU6IHRydWUsXG4gICAgICAgIHVwZGF0ZTogb2JqZWN0XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RvcmUuc2F2ZShvYmplY3QudHlwZSwgb2JqZWN0LmlkLCBvYmplY3QsIHtcbiAgICAgICAgcmVtb3RlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuXG4gIC8vXG4gIC8vIGFsbCBsb2NhbCBjaGFuZ2VzIGdldCBidWxrIHB1c2hlZC4gRm9yIGVhY2ggb2JqZWN0IHdpdGggbG9jYWxcbiAgLy8gY2hhbmdlcyB0aGF0IGhhcyBiZWVuIHB1c2hlZCB3ZSB0cmlnZ2VyIGEgc3luYyBldmVudFxuICBmdW5jdGlvbiBoYW5kbGVQdXNoZWRPYmplY3Qob2JqZWN0KSB7XG4gICAgdHJpZ2dlckV2ZW50cygnc3luYycsIG9iamVjdCk7XG4gIH1cblxuXG4gIC8vIG1vcmUgYWR2YW5jZWQgbG9jYWxTdG9yYWdlIHdyYXBwZXJzIHRvIGZpbmQvc2F2ZSBvYmplY3RzXG4gIGZ1bmN0aW9uIHNldE9iamVjdCh0eXBlLCBpZCwgb2JqZWN0KSB7XG4gICAgdmFyIGtleSwgc3RvcmU7XG5cbiAgICBrZXkgPSAnJyArIHR5cGUgKyAnLycgKyBpZDtcbiAgICBzdG9yZSA9ICQuZXh0ZW5kKHt9LCBvYmplY3QpO1xuXG4gICAgZGVsZXRlIHN0b3JlLnR5cGU7XG4gICAgZGVsZXRlIHN0b3JlLmlkO1xuICAgIHJldHVybiBkYi5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkoc3RvcmUpKTtcbiAgfVxuICBmdW5jdGlvbiBnZXRPYmplY3QodHlwZSwgaWQpIHtcbiAgICB2YXIga2V5LCBvYmo7XG5cbiAgICBrZXkgPSAnJyArIHR5cGUgKyAnLycgKyBpZDtcbiAgICB2YXIganNvbiA9IGRiLmdldEl0ZW0oa2V5KTtcblxuICAgIGlmIChqc29uKSB7XG4gICAgICBvYmogPSBKU09OLnBhcnNlKGpzb24pO1xuICAgICAgb2JqLnR5cGUgPSB0eXBlO1xuICAgICAgb2JqLmlkID0gaWQ7XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cblxuICAvLyBzdG9yZSBJRHMgb2YgZGlydHkgb2JqZWN0c1xuICBmdW5jdGlvbiBzYXZlRGlydHlJZHMoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICgkLmlzRW1wdHlPYmplY3QoZGlydHkpKSB7XG4gICAgICAgIGRiLnJlbW92ZUl0ZW0oJ19kaXJ0eScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGlkcyA9IE9iamVjdC5rZXlzKGRpcnR5KTtcbiAgICAgICAgZGIuc2V0SXRlbSgnX2RpcnR5JywgaWRzLmpvaW4oJywnKSk7XG4gICAgICB9XG4gICAgfSBjYXRjaChlKSB7fVxuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gbm93KCkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShuZXcgRGF0ZSgpKS5yZXBsYWNlKC9bJ1wiXS9nLCAnJyk7XG4gIH1cblxuXG4gIC8vIGEgc2VtYW50aWMga2V5IGNvbnNpc3RzIG9mIGEgdmFsaWQgdHlwZSAmIGlkLCBzZXBhcmF0ZWQgYnkgYSBcIi9cIlxuICB2YXIgc2VtYW50aWNJZFBhdHRlcm4gPSBuZXcgUmVnRXhwKC9eW2EteiRdW2EtejAtOV0rXFwvW2EtejAtOV0rJC8pO1xuICBmdW5jdGlvbiBpc1NlbWFudGljS2V5KGtleSkge1xuICAgIHJldHVybiBzZW1hbnRpY0lkUGF0dGVybi50ZXN0KGtleSk7XG4gIH1cblxuICAvLyBgaGFzTG9jYWxDaGFuZ2VzYCByZXR1cm5zIHRydWUgaWYgdGhlcmUgaXMgYSBsb2NhbCBjaGFuZ2UgdGhhdFxuICAvLyBoYXMgbm90IGJlZW4gc3luYydkIHlldC5cbiAgZnVuY3Rpb24gaGFzTG9jYWxDaGFuZ2VzKG9iamVjdCkge1xuICAgIGlmICghb2JqZWN0LnVwZGF0ZWRBdCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIW9iamVjdC5fc3luY2VkQXQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0Ll9zeW5jZWRBdCA8IG9iamVjdC51cGRhdGVkQXQ7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBpc01hcmtlZEFzRGVsZXRlZChvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0Ll9kZWxldGVkID09PSB0cnVlO1xuICB9XG5cbiAgLy8gdGhpcyBpcyB3aGVyZSBhbGwgdGhlIHN0b3JlIGV2ZW50cyBnZXQgdHJpZ2dlcmVkLFxuICAvLyBsaWtlIGFkZDp0YXNrLCBjaGFuZ2U6bm90ZTphYmM0NTY3LCByZW1vdmUsIGV0Yy5cbiAgZnVuY3Rpb24gdHJpZ2dlckV2ZW50cyhldmVudE5hbWUsIG9iamVjdCwgb3B0aW9ucykge1xuICAgIHN0b3JlLnRyaWdnZXIoZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG4gICAgc3RvcmUudHJpZ2dlcihvYmplY3QudHlwZSArICc6JyArIGV2ZW50TmFtZSwgJC5leHRlbmQodHJ1ZSwge30sIG9iamVjdCksIG9wdGlvbnMpO1xuXG4gICAgLy8gREVQUkVDQVRFRFxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE0NlxuICAgIHN0b3JlLnRyaWdnZXIoZXZlbnROYW1lICsgJzonICsgb2JqZWN0LnR5cGUsICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcblxuICAgIGlmIChldmVudE5hbWUgIT09ICduZXcnKSB7XG4gICAgICBzdG9yZS50cmlnZ2VyKCBvYmplY3QudHlwZSArICc6JyArIG9iamVjdC5pZCsgJzonICsgZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cbiAgICAgIC8vIERFUFJFQ0FURURcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE0NlxuICAgICAgc3RvcmUudHJpZ2dlciggZXZlbnROYW1lICsgJzonICsgb2JqZWN0LnR5cGUgKyAnOicgKyBvYmplY3QuaWQsICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcbiAgICB9XG5cblxuXG4gICAgLy8gc3luYyBldmVudHMgaGF2ZSBubyBjaGFuZ2VzLCBzbyB3ZSBkb24ndCB0cmlnZ2VyXG4gICAgLy8gXCJjaGFuZ2VcIiBldmVudHMuXG4gICAgaWYgKGV2ZW50TmFtZSA9PT0gJ3N5bmMnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3RvcmUudHJpZ2dlcignY2hhbmdlJywgZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG4gICAgc3RvcmUudHJpZ2dlcihvYmplY3QudHlwZSArICc6Y2hhbmdlJywgZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cbiAgICAvLyBERVBSRUNBVEVEXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hvb2RpZWhxL2hvb2RpZS5qcy9pc3N1ZXMvMTQ2XG4gICAgc3RvcmUudHJpZ2dlcignY2hhbmdlOicgKyBvYmplY3QudHlwZSwgZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cblxuICAgIGlmIChldmVudE5hbWUgIT09ICduZXcnKSB7XG4gICAgICBzdG9yZS50cmlnZ2VyKG9iamVjdC50eXBlICsgJzonICsgb2JqZWN0LmlkICsgJzpjaGFuZ2UnLCBldmVudE5hbWUsICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcblxuICAgICAgLy8gREVQUkVDQVRFRFxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hvb2RpZWhxL2hvb2RpZS5qcy9pc3N1ZXMvMTQ2XG4gICAgICBzdG9yZS50cmlnZ2VyKCdjaGFuZ2U6JyArIG9iamVjdC50eXBlICsgJzonICsgb2JqZWN0LmlkLCBldmVudE5hbWUsICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICAvLyB3aGVuIGFuIG9iamVjdCBnZXRzIGNoYW5nZWQsIHR3byBzcGVjaWFsIGV2ZW50cyBnZXQgdHJpZ2dlcmQ6XG4gIC8vXG4gIC8vIDEuIGRpcnR5IGV2ZW50XG4gIC8vICAgIHRoZSBgZGlydHlgIGV2ZW50IGdldHMgdHJpZ2dlcmVkIGltbWVkaWF0ZWx5LCBmb3IgZXZlcnlcbiAgLy8gICAgY2hhbmdlIHRoYXQgaGFwcGVucy5cbiAgLy8gMi4gaWRsZSBldmVudFxuICAvLyAgICB0aGUgYGlkbGVgIGV2ZW50IGdldHMgdHJpZ2dlcmVkIGFmdGVyIGEgc2hvcnQgdGltZW91dCBvZlxuICAvLyAgICBubyBjaGFuZ2VzLCBlLmcuIDIgc2Vjb25kcy5cbiAgdmFyIGRpcnR5VGltZW91dDtcbiAgZnVuY3Rpb24gdHJpZ2dlckRpcnR5QW5kSWRsZUV2ZW50cygpIHtcbiAgICBzdG9yZS50cmlnZ2VyKCdkaXJ0eScpO1xuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoZGlydHlUaW1lb3V0KTtcblxuICAgIGRpcnR5VGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgc3RvcmUudHJpZ2dlcignaWRsZScsIHN0b3JlLmNoYW5nZWRPYmplY3RzKCkpO1xuICAgIH0sIGlkbGVUaW1lb3V0KTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIHN0YXJ0Qm9vdHN0cmFwcGluZ01vZGUoKSB7XG4gICAgYm9vdHN0cmFwcGluZyA9IHRydWU7XG4gICAgc3RvcmUudHJpZ2dlcignYm9vdHN0cmFwOnN0YXJ0Jyk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBlbmRCb290c3RyYXBwaW5nTW9kZSgpIHtcbiAgICB2YXIgbWV0aG9kQ2FsbCwgbWV0aG9kLCBhcmdzLCBkZWZlcjtcblxuICAgIGJvb3RzdHJhcHBpbmcgPSBmYWxzZTtcbiAgICB3aGlsZShxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICBtZXRob2RDYWxsID0gcXVldWUuc2hpZnQoKTtcbiAgICAgIG1ldGhvZCA9IG1ldGhvZENhbGxbMF07XG4gICAgICBhcmdzID0gbWV0aG9kQ2FsbFsxXTtcbiAgICAgIGRlZmVyID0gbWV0aG9kQ2FsbFsyXTtcbiAgICAgIGxvY2FsU3RvcmVbbWV0aG9kXS5hcHBseShsb2NhbFN0b3JlLCBhcmdzKS50aGVuKGRlZmVyLnJlc29sdmUsIGRlZmVyLnJlamVjdCk7XG4gICAgfVxuXG4gICAgc3RvcmUudHJpZ2dlcignYm9vdHN0cmFwOmVuZCcpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gZW5xdWV1ZShtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgZGVmZXIgPSBob29kaWUuZGVmZXIoKTtcbiAgICBxdWV1ZS5wdXNoKFttZXRob2QsIGFyZ3MsIGRlZmVyXSk7XG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIC8vIHBhdGNoSWZOb3RQZXJzaXN0YW50XG4gIC8vXG4gIGZ1bmN0aW9uIHBhdGNoSWZOb3RQZXJzaXN0YW50ICgpIHtcbiAgICBpZiAoIXN0b3JlLmlzUGVyc2lzdGVudCgpKSB7XG4gICAgICBkYiA9IHtcbiAgICAgICAgZ2V0SXRlbTogZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9LFxuICAgICAgICBzZXRJdGVtOiBmdW5jdGlvbigpIHsgcmV0dXJuIG51bGw7IH0sXG4gICAgICAgIHJlbW92ZUl0ZW06IGZ1bmN0aW9uKCkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgICAga2V5OiBmdW5jdGlvbigpIHsgcmV0dXJuIG51bGw7IH0sXG4gICAgICAgIGxlbmd0aDogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG5cbiAgLy9cbiAgLy8gaW5pdGlhbGl6YXRpb25cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuICAvL1xuXG4gIC8vIGlmIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBsb2NhbCBzdG9yYWdlIHBlcnNpc3RlbmNlLFxuICAvLyBlLmcuIFNhZmFyaSBpbiBwcml2YXRlIG1vZGUsIG92ZXJpdGUgdGhlIHJlc3BlY3RpdmUgbWV0aG9kcy5cblxuXG5cbiAgLy9cbiAgLy8gZXhwb3NlIHB1YmxpYyBBUElcbiAgLy9cbiAgLy8gaW5oZXJpdCBmcm9tIEhvb2RpZXMgU3RvcmUgQVBJXG4gIGhvb2RpZS5zdG9yZSA9IHN0b3JlO1xuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9uY2UgZnJvbSBvdXRzaWRlXG4gIHN0b3JlLmJvb3RzdHJhcERpcnR5T2JqZWN0cyA9IGZ1bmN0aW9uKCkge1xuICAgIGJvb3RzdHJhcERpcnR5T2JqZWN0cygpO1xuICAgIGRlbGV0ZSBzdG9yZS5ib290c3RyYXBEaXJ0eU9iamVjdHM7XG4gIH07XG5cbiAgLy8gYWxsb3cgdG8gcnVuIHRoaXMgb25jZSBmcm9tIG91dHNpZGVcbiAgc3RvcmUucGF0Y2hJZk5vdFBlcnNpc3RhbnQgPSBmdW5jdGlvbigpIHtcbiAgICBwYXRjaElmTm90UGVyc2lzdGFudCgpO1xuICAgIGRlbGV0ZSBzdG9yZS5wYXRjaElmTm90UGVyc2lzdGFudDtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVTdG9yZTtcbiIsIi8vIE9wZW4gc3RvcmVzXG4vLyAtLS0tLS0tLS0tLS0tXG5cbnZhciBob29kaWVSZW1vdGVTdG9yZSA9IHJlcXVpcmUoJy4vcmVtb3RlX3N0b3JlJyk7XG5cbmZ1bmN0aW9uIGhvb2RpZU9wZW4oaG9vZGllKSB7XG5cbiAgLy8gZ2VuZXJpYyBtZXRob2QgdG8gb3BlbiBhIHN0b3JlLiBVc2VkIGJ5XG4gIC8vXG4gIC8vICogaG9vZGllLnJlbW90ZVxuICAvLyAqIGhvb2RpZS51c2VyKFwiam9lXCIpXG4gIC8vICogaG9vZGllLmdsb2JhbFxuICAvLyAqIC4uLiBhbmQgbW9yZVxuICAvL1xuICAvLyAgICAgaG9vZGllLm9wZW4oXCJzb21lX3N0b3JlX25hbWVcIikuZmluZEFsbCgpXG4gIC8vXG4gIGZ1bmN0aW9uIG9wZW4oc3RvcmVOYW1lLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAkLmV4dGVuZChvcHRpb25zLCB7XG4gICAgICBuYW1lOiBzdG9yZU5hbWVcbiAgICB9KTtcblxuICAgIHJldHVybiBob29kaWVSZW1vdGVTdG9yZShob29kaWUsIG9wdGlvbnMpO1xuICB9XG5cbiAgLy9cbiAgLy8gUHVibGljIEFQSVxuICAvL1xuICBob29kaWUub3BlbiA9IG9wZW47XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllT3BlbjtcbiIsIi8vIEhvb2RpZSBEZWZlcnMgLyBQcm9taXNlc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIHJldHVybnMgYSBkZWZlciBvYmplY3QgZm9yIGN1c3RvbSBwcm9taXNlIGhhbmRsaW5ncy5cbi8vIFByb21pc2VzIGFyZSBoZWF2ZWx5IHVzZWQgdGhyb3VnaG91dCB0aGUgY29kZSBvZiBob29kaWUuXG4vLyBXZSBjdXJyZW50bHkgYm9ycm93IGpRdWVyeSdzIGltcGxlbWVudGF0aW9uOlxuLy8gaHR0cDovL2FwaS5qcXVlcnkuY29tL2NhdGVnb3J5L2RlZmVycmVkLW9iamVjdC9cbi8vXG4vLyAgICAgZGVmZXIgPSBob29kaWUuZGVmZXIoKVxuLy8gICAgIGlmIChnb29kKSB7XG4vLyAgICAgICBkZWZlci5yZXNvbHZlKCdnb29kLicpXG4vLyAgICAgfSBlbHNlIHtcbi8vICAgICAgIGRlZmVyLnJlamVjdCgnbm90IGdvb2QuJylcbi8vICAgICB9XG4vLyAgICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKVxuLy9cbnZhciBIb29kaWVFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3InKTtcblxuLy9cbmZ1bmN0aW9uIGhvb2RpZVByb21pc2VzIChob29kaWUpIHtcbiAgdmFyICRkZWZlciA9IHdpbmRvdy5qUXVlcnkuRGVmZXJyZWQ7XG5cbiAgLy8gcmV0dXJucyB0cnVlIGlmIHBhc3NlZCBvYmplY3QgaXMgYSBwcm9taXNlIChidXQgbm90IGEgZGVmZXJyZWQpLFxuICAvLyBvdGhlcndpc2UgZmFsc2UuXG4gIGZ1bmN0aW9uIGlzUHJvbWlzZShvYmplY3QpIHtcbiAgICByZXR1cm4gISEgKG9iamVjdCAmJlxuICAgICAgICAgICAgICAgdHlwZW9mIG9iamVjdC5kb25lID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAgICAgICAgICB0eXBlb2Ygb2JqZWN0LnJlc29sdmUgIT09ICdmdW5jdGlvbicpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gcmVzb2x2ZSgpIHtcbiAgICByZXR1cm4gJGRlZmVyKCkucmVzb2x2ZSgpLnByb21pc2UoKTtcbiAgfVxuXG5cbiAgLy9cbiAgZnVuY3Rpb24gcmVqZWN0KCkge1xuICAgIHJldHVybiAkZGVmZXIoKS5yZWplY3QoKS5wcm9taXNlKCk7XG4gIH1cblxuXG4gIC8vXG4gIGZ1bmN0aW9uIHJlc29sdmVXaXRoKCkge1xuICAgIHZhciBfZGVmZXIgPSAkZGVmZXIoKTtcbiAgICByZXR1cm4gX2RlZmVyLnJlc29sdmUuYXBwbHkoX2RlZmVyLCBhcmd1bWVudHMpLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIHJlamVjdFdpdGgoZXJyb3JQcm9wZXJ0aWVzKSB7XG4gICAgdmFyIF9kZWZlciA9ICRkZWZlcigpO1xuICAgIHZhciBlcnJvciA9IG5ldyBIb29kaWVFcnJvcihlcnJvclByb3BlcnRpZXMpO1xuICAgIHJldHVybiBfZGVmZXIucmVqZWN0KGVycm9yKS5wcm9taXNlKCk7XG4gIH1cblxuICAvL1xuICAvLyBQdWJsaWMgQVBJXG4gIC8vXG4gIGhvb2RpZS5kZWZlciA9ICRkZWZlcjtcbiAgaG9vZGllLmlzUHJvbWlzZSA9IGlzUHJvbWlzZTtcbiAgaG9vZGllLnJlc29sdmUgPSByZXNvbHZlO1xuICBob29kaWUucmVqZWN0ID0gcmVqZWN0O1xuICBob29kaWUucmVzb2x2ZVdpdGggPSByZXNvbHZlV2l0aDtcbiAgaG9vZGllLnJlamVjdFdpdGggPSByZWplY3RXaXRoO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVByb21pc2VzO1xuIiwiLy8gUmVtb3RlXG4vLyA9PT09PT09PVxuXG4vLyBDb25uZWN0aW9uIHRvIGEgcmVtb3RlIENvdWNoIERhdGFiYXNlLlxuLy9cbi8vIHN0b3JlIEFQSVxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuLy9cbi8vIG9iamVjdCBsb2FkaW5nIC8gdXBkYXRpbmcgLyBkZWxldGluZ1xuLy9cbi8vICogZmluZCh0eXBlLCBpZClcbi8vICogZmluZEFsbCh0eXBlIClcbi8vICogYWRkKHR5cGUsIG9iamVjdClcbi8vICogc2F2ZSh0eXBlLCBpZCwgb2JqZWN0KVxuLy8gKiB1cGRhdGUodHlwZSwgaWQsIG5ld19wcm9wZXJ0aWVzIClcbi8vICogdXBkYXRlQWxsKCB0eXBlLCBuZXdfcHJvcGVydGllcylcbi8vICogcmVtb3ZlKHR5cGUsIGlkKVxuLy8gKiByZW1vdmVBbGwodHlwZSlcbi8vXG4vLyBjdXN0b20gcmVxdWVzdHNcbi8vXG4vLyAqIHJlcXVlc3QodmlldywgcGFyYW1zKVxuLy8gKiBnZXQodmlldywgcGFyYW1zKVxuLy8gKiBwb3N0KHZpZXcsIHBhcmFtcylcbi8vXG4vLyBzeW5jaHJvbml6YXRpb25cbi8vXG4vLyAqIGNvbm5lY3QoKVxuLy8gKiBkaXNjb25uZWN0KClcbi8vICogcHVsbCgpXG4vLyAqIHB1c2goKVxuLy8gKiBzeW5jKClcbi8vXG4vLyBldmVudCBiaW5kaW5nXG4vL1xuLy8gKiBvbihldmVudCwgY2FsbGJhY2spXG4vL1xudmFyIGhvb2RpZVN0b3JlQXBpID0gcmVxdWlyZSgnLi9zdG9yZScpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllUmVtb3RlU3RvcmUgKGhvb2RpZSwgb3B0aW9ucykge1xuXG4gIHZhciByZW1vdGVTdG9yZSA9IHt9O1xuXG5cbiAgLy8gUmVtb3RlIFN0b3JlIFBlcnNpc3RhbmNlIG1ldGhvZHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGZpbmRcbiAgLy8gLS0tLS0tXG5cbiAgLy8gZmluZCBvbmUgb2JqZWN0XG4gIC8vXG4gIHJlbW90ZVN0b3JlLmZpbmQgPSBmdW5jdGlvbiBmaW5kKHR5cGUsIGlkKSB7XG4gICAgdmFyIHBhdGg7XG5cbiAgICBwYXRoID0gdHlwZSArICcvJyArIGlkO1xuXG4gICAgaWYgKHJlbW90ZS5wcmVmaXgpIHtcbiAgICAgIHBhdGggPSByZW1vdGUucHJlZml4ICsgcGF0aDtcbiAgICB9XG5cbiAgICBwYXRoID0gJy8nICsgZW5jb2RlVVJJQ29tcG9uZW50KHBhdGgpO1xuXG4gICAgcmV0dXJuIHJlbW90ZS5yZXF1ZXN0KCdHRVQnLCBwYXRoKS50aGVuKHBhcnNlRnJvbVJlbW90ZSk7XG4gIH07XG5cblxuICAvLyBmaW5kQWxsXG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIGZpbmQgYWxsIG9iamVjdHMsIGNhbiBiZSBmaWxldGVyZWQgYnkgYSB0eXBlXG4gIC8vXG4gIHJlbW90ZVN0b3JlLmZpbmRBbGwgPSBmdW5jdGlvbiBmaW5kQWxsKHR5cGUpIHtcbiAgICB2YXIgZW5ka2V5LCBwYXRoLCBzdGFydGtleTtcblxuICAgIHBhdGggPSAnL19hbGxfZG9jcz9pbmNsdWRlX2RvY3M9dHJ1ZSc7XG5cbiAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICBjYXNlICh0eXBlICE9PSB1bmRlZmluZWQpICYmIHJlbW90ZS5wcmVmaXggIT09ICcnOlxuICAgICAgc3RhcnRrZXkgPSByZW1vdGUucHJlZml4ICsgdHlwZSArICcvJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgdHlwZSAhPT0gdW5kZWZpbmVkOlxuICAgICAgc3RhcnRrZXkgPSB0eXBlICsgJy8nO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSByZW1vdGUucHJlZml4ICE9PSAnJzpcbiAgICAgIHN0YXJ0a2V5ID0gcmVtb3RlLnByZWZpeDtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBzdGFydGtleSA9ICcnO1xuICAgIH1cblxuICAgIGlmIChzdGFydGtleSkge1xuXG4gICAgICAvLyBtYWtlIHN1cmUgdGhhdCBvbmx5IG9iamVjdHMgc3RhcnRpbmcgd2l0aFxuICAgICAgLy8gYHN0YXJ0a2V5YCB3aWxsIGJlIHJldHVybmVkXG4gICAgICBlbmRrZXkgPSBzdGFydGtleS5yZXBsYWNlKC8uJC8sIGZ1bmN0aW9uKGNoYXJzKSB7XG4gICAgICAgIHZhciBjaGFyQ29kZTtcbiAgICAgICAgY2hhckNvZGUgPSBjaGFycy5jaGFyQ29kZUF0KDApO1xuICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShjaGFyQ29kZSArIDEpO1xuICAgICAgfSk7XG4gICAgICBwYXRoID0gJycgKyBwYXRoICsgJyZzdGFydGtleT1cIicgKyAoZW5jb2RlVVJJQ29tcG9uZW50KHN0YXJ0a2V5KSkgKyAnXCImZW5ka2V5PVwiJyArIChlbmNvZGVVUklDb21wb25lbnQoZW5ka2V5KSkgKyAnXCInO1xuICAgIH1cblxuICAgIHJldHVybiByZW1vdGUucmVxdWVzdCgnR0VUJywgcGF0aCkudGhlbihtYXBEb2NzRnJvbUZpbmRBbGwpLnRoZW4ocGFyc2VBbGxGcm9tUmVtb3RlKTtcbiAgfTtcblxuXG4gIC8vIHNhdmVcbiAgLy8gLS0tLS0tXG5cbiAgLy8gc2F2ZSBhIG5ldyBvYmplY3QuIElmIGl0IGV4aXN0ZWQgYmVmb3JlLCBhbGwgcHJvcGVydGllc1xuICAvLyB3aWxsIGJlIG92ZXJ3cml0dGVuXG4gIC8vXG4gIHJlbW90ZVN0b3JlLnNhdmUgPSBmdW5jdGlvbiBzYXZlKG9iamVjdCkge1xuICAgIHZhciBwYXRoO1xuXG4gICAgaWYgKCFvYmplY3QuaWQpIHtcbiAgICAgIG9iamVjdC5pZCA9IGhvb2RpZS5nZW5lcmF0ZUlkKCk7XG4gICAgfVxuXG4gICAgb2JqZWN0ID0gcGFyc2VGb3JSZW1vdGUob2JqZWN0KTtcbiAgICBwYXRoID0gJy8nICsgZW5jb2RlVVJJQ29tcG9uZW50KG9iamVjdC5faWQpO1xuICAgIHJldHVybiByZW1vdGUucmVxdWVzdCgnUFVUJywgcGF0aCwge1xuICAgICAgZGF0YTogb2JqZWN0XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyByZW1vdmVcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gcmVtb3ZlIG9uZSBvYmplY3RcbiAgLy9cbiAgcmVtb3RlU3RvcmUucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIHJlbW90ZS51cGRhdGUodHlwZSwgaWQsIHtcbiAgICAgIF9kZWxldGVkOiB0cnVlXG4gICAgfSk7XG4gIH07XG5cblxuICAvLyByZW1vdmVBbGxcbiAgLy8gLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmVtb3ZlIGFsbCBvYmplY3RzLCBjYW4gYmUgZmlsdGVyZWQgYnkgdHlwZVxuICAvL1xuICByZW1vdGVTdG9yZS5yZW1vdmVBbGwgPSBmdW5jdGlvbiByZW1vdmVBbGwodHlwZSkge1xuICAgIHJldHVybiByZW1vdGUudXBkYXRlQWxsKHR5cGUsIHtcbiAgICAgIF9kZWxldGVkOiB0cnVlXG4gICAgfSk7XG4gIH07XG5cblxuICB2YXIgcmVtb3RlID0gaG9vZGllU3RvcmVBcGkoaG9vZGllLCB7XG5cbiAgICBuYW1lOiBvcHRpb25zLm5hbWUsXG5cbiAgICBiYWNrZW5kOiB7XG4gICAgICBzYXZlOiByZW1vdGVTdG9yZS5zYXZlLFxuICAgICAgZmluZDogcmVtb3RlU3RvcmUuZmluZCxcbiAgICAgIGZpbmRBbGw6IHJlbW90ZVN0b3JlLmZpbmRBbGwsXG4gICAgICByZW1vdmU6IHJlbW90ZVN0b3JlLnJlbW92ZSxcbiAgICAgIHJlbW92ZUFsbDogcmVtb3RlU3RvcmUucmVtb3ZlQWxsXG4gICAgfVxuICB9KTtcblxuXG5cblxuXG4gIC8vIHByb3BlcnRpZXNcbiAgLy8gLS0tLS0tLS0tLS0tXG5cbiAgLy8gbmFtZVxuXG4gIC8vIHRoZSBuYW1lIG9mIHRoZSBSZW1vdGUgaXMgdGhlIG5hbWUgb2YgdGhlXG4gIC8vIENvdWNoREIgZGF0YWJhc2UgYW5kIGlzIGFsc28gdXNlZCB0byBwcmVmaXhcbiAgLy8gdHJpZ2dlcmVkIGV2ZW50c1xuICAvL1xuICB2YXIgcmVtb3RlTmFtZSA9IG51bGw7XG5cblxuICAvLyBzeW5jXG5cbiAgLy8gaWYgc2V0IHRvIHRydWUsIHVwZGF0ZXMgd2lsbCBiZSBjb250aW51b3VzbHkgcHVsbGVkXG4gIC8vIGFuZCBwdXNoZWQuIEFsdGVybmF0aXZlbHksIGBzeW5jYCBjYW4gYmUgc2V0IHRvXG4gIC8vIGBwdWxsOiB0cnVlYCBvciBgcHVzaDogdHJ1ZWAuXG4gIC8vXG4gIHJlbW90ZS5jb25uZWN0ZWQgPSBmYWxzZTtcblxuXG4gIC8vIHByZWZpeFxuXG4gIC8vIHByZWZpeCBmb3IgZG9jcyBpbiBhIENvdWNoREIgZGF0YWJhc2UsIGUuZy4gYWxsIGRvY3NcbiAgLy8gaW4gcHVibGljIHVzZXIgc3RvcmVzIGFyZSBwcmVmaXhlZCBieSAnJHB1YmxpYy8nXG4gIC8vXG4gIHJlbW90ZS5wcmVmaXggPSAnJztcbiAgdmFyIHJlbW90ZVByZWZpeFBhdHRlcm4gPSBuZXcgUmVnRXhwKCdeJyk7XG5cblxuICAvLyBkZWZhdWx0c1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgaWYgKG9wdGlvbnMubmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmVtb3RlTmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnByZWZpeCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmVtb3RlLnByZWZpeCA9IG9wdGlvbnMucHJlZml4O1xuICAgIHJlbW90ZVByZWZpeFBhdHRlcm4gPSBuZXcgUmVnRXhwKCdeJyArIHJlbW90ZS5wcmVmaXgpO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuYmFzZVVybCAhPT0gbnVsbCkge1xuICAgIHJlbW90ZS5iYXNlVXJsID0gb3B0aW9ucy5iYXNlVXJsO1xuICB9XG5cblxuICAvLyByZXF1ZXN0XG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHdyYXBwZXIgZm9yIGhvb2RpZS5yZXF1ZXN0LCB3aXRoIHNvbWUgc3RvcmUgc3BlY2lmaWMgZGVmYXVsdHNcbiAgLy8gYW5kIGEgcHJlZml4ZWQgcGF0aFxuICAvL1xuICByZW1vdGUucmVxdWVzdCA9IGZ1bmN0aW9uIHJlcXVlc3QodHlwZSwgcGF0aCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKHJlbW90ZU5hbWUpIHtcbiAgICAgIHBhdGggPSAnLycgKyAoZW5jb2RlVVJJQ29tcG9uZW50KHJlbW90ZU5hbWUpKSArIHBhdGg7XG4gICAgfVxuXG4gICAgaWYgKHJlbW90ZS5iYXNlVXJsKSB7XG4gICAgICBwYXRoID0gJycgKyByZW1vdGUuYmFzZVVybCArIHBhdGg7XG4gICAgfVxuXG4gICAgb3B0aW9ucy5jb250ZW50VHlwZSA9IG9wdGlvbnMuY29udGVudFR5cGUgfHwgJ2FwcGxpY2F0aW9uL2pzb24nO1xuXG4gICAgaWYgKHR5cGUgPT09ICdQT1NUJyB8fCB0eXBlID09PSAnUFVUJykge1xuICAgICAgb3B0aW9ucy5kYXRhVHlwZSA9IG9wdGlvbnMuZGF0YVR5cGUgfHwgJ2pzb24nO1xuICAgICAgb3B0aW9ucy5wcm9jZXNzRGF0YSA9IG9wdGlvbnMucHJvY2Vzc0RhdGEgfHwgZmFsc2U7XG4gICAgICBvcHRpb25zLmRhdGEgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLmRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gaG9vZGllLnJlcXVlc3QodHlwZSwgcGF0aCwgb3B0aW9ucyk7XG4gIH07XG5cblxuICAvLyBpc0tub3duT2JqZWN0XG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGRldGVybWluZSBiZXR3ZWVuIGEga25vd24gYW5kIGEgbmV3IG9iamVjdFxuICAvL1xuICByZW1vdGUuaXNLbm93bk9iamVjdCA9IGZ1bmN0aW9uIGlzS25vd25PYmplY3Qob2JqZWN0KSB7XG4gICAgdmFyIGtleSA9ICcnICsgb2JqZWN0LnR5cGUgKyAnLycgKyBvYmplY3QuaWQ7XG5cbiAgICBpZiAoa25vd25PYmplY3RzW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGtub3duT2JqZWN0c1trZXldO1xuICAgIH1cbiAgfTtcblxuXG4gIC8vIG1hcmtBc0tub3duT2JqZWN0XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBkZXRlcm1pbmUgYmV0d2VlbiBhIGtub3duIGFuZCBhIG5ldyBvYmplY3RcbiAgLy9cbiAgcmVtb3RlLm1hcmtBc0tub3duT2JqZWN0ID0gZnVuY3Rpb24gbWFya0FzS25vd25PYmplY3Qob2JqZWN0KSB7XG4gICAgdmFyIGtleSA9ICcnICsgb2JqZWN0LnR5cGUgKyAnLycgKyBvYmplY3QuaWQ7XG4gICAga25vd25PYmplY3RzW2tleV0gPSAxO1xuICAgIHJldHVybiBrbm93bk9iamVjdHNba2V5XTtcbiAgfTtcblxuXG4gIC8vIHN5bmNocm9uaXphdGlvblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIENvbm5lY3RcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gc3RhcnQgc3luY2luZy4gYHJlbW90ZS5ib290c3RyYXAoKWAgd2lsbCBhdXRvbWF0aWNhbGx5IHN0YXJ0XG4gIC8vIHB1bGxpbmcgd2hlbiBgcmVtb3RlLmNvbm5lY3RlZGAgcmVtYWlucyB0cnVlLlxuICAvL1xuICByZW1vdGUuY29ubmVjdCA9IGZ1bmN0aW9uIGNvbm5lY3QobmFtZSkge1xuICAgIGlmIChuYW1lKSB7XG4gICAgICByZW1vdGVOYW1lID0gbmFtZTtcbiAgICB9XG4gICAgcmVtb3RlLmNvbm5lY3RlZCA9IHRydWU7XG4gICAgcmVtb3RlLnRyaWdnZXIoJ2Nvbm5lY3QnKTtcbiAgICByZXR1cm4gcmVtb3RlLmJvb3RzdHJhcCgpLnRoZW4oIGZ1bmN0aW9uKCkgeyByZW1vdGUucHVzaCgpOyB9ICk7XG4gIH07XG5cblxuICAvLyBEaXNjb25uZWN0XG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIHN0b3Agc3luY2luZyBjaGFuZ2VzIGZyb20gcmVtb3RlIHN0b3JlXG4gIC8vXG4gIHJlbW90ZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24gZGlzY29ubmVjdCgpIHtcbiAgICByZW1vdGUuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgcmVtb3RlLnRyaWdnZXIoJ2Rpc2Nvbm5lY3QnKTsgLy8gVE9ETzogc3BlYyB0aGF0XG5cbiAgICBpZiAocHVsbFJlcXVlc3QpIHtcbiAgICAgIHB1bGxSZXF1ZXN0LmFib3J0KCk7XG4gICAgfVxuXG4gICAgaWYgKHB1c2hSZXF1ZXN0KSB7XG4gICAgICBwdXNoUmVxdWVzdC5hYm9ydCgpO1xuICAgIH1cblxuICB9O1xuXG5cbiAgLy8gaXNDb25uZWN0ZWRcbiAgLy8gLS0tLS0tLS0tLS0tLVxuXG4gIC8vXG4gIHJlbW90ZS5pc0Nvbm5lY3RlZCA9IGZ1bmN0aW9uIGlzQ29ubmVjdGVkKCkge1xuICAgIHJldHVybiByZW1vdGUuY29ubmVjdGVkO1xuICB9O1xuXG5cbiAgLy8gZ2V0U2luY2VOclxuICAvLyAtLS0tLS0tLS0tLS1cblxuICAvLyByZXR1cm5zIHRoZSBzZXF1ZW5jZSBudW1iZXIgZnJvbSB3aWNoIHRvIHN0YXJ0IHRvIGZpbmQgY2hhbmdlcyBpbiBwdWxsXG4gIC8vXG4gIHZhciBzaW5jZSA9IG9wdGlvbnMuc2luY2UgfHwgMDsgLy8gVE9ETzogc3BlYyB0aGF0IVxuICByZW1vdGUuZ2V0U2luY2VOciA9IGZ1bmN0aW9uIGdldFNpbmNlTnIoKSB7XG4gICAgaWYgKHR5cGVvZiBzaW5jZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHNpbmNlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNpbmNlO1xuICB9O1xuXG5cbiAgLy8gYm9vdHN0cmFwXG4gIC8vIC0tLS0tLS0tLS0tXG5cbiAgLy8gaW5pdGFsIHB1bGwgb2YgZGF0YSBvZiB0aGUgcmVtb3RlIHN0b3JlLiBCeSBkZWZhdWx0LCB3ZSBwdWxsIGFsbFxuICAvLyBjaGFuZ2VzIHNpbmNlIHRoZSBiZWdpbm5pbmcsIGJ1dCB0aGlzIGJlaGF2aW9yIG1pZ2h0IGJlIGFkanVzdGVkLFxuICAvLyBlLmcgZm9yIGEgZmlsdGVyZWQgYm9vdHN0cmFwLlxuICAvL1xuICB2YXIgaXNCb290c3RyYXBwaW5nID0gZmFsc2U7XG4gIHJlbW90ZS5ib290c3RyYXAgPSBmdW5jdGlvbiBib290c3RyYXAoKSB7XG4gICAgaXNCb290c3RyYXBwaW5nID0gdHJ1ZTtcbiAgICByZW1vdGUudHJpZ2dlcignYm9vdHN0cmFwOnN0YXJ0Jyk7XG4gICAgcmV0dXJuIHJlbW90ZS5wdWxsKCkuZG9uZSggaGFuZGxlQm9vdHN0cmFwU3VjY2VzcyApO1xuICB9O1xuXG5cbiAgLy8gcHVsbCBjaGFuZ2VzXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gYS5rLmEuIG1ha2UgYSBHRVQgcmVxdWVzdCB0byBDb3VjaERCJ3MgYF9jaGFuZ2VzYCBmZWVkLlxuICAvLyBXZSBjdXJyZW50bHkgbWFrZSBsb25nIHBvbGwgcmVxdWVzdHMsIHRoYXQgd2UgbWFudWFsbHkgYWJvcnRcbiAgLy8gYW5kIHJlc3RhcnQgZWFjaCAyNSBzZWNvbmRzLlxuICAvL1xuICB2YXIgcHVsbFJlcXVlc3QsIHB1bGxSZXF1ZXN0VGltZW91dDtcbiAgcmVtb3RlLnB1bGwgPSBmdW5jdGlvbiBwdWxsKCkge1xuICAgIHB1bGxSZXF1ZXN0ID0gcmVtb3RlLnJlcXVlc3QoJ0dFVCcsIHB1bGxVcmwoKSk7XG5cbiAgICBpZiAocmVtb3RlLmlzQ29ubmVjdGVkKCkpIHtcbiAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQocHVsbFJlcXVlc3RUaW1lb3V0KTtcbiAgICAgIHB1bGxSZXF1ZXN0VGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KHJlc3RhcnRQdWxsUmVxdWVzdCwgMjUwMDApO1xuICAgIH1cblxuICAgIHJldHVybiBwdWxsUmVxdWVzdC5kb25lKGhhbmRsZVB1bGxTdWNjZXNzKS5mYWlsKGhhbmRsZVB1bGxFcnJvcik7XG4gIH07XG5cblxuICAvLyBwdXNoIGNoYW5nZXNcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBQdXNoIG9iamVjdHMgdG8gcmVtb3RlIHN0b3JlIHVzaW5nIHRoZSBgX2J1bGtfZG9jc2AgQVBJLlxuICAvL1xuICB2YXIgcHVzaFJlcXVlc3Q7XG4gIHJlbW90ZS5wdXNoID0gZnVuY3Rpb24gcHVzaChvYmplY3RzKSB7XG4gICAgdmFyIG9iamVjdCwgb2JqZWN0c0ZvclJlbW90ZSwgX2ksIF9sZW47XG5cbiAgICBpZiAoISQuaXNBcnJheShvYmplY3RzKSkge1xuICAgICAgb2JqZWN0cyA9IGRlZmF1bHRPYmplY3RzVG9QdXNoKCk7XG4gICAgfVxuXG4gICAgaWYgKG9iamVjdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlc29sdmVXaXRoKFtdKTtcbiAgICB9XG5cbiAgICBvYmplY3RzRm9yUmVtb3RlID0gW107XG5cbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG9iamVjdHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcblxuICAgICAgLy8gZG9uJ3QgbWVzcyB3aXRoIG9yaWdpbmFsIG9iamVjdHNcbiAgICAgIG9iamVjdCA9ICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3RzW19pXSk7XG4gICAgICBhZGRSZXZpc2lvblRvKG9iamVjdCk7XG4gICAgICBvYmplY3QgPSBwYXJzZUZvclJlbW90ZShvYmplY3QpO1xuICAgICAgb2JqZWN0c0ZvclJlbW90ZS5wdXNoKG9iamVjdCk7XG4gICAgfVxuICAgIHB1c2hSZXF1ZXN0ID0gcmVtb3RlLnJlcXVlc3QoJ1BPU1QnLCAnL19idWxrX2RvY3MnLCB7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIGRvY3M6IG9iamVjdHNGb3JSZW1vdGUsXG4gICAgICAgIG5ld19lZGl0czogZmFsc2VcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHB1c2hSZXF1ZXN0LmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iamVjdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmVtb3RlLnRyaWdnZXIoJ3B1c2gnLCBvYmplY3RzW2ldKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcHVzaFJlcXVlc3Q7XG4gIH07XG5cbiAgLy8gc3luYyBjaGFuZ2VzXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcHVzaCBvYmplY3RzLCB0aGVuIHB1bGwgdXBkYXRlcy5cbiAgLy9cbiAgcmVtb3RlLnN5bmMgPSBmdW5jdGlvbiBzeW5jKG9iamVjdHMpIHtcbiAgICByZXR1cm4gcmVtb3RlLnB1c2gob2JqZWN0cykudGhlbihyZW1vdGUucHVsbCk7XG4gIH07XG5cbiAgLy9cbiAgLy8gUHJpdmF0ZVxuICAvLyAtLS0tLS0tLS1cbiAgLy9cblxuICAvLyBpbiBvcmRlciB0byBkaWZmZXJlbnRpYXRlIHdoZXRoZXIgYW4gb2JqZWN0IGZyb20gcmVtb3RlIHNob3VsZCB0cmlnZ2VyIGEgJ25ldydcbiAgLy8gb3IgYW4gJ3VwZGF0ZScgZXZlbnQsIHdlIHN0b3JlIGEgaGFzaCBvZiBrbm93biBvYmplY3RzXG4gIHZhciBrbm93bk9iamVjdHMgPSB7fTtcblxuXG4gIC8vIHZhbGlkIENvdWNoREIgZG9jIGF0dHJpYnV0ZXMgc3RhcnRpbmcgd2l0aCBhbiB1bmRlcnNjb3JlXG4gIC8vXG4gIHZhciB2YWxpZFNwZWNpYWxBdHRyaWJ1dGVzID0gWydfaWQnLCAnX3JldicsICdfZGVsZXRlZCcsICdfcmV2aXNpb25zJywgJ19hdHRhY2htZW50cyddO1xuXG5cbiAgLy8gZGVmYXVsdCBvYmplY3RzIHRvIHB1c2hcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyB3aGVuIHB1c2hlZCB3aXRob3V0IHBhc3NpbmcgYW55IG9iamVjdHMsIHRoZSBvYmplY3RzIHJldHVybmVkIGZyb21cbiAgLy8gdGhpcyBtZXRob2Qgd2lsbCBiZSBwYXNzZWQuIEl0IGNhbiBiZSBvdmVyd3JpdHRlbiBieSBwYXNzaW5nIGFuXG4gIC8vIGFycmF5IG9mIG9iamVjdHMgb3IgYSBmdW5jdGlvbiBhcyBgb3B0aW9ucy5vYmplY3RzYFxuICAvL1xuICB2YXIgZGVmYXVsdE9iamVjdHNUb1B1c2ggPSBmdW5jdGlvbiBkZWZhdWx0T2JqZWN0c1RvUHVzaCgpIHtcbiAgICByZXR1cm4gW107XG4gIH07XG4gIGlmIChvcHRpb25zLmRlZmF1bHRPYmplY3RzVG9QdXNoKSB7XG4gICAgaWYgKCQuaXNBcnJheShvcHRpb25zLmRlZmF1bHRPYmplY3RzVG9QdXNoKSkge1xuICAgICAgZGVmYXVsdE9iamVjdHNUb1B1c2ggPSBmdW5jdGlvbiBkZWZhdWx0T2JqZWN0c1RvUHVzaCgpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuZGVmYXVsdE9iamVjdHNUb1B1c2g7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZhdWx0T2JqZWN0c1RvUHVzaCA9IG9wdGlvbnMuZGVmYXVsdE9iamVjdHNUb1B1c2g7XG4gICAgfVxuICB9XG5cblxuICAvLyBzZXRTaW5jZU5yXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIHNldHMgdGhlIHNlcXVlbmNlIG51bWJlciBmcm9tIHdpY2ggdG8gc3RhcnQgdG8gZmluZCBjaGFuZ2VzIGluIHB1bGwuXG4gIC8vIElmIHJlbW90ZSBzdG9yZSB3YXMgaW5pdGlhbGl6ZWQgd2l0aCBzaW5jZSA6IGZ1bmN0aW9uKG5yKSB7IC4uLiB9LFxuICAvLyBjYWxsIHRoZSBmdW5jdGlvbiB3aXRoIHRoZSBzZXEgcGFzc2VkLiBPdGhlcndpc2Ugc2ltcGx5IHNldCB0aGUgc2VxXG4gIC8vIG51bWJlciBhbmQgcmV0dXJuIGl0LlxuICAvL1xuICBmdW5jdGlvbiBzZXRTaW5jZU5yKHNlcSkge1xuICAgIGlmICh0eXBlb2Ygc2luY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBzaW5jZShzZXEpO1xuICAgIH1cblxuICAgIHNpbmNlID0gc2VxO1xuICAgIHJldHVybiBzaW5jZTtcbiAgfVxuXG5cbiAgLy8gUGFyc2UgZm9yIHJlbW90ZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBwYXJzZSBvYmplY3QgZm9yIHJlbW90ZSBzdG9yYWdlLiBBbGwgcHJvcGVydGllcyBzdGFydGluZyB3aXRoIGFuXG4gIC8vIGB1bmRlcnNjb3JlYCBkbyBub3QgZ2V0IHN5bmNocm9uaXplZCBkZXNwaXRlIHRoZSBzcGVjaWFsIHByb3BlcnRpZXNcbiAgLy8gYF9pZGAsIGBfcmV2YCBhbmQgYF9kZWxldGVkYCAoc2VlIGFib3ZlKVxuICAvL1xuICAvLyBBbHNvIGBpZGAgZ2V0cyByZXBsYWNlZCB3aXRoIGBfaWRgIHdoaWNoIGNvbnNpc3RzIG9mIHR5cGUgJiBpZFxuICAvL1xuICBmdW5jdGlvbiBwYXJzZUZvclJlbW90ZShvYmplY3QpIHtcbiAgICB2YXIgYXR0ciwgcHJvcGVydGllcztcbiAgICBwcm9wZXJ0aWVzID0gJC5leHRlbmQoe30sIG9iamVjdCk7XG5cbiAgICBmb3IgKGF0dHIgaW4gcHJvcGVydGllcykge1xuICAgICAgaWYgKHByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkoYXR0cikpIHtcbiAgICAgICAgaWYgKHZhbGlkU3BlY2lhbEF0dHJpYnV0ZXMuaW5kZXhPZihhdHRyKSAhPT0gLTEpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIS9eXy8udGVzdChhdHRyKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGRlbGV0ZSBwcm9wZXJ0aWVzW2F0dHJdO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHByZXBhcmUgQ291Y2hEQiBpZFxuICAgIHByb3BlcnRpZXMuX2lkID0gJycgKyBwcm9wZXJ0aWVzLnR5cGUgKyAnLycgKyBwcm9wZXJ0aWVzLmlkO1xuICAgIGlmIChyZW1vdGUucHJlZml4KSB7XG4gICAgICBwcm9wZXJ0aWVzLl9pZCA9ICcnICsgcmVtb3RlLnByZWZpeCArIHByb3BlcnRpZXMuX2lkO1xuICAgIH1cbiAgICBkZWxldGUgcHJvcGVydGllcy5pZDtcbiAgICByZXR1cm4gcHJvcGVydGllcztcbiAgfVxuXG5cbiAgLy8gIyMjIF9wYXJzZUZyb21SZW1vdGVcblxuICAvLyBub3JtYWxpemUgb2JqZWN0cyBjb21pbmcgZnJvbSByZW1vdGVcbiAgLy9cbiAgLy8gcmVuYW1lcyBgX2lkYCBhdHRyaWJ1dGUgdG8gYGlkYCBhbmQgcmVtb3ZlcyB0aGUgdHlwZSBmcm9tIHRoZSBpZCxcbiAgLy8gZS5nLiBgdHlwZS8xMjNgIC0+IGAxMjNgXG4gIC8vXG4gIGZ1bmN0aW9uIHBhcnNlRnJvbVJlbW90ZShvYmplY3QpIHtcbiAgICB2YXIgaWQsIGlnbm9yZSwgX3JlZjtcblxuICAgIC8vIGhhbmRsZSBpZCBhbmQgdHlwZVxuICAgIGlkID0gb2JqZWN0Ll9pZCB8fCBvYmplY3QuaWQ7XG4gICAgZGVsZXRlIG9iamVjdC5faWQ7XG5cbiAgICBpZiAocmVtb3RlLnByZWZpeCkge1xuICAgICAgaWQgPSBpZC5yZXBsYWNlKHJlbW90ZVByZWZpeFBhdHRlcm4sICcnKTtcbiAgICAgIC8vIGlkID0gaWQucmVwbGFjZShuZXcgUmVnRXhwKCdeJyArIHJlbW90ZS5wcmVmaXgpLCAnJyk7XG4gICAgfVxuXG4gICAgLy8gdHVybiBkb2MvMTIzIGludG8gdHlwZSA9IGRvYyAmIGlkID0gMTIzXG4gICAgLy8gTk9URTogd2UgZG9uJ3QgdXNlIGEgc2ltcGxlIGlkLnNwbGl0KC9cXC8vKSBoZXJlLFxuICAgIC8vIGFzIGluIHNvbWUgY2FzZXMgSURzIG1pZ2h0IGNvbnRhaW4gJy8nLCB0b29cbiAgICAvL1xuICAgIF9yZWYgPSBpZC5tYXRjaCgvKFteXFwvXSspXFwvKC4qKS8pLFxuICAgIGlnbm9yZSA9IF9yZWZbMF0sXG4gICAgb2JqZWN0LnR5cGUgPSBfcmVmWzFdLFxuICAgIG9iamVjdC5pZCA9IF9yZWZbMl07XG5cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VBbGxGcm9tUmVtb3RlKG9iamVjdHMpIHtcbiAgICB2YXIgb2JqZWN0LCBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgX3Jlc3VsdHMgPSBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG9iamVjdHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIG9iamVjdCA9IG9iamVjdHNbX2ldO1xuICAgICAgX3Jlc3VsdHMucHVzaChwYXJzZUZyb21SZW1vdGUob2JqZWN0KSk7XG4gICAgfVxuICAgIHJldHVybiBfcmVzdWx0cztcbiAgfVxuXG5cbiAgLy8gIyMjIF9hZGRSZXZpc2lvblRvXG5cbiAgLy8gZXh0ZW5kcyBwYXNzZWQgb2JqZWN0IHdpdGggYSBfcmV2IHByb3BlcnR5XG4gIC8vXG4gIGZ1bmN0aW9uIGFkZFJldmlzaW9uVG8oYXR0cmlidXRlcykge1xuICAgIHZhciBjdXJyZW50UmV2SWQsIGN1cnJlbnRSZXZOciwgbmV3UmV2aXNpb25JZCwgX3JlZjtcbiAgICB0cnkge1xuICAgICAgX3JlZiA9IGF0dHJpYnV0ZXMuX3Jldi5zcGxpdCgvLS8pLFxuICAgICAgY3VycmVudFJldk5yID0gX3JlZlswXSxcbiAgICAgIGN1cnJlbnRSZXZJZCA9IF9yZWZbMV07XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7fVxuICAgIGN1cnJlbnRSZXZOciA9IHBhcnNlSW50KGN1cnJlbnRSZXZOciwgMTApIHx8IDA7XG4gICAgbmV3UmV2aXNpb25JZCA9IGdlbmVyYXRlTmV3UmV2aXNpb25JZCgpO1xuXG4gICAgLy8gbG9jYWwgY2hhbmdlcyBhcmUgbm90IG1lYW50IHRvIGJlIHJlcGxpY2F0ZWQgb3V0c2lkZSBvZiB0aGVcbiAgICAvLyB1c2VycyBkYXRhYmFzZSwgdGhlcmVmb3JlIHRoZSBgLWxvY2FsYCBzdWZmaXguXG4gICAgaWYgKGF0dHJpYnV0ZXMuXyRsb2NhbCkge1xuICAgICAgbmV3UmV2aXNpb25JZCArPSAnLWxvY2FsJztcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVzLl9yZXYgPSAnJyArIChjdXJyZW50UmV2TnIgKyAxKSArICctJyArIG5ld1JldmlzaW9uSWQ7XG4gICAgYXR0cmlidXRlcy5fcmV2aXNpb25zID0ge1xuICAgICAgc3RhcnQ6IDEsXG4gICAgICBpZHM6IFtuZXdSZXZpc2lvbklkXVxuICAgIH07XG5cbiAgICBpZiAoY3VycmVudFJldklkKSB7XG4gICAgICBhdHRyaWJ1dGVzLl9yZXZpc2lvbnMuc3RhcnQgKz0gY3VycmVudFJldk5yO1xuICAgICAgcmV0dXJuIGF0dHJpYnV0ZXMuX3JldmlzaW9ucy5pZHMucHVzaChjdXJyZW50UmV2SWQpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gIyMjIGdlbmVyYXRlIG5ldyByZXZpc2lvbiBpZFxuXG4gIC8vXG4gIGZ1bmN0aW9uIGdlbmVyYXRlTmV3UmV2aXNpb25JZCgpIHtcbiAgICByZXR1cm4gaG9vZGllLmdlbmVyYXRlSWQoOSk7XG4gIH1cblxuXG4gIC8vICMjIyBtYXAgZG9jcyBmcm9tIGZpbmRBbGxcblxuICAvL1xuICBmdW5jdGlvbiBtYXBEb2NzRnJvbUZpbmRBbGwocmVzcG9uc2UpIHtcbiAgICByZXR1cm4gcmVzcG9uc2Uucm93cy5tYXAoZnVuY3Rpb24ocm93KSB7XG4gICAgICByZXR1cm4gcm93LmRvYztcbiAgICB9KTtcbiAgfVxuXG5cbiAgLy8gIyMjIHB1bGwgdXJsXG5cbiAgLy8gRGVwZW5kaW5nIG9uIHdoZXRoZXIgcmVtb3RlIGlzIGNvbm5lY3RlZCAoPSBwdWxsaW5nIGNoYW5nZXMgY29udGludW91c2x5KVxuICAvLyByZXR1cm4gYSBsb25ncG9sbCBVUkwgb3Igbm90LiBJZiBpdCBpcyBhIGJlZ2lubmluZyBib290c3RyYXAgcmVxdWVzdCwgZG9cbiAgLy8gbm90IHJldHVybiBhIGxvbmdwb2xsIFVSTCwgYXMgd2Ugd2FudCBpdCB0byBmaW5pc2ggcmlnaHQgYXdheSwgZXZlbiBpZiB0aGVyZVxuICAvLyBhcmUgbm8gY2hhbmdlcyBvbiByZW1vdGUuXG4gIC8vXG4gIGZ1bmN0aW9uIHB1bGxVcmwoKSB7XG4gICAgdmFyIHNpbmNlO1xuICAgIHNpbmNlID0gcmVtb3RlLmdldFNpbmNlTnIoKTtcbiAgICBpZiAocmVtb3RlLmlzQ29ubmVjdGVkKCkgJiYgIWlzQm9vdHN0cmFwcGluZykge1xuICAgICAgcmV0dXJuICcvX2NoYW5nZXM/aW5jbHVkZV9kb2NzPXRydWUmc2luY2U9JyArIHNpbmNlICsgJyZoZWFydGJlYXQ9MTAwMDAmZmVlZD1sb25ncG9sbCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnL19jaGFuZ2VzP2luY2x1ZGVfZG9jcz10cnVlJnNpbmNlPScgKyBzaW5jZTtcbiAgICB9XG4gIH1cblxuXG4gIC8vICMjIyByZXN0YXJ0IHB1bGwgcmVxdWVzdFxuXG4gIC8vIHJlcXVlc3QgZ2V0cyByZXN0YXJ0ZWQgYXV0b21hdGljY2FsbHlcbiAgLy8gd2hlbiBhYm9ydGVkIChzZWUgaGFuZGxlUHVsbEVycm9yKVxuICBmdW5jdGlvbiByZXN0YXJ0UHVsbFJlcXVlc3QoKSB7XG4gICAgaWYgKHB1bGxSZXF1ZXN0KSB7XG4gICAgICBwdWxsUmVxdWVzdC5hYm9ydCgpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gIyMjIHB1bGwgc3VjY2VzcyBoYW5kbGVyXG5cbiAgLy8gcmVxdWVzdCBnZXRzIHJlc3RhcnRlZCBhdXRvbWF0aWNjYWxseVxuICAvLyB3aGVuIGFib3J0ZWQgKHNlZSBoYW5kbGVQdWxsRXJyb3IpXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZVB1bGxTdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgc2V0U2luY2VOcihyZXNwb25zZS5sYXN0X3NlcSk7XG4gICAgaGFuZGxlUHVsbFJlc3VsdHMocmVzcG9uc2UucmVzdWx0cyk7XG4gICAgaWYgKHJlbW90ZS5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgICByZXR1cm4gcmVtb3RlLnB1bGwoKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vICMjIyBwdWxsIGVycm9yIGhhbmRsZXJcblxuICAvLyB3aGVuIHRoZXJlIGlzIGEgY2hhbmdlLCB0cmlnZ2VyIGV2ZW50LFxuICAvLyB0aGVuIGNoZWNrIGZvciBhbm90aGVyIGNoYW5nZVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVQdWxsRXJyb3IoeGhyLCBlcnJvcikge1xuICAgIGlmICghcmVtb3RlLmlzQ29ubmVjdGVkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHhoci5zdGF0dXMpIHtcbiAgICAgIC8vIFNlc3Npb24gaXMgaW52YWxpZC4gVXNlciBpcyBzdGlsbCBsb2dpbiwgYnV0IG5lZWRzIHRvIHJlYXV0aGVudGljYXRlXG4gICAgICAvLyBiZWZvcmUgc3luYyBjYW4gYmUgY29udGludWVkXG4gICAgY2FzZSA0MDE6XG4gICAgICByZW1vdGUudHJpZ2dlcignZXJyb3I6dW5hdXRoZW50aWNhdGVkJywgZXJyb3IpO1xuICAgICAgcmV0dXJuIHJlbW90ZS5kaXNjb25uZWN0KCk7XG5cbiAgICAgLy8gdGhlIDQwNCBjb21lcywgd2hlbiB0aGUgcmVxdWVzdGVkIERCIGhhcyBiZWVuIHJlbW92ZWRcbiAgICAgLy8gb3IgZG9lcyBub3QgZXhpc3QgeWV0LlxuICAgICAvL1xuICAgICAvLyBCVVQ6IGl0IG1pZ2h0IGFsc28gaGFwcGVuIHRoYXQgdGhlIGJhY2tncm91bmQgd29ya2VycyBkaWRcbiAgICAgLy8gICAgICBub3QgY3JlYXRlIGEgcGVuZGluZyBkYXRhYmFzZSB5ZXQuIFRoZXJlZm9yZSxcbiAgICAgLy8gICAgICB3ZSB0cnkgaXQgYWdhaW4gaW4gMyBzZWNvbmRzXG4gICAgIC8vXG4gICAgIC8vIFRPRE86IHJldmlldyAvIHJldGhpbmsgdGhhdC5cbiAgICAgLy9cblxuICAgIGNhc2UgNDA0OlxuICAgICAgcmV0dXJuIHdpbmRvdy5zZXRUaW1lb3V0KHJlbW90ZS5wdWxsLCAzMDAwKTtcblxuICAgIGNhc2UgNTAwOlxuICAgICAgLy9cbiAgICAgIC8vIFBsZWFzZSBzZXJ2ZXIsIGRvbid0IGdpdmUgdXMgdGhlc2UuIEF0IGxlYXN0IG5vdCBwZXJzaXN0ZW50bHlcbiAgICAgIC8vXG4gICAgICByZW1vdGUudHJpZ2dlcignZXJyb3I6c2VydmVyJywgZXJyb3IpO1xuICAgICAgd2luZG93LnNldFRpbWVvdXQocmVtb3RlLnB1bGwsIDMwMDApO1xuICAgICAgcmV0dXJuIGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICBkZWZhdWx0OlxuICAgICAgLy8gdXN1YWxseSBhIDAsIHdoaWNoIHN0YW5kcyBmb3IgdGltZW91dCBvciBzZXJ2ZXIgbm90IHJlYWNoYWJsZS5cbiAgICAgIGlmICh4aHIuc3RhdHVzVGV4dCA9PT0gJ2Fib3J0Jykge1xuICAgICAgICAvLyBtYW51YWwgYWJvcnQgYWZ0ZXIgMjVzZWMuIHJlc3RhcnQgcHVsbGluZyBjaGFuZ2VzIGRpcmVjdGx5IHdoZW4gY29ubmVjdGVkXG4gICAgICAgIHJldHVybiByZW1vdGUucHVsbCgpO1xuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAvLyBvb3BzLiBUaGlzIG1pZ2h0IGJlIGNhdXNlZCBieSBhbiB1bnJlYWNoYWJsZSBzZXJ2ZXIuXG4gICAgICAgIC8vIE9yIHRoZSBzZXJ2ZXIgY2FuY2VsbGVkIGl0IGZvciB3aGF0IGV2ZXIgcmVhc29uLCBlLmcuXG4gICAgICAgIC8vIGhlcm9rdSBraWxscyB0aGUgcmVxdWVzdCBhZnRlciB+MzBzLlxuICAgICAgICAvLyB3ZSdsbCB0cnkgYWdhaW4gYWZ0ZXIgYSAzcyB0aW1lb3V0XG4gICAgICAgIC8vXG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KHJlbW90ZS5wdWxsLCAzMDAwKTtcbiAgICAgICAgcmV0dXJuIGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIC8vICMjIyBoYW5kbGUgY2hhbmdlcyBmcm9tIHJlbW90ZVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVCb290c3RyYXBTdWNjZXNzKCkge1xuICAgIGlzQm9vdHN0cmFwcGluZyA9IGZhbHNlO1xuICAgIHJlbW90ZS50cmlnZ2VyKCdib290c3RyYXA6ZW5kJyk7XG4gIH1cblxuICAvLyAjIyMgaGFuZGxlIGNoYW5nZXMgZnJvbSByZW1vdGVcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlUHVsbFJlc3VsdHMoY2hhbmdlcykge1xuICAgIHZhciBkb2MsIGV2ZW50LCBvYmplY3QsIF9pLCBfbGVuO1xuXG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBjaGFuZ2VzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBkb2MgPSBjaGFuZ2VzW19pXS5kb2M7XG5cbiAgICAgIGlmIChyZW1vdGUucHJlZml4ICYmIGRvYy5faWQuaW5kZXhPZihyZW1vdGUucHJlZml4KSAhPT0gMCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgb2JqZWN0ID0gcGFyc2VGcm9tUmVtb3RlKGRvYyk7XG5cbiAgICAgIGlmIChvYmplY3QuX2RlbGV0ZWQpIHtcbiAgICAgICAgaWYgKCFyZW1vdGUuaXNLbm93bk9iamVjdChvYmplY3QpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQgPSAncmVtb3ZlJztcbiAgICAgICAgcmVtb3RlLmlzS25vd25PYmplY3Qob2JqZWN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChyZW1vdGUuaXNLbm93bk9iamVjdChvYmplY3QpKSB7XG4gICAgICAgICAgZXZlbnQgPSAndXBkYXRlJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBldmVudCA9ICdhZGQnO1xuICAgICAgICAgIHJlbW90ZS5tYXJrQXNLbm93bk9iamVjdChvYmplY3QpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJlbW90ZS50cmlnZ2VyKGV2ZW50LCBvYmplY3QpO1xuICAgICAgcmVtb3RlLnRyaWdnZXIoZXZlbnQgKyAnOicgKyBvYmplY3QudHlwZSwgb2JqZWN0KTtcbiAgICAgIHJlbW90ZS50cmlnZ2VyKGV2ZW50ICsgJzonICsgb2JqZWN0LnR5cGUgKyAnOicgKyBvYmplY3QuaWQsIG9iamVjdCk7XG4gICAgICByZW1vdGUudHJpZ2dlcignY2hhbmdlJywgZXZlbnQsIG9iamVjdCk7XG4gICAgICByZW1vdGUudHJpZ2dlcignY2hhbmdlOicgKyBvYmplY3QudHlwZSwgZXZlbnQsIG9iamVjdCk7XG4gICAgICByZW1vdGUudHJpZ2dlcignY2hhbmdlOicgKyBvYmplY3QudHlwZSArICc6JyArIG9iamVjdC5pZCwgZXZlbnQsIG9iamVjdCk7XG4gICAgfVxuICB9XG5cblxuICAvLyBib290c3RyYXAga25vd24gb2JqZWN0c1xuICAvL1xuICBpZiAob3B0aW9ucy5rbm93bk9iamVjdHMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMua25vd25PYmplY3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZW1vdGUubWFya0FzS25vd25PYmplY3Qoe1xuICAgICAgICB0eXBlOiBvcHRpb25zLmtub3duT2JqZWN0c1tpXS50eXBlLFxuICAgICAgICBpZDogb3B0aW9ucy5rbm93bk9iamVjdHNbaV0uaWRcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gZXhwb3NlIHB1YmxpYyBBUElcbiAgcmV0dXJuIHJlbW90ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVSZW1vdGVTdG9yZTtcbiIsIi8vXG4vLyBob29kaWUucmVxdWVzdFxuLy8gPT09PT09PT09PT09PT09PVxuXG4vLyBIb29kaWUncyBjZW50cmFsIHBsYWNlIHRvIHNlbmQgcmVxdWVzdCB0byBpdHMgYmFja2VuZC5cbi8vIEF0IHRoZSBtb21lbnQsIGl0J3MgYSB3cmFwcGVyIGFyb3VuZCBqUXVlcnkncyBhamF4IG1ldGhvZCxcbi8vIGJ1dCB3ZSBtaWdodCBnZXQgcmlkIG9mIHRoaXMgZGVwZW5kZW5jeSBpbiB0aGUgZnV0dXJlLlxuLy9cbi8vIEl0IGhhcyBidWlsZCBpbiBzdXBwb3J0IGZvciBDT1JTIGFuZCBhIHN0YW5kYXJkIGVycm9yXG4vLyBoYW5kbGluZyB0aGF0IG5vcm1hbGl6ZXMgZXJyb3JzIHJldHVybmVkIGJ5IENvdWNoREJcbi8vIHRvIEphdmFTY3JpcHQncyBuYXRpdiBjb252ZW50aW9ucyBvZiBlcnJvcnMgaGF2aW5nXG4vLyBhIG5hbWUgJiBhIG1lc3NhZ2UgcHJvcGVydHkuXG4vL1xuLy8gQ29tbW9uIGVycm9ycyB0byBleHBlY3Q6XG4vL1xuLy8gKiBIb29kaWVSZXF1ZXN0RXJyb3Jcbi8vICogSG9vZGllVW5hdXRob3JpemVkRXJyb3Jcbi8vICogSG9vZGllQ29uZmxpY3RFcnJvclxuLy8gKiBIb29kaWVTZXJ2ZXJFcnJvclxuLy9cbmZ1bmN0aW9uIGhvb2RpZVJlcXVlc3QoaG9vZGllKSB7XG4gIHZhciAkZXh0ZW5kID0gJC5leHRlbmQ7XG4gIHZhciAkYWpheCA9ICQuYWpheDtcblxuICAvLyBIb29kaWUgYmFja2VuZCBsaXN0ZW50cyB0byByZXF1ZXN0cyBwcmVmaXhlZCBieSAvX2FwaSxcbiAgLy8gc28gd2UgcHJlZml4IGFsbCByZXF1ZXN0cyB3aXRoIHJlbGF0aXZlIFVSTHNcbiAgdmFyIEFQSV9QQVRIID0gJy9fYXBpJztcblxuICAvLyBSZXF1ZXN0c1xuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy8gc2VuZHMgcmVxdWVzdHMgdG8gdGhlIGhvb2RpZSBiYWNrZW5kLlxuICAvL1xuICAvLyAgICAgcHJvbWlzZSA9IGhvb2RpZS5yZXF1ZXN0KCdHRVQnLCAnL3VzZXJfZGF0YWJhc2UvZG9jX2lkJylcbiAgLy9cbiAgZnVuY3Rpb24gcmVxdWVzdCh0eXBlLCB1cmwsIG9wdGlvbnMpIHtcbiAgICB2YXIgZGVmYXVsdHMsIHJlcXVlc3RQcm9taXNlLCBwaXBlZFByb21pc2U7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIGRlZmF1bHRzID0ge1xuICAgICAgdHlwZTogdHlwZSxcbiAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICB9O1xuXG4gICAgLy8gaWYgYWJzb2x1dGUgcGF0aCBwYXNzZWQsIHNldCBDT1JTIGhlYWRlcnNcblxuICAgIC8vIGlmIHJlbGF0aXZlIHBhdGggcGFzc2VkLCBwcmVmaXggd2l0aCBiYXNlVXJsXG4gICAgaWYgKCEvXmh0dHAvLnRlc3QodXJsKSkge1xuICAgICAgdXJsID0gKGhvb2RpZS5iYXNlVXJsIHx8ICcnKSArIEFQSV9QQVRIICsgdXJsO1xuICAgIH1cblxuICAgIC8vIGlmIHVybCBpcyBjcm9zcyBkb21haW4sIHNldCBDT1JTIGhlYWRlcnNcbiAgICBpZiAoL15odHRwLy50ZXN0KHVybCkpIHtcbiAgICAgIGRlZmF1bHRzLnhockZpZWxkcyA9IHtcbiAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlXG4gICAgICB9O1xuICAgICAgZGVmYXVsdHMuY3Jvc3NEb21haW4gPSB0cnVlO1xuICAgIH1cblxuICAgIGRlZmF1bHRzLnVybCA9IHVybDtcblxuXG4gICAgLy8gd2UgYXJlIHBpcGluZyB0aGUgcmVzdWx0IG9mIHRoZSByZXF1ZXN0IHRvIHJldHVybiBhIG5pY2VyXG4gICAgLy8gZXJyb3IgaWYgdGhlIHJlcXVlc3QgY2Fubm90IHJlYWNoIHRoZSBzZXJ2ZXIgYXQgYWxsLlxuICAgIC8vIFdlIGNhbid0IHJldHVybiB0aGUgcHJvbWlzZSBvZiBhamF4IGRpcmVjdGx5IGJlY2F1c2Ugb2ZcbiAgICAvLyB0aGUgcGlwaW5nLCBhcyBmb3Igd2hhdGV2ZXIgcmVhc29uIHRoZSByZXR1cm5lZCBwcm9taXNlXG4gICAgLy8gZG9lcyBub3QgaGF2ZSB0aGUgYGFib3J0YCBtZXRob2QgYW55IG1vcmUsIG1heWJlIG90aGVyc1xuICAgIC8vIGFzIHdlbGwuIFNlZSBhbHNvIGh0dHA6Ly9idWdzLmpxdWVyeS5jb20vdGlja2V0LzE0MTA0XG4gICAgcmVxdWVzdFByb21pc2UgPSAkYWpheCgkZXh0ZW5kKGRlZmF1bHRzLCBvcHRpb25zKSk7XG4gICAgcGlwZWRQcm9taXNlID0gcmVxdWVzdFByb21pc2UudGhlbiggbnVsbCwgaGFuZGxlUmVxdWVzdEVycm9yKTtcbiAgICBwaXBlZFByb21pc2UuYWJvcnQgPSByZXF1ZXN0UHJvbWlzZS5hYm9ydDtcblxuICAgIHJldHVybiBwaXBlZFByb21pc2U7XG4gIH1cblxuICAvL1xuICAvL1xuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVSZXF1ZXN0RXJyb3IoeGhyKSB7XG4gICAgdmFyIGVycm9yO1xuXG4gICAgdHJ5IHtcbiAgICAgIGVycm9yID0gcGFyc2VFcnJvckZyb21SZXNwb25zZSh4aHIpO1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuXG4gICAgICBpZiAoeGhyLnJlc3BvbnNlVGV4dCkge1xuICAgICAgICBlcnJvciA9IHhoci5yZXNwb25zZVRleHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlcnJvciA9IHtcbiAgICAgICAgICBuYW1lOiAnSG9vZGllQ29ubmVjdGlvbkVycm9yJyxcbiAgICAgICAgICBtZXNzYWdlOiAnQ291bGQgbm90IGNvbm5lY3QgdG8gSG9vZGllIHNlcnZlciBhdCB7e3VybH19LicsXG4gICAgICAgICAgdXJsOiBob29kaWUuYmFzZVVybCB8fCAnLydcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoZXJyb3IpLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIC8vIENvdWNoREIgcmV0dXJucyBlcnJvcnMgaW4gSlNPTiBmb3JtYXQsIHdpdGggdGhlIHByb3BlcnRpZXNcbiAgLy8gYGVycm9yYCBhbmQgYHJlYXNvbmAuIEhvb2RpZSB1c2VzIEphdmFTY3JpcHQncyBuYXRpdmUgRXJyb3JcbiAgLy8gcHJvcGVydGllcyBgbmFtZWAgYW5kIGBtZXNzYWdlYCBpbnN0ZWFkLCBzbyB3ZSBhcmUgbm9ybWFsaXppbmdcbiAgLy8gdGhhdC5cbiAgLy9cbiAgLy8gQmVzaWRlcyB0aGUgcmVuYW1pbmcgd2UgYWxzbyBkbyBhIG1hdGNoaW5nIHdpdGggYSBtYXAgb2Yga25vd25cbiAgLy8gZXJyb3JzIHRvIG1ha2UgdGhlbSBtb3JlIGNsZWFyLiBGb3IgcmVmZXJlbmNlLCBzZWVcbiAgLy8gaHR0cHM6Ly93aWtpLmFwYWNoZS5vcmcvY291Y2hkYi9EZWZhdWx0X2h0dHBfZXJyb3JzICZcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FwYWNoZS9jb3VjaGRiL2Jsb2IvbWFzdGVyL3NyYy9jb3VjaGRiL2NvdWNoX2h0dHBkLmVybCNMODA3XG4gIC8vXG5cbiAgZnVuY3Rpb24gcGFyc2VFcnJvckZyb21SZXNwb25zZSh4aHIpIHtcbiAgICB2YXIgZXJyb3IgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuXG4gICAgLy8gZ2V0IGVycm9yIG5hbWVcbiAgICBlcnJvci5uYW1lID0gSFRUUF9TVEFUVVNfRVJST1JfTUFQW3hoci5zdGF0dXNdO1xuICAgIGlmICghIGVycm9yLm5hbWUpIHtcbiAgICAgIGVycm9yLm5hbWUgPSBob29kaWVmeVJlcXVlc3RFcnJvck5hbWUoZXJyb3IuZXJyb3IpO1xuICAgIH1cblxuICAgIC8vIHN0b3JlIHN0YXR1cyAmIG1lc3NhZ2VcbiAgICBlcnJvci5zdGF0dXMgPSB4aHIuc3RhdHVzO1xuICAgIGVycm9yLm1lc3NhZ2UgPSBlcnJvci5yZWFzb24gfHwgJyc7XG4gICAgZXJyb3IubWVzc2FnZSA9IGVycm9yLm1lc3NhZ2UuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBlcnJvci5tZXNzYWdlLnNsaWNlKDEpO1xuXG4gICAgLy8gY2xlYW51cFxuICAgIGRlbGV0ZSBlcnJvci5lcnJvcjtcbiAgICBkZWxldGUgZXJyb3IucmVhc29uO1xuXG4gICAgcmV0dXJuIGVycm9yO1xuICB9XG5cbiAgLy8gbWFwIENvdWNoREIgSFRUUCBzdGF0dXMgY29kZXMgdG8gSG9vZGllIEVycm9yc1xuICB2YXIgSFRUUF9TVEFUVVNfRVJST1JfTUFQID0ge1xuICAgIDQwMDogJ0hvb2RpZVJlcXVlc3RFcnJvcicsIC8vIGJhZCByZXF1ZXN0XG4gICAgNDAxOiAnSG9vZGllVW5hdXRob3JpemVkRXJyb3InLFxuICAgIDQwMzogJ0hvb2RpZVJlcXVlc3RFcnJvcicsIC8vIGZvcmJpZGRlblxuICAgIDQwNDogJ0hvb2RpZU5vdEZvdW5kRXJyb3InLCAvLyBmb3JiaWRkZW5cbiAgICA0MDk6ICdIb29kaWVDb25mbGljdEVycm9yJyxcbiAgICA0MTI6ICdIb29kaWVDb25mbGljdEVycm9yJywgLy8gZmlsZSBleGlzdFxuICAgIDUwMDogJ0hvb2RpZVNlcnZlckVycm9yJ1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gaG9vZGllZnlSZXF1ZXN0RXJyb3JOYW1lKG5hbWUpIHtcbiAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8oXlxcd3xfXFx3KS9nLCBmdW5jdGlvbiAobWF0Y2gpIHtcbiAgICAgIHJldHVybiAobWF0Y2hbMV0gfHwgbWF0Y2hbMF0pLnRvVXBwZXJDYXNlKCk7XG4gICAgfSk7XG4gICAgcmV0dXJuICdIb29kaWUnICsgbmFtZSArICdFcnJvcic7XG4gIH1cblxuXG4gIC8vXG4gIC8vIHB1YmxpYyBBUElcbiAgLy9cbiAgaG9vZGllLnJlcXVlc3QgPSByZXF1ZXN0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVJlcXVlc3Q7XG4iLCIvLyBzY29wZWQgU3RvcmVcbi8vID09PT09PT09PT09PVxuXG4vLyBzYW1lIGFzIHN0b3JlLCBidXQgd2l0aCB0eXBlIHByZXNldCB0byBhbiBpbml0aWFsbHlcbi8vIHBhc3NlZCB2YWx1ZS5cbi8vXG52YXIgaG9vZGllRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxuLy9cbmZ1bmN0aW9uIGhvb2RpZVNjb3BlZFN0b3JlQXBpKGhvb2RpZSwgc3RvcmVBcGksIG9wdGlvbnMpIHtcblxuICAvLyBuYW1lXG4gIHZhciBzdG9yZU5hbWUgPSBvcHRpb25zLm5hbWUgfHwgJ3N0b3JlJztcbiAgdmFyIHR5cGUgPSBvcHRpb25zLnR5cGU7XG4gIHZhciBpZCA9IG9wdGlvbnMuaWQ7XG5cbiAgdmFyIGFwaSA9IHt9O1xuXG4gIC8vIHNjb3BlZCBieSB0eXBlIG9ubHlcbiAgaWYgKCFpZCkge1xuXG4gICAgLy8gYWRkIGV2ZW50c1xuICAgIGhvb2RpZUV2ZW50cyhob29kaWUsIHtcbiAgICAgIGNvbnRleHQ6IGFwaSxcbiAgICAgIG5hbWVzcGFjZTogc3RvcmVOYW1lICsgJzonICsgdHlwZVxuICAgIH0pO1xuXG4gICAgLy9cbiAgICBhcGkuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoaWQsIHByb3BlcnRpZXMsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS5zYXZlKHR5cGUsIGlkLCBwcm9wZXJ0aWVzLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkuYWRkID0gZnVuY3Rpb24gYWRkKHByb3BlcnRpZXMsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS5hZGQodHlwZSwgcHJvcGVydGllcywgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLmZpbmQgPSBmdW5jdGlvbiBmaW5kKGlkKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkuZmluZCh0eXBlLCBpZCk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLmZpbmRPckFkZCA9IGZ1bmN0aW9uIGZpbmRPckFkZChpZCwgcHJvcGVydGllcykge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLmZpbmRPckFkZCh0eXBlLCBpZCwgcHJvcGVydGllcyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLmZpbmRBbGwgPSBmdW5jdGlvbiBmaW5kQWxsKG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS5maW5kQWxsKHR5cGUsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUoaWQsIG9iamVjdFVwZGF0ZSwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLnVwZGF0ZSh0eXBlLCBpZCwgb2JqZWN0VXBkYXRlLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkudXBkYXRlQWxsID0gZnVuY3Rpb24gdXBkYXRlQWxsKG9iamVjdFVwZGF0ZSwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLnVwZGF0ZUFsbCh0eXBlLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5yZW1vdmUgPSBmdW5jdGlvbiByZW1vdmUoaWQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS5yZW1vdmUodHlwZSwgaWQsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5yZW1vdmVBbGwgPSBmdW5jdGlvbiByZW1vdmVBbGwob3B0aW9ucykge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLnJlbW92ZUFsbCh0eXBlLCBvcHRpb25zKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gc2NvcGVkIGJ5IGJvdGg6IHR5cGUgJiBpZFxuICBpZiAoaWQpIHtcblxuICAgIC8vIGFkZCBldmVudHNcbiAgICBob29kaWVFdmVudHMoaG9vZGllLCB7XG4gICAgICBjb250ZXh0OiBhcGksXG4gICAgICBuYW1lc3BhY2U6IHN0b3JlTmFtZSArICc6JyArIHR5cGUgKyAnOicgKyBpZFxuICAgIH0pO1xuXG4gICAgLy9cbiAgICBhcGkuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUocHJvcGVydGllcywgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLnNhdmUodHlwZSwgaWQsIHByb3BlcnRpZXMsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5maW5kID0gZnVuY3Rpb24gZmluZCgpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS5maW5kKHR5cGUsIGlkKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKG9iamVjdFVwZGF0ZSwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLnVwZGF0ZSh0eXBlLCBpZCwgb2JqZWN0VXBkYXRlLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS5yZW1vdmUodHlwZSwgaWQsIG9wdGlvbnMpO1xuICAgIH07XG4gIH1cblxuICAvL1xuICBhcGkuZGVjb3JhdGVQcm9taXNlcyA9IHN0b3JlQXBpLmRlY29yYXRlUHJvbWlzZXM7XG4gIGFwaS52YWxpZGF0ZSA9IHN0b3JlQXBpLnZhbGlkYXRlO1xuXG4gIHJldHVybiBhcGk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllU2NvcGVkU3RvcmVBcGk7XG4iLCIvLyBzY29wZWQgU3RvcmVcbi8vID09PT09PT09PT09PVxuXG4vLyBzYW1lIGFzIHN0b3JlLCBidXQgd2l0aCB0eXBlIHByZXNldCB0byBhbiBpbml0aWFsbHlcbi8vIHBhc3NlZCB2YWx1ZS5cbi8vXG52YXIgaG9vZGllRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxuLy9cbmZ1bmN0aW9uIGhvb2RpZVNjb3BlZFRhc2soaG9vZGllLCB0YXNrQXBpLCBvcHRpb25zKSB7XG5cbiAgdmFyIHR5cGUgPSBvcHRpb25zLnR5cGU7XG4gIHZhciBpZCA9IG9wdGlvbnMuaWQ7XG5cbiAgdmFyIGFwaSA9IHt9O1xuXG4gIC8vIHNjb3BlZCBieSB0eXBlIG9ubHlcbiAgaWYgKCFpZCkge1xuXG4gICAgLy8gYWRkIGV2ZW50c1xuICAgIGhvb2RpZUV2ZW50cyhob29kaWUsIHtcbiAgICAgIGNvbnRleHQ6IGFwaSxcbiAgICAgIG5hbWVzcGFjZTogJ3Rhc2s6JyArIHR5cGVcbiAgICB9KTtcblxuICAgIC8vXG4gICAgYXBpLnN0YXJ0ID0gZnVuY3Rpb24gc3RhcnQocHJvcGVydGllcykge1xuICAgICAgcmV0dXJuIHRhc2tBcGkuc3RhcnQodHlwZSwgcHJvcGVydGllcyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLmNhbmNlbCA9IGZ1bmN0aW9uIGNhbmNlbChpZCkge1xuICAgICAgcmV0dXJuIHRhc2tBcGkuY2FuY2VsKHR5cGUsIGlkKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkucmVzdGFydCA9IGZ1bmN0aW9uIHJlc3RhcnQoaWQsIHVwZGF0ZSkge1xuICAgICAgcmV0dXJuIHRhc2tBcGkucmVzdGFydCh0eXBlLCBpZCwgdXBkYXRlKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkuY2FuY2VsQWxsID0gZnVuY3Rpb24gY2FuY2VsQWxsKCkge1xuICAgICAgcmV0dXJuIHRhc2tBcGkuY2FuY2VsQWxsKHR5cGUpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5yZXN0YXJ0QWxsID0gZnVuY3Rpb24gcmVzdGFydEFsbCh1cGRhdGUpIHtcbiAgICAgIHJldHVybiB0YXNrQXBpLnJlc3RhcnRBbGwodHlwZSwgdXBkYXRlKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gc2NvcGVkIGJ5IGJvdGg6IHR5cGUgJiBpZFxuICBpZiAoaWQpIHtcblxuICAgIC8vIGFkZCBldmVudHNcbiAgICBob29kaWVFdmVudHMoaG9vZGllLCB7XG4gICAgICBjb250ZXh0OiBhcGksXG4gICAgICBuYW1lc3BhY2U6ICd0YXNrOicgKyB0eXBlICsgJzonICsgaWRcbiAgICB9KTtcblxuICAgIC8vXG4gICAgYXBpLmNhbmNlbCA9IGZ1bmN0aW9uIGNhbmNlbCgpIHtcbiAgICAgIHJldHVybiB0YXNrQXBpLmNhbmNlbCh0eXBlLCBpZCk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnJlc3RhcnQgPSBmdW5jdGlvbiByZXN0YXJ0KHVwZGF0ZSkge1xuICAgICAgcmV0dXJuIHRhc2tBcGkucmVzdGFydCh0eXBlLCBpZCwgdXBkYXRlKTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGFwaTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVTY29wZWRUYXNrO1xuIiwiLy8gU3RvcmVcbi8vID09PT09PT09PT09PVxuXG4vLyBUaGlzIGNsYXNzIGRlZmluZXMgdGhlIEFQSSB0aGF0IGhvb2RpZS5zdG9yZSAobG9jYWwgc3RvcmUpIGFuZCBob29kaWUub3BlblxuLy8gKHJlbW90ZSBzdG9yZSkgaW1wbGVtZW50IHRvIGFzc3VyZSBhIGNvaGVyZW50IEFQSS4gSXQgYWxzbyBpbXBsZW1lbnRzIHNvbWVcbi8vIGJhc2ljIHZhbGlkYXRpb25zLlxuLy9cbi8vIFRoZSByZXR1cm5lZCBBUEkgcHJvdmlkZXMgdGhlIGZvbGxvd2luZyBtZXRob2RzOlxuLy9cbi8vICogdmFsaWRhdGVcbi8vICogc2F2ZVxuLy8gKiBhZGRcbi8vICogZmluZFxuLy8gKiBmaW5kT3JBZGRcbi8vICogZmluZEFsbFxuLy8gKiB1cGRhdGVcbi8vICogdXBkYXRlQWxsXG4vLyAqIHJlbW92ZVxuLy8gKiByZW1vdmVBbGxcbi8vICogZGVjb3JhdGVQcm9taXNlc1xuLy8gKiB0cmlnZ2VyXG4vLyAqIG9uXG4vLyAqIHVuYmluZFxuLy9cbi8vIEF0IHRoZSBzYW1lIHRpbWUsIHRoZSByZXR1cm5lZCBBUEkgY2FuIGJlIGNhbGxlZCBhcyBmdW5jdGlvbiByZXR1cm5pbmcgYVxuLy8gc3RvcmUgc2NvcGVkIGJ5IHRoZSBwYXNzZWQgdHlwZSwgZm9yIGV4YW1wbGVcbi8vXG4vLyAgICAgdmFyIHRhc2tTdG9yZSA9IGhvb2RpZS5zdG9yZSgndGFzaycpO1xuLy8gICAgIHRhc2tTdG9yZS5maW5kQWxsKCkudGhlbiggc2hvd0FsbFRhc2tzICk7XG4vLyAgICAgdGFza1N0b3JlLnVwZGF0ZSgnaWQxMjMnLCB7ZG9uZTogdHJ1ZX0pO1xuLy9cblxuLy9cbnZhciBob29kaWVTY29wZWRTdG9yZUFwaSA9IHJlcXVpcmUoJy4vc2NvcGVkX3N0b3JlJyk7XG52YXIgaG9vZGllRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBIb29kaWVFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3InKTtcbnZhciBIb29kaWVPYmplY3RUeXBlRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yL29iamVjdF90eXBlJyk7XG52YXIgSG9vZGllT2JqZWN0SWRFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3Ivb2JqZWN0X2lkJyk7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVTdG9yZUFwaShob29kaWUsIG9wdGlvbnMpIHtcblxuICAvLyBwZXJzaXN0YW5jZSBsb2dpY1xuICB2YXIgYmFja2VuZCA9IHt9O1xuXG4gIC8vIGV4dGVuZCB0aGlzIHByb3BlcnR5IHdpdGggZXh0cmEgZnVuY3Rpb25zIHRoYXQgd2lsbCBiZSBhdmFpbGFibGVcbiAgLy8gb24gYWxsIHByb21pc2VzIHJldHVybmVkIGJ5IGhvb2RpZS5zdG9yZSBBUEkuIEl0IGhhcyBhIHJlZmVyZW5jZVxuICAvLyB0byBjdXJyZW50IGhvb2RpZSBpbnN0YW5jZSBieSBkZWZhdWx0XG4gIHZhciBwcm9taXNlQXBpID0ge1xuICAgIGhvb2RpZTogaG9vZGllXG4gIH07XG5cbiAgLy8gbmFtZVxuICB2YXIgc3RvcmVOYW1lID0gb3B0aW9ucy5uYW1lIHx8ICdzdG9yZSc7XG5cbiAgLy8gcHVibGljIEFQSVxuICB2YXIgYXBpID0gZnVuY3Rpb24gYXBpKHR5cGUsIGlkKSB7XG4gICAgdmFyIHNjb3BlZE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7dHlwZTogdHlwZSwgaWQ6IGlkfSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIGhvb2RpZVNjb3BlZFN0b3JlQXBpKGhvb2RpZSwgYXBpLCBzY29wZWRPcHRpb25zKTtcbiAgfTtcblxuICAvLyBhZGQgZXZlbnQgQVBJXG4gIGhvb2RpZUV2ZW50cyhob29kaWUsIHsgY29udGV4dDogYXBpLCBuYW1lc3BhY2U6IHN0b3JlTmFtZSB9KTtcblxuXG4gIC8vIFZhbGlkYXRlXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gYnkgZGVmYXVsdCwgd2Ugb25seSBjaGVjayBmb3IgYSB2YWxpZCB0eXBlICYgaWQuXG4gIC8vIHRoZSB2YWxpZGF0ZSBtZXRob2QgY2FuIGJlIG92ZXJ3cml0ZW4gYnkgcGFzc2luZ1xuICAvLyBvcHRpb25zLnZhbGlkYXRlXG4gIC8vXG4gIC8vIGlmIGB2YWxpZGF0ZWAgcmV0dXJucyBub3RoaW5nLCB0aGUgcGFzc2VkIG9iamVjdCBpc1xuICAvLyB2YWxpZC4gT3RoZXJ3aXNlIGl0IHJldHVybnMgYW4gZXJyb3JcbiAgLy9cbiAgYXBpLnZhbGlkYXRlID0gb3B0aW9ucy52YWxpZGF0ZTtcblxuICBpZiAoIW9wdGlvbnMudmFsaWRhdGUpIHtcbiAgICBhcGkudmFsaWRhdGUgPSBmdW5jdGlvbihvYmplY3QgLyosIG9wdGlvbnMgKi8pIHtcblxuICAgICAgaWYgKCFvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBIb29kaWVFcnJvcih7XG4gICAgICAgICAgbmFtZTogJ0ludmFsaWRPYmplY3RFcnJvcicsXG4gICAgICAgICAgbWVzc2FnZTogJ05vIG9iamVjdCBwYXNzZWQuJ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChIb29kaWVPYmplY3RUeXBlRXJyb3IuaXNJbnZhbGlkKG9iamVjdC50eXBlLCB2YWxpZElkT3JUeXBlUGF0dGVybikpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBIb29kaWVPYmplY3RUeXBlRXJyb3Ioe1xuICAgICAgICAgIHR5cGU6IG9iamVjdC50eXBlLFxuICAgICAgICAgIHJ1bGVzOiB2YWxpZElkT3JUeXBlUnVsZXNcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghb2JqZWN0LmlkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKEhvb2RpZU9iamVjdElkRXJyb3IuaXNJbnZhbGlkKG9iamVjdC5pZCwgdmFsaWRJZE9yVHlwZVBhdHRlcm4pKSB7XG4gICAgICAgIHJldHVybiBuZXcgSG9vZGllT2JqZWN0SWRFcnJvcih7XG4gICAgICAgICAgaWQ6IG9iamVjdC5pZCxcbiAgICAgICAgICBydWxlczogdmFsaWRJZE9yVHlwZVJ1bGVzXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBTYXZlXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gY3JlYXRlcyBvciByZXBsYWNlcyBhbiBhbiBldmVudHVhbGx5IGV4aXN0aW5nIG9iamVjdCBpbiB0aGUgc3RvcmVcbiAgLy8gd2l0aCBzYW1lIHR5cGUgJiBpZC5cbiAgLy9cbiAgLy8gV2hlbiBpZCBpcyB1bmRlZmluZWQsIGl0IGdldHMgZ2VuZXJhdGVkIGFuZCBhIG5ldyBvYmplY3QgZ2V0cyBzYXZlZFxuICAvL1xuICAvLyBleGFtcGxlIHVzYWdlOlxuICAvL1xuICAvLyAgICAgc3RvcmUuc2F2ZSgnY2FyJywgdW5kZWZpbmVkLCB7Y29sb3I6ICdyZWQnfSlcbiAgLy8gICAgIHN0b3JlLnNhdmUoJ2NhcicsICdhYmM0NTY3Jywge2NvbG9yOiAncmVkJ30pXG4gIC8vXG4gIGFwaS5zYXZlID0gZnVuY3Rpb24gc2F2ZSh0eXBlLCBpZCwgcHJvcGVydGllcywgb3B0aW9ucykge1xuXG4gICAgaWYgKCBvcHRpb25zICkge1xuICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cblxuICAgIC8vIGRvbid0IG1lc3Mgd2l0aCBwYXNzZWQgb2JqZWN0XG4gICAgdmFyIG9iamVjdCA9ICQuZXh0ZW5kKHRydWUsIHt9LCBwcm9wZXJ0aWVzLCB7dHlwZTogdHlwZSwgaWQ6IGlkfSk7XG5cbiAgICAvLyB2YWxpZGF0aW9uc1xuICAgIHZhciBlcnJvciA9IGFwaS52YWxpZGF0ZShvYmplY3QsIG9wdGlvbnMgfHwge30pO1xuICAgIGlmKGVycm9yKSB7IHJldHVybiBob29kaWUucmVqZWN0V2l0aChlcnJvcik7IH1cblxuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIGJhY2tlbmQuc2F2ZShvYmplY3QsIG9wdGlvbnMgfHwge30pICk7XG4gIH07XG5cblxuICAvLyBBZGRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGAuYWRkYCBpcyBhbiBhbGlhcyBmb3IgYC5zYXZlYCwgd2l0aCB0aGUgZGlmZmVyZW5jZSB0aGF0IHRoZXJlIGlzIG5vIGlkIGFyZ3VtZW50LlxuICAvLyBJbnRlcm5hbGx5IGl0IHNpbXBseSBjYWxscyBgLnNhdmUodHlwZSwgdW5kZWZpbmVkLCBvYmplY3QpLlxuICAvL1xuICBhcGkuYWRkID0gZnVuY3Rpb24gYWRkKHR5cGUsIHByb3BlcnRpZXMsIG9wdGlvbnMpIHtcblxuICAgIGlmIChwcm9wZXJ0aWVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHByb3BlcnRpZXMgPSB7fTtcbiAgICB9XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICByZXR1cm4gYXBpLnNhdmUodHlwZSwgcHJvcGVydGllcy5pZCwgcHJvcGVydGllcywgb3B0aW9ucyk7XG4gIH07XG5cblxuICAvLyBmaW5kXG4gIC8vIC0tLS0tLVxuXG4gIC8vXG4gIGFwaS5maW5kID0gZnVuY3Rpb24gZmluZCh0eXBlLCBpZCkge1xuXG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggYmFja2VuZC5maW5kKHR5cGUsIGlkKSApO1xuICB9O1xuXG5cbiAgLy8gZmluZCBvciBhZGRcbiAgLy8gLS0tLS0tLS0tLS0tLVxuXG4gIC8vIDEuIFRyeSB0byBmaW5kIGEgc2hhcmUgYnkgZ2l2ZW4gaWRcbiAgLy8gMi4gSWYgc2hhcmUgY291bGQgYmUgZm91bmQsIHJldHVybiBpdFxuICAvLyAzLiBJZiBub3QsIGFkZCBvbmUgYW5kIHJldHVybiBpdC5cbiAgLy9cbiAgYXBpLmZpbmRPckFkZCA9IGZ1bmN0aW9uIGZpbmRPckFkZCh0eXBlLCBpZCwgcHJvcGVydGllcykge1xuXG4gICAgaWYgKHByb3BlcnRpZXMgPT09IG51bGwpIHtcbiAgICAgIHByb3BlcnRpZXMgPSB7fTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVOb3RGb3VuZCgpIHtcbiAgICAgIHZhciBuZXdQcm9wZXJ0aWVzO1xuICAgICAgbmV3UHJvcGVydGllcyA9ICQuZXh0ZW5kKHRydWUsIHtcbiAgICAgICAgaWQ6IGlkXG4gICAgICB9LCBwcm9wZXJ0aWVzKTtcbiAgICAgIHJldHVybiBhcGkuYWRkKHR5cGUsIG5ld1Byb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIC8vIHByb21pc2UgZGVjb3JhdGlvbnMgZ2V0IGxvc3Qgd2hlbiBwaXBlZCB0aHJvdWdoIGB0aGVuYCxcbiAgICAvLyB0aGF0J3Mgd2h5IHdlIG5lZWQgdG8gZGVjb3JhdGUgdGhlIGZpbmQncyBwcm9taXNlIGFnYWluLlxuICAgIHZhciBwcm9taXNlID0gYXBpLmZpbmQodHlwZSwgaWQpLnRoZW4obnVsbCwgaGFuZGxlTm90Rm91bmQpO1xuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIHByb21pc2UgKTtcbiAgfTtcblxuXG4gIC8vIGZpbmRBbGxcbiAgLy8gLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmV0dXJucyBhbGwgb2JqZWN0cyBmcm9tIHN0b3JlLlxuICAvLyBDYW4gYmUgb3B0aW9uYWxseSBmaWx0ZXJlZCBieSBhIHR5cGUgb3IgYSBmdW5jdGlvblxuICAvL1xuICBhcGkuZmluZEFsbCA9IGZ1bmN0aW9uIGZpbmRBbGwodHlwZSwgb3B0aW9ucykge1xuXG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggYmFja2VuZC5maW5kQWxsKHR5cGUsIG9wdGlvbnMpICk7XG4gIH07XG5cblxuICAvLyBVcGRhdGVcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEluIGNvbnRyYXN0IHRvIGAuc2F2ZWAsIHRoZSBgLnVwZGF0ZWAgbWV0aG9kIGRvZXMgbm90IHJlcGxhY2UgdGhlIHN0b3JlZCBvYmplY3QsXG4gIC8vIGJ1dCBvbmx5IGNoYW5nZXMgdGhlIHBhc3NlZCBhdHRyaWJ1dGVzIG9mIGFuIGV4c3Rpbmcgb2JqZWN0LCBpZiBpdCBleGlzdHNcbiAgLy9cbiAgLy8gYm90aCBhIGhhc2ggb2Yga2V5L3ZhbHVlcyBvciBhIGZ1bmN0aW9uIHRoYXQgYXBwbGllcyB0aGUgdXBkYXRlIHRvIHRoZSBwYXNzZWRcbiAgLy8gb2JqZWN0IGNhbiBiZSBwYXNzZWQuXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2VcbiAgLy9cbiAgLy8gaG9vZGllLnN0b3JlLnVwZGF0ZSgnY2FyJywgJ2FiYzQ1NjcnLCB7c29sZDogdHJ1ZX0pXG4gIC8vIGhvb2RpZS5zdG9yZS51cGRhdGUoJ2NhcicsICdhYmM0NTY3JywgZnVuY3Rpb24ob2JqKSB7IG9iai5zb2xkID0gdHJ1ZSB9KVxuICAvL1xuICBhcGkudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKHR5cGUsIGlkLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcblxuICAgIGZ1bmN0aW9uIGhhbmRsZUZvdW5kKGN1cnJlbnRPYmplY3QpIHtcbiAgICAgIHZhciBjaGFuZ2VkUHJvcGVydGllcywgbmV3T2JqLCB2YWx1ZTtcblxuICAgICAgLy8gbm9ybWFsaXplIGlucHV0XG4gICAgICBuZXdPYmogPSAkLmV4dGVuZCh0cnVlLCB7fSwgY3VycmVudE9iamVjdCk7XG5cbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0VXBkYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9iamVjdFVwZGF0ZSA9IG9iamVjdFVwZGF0ZShuZXdPYmopO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9iamVjdFVwZGF0ZSkge1xuICAgICAgICByZXR1cm4gaG9vZGllLnJlc29sdmVXaXRoKGN1cnJlbnRPYmplY3QpO1xuICAgICAgfVxuXG4gICAgICAvLyBjaGVjayBpZiBzb21ldGhpbmcgY2hhbmdlZFxuICAgICAgY2hhbmdlZFByb3BlcnRpZXMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmplY3RVcGRhdGUpIHtcbiAgICAgICAgICBpZiAob2JqZWN0VXBkYXRlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gb2JqZWN0VXBkYXRlW2tleV07XG4gICAgICAgICAgICBpZiAoKGN1cnJlbnRPYmplY3Rba2V5XSAhPT0gdmFsdWUpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHdvcmthcm91bmQgZm9yIHVuZGVmaW5lZCB2YWx1ZXMsIGFzICQuZXh0ZW5kIGlnbm9yZXMgdGhlc2VcbiAgICAgICAgICAgIG5ld09ialtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKGtleSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH0pKCk7XG5cbiAgICAgIGlmICghKGNoYW5nZWRQcm9wZXJ0aWVzLmxlbmd0aCB8fCBvcHRpb25zKSkge1xuICAgICAgICByZXR1cm4gaG9vZGllLnJlc29sdmVXaXRoKG5ld09iaik7XG4gICAgICB9XG5cbiAgICAgIC8vYXBwbHkgdXBkYXRlXG4gICAgICByZXR1cm4gYXBpLnNhdmUodHlwZSwgaWQsIG5ld09iaiwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8gcHJvbWlzZSBkZWNvcmF0aW9ucyBnZXQgbG9zdCB3aGVuIHBpcGVkIHRocm91Z2ggYHRoZW5gLFxuICAgIC8vIHRoYXQncyB3aHkgd2UgbmVlZCB0byBkZWNvcmF0ZSB0aGUgZmluZCdzIHByb21pc2UgYWdhaW4uXG4gICAgdmFyIHByb21pc2UgPSBhcGkuZmluZCh0eXBlLCBpZCkudGhlbihoYW5kbGVGb3VuZCk7XG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggcHJvbWlzZSApO1xuICB9O1xuXG5cbiAgLy8gdXBkYXRlT3JBZGRcbiAgLy8gLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHNhbWUgYXMgYC51cGRhdGUoKWAsIGJ1dCBpbiBjYXNlIHRoZSBvYmplY3QgY2Fubm90IGJlIGZvdW5kLFxuICAvLyBpdCBnZXRzIGNyZWF0ZWRcbiAgLy9cbiAgYXBpLnVwZGF0ZU9yQWRkID0gZnVuY3Rpb24gdXBkYXRlT3JBZGQodHlwZSwgaWQsIG9iamVjdFVwZGF0ZSwgb3B0aW9ucykge1xuICAgIGZ1bmN0aW9uIGhhbmRsZU5vdEZvdW5kKCkge1xuICAgICAgdmFyIHByb3BlcnRpZXMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0VXBkYXRlLCB7aWQ6IGlkfSk7XG4gICAgICByZXR1cm4gYXBpLmFkZCh0eXBlLCBwcm9wZXJ0aWVzLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICB2YXIgcHJvbWlzZSA9IGFwaS51cGRhdGUodHlwZSwgaWQsIG9iamVjdFVwZGF0ZSwgb3B0aW9ucykudGhlbihudWxsLCBoYW5kbGVOb3RGb3VuZCk7XG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggcHJvbWlzZSApO1xuICB9O1xuXG5cbiAgLy8gdXBkYXRlQWxsXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gdXBkYXRlIGFsbCBvYmplY3RzIGluIHRoZSBzdG9yZSwgY2FuIGJlIG9wdGlvbmFsbHkgZmlsdGVyZWQgYnkgYSBmdW5jdGlvblxuICAvLyBBcyBhbiBhbHRlcm5hdGl2ZSwgYW4gYXJyYXkgb2Ygb2JqZWN0cyBjYW4gYmUgcGFzc2VkXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2VcbiAgLy9cbiAgLy8gaG9vZGllLnN0b3JlLnVwZGF0ZUFsbCgpXG4gIC8vXG4gIGFwaS51cGRhdGVBbGwgPSBmdW5jdGlvbiB1cGRhdGVBbGwoZmlsdGVyT3JPYmplY3RzLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgcHJvbWlzZTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLy8gbm9ybWFsaXplIHRoZSBpbnB1dDogbWFrZSBzdXJlIHdlIGhhdmUgYWxsIG9iamVjdHNcbiAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICBjYXNlIHR5cGVvZiBmaWx0ZXJPck9iamVjdHMgPT09ICdzdHJpbmcnOlxuICAgICAgcHJvbWlzZSA9IGFwaS5maW5kQWxsKGZpbHRlck9yT2JqZWN0cyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGhvb2RpZS5pc1Byb21pc2UoZmlsdGVyT3JPYmplY3RzKTpcbiAgICAgIHByb21pc2UgPSBmaWx0ZXJPck9iamVjdHM7XG4gICAgICBicmVhaztcbiAgICBjYXNlICQuaXNBcnJheShmaWx0ZXJPck9iamVjdHMpOlxuICAgICAgcHJvbWlzZSA9IGhvb2RpZS5kZWZlcigpLnJlc29sdmUoZmlsdGVyT3JPYmplY3RzKS5wcm9taXNlKCk7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OiAvLyBlLmcuIG51bGwsIHVwZGF0ZSBhbGxcbiAgICAgIHByb21pc2UgPSBhcGkuZmluZEFsbCgpO1xuICAgIH1cblxuICAgIHByb21pc2UgPSBwcm9taXNlLnRoZW4oZnVuY3Rpb24ob2JqZWN0cykge1xuICAgICAgLy8gbm93IHdlIHVwZGF0ZSBhbGwgb2JqZWN0cyBvbmUgYnkgb25lIGFuZCByZXR1cm4gYSBwcm9taXNlXG4gICAgICAvLyB0aGF0IHdpbGwgYmUgcmVzb2x2ZWQgb25jZSBhbGwgdXBkYXRlcyBoYXZlIGJlZW4gZmluaXNoZWRcbiAgICAgIHZhciBvYmplY3QsIF91cGRhdGVQcm9taXNlcztcblxuICAgICAgaWYgKCEkLmlzQXJyYXkob2JqZWN0cykpIHtcbiAgICAgICAgb2JqZWN0cyA9IFtvYmplY3RzXTtcbiAgICAgIH1cblxuICAgICAgX3VwZGF0ZVByb21pc2VzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX2ksIF9sZW4sIF9yZXN1bHRzO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG9iamVjdHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICBvYmplY3QgPSBvYmplY3RzW19pXTtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKGFwaS51cGRhdGUob2JqZWN0LnR5cGUsIG9iamVjdC5pZCwgb2JqZWN0VXBkYXRlLCBvcHRpb25zKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfSkoKTtcblxuICAgICAgcmV0dXJuICQud2hlbi5hcHBseShudWxsLCBfdXBkYXRlUHJvbWlzZXMpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggcHJvbWlzZSApO1xuICB9O1xuXG5cbiAgLy8gUmVtb3ZlXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIFJlbW92ZXMgb25lIG9iamVjdCBzcGVjaWZpZWQgYnkgYHR5cGVgIGFuZCBgaWRgLlxuICAvL1xuICAvLyB3aGVuIG9iamVjdCBoYXMgYmVlbiBzeW5jZWQgYmVmb3JlLCBtYXJrIGl0IGFzIGRlbGV0ZWQuXG4gIC8vIE90aGVyd2lzZSByZW1vdmUgaXQgZnJvbSBTdG9yZS5cbiAgLy9cbiAgYXBpLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZSh0eXBlLCBpZCwgb3B0aW9ucykge1xuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIGJhY2tlbmQucmVtb3ZlKHR5cGUsIGlkLCBvcHRpb25zIHx8IHt9KSApO1xuICB9O1xuXG5cbiAgLy8gcmVtb3ZlQWxsXG4gIC8vIC0tLS0tLS0tLS0tXG5cbiAgLy8gRGVzdHJveWUgYWxsIG9iamVjdHMuIENhbiBiZSBmaWx0ZXJlZCBieSBhIHR5cGVcbiAgLy9cbiAgYXBpLnJlbW92ZUFsbCA9IGZ1bmN0aW9uIHJlbW92ZUFsbCh0eXBlLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggYmFja2VuZC5yZW1vdmVBbGwodHlwZSwgb3B0aW9ucyB8fCB7fSkgKTtcbiAgfTtcblxuXG4gIC8vIGRlY29yYXRlIHByb21pc2VzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBleHRlbmQgcHJvbWlzZXMgcmV0dXJuZWQgYnkgc3RvcmUuYXBpXG4gIGFwaS5kZWNvcmF0ZVByb21pc2VzID0gZnVuY3Rpb24gZGVjb3JhdGVQcm9taXNlcyhtZXRob2RzKSB7XG4gICAgcmV0dXJuICQuZXh0ZW5kKHByb21pc2VBcGksIG1ldGhvZHMpO1xuICB9O1xuXG5cblxuICAvLyByZXF1aXJlZCBiYWNrZW5kIG1ldGhvZHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpZiAoIW9wdGlvbnMuYmFja2VuZCApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ29wdGlvbnMuYmFja2VuZCBtdXN0IGJlIHBhc3NlZCcpO1xuICB9XG5cbiAgdmFyIHJlcXVpcmVkID0gJ3NhdmUgZmluZCBmaW5kQWxsIHJlbW92ZSByZW1vdmVBbGwnLnNwbGl0KCcgJyk7XG5cbiAgcmVxdWlyZWQuZm9yRWFjaCggZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuXG4gICAgaWYgKCFvcHRpb25zLmJhY2tlbmRbbWV0aG9kTmFtZV0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignb3B0aW9ucy5iYWNrZW5kLicrbWV0aG9kTmFtZSsnIG11c3QgYmUgcGFzc2VkLicpO1xuICAgIH1cblxuICAgIGJhY2tlbmRbbWV0aG9kTmFtZV0gPSBvcHRpb25zLmJhY2tlbmRbbWV0aG9kTmFtZV07XG4gIH0pO1xuXG5cbiAgLy8gUHJpdmF0ZVxuICAvLyAtLS0tLS0tLS1cblxuICAvLyAvIG5vdCBhbGxvd2VkIGZvciBpZFxuICB2YXIgdmFsaWRJZE9yVHlwZVBhdHRlcm4gPSAvXlteXFwvXSskLztcbiAgdmFyIHZhbGlkSWRPclR5cGVSdWxlcyA9ICcvIG5vdCBhbGxvd2VkJztcblxuICAvL1xuICBmdW5jdGlvbiBkZWNvcmF0ZVByb21pc2UocHJvbWlzZSkge1xuICAgIHJldHVybiAkLmV4dGVuZChwcm9taXNlLCBwcm9taXNlQXBpKTtcbiAgfVxuXG4gIHJldHVybiBhcGk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllU3RvcmVBcGk7XG4iLCIvLyBUYXNrc1xuLy8gPT09PT09PT09PT09XG5cbi8vIFRoaXMgY2xhc3MgZGVmaW5lcyB0aGUgaG9vZGllLnRhc2sgQVBJLlxuLy9cbi8vIFRoZSByZXR1cm5lZCBBUEkgcHJvdmlkZXMgdGhlIGZvbGxvd2luZyBtZXRob2RzOlxuLy9cbi8vICogc3RhcnRcbi8vICogY2FuY2VsXG4vLyAqIHJlc3RhcnRcbi8vICogcmVtb3ZlXG4vLyAqIG9uXG4vLyAqIG9uZVxuLy8gKiB1bmJpbmRcbi8vXG4vLyBBdCB0aGUgc2FtZSB0aW1lLCB0aGUgcmV0dXJuZWQgQVBJIGNhbiBiZSBjYWxsZWQgYXMgZnVuY3Rpb24gcmV0dXJuaW5nIGFcbi8vIHN0b3JlIHNjb3BlZCBieSB0aGUgcGFzc2VkIHR5cGUsIGZvciBleGFtcGxlXG4vL1xuLy8gICAgIHZhciBlbWFpbFRhc2tzID0gaG9vZGllLnRhc2soJ2VtYWlsJyk7XG4vLyAgICAgZW1haWxUYXNrcy5zdGFydCggcHJvcGVydGllcyApO1xuLy8gICAgIGVtYWlsVGFza3MuY2FuY2VsKCdpZDEyMycpO1xuLy9cbnZhciBob29kaWVFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIGhvb2RpZVNjb3BlZFRhc2sgPSByZXF1aXJlKCcuL3Njb3BlZF90YXNrJyk7XG52YXIgSG9vZGllRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yJyk7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVUYXNrKGhvb2RpZSkge1xuXG4gIC8vIHB1YmxpYyBBUElcbiAgdmFyIGFwaSA9IGZ1bmN0aW9uIGFwaSh0eXBlLCBpZCkge1xuICAgIHJldHVybiBob29kaWVTY29wZWRUYXNrKGhvb2RpZSwgYXBpLCB7dHlwZTogdHlwZSwgaWQ6IGlkfSk7XG4gIH07XG5cbiAgLy8gYWRkIGV2ZW50cyBBUElcbiAgaG9vZGllRXZlbnRzKGhvb2RpZSwgeyBjb250ZXh0OiBhcGksIG5hbWVzcGFjZTogJ3Rhc2snIH0pO1xuXG5cbiAgLy8gc3RhcnRcbiAgLy8gLS0tLS0tLVxuXG4gIC8vIHN0YXJ0IGEgbmV3IHRhc2suIElmIHRoZSB1c2VyIGhhcyBubyBhY2NvdW50IHlldCwgaG9vZGllIHRyaWVzIHRvIHNpZ24gdXBcbiAgLy8gZm9yIGFuIGFub255bW91cyBhY2NvdW50IGluIHRoZSBiYWNrZ3JvdW5kLiBJZiB0aGF0IGZhaWxzLCB0aGUgcmV0dXJuZWRcbiAgLy8gcHJvbWlzZSB3aWxsIGJlIHJlamVjdGVkLlxuICAvL1xuICBhcGkuc3RhcnQgPSBmdW5jdGlvbih0eXBlLCBwcm9wZXJ0aWVzKSB7XG4gICAgaWYgKGhvb2RpZS5hY2NvdW50Lmhhc0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5zdG9yZS5hZGQoJyQnK3R5cGUsIHByb3BlcnRpZXMpLnRoZW4oaGFuZGxlTmV3VGFzayk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhvb2RpZS5hY2NvdW50LmFub255bW91c1NpZ25VcCgpLnRoZW4oIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFwaS5zdGFydCh0eXBlLCBwcm9wZXJ0aWVzKTtcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIGNhbmNlbFxuICAvLyAtLS0tLS0tXG5cbiAgLy8gY2FuY2VsIGEgcnVubmluZyB0YXNrXG4gIC8vXG4gIGFwaS5jYW5jZWwgPSBmdW5jdGlvbih0eXBlLCBpZCkge1xuICAgIHJldHVybiBob29kaWUuc3RvcmUudXBkYXRlKCckJyt0eXBlLCBpZCwgeyBjYW5jZWxsZWRBdDogbm93KCkgfSkudGhlbihoYW5kbGVDYW5jZWxsZWRUYXNrT2JqZWN0KTtcbiAgfTtcblxuXG4gIC8vIHJlc3RhcnRcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gZmlyc3QsIHdlIHRyeSB0byBjYW5jZWwgYSBydW5uaW5nIHRhc2suIElmIHRoYXQgc3VjY2VlZHMsIHdlIHN0YXJ0XG4gIC8vIGEgbmV3IG9uZSB3aXRoIHRoZSBzYW1lIHByb3BlcnRpZXMgYXMgdGhlIG9yaWdpbmFsXG4gIC8vXG4gIGFwaS5yZXN0YXJ0ID0gZnVuY3Rpb24odHlwZSwgaWQsIHVwZGF0ZSkge1xuICAgIHZhciBzdGFydCA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgJC5leHRlbmQob2JqZWN0LCB1cGRhdGUpO1xuICAgICAgZGVsZXRlIG9iamVjdC4kZXJyb3I7XG4gICAgICBkZWxldGUgb2JqZWN0LiRwcm9jZXNzZWRBdDtcbiAgICAgIGRlbGV0ZSBvYmplY3QuY2FuY2VsbGVkQXQ7XG4gICAgICByZXR1cm4gYXBpLnN0YXJ0KG9iamVjdC50eXBlLCBvYmplY3QpO1xuICAgIH07XG4gICAgcmV0dXJuIGFwaS5jYW5jZWwodHlwZSwgaWQpLnRoZW4oc3RhcnQpO1xuICB9O1xuXG4gIC8vIGNhbmNlbEFsbFxuICAvLyAtLS0tLS0tLS0tLVxuXG4gIC8vXG4gIGFwaS5jYW5jZWxBbGwgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgcmV0dXJuIGZpbmRBbGwodHlwZSkudGhlbiggY2FuY2VsVGFza09iamVjdHMgKTtcbiAgfTtcblxuICAvLyByZXN0YXJ0QWxsXG4gIC8vIC0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgYXBpLnJlc3RhcnRBbGwgPSBmdW5jdGlvbih0eXBlLCB1cGRhdGUpIHtcbiAgICBpZiAodHlwZW9mIHR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICB1cGRhdGUgPSB0eXBlO1xuICAgIH1cbiAgICByZXR1cm4gZmluZEFsbCh0eXBlKS50aGVuKCBmdW5jdGlvbih0YXNrT2JqZWN0cykge1xuICAgICAgcmVzdGFydFRhc2tPYmplY3RzKHRhc2tPYmplY3RzLCB1cGRhdGUpO1xuICAgIH0pO1xuICB9O1xuXG5cbiAgLy9cbiAgLy8gc3Vic2NyaWJlIHRvIHN0b3JlIGV2ZW50c1xuICAvLyB3ZSBzdWJzY3JpYmUgdG8gYWxsIHN0b3JlIGNoYW5nZXMsIHBpcGUgdGhyb3VnaCB0aGUgdGFzayBvbmVzLFxuICAvLyBtYWtpbmcgYSBmZXcgY2hhbmdlcyBhbG9uZyB0aGUgd2F5LlxuICAvL1xuICBmdW5jdGlvbiBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKSB7XG5cbiAgICAvLyBhY2NvdW50IGV2ZW50c1xuICAgIGhvb2RpZS5vbignc3RvcmU6Y2hhbmdlJywgaGFuZGxlU3RvcmVDaGFuZ2UpO1xuICB9XG5cbiAgLy8gYWxsb3cgdG8gcnVuIHRoaXMgb25seSBvbmNlIGZyb20gb3V0c2lkZSAoZHVyaW5nIEhvb2RpZSBpbml0aWFsaXphdGlvbilcbiAgYXBpLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuICAgIGRlbGV0ZSBhcGkuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzO1xuICB9O1xuXG5cbiAgLy8gUHJpdmF0ZVxuICAvLyAtLS0tLS0tXG5cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlTmV3VGFzayhvYmplY3QpIHtcbiAgICB2YXIgZGVmZXIgPSBob29kaWUuZGVmZXIoKTtcbiAgICB2YXIgdGFza1N0b3JlID0gaG9vZGllLnN0b3JlKG9iamVjdC50eXBlLCBvYmplY3QuaWQpO1xuXG4gICAgdGFza1N0b3JlLm9uKCdyZW1vdmUnLCBmdW5jdGlvbihvYmplY3QpIHtcblxuICAgICAgLy8gcmVtb3ZlIFwiJFwiIGZyb20gdHlwZVxuICAgICAgb2JqZWN0LnR5cGUgPSBvYmplY3QudHlwZS5zdWJzdHIoMSk7XG5cbiAgICAgIC8vIHRhc2sgZmluaXNoZWQgYnkgd29ya2VyLlxuICAgICAgaWYob2JqZWN0LiRwcm9jZXNzZWRBdCkge1xuICAgICAgICByZXR1cm4gZGVmZXIucmVzb2x2ZShvYmplY3QpO1xuICAgICAgfVxuXG4gICAgICAvLyBtYW51YWxseSByZW1vdmVkIC8gY2FuY2VsbGVkLlxuICAgICAgZGVmZXIucmVqZWN0KG5ldyBIb29kaWVFcnJvcih7XG4gICAgICAgIG1lc3NhZ2U6ICdUYXNrIGhhcyBiZWVuIGNhbmNlbGxlZCcsXG4gICAgICAgIHRhc2s6IG9iamVjdFxuICAgICAgfSkpO1xuICAgIH0pO1xuICAgIHRhc2tTdG9yZS5vbigndXBkYXRlJywgZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICB2YXIgZXJyb3IgPSBvYmplY3QuJGVycm9yO1xuICAgICAgaWYgKCEgb2JqZWN0LiRlcnJvcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIHJlbW92ZSBcIiRcIiBmcm9tIHR5cGVcbiAgICAgIG9iamVjdC50eXBlID0gb2JqZWN0LnR5cGUuc3Vic3RyKDEpO1xuXG4gICAgICBkZWxldGUgb2JqZWN0LiRlcnJvcjtcbiAgICAgIGVycm9yLm9iamVjdCA9IG9iamVjdDtcbiAgICAgIGVycm9yLm1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlIHx8ICdTb21ldGhpbmcgd2VudCB3cm9uZyc7XG5cbiAgICAgIGRlZmVyLnJlamVjdChuZXcgSG9vZGllRXJyb3IoZXJyb3IpKTtcblxuICAgICAgLy8gcmVtb3ZlIGVycm9yZWQgdGFza1xuICAgICAgaG9vZGllLnN0b3JlLnJlbW92ZSgnJCcgKyBvYmplY3QudHlwZSwgb2JqZWN0LmlkKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVDYW5jZWxsZWRUYXNrT2JqZWN0ICh0YXNrT2JqZWN0KSB7XG4gICAgdmFyIGRlZmVyO1xuICAgIHZhciB0eXBlID0gdGFza09iamVjdC50eXBlOyAvLyBubyBuZWVkIHRvIHByZWZpeCB3aXRoICQsIGl0J3MgYWxyZWFkeSBwcmVmaXhlZC5cbiAgICB2YXIgaWQgPSB0YXNrT2JqZWN0LmlkO1xuICAgIHZhciByZW1vdmVQcm9taXNlID0gaG9vZGllLnN0b3JlLnJlbW92ZSh0eXBlLCBpZCk7XG5cbiAgICBpZiAoIXRhc2tPYmplY3QuX3Jldikge1xuICAgICAgLy8gdGFzayBoYXMgbm90IHlldCBiZWVuIHN5bmNlZC5cbiAgICAgIHJldHVybiByZW1vdmVQcm9taXNlO1xuICAgIH1cblxuICAgIGRlZmVyID0gaG9vZGllLmRlZmVyKCk7XG4gICAgaG9vZGllLm9uZSgnc3RvcmU6c3luYzonK3R5cGUrJzonK2lkLCBkZWZlci5yZXNvbHZlKTtcbiAgICByZW1vdmVQcm9taXNlLmZhaWwoZGVmZXIucmVqZWN0KTtcblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVTdG9yZUNoYW5nZShldmVudE5hbWUsIG9iamVjdCwgb3B0aW9ucykge1xuICAgIGlmIChvYmplY3QudHlwZVswXSAhPT0gJyQnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgb2JqZWN0LnR5cGUgPSBvYmplY3QudHlwZS5zdWJzdHIoMSk7XG4gICAgdHJpZ2dlckV2ZW50cyhldmVudE5hbWUsIG9iamVjdCwgb3B0aW9ucyk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBmaW5kQWxsICh0eXBlKSB7XG4gICAgdmFyIHN0YXJ0c1dpdGggPSAnJCc7XG4gICAgdmFyIGZpbHRlcjtcbiAgICBpZiAodHlwZSkge1xuICAgICAgc3RhcnRzV2l0aCArPSB0eXBlO1xuICAgIH1cblxuICAgIGZpbHRlciA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgcmV0dXJuIG9iamVjdC50eXBlLmluZGV4T2Yoc3RhcnRzV2l0aCkgPT09IDA7XG4gICAgfTtcbiAgICByZXR1cm4gaG9vZGllLnN0b3JlLmZpbmRBbGwoZmlsdGVyKTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGNhbmNlbFRhc2tPYmplY3RzICh0YXNrT2JqZWN0cykge1xuICAgIHJldHVybiB0YXNrT2JqZWN0cy5tYXAoIGZ1bmN0aW9uKHRhc2tPYmplY3QpIHtcbiAgICAgIHJldHVybiBhcGkuY2FuY2VsKHRhc2tPYmplY3QudHlwZS5zdWJzdHIoMSksIHRhc2tPYmplY3QuaWQpO1xuICAgIH0pO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gcmVzdGFydFRhc2tPYmplY3RzICh0YXNrT2JqZWN0cywgdXBkYXRlKSB7XG4gICAgcmV0dXJuIHRhc2tPYmplY3RzLm1hcCggZnVuY3Rpb24odGFza09iamVjdCkge1xuICAgICAgcmV0dXJuIGFwaS5yZXN0YXJ0KHRhc2tPYmplY3QudHlwZS5zdWJzdHIoMSksIHRhc2tPYmplY3QuaWQsIHVwZGF0ZSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyB0aGlzIGlzIHdoZXJlIGFsbCB0aGUgdGFzayBldmVudHMgZ2V0IHRyaWdnZXJlZCxcbiAgLy8gbGlrZSBhZGQ6bWVzc2FnZSwgY2hhbmdlOm1lc3NhZ2U6YWJjNDU2NywgcmVtb3ZlLCBldGMuXG4gIGZ1bmN0aW9uIHRyaWdnZXJFdmVudHMoZXZlbnROYW1lLCB0YXNrLCBvcHRpb25zKSB7XG4gICAgdmFyIGVycm9yO1xuXG4gICAgLy8gXCJuZXdcIiB0YXNrcyBhcmUgdHJpZ2dlciBhcyBcInN0YXJ0XCIgZXZlbnRzXG4gICAgaWYgKGV2ZW50TmFtZSA9PT0gJ25ldycpIHtcbiAgICAgIGV2ZW50TmFtZSA9ICdzdGFydCc7XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50TmFtZSA9PT0gJ3JlbW92ZScgJiYgdGFzay5jYW5jZWxsZWRBdCkge1xuICAgICAgZXZlbnROYW1lID0gJ2NhbmNlbCc7XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50TmFtZSA9PT0gJ3JlbW92ZScgJiYgdGFzay4kcHJvY2Vzc2VkQXQpIHtcbiAgICAgIGV2ZW50TmFtZSA9ICdzdWNjZXNzJztcbiAgICB9XG5cbiAgICBpZiAoZXZlbnROYW1lID09PSAndXBkYXRlJyAmJiB0YXNrLiRlcnJvcikge1xuICAgICAgZXZlbnROYW1lID0gJ2Vycm9yJztcbiAgICAgIGVycm9yID0gdGFzay4kZXJyb3I7XG4gICAgICBkZWxldGUgdGFzay4kZXJyb3I7XG5cbiAgICAgIGFwaS50cmlnZ2VyKCdlcnJvcicsIGVycm9yLCB0YXNrLCBvcHRpb25zKTtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6ZXJyb3InLCBlcnJvciwgdGFzaywgb3B0aW9ucyk7XG4gICAgICBhcGkudHJpZ2dlcih0YXNrLnR5cGUgKyAnOicgKyB0YXNrLmlkICsgJzplcnJvcicsIGVycm9yLCB0YXNrLCBvcHRpb25zKTtcblxuICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zLCB7ZXJyb3I6IGVycm9yfSk7XG4gICAgICBhcGkudHJpZ2dlcignY2hhbmdlJywgJ2Vycm9yJywgdGFzaywgb3B0aW9ucyk7XG4gICAgICBhcGkudHJpZ2dlcih0YXNrLnR5cGUgKyAnOmNoYW5nZScsICdlcnJvcicsIHRhc2ssIG9wdGlvbnMpO1xuICAgICAgYXBpLnRyaWdnZXIodGFzay50eXBlICsgJzonICsgdGFzay5pZCArICc6Y2hhbmdlJywgJ2Vycm9yJywgdGFzaywgb3B0aW9ucyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gaWdub3JlIGFsbCB0aGUgb3RoZXIgZXZlbnRzXG4gICAgaWYgKGV2ZW50TmFtZSAhPT0gJ3N0YXJ0JyAmJiBldmVudE5hbWUgIT09ICdjYW5jZWwnICYmIGV2ZW50TmFtZSAhPT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYXBpLnRyaWdnZXIoZXZlbnROYW1lLCB0YXNrLCBvcHRpb25zKTtcbiAgICBhcGkudHJpZ2dlcih0YXNrLnR5cGUgKyAnOicgKyBldmVudE5hbWUsIHRhc2ssIG9wdGlvbnMpO1xuXG4gICAgaWYgKGV2ZW50TmFtZSAhPT0gJ3N0YXJ0Jykge1xuICAgICAgYXBpLnRyaWdnZXIodGFzay50eXBlICsgJzonICsgdGFzay5pZCArICc6JyArIGV2ZW50TmFtZSwgdGFzaywgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgYXBpLnRyaWdnZXIoJ2NoYW5nZScsIGV2ZW50TmFtZSwgdGFzaywgb3B0aW9ucyk7XG4gICAgYXBpLnRyaWdnZXIodGFzay50eXBlICsgJzpjaGFuZ2UnLCBldmVudE5hbWUsIHRhc2ssIG9wdGlvbnMpO1xuXG4gICAgaWYgKGV2ZW50TmFtZSAhPT0gJ3N0YXJ0Jykge1xuICAgICAgYXBpLnRyaWdnZXIodGFzay50eXBlICsgJzonICsgdGFzay5pZCArICc6Y2hhbmdlJywgZXZlbnROYW1lLCB0YXNrLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBub3coKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG5ldyBEYXRlKCkpLnJlcGxhY2UoL1snXCJdL2csICcnKTtcbiAgfVxuXG4gIC8vIGV4dGVuZCBob29kaWVcbiAgaG9vZGllLnRhc2sgPSBhcGk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllVGFzaztcbiJdfQ==
(1)
});
;