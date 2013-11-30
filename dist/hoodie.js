!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Hoodie=e():"undefined"!=typeof global?global.Hoodie=e():"undefined"!=typeof self&&(self.Hoodie=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

function isPlainObject(obj) {
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval)
		return false;

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
		return false;

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for ( key in obj ) {}

	return key === undefined || hasOwn.call( obj, key );
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone,
	    target = arguments[0] || {},
	    i = 1,
	    length = arguments.length,
	    deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && typeof target !== "function") {
		target = {};
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];

					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],2:[function(require,module,exports){
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
  hoodie.extend(hoodieEvents);


  // * hoodie.defer
  // * hoodie.isPromise
  // * hoodie.resolve
  // * hoodie.reject
  // * hoodie.resolveWith
  // * hoodie.rejectWith
  hoodie.extend(hoodiePromises );

  // * hoodie.request
  hoodie.extend(hoodieRequest);

  // * hoodie.isOnline
  // * hoodie.checkConnection
  hoodie.extend(hoodieConnection);

  // * hoodie.uuid
  hoodie.extend(hoodieGenerateId);

  // * hoodie.dispose
  hoodie.extend(hoodieDispose);

  // * hoodie.open
  hoodie.extend(hoodieOpen);

  // * hoodie.store
  hoodie.extend(hoodieLocalStore);

  // * hoodie.task
  hoodie.extend(hoodieTask);

  // * hoodie.config
  hoodie.extend(hoodieConfig);

  // * hoodie.account
  hoodie.extend(hoodieAccount);

  // * hoodie.remote
  hoodie.extend(hoodieAccountRemote);


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

},{"./hoodie/account":3,"./hoodie/account_remote":4,"./hoodie/config":5,"./hoodie/connection":6,"./hoodie/dispose":7,"./hoodie/events":11,"./hoodie/generate_id":12,"./hoodie/local_store":13,"./hoodie/open":14,"./hoodie/promises":15,"./hoodie/request":17,"./hoodie/task":21}],3:[function(require,module,exports){
// Hoodie.Account
// ================

var hoodieEvents = require('./events');
var extend = require('extend');

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
      var data = extend({}, userDoc);

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

},{"./events":11,"extend":1}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

var extend = require('extend');

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

  extend(this, properties);

  properties.message = properties.message.replace(errorMessageReplacePattern, function(match) {
    var property = match.match(errorMessageFindPropertyPattern)[0];
    return properties[property];
  });
}
HoodieError.prototype = new Error();
HoodieError.prototype.constructor = HoodieError;

module.exports = HoodieError;

},{"extend":1}],9:[function(require,module,exports){
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

},{"../error":8}],10:[function(require,module,exports){
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

},{"../error":8}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
// LocalStore
// ============

//
var hoodieStoreApi = require('./store');
var HoodieObjectTypeError = require('./error/object_type');
var HoodieObjectIdError = require('./error/object_id');

var extend = require('extend');

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
      extend(object, {
        type: type,
        id: id
      });

      setObject(type, id, object);

      if (options.remote) {
        clearChanged(type, id);
        cachedObject[key] = extend(true, {}, object);
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

},{"./error/object_id":9,"./error/object_type":10,"./store":20,"extend":1}],14:[function(require,module,exports){
// Open stores
// -------------

var hoodieRemoteStore = require('./remote_store');

var extend = require('extend');

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

    extend(options, {
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

},{"./remote_store":16,"extend":1}],15:[function(require,module,exports){
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

},{"./error":8}],16:[function(require,module,exports){
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

var extend = require('extend');

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
      object = extend(true, {}, objects[_i]);
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
    properties = extend({}, object);

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

},{"./store":20,"extend":1}],17:[function(require,module,exports){
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
var extend = require('extend');

function hoodieRequest(hoodie) {
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
    requestPromise = $ajax(extend(defaults, options));
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

},{"extend":1}],18:[function(require,module,exports){
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

},{"./events":11}],19:[function(require,module,exports){
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

},{"./events":11}],20:[function(require,module,exports){
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

var extend = require('extend');

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
    var scopedOptions = extend(true, {type: type, id: id}, options);
    return hoodieScopedStoreApi(hoodie, api, scopedOptions);
  };

  // add event API
  hoodieEvents(hoodie, {
    context: api,
    namespace: storeName
  });


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

    if (options) {
      options = extend(true, {}, options);
    } else {
      options = {};
    }

    // don't mess with passed object
    var object = extend(true, {}, properties, {
      type: type,
      id: id
    });

    // validations
    var error = api.validate(object, options || {});

    if (error) {
      return hoodie.rejectWith(error);
    }

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
      newProperties = extend(true, {
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
      newObj = extend(true, {}, currentObject);

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
      var properties = extend(true, {}, objectUpdate, {
        id: id
      });

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
    return extend(promiseApi, methods);
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
    return extend(promise, promiseApi);
  }

  return api;
}

module.exports = hoodieStoreApi;

},{"./error":8,"./error/object_id":9,"./error/object_type":10,"./events":11,"./scoped_store":18,"extend":1}],21:[function(require,module,exports){
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

var extend = require('extend');

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
    return hoodie.store.update('$' + type, id, {
      cancelledAt: now()
    }).then(handleCancelledTaskObject);
  };


  // restart
  // ---------

  // first, we try to cancel a running task. If that succeeds, we start
  // a new one with the same properties as the original
  //
  api.restart = function(type, id, update) {
    var start = function(object) {
      extend(object, update);
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

      options = extend({}, options, {
        error: error
      });

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

},{"./error":8,"./events":11,"./scoped_task":19,"extend":1}]},{},[2])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvbm9kZV9tb2R1bGVzL2V4dGVuZC9pbmRleC5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllLmpzIiwiL1VzZXJzL3N2ZW5saXRvL1NpdGVzL3ByaXZhdGUvaG9vZGllLmpzL3NyYy9ob29kaWUvYWNjb3VudC5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL2FjY291bnRfcmVtb3RlLmpzIiwiL1VzZXJzL3N2ZW5saXRvL1NpdGVzL3ByaXZhdGUvaG9vZGllLmpzL3NyYy9ob29kaWUvY29uZmlnLmpzIiwiL1VzZXJzL3N2ZW5saXRvL1NpdGVzL3ByaXZhdGUvaG9vZGllLmpzL3NyYy9ob29kaWUvY29ubmVjdGlvbi5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL2Rpc3Bvc2UuanMiLCIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS9lcnJvci5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL2Vycm9yL29iamVjdF9pZC5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL2Vycm9yL29iamVjdF90eXBlLmpzIiwiL1VzZXJzL3N2ZW5saXRvL1NpdGVzL3ByaXZhdGUvaG9vZGllLmpzL3NyYy9ob29kaWUvZXZlbnRzLmpzIiwiL1VzZXJzL3N2ZW5saXRvL1NpdGVzL3ByaXZhdGUvaG9vZGllLmpzL3NyYy9ob29kaWUvZ2VuZXJhdGVfaWQuanMiLCIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS9sb2NhbF9zdG9yZS5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL29wZW4uanMiLCIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS9wcm9taXNlcy5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL3JlbW90ZV9zdG9yZS5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL3JlcXVlc3QuanMiLCIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS9zY29wZWRfc3RvcmUuanMiLCIvVXNlcnMvc3ZlbmxpdG8vU2l0ZXMvcHJpdmF0ZS9ob29kaWUuanMvc3JjL2hvb2RpZS9zY29wZWRfdGFzay5qcyIsIi9Vc2Vycy9zdmVubGl0by9TaXRlcy9wcml2YXRlL2hvb2RpZS5qcy9zcmMvaG9vZGllL3N0b3JlLmpzIiwiL1VzZXJzL3N2ZW5saXRvL1NpdGVzL3ByaXZhdGUvaG9vZGllLmpzL3NyYy9ob29kaWUvdGFzay5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25tQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcjlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuZnVuY3Rpb24gaXNQbGFpbk9iamVjdChvYmopIHtcblx0aWYgKCFvYmogfHwgdG9TdHJpbmcuY2FsbChvYmopICE9PSAnW29iamVjdCBPYmplY3RdJyB8fCBvYmoubm9kZVR5cGUgfHwgb2JqLnNldEludGVydmFsKVxuXHRcdHJldHVybiBmYWxzZTtcblxuXHR2YXIgaGFzX293bl9jb25zdHJ1Y3RvciA9IGhhc093bi5jYWxsKG9iaiwgJ2NvbnN0cnVjdG9yJyk7XG5cdHZhciBoYXNfaXNfcHJvcGVydHlfb2ZfbWV0aG9kID0gaGFzT3duLmNhbGwob2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSwgJ2lzUHJvdG90eXBlT2YnKTtcblx0Ly8gTm90IG93biBjb25zdHJ1Y3RvciBwcm9wZXJ0eSBtdXN0IGJlIE9iamVjdFxuXHRpZiAob2JqLmNvbnN0cnVjdG9yICYmICFoYXNfb3duX2NvbnN0cnVjdG9yICYmICFoYXNfaXNfcHJvcGVydHlfb2ZfbWV0aG9kKVxuXHRcdHJldHVybiBmYWxzZTtcblxuXHQvLyBPd24gcHJvcGVydGllcyBhcmUgZW51bWVyYXRlZCBmaXJzdGx5LCBzbyB0byBzcGVlZCB1cCxcblx0Ly8gaWYgbGFzdCBvbmUgaXMgb3duLCB0aGVuIGFsbCBwcm9wZXJ0aWVzIGFyZSBvd24uXG5cdHZhciBrZXk7XG5cdGZvciAoIGtleSBpbiBvYmogKSB7fVxuXG5cdHJldHVybiBrZXkgPT09IHVuZGVmaW5lZCB8fCBoYXNPd24uY2FsbCggb2JqLCBrZXkgKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZXh0ZW5kKCkge1xuXHR2YXIgb3B0aW9ucywgbmFtZSwgc3JjLCBjb3B5LCBjb3B5SXNBcnJheSwgY2xvbmUsXG5cdCAgICB0YXJnZXQgPSBhcmd1bWVudHNbMF0gfHwge30sXG5cdCAgICBpID0gMSxcblx0ICAgIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGgsXG5cdCAgICBkZWVwID0gZmFsc2U7XG5cblx0Ly8gSGFuZGxlIGEgZGVlcCBjb3B5IHNpdHVhdGlvblxuXHRpZiAoIHR5cGVvZiB0YXJnZXQgPT09IFwiYm9vbGVhblwiICkge1xuXHRcdGRlZXAgPSB0YXJnZXQ7XG5cdFx0dGFyZ2V0ID0gYXJndW1lbnRzWzFdIHx8IHt9O1xuXHRcdC8vIHNraXAgdGhlIGJvb2xlYW4gYW5kIHRoZSB0YXJnZXRcblx0XHRpID0gMjtcblx0fVxuXG5cdC8vIEhhbmRsZSBjYXNlIHdoZW4gdGFyZ2V0IGlzIGEgc3RyaW5nIG9yIHNvbWV0aGluZyAocG9zc2libGUgaW4gZGVlcCBjb3B5KVxuXHRpZiAoIHR5cGVvZiB0YXJnZXQgIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHRhcmdldCAhPT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0dGFyZ2V0ID0ge307XG5cdH1cblxuXHRmb3IgKCA7IGkgPCBsZW5ndGg7IGkrKyApIHtcblx0XHQvLyBPbmx5IGRlYWwgd2l0aCBub24tbnVsbC91bmRlZmluZWQgdmFsdWVzXG5cdFx0aWYgKCAob3B0aW9ucyA9IGFyZ3VtZW50c1sgaSBdKSAhPSBudWxsICkge1xuXHRcdFx0Ly8gRXh0ZW5kIHRoZSBiYXNlIG9iamVjdFxuXHRcdFx0Zm9yICggbmFtZSBpbiBvcHRpb25zICkge1xuXHRcdFx0XHRzcmMgPSB0YXJnZXRbIG5hbWUgXTtcblx0XHRcdFx0Y29weSA9IG9wdGlvbnNbIG5hbWUgXTtcblxuXHRcdFx0XHQvLyBQcmV2ZW50IG5ldmVyLWVuZGluZyBsb29wXG5cdFx0XHRcdGlmICggdGFyZ2V0ID09PSBjb3B5ICkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gUmVjdXJzZSBpZiB3ZSdyZSBtZXJnaW5nIHBsYWluIG9iamVjdHMgb3IgYXJyYXlzXG5cdFx0XHRcdGlmICggZGVlcCAmJiBjb3B5ICYmICggaXNQbGFpbk9iamVjdChjb3B5KSB8fCAoY29weUlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGNvcHkpKSApICkge1xuXHRcdFx0XHRcdGlmICggY29weUlzQXJyYXkgKSB7XG5cdFx0XHRcdFx0XHRjb3B5SXNBcnJheSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0Y2xvbmUgPSBzcmMgJiYgQXJyYXkuaXNBcnJheShzcmMpID8gc3JjIDogW107XG5cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y2xvbmUgPSBzcmMgJiYgaXNQbGFpbk9iamVjdChzcmMpID8gc3JjIDoge307XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gTmV2ZXIgbW92ZSBvcmlnaW5hbCBvYmplY3RzLCBjbG9uZSB0aGVtXG5cdFx0XHRcdFx0dGFyZ2V0WyBuYW1lIF0gPSBleHRlbmQoIGRlZXAsIGNsb25lLCBjb3B5ICk7XG5cblx0XHRcdFx0Ly8gRG9uJ3QgYnJpbmcgaW4gdW5kZWZpbmVkIHZhbHVlc1xuXHRcdFx0XHR9IGVsc2UgaWYgKCBjb3B5ICE9PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRcdFx0dGFyZ2V0WyBuYW1lIF0gPSBjb3B5O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gUmV0dXJuIHRoZSBtb2RpZmllZCBvYmplY3Rcblx0cmV0dXJuIHRhcmdldDtcbn07XG4iLCJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTsvLyBIb29kaWUgQ29yZVxuLy8gLS0tLS0tLS0tLS0tLVxuLy9cbi8vIHRoZSBkb29yIHRvIHdvcmxkIGRvbWluYXRpb24gKGFwcHMpXG4vL1xuXG52YXIgaG9vZGllQWNjb3VudCA9IHJlcXVpcmUoJy4vaG9vZGllL2FjY291bnQnKTtcbnZhciBob29kaWVBY2NvdW50UmVtb3RlID0gcmVxdWlyZSgnLi9ob29kaWUvYWNjb3VudF9yZW1vdGUnKTtcbnZhciBob29kaWVDb25maWcgPSByZXF1aXJlKCcuL2hvb2RpZS9jb25maWcnKTtcbnZhciBob29kaWVQcm9taXNlcyA9IHJlcXVpcmUoJy4vaG9vZGllL3Byb21pc2VzJyk7XG52YXIgaG9vZGllUmVxdWVzdCA9IHJlcXVpcmUoJy4vaG9vZGllL3JlcXVlc3QnKTtcbnZhciBob29kaWVDb25uZWN0aW9uID0gcmVxdWlyZSgnLi9ob29kaWUvY29ubmVjdGlvbicpO1xudmFyIGhvb2RpZURpc3Bvc2UgPSByZXF1aXJlKCcuL2hvb2RpZS9kaXNwb3NlJyk7XG52YXIgaG9vZGllT3BlbiA9IHJlcXVpcmUoJy4vaG9vZGllL29wZW4nKTtcbnZhciBob29kaWVMb2NhbFN0b3JlID0gcmVxdWlyZSgnLi9ob29kaWUvbG9jYWxfc3RvcmUnKTtcbnZhciBob29kaWVHZW5lcmF0ZUlkID0gcmVxdWlyZSgnLi9ob29kaWUvZ2VuZXJhdGVfaWQnKTtcbnZhciBob29kaWVUYXNrID0gcmVxdWlyZSgnLi9ob29kaWUvdGFzaycpO1xudmFyIGhvb2RpZUV2ZW50cyA9IHJlcXVpcmUoJy4vaG9vZGllL2V2ZW50cycpO1xuXG4vLyBDb25zdHJ1Y3RvclxuLy8gLS0tLS0tLS0tLS0tLVxuXG4vLyBXaGVuIGluaXRpYWxpemluZyBhIGhvb2RpZSBpbnN0YW5jZSwgYW4gb3B0aW9uYWwgVVJMXG4vLyBjYW4gYmUgcGFzc2VkLiBUaGF0J3MgdGhlIFVSTCBvZiB0aGUgaG9vZGllIGJhY2tlbmQuXG4vLyBJZiBubyBVUkwgcGFzc2VkIGl0IGRlZmF1bHRzIHRvIHRoZSBjdXJyZW50IGRvbWFpbi5cbi8vXG4vLyAgICAgLy8gaW5pdCBhIG5ldyBob29kaWUgaW5zdGFuY2Vcbi8vICAgICBob29kaWUgPSBuZXcgSG9vZGllXG4vL1xuZnVuY3Rpb24gSG9vZGllKGJhc2VVcmwpIHtcbiAgdmFyIGhvb2RpZSA9IHRoaXM7XG5cbiAgLy8gZW5mb3JjZSBpbml0aWFsaXphdGlvbiB3aXRoIGBuZXdgXG4gIGlmICghKGhvb2RpZSBpbnN0YW5jZW9mIEhvb2RpZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VzYWdlOiBuZXcgSG9vZGllKHVybCk7Jyk7XG4gIH1cblxuICBpZiAoYmFzZVVybCkge1xuICAgIC8vIHJlbW92ZSB0cmFpbGluZyBzbGFzaGVzXG4gICAgaG9vZGllLmJhc2VVcmwgPSBiYXNlVXJsLnJlcGxhY2UoL1xcLyskLywgJycpO1xuICB9XG5cblxuICAvLyBob29kaWUuZXh0ZW5kXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGV4dGVuZCBob29kaWUgaW5zdGFuY2U6XG4gIC8vXG4gIC8vICAgICBob29kaWUuZXh0ZW5kKGZ1bmN0aW9uKGhvb2RpZSkge30gKVxuICAvL1xuICBob29kaWUuZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kKGV4dGVuc2lvbikge1xuICAgIGV4dGVuc2lvbihob29kaWUpO1xuICB9O1xuXG5cbiAgLy9cbiAgLy8gRXh0ZW5kaW5nIGhvb2RpZSBjb3JlXG4gIC8vXG5cbiAgLy8gKiBob29kaWUuYmluZFxuICAvLyAqIGhvb2RpZS5vblxuICAvLyAqIGhvb2RpZS5vbmVcbiAgLy8gKiBob29kaWUudHJpZ2dlclxuICAvLyAqIGhvb2RpZS51bmJpbmRcbiAgLy8gKiBob29kaWUub2ZmXG4gIGhvb2RpZS5leHRlbmQoaG9vZGllRXZlbnRzKTtcblxuXG4gIC8vICogaG9vZGllLmRlZmVyXG4gIC8vICogaG9vZGllLmlzUHJvbWlzZVxuICAvLyAqIGhvb2RpZS5yZXNvbHZlXG4gIC8vICogaG9vZGllLnJlamVjdFxuICAvLyAqIGhvb2RpZS5yZXNvbHZlV2l0aFxuICAvLyAqIGhvb2RpZS5yZWplY3RXaXRoXG4gIGhvb2RpZS5leHRlbmQoaG9vZGllUHJvbWlzZXMgKTtcblxuICAvLyAqIGhvb2RpZS5yZXF1ZXN0XG4gIGhvb2RpZS5leHRlbmQoaG9vZGllUmVxdWVzdCk7XG5cbiAgLy8gKiBob29kaWUuaXNPbmxpbmVcbiAgLy8gKiBob29kaWUuY2hlY2tDb25uZWN0aW9uXG4gIGhvb2RpZS5leHRlbmQoaG9vZGllQ29ubmVjdGlvbik7XG5cbiAgLy8gKiBob29kaWUudXVpZFxuICBob29kaWUuZXh0ZW5kKGhvb2RpZUdlbmVyYXRlSWQpO1xuXG4gIC8vICogaG9vZGllLmRpc3Bvc2VcbiAgaG9vZGllLmV4dGVuZChob29kaWVEaXNwb3NlKTtcblxuICAvLyAqIGhvb2RpZS5vcGVuXG4gIGhvb2RpZS5leHRlbmQoaG9vZGllT3Blbik7XG5cbiAgLy8gKiBob29kaWUuc3RvcmVcbiAgaG9vZGllLmV4dGVuZChob29kaWVMb2NhbFN0b3JlKTtcblxuICAvLyAqIGhvb2RpZS50YXNrXG4gIGhvb2RpZS5leHRlbmQoaG9vZGllVGFzayk7XG5cbiAgLy8gKiBob29kaWUuY29uZmlnXG4gIGhvb2RpZS5leHRlbmQoaG9vZGllQ29uZmlnKTtcblxuICAvLyAqIGhvb2RpZS5hY2NvdW50XG4gIGhvb2RpZS5leHRlbmQoaG9vZGllQWNjb3VudCk7XG5cbiAgLy8gKiBob29kaWUucmVtb3RlXG4gIGhvb2RpZS5leHRlbmQoaG9vZGllQWNjb3VudFJlbW90ZSk7XG5cblxuICAvL1xuICAvLyBJbml0aWFsaXphdGlvbnNcbiAgLy9cblxuICAvLyBzZXQgdXNlcm5hbWUgZnJvbSBjb25maWcgKGxvY2FsIHN0b3JlKVxuICBob29kaWUuYWNjb3VudC51c2VybmFtZSA9IGhvb2RpZS5jb25maWcuZ2V0KCdfYWNjb3VudC51c2VybmFtZScpO1xuXG4gIC8vIGNoZWNrIGZvciBwZW5kaW5nIHBhc3N3b3JkIHJlc2V0XG4gIGhvb2RpZS5hY2NvdW50LmNoZWNrUGFzc3dvcmRSZXNldCgpO1xuXG4gIC8vIGNsZWFyIGNvbmZpZyBvbiBzaWduIG91dFxuICBob29kaWUub24oJ2FjY291bnQ6c2lnbm91dCcsIGhvb2RpZS5jb25maWcuY2xlYXIpO1xuXG4gIC8vIGhvb2RpZS5zdG9yZVxuICBob29kaWUuc3RvcmUucGF0Y2hJZk5vdFBlcnNpc3RhbnQoKTtcbiAgaG9vZGllLnN0b3JlLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuICBob29kaWUuc3RvcmUuYm9vdHN0cmFwRGlydHlPYmplY3RzKCk7XG5cbiAgLy8gaG9vZGllLnJlbW90ZVxuICBob29kaWUucmVtb3RlLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuXG4gIC8vIGhvb2RpZS50YXNrXG4gIGhvb2RpZS50YXNrLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuXG4gIC8vIGF1dGhlbnRpY2F0ZVxuICAvLyB3ZSB1c2UgYSBjbG9zdXJlIHRvIG5vdCBwYXNzIHRoZSB1c2VybmFtZSB0byBjb25uZWN0LCBhcyBpdFxuICAvLyB3b3VsZCBzZXQgdGhlIG5hbWUgb2YgdGhlIHJlbW90ZSBzdG9yZSwgd2hpY2ggaXMgbm90IHRoZSB1c2VybmFtZS5cbiAgaG9vZGllLmFjY291bnQuYXV0aGVudGljYXRlKCkudGhlbiggZnVuY3Rpb24oIC8qIHVzZXJuYW1lICovICkge1xuICAgIGhvb2RpZS5yZW1vdGUuY29ubmVjdCgpO1xuICB9KTtcblxuICAvLyBjaGVjayBjb25uZWN0aW9uIHdoZW4gYnJvd3NlciBnb2VzIG9ubGluZSAvIG9mZmxpbmVcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29ubGluZScsIGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24sIGZhbHNlKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29mZmxpbmUnLCBob29kaWUuY2hlY2tDb25uZWN0aW9uLCBmYWxzZSk7XG5cbiAgLy8gc3RhcnQgY2hlY2tpbmcgY29ubmVjdGlvblxuICBob29kaWUuY2hlY2tDb25uZWN0aW9uKCk7XG5cbiAgLy9cbiAgLy8gbG9hZGluZyB1c2VyIGV4dGVuc2lvbnNcbiAgLy9cbiAgYXBwbHlFeHRlbnNpb25zKGhvb2RpZSk7XG59XG5cbi8vIEV4dGVuZGluZyBob29kaWVcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBZb3UgY2FuIGV4dGVuZCB0aGUgSG9vZGllIGNsYXNzIGxpa2Ugc286XG4vL1xuLy8gSG9vZGllLmV4dGVuZChmdW5jaW9uKGhvb2RpZSkgeyBob29kaWUubXlNYWdpYyA9IGZ1bmN0aW9uKCkge30gfSlcbi8vXG5cbnZhciBleHRlbnNpb25zID0gW107XG5cbkhvb2RpZS5leHRlbmQgPSBmdW5jdGlvbihleHRlbnNpb24pIHtcbiAgZXh0ZW5zaW9ucy5wdXNoKGV4dGVuc2lvbik7XG59O1xuXG4vL1xuLy8gZGV0ZWN0IGF2YWlsYWJsZSBleHRlbnNpb25zIGFuZCBhdHRhY2ggdG8gSG9vZGllIE9iamVjdC5cbi8vXG5mdW5jdGlvbiBhcHBseUV4dGVuc2lvbnMoaG9vZGllKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZXh0ZW5zaW9ucy5sZW5ndGg7IGkrKykge1xuICAgIGV4dGVuc2lvbnNbaV0oaG9vZGllKTtcbiAgfVxufVxuXG4vL1xuLy8gZXhwb3NlIEhvb2RpZSB0byBtb2R1bGUgbG9hZGVycy4gQmFzZWQgb24galF1ZXJ5J3MgaW1wbGVtZW50YXRpb24uXG4vL1xuaWYgKCB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0JyApIHtcblxuICAvLyBFeHBvc2UgSG9vZGllIGFzIG1vZHVsZS5leHBvcnRzIGluIGxvYWRlcnMgdGhhdCBpbXBsZW1lbnQgdGhlIE5vZGVcbiAgLy8gbW9kdWxlIHBhdHRlcm4gKGluY2x1ZGluZyBicm93c2VyaWZ5KS4gRG8gbm90IGNyZWF0ZSB0aGUgZ2xvYmFsLCBzaW5jZVxuICAvLyB0aGUgdXNlciB3aWxsIGJlIHN0b3JpbmcgaXQgdGhlbXNlbHZlcyBsb2NhbGx5LCBhbmQgZ2xvYmFscyBhcmUgZnJvd25lZFxuICAvLyB1cG9uIGluIHRoZSBOb2RlIG1vZHVsZSB3b3JsZC5cbiAgbW9kdWxlLmV4cG9ydHMgPSBIb29kaWU7XG5cblxufSBlbHNlIGlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuXG4gIC8vIFJlZ2lzdGVyIGFzIGEgbmFtZWQgQU1EIG1vZHVsZSwgc2luY2UgSG9vZGllIGNhbiBiZSBjb25jYXRlbmF0ZWQgd2l0aCBvdGhlclxuICAvLyBmaWxlcyB0aGF0IG1heSB1c2UgZGVmaW5lLCBidXQgbm90IHZpYSBhIHByb3BlciBjb25jYXRlbmF0aW9uIHNjcmlwdCB0aGF0XG4gIC8vIHVuZGVyc3RhbmRzIGFub255bW91cyBBTUQgbW9kdWxlcy4gQSBuYW1lZCBBTUQgaXMgc2FmZXN0IGFuZCBtb3N0IHJvYnVzdFxuICAvLyB3YXkgdG8gcmVnaXN0ZXIuIExvd2VyY2FzZSBob29kaWUgaXMgdXNlZCBiZWNhdXNlIEFNRCBtb2R1bGUgbmFtZXMgYXJlXG4gIC8vIGRlcml2ZWQgZnJvbSBmaWxlIG5hbWVzLCBhbmQgSG9vZGllIGlzIG5vcm1hbGx5IGRlbGl2ZXJlZCBpbiBhIGxvd2VyY2FzZVxuICAvLyBmaWxlIG5hbWUuXG4gIGRlZmluZShmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEhvb2RpZTtcbiAgfSk7XG5cbn0gZWxzZSB7XG5cbiAgLy8gc2V0IGdsb2JhbFxuICBnbG9iYWwuSG9vZGllID0gSG9vZGllO1xufVxuIiwiLy8gSG9vZGllLkFjY291bnRcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIGhvb2RpZUV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVBY2NvdW50IChob29kaWUpIHtcbiAgLy8gcHVibGljIEFQSVxuICB2YXIgYWNjb3VudCA9IHt9O1xuXG4gIC8vIGZsYWcgd2hldGhlciB1c2VyIGlzIGN1cnJlbnRseSBhdXRoZW50aWNhdGVkIG9yIG5vdFxuICB2YXIgYXV0aGVudGljYXRlZDtcblxuICAvLyBjYWNoZSBmb3IgQ291Y2hEQiBfdXNlcnMgZG9jXG4gIHZhciB1c2VyRG9jID0ge307XG5cbiAgLy8gbWFwIG9mIHJlcXVlc3RQcm9taXNlcy4gV2UgbWFpbnRhaW4gdGhpcyBsaXN0IHRvIGF2b2lkIHNlbmRpbmdcbiAgLy8gdGhlIHNhbWUgcmVxdWVzdHMgc2V2ZXJhbCB0aW1lcy5cbiAgdmFyIHJlcXVlc3RzID0ge307XG5cbiAgLy8gZGVmYXVsdCBjb3VjaERCIHVzZXIgZG9jIHByZWZpeFxuICB2YXIgdXNlckRvY1ByZWZpeCA9ICdvcmcuY291Y2hkYi51c2VyJztcblxuICAvLyBhZGQgZXZlbnRzIEFQSVxuICBob29kaWVFdmVudHMoaG9vZGllLCB7IGNvbnRleHQ6IGFjY291bnQsIG5hbWVzcGFjZTogJ2FjY291bnQnfSk7XG5cbiAgLy8gQXV0aGVudGljYXRlXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVXNlIHRoaXMgbWV0aG9kIHRvIGFzc3VyZSB0aGF0IHRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQ6XG4gIC8vIGBob29kaWUuYWNjb3VudC5hdXRoZW50aWNhdGUoKS5kb25lKCBkb1NvbWV0aGluZyApLmZhaWwoIGhhbmRsZUVycm9yIClgXG4gIC8vXG4gIGFjY291bnQuYXV0aGVudGljYXRlID0gZnVuY3Rpb24gYXV0aGVudGljYXRlKCkge1xuICAgIHZhciBzZW5kQW5kSGFuZGxlQXV0aFJlcXVlc3Q7XG5cbiAgICAvLyBhbHJlYWR5IHRyaWVkIHRvIGF1dGhlbnRpY2F0ZSwgYW5kIGZhaWxlZFxuICAgIGlmIChhdXRoZW50aWNhdGVkID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3QoKTtcbiAgICB9XG5cbiAgICAvLyBhbHJlYWR5IHRyaWVkIHRvIGF1dGhlbnRpY2F0ZSwgYW5kIHN1Y2NlZWRlZFxuICAgIGlmIChhdXRoZW50aWNhdGVkID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlc29sdmVXaXRoKGFjY291bnQudXNlcm5hbWUpO1xuICAgIH1cblxuICAgIC8vIGlmIHRoZXJlIGlzIGEgcGVuZGluZyBzaWduT3V0IHJlcXVlc3QsIHJldHVybiBpdHMgcHJvbWlzZSxcbiAgICAvLyBidXQgcGlwZSBpdCBzbyB0aGF0IGl0IGFsd2F5cyBlbmRzIHVwIHJlamVjdGVkXG4gICAgLy9cbiAgICBpZiAocmVxdWVzdHMuc2lnbk91dCAmJiByZXF1ZXN0cy5zaWduT3V0LnN0YXRlKCkgPT09ICdwZW5kaW5nJykge1xuICAgICAgcmV0dXJuIHJlcXVlc3RzLnNpZ25PdXQudGhlbihob29kaWUucmVqZWN0KTtcbiAgICB9XG5cbiAgICAvLyBpZiB0aGVyZSBpcyBhIHBlbmRpbmcgc2lnbkluIHJlcXVlc3QsIHJldHVybiBpdHMgcHJvbWlzZVxuICAgIC8vXG4gICAgaWYgKHJlcXVlc3RzLnNpZ25JbiAmJiByZXF1ZXN0cy5zaWduSW4uc3RhdGUoKSA9PT0gJ3BlbmRpbmcnKSB7XG4gICAgICByZXR1cm4gcmVxdWVzdHMuc2lnbkluO1xuICAgIH1cblxuICAgIC8vIGlmIHVzZXIgaGFzIG5vIGFjY291bnQsIG1ha2Ugc3VyZSB0byBlbmQgdGhlIHNlc3Npb25cbiAgICBpZiAoISBhY2NvdW50Lmhhc0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIHNlbmRTaWduT3V0UmVxdWVzdCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3QoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHNlbmQgcmVxdWVzdCB0byBjaGVjayBmb3Igc2Vzc2lvbiBzdGF0dXMuIElmIHRoZXJlIGlzIGFcbiAgICAvLyBwZW5kaW5nIHJlcXVlc3QgYWxyZWFkeSwgcmV0dXJuIGl0cyBwcm9taXNlLlxuICAgIC8vXG4gICAgc2VuZEFuZEhhbmRsZUF1dGhSZXF1ZXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5yZXF1ZXN0KCdHRVQnLCAnL19zZXNzaW9uJykudGhlbihcbiAgICAgICAgaGFuZGxlQXV0aGVudGljYXRlUmVxdWVzdFN1Y2Nlc3NcbiAgICAgICk7XG4gICAgfTtcblxuICAgIHJldHVybiB3aXRoU2luZ2xlUmVxdWVzdCgnYXV0aGVudGljYXRlJywgc2VuZEFuZEhhbmRsZUF1dGhSZXF1ZXN0KTtcbiAgfTtcblxuXG4gIC8vIGhhc1ZhbGlkU2Vzc2lvblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXNlciBpcyBjdXJyZW50bHkgc2lnbmVkIGJ1dCBoYXMgbm8gdmFsaWQgc2Vzc2lvbixcbiAgLy8gbWVhbmluZyB0aGF0IHRoZSBkYXRhIGNhbm5vdCBiZSBzeW5jaHJvbml6ZWQuXG4gIC8vXG4gIGFjY291bnQuaGFzVmFsaWRTZXNzaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEgYWNjb3VudC5oYXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXV0aGVudGljYXRlZCA9PT0gdHJ1ZTtcbiAgfTtcblxuXG4gIC8vIGhhc0ludmFsaWRTZXNzaW9uXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmV0dXJucyB0cnVlIGlmIHRoZSB1c2VyIGlzIGN1cnJlbnRseSBzaWduZWQgYnV0IGhhcyBubyB2YWxpZCBzZXNzaW9uLFxuICAvLyBtZWFuaW5nIHRoYXQgdGhlIGRhdGEgY2Fubm90IGJlIHN5bmNocm9uaXplZC5cbiAgLy9cbiAgYWNjb3VudC5oYXNJbnZhbGlkU2Vzc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghIGFjY291bnQuaGFzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF1dGhlbnRpY2F0ZWQgPT09IGZhbHNlO1xuICB9O1xuXG5cbiAgLy8gc2lnbiB1cCB3aXRoIHVzZXJuYW1lICYgcGFzc3dvcmRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHVzZXMgc3RhbmRhcmQgQ291Y2hEQiBBUEkgdG8gY3JlYXRlIGEgbmV3IGRvY3VtZW50IGluIF91c2VycyBkYi5cbiAgLy8gVGhlIGJhY2tlbmQgd2lsbCBhdXRvbWF0aWNhbGx5IGNyZWF0ZSBhIHVzZXJEQiBiYXNlZCBvbiB0aGUgdXNlcm5hbWVcbiAgLy8gYWRkcmVzcyBhbmQgYXBwcm92ZSB0aGUgYWNjb3VudCBieSBhZGRpbmcgYSAnY29uZmlybWVkJyByb2xlIHRvIHRoZVxuICAvLyB1c2VyIGRvYy4gVGhlIGFjY291bnQgY29uZmlybWF0aW9uIG1pZ2h0IHRha2UgYSB3aGlsZSwgc28gd2Uga2VlcCB0cnlpbmdcbiAgLy8gdG8gc2lnbiBpbiB3aXRoIGEgMzAwbXMgdGltZW91dC5cbiAgLy9cbiAgYWNjb3VudC5zaWduVXAgPSBmdW5jdGlvbiBzaWduVXAodXNlcm5hbWUsIHBhc3N3b3JkKSB7XG5cbiAgICBpZiAocGFzc3dvcmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcGFzc3dvcmQgPSAnJztcbiAgICB9XG5cbiAgICBpZiAoIXVzZXJuYW1lKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoJ1VzZXJuYW1lIG11c3QgYmUgc2V0LicpO1xuICAgIH1cblxuICAgIGlmIChhY2NvdW50Lmhhc0Fub255bW91c0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIHVwZ3JhZGVBbm9ueW1vdXNBY2NvdW50KHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgfVxuXG4gICAgaWYgKGFjY291bnQuaGFzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoJ011c3Qgc2lnbiBvdXQgZmlyc3QuJyk7XG4gICAgfVxuXG4gICAgLy8gZG93bmNhc2UgdXNlcm5hbWVcbiAgICB1c2VybmFtZSA9IHVzZXJuYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgX2lkOiB1c2VyRG9jS2V5KHVzZXJuYW1lKSxcbiAgICAgICAgbmFtZTogdXNlclR5cGVBbmRJZCh1c2VybmFtZSksXG4gICAgICAgIHR5cGU6ICd1c2VyJyxcbiAgICAgICAgcm9sZXM6IFtdLFxuICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gICAgICAgIG93bmVySGFzaDogYWNjb3VudC5vd25lckhhc2gsXG4gICAgICAgIGRhdGFiYXNlOiBhY2NvdW50LmRiKCksXG4gICAgICAgIHVwZGF0ZWRBdDogbm93KCksXG4gICAgICAgIGNyZWF0ZWRBdDogbm93KCksXG4gICAgICAgIHNpZ25lZFVwQXQ6IHVzZXJuYW1lICE9PSBhY2NvdW50Lm93bmVySGFzaCA/IG5vdygpIDogdm9pZCAwXG4gICAgICB9KSxcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9O1xuXG4gICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnUFVUJywgdXNlckRvY1VybCh1c2VybmFtZSksIG9wdGlvbnMpLnRoZW4oXG4gICAgICBoYW5kbGVTaWduVXBTdWNjZXNzKHVzZXJuYW1lLCBwYXNzd29yZCksXG4gICAgICBoYW5kbGVTaWduVXBFcnJvcih1c2VybmFtZSlcbiAgICApO1xuICB9O1xuXG5cbiAgLy8gYW5vbnltb3VzIHNpZ24gdXBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIElmIHRoZSB1c2VyIGRpZCBub3Qgc2lnbiB1cCBoaW1zZWxmIHlldCwgYnV0IGRhdGEgbmVlZHMgdG8gYmUgdHJhbnNmZXJlZFxuICAvLyB0byB0aGUgY291Y2gsIGUuZy4gdG8gc2VuZCBhbiBlbWFpbCBvciB0byBzaGFyZSBkYXRhLCB0aGUgYW5vbnltb3VzU2lnblVwXG4gIC8vIG1ldGhvZCBjYW4gYmUgdXNlZC4gSXQgZ2VuZXJhdGVzIGEgcmFuZG9tIHBhc3N3b3JkIGFuZCBzdG9yZXMgaXQgbG9jYWxseVxuICAvLyBpbiB0aGUgYnJvd3Nlci5cbiAgLy9cbiAgLy8gSWYgdGhlIHVzZXIgc2lnbmVzIHVwIGZvciByZWFsIGxhdGVyLCB3ZSAndXBncmFkZScgaGlzIGFjY291bnQsIG1lYW5pbmcgd2VcbiAgLy8gY2hhbmdlIGhpcyB1c2VybmFtZSBhbmQgcGFzc3dvcmQgaW50ZXJuYWxseSBpbnN0ZWFkIG9mIGNyZWF0aW5nIGFub3RoZXIgdXNlci5cbiAgLy9cbiAgYWNjb3VudC5hbm9ueW1vdXNTaWduVXAgPSBmdW5jdGlvbiBhbm9ueW1vdXNTaWduVXAoKSB7XG4gICAgdmFyIHBhc3N3b3JkLCB1c2VybmFtZTtcblxuICAgIHBhc3N3b3JkID0gaG9vZGllLmdlbmVyYXRlSWQoMTApO1xuICAgIHVzZXJuYW1lID0gYWNjb3VudC5vd25lckhhc2g7XG5cbiAgICByZXR1cm4gYWNjb3VudC5zaWduVXAodXNlcm5hbWUsIHBhc3N3b3JkKS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgc2V0QW5vbnltb3VzUGFzc3dvcmQocGFzc3dvcmQpO1xuICAgICAgcmV0dXJuIGFjY291bnQudHJpZ2dlcignc2lnbnVwOmFub255bW91cycsIHVzZXJuYW1lKTtcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIGhhc0FjY291bnRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgYWNjb3VudC5oYXNBY2NvdW50ID0gZnVuY3Rpb24gaGFzQWNjb3VudCgpIHtcbiAgICByZXR1cm4gISFhY2NvdW50LnVzZXJuYW1lO1xuICB9O1xuXG5cbiAgLy8gaGFzQW5vbnltb3VzQWNjb3VudFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBhbm9ueW1vdXMgYWNjb3VudHMgZ2V0IGNyZWF0ZWQgd2hlbiBkYXRhIG5lZWRzIHRvIGJlXG4gIC8vIHN5bmNlZCB3aXRob3V0IHRoZSB1c2VyIGhhdmluZyBhbiBhY2NvdW50LiBUaGF0IGhhcHBlbnNcbiAgLy8gYXV0b21hdGljYWxseSB3aGVuIHRoZSB1c2VyIGNyZWF0ZXMgYSB0YXNrLCBidXQgY2FuIGFsc29cbiAgLy8gYmUgZG9uZSBtYW51YWxseSB1c2luZyBob29kaWUuYWNjb3VudC5hbm9ueW1vdXNTaWduVXAoKSxcbiAgLy8gZS5nLiB0byBwcmV2ZW50IGRhdGEgbG9zcy5cbiAgLy9cbiAgLy8gVG8gZGV0ZXJtaW5lIGJldHdlZW4gYW5vbnltb3VzIGFuZCBcInJlYWxcIiBhY2NvdW50cywgd2VcbiAgLy8gY2FuIGNvbXBhcmUgdGhlIHVzZXJuYW1lIHRvIHRoZSBvd25lckhhc2gsIHdoaWNoIGlzIHRoZVxuICAvLyBzYW1lIGZvciBhbm9ueW1vdXMgYWNjb3VudHMuXG4gIGFjY291bnQuaGFzQW5vbnltb3VzQWNjb3VudCA9IGZ1bmN0aW9uIGhhc0Fub255bW91c0FjY291bnQoKSB7XG4gICAgcmV0dXJuIGFjY291bnQudXNlcm5hbWUgPT09IGFjY291bnQub3duZXJIYXNoO1xuICB9O1xuXG5cbiAgLy8gc2V0IC8gZ2V0IC8gcmVtb3ZlIGFub255bW91cyBwYXNzd29yZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvL1xuICB2YXIgYW5vbnltb3VzUGFzc3dvcmRLZXkgPSAnX2FjY291bnQuYW5vbnltb3VzUGFzc3dvcmQnO1xuXG4gIGZ1bmN0aW9uIHNldEFub255bW91c1Bhc3N3b3JkKHBhc3N3b3JkKSB7XG4gICAgcmV0dXJuIGhvb2RpZS5jb25maWcuc2V0KGFub255bW91c1Bhc3N3b3JkS2V5LCBwYXNzd29yZCk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRBbm9ueW1vdXNQYXNzd29yZCgpIHtcbiAgICByZXR1cm4gaG9vZGllLmNvbmZpZy5nZXQoYW5vbnltb3VzUGFzc3dvcmRLZXkpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlQW5vbnltb3VzUGFzc3dvcmQoKSB7XG4gICAgcmV0dXJuIGhvb2RpZS5jb25maWcudW5zZXQoYW5vbnltb3VzUGFzc3dvcmRLZXkpO1xuICB9XG5cblxuICAvLyBzaWduIGluIHdpdGggdXNlcm5hbWUgJiBwYXNzd29yZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gdXNlcyBzdGFuZGFyZCBDb3VjaERCIEFQSSB0byBjcmVhdGUgYSBuZXcgdXNlciBzZXNzaW9uIChQT1NUIC9fc2Vzc2lvbikuXG4gIC8vIEJlc2lkZXMgdGhlIHN0YW5kYXJkIHNpZ24gaW4gd2UgYWxzbyBjaGVjayBpZiB0aGUgYWNjb3VudCBoYXMgYmVlbiBjb25maXJtZWRcbiAgLy8gKHJvbGVzIGluY2x1ZGUgJ2NvbmZpcm1lZCcgcm9sZSkuXG4gIC8vXG4gIC8vIFdoZW4gc2lnbmluZyBpbiwgYnkgZGVmYXVsdCBhbGwgbG9jYWwgZGF0YSBnZXRzIGNsZWFyZWQgYmVmb3JlaGFuZCAod2l0aCBhIHNpZ25PdXQpLlxuICAvLyBPdGhlcndpc2UgZGF0YSB0aGF0IGhhcyBiZWVuIGNyZWF0ZWQgYmVmb3JlaGFuZCAoYXV0aGVudGljYXRlZCB3aXRoIGFub3RoZXIgdXNlclxuICAvLyBhY2NvdW50IG9yIGFub255bW91c2x5KSB3b3VsZCBiZSBtZXJnZWQgaW50byB0aGUgdXNlciBhY2NvdW50IHRoYXQgc2lnbnMgaW4uXG4gIC8vIFRoYXQgYXBwbGllcyBvbmx5IGlmIHVzZXJuYW1lIGlzbid0IHRoZSBzYW1lIGFzIGN1cnJlbnQgdXNlcm5hbWUuXG4gIC8vXG4gIC8vIFRvIHByZXZlbnQgZGF0YSBsb3NzLCBzaWduSW4gY2FuIGJlIGNhbGxlZCB3aXRoIG9wdGlvbnMubW92ZURhdGEgPSB0cnVlLCB0aGF0IHdsbFxuICAvLyBtb3ZlIGFsbCBkYXRhIGZyb20gdGhlIGFub255bW91cyBhY2NvdW50IHRvIHRoZSBhY2NvdW50IHRoZSB1c2VyIHNpZ25lZCBpbnRvLlxuICAvL1xuICBhY2NvdW50LnNpZ25JbiA9IGZ1bmN0aW9uIHNpZ25Jbih1c2VybmFtZSwgcGFzc3dvcmQsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2lnbk91dEFuZFNpZ25JbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFjY291bnQuc2lnbk91dCh7XG4gICAgICAgIHNpbGVudDogdHJ1ZVxuICAgICAgfSkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNlbmRTaWduSW5SZXF1ZXN0KHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHZhciBjdXJyZW50RGF0YTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKHVzZXJuYW1lID09PSBudWxsKSB7XG4gICAgICB1c2VybmFtZSA9ICcnO1xuICAgIH1cblxuICAgIGlmIChwYXNzd29yZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBwYXNzd29yZCA9ICcnO1xuICAgIH1cblxuICAgIC8vIGRvd25jYXNlXG4gICAgdXNlcm5hbWUgPSB1c2VybmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgaWYgKHVzZXJuYW1lICE9PSBhY2NvdW50LnVzZXJuYW1lKSB7XG4gICAgICBpZiAoISBvcHRpb25zLm1vdmVEYXRhKSB7XG4gICAgICAgIHJldHVybiBzaWduT3V0QW5kU2lnbkluKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBob29kaWUuc3RvcmUuZmluZEFsbCgpXG4gICAgICAudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGN1cnJlbnREYXRhID0gZGF0YTtcbiAgICAgIH0pXG4gICAgICAudGhlbihzaWduT3V0QW5kU2lnbkluKVxuICAgICAgLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnJlbnREYXRhLmZvckVhY2goZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICAgICAgdmFyIHR5cGUgPSBvYmplY3QudHlwZTtcblxuICAgICAgICAgIC8vIGlnbm9yZSB0aGUgYWNjb3VudCBzZXR0aW5nc1xuICAgICAgICAgIGlmICh0eXBlID09PSAnJGNvbmZpZycgJiYgb2JqZWN0LmlkID09PSAnaG9vZGllJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGRlbGV0ZSBvYmplY3QudHlwZTtcbiAgICAgICAgICBvYmplY3QuY3JlYXRlZEJ5ID0gaG9vZGllLmFjY291bnQub3duZXJIYXNoO1xuICAgICAgICAgIGhvb2RpZS5zdG9yZS5hZGQodHlwZSwgb2JqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2VuZFNpZ25JblJlcXVlc3QodXNlcm5hbWUsIHBhc3N3b3JkLCB7XG4gICAgICAgIHJlYXV0aGVudGljYXRlZDogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gc2lnbiBvdXRcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gdXNlcyBzdGFuZGFyZCBDb3VjaERCIEFQSSB0byBpbnZhbGlkYXRlIGEgdXNlciBzZXNzaW9uIChERUxFVEUgL19zZXNzaW9uKVxuICAvL1xuICBhY2NvdW50LnNpZ25PdXQgPSBmdW5jdGlvbiBzaWduT3V0KG9wdGlvbnMpIHtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKCFhY2NvdW50Lmhhc0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIGNsZWFudXAoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB7XG4gICAgICAgICAgcmV0dXJuIGFjY291bnQudHJpZ2dlcignc2lnbm91dCcpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHVzaExvY2FsQ2hhbmdlcyhvcHRpb25zKVxuICAgIC50aGVuKGhvb2RpZS5yZW1vdGUuZGlzY29ubmVjdClcbiAgICAudGhlbihzZW5kU2lnbk91dFJlcXVlc3QpXG4gICAgLnRoZW4oY2xlYW51cEFuZFRyaWdnZXJTaWduT3V0KTtcbiAgfTtcblxuXG4gIC8vIFJlcXVlc3RcbiAgLy8gLS0tXG5cbiAgLy8gc2hvcnRjdXQgZm9yIGBob29kaWUucmVxdWVzdGBcbiAgLy9cbiAgYWNjb3VudC5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdCh0eXBlLCBwYXRoLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgcmV0dXJuIGhvb2RpZS5yZXF1ZXN0LmFwcGx5KGhvb2RpZSwgYXJndW1lbnRzKTtcbiAgfTtcblxuXG4gIC8vIGRiXG4gIC8vIC0tLS1cblxuICAvLyByZXR1cm4gbmFtZSBvZiBkYlxuICAvL1xuICBhY2NvdW50LmRiID0gZnVuY3Rpb24gZGIoKSB7XG4gICAgcmV0dXJuICd1c2VyLycgKyBhY2NvdW50Lm93bmVySGFzaDtcbiAgfTtcblxuXG4gIC8vIGZldGNoXG4gIC8vIC0tLS0tLS1cblxuICAvLyBmZXRjaGVzIF91c2VycyBkb2MgZnJvbSBDb3VjaERCIGFuZCBjYWNoZXMgaXQgaW4gX2RvY1xuICAvL1xuICBhY2NvdW50LmZldGNoID0gZnVuY3Rpb24gZmV0Y2godXNlcm5hbWUpIHtcblxuICAgIGlmICh1c2VybmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB1c2VybmFtZSA9IGFjY291bnQudXNlcm5hbWU7XG4gICAgfVxuXG4gICAgaWYgKCF1c2VybmFtZSkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKHtcbiAgICAgICAgbmFtZTogJ0hvb2RpZVVuYXV0aG9yaXplZEVycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ05vdCBzaWduZWQgaW4nXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gd2l0aFNpbmdsZVJlcXVlc3QoJ2ZldGNoJywgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5yZXF1ZXN0KCdHRVQnLCB1c2VyRG9jVXJsKHVzZXJuYW1lKSkuZG9uZShmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB1c2VyRG9jID0gcmVzcG9uc2U7XG4gICAgICAgIHJldHVybiB1c2VyRG9jO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyBjaGFuZ2UgcGFzc3dvcmRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBOb3RlOiB0aGUgaG9vZGllIEFQSSByZXF1aXJlcyB0aGUgY3VycmVudFBhc3N3b3JkIGZvciBzZWN1cml0eSByZWFzb25zLFxuICAvLyBidXQgY291Y2hEYiBkb2Vzbid0IHJlcXVpcmUgaXQgZm9yIGEgcGFzc3dvcmQgY2hhbmdlLCBzbyBpdCdzIGlnbm9yZWRcbiAgLy8gaW4gdGhpcyBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgaG9vZGllIEFQSS5cbiAgLy9cbiAgYWNjb3VudC5jaGFuZ2VQYXNzd29yZCA9IGZ1bmN0aW9uIGNoYW5nZVBhc3N3b3JkKGN1cnJlbnRQYXNzd29yZCwgbmV3UGFzc3dvcmQpIHtcblxuICAgIGlmICghYWNjb3VudC51c2VybmFtZSkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKHtcbiAgICAgICAgbmFtZTogJ0hvb2RpZVVuYXV0aG9yaXplZEVycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ05vdCBzaWduZWQgaW4nXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBob29kaWUucmVtb3RlLmRpc2Nvbm5lY3QoKTtcblxuICAgIHJldHVybiBhY2NvdW50LmZldGNoKCkudGhlbihcbiAgICAgIHNlbmRDaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkUmVxdWVzdChjdXJyZW50UGFzc3dvcmQsIG51bGwsIG5ld1Bhc3N3b3JkKVxuICAgICk7XG4gIH07XG5cblxuICAvLyByZXNldCBwYXNzd29yZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhpcyBpcyBraW5kIG9mIGEgaGFjay4gV2UgbmVlZCB0byBjcmVhdGUgYW4gb2JqZWN0IGFub255bW91c2x5XG4gIC8vIHRoYXQgaXMgbm90IGV4cG9zZWQgdG8gb3RoZXJzLiBUaGUgb25seSBDb3VjaERCIEFQSSBvdGhlcmluZyBzdWNoXG4gIC8vIGZ1bmN0aW9uYWxpdHkgaXMgdGhlIF91c2VycyBkYXRhYmFzZS5cbiAgLy9cbiAgLy8gU28gd2UgYWN0dWFseSBzaWduIHVwIGEgbmV3IGNvdWNoREIgdXNlciB3aXRoIHNvbWUgc3BlY2lhbCBhdHRyaWJ1dGVzLlxuICAvLyBJdCB3aWxsIGJlIHBpY2tlZCB1cCBieSB0aGUgcGFzc3dvcmQgcmVzZXQgd29ya2VyIGFuZCByZW1vdmVlZFxuICAvLyBvbmNlIHRoZSBwYXNzd29yZCB3YXMgcmVzZXR0ZWQuXG4gIC8vXG4gIGFjY291bnQucmVzZXRQYXNzd29yZCA9IGZ1bmN0aW9uIHJlc2V0UGFzc3dvcmQodXNlcm5hbWUpIHtcbiAgICB2YXIgZGF0YSwga2V5LCBvcHRpb25zLCByZXNldFBhc3N3b3JkSWQ7XG5cbiAgICByZXNldFBhc3N3b3JkSWQgPSBob29kaWUuY29uZmlnLmdldCgnX2FjY291bnQucmVzZXRQYXNzd29yZElkJyk7XG5cbiAgICBpZiAocmVzZXRQYXNzd29yZElkKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5jaGVja1Bhc3N3b3JkUmVzZXQoKTtcbiAgICB9XG5cbiAgICByZXNldFBhc3N3b3JkSWQgPSAnJyArIHVzZXJuYW1lICsgJy8nICsgKGhvb2RpZS5nZW5lcmF0ZUlkKCkpO1xuXG4gICAgaG9vZGllLmNvbmZpZy5zZXQoJ19hY2NvdW50LnJlc2V0UGFzc3dvcmRJZCcsIHJlc2V0UGFzc3dvcmRJZCk7XG5cbiAgICBrZXkgPSAnJyArIHVzZXJEb2NQcmVmaXggKyAnOiRwYXNzd29yZFJlc2V0LycgKyByZXNldFBhc3N3b3JkSWQ7XG5cbiAgICBkYXRhID0ge1xuICAgICAgX2lkOiBrZXksXG4gICAgICBuYW1lOiAnJHBhc3N3b3JkUmVzZXQvJyArIHJlc2V0UGFzc3dvcmRJZCxcbiAgICAgIHR5cGU6ICd1c2VyJyxcbiAgICAgIHJvbGVzOiBbXSxcbiAgICAgIHBhc3N3b3JkOiByZXNldFBhc3N3b3JkSWQsXG4gICAgICBjcmVhdGVkQXQ6IG5vdygpLFxuICAgICAgdXBkYXRlZEF0OiBub3coKVxuICAgIH07XG5cbiAgICBvcHRpb25zID0ge1xuICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfTtcblxuICAgIC8vIFRPRE86IHNwZWMgdGhhdCBjaGVja1Bhc3N3b3JkUmVzZXQgZ2V0cyBleGVjdXRlZFxuICAgIHJldHVybiB3aXRoUHJldmlvdXNSZXF1ZXN0c0Fib3J0ZWQoJ3Jlc2V0UGFzc3dvcmQnLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhY2NvdW50LnJlcXVlc3QoJ1BVVCcsICcvX3VzZXJzLycgKyAoZW5jb2RlVVJJQ29tcG9uZW50KGtleSkpLCBvcHRpb25zKS5kb25lKCBhY2NvdW50LmNoZWNrUGFzc3dvcmRSZXNldCApXG4gICAgICAudGhlbiggYXdhaXRQYXNzd29yZFJlc2V0UmVzdWx0ICk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gY2hlY2tQYXNzd29yZFJlc2V0XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGNoZWNrIGZvciB0aGUgc3RhdHVzIG9mIGEgcGFzc3dvcmQgcmVzZXQuIEl0IG1pZ2h0IHRha2VcbiAgLy8gYSB3aGlsZSB1bnRpbCB0aGUgcGFzc3dvcmQgcmVzZXQgd29ya2VyIHBpY2tzIHVwIHRoZSBqb2JcbiAgLy8gYW5kIHVwZGF0ZXMgaXRcbiAgLy9cbiAgLy8gSWYgYSBwYXNzd29yZCByZXNldCByZXF1ZXN0IHdhcyBzdWNjZXNzZnVsLCB0aGUgJHBhc3N3b3JkUmVxdWVzdFxuICAvLyBkb2MgZ2V0cyByZW1vdmVkIGZyb20gX3VzZXJzIGJ5IHRoZSB3b3JrZXIsIHRoZXJlZm9yZSBhIDQwMSBpc1xuICAvLyB3aGF0IHdlIGFyZSB3YWl0aW5nIGZvci5cbiAgLy9cbiAgLy8gT25jZSBjYWxsZWQsIGl0IGNvbnRpbnVlcyB0byByZXF1ZXN0IHRoZSBzdGF0dXMgdXBkYXRlIHdpdGggYVxuICAvLyBvbmUgc2Vjb25kIHRpbWVvdXQuXG4gIC8vXG4gIGFjY291bnQuY2hlY2tQYXNzd29yZFJlc2V0ID0gZnVuY3Rpb24gY2hlY2tQYXNzd29yZFJlc2V0KCkge1xuICAgIHZhciBoYXNoLCBvcHRpb25zLCByZXNldFBhc3N3b3JkSWQsIHVybCwgdXNlcm5hbWU7XG5cbiAgICAvLyByZWplY3QgaWYgdGhlcmUgaXMgbm8gcGVuZGluZyBwYXNzd29yZCByZXNldCByZXF1ZXN0XG4gICAgcmVzZXRQYXNzd29yZElkID0gaG9vZGllLmNvbmZpZy5nZXQoJ19hY2NvdW50LnJlc2V0UGFzc3dvcmRJZCcpO1xuXG4gICAgaWYgKCFyZXNldFBhc3N3b3JkSWQpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aCgnTm8gcGVuZGluZyBwYXNzd29yZCByZXNldC4nKTtcbiAgICB9XG5cbiAgICAvLyBzZW5kIHJlcXVlc3QgdG8gY2hlY2sgc3RhdHVzIG9mIHBhc3N3b3JkIHJlc2V0XG4gICAgdXNlcm5hbWUgPSAnJHBhc3N3b3JkUmVzZXQvJyArIHJlc2V0UGFzc3dvcmRJZDtcbiAgICB1cmwgPSAnL191c2Vycy8nICsgKGVuY29kZVVSSUNvbXBvbmVudCh1c2VyRG9jUHJlZml4ICsgJzonICsgdXNlcm5hbWUpKTtcbiAgICBoYXNoID0gYnRvYSh1c2VybmFtZSArICc6JyArIHJlc2V0UGFzc3dvcmRJZCk7XG5cbiAgICBvcHRpb25zID0ge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmFzaWMgJyArIGhhc2hcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgncGFzc3dvcmRSZXNldFN0YXR1cycsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnR0VUJywgdXJsLCBvcHRpb25zKS50aGVuKFxuICAgICAgICBoYW5kbGVQYXNzd29yZFJlc2V0U3RhdHVzUmVxdWVzdFN1Y2Nlc3MsXG4gICAgICAgIGhhbmRsZVBhc3N3b3JkUmVzZXRTdGF0dXNSZXF1ZXN0RXJyb3JcbiAgICAgICkuZmFpbChmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0hvb2RpZVBlbmRpbmdFcnJvcicpIHtcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChhY2NvdW50LmNoZWNrUGFzc3dvcmRSZXNldCwgMTAwMCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2NvdW50LnRyaWdnZXIoJ3Bhc3N3b3JkcmVzZXQ6ZXJyb3InKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG5cbiAgLy8gY2hhbmdlIHVzZXJuYW1lXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gTm90ZTogdGhlIGhvb2RpZSBBUEkgcmVxdWlyZXMgdGhlIGN1cnJlbnQgcGFzc3dvcmQgZm9yIHNlY3VyaXR5IHJlYXNvbnMsXG4gIC8vIGJ1dCB0ZWNobmljYWxseSB3ZSBjYW5ub3QgKHlldCkgcHJldmVudCB0aGUgdXNlciB0byBjaGFuZ2UgdGhlIHVzZXJuYW1lXG4gIC8vIHdpdGhvdXQga25vd2luZyB0aGUgY3VycmVudCBwYXNzd29yZCwgc28gaXQncyBub3QgaW1wdWxlbWVudGVkIGluIHRoZSBjdXJyZW50XG4gIC8vIGltcGxlbWVudGF0aW9uIG9mIHRoZSBob29kaWUgQVBJLlxuICAvL1xuICAvLyBCdXQgdGhlIGN1cnJlbnQgcGFzc3dvcmQgaXMgbmVlZGVkIHRvIGxvZ2luIHdpdGggdGhlIG5ldyB1c2VybmFtZS5cbiAgLy9cbiAgYWNjb3VudC5jaGFuZ2VVc2VybmFtZSA9IGZ1bmN0aW9uIGNoYW5nZVVzZXJuYW1lKGN1cnJlbnRQYXNzd29yZCwgbmV3VXNlcm5hbWUpIHtcbiAgICBuZXdVc2VybmFtZSA9IG5ld1VzZXJuYW1lIHx8ICcnO1xuICAgIHJldHVybiBjaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkKGN1cnJlbnRQYXNzd29yZCwgbmV3VXNlcm5hbWUudG9Mb3dlckNhc2UoKSk7XG4gIH07XG5cblxuICAvLyBkZXN0cm95XG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIGRlc3Ryb3lzIGEgdXNlcidzIGFjY291bnRcbiAgLy9cbiAgYWNjb3VudC5kZXN0cm95ID0gZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICBpZiAoIWFjY291bnQuaGFzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gY2xlYW51cEFuZFRyaWdnZXJTaWduT3V0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFjY291bnQuZmV0Y2goKS50aGVuKFxuICAgICAgaGFuZGxlRmV0Y2hCZWZvcmVEZXN0cm95U3VjY2VzcyxcbiAgICAgIGhhbmRsZUZldGNoQmVmb3JlRGVzdHJveUVycm9yXG4gICAgKS50aGVuKGNsZWFudXBBbmRUcmlnZ2VyU2lnbk91dCk7XG4gIH07XG5cblxuICAvL1xuICAvLyBzdWJzY3JpYmUgdG8gZXZlbnRzIGNvbWluZyBvdXRzaWRlXG4gIC8vXG4gIGZ1bmN0aW9uIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpIHtcbiAgICBob29kaWUub24oJ3JlbW90ZTplcnJvcjp1bmF1dGhlbnRpY2F0ZWQnLCByZWF1dGhlbnRpY2F0ZSk7XG4gIH1cblxuICAvLyBhbGxvdyB0byBydW4gdGhpcyBvbmNlIGZyb20gb3V0c2lkZVxuICBhY2NvdW50LnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuICAgIGRlbGV0ZSBhY2NvdW50LnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cztcbiAgfTtcblxuXG4gIC8vIFBSSVZBVEVcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gcmVhdXRoZW50aWNhdGU6IGZvcmNlIGhvb2RpZSB0byByZWF1dGhlbnRpY2F0ZVxuICBmdW5jdGlvbiByZWF1dGhlbnRpY2F0ZSAoKSB7XG4gICAgYXV0aGVudGljYXRlZCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gYWNjb3VudC5hdXRoZW50aWNhdGUoKTtcbiAgfVxuXG4gIC8vIHNldHRlcnNcbiAgZnVuY3Rpb24gc2V0VXNlcm5hbWUobmV3VXNlcm5hbWUpIHtcbiAgICBpZiAoYWNjb3VudC51c2VybmFtZSA9PT0gbmV3VXNlcm5hbWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhY2NvdW50LnVzZXJuYW1lID0gbmV3VXNlcm5hbWU7XG5cbiAgICByZXR1cm4gaG9vZGllLmNvbmZpZy5zZXQoJ19hY2NvdW50LnVzZXJuYW1lJywgbmV3VXNlcm5hbWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0T3duZXIobmV3T3duZXJIYXNoKSB7XG5cbiAgICBpZiAoYWNjb3VudC5vd25lckhhc2ggPT09IG5ld093bmVySGFzaCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGFjY291bnQub3duZXJIYXNoID0gbmV3T3duZXJIYXNoO1xuXG4gICAgLy8gYG93bmVySGFzaGAgaXMgc3RvcmVkIHdpdGggZXZlcnkgbmV3IG9iamVjdCBpbiB0aGUgY3JlYXRlZEJ5XG4gICAgLy8gYXR0cmlidXRlLiBJdCBkb2VzIG5vdCBnZXQgY2hhbmdlZCBvbmNlIGl0J3Mgc2V0LiBUaGF0J3Mgd2h5XG4gICAgLy8gd2UgaGF2ZSB0byBmb3JjZSBpdCB0byBiZSBjaGFuZ2UgZm9yIHRoZSBgJGNvbmZpZy9ob29kaWVgIG9iamVjdC5cbiAgICBob29kaWUuY29uZmlnLnNldCgnY3JlYXRlZEJ5JywgbmV3T3duZXJIYXNoKTtcblxuICAgIHJldHVybiBob29kaWUuY29uZmlnLnNldCgnX2FjY291bnQub3duZXJIYXNoJywgbmV3T3duZXJIYXNoKTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gaGFuZGxlIGEgc3VjY2Vzc2Z1bCBhdXRoZW50aWNhdGlvbiByZXF1ZXN0LlxuICAvL1xuICAvLyBBcyBsb25nIGFzIHRoZXJlIGlzIG5vIHNlcnZlciBlcnJvciBvciBpbnRlcm5ldCBjb25uZWN0aW9uIGlzc3VlLFxuICAvLyB0aGUgYXV0aGVudGljYXRlIHJlcXVlc3QgKEdFVCAvX3Nlc3Npb24pIGRvZXMgYWx3YXlzIHJldHVyblxuICAvLyBhIDIwMCBzdGF0dXMuIFRvIGRpZmZlcmVudGlhdGUgd2hldGhlciB0aGUgdXNlciBpcyBzaWduZWQgaW4gb3JcbiAgLy8gbm90LCB3ZSBjaGVjayBgdXNlckN0eC5uYW1lYCBpbiB0aGUgcmVzcG9uc2UuIElmIHRoZSB1c2VyIGlzIG5vdFxuICAvLyBzaWduZWQgaW4sIGl0J3MgbnVsbCwgb3RoZXJ3aXNlIHRoZSBuYW1lIHRoZSB1c2VyIHNpZ25lZCBpbiB3aXRoXG4gIC8vXG4gIC8vIElmIHRoZSB1c2VyIGlzIG5vdCBzaWduZWQgaW4sIHdlIGRpZmVlcmVudGlhdGUgYmV0d2VlbiB1c2VycyB0aGF0XG4gIC8vIHNpZ25lZCBpbiB3aXRoIGEgdXNlcm5hbWUgLyBwYXNzd29yZCBvciBhbm9ueW1vdXNseS4gRm9yIGFub255bW91c1xuICAvLyB1c2VycywgdGhlIHBhc3N3b3JkIGlzIHN0b3JlZCBpbiBsb2NhbCBzdG9yZSwgc28gd2UgZG9uJ3QgbmVlZFxuICAvLyB0byB0cmlnZ2VyIGFuICd1bmF1dGhlbnRpY2F0ZWQnIGVycm9yLCBidXQgaW5zdGVhZCB0cnkgdG8gc2lnbiBpbi5cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQXV0aGVudGljYXRlUmVxdWVzdFN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICBpZiAocmVzcG9uc2UudXNlckN0eC5uYW1lKSB7XG4gICAgICBhdXRoZW50aWNhdGVkID0gdHJ1ZTtcbiAgICAgIHNldFVzZXJuYW1lKHJlc3BvbnNlLnVzZXJDdHgubmFtZS5yZXBsYWNlKC9edXNlcihfYW5vbnltb3VzKT9cXC8vLCAnJykpO1xuICAgICAgc2V0T3duZXIocmVzcG9uc2UudXNlckN0eC5yb2xlc1swXSk7XG4gICAgICByZXR1cm4gaG9vZGllLnJlc29sdmVXaXRoKGFjY291bnQudXNlcm5hbWUpO1xuICAgIH1cblxuICAgIGlmIChhY2NvdW50Lmhhc0Fub255bW91c0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIGFjY291bnQuc2lnbkluKGFjY291bnQudXNlcm5hbWUsIGdldEFub255bW91c1Bhc3N3b3JkKCkpO1xuICAgIH1cblxuICAgIGF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICBhY2NvdW50LnRyaWdnZXIoJ2Vycm9yOnVuYXV0aGVudGljYXRlZCcpO1xuICAgIHJldHVybiBob29kaWUucmVqZWN0KCk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIGhhbmRsZSByZXNwb25zZSBvZiBhIHN1Y2Nlc3NmdWwgc2lnblVwIHJlcXVlc3QuXG4gIC8vIFJlc3BvbnNlIGxvb2tzIGxpa2U6XG4gIC8vXG4gIC8vICAgICB7XG4gIC8vICAgICAgICAgJ29rJzogdHJ1ZSxcbiAgLy8gICAgICAgICAnaWQnOiAnb3JnLmNvdWNoZGIudXNlcjpqb2UnLFxuICAvLyAgICAgICAgICdyZXYnOiAnMS1lODc0N2Q5YWU5Nzc2NzA2ZGE5MjgxMGIxYmFhNDI0OCdcbiAgLy8gICAgIH1cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlU2lnblVwU3VjY2Vzcyh1c2VybmFtZSwgcGFzc3dvcmQpIHtcblxuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgYWNjb3VudC50cmlnZ2VyKCdzaWdudXAnLCB1c2VybmFtZSk7XG4gICAgICB1c2VyRG9jLl9yZXYgPSByZXNwb25zZS5yZXY7XG4gICAgICByZXR1cm4gZGVsYXllZFNpZ25Jbih1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgIH07XG4gIH1cblxuICAvL1xuICAvLyBoYW5kbGUgcmVzcG9uc2Ugb2YgYSBmYWlsZWQgc2lnblVwIHJlcXVlc3QuXG4gIC8vXG4gIC8vIEluIGNhc2Ugb2YgYSBjb25mbGljdCwgcmVqZWN0IHdpdGggXCJ1c2VybmFtZSBhbHJlYWR5IGV4aXN0c1wiIGVycm9yXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE3NFxuICAvLyBFcnJvciBwYXNzZWQgZm9yIGhvb2RpZS5yZXF1ZXN0IGxvb2tzIGxpa2UgdGhpc1xuICAvL1xuICAvLyAgICAge1xuICAvLyAgICAgICAgIFwibmFtZVwiOiBcIkhvb2RpZUNvbmZsaWN0RXJyb3JcIixcbiAgLy8gICAgICAgICBcIm1lc3NhZ2VcIjogXCJPYmplY3QgYWxyZWFkeSBleGlzdHMuXCJcbiAgLy8gICAgIH1cbiAgZnVuY3Rpb24gaGFuZGxlU2lnblVwRXJyb3IodXNlcm5hbWUpIHtcblxuICAgIHJldHVybiBmdW5jdGlvbihlcnJvcikge1xuICAgICAgaWYgKGVycm9yLm5hbWUgPT09ICdIb29kaWVDb25mbGljdEVycm9yJykge1xuICAgICAgICBlcnJvci5tZXNzYWdlID0gJ1VzZXJuYW1lICcgKyB1c2VybmFtZSArICcgYWxyZWFkeSBleGlzdHMnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKGVycm9yKTtcbiAgICB9O1xuICB9XG5cblxuICAvL1xuICAvLyBhIGRlbGF5ZWQgc2lnbiBpbiBpcyB1c2VkIGFmdGVyIHNpZ24gdXAgYW5kIGFmdGVyIGFcbiAgLy8gdXNlcm5hbWUgY2hhbmdlLlxuICAvL1xuICBmdW5jdGlvbiBkZWxheWVkU2lnbkluKHVzZXJuYW1lLCBwYXNzd29yZCwgb3B0aW9ucywgZGVmZXIpIHtcblxuICAgIC8vIGRlbGF5ZWRTaWduSW4gbWlnaHQgY2FsbCBpdHNlbGYsIHdoZW4gdGhlIHVzZXIgYWNjb3VudFxuICAgIC8vIGlzIHBlbmRpbmcuIEluIHRoaXMgY2FzZSBpdCBwYXNzZXMgdGhlIG9yaWdpbmFsIGRlZmVyLFxuICAgIC8vIHRvIGtlZXAgYSByZWZlcmVuY2UgYW5kIGZpbmFsbHkgcmVzb2x2ZSAvIHJlamVjdCBpdFxuICAgIC8vIGF0IHNvbWUgcG9pbnRcbiAgICBpZiAoIWRlZmVyKSB7XG4gICAgICBkZWZlciA9IGhvb2RpZS5kZWZlcigpO1xuICAgIH1cblxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHByb21pc2UgPSBzZW5kU2lnbkluUmVxdWVzdCh1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgICAgcHJvbWlzZS5kb25lKGRlZmVyLnJlc29sdmUpO1xuICAgICAgcHJvbWlzZS5mYWlsKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvci5uYW1lID09PSAnSG9vZGllQWNjb3VudFVuY29uZmlybWVkRXJyb3InKSB7XG5cbiAgICAgICAgICAvLyBJdCBtaWdodCB0YWtlIGEgYml0IHVudGlsIHRoZSBhY2NvdW50IGhhcyBiZWVuIGNvbmZpcm1lZFxuICAgICAgICAgIGRlbGF5ZWRTaWduSW4odXNlcm5hbWUsIHBhc3N3b3JkLCBvcHRpb25zLCBkZWZlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVmZXIucmVqZWN0LmFwcGx5KGRlZmVyLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH0sIDMwMCk7XG5cbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICB9XG5cblxuICAvL1xuICAvLyBwYXJzZSBhIHN1Y2Nlc3NmdWwgc2lnbiBpbiByZXNwb25zZSBmcm9tIGNvdWNoREIuXG4gIC8vIFJlc3BvbnNlIGxvb2tzIGxpa2U6XG4gIC8vXG4gIC8vICAgICB7XG4gIC8vICAgICAgICAgJ29rJzogdHJ1ZSxcbiAgLy8gICAgICAgICAnbmFtZSc6ICd0ZXN0MScsXG4gIC8vICAgICAgICAgJ3JvbGVzJzogW1xuICAvLyAgICAgICAgICAgICAnbXZ1ODVoeScsXG4gIC8vICAgICAgICAgICAgICdjb25maXJtZWQnXG4gIC8vICAgICAgICAgXVxuICAvLyAgICAgfVxuICAvL1xuICAvLyB3ZSB3YW50IHRvIHR1cm4gaXQgaW50byAndGVzdDEnLCAnbXZ1ODVoeScgb3IgcmVqZWN0IHRoZSBwcm9taXNlXG4gIC8vIGluIGNhc2UgYW4gZXJyb3Igb2NjdXJlZCAoJ3JvbGVzJyBhcnJheSBjb250YWlucyAnZXJyb3InKVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVTaWduSW5TdWNjZXNzKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgdmFyIGRlZmVyLCB1c2VybmFtZTtcblxuICAgICAgZGVmZXIgPSBob29kaWUuZGVmZXIoKTtcbiAgICAgIHVzZXJuYW1lID0gcmVzcG9uc2UubmFtZS5yZXBsYWNlKC9edXNlcihfYW5vbnltb3VzKT9cXC8vLCAnJyk7XG5cbiAgICAgIC8vXG4gICAgICAvLyBpZiBhbiBlcnJvciBvY2N1cmVkLCB0aGUgdXNlckRCIHdvcmtlciBzdG9yZXMgaXQgdG8gdGhlICRlcnJvciBhdHRyaWJ1dGVcbiAgICAgIC8vIGFuZCBhZGRzIHRoZSAnZXJyb3InIHJvbGUgdG8gdGhlIHVzZXJzIGRvYyBvYmplY3QuIElmIHRoZSB1c2VyIGhhcyB0aGVcbiAgICAgIC8vICdlcnJvcicgcm9sZSwgd2UgbmVlZCB0byBmZXRjaCBoaXMgX3VzZXJzIGRvYyB0byBmaW5kIG91dCB3aGF0IHRoZSBlcnJvclxuICAgICAgLy8gaXMsIGJlZm9yZSB3ZSBjYW4gcmVqZWN0IHRoZSBwcm9taXNlLlxuICAgICAgLy9cbiAgICAgIGlmIChyZXNwb25zZS5yb2xlcy5pbmRleE9mKCdlcnJvcicpICE9PSAtMSkge1xuICAgICAgICBhY2NvdW50LmZldGNoKHVzZXJuYW1lKS5mYWlsKGRlZmVyLnJlamVjdCkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gZGVmZXIucmVqZWN0KHVzZXJEb2MuJGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gICAgICB9XG5cbiAgICAgIC8vXG4gICAgICAvLyBXaGVuIHRoZSB1c2VyREIgd29ya2VyIGNyZWF0ZWQgdGhlIGRhdGFiYXNlIGZvciB0aGUgdXNlciBhbmQgZXZlcnRoaW5nXG4gICAgICAvLyB3b3JrZWQgb3V0LCBpdCBhZGRzIHRoZSByb2xlICdjb25maXJtZWQnIHRvIHRoZSB1c2VyLiBJZiB0aGUgcm9sZSBpc1xuICAgICAgLy8gbm90IHByZXNlbnQgeWV0LCBpdCBtaWdodCBiZSB0aGF0IHRoZSB3b3JrZXIgZGlkbid0IHBpY2sgdXAgdGhlIHRoZVxuICAgICAgLy8gdXNlciBkb2MgeWV0LCBvciB0aGVyZSB3YXMgYW4gZXJyb3IuIEluIHRoaXMgY2FzZXMsIHdlIHJlamVjdCB0aGUgcHJvbWlzZVxuICAgICAgLy8gd2l0aCBhbiAndW5jb2Zpcm1lZCBlcnJvcidcbiAgICAgIC8vXG4gICAgICBpZiAocmVzcG9uc2Uucm9sZXMuaW5kZXhPZignY29uZmlybWVkJykgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiBkZWZlci5yZWplY3Qoe1xuICAgICAgICAgIG5hbWU6ICdIb29kaWVBY2NvdW50VW5jb25maXJtZWRFcnJvcicsXG4gICAgICAgICAgbWVzc2FnZTogJ0FjY291bnQgaGFzIG5vdCBiZWVuIGNvbmZpcm1lZCB5ZXQnXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBzZXRVc2VybmFtZSh1c2VybmFtZSk7XG4gICAgICBzZXRPd25lcihyZXNwb25zZS5yb2xlc1swXSk7XG4gICAgICBhdXRoZW50aWNhdGVkID0gdHJ1ZTtcblxuICAgICAgLy9cbiAgICAgIC8vIG9wdGlvbnMudmVyYm9zZSBpcyB0cnVlLCB3aGVuIGEgdXNlciBtYW51YWxseSBzaWduZWQgdmlhIGhvb2RpZS5hY2NvdW50LnNpZ25JbigpLlxuICAgICAgLy8gV2UgbmVlZCB0byBkaWZmZXJlbnRpYXRlIHRvIG90aGVyIHNpZ25JbiByZXF1ZXN0cywgZm9yIGV4YW1wbGUgcmlnaHQgYWZ0ZXJcbiAgICAgIC8vIHRoZSBzaWdudXAgb3IgYWZ0ZXIgYSBzZXNzaW9uIHRpbWVkIG91dC5cbiAgICAgIC8vXG4gICAgICBpZiAoIShvcHRpb25zLnNpbGVudCB8fCBvcHRpb25zLnJlYXV0aGVudGljYXRlZCkpIHtcbiAgICAgICAgaWYgKGFjY291bnQuaGFzQW5vbnltb3VzQWNjb3VudCgpKSB7XG4gICAgICAgICAgYWNjb3VudC50cmlnZ2VyKCdzaWduaW46YW5vbnltb3VzJywgdXNlcm5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFjY291bnQudHJpZ2dlcignc2lnbmluJywgdXNlcm5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHVzZXIgcmVhdXRoZW50aWNhdGVkLCBtZWFuaW5nXG4gICAgICBpZiAob3B0aW9ucy5yZWF1dGhlbnRpY2F0ZWQpIHtcbiAgICAgICAgYWNjb3VudC50cmlnZ2VyKCdyZWF1dGhlbnRpY2F0ZWQnLCB1c2VybmFtZSk7XG4gICAgICB9XG5cbiAgICAgIGFjY291bnQuZmV0Y2goKTtcbiAgICAgIHJldHVybiBkZWZlci5yZXNvbHZlKHVzZXJuYW1lLCByZXNwb25zZS5yb2xlc1swXSk7XG4gICAgfTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gSWYgdGhlIHJlcXVlc3Qgd2FzIHN1Y2Nlc3NmdWwgdGhlcmUgbWlnaHQgaGF2ZSBvY2N1cmVkIGFuXG4gIC8vIGVycm9yLCB3aGljaCB0aGUgd29ya2VyIHN0b3JlZCBpbiB0aGUgc3BlY2lhbCAkZXJyb3IgYXR0cmlidXRlLlxuICAvLyBJZiB0aGF0IGhhcHBlbnMsIHdlIHJldHVybiBhIHJlamVjdGVkIHByb21pc2Ugd2l0aCB0aGUgZXJyb3JcbiAgLy8gT3RoZXJ3aXNlIHJlamVjdCB0aGUgcHJvbWlzZSB3aXRoIGEgJ3BlbmRpbmcnIGVycm9yLFxuICAvLyBhcyB3ZSBhcmUgbm90IHdhaXRpbmcgZm9yIGEgc3VjY2VzcyBmdWxsIHJlc3BvbnNlLCBidXQgYSA0MDFcbiAgLy8gZXJyb3IsIGluZGljYXRpbmcgdGhhdCBvdXIgcGFzc3dvcmQgd2FzIGNoYW5nZWQgYW5kIG91clxuICAvLyBjdXJyZW50IHNlc3Npb24gaGFzIGJlZW4gaW52YWxpZGF0ZWRcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlUGFzc3dvcmRSZXNldFN0YXR1c1JlcXVlc3RTdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgdmFyIGVycm9yO1xuXG4gICAgaWYgKHJlc3BvbnNlLiRlcnJvcikge1xuICAgICAgZXJyb3IgPSByZXNwb25zZS4kZXJyb3I7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9yID0ge1xuICAgICAgICBuYW1lOiAnSG9vZGllUGVuZGluZ0Vycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ1Bhc3N3b3JkIHJlc2V0IGlzIHN0aWxsIHBlbmRpbmcnXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoZXJyb3IpO1xuICB9XG5cblxuICAvL1xuICAvLyBJZiB0aGUgZXJyb3IgaXMgYSA0MDEsIGl0J3MgZXhhY3RseSB3aGF0IHdlJ3ZlIGJlZW4gd2FpdGluZyBmb3IuXG4gIC8vIEluIHRoaXMgY2FzZSB3ZSByZXNvbHZlIHRoZSBwcm9taXNlLlxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVQYXNzd29yZFJlc2V0U3RhdHVzUmVxdWVzdEVycm9yKGVycm9yKSB7XG4gICAgaWYgKGVycm9yLm5hbWUgPT09ICdIb29kaWVVbmF1dGhvcml6ZWRFcnJvcicpIHtcbiAgICAgIGhvb2RpZS5jb25maWcudW5zZXQoJ19hY2NvdW50LnJlc2V0UGFzc3dvcmRJZCcpO1xuICAgICAgYWNjb3VudC50cmlnZ2VyKCdwYXNzd29yZHJlc2V0Jyk7XG5cbiAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy9cbiAgLy8gd2FpdCB1bnRpbCBhIHBhc3N3b3JkIHJlc2V0IGdldHMgZWl0aGVyIGNvbXBsZXRlZCBvciBtYXJrZWQgYXMgZmFpbGVkXG4gIC8vIGFuZCByZXNvbHZlIC8gcmVqZWN0IHJlc3BlY3RpdmVseVxuICAvL1xuICBmdW5jdGlvbiBhd2FpdFBhc3N3b3JkUmVzZXRSZXN1bHQoKSB7XG4gICAgdmFyIGRlZmVyID0gaG9vZGllLmRlZmVyKCk7XG5cbiAgICBhY2NvdW50Lm9uZSgncGFzc3dvcmRyZXNldCcsIGRlZmVyLnJlc29sdmUgKTtcbiAgICBhY2NvdW50Lm9uZSgnZXJyb3I6cGFzc3dvcmRyZXNldCcsIGRlZmVyLnJlamVjdCApO1xuXG4gICAgLy8gY2xlYW4gdXAgY2FsbGJhY2tzIHdoZW4gZWl0aGVyIGdldHMgY2FsbGVkXG4gICAgZGVmZXIuYWx3YXlzKCBmdW5jdGlvbigpIHtcbiAgICAgIGFjY291bnQudW5iaW5kKCdwYXNzd29yZHJlc2V0JywgZGVmZXIucmVzb2x2ZSApO1xuICAgICAgYWNjb3VudC51bmJpbmQoJ2Vycm9yOnBhc3N3b3JkcmVzZXQnLCBkZWZlci5yZWplY3QgKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIGNoYW5nZSB1c2VybmFtZSBhbmQgcGFzc3dvcmQgaW4gMyBzdGVwc1xuICAvL1xuICAvLyAxLiBhc3N1cmUgd2UgaGF2ZSBhIHZhbGlkIHNlc3Npb25cbiAgLy8gMi4gdXBkYXRlIF91c2VycyBkb2Mgd2l0aCBuZXcgdXNlcm5hbWUgYW5kIG5ldyBwYXNzd29yZCAoaWYgcHJvdmlkZWQpXG4gIC8vIDMuIHNpZ24gaW4gd2l0aCBuZXcgY3JlZGVudGlhbHMgdG8gY3JlYXRlIG5ldyBzZXNpb24uXG4gIC8vXG4gIGZ1bmN0aW9uIGNoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmQoY3VycmVudFBhc3N3b3JkLCBuZXdVc2VybmFtZSwgbmV3UGFzc3dvcmQpIHtcblxuICAgIHJldHVybiBzZW5kU2lnbkluUmVxdWVzdChhY2NvdW50LnVzZXJuYW1lLCBjdXJyZW50UGFzc3dvcmQsIHtcbiAgICAgIHNpbGVudDogdHJ1ZVxuICAgIH0pLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5mZXRjaCgpLnRoZW4oXG4gICAgICAgIHNlbmRDaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkUmVxdWVzdChjdXJyZW50UGFzc3dvcmQsIG5ld1VzZXJuYW1lLCBuZXdQYXNzd29yZClcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIHR1cm4gYW4gYW5vbnltb3VzIGFjY291bnQgaW50byBhIHJlYWwgYWNjb3VudFxuICAvL1xuICBmdW5jdGlvbiB1cGdyYWRlQW5vbnltb3VzQWNjb3VudCh1c2VybmFtZSwgcGFzc3dvcmQpIHtcbiAgICB2YXIgY3VycmVudFBhc3N3b3JkID0gZ2V0QW5vbnltb3VzUGFzc3dvcmQoKTtcblxuICAgIHJldHVybiBjaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkKGN1cnJlbnRQYXNzd29yZCwgdXNlcm5hbWUsIHBhc3N3b3JkKS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgYWNjb3VudC50cmlnZ2VyKCdzaWdudXAnLCB1c2VybmFtZSk7XG4gICAgICByZW1vdmVBbm9ueW1vdXNQYXNzd29yZCgpO1xuICAgIH0pO1xuICB9XG5cblxuICAvL1xuICAvLyB3ZSBub3cgY2FuIGJlIHN1cmUgdGhhdCB3ZSBmZXRjaGVkIHRoZSBsYXRlc3QgX3VzZXJzIGRvYywgc28gd2UgY2FuIHVwZGF0ZSBpdFxuICAvLyB3aXRob3V0IGEgcG90ZW50aWFsIGNvbmZsaWN0IGVycm9yLlxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVGZXRjaEJlZm9yZURlc3Ryb3lTdWNjZXNzKCkge1xuXG4gICAgaG9vZGllLnJlbW90ZS5kaXNjb25uZWN0KCk7XG4gICAgdXNlckRvYy5fZGVsZXRlZCA9IHRydWU7XG5cbiAgICByZXR1cm4gd2l0aFByZXZpb3VzUmVxdWVzdHNBYm9ydGVkKCd1cGRhdGVVc2Vyc0RvYycsIGZ1bmN0aW9uKCkge1xuICAgICAgYWNjb3VudC5yZXF1ZXN0KCdQVVQnLCB1c2VyRG9jVXJsKCksIHtcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkodXNlckRvYyksXG4gICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cblxuICAvL1xuICAvLyBkZXBlbmRlbmQgb24gd2hhdCBraW5kIG9mIGVycm9yIHdlIGdldCwgd2Ugd2FudCB0byBpZ25vcmVcbiAgLy8gaXQgb3Igbm90LlxuICAvLyBXaGVuIHdlIGdldCBhICdIb29kaWVOb3RGb3VuZEVycm9yJyBpdCBtZWFucyB0aGF0IHRoZSBfdXNlcnMgZG9jIGhhYmVcbiAgLy8gYmVlbiByZW1vdmVkIGFscmVhZHksIHNvIHdlIGRvbid0IG5lZWQgdG8gZG8gaXQgYW55bW9yZSwgYnV0XG4gIC8vIHN0aWxsIHdhbnQgdG8gZmluaXNoIHRoZSBkZXN0cm95IGxvY2FsbHksIHNvIHdlIHJldHVybiBhXG4gIC8vIHJlc29sdmVkIHByb21pc2VcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlRmV0Y2hCZWZvcmVEZXN0cm95RXJyb3IoZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0hvb2RpZU5vdEZvdW5kRXJyb3InKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlc29sdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICAvL1xuICAvLyByZW1vdmUgZXZlcnl0aGluZyBmb3JtIHRoZSBjdXJyZW50IGFjY291bnQsIHNvIGEgbmV3IGFjY291bnQgY2FuIGJlIGluaXRpYXRlZC5cbiAgLy9cbiAgZnVuY3Rpb24gY2xlYW51cChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBob29kaWUuc3RvcmUgaXMgbGlzdGVuaW5nIG9uIHRoaXMgb25lXG4gICAgYWNjb3VudC50cmlnZ2VyKCdjbGVhbnVwJyk7XG4gICAgYXV0aGVudGljYXRlZCA9IG9wdGlvbnMuYXV0aGVudGljYXRlZDtcbiAgICBob29kaWUuY29uZmlnLmNsZWFyKCk7XG4gICAgc2V0VXNlcm5hbWUob3B0aW9ucy51c2VybmFtZSk7XG4gICAgc2V0T3duZXIob3B0aW9ucy5vd25lckhhc2ggfHwgaG9vZGllLmdlbmVyYXRlSWQoKSk7XG5cbiAgICByZXR1cm4gaG9vZGllLnJlc29sdmUoKTtcbiAgfVxuXG5cbiAgLy9cbiAgZnVuY3Rpb24gY2xlYW51cEFuZFRyaWdnZXJTaWduT3V0KCkge1xuICAgIHJldHVybiBjbGVhbnVwKCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhY2NvdW50LnRyaWdnZXIoJ3NpZ25vdXQnKTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gZGVwZW5kaW5nIG9uIHdldGhlciB0aGUgdXNlciBzaWduZWRVcCBtYW51YWxseSBvciBoYXMgYmVlbiBzaWduZWQgdXBcbiAgLy8gYW5vbnltb3VzbHkgdGhlIHByZWZpeCBpbiB0aGUgQ291Y2hEQiBfdXNlcnMgZG9jIGRpZmZlcmVudGlhdGVzLlxuICAvLyBBbiBhbm9ueW1vdXMgdXNlciBpcyBjaGFyYWN0ZXJpemVkIGJ5IGl0cyB1c2VybmFtZSwgdGhhdCBlcXVhbHNcbiAgLy8gaXRzIG93bmVySGFzaCAoc2VlIGBhbm9ueW1vdXNTaWduVXBgKVxuICAvL1xuICAvLyBXZSBkaWZmZXJlbnRpYXRlIHdpdGggYGhhc0Fub255bW91c0FjY291bnQoKWAsIGJlY2F1c2UgYHVzZXJUeXBlQW5kSWRgXG4gIC8vIGlzIHVzZWQgd2l0aGluIGBzaWduVXBgIG1ldGhvZCwgc28gd2UgbmVlZCB0byBiZSBhYmxlIHRvIGRpZmZlcmVudGlhdGVcbiAgLy8gYmV0d2VlbiBhbm9ueW1vdXMgYW5kIG5vcm1hbCB1c2VycyBiZWZvcmUgYW4gYWNjb3VudCBoYXMgYmVlbiBjcmVhdGVkLlxuICAvL1xuICBmdW5jdGlvbiB1c2VyVHlwZUFuZElkKHVzZXJuYW1lKSB7XG4gICAgdmFyIHR5cGU7XG5cbiAgICBpZiAodXNlcm5hbWUgPT09IGFjY291bnQub3duZXJIYXNoKSB7XG4gICAgICB0eXBlID0gJ3VzZXJfYW5vbnltb3VzJztcbiAgICB9IGVsc2Uge1xuICAgICAgdHlwZSA9ICd1c2VyJztcbiAgICB9XG4gICAgcmV0dXJuICcnICsgdHlwZSArICcvJyArIHVzZXJuYW1lO1xuICB9XG5cblxuICAvL1xuICAvLyB0dXJuIGEgdXNlcm5hbWUgaW50byBhIHZhbGlkIF91c2VycyBkb2MuX2lkXG4gIC8vXG4gIGZ1bmN0aW9uIHVzZXJEb2NLZXkodXNlcm5hbWUpIHtcbiAgICB1c2VybmFtZSA9IHVzZXJuYW1lIHx8IGFjY291bnQudXNlcm5hbWU7XG4gICAgcmV0dXJuICcnICsgdXNlckRvY1ByZWZpeCArICc6JyArICh1c2VyVHlwZUFuZElkKHVzZXJuYW1lKSk7XG4gIH1cblxuICAvL1xuICAvLyBnZXQgVVJMIG9mIG15IF91c2VycyBkb2NcbiAgLy9cbiAgZnVuY3Rpb24gdXNlckRvY1VybCh1c2VybmFtZSkge1xuICAgIHJldHVybiAnL191c2Vycy8nICsgKGVuY29kZVVSSUNvbXBvbmVudCh1c2VyRG9jS2V5KHVzZXJuYW1lKSkpO1xuICB9XG5cblxuICAvL1xuICAvLyB1cGRhdGUgbXkgX3VzZXJzIGRvYy5cbiAgLy9cbiAgLy8gSWYgYSBuZXcgdXNlcm5hbWUgaGFzIGJlZW4gcGFzc2VkLCB3ZSBzZXQgdGhlIHNwZWNpYWwgYXR0cmlidXQgJG5ld1VzZXJuYW1lLlxuICAvLyBUaGlzIHdpbGwgbGV0IHRoZSB1c2VybmFtZSBjaGFuZ2Ugd29ya2VyIGNyZWF0ZSBjcmVhdGUgYSBuZXcgX3VzZXJzIGRvYyBmb3JcbiAgLy8gdGhlIG5ldyB1c2VybmFtZSBhbmQgcmVtb3ZlIHRoZSBjdXJyZW50IG9uZVxuICAvL1xuICAvLyBJZiBhIG5ldyBwYXNzd29yZCBoYXMgYmVlbiBwYXNzZWQsIHNhbHQgYW5kIHBhc3N3b3JkX3NoYSBnZXQgcmVtb3ZlZFxuICAvLyBmcm9tIF91c2VycyBkb2MgYW5kIGFkZCB0aGUgcGFzc3dvcmQgaW4gY2xlYXIgdGV4dC4gQ291Y2hEQiB3aWxsIHJlcGxhY2UgaXQgd2l0aFxuICAvLyBhY2NvcmRpbmcgcGFzc3dvcmRfc2hhIGFuZCBhIG5ldyBzYWx0IHNlcnZlciBzaWRlXG4gIC8vXG4gIGZ1bmN0aW9uIHNlbmRDaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkUmVxdWVzdChjdXJyZW50UGFzc3dvcmQsIG5ld1VzZXJuYW1lLCBuZXdQYXNzd29yZCkge1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgLy8gcHJlcGFyZSB1cGRhdGVkIF91c2VycyBkb2NcbiAgICAgIHZhciBkYXRhID0gZXh0ZW5kKHt9LCB1c2VyRG9jKTtcblxuICAgICAgaWYgKG5ld1VzZXJuYW1lKSB7XG4gICAgICAgIGRhdGEuJG5ld1VzZXJuYW1lID0gbmV3VXNlcm5hbWU7XG4gICAgICB9XG5cbiAgICAgIGRhdGEudXBkYXRlZEF0ID0gbm93KCk7XG4gICAgICBkYXRhLnNpZ25lZFVwQXQgPSBkYXRhLnNpZ25lZFVwQXQgfHwgbm93KCk7XG5cbiAgICAgIC8vIHRyaWdnZXIgcGFzc3dvcmQgdXBkYXRlIHdoZW4gbmV3UGFzc3dvcmQgc2V0XG4gICAgICBpZiAobmV3UGFzc3dvcmQgIT09IG51bGwpIHtcbiAgICAgICAgZGVsZXRlIGRhdGEuc2FsdDtcbiAgICAgICAgZGVsZXRlIGRhdGEucGFzc3dvcmRfc2hhO1xuICAgICAgICBkYXRhLnBhc3N3b3JkID0gbmV3UGFzc3dvcmQ7XG4gICAgICB9XG5cbiAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgndXBkYXRlVXNlcnNEb2MnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnUFVUJywgdXNlckRvY1VybCgpLCBvcHRpb25zKS50aGVuKFxuICAgICAgICAgIGhhbmRsZUNoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmRSZXF1ZXN0KG5ld1VzZXJuYW1lLCBuZXdQYXNzd29yZCB8fCBjdXJyZW50UGFzc3dvcmQpXG4gICAgICAgICk7XG4gICAgICB9KTtcblxuICAgIH07XG4gIH1cblxuXG4gIC8vXG4gIC8vIGRlcGVuZGluZyBvbiB3aGV0aGVyIGEgbmV3VXNlcm5hbWUgaGFzIGJlZW4gcGFzc2VkLCB3ZSBjYW4gc2lnbiBpbiByaWdodCBhd2F5XG4gIC8vIG9yIGhhdmUgdG8gdXNlIHRoZSBkZWxheWVkIHNpZ24gaW4gdG8gZ2l2ZSB0aGUgdXNlcm5hbWUgY2hhbmdlIHdvcmtlciBzb21lIHRpbWVcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQ2hhbmdlVXNlcm5hbWVBbmRQYXNzd29yZFJlcXVlc3QobmV3VXNlcm5hbWUsIG5ld1Bhc3N3b3JkKSB7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBob29kaWUucmVtb3RlLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgaWYgKG5ld1VzZXJuYW1lKSB7XG4gICAgICAgIHJldHVybiBkZWxheWVkU2lnbkluKG5ld1VzZXJuYW1lLCBuZXdQYXNzd29yZCwge1xuICAgICAgICAgIHNpbGVudDogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBhY2NvdW50LnNpZ25JbihhY2NvdW50LnVzZXJuYW1lLCBuZXdQYXNzd29yZCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gbWFrZSBzdXJlIHRoYXQgdGhlIHNhbWUgcmVxdWVzdCBkb2Vzbid0IGdldCBzZW50IHR3aWNlXG4gIC8vIGJ5IGNhbmNlbGxpbmcgdGhlIHByZXZpb3VzIG9uZS5cbiAgLy9cbiAgZnVuY3Rpb24gd2l0aFByZXZpb3VzUmVxdWVzdHNBYm9ydGVkKG5hbWUsIHJlcXVlc3RGdW5jdGlvbikge1xuICAgIGlmIChyZXF1ZXN0c1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZW9mIHJlcXVlc3RzW25hbWVdLmFib3J0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJlcXVlc3RzW25hbWVdLmFib3J0KCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJlcXVlc3RzW25hbWVdID0gcmVxdWVzdEZ1bmN0aW9uKCk7XG4gICAgcmV0dXJuIHJlcXVlc3RzW25hbWVdO1xuICB9XG5cblxuICAvL1xuICAvLyBpZiB0aGVyZSBpcyBhIHBlbmRpbmcgcmVxdWVzdCwgcmV0dXJuIGl0cyBwcm9taXNlIGluc3RlYWRcbiAgLy8gb2Ygc2VuZGluZyBhbm90aGVyIHJlcXVlc3RcbiAgLy9cbiAgZnVuY3Rpb24gd2l0aFNpbmdsZVJlcXVlc3QobmFtZSwgcmVxdWVzdEZ1bmN0aW9uKSB7XG5cbiAgICBpZiAocmVxdWVzdHNbbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGVvZiByZXF1ZXN0c1tuYW1lXS5zdGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAocmVxdWVzdHNbbmFtZV0uc3RhdGUoKSA9PT0gJ3BlbmRpbmcnKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcXVlc3RzW25hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVxdWVzdHNbbmFtZV0gPSByZXF1ZXN0RnVuY3Rpb24oKTtcbiAgICByZXR1cm4gcmVxdWVzdHNbbmFtZV07XG4gIH1cblxuXG4gIC8vXG4gIC8vIHB1c2ggbG9jYWwgY2hhbmdlcyB3aGVuIHVzZXIgc2lnbnMgb3V0LCB1bmxlc3MgaGUgZW5mb3JjZXMgc2lnbiBvdXRcbiAgLy8gaW4gYW55IGNhc2Ugd2l0aCBge2lnbm9yZUxvY2FsQ2hhbmdlczogdHJ1ZX1gXG4gIC8vXG4gIGZ1bmN0aW9uIHB1c2hMb2NhbENoYW5nZXMob3B0aW9ucykge1xuICAgIGlmKGhvb2RpZS5zdG9yZS5oYXNMb2NhbENoYW5nZXMoKSAmJiAhb3B0aW9ucy5pZ25vcmVMb2NhbENoYW5nZXMpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVtb3RlLnB1c2goKTtcbiAgICB9XG4gICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlKCk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBzZW5kU2lnbk91dFJlcXVlc3QoKSB7XG4gICAgcmV0dXJuIHdpdGhTaW5nbGVSZXF1ZXN0KCdzaWduT3V0JywgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5yZXF1ZXN0KCdERUxFVEUnLCAnL19zZXNzaW9uJyk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIHRoZSBzaWduIGluIHJlcXVlc3QgdGhhdCBzdGFydHMgYSBDb3VjaERCIHNlc3Npb24gaWZcbiAgLy8gaXQgc3VjY2VlZHMuIFdlIHNlcGFyYXRlZCB0aGUgYWN0dWFsIHNpZ24gaW4gcmVxdWVzdCBmcm9tXG4gIC8vIHRoZSBzaWduSW4gbWV0aG9kLCBhcyB0aGUgbGF0dGVyIGFsc28gcnVucyBzaWduT3V0IGludGVucnRhbGx5XG4gIC8vIHRvIGNsZWFuIHVwIGxvY2FsIGRhdGEgYmVmb3JlIHN0YXJ0aW5nIGEgbmV3IHNlc3Npb24uIEJ1dCBhc1xuICAvLyBvdGhlciBtZXRob2RzIGxpa2Ugc2lnblVwIG9yIGNoYW5nZVBhc3N3b3JkIGRvIGFsc28gbmVlZCB0b1xuICAvLyBzaWduIGluIHRoZSB1c2VyIChhZ2FpbiksIHRoZXNlIG5lZWQgdG8gc2VuZCB0aGUgc2lnbiBpblxuICAvLyByZXF1ZXN0IGJ1dCB3aXRob3V0IGEgc2lnbk91dCBiZWZvcmVoYW5kLCBhcyB0aGUgdXNlciByZW1haW5zXG4gIC8vIHRoZSBzYW1lLlxuICAvL1xuICBmdW5jdGlvbiBzZW5kU2lnbkluUmVxdWVzdCh1c2VybmFtZSwgcGFzc3dvcmQsIG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxdWVzdE9wdGlvbnMgPSB7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIG5hbWU6IHVzZXJUeXBlQW5kSWQodXNlcm5hbWUpLFxuICAgICAgICBwYXNzd29yZDogcGFzc3dvcmRcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgnc2lnbkluJywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IGFjY291bnQucmVxdWVzdCgnUE9TVCcsICcvX3Nlc3Npb24nLCByZXF1ZXN0T3B0aW9ucyk7XG5cbiAgICAgIHJldHVybiBwcm9taXNlLnRoZW4oXG4gICAgICAgIGhhbmRsZVNpZ25JblN1Y2Nlc3Mob3B0aW9ucylcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBub3coKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCk7XG4gIH1cblxuICAvL1xuICAvLyBleHBvc2UgcHVibGljIGFjY291bnQgQVBJXG4gIC8vXG4gIGhvb2RpZS5hY2NvdW50ID0gYWNjb3VudDtcblxuICAvLyBUT0RPOiB3ZSBzaG91bGQgbW92ZSB0aGUgb3duZXIgaGFzaCBvbiBob29kaWUgY29yZSwgYXNcbiAgLy8gICAgICAgb3RoZXIgbW9kdWxlcyBkZXBlbmQgb24gaXQgYXMgd2VsbCwgbGlrZSBob29kaWUuc3RvcmUuXG4gIC8vIHRoZSBvd25lckhhc2ggZ2V0cyBzdG9yZWQgaW4gZXZlcnkgb2JqZWN0IGNyZWF0ZWQgYnkgdGhlIHVzZXIuXG4gIC8vIE1ha2Ugc3VyZSB3ZSBoYXZlIG9uZS5cbiAgaG9vZGllLmFjY291bnQub3duZXJIYXNoID0gaG9vZGllLmNvbmZpZy5nZXQoJ19hY2NvdW50Lm93bmVySGFzaCcpO1xuICBpZiAoIWhvb2RpZS5hY2NvdW50Lm93bmVySGFzaCkge1xuICAgIHNldE93bmVyKGhvb2RpZS5nZW5lcmF0ZUlkKCkpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllQWNjb3VudDtcbiIsIi8vIEFjY291bnRSZW1vdGVcbi8vID09PT09PT09PT09PT09PVxuXG4vLyBDb25uZWN0aW9uIC8gU29ja2V0IHRvIG91ciBjb3VjaFxuLy9cbi8vIEFjY291bnRSZW1vdGUgaXMgdXNpbmcgQ291Y2hEQidzIGBfY2hhbmdlc2AgZmVlZCB0b1xuLy8gbGlzdGVuIHRvIGNoYW5nZXMgYW5kIGBfYnVsa19kb2NzYCB0byBwdXNoIGxvY2FsIGNoYW5nZXNcbi8vXG4vLyBXaGVuIGhvb2RpZS5yZW1vdGUgaXMgY29udGludW91c2x5IHN5bmNpbmcgKGRlZmF1bHQpLFxuLy8gaXQgd2lsbCBjb250aW51b3VzbHkgIHN5bmNocm9uaXplIHdpdGggbG9jYWwgc3RvcmUsXG4vLyBvdGhlcndpc2Ugc3luYywgcHVsbCBvciBwdXNoIGNhbiBiZSBjYWxsZWQgbWFudWFsbHlcbi8vXG5cbmZ1bmN0aW9uIGhvb2RpZVJlbW90ZSAoaG9vZGllKSB7XG4gIC8vIGluaGVyaXQgZnJvbSBIb29kaWVzIFN0b3JlIEFQSVxuICB2YXIgcmVtb3RlID0gaG9vZGllLm9wZW4oaG9vZGllLmFjY291bnQuZGIoKSwge1xuXG4gICAgLy8gd2UncmUgYWx3YXlzIGNvbm5lY3RlZCB0byBvdXIgb3duIGRiXG4gICAgY29ubmVjdGVkOiB0cnVlLFxuXG4gICAgLy8gZG8gbm90IHByZWZpeCBmaWxlcyBmb3IgbXkgb3duIHJlbW90ZVxuICAgIHByZWZpeDogJycsXG5cbiAgICAvL1xuICAgIHNpbmNlOiBzaW5jZU5yQ2FsbGJhY2ssXG5cbiAgICAvL1xuICAgIGRlZmF1bHRPYmplY3RzVG9QdXNoOiBob29kaWUuc3RvcmUuY2hhbmdlZE9iamVjdHMsXG5cbiAgICAvL1xuICAgIGtub3duT2JqZWN0czogaG9vZGllLnN0b3JlLmluZGV4KCkubWFwKCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciB0eXBlQW5kSWQgPSBrZXkuc3BsaXQoL1xcLy8pO1xuICAgICAgcmV0dXJuIHsgdHlwZTogdHlwZUFuZElkWzBdLCBpZDogdHlwZUFuZElkWzFdfTtcbiAgICB9KVxuICB9KTtcblxuICAvLyBDb25uZWN0XG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHdlIHNsaWdodGx5IGV4dGVuZCB0aGUgb3JpZ2luYWwgcmVtb3RlLmNvbm5lY3QgbWV0aG9kXG4gIC8vIHByb3ZpZGVkIGJ5IGBob29kaWVSZW1vdGVTdG9yZWAsIHRvIGNoZWNrIGlmIHRoZSB1c2VyXG4gIC8vIGhhcyBhbiBhY2NvdW50IGJlZm9yZWhhbmQuIFdlIGFsc28gaGFyZGNvZGUgdGhlIHJpZ2h0XG4gIC8vIG5hbWUgZm9yIHJlbW90ZSAoY3VycmVudCB1c2VyJ3MgZGF0YWJhc2UgbmFtZSlcbiAgLy9cbiAgdmFyIG9yaWdpbmFsQ29ubmVjdE1ldGhvZCA9IHJlbW90ZS5jb25uZWN0O1xuICByZW1vdGUuY29ubmVjdCA9IGZ1bmN0aW9uIGNvbm5lY3QoKSB7XG4gICAgaWYgKCEgaG9vZGllLmFjY291bnQuaGFzQWNjb3VudCgpICkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKCdVc2VyIGhhcyBubyBkYXRhYmFzZSB0byBjb25uZWN0IHRvJyk7XG4gICAgfVxuICAgIHJldHVybiBvcmlnaW5hbENvbm5lY3RNZXRob2QoIGhvb2RpZS5hY2NvdW50LmRiKCkgKTtcbiAgfTtcblxuICAvLyB0cmlnZ2VyXG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHByb3hpZXMgdG8gaG9vZGllLnRyaWdnZXJcbiAgcmVtb3RlLnRyaWdnZXIgPSBmdW5jdGlvbiB0cmlnZ2VyKCkge1xuICAgIHZhciBldmVudE5hbWU7XG5cbiAgICBldmVudE5hbWUgPSBhcmd1bWVudHNbMF07XG5cbiAgICB2YXIgcGFyYW1ldGVycyA9IDIgPD0gYXJndW1lbnRzLmxlbmd0aCA/IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcblxuICAgIHJldHVybiBob29kaWUudHJpZ2dlci5hcHBseShob29kaWUsIFsncmVtb3RlOicgKyBldmVudE5hbWVdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChwYXJhbWV0ZXJzKSkpO1xuICB9O1xuXG5cbiAgLy8gb25cbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gcHJveGllcyB0byBob29kaWUub25cbiAgcmVtb3RlLm9uID0gZnVuY3Rpb24gb24oZXZlbnROYW1lLCBkYXRhKSB7XG4gICAgZXZlbnROYW1lID0gZXZlbnROYW1lLnJlcGxhY2UoLyhefCApKFteIF0rKS9nLCAnJDEnKydyZW1vdGU6JDInKTtcbiAgICByZXR1cm4gaG9vZGllLm9uKGV2ZW50TmFtZSwgZGF0YSk7XG4gIH07XG5cblxuICAvLyB1bmJpbmRcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gcHJveGllcyB0byBob29kaWUudW5iaW5kXG4gIHJlbW90ZS51bmJpbmQgPSBmdW5jdGlvbiB1bmJpbmQoZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICAgIGV2ZW50TmFtZSA9IGV2ZW50TmFtZS5yZXBsYWNlKC8oXnwgKShbXiBdKykvZywgJyQxJysncmVtb3RlOiQyJyk7XG4gICAgcmV0dXJuIGhvb2RpZS51bmJpbmQoZXZlbnROYW1lLCBjYWxsYmFjayk7XG4gIH07XG5cblxuICAvLyBQcml2YXRlXG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIGdldHRlciAvIHNldHRlciBmb3Igc2luY2UgbnVtYmVyXG4gIC8vXG4gIGZ1bmN0aW9uIHNpbmNlTnJDYWxsYmFjayhzaW5jZU5yKSB7XG4gICAgaWYgKHNpbmNlTnIpIHtcbiAgICAgIHJldHVybiBob29kaWUuY29uZmlnLnNldCgnX3JlbW90ZS5zaW5jZScsIHNpbmNlTnIpO1xuICAgIH1cblxuICAgIHJldHVybiBob29kaWUuY29uZmlnLmdldCgnX3JlbW90ZS5zaW5jZScpIHx8IDA7XG4gIH1cblxuICAvL1xuICAvLyBzdWJzY3JpYmUgdG8gZXZlbnRzIGNvbWluZyBmcm9tIG91dHNpZGVcbiAgLy9cbiAgZnVuY3Rpb24gc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCkge1xuXG4gICAgaG9vZGllLm9uKCdyZW1vdGU6Y29ubmVjdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgaG9vZGllLm9uKCdzdG9yZTppZGxlJywgcmVtb3RlLnB1c2gpO1xuICAgICAgcmVtb3RlLnB1c2goKTtcbiAgICB9KTtcblxuICAgIGhvb2RpZS5vbigncmVtb3RlOmRpc2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcbiAgICAgIGhvb2RpZS51bmJpbmQoJ3N0b3JlOmlkbGUnLCByZW1vdGUucHVzaCk7XG4gICAgfSk7XG5cbiAgICBob29kaWUub24oJ2Rpc2Nvbm5lY3RlZCcsIHJlbW90ZS5kaXNjb25uZWN0KTtcbiAgICBob29kaWUub24oJ3JlY29ubmVjdGVkJywgcmVtb3RlLmNvbm5lY3QpO1xuXG4gICAgLy8gYWNjb3VudCBldmVudHNcbiAgICBob29kaWUub24oJ2FjY291bnQ6c2lnbmluJywgcmVtb3RlLmNvbm5lY3QpO1xuICAgIGhvb2RpZS5vbignYWNjb3VudDpzaWduaW46YW5vbnltb3VzJywgcmVtb3RlLmNvbm5lY3QpO1xuXG4gICAgaG9vZGllLm9uKCdhY2NvdW50OnJlYXV0aGVudGljYXRlZCcsIHJlbW90ZS5jb25uZWN0KTtcbiAgICBob29kaWUub24oJ2FjY291bnQ6c2lnbm91dCcsIHJlbW90ZS5kaXNjb25uZWN0KTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9uY2UgZnJvbSBvdXRzaWRlXG4gIHJlbW90ZS5zdWJzY3JpYmVUb091dHNpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKTtcbiAgICBkZWxldGUgcmVtb3RlLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cztcbiAgfTtcblxuICAvL1xuICAvLyBleHBvc2UgcmVtb3RlIEFQSVxuICAvL1xuICBob29kaWUucmVtb3RlID0gcmVtb3RlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVJlbW90ZTtcbiIsIi8vIEhvb2RpZSBDb25maWcgQVBJXG4vLyA9PT09PT09PT09PT09PT09PT09XG5cbi8vXG5mdW5jdGlvbiBob29kaWVDb25maWcoaG9vZGllKSB7XG5cbiAgdmFyIHR5cGUgPSAnJGNvbmZpZyc7XG4gIHZhciBpZCA9ICdob29kaWUnO1xuICB2YXIgY2FjaGUgPSB7fTtcblxuICAvLyBwdWJsaWMgQVBJXG4gIHZhciBjb25maWcgPSB7fTtcblxuXG4gIC8vIHNldFxuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy8gYWRkcyBhIGNvbmZpZ3VyYXRpb25cbiAgLy9cbiAgY29uZmlnLnNldCA9IGZ1bmN0aW9uIHNldChrZXksIHZhbHVlKSB7XG4gICAgdmFyIGlzU2lsZW50LCB1cGRhdGU7XG5cbiAgICBpZiAoY2FjaGVba2V5XSA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjYWNoZVtrZXldID0gdmFsdWU7XG5cbiAgICB1cGRhdGUgPSB7fTtcbiAgICB1cGRhdGVba2V5XSA9IHZhbHVlO1xuICAgIGlzU2lsZW50ID0ga2V5LmNoYXJBdCgwKSA9PT0gJ18nO1xuXG4gICAgcmV0dXJuIGhvb2RpZS5zdG9yZS51cGRhdGVPckFkZCh0eXBlLCBpZCwgdXBkYXRlLCB7XG4gICAgICBzaWxlbnQ6IGlzU2lsZW50XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gZ2V0XG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyByZWNlaXZlcyBhIGNvbmZpZ3VyYXRpb25cbiAgLy9cbiAgY29uZmlnLmdldCA9IGZ1bmN0aW9uIGdldChrZXkpIHtcbiAgICByZXR1cm4gY2FjaGVba2V5XTtcbiAgfTtcblxuICAvLyBjbGVhclxuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy8gY2xlYXJzIGNhY2hlIGFuZCByZW1vdmVzIG9iamVjdCBmcm9tIHN0b3JlXG4gIC8vXG4gIGNvbmZpZy5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIGNhY2hlID0ge307XG4gICAgcmV0dXJuIGhvb2RpZS5zdG9yZS5yZW1vdmUodHlwZSwgaWQpO1xuICB9O1xuXG4gIC8vIHVuc2V0XG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyB1bnNldHMgYSBjb25maWd1cmF0aW9uLCBpcyBhIHNpbXBsZSBhbGlhcyBmb3IgY29uZmlnLnNldChrZXksIHVuZGVmaW5lZClcbiAgLy9cbiAgY29uZmlnLnVuc2V0ID0gZnVuY3Rpb24gdW5zZXQoa2V5KSB7XG4gICAgcmV0dXJuIGNvbmZpZy5zZXQoa2V5LCB1bmRlZmluZWQpO1xuICB9O1xuXG4gIC8vIGxvYWQgY2FjaGVcbiAgLy8gVE9ETzogSSByZWFsbHkgZG9uJ3QgbGlrZSB0aGlzIGJlaW5nIGhlcmUuIEFuZCBJIGRvbid0IGxpa2UgdGhhdCBpZiB0aGVcbiAgLy8gICAgICAgc3RvcmUgQVBJIHdpbGwgYmUgdHJ1bHkgYXN5bmMgb25lIGRheSwgdGhpcyB3aWxsIGZhbGwgb24gb3VyIGZlZXQuXG4gIGhvb2RpZS5zdG9yZS5maW5kKHR5cGUsIGlkKS5kb25lKGZ1bmN0aW9uKG9iaikge1xuICAgIGNhY2hlID0gb2JqO1xuICB9KTtcblxuICAvLyBleHNwb3NlIHB1YmxpYyBBUElcbiAgaG9vZGllLmNvbmZpZyA9IGNvbmZpZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVDb25maWc7XG4iLCIvLyBob29kaWUuY2hlY2tDb25uZWN0aW9uKCkgJiBob29kaWUuaXNDb25uZWN0ZWQoKVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4vL1xuZnVuY3Rpb24gaG9vZGllQ29ubmVjdGlvbihob29kaWUpIHtcbiAgLy8gc3RhdGVcbiAgdmFyIG9ubGluZSA9IHRydWU7XG4gIHZhciBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCA9IDMwMDAwO1xuICB2YXIgY2hlY2tDb25uZWN0aW9uUmVxdWVzdCA9IG51bGw7XG4gIHZhciBjaGVja0Nvbm5lY3Rpb25UaW1lb3V0ID0gbnVsbDtcblxuICAvLyBDaGVjayBDb25uZWN0aW9uXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHRoZSBgY2hlY2tDb25uZWN0aW9uYCBtZXRob2QgaXMgdXNlZCwgd2VsbCwgdG8gY2hlY2sgaWZcbiAgLy8gdGhlIGhvb2RpZSBiYWNrZW5kIGlzIHJlYWNoYWJsZSBhdCBgYmFzZVVybGAgb3Igbm90LlxuICAvLyBDaGVjayBDb25uZWN0aW9uIGlzIGF1dG9tYXRpY2FsbHkgY2FsbGVkIG9uIHN0YXJ0dXBcbiAgLy8gYW5kIHRoZW4gZWFjaCAzMCBzZWNvbmRzLiBJZiBpdCBmYWlscywgaXRcbiAgLy9cbiAgLy8gLSBzZXRzIGBvbmxpbmUgPSBmYWxzZWBcbiAgLy8gLSB0cmlnZ2VycyBgb2ZmbGluZWAgZXZlbnRcbiAgLy8gLSBzZXRzIGBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCA9IDMwMDBgXG4gIC8vXG4gIC8vIHdoZW4gY29ubmVjdGlvbiBjYW4gYmUgcmVlc3RhYmxpc2hlZCwgaXRcbiAgLy9cbiAgLy8gLSBzZXRzIGBvbmxpbmUgPSB0cnVlYFxuICAvLyAtIHRyaWdnZXJzIGBvbmxpbmVgIGV2ZW50XG4gIC8vIC0gc2V0cyBgY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwgPSAzMDAwMGBcbiAgLy9cbiAgaG9vZGllLmNoZWNrQ29ubmVjdGlvbiA9IGZ1bmN0aW9uIGNoZWNrQ29ubmVjdGlvbigpIHtcbiAgICB2YXIgcmVxID0gY2hlY2tDb25uZWN0aW9uUmVxdWVzdDtcblxuICAgIGlmIChyZXEgJiYgcmVxLnN0YXRlKCkgPT09ICdwZW5kaW5nJykge1xuICAgICAgcmV0dXJuIHJlcTtcbiAgICB9XG5cbiAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KGNoZWNrQ29ubmVjdGlvblRpbWVvdXQpO1xuXG4gICAgY2hlY2tDb25uZWN0aW9uUmVxdWVzdCA9IGhvb2RpZS5yZXF1ZXN0KCdHRVQnLCAnLycpLnRoZW4oXG4gICAgICBoYW5kbGVDaGVja0Nvbm5lY3Rpb25TdWNjZXNzLFxuICAgICAgaGFuZGxlQ2hlY2tDb25uZWN0aW9uRXJyb3JcbiAgICApO1xuXG4gICAgcmV0dXJuIGNoZWNrQ29ubmVjdGlvblJlcXVlc3Q7XG4gIH07XG5cblxuICAvLyBpc0Nvbm5lY3RlZFxuICAvLyAtLS0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgaG9vZGllLmlzQ29ubmVjdGVkID0gZnVuY3Rpb24gaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIG9ubGluZTtcbiAgfTtcblxuXG4gIC8vXG4gIC8vXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZUNoZWNrQ29ubmVjdGlvblN1Y2Nlc3MoKSB7XG4gICAgY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwgPSAzMDAwMDtcblxuICAgIGNoZWNrQ29ubmVjdGlvblRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dChob29kaWUuY2hlY2tDb25uZWN0aW9uLCBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCk7XG5cbiAgICBpZiAoIWhvb2RpZS5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgICBob29kaWUudHJpZ2dlcigncmVjb25uZWN0ZWQnKTtcbiAgICAgIG9ubGluZSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlKCk7XG4gIH1cblxuXG4gIC8vXG4gIC8vXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZUNoZWNrQ29ubmVjdGlvbkVycm9yKCkge1xuICAgIGNoZWNrQ29ubmVjdGlvbkludGVydmFsID0gMzAwMDtcblxuICAgIGNoZWNrQ29ubmVjdGlvblRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dChob29kaWUuY2hlY2tDb25uZWN0aW9uLCBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCk7XG5cbiAgICBpZiAoaG9vZGllLmlzQ29ubmVjdGVkKCkpIHtcbiAgICAgIGhvb2RpZS50cmlnZ2VyKCdkaXNjb25uZWN0ZWQnKTtcbiAgICAgIG9ubGluZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBob29kaWUucmVqZWN0KCk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVDb25uZWN0aW9uO1xuIiwiLy8gaG9vZGllLmRpc3Bvc2Vcbi8vID09PT09PT09PT09PT09PT1cblxuZnVuY3Rpb24gaG9vZGllRGlzcG9zZSAoaG9vZGllKSB7XG5cbiAgLy8gaWYgYSBob29kaWUgaW5zdGFuY2UgaXMgbm90IG5lZWRlZCBhbnltb3JlLCBpdCBjYW5cbiAgLy8gYmUgZGlzcG9zZWQgdXNpbmcgdGhpcyBtZXRob2QuIEEgYGRpc3Bvc2VgIGV2ZW50XG4gIC8vIGdldHMgdHJpZ2dlcmVkIHRoYXQgdGhlIG1vZHVsZXMgcmVhY3Qgb24uXG4gIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgaG9vZGllLnRyaWdnZXIoJ2Rpc3Bvc2UnKTtcbiAgICBob29kaWUudW5iaW5kKCk7XG4gIH1cblxuICAvL1xuICAvLyBQdWJsaWMgQVBJXG4gIC8vXG4gIGhvb2RpZS5kaXNwb3NlID0gZGlzcG9zZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVEaXNwb3NlO1xuIiwiLy8gSG9vZGllIEVycm9yXG4vLyAtLS0tLS0tLS0tLS0tXG5cbi8vIFdpdGggdGhlIGN1c3RvbSBob29kaWUgZXJyb3IgZnVuY3Rpb25cbi8vIHdlIG5vcm1hbGl6ZSBhbGwgZXJyb3JzIHRoZSBnZXQgcmV0dXJuZWRcbi8vIHdoZW4gdXNpbmcgaG9vZGllLnJlamVjdFdpdGhcbi8vXG4vLyBUaGUgbmF0aXZlIEphdmFTY3JpcHQgZXJyb3IgbWV0aG9kIGhhc1xuLy8gYSBuYW1lICYgYSBtZXNzYWdlIHByb3BlcnR5LiBIb29kaWVFcnJvclxuLy8gcmVxdWlyZXMgdGhlc2UsIGJ1dCBvbiB0b3AgYWxsb3dzIGZvclxuLy8gdW5saW1pdGVkIGN1c3RvbSBwcm9wZXJ0aWVzLlxuLy9cbi8vIEluc3RlYWQgb2YgYmVpbmcgaW5pdGlhbGl6ZWQgd2l0aCBqdXN0XG4vLyB0aGUgbWVzc2FnZSwgSG9vZGllRXJyb3IgZXhwZWN0cyBhblxuLy8gb2JqZWN0IHdpdGggcHJvcGVyaXRlcy4gVGhlIGBtZXNzYWdlYFxuLy8gcHJvcGVydHkgaXMgcmVxdWlyZWQuIFRoZSBuYW1lIHdpbGxcbi8vIGZhbGxiYWNrIHRvIGBlcnJvcmAuXG4vL1xuLy8gYG1lc3NhZ2VgIGNhbiBhbHNvIGNvbnRhaW4gcGxhY2Vob2xkZXJzXG4vLyBpbiB0aGUgZm9ybSBvZiBge3twcm9wZXJ0eU5hbWV9fWBgIHdoaWNoXG4vLyB3aWxsIGdldCByZXBsYWNlZCBhdXRvbWF0aWNhbGx5IHdpdGggcGFzc2VkXG4vLyBleHRyYSBwcm9wZXJ0aWVzLlxuLy9cbi8vICMjIyBFcnJvciBDb252ZW50aW9uc1xuLy9cbi8vIFdlIGZvbGxvdyBKYXZhU2NyaXB0J3MgbmF0aXZlIGVycm9yIGNvbnZlbnRpb25zLFxuLy8gbWVhbmluZyB0aGF0IGVycm9yIG5hbWVzIGFyZSBjYW1lbENhc2Ugd2l0aCB0aGVcbi8vIGZpcnN0IGxldHRlciB1cHBlcmNhc2UgYXMgd2VsbCwgYW5kIHRoZSBtZXNzYWdlXG4vLyBzdGFydGluZyB3aXRoIGFuIHVwcGVyY2FzZSBsZXR0ZXIuXG4vL1xudmFyIGVycm9yTWVzc2FnZVJlcGxhY2VQYXR0ZXJuID0gL1xce1xce1xccypcXHcrXFxzKlxcfVxcfS9nO1xudmFyIGVycm9yTWVzc2FnZUZpbmRQcm9wZXJ0eVBhdHRlcm4gPSAvXFx3Ky87XG5cbnZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKTtcblxuZnVuY3Rpb24gSG9vZGllRXJyb3IocHJvcGVydGllcykge1xuXG4gIC8vIG5vcm1hbGl6ZSBhcmd1bWVudHNcbiAgaWYgKHR5cGVvZiBwcm9wZXJ0aWVzID09PSAnc3RyaW5nJykge1xuICAgIHByb3BlcnRpZXMgPSB7XG4gICAgICBtZXNzYWdlOiBwcm9wZXJ0aWVzXG4gICAgfTtcbiAgfVxuXG4gIGlmICghIHByb3BlcnRpZXMubWVzc2FnZSkge1xuICAgIHRocm93ICdGQVRBTDogZXJyb3IubWVzc2FnZSBtdXN0IGJlIHNldCc7XG4gIH1cblxuICBpZiAoISBwcm9wZXJ0aWVzLm5hbWUpIHtcbiAgICBwcm9wZXJ0aWVzLm5hbWUgPSAnSG9vZGllRXJyb3InO1xuICB9XG5cbiAgZXh0ZW5kKHRoaXMsIHByb3BlcnRpZXMpO1xuXG4gIHByb3BlcnRpZXMubWVzc2FnZSA9IHByb3BlcnRpZXMubWVzc2FnZS5yZXBsYWNlKGVycm9yTWVzc2FnZVJlcGxhY2VQYXR0ZXJuLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIHZhciBwcm9wZXJ0eSA9IG1hdGNoLm1hdGNoKGVycm9yTWVzc2FnZUZpbmRQcm9wZXJ0eVBhdHRlcm4pWzBdO1xuICAgIHJldHVybiBwcm9wZXJ0aWVzW3Byb3BlcnR5XTtcbiAgfSk7XG59XG5Ib29kaWVFcnJvci5wcm90b3R5cGUgPSBuZXcgRXJyb3IoKTtcbkhvb2RpZUVycm9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEhvb2RpZUVycm9yO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhvb2RpZUVycm9yO1xuIiwiLy8gSG9vZGllIEludmFsaWQgVHlwZSBPciBJZCBFcnJvclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBvbmx5IGxvd2VyY2FzZSBsZXR0ZXJzLCBudW1iZXJzIGFuZCBkYXNoZXNcbi8vIGFyZSBhbGxvd2VkIGZvciBvYmplY3QgSURzLlxuLy9cbnZhciBIb29kaWVFcnJvciA9IHJlcXVpcmUoJy4uL2Vycm9yJyk7XG5cbi8vXG5mdW5jdGlvbiBIb29kaWVPYmplY3RJZEVycm9yKHByb3BlcnRpZXMpIHtcbiAgcHJvcGVydGllcy5uYW1lID0gJ0hvb2RpZU9iamVjdElkRXJyb3InO1xuICBwcm9wZXJ0aWVzLm1lc3NhZ2UgPSAnXCJ7e2lkfX1cIiBpcyBpbnZhbGlkIG9iamVjdCBpZC4ge3tydWxlc319Lic7XG5cbiAgcmV0dXJuIG5ldyBIb29kaWVFcnJvcihwcm9wZXJ0aWVzKTtcbn1cbnZhciB2YWxpZElkUGF0dGVybiA9IC9eW2EtejAtOVxcLV0rJC87XG5Ib29kaWVPYmplY3RJZEVycm9yLmlzSW52YWxpZCA9IGZ1bmN0aW9uKGlkLCBjdXN0b21QYXR0ZXJuKSB7XG4gIHJldHVybiAhIChjdXN0b21QYXR0ZXJuIHx8IHZhbGlkSWRQYXR0ZXJuKS50ZXN0KGlkIHx8ICcnKTtcbn07XG5Ib29kaWVPYmplY3RJZEVycm9yLmlzVmFsaWQgPSBmdW5jdGlvbihpZCwgY3VzdG9tUGF0dGVybikge1xuICByZXR1cm4gKGN1c3RvbVBhdHRlcm4gfHwgdmFsaWRJZFBhdHRlcm4pLnRlc3QoaWQgfHwgJycpO1xufTtcbkhvb2RpZU9iamVjdElkRXJyb3IucHJvdG90eXBlLnJ1bGVzID0gJ0xvd2VyY2FzZSBsZXR0ZXJzLCBudW1iZXJzIGFuZCBkYXNoZXMgYWxsb3dlZCBvbmx5LiBNdXN0IHN0YXJ0IHdpdGggYSBsZXR0ZXInO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhvb2RpZU9iamVjdElkRXJyb3I7XG4iLCIvLyBIb29kaWUgSW52YWxpZCBUeXBlIE9yIElkIEVycm9yXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIG9ubHkgbG93ZXJjYXNlIGxldHRlcnMsIG51bWJlcnMgYW5kIGRhc2hlc1xuLy8gYXJlIGFsbG93ZWQgZm9yIG9iamVjdCB0eXBlcywgcGx1cyBtdXN0IHN0YXJ0XG4vLyB3aXRoIGEgbGV0dGVyLlxuLy9cbnZhciBIb29kaWVFcnJvciA9IHJlcXVpcmUoJy4uL2Vycm9yJyk7XG5cbi8vXG5mdW5jdGlvbiBIb29kaWVPYmplY3RUeXBlRXJyb3IocHJvcGVydGllcykge1xuICBwcm9wZXJ0aWVzLm5hbWUgPSAnSG9vZGllT2JqZWN0VHlwZUVycm9yJztcbiAgcHJvcGVydGllcy5tZXNzYWdlID0gJ1wie3t0eXBlfX1cIiBpcyBpbnZhbGlkIG9iamVjdCB0eXBlLiB7e3J1bGVzfX0uJztcblxuICByZXR1cm4gbmV3IEhvb2RpZUVycm9yKHByb3BlcnRpZXMpO1xufVxudmFyIHZhbGlkVHlwZVBhdHRlcm4gPSAvXlthLXokXVthLXowLTldKyQvO1xuSG9vZGllT2JqZWN0VHlwZUVycm9yLmlzSW52YWxpZCA9IGZ1bmN0aW9uKHR5cGUsIGN1c3RvbVBhdHRlcm4pIHtcbiAgcmV0dXJuICEgKGN1c3RvbVBhdHRlcm4gfHwgdmFsaWRUeXBlUGF0dGVybikudGVzdCh0eXBlIHx8ICcnKTtcbn07XG5Ib29kaWVPYmplY3RUeXBlRXJyb3IuaXNWYWxpZCA9IGZ1bmN0aW9uKHR5cGUsIGN1c3RvbVBhdHRlcm4pIHtcbiAgcmV0dXJuIChjdXN0b21QYXR0ZXJuIHx8IHZhbGlkVHlwZVBhdHRlcm4pLnRlc3QodHlwZSB8fCAnJyk7XG59O1xuSG9vZGllT2JqZWN0VHlwZUVycm9yLnByb3RvdHlwZS5ydWxlcyA9ICdsb3dlcmNhc2UgbGV0dGVycywgbnVtYmVycyBhbmQgZGFzaGVzIGFsbG93ZWQgb25seS4gTXVzdCBzdGFydCB3aXRoIGEgbGV0dGVyJztcblxubW9kdWxlLmV4cG9ydHMgPSBIb29kaWVPYmplY3RUeXBlRXJyb3I7XG4iLCIvLyBFdmVudHNcbi8vID09PT09PT09XG4vL1xuLy8gZXh0ZW5kIGFueSBDbGFzcyB3aXRoIHN1cHBvcnQgZm9yXG4vL1xuLy8gKiBgb2JqZWN0LmJpbmQoJ2V2ZW50JywgY2IpYFxuLy8gKiBgb2JqZWN0LnVuYmluZCgnZXZlbnQnLCBjYilgXG4vLyAqIGBvYmplY3QudHJpZ2dlcignZXZlbnQnLCBhcmdzLi4uKWBcbi8vICogYG9iamVjdC5vbmUoJ2V2JywgY2IpYFxuLy9cbi8vIGJhc2VkIG9uIFtFdmVudHMgaW1wbGVtZW50YXRpb25zIGZyb20gU3BpbmVdKGh0dHBzOi8vZ2l0aHViLmNvbS9tYWNjbWFuL3NwaW5lL2Jsb2IvbWFzdGVyL3NyYy9zcGluZS5jb2ZmZWUjTDEpXG4vL1xuXG4vLyBjYWxsYmFja3MgYXJlIGdsb2JhbCwgd2hpbGUgdGhlIGV2ZW50cyBBUEkgaXMgdXNlZCBhdCBzZXZlcmFsIHBsYWNlcyxcbi8vIGxpa2UgaG9vZGllLm9uIC8gaG9vZGllLnN0b3JlLm9uIC8gaG9vZGllLnRhc2sub24gZXRjLlxuLy9cblxuZnVuY3Rpb24gaG9vZGllRXZlbnRzKGhvb2RpZSwgb3B0aW9ucykge1xuICB2YXIgY29udGV4dCA9IGhvb2RpZTtcbiAgdmFyIG5hbWVzcGFjZSA9ICcnO1xuXG4gIC8vIG5vcm1hbGl6ZSBvcHRpb25zIGhhc2hcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgLy8gbWFrZSBzdXJlIGNhbGxiYWNrcyBoYXNoIGV4aXN0c1xuICBpZiAoIWhvb2RpZS5ldmVudHNDYWxsYmFja3MpIHtcbiAgICBob29kaWUuZXZlbnRzQ2FsbGJhY2tzID0ge307XG4gIH1cblxuICBpZiAob3B0aW9ucy5jb250ZXh0KSB7XG4gICAgY29udGV4dCA9IG9wdGlvbnMuY29udGV4dDtcbiAgICBuYW1lc3BhY2UgPSBvcHRpb25zLm5hbWVzcGFjZSArICc6JztcbiAgfVxuXG4gIC8vIEJpbmRcbiAgLy8gLS0tLS0tXG4gIC8vXG4gIC8vIGJpbmQgYSBjYWxsYmFjayB0byBhbiBldmVudCB0cmlnZ2VyZCBieSB0aGUgb2JqZWN0XG4gIC8vXG4gIC8vICAgICBvYmplY3QuYmluZCAnY2hlYXQnLCBibGFtZVxuICAvL1xuICBmdW5jdGlvbiBiaW5kKGV2LCBjYWxsYmFjaykge1xuICAgIHZhciBldnMsIG5hbWUsIF9pLCBfbGVuO1xuXG4gICAgZXZzID0gZXYuc3BsaXQoJyAnKTtcblxuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gZXZzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBuYW1lID0gbmFtZXNwYWNlICsgZXZzW19pXTtcbiAgICAgIGhvb2RpZS5ldmVudHNDYWxsYmFja3NbbmFtZV0gPSBob29kaWUuZXZlbnRzQ2FsbGJhY2tzW25hbWVdIHx8IFtdO1xuICAgICAgaG9vZGllLmV2ZW50c0NhbGxiYWNrc1tuYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG4gIH1cblxuICAvLyBvbmVcbiAgLy8gLS0tLS1cbiAgLy9cbiAgLy8gc2FtZSBhcyBgYmluZGAsIGJ1dCBkb2VzIGdldCBleGVjdXRlZCBvbmx5IG9uY2VcbiAgLy9cbiAgLy8gICAgIG9iamVjdC5vbmUgJ2dyb3VuZFRvdWNoJywgZ2FtZU92ZXJcbiAgLy9cbiAgZnVuY3Rpb24gb25lKGV2LCBjYWxsYmFjaykge1xuICAgIGV2ID0gbmFtZXNwYWNlICsgZXY7XG4gICAgdmFyIHdyYXBwZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIGhvb2RpZS51bmJpbmQoZXYsIHdyYXBwZXIpO1xuICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIGhvb2RpZS5iaW5kKGV2LCB3cmFwcGVyKTtcbiAgfVxuXG4gIC8vIHRyaWdnZXJcbiAgLy8gLS0tLS0tLS0tXG4gIC8vXG4gIC8vIHRyaWdnZXIgYW4gZXZlbnQgYW5kIHBhc3Mgb3B0aW9uYWwgcGFyYW1ldGVycyBmb3IgYmluZGluZy5cbiAgLy8gICAgIG9iamVjdC50cmlnZ2VyICd3aW4nLCBzY29yZTogMTIzMFxuICAvL1xuICBmdW5jdGlvbiB0cmlnZ2VyKCkge1xuICAgIHZhciBhcmdzLCBjYWxsYmFjaywgZXYsIGxpc3QsIF9pLCBfbGVuO1xuXG4gICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICBldiA9IGFyZ3Muc2hpZnQoKTtcbiAgICBldiA9IG5hbWVzcGFjZSArIGV2O1xuICAgIGxpc3QgPSBob29kaWUuZXZlbnRzQ2FsbGJhY2tzW2V2XTtcblxuICAgIGlmICghbGlzdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gbGlzdC5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgY2FsbGJhY2sgPSBsaXN0W19pXTtcbiAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gdW5iaW5kXG4gIC8vIC0tLS0tLS0tXG4gIC8vXG4gIC8vIHVuYmluZCB0byBmcm9tIGFsbCBiaW5kaW5ncywgZnJvbSBhbGwgYmluZGluZ3Mgb2YgYSBzcGVjaWZpYyBldmVudFxuICAvLyBvciBmcm9tIGEgc3BlY2lmaWMgYmluZGluZy5cbiAgLy9cbiAgLy8gICAgIG9iamVjdC51bmJpbmQoKVxuICAvLyAgICAgb2JqZWN0LnVuYmluZCAnbW92ZSdcbiAgLy8gICAgIG9iamVjdC51bmJpbmQgJ21vdmUnLCBmb2xsb3dcbiAgLy9cbiAgZnVuY3Rpb24gdW5iaW5kKGV2LCBjYWxsYmFjaykge1xuICAgIHZhciBjYiwgaSwgbGlzdCwgX2ksIF9sZW4sIGV2TmFtZXM7XG5cbiAgICBpZiAoIWV2KSB7XG4gICAgICBpZiAoIW5hbWVzcGFjZSkge1xuICAgICAgICBob29kaWUuZXZlbnRzQ2FsbGJhY2tzID0ge307XG4gICAgICB9XG5cbiAgICAgIGV2TmFtZXMgPSBPYmplY3Qua2V5cyhob29kaWUuZXZlbnRzQ2FsbGJhY2tzKTtcbiAgICAgIGV2TmFtZXMgPSBldk5hbWVzLmZpbHRlcihmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgcmV0dXJuIGtleS5pbmRleE9mKG5hbWVzcGFjZSkgPT09IDA7XG4gICAgICB9KTtcbiAgICAgIGV2TmFtZXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgZGVsZXRlIGhvb2RpZS5ldmVudHNDYWxsYmFja3Nba2V5XTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXYgPSBuYW1lc3BhY2UgKyBldjtcblxuICAgIGxpc3QgPSBob29kaWUuZXZlbnRzQ2FsbGJhY2tzW2V2XTtcblxuICAgIGlmICghbGlzdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgIGRlbGV0ZSBob29kaWUuZXZlbnRzQ2FsbGJhY2tzW2V2XTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSBfaSA9IDAsIF9sZW4gPSBsaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBpID0gKytfaSkge1xuICAgICAgY2IgPSBsaXN0W2ldO1xuXG5cbiAgICAgIGlmIChjYiAhPT0gY2FsbGJhY2spIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGxpc3QgPSBsaXN0LnNsaWNlKCk7XG4gICAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICAgIGhvb2RpZS5ldmVudHNDYWxsYmFja3NbZXZdID0gbGlzdDtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnRleHQuYmluZCA9IGJpbmQ7XG4gIGNvbnRleHQub24gPSBiaW5kO1xuICBjb250ZXh0Lm9uZSA9IG9uZTtcbiAgY29udGV4dC50cmlnZ2VyID0gdHJpZ2dlcjtcbiAgY29udGV4dC51bmJpbmQgPSB1bmJpbmQ7XG4gIGNvbnRleHQub2ZmID0gdW5iaW5kO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZUV2ZW50cztcbiIsIi8vIGhvb2RpZS5nZW5lcmF0ZUlkXG4vLyA9PT09PT09PT09PT09XG5cbi8vIGhlbHBlciB0byBnZW5lcmF0ZSB1bmlxdWUgaWRzLlxuZnVuY3Rpb24gaG9vZGllR2VuZXJhdGVJZCAoaG9vZGllKSB7XG4gIHZhciBjaGFycywgaSwgcmFkaXg7XG5cbiAgLy8gdXVpZHMgY29uc2lzdCBvZiBudW1iZXJzIGFuZCBsb3dlcmNhc2UgbGV0dGVycyBvbmx5LlxuICAvLyBXZSBzdGljayB0byBsb3dlcmNhc2UgbGV0dGVycyB0byBwcmV2ZW50IGNvbmZ1c2lvblxuICAvLyBhbmQgdG8gcHJldmVudCBpc3N1ZXMgd2l0aCBDb3VjaERCLCBlLmcuIGRhdGFiYXNlXG4gIC8vIG5hbWVzIGRvIHdvbmx5IGFsbG93IGZvciBsb3dlcmNhc2UgbGV0dGVycy5cbiAgY2hhcnMgPSAnMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6Jy5zcGxpdCgnJyk7XG4gIHJhZGl4ID0gY2hhcnMubGVuZ3RoO1xuXG5cbiAgZnVuY3Rpb24gZ2VuZXJhdGVJZChsZW5ndGgpIHtcbiAgICB2YXIgaWQgPSAnJztcblxuICAgIC8vIGRlZmF1bHQgdXVpZCBsZW5ndGggdG8gN1xuICAgIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgbGVuZ3RoID0gNztcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciByYW5kID0gTWF0aC5yYW5kb20oKSAqIHJhZGl4O1xuICAgICAgdmFyIGNoYXIgPSBjaGFyc1tNYXRoLmZsb29yKHJhbmQpXTtcbiAgICAgIGlkICs9IFN0cmluZyhjaGFyKS5jaGFyQXQoMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgLy9cbiAgLy8gUHVibGljIEFQSVxuICAvL1xuICBob29kaWUuZ2VuZXJhdGVJZCA9IGdlbmVyYXRlSWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllR2VuZXJhdGVJZDtcbiIsIi8vIExvY2FsU3RvcmVcbi8vID09PT09PT09PT09PVxuXG4vL1xudmFyIGhvb2RpZVN0b3JlQXBpID0gcmVxdWlyZSgnLi9zdG9yZScpO1xudmFyIEhvb2RpZU9iamVjdFR5cGVFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3Ivb2JqZWN0X3R5cGUnKTtcbnZhciBIb29kaWVPYmplY3RJZEVycm9yID0gcmVxdWlyZSgnLi9lcnJvci9vYmplY3RfaWQnKTtcblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ2V4dGVuZCcpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllU3RvcmUgKGhvb2RpZSkge1xuXG4gIHZhciBsb2NhbFN0b3JlID0ge307XG5cbiAgLy9cbiAgLy8gc3RhdGVcbiAgLy8gLS0tLS0tLVxuICAvL1xuXG4gIC8vIGNhY2hlIG9mIGxvY2FsU3RvcmFnZSBmb3IgcXVpY2tlciBhY2Nlc3NcbiAgdmFyIGNhY2hlZE9iamVjdCA9IHt9O1xuXG4gIC8vIG1hcCBvZiBkaXJ0eSBvYmplY3RzIGJ5IHRoZWlyIGlkc1xuICB2YXIgZGlydHkgPSB7fTtcblxuICAvLyBxdWV1ZSBvZiBtZXRob2QgY2FsbHMgZG9uZSBkdXJpbmcgYm9vdHN0cmFwcGluZ1xuICB2YXIgcXVldWUgPSBbXTtcblxuICAvLyAyIHNlY29uZHMgdGltb3V0IGJlZm9yZSB0cmlnZ2VyaW5nIHRoZSBgc3RvcmU6aWRsZWAgZXZlbnRcbiAgLy9cbiAgdmFyIGlkbGVUaW1lb3V0ID0gMjAwMDtcblxuXG5cblxuICAvLyAtLS0tLS1cbiAgLy9cbiAgLy8gc2F2ZXMgdGhlIHBhc3NlZCBvYmplY3QgaW50byB0aGUgc3RvcmUgYW5kIHJlcGxhY2VzXG4gIC8vIGFuIGV2ZW50dWFsbHkgZXhpc3Rpbmcgb2JqZWN0IHdpdGggc2FtZSB0eXBlICYgaWQuXG4gIC8vXG4gIC8vIFdoZW4gaWQgaXMgdW5kZWZpbmVkLCBpdCBnZXRzIGdlbmVyYXRlZCBhbiBuZXcgb2JqZWN0IGdldHMgc2F2ZWRcbiAgLy9cbiAgLy8gSXQgYWxzbyBhZGRzIHRpbWVzdGFtcHMgYWxvbmcgdGhlIHdheTpcbiAgLy9cbiAgLy8gKiBgY3JlYXRlZEF0YCB1bmxlc3MgaXQgYWxyZWFkeSBleGlzdHNcbiAgLy8gKiBgdXBkYXRlZEF0YCBldmVyeSB0aW1lXG4gIC8vICogYF9zeW5jZWRBdGAgIGlmIGNoYW5nZXMgY29tZXMgZnJvbSByZW1vdGVcbiAgLy9cbiAgLy8gZXhhbXBsZSB1c2FnZTpcbiAgLy9cbiAgLy8gICAgIHN0b3JlLnNhdmUoJ2NhcicsIHVuZGVmaW5lZCwge2NvbG9yOiAncmVkJ30pXG4gIC8vICAgICBzdG9yZS5zYXZlKCdjYXInLCAnYWJjNDU2NycsIHtjb2xvcjogJ3JlZCd9KVxuICAvL1xuICBsb2NhbFN0b3JlLnNhdmUgPSBmdW5jdGlvbiBzYXZlKG9iamVjdCwgb3B0aW9ucykge1xuICAgIHZhciBjdXJyZW50T2JqZWN0LCBkZWZlciwgZXJyb3IsIGV2ZW50LCBpc05ldywga2V5O1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBpZiBzdG9yZSBpcyBjdXJyZW50bHkgYm9vdHN0cmFwcGluZyBkYXRhIGZyb20gcmVtb3RlLFxuICAgIC8vIHdlJ3JlIHF1ZXVlaW5nIGxvY2FsIHNhdmVzIHVudGlsIGl0J3MgZmluaXNoZWQuXG4gICAgaWYgKHN0b3JlLmlzQm9vdHN0cmFwcGluZygpICYmICFvcHRpb25zLnJlbW90ZSkge1xuICAgICAgcmV0dXJuIGVucXVldWUoJ3NhdmUnLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIC8vIGdlbmVyYXRlIGFuIGlkIGlmIG5lY2Vzc2FyeVxuICAgIGlmIChvYmplY3QuaWQpIHtcbiAgICAgIGN1cnJlbnRPYmplY3QgPSBjYWNoZShvYmplY3QudHlwZSwgb2JqZWN0LmlkKTtcbiAgICAgIGlzTmV3ID0gdHlwZW9mIGN1cnJlbnRPYmplY3QgIT09ICdvYmplY3QnO1xuICAgIH0gZWxzZSB7XG4gICAgICBpc05ldyA9IHRydWU7XG4gICAgICBvYmplY3QuaWQgPSBob29kaWUuZ2VuZXJhdGVJZCgpO1xuICAgIH1cblxuICAgIGlmIChpc05ldykge1xuICAgICAgLy8gYWRkIGNyZWF0ZWRCeSBoYXNoXG4gICAgICBvYmplY3QuY3JlYXRlZEJ5ID0gb2JqZWN0LmNyZWF0ZWRCeSB8fCBob29kaWUuYWNjb3VudC5vd25lckhhc2g7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gbGVhdmUgY3JlYXRlZEJ5IGhhc2hcbiAgICAgIGlmIChjdXJyZW50T2JqZWN0LmNyZWF0ZWRCeSkge1xuICAgICAgICBvYmplY3QuY3JlYXRlZEJ5ID0gY3VycmVudE9iamVjdC5jcmVhdGVkQnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaGFuZGxlIGxvY2FsIHByb3BlcnRpZXMgYW5kIGhpZGRlbiBwcm9wZXJ0aWVzIHdpdGggJCBwcmVmaXhcbiAgICAvLyBrZWVwIGxvY2FsIHByb3BlcnRpZXMgZm9yIHJlbW90ZSB1cGRhdGVzXG4gICAgaWYgKCFpc05ldykge1xuXG4gICAgICAvLyBmb3IgcmVtb3RlIHVwZGF0ZXMsIGtlZXAgbG9jYWwgcHJvcGVydGllcyAoc3RhcnRpbmcgd2l0aCAnXycpXG4gICAgICAvLyBmb3IgbG9jYWwgdXBkYXRlcywga2VlcCBoaWRkZW4gcHJvcGVydGllcyAoc3RhcnRpbmcgd2l0aCAnJCcpXG4gICAgICBmb3IgKGtleSBpbiBjdXJyZW50T2JqZWN0KSB7XG4gICAgICAgIGlmICghb2JqZWN0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICBzd2l0Y2ggKGtleS5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlICdfJzpcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbW90ZSkge1xuICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IGN1cnJlbnRPYmplY3Rba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJyQnOlxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnJlbW90ZSkge1xuICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IGN1cnJlbnRPYmplY3Rba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhZGQgdGltZXN0YW1wc1xuICAgIGlmIChvcHRpb25zLnJlbW90ZSkge1xuICAgICAgb2JqZWN0Ll9zeW5jZWRBdCA9IG5vdygpO1xuICAgIH0gZWxzZSBpZiAoIW9wdGlvbnMuc2lsZW50KSB7XG4gICAgICBvYmplY3QudXBkYXRlZEF0ID0gbm93KCk7XG4gICAgICBvYmplY3QuY3JlYXRlZEF0ID0gb2JqZWN0LmNyZWF0ZWRBdCB8fCBvYmplY3QudXBkYXRlZEF0O1xuICAgIH1cblxuICAgIC8vIGhhbmRsZSBsb2NhbCBjaGFuZ2VzXG4gICAgLy9cbiAgICAvLyBBIGxvY2FsIGNoYW5nZSBpcyBtZWFudCB0byBiZSByZXBsaWNhdGVkIHRvIHRoZVxuICAgIC8vIHVzZXJzIGRhdGFiYXNlLCBidXQgbm90IGJleW9uZC4gRm9yIGV4YW1wbGUgd2hlblxuICAgIC8vIEkgc3Vic2NyaWJlZCB0byBhIHNoYXJlIGJ1dCB0aGVuIGRlY2lkZSB0byB1bnN1YnNjcmliZSxcbiAgICAvLyBhbGwgb2JqZWN0cyBnZXQgcmVtb3ZlZCB3aXRoIGxvY2FsOiB0cnVlIGZsYWcsIHNvIHRoYXRcbiAgICAvLyB0aGV5IGdldCByZW1vdmVkIGZyb20gbXkgZGF0YWJhc2UsIGJ1dCB3b24ndCBhbnl3aGVyZSBlbHNlLlxuICAgIGlmIChvcHRpb25zLmxvY2FsKSB7XG4gICAgICBvYmplY3QuXyRsb2NhbCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBvYmplY3QuXyRsb2NhbDtcbiAgICB9XG5cbiAgICBkZWZlciA9IGhvb2RpZS5kZWZlcigpO1xuXG4gICAgdHJ5IHtcbiAgICAgIG9iamVjdCA9IGNhY2hlKG9iamVjdC50eXBlLCBvYmplY3QuaWQsIG9iamVjdCwgb3B0aW9ucyk7XG4gICAgICBkZWZlci5yZXNvbHZlKG9iamVjdCwgaXNOZXcpLnByb21pc2UoKTtcbiAgICAgIGV2ZW50ID0gaXNOZXcgPyAnYWRkJyA6ICd1cGRhdGUnO1xuICAgICAgdHJpZ2dlckV2ZW50cyhldmVudCwgb2JqZWN0LCBvcHRpb25zKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGVycm9yID0gX2Vycm9yO1xuICAgICAgZGVmZXIucmVqZWN0KGVycm9yLnRvU3RyaW5nKCkpO1xuICAgIH1cblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH07XG5cblxuICAvLyBmaW5kXG4gIC8vIC0tLS0tLVxuXG4gIC8vIGxvYWRzIG9uZSBvYmplY3QgZnJvbSBTdG9yZSwgc3BlY2lmaWVkIGJ5IGB0eXBlYCBhbmQgYGlkYFxuICAvL1xuICAvLyBleGFtcGxlIHVzYWdlOlxuICAvL1xuICAvLyAgICAgc3RvcmUuZmluZCgnY2FyJywgJ2FiYzQ1NjcnKVxuICBsb2NhbFN0b3JlLmZpbmQgPSBmdW5jdGlvbih0eXBlLCBpZCkge1xuICAgIHZhciBlcnJvciwgb2JqZWN0O1xuXG4gICAgLy8gaWYgc3RvcmUgaXMgY3VycmVudGx5IGJvb3RzdHJhcHBpbmcgZGF0YSBmcm9tIHJlbW90ZSxcbiAgICAvLyB3ZSdyZSBxdWV1ZWluZyB1bnRpbCBpdCdzIGZpbmlzaGVkXG4gICAgaWYgKHN0b3JlLmlzQm9vdHN0cmFwcGluZygpKSB7XG4gICAgICByZXR1cm4gZW5xdWV1ZSgnZmluZCcsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIG9iamVjdCA9IGNhY2hlKHR5cGUsIGlkKTtcbiAgICAgIGlmICghb2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aCh7XG4gICAgICAgICAgbmFtZTogJ0hvb2RpZU5vdEZvdW5kRXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6ICdcInt7dHlwZX19XCIgd2l0aCBpZCBcInt7aWR9fVwiIGNvdWxkIG5vdCBiZSBmb3VuZCdcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaG9vZGllLnJlc29sdmVXaXRoKG9iamVjdCk7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICBlcnJvciA9IF9lcnJvcjtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aChlcnJvcik7XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gZmluZEFsbFxuICAvLyAtLS0tLS0tLS1cblxuICAvLyByZXR1cm5zIGFsbCBvYmplY3RzIGZyb20gc3RvcmUuXG4gIC8vIENhbiBiZSBvcHRpb25hbGx5IGZpbHRlcmVkIGJ5IGEgdHlwZSBvciBhIGZ1bmN0aW9uXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2U6XG4gIC8vXG4gIC8vICAgICBzdG9yZS5maW5kQWxsKClcbiAgLy8gICAgIHN0b3JlLmZpbmRBbGwoJ2NhcicpXG4gIC8vICAgICBzdG9yZS5maW5kQWxsKGZ1bmN0aW9uKG9iaikgeyByZXR1cm4gb2JqLmJyYW5kID09ICdUZXNsYScgfSlcbiAgLy9cbiAgbG9jYWxTdG9yZS5maW5kQWxsID0gZnVuY3Rpb24gZmluZEFsbChmaWx0ZXIpIHtcbiAgICB2YXIgY3VycmVudFR5cGUsIGRlZmVyLCBlcnJvciwgaWQsIGtleSwga2V5cywgb2JqLCByZXN1bHRzLCB0eXBlO1xuXG5cblxuICAgIGlmIChmaWx0ZXIgPT0gbnVsbCkge1xuICAgICAgZmlsdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBpZiBzdG9yZSBpcyBjdXJyZW50bHkgYm9vdHN0cmFwcGluZyBkYXRhIGZyb20gcmVtb3RlLFxuICAgIC8vIHdlJ3JlIHF1ZXVlaW5nIHVudGlsIGl0J3MgZmluaXNoZWRcbiAgICBpZiAoc3RvcmUuaXNCb290c3RyYXBwaW5nKCkpIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKCdmaW5kQWxsJywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBrZXlzID0gc3RvcmUuaW5kZXgoKTtcblxuICAgIC8vIG5vcm1hbGl6ZSBmaWx0ZXJcbiAgICBpZiAodHlwZW9mIGZpbHRlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHR5cGUgPSBmaWx0ZXI7XG4gICAgICBmaWx0ZXIgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iai50eXBlID09PSB0eXBlO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBkZWZlciA9IGhvb2RpZS5kZWZlcigpO1xuXG4gICAgdHJ5IHtcblxuICAgICAgLy9cbiAgICAgIHJlc3VsdHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0ga2V5cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIGtleSA9IGtleXNbX2ldO1xuICAgICAgICAgIGlmICghKGlzU2VtYW50aWNLZXkoa2V5KSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfcmVmID0ga2V5LnNwbGl0KCcvJyksXG4gICAgICAgICAgY3VycmVudFR5cGUgPSBfcmVmWzBdLFxuICAgICAgICAgIGlkID0gX3JlZlsxXTtcblxuICAgICAgICAgIG9iaiA9IGNhY2hlKGN1cnJlbnRUeXBlLCBpZCk7XG4gICAgICAgICAgaWYgKG9iaiAmJiBmaWx0ZXIob2JqKSkge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChvYmopO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfSkuY2FsbCh0aGlzKTtcblxuICAgICAgLy8gc29ydCBmcm9tIG5ld2VzdCB0byBvbGRlc3RcbiAgICAgIHJlc3VsdHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIGlmIChhLmNyZWF0ZWRBdCA+IGIuY3JlYXRlZEF0KSB7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9IGVsc2UgaWYgKGEuY3JlYXRlZEF0IDwgYi5jcmVhdGVkQXQpIHtcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBkZWZlci5yZXNvbHZlKHJlc3VsdHMpLnByb21pc2UoKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGVycm9yID0gX2Vycm9yO1xuICAgICAgZGVmZXIucmVqZWN0KGVycm9yKS5wcm9taXNlKCk7XG4gICAgfVxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH07XG5cblxuICAvLyBSZW1vdmVcbiAgLy8gLS0tLS0tLS1cblxuICAvLyBSZW1vdmVzIG9uZSBvYmplY3Qgc3BlY2lmaWVkIGJ5IGB0eXBlYCBhbmQgYGlkYC5cbiAgLy9cbiAgLy8gd2hlbiBvYmplY3QgaGFzIGJlZW4gc3luY2VkIGJlZm9yZSwgbWFyayBpdCBhcyBkZWxldGVkLlxuICAvLyBPdGhlcndpc2UgcmVtb3ZlIGl0IGZyb20gU3RvcmUuXG4gIGxvY2FsU3RvcmUucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKHR5cGUsIGlkLCBvcHRpb25zKSB7XG4gICAgdmFyIGtleSwgb2JqZWN0LCBvYmplY3RXYXNNYXJrZWRBc0RlbGV0ZWQ7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIGlmIHN0b3JlIGlzIGN1cnJlbnRseSBib290c3RyYXBwaW5nIGRhdGEgZnJvbSByZW1vdGUsXG4gICAgLy8gd2UncmUgcXVldWVpbmcgbG9jYWwgcmVtb3ZlcyB1bnRpbCBpdCdzIGZpbmlzaGVkLlxuICAgIGlmIChzdG9yZS5pc0Jvb3RzdHJhcHBpbmcoKSAmJiAhb3B0aW9ucy5yZW1vdGUpIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKCdyZW1vdmUnLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIGtleSA9IHR5cGUgKyAnLycgKyBpZDtcblxuICAgIG9iamVjdCA9IGNhY2hlKHR5cGUsIGlkKTtcblxuICAgIC8vIGlmIGNoYW5nZSBjb21lcyBmcm9tIHJlbW90ZSwganVzdCBjbGVhbiB1cCBsb2NhbGx5XG4gICAgaWYgKG9wdGlvbnMucmVtb3RlKSB7XG4gICAgICBkYi5yZW1vdmVJdGVtKGtleSk7XG4gICAgICBvYmplY3RXYXNNYXJrZWRBc0RlbGV0ZWQgPSBjYWNoZWRPYmplY3Rba2V5XSAmJiBpc01hcmtlZEFzRGVsZXRlZChjYWNoZWRPYmplY3Rba2V5XSk7XG4gICAgICBjYWNoZWRPYmplY3Rba2V5XSA9IGZhbHNlO1xuICAgICAgY2xlYXJDaGFuZ2VkKHR5cGUsIGlkKTtcbiAgICAgIGlmIChvYmplY3RXYXNNYXJrZWRBc0RlbGV0ZWQgJiYgb2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZVdpdGgob2JqZWN0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIW9iamVjdCkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKHtcbiAgICAgICAgbmFtZTogJ0hvb2RpZU5vdEZvdW5kRXJyb3InLFxuICAgICAgICBtZXNzYWdlOiAnXCJ7e3R5cGV9fVwiIHdpdGggaWQgXCJ7e2lkfX1cIlwiIGNvdWxkIG5vdCBiZSBmb3VuZCdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChvYmplY3QuX3N5bmNlZEF0KSB7XG4gICAgICBvYmplY3QuX2RlbGV0ZWQgPSB0cnVlO1xuICAgICAgY2FjaGUodHlwZSwgaWQsIG9iamVjdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleSA9IHR5cGUgKyAnLycgKyBpZDtcbiAgICAgIGRiLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICAgIGNhY2hlZE9iamVjdFtrZXldID0gZmFsc2U7XG4gICAgICBjbGVhckNoYW5nZWQodHlwZSwgaWQpO1xuICAgIH1cblxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE0N1xuICAgIGlmIChvcHRpb25zLnVwZGF0ZSkge1xuICAgICAgb2JqZWN0ID0gb3B0aW9ucy51cGRhdGU7XG4gICAgICBkZWxldGUgb3B0aW9ucy51cGRhdGU7XG4gICAgfVxuICAgIHRyaWdnZXJFdmVudHMoJ3JlbW92ZScsIG9iamVjdCwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlV2l0aChvYmplY3QpO1xuICB9O1xuXG5cbiAgLy8gUmVtb3ZlIGFsbFxuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy8gUmVtb3ZlcyBvbmUgb2JqZWN0IHNwZWNpZmllZCBieSBgdHlwZWAgYW5kIGBpZGAuXG4gIC8vXG4gIC8vIHdoZW4gb2JqZWN0IGhhcyBiZWVuIHN5bmNlZCBiZWZvcmUsIG1hcmsgaXQgYXMgZGVsZXRlZC5cbiAgLy8gT3RoZXJ3aXNlIHJlbW92ZSBpdCBmcm9tIFN0b3JlLlxuICBsb2NhbFN0b3JlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uIHJlbW92ZUFsbCh0eXBlLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHN0b3JlLmZpbmRBbGwodHlwZSkudGhlbihmdW5jdGlvbihvYmplY3RzKSB7XG4gICAgICB2YXIgb2JqZWN0LCBfaSwgX2xlbiwgcmVzdWx0cztcblxuICAgICAgcmVzdWx0cyA9IFtdO1xuXG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG9iamVjdHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgb2JqZWN0ID0gb2JqZWN0c1tfaV07XG4gICAgICAgIHJlc3VsdHMucHVzaChzdG9yZS5yZW1vdmUob2JqZWN0LnR5cGUsIG9iamVjdC5pZCwgb3B0aW9ucykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyB2YWxpZGF0ZVxuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy9cbiAgZnVuY3Rpb24gdmFsaWRhdGUgKG9iamVjdCkge1xuXG4gICAgaWYgKEhvb2RpZU9iamVjdFR5cGVFcnJvci5pc0ludmFsaWQob2JqZWN0LnR5cGUpKSB7XG4gICAgICByZXR1cm4gbmV3IEhvb2RpZU9iamVjdFR5cGVFcnJvcih7XG4gICAgICAgIHR5cGU6IG9iamVjdC50eXBlXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIW9iamVjdC5pZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChIb29kaWVPYmplY3RJZEVycm9yLmlzSW52YWxpZChvYmplY3QuaWQpKSB7XG4gICAgICByZXR1cm4gbmV3IEhvb2RpZU9iamVjdElkRXJyb3Ioe1xuICAgICAgICBpZDogb2JqZWN0LmlkXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB2YXIgc3RvcmUgPSBob29kaWVTdG9yZUFwaShob29kaWUsIHtcblxuICAgIC8vIHZhbGlkYXRlXG4gICAgdmFsaWRhdGU6IHZhbGlkYXRlLFxuXG4gICAgYmFja2VuZDoge1xuICAgICAgc2F2ZTogbG9jYWxTdG9yZS5zYXZlLFxuICAgICAgZmluZDogbG9jYWxTdG9yZS5maW5kLFxuICAgICAgZmluZEFsbDogbG9jYWxTdG9yZS5maW5kQWxsLFxuICAgICAgcmVtb3ZlOiBsb2NhbFN0b3JlLnJlbW92ZSxcbiAgICAgIHJlbW92ZUFsbDogbG9jYWxTdG9yZS5yZW1vdmVBbGwsXG4gICAgfVxuICB9KTtcblxuXG5cbiAgLy8gZXh0ZW5kZWQgcHVibGljIEFQSVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG4gIC8vIGluZGV4XG4gIC8vIC0tLS0tLS1cblxuICAvLyBvYmplY3Qga2V5IGluZGV4XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjYWNoeVxuICBzdG9yZS5pbmRleCA9IGZ1bmN0aW9uIGluZGV4KCkge1xuICAgIHZhciBpLCBrZXksIGtleXMsIF9pLCBfcmVmO1xuICAgIGtleXMgPSBbXTtcbiAgICBmb3IgKGkgPSBfaSA9IDAsIF9yZWYgPSBkYi5sZW5ndGgoKTsgMCA8PSBfcmVmID8gX2kgPCBfcmVmIDogX2kgPiBfcmVmOyBpID0gMCA8PSBfcmVmID8gKytfaSA6IC0tX2kpIHtcbiAgICAgIGtleSA9IGRiLmtleShpKTtcbiAgICAgIGlmIChpc1NlbWFudGljS2V5KGtleSkpIHtcbiAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBrZXlzO1xuICB9O1xuXG5cbiAgLy8gY2hhbmdlZCBvYmplY3RzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmV0dXJucyBhbiBBcnJheSBvZiBhbGwgZGlydHkgZG9jdW1lbnRzXG4gIHN0b3JlLmNoYW5nZWRPYmplY3RzID0gZnVuY3Rpb24gY2hhbmdlZE9iamVjdHMoKSB7XG4gICAgdmFyIGlkLCBrZXksIG9iamVjdCwgdHlwZSwgX3JlZiwgX3JlZjEsIF9yZXN1bHRzO1xuXG4gICAgX3JlZiA9IGRpcnR5O1xuICAgIF9yZXN1bHRzID0gW107XG5cbiAgICBmb3IgKGtleSBpbiBfcmVmKSB7XG4gICAgICBpZiAoX3JlZi5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIG9iamVjdCA9IF9yZWZba2V5XTtcbiAgICAgICAgX3JlZjEgPSBrZXkuc3BsaXQoJy8nKSxcbiAgICAgICAgdHlwZSA9IF9yZWYxWzBdLFxuICAgICAgICBpZCA9IF9yZWYxWzFdO1xuICAgICAgICBvYmplY3QudHlwZSA9IHR5cGU7XG4gICAgICAgIG9iamVjdC5pZCA9IGlkO1xuICAgICAgICBfcmVzdWx0cy5wdXNoKG9iamVjdCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBfcmVzdWx0cztcbiAgfTtcblxuXG4gIC8vIElzIGRpcnR5P1xuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy8gV2hlbiBubyBhcmd1bWVudHMgcGFzc2VkLCByZXR1cm5zIGB0cnVlYCBvciBgZmFsc2VgIGRlcGVuZGluZyBvbiBpZiB0aGVyZSBhcmVcbiAgLy8gZGlydHkgb2JqZWN0cyBpbiB0aGUgc3RvcmUuXG4gIC8vXG4gIC8vIE90aGVyd2lzZSBpdCByZXR1cm5zIGB0cnVlYCBvciBgZmFsc2VgIGZvciB0aGUgcGFzc2VkIG9iamVjdC4gQW4gb2JqZWN0IGlzIGRpcnR5XG4gIC8vIGlmIGl0IGhhcyBubyBgX3N5bmNlZEF0YCBhdHRyaWJ1dGUgb3IgaWYgYHVwZGF0ZWRBdGAgaXMgbW9yZSByZWNlbnQgdGhhbiBgX3N5bmNlZEF0YFxuICBzdG9yZS5oYXNMb2NhbENoYW5nZXMgPSBmdW5jdGlvbih0eXBlLCBpZCkge1xuICAgIGlmICghdHlwZSkge1xuICAgICAgcmV0dXJuICEkLmlzRW1wdHlPYmplY3QoZGlydHkpO1xuICAgIH1cbiAgICB2YXIga2V5ID0gW3R5cGUsaWRdLmpvaW4oJy8nKTtcbiAgICBpZiAoZGlydHlba2V5XSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBoYXNMb2NhbENoYW5nZXMoY2FjaGUodHlwZSwgaWQpKTtcbiAgfTtcblxuXG4gIC8vIENsZWFyXG4gIC8vIC0tLS0tLVxuXG4gIC8vIGNsZWFycyBsb2NhbFN0b3JhZ2UgYW5kIGNhY2hlXG4gIC8vIFRPRE86IGRvIG5vdCBjbGVhciBlbnRpcmUgbG9jYWxTdG9yYWdlLCBjbGVhciBvbmx5IHRoZSBpdGVtcyB0aGF0IGhhdmUgYmVlbiBzdG9yZWRcbiAgLy8gICAgICAgdXNpbmcgYGhvb2RpZS5zdG9yZWAgYmVmb3JlLlxuICBzdG9yZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHZhciBkZWZlciwga2V5LCBrZXlzLCByZXN1bHRzO1xuICAgIGRlZmVyID0gaG9vZGllLmRlZmVyKCk7XG4gICAgdHJ5IHtcbiAgICAgIGtleXMgPSBzdG9yZS5pbmRleCgpO1xuICAgICAgcmVzdWx0cyA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIF9pLCBfbGVuLCBfcmVzdWx0cztcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBrZXlzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAga2V5ID0ga2V5c1tfaV07XG4gICAgICAgICAgaWYgKGlzU2VtYW50aWNLZXkoa2V5KSkge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChkYi5yZW1vdmVJdGVtKGtleSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9KS5jYWxsKHRoaXMpO1xuICAgICAgY2FjaGVkT2JqZWN0ID0ge307XG4gICAgICBjbGVhckNoYW5nZWQoKTtcbiAgICAgIGRlZmVyLnJlc29sdmUoKTtcbiAgICAgIHN0b3JlLnRyaWdnZXIoJ2NsZWFyJyk7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICBkZWZlci5yZWplY3QoX2Vycm9yKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfTtcblxuXG4gIC8vIGlzQm9vdHN0cmFwcGluZ1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHJldHVybnMgdHJ1ZSBpZiBzdG9yZSBpcyBjdXJyZW50bHkgYm9vdHN0cmFwcGluZyBkYXRhIGZyb20gcmVtb3RlLFxuICAvLyBvdGhlcndpc2UgZmFsc2UuXG4gIHZhciBib290c3RyYXBwaW5nID0gZmFsc2U7XG4gIHN0b3JlLmlzQm9vdHN0cmFwcGluZyA9IGZ1bmN0aW9uIGlzQm9vdHN0cmFwcGluZygpIHtcbiAgICByZXR1cm4gYm9vdHN0cmFwcGluZztcbiAgfTtcblxuXG4gIC8vIElzIHBlcnNpc3RhbnQ/XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyByZXR1cm5zIGB0cnVlYCBvciBgZmFsc2VgIGRlcGVuZGluZyBvbiB3aGV0aGVyIGxvY2FsU3RvcmFnZSBpcyBzdXBwb3J0ZWQgb3Igbm90LlxuICAvLyBCZXdhcmUgdGhhdCBzb21lIGJyb3dzZXJzIGxpa2UgU2FmYXJpIGRvIG5vdCBzdXBwb3J0IGxvY2FsU3RvcmFnZSBpbiBwcml2YXRlIG1vZGUuXG4gIC8vXG4gIC8vIGluc3BpcmVkIGJ5IHRoaXMgY2FwcHVjY2lubyBjb21taXRcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2NhcHB1Y2Npbm8vY2FwcHVjY2luby9jb21taXQvMDYzYjA1ZDk2NDNjMzViMzAzNTY4YTI4ODA5ZTRlYjMyMjRmNzFlY1xuICAvL1xuICBzdG9yZS5pc1BlcnNpc3RlbnQgPSBmdW5jdGlvbiBpc1BlcnNpc3RlbnQoKSB7XG4gICAgdHJ5IHtcblxuICAgICAgLy8gd2UndmUgdG8gcHV0IHRoaXMgaW4gaGVyZS4gSSd2ZSBzZWVuIEZpcmVmb3ggdGhyb3dpbmcgYFNlY3VyaXR5IGVycm9yOiAxMDAwYFxuICAgICAgLy8gd2hlbiBjb29raWVzIGhhdmUgYmVlbiBkaXNhYmxlZFxuICAgICAgaWYgKCF3aW5kb3cubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gSnVzdCBiZWNhdXNlIGxvY2FsU3RvcmFnZSBleGlzdHMgZG9lcyBub3QgbWVhbiBpdCB3b3Jrcy4gSW4gcGFydGljdWxhciBpdCBtaWdodCBiZSBkaXNhYmxlZFxuICAgICAgLy8gYXMgaXQgaXMgd2hlbiBTYWZhcmkncyBwcml2YXRlIGJyb3dzaW5nIG1vZGUgaXMgYWN0aXZlLlxuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ1N0b3JhZ2UtVGVzdCcsICcxJyk7XG5cbiAgICAgIC8vIHRoYXQgc2hvdWxkIG5vdCBoYXBwZW4gLi4uXG4gICAgICBpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ1N0b3JhZ2UtVGVzdCcpICE9PSAnMScpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBva2F5LCBsZXQncyBjbGVhbiB1cCBpZiB3ZSBnb3QgaGVyZS5cbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdTdG9yYWdlLVRlc3QnKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcblxuICAgICAgLy8gaW4gY2FzZSBvZiBhbiBlcnJvciwgbGlrZSBTYWZhcmkncyBQcml2YXRlIE1vZGUsIHJldHVybiBmYWxzZVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIHdlJ3JlIGdvb2QuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cblxuXG5cbiAgLy9cbiAgLy8gUHJpdmF0ZSBtZXRob2RzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vXG5cblxuICAvLyBsb2NhbFN0b3JhZ2UgcHJveHlcbiAgLy9cbiAgdmFyIGRiID0ge1xuICAgIGdldEl0ZW06IGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICAgIH0sXG4gICAgc2V0SXRlbTogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIHZhbHVlKTtcbiAgICB9LFxuICAgIHJlbW92ZUl0ZW06IGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xuICAgIH0sXG4gICAga2V5OiBmdW5jdGlvbihucikge1xuICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2Uua2V5KG5yKTtcbiAgICB9LFxuICAgIGxlbmd0aDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5sZW5ndGg7XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gQ2FjaGVcbiAgLy8gLS0tLS0tLVxuXG4gIC8vIGxvYWRzIGFuIG9iamVjdCBzcGVjaWZpZWQgYnkgYHR5cGVgIGFuZCBgaWRgIG9ubHkgb25jZSBmcm9tIGxvY2FsU3RvcmFnZVxuICAvLyBhbmQgY2FjaGVzIGl0IGZvciBmYXN0ZXIgZnV0dXJlIGFjY2Vzcy4gVXBkYXRlcyBjYWNoZSB3aGVuIGB2YWx1ZWAgaXMgcGFzc2VkLlxuICAvL1xuICAvLyBBbHNvIGNoZWNrcyBpZiBvYmplY3QgbmVlZHMgdG8gYmUgc3luY2hlZCAoZGlydHkpIG9yIG5vdFxuICAvL1xuICAvLyBQYXNzIGBvcHRpb25zLnJlbW90ZSA9IHRydWVgIHdoZW4gb2JqZWN0IGNvbWVzIGZyb20gcmVtb3RlXG4gIC8vIFBhc3MgJ29wdGlvbnMuc2lsZW50ID0gdHJ1ZScgdG8gYXZvaWQgZXZlbnRzIGZyb20gYmVpbmcgdHJpZ2dlcmVkLlxuICBmdW5jdGlvbiBjYWNoZSh0eXBlLCBpZCwgb2JqZWN0LCBvcHRpb25zKSB7XG4gICAgdmFyIGtleTtcblxuICAgIGlmIChvYmplY3QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgb2JqZWN0ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAga2V5ID0gJycgKyB0eXBlICsgJy8nICsgaWQ7XG5cbiAgICBpZiAob2JqZWN0KSB7XG4gICAgICBleHRlbmQob2JqZWN0LCB7XG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIGlkOiBpZFxuICAgICAgfSk7XG5cbiAgICAgIHNldE9iamVjdCh0eXBlLCBpZCwgb2JqZWN0KTtcblxuICAgICAgaWYgKG9wdGlvbnMucmVtb3RlKSB7XG4gICAgICAgIGNsZWFyQ2hhbmdlZCh0eXBlLCBpZCk7XG4gICAgICAgIGNhY2hlZE9iamVjdFtrZXldID0gZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpO1xuICAgICAgICByZXR1cm4gY2FjaGVkT2JqZWN0W2tleV07XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAvLyBpZiB0aGUgY2FjaGVkIGtleSByZXR1cm5zIGZhbHNlLCBpdCBtZWFuc1xuICAgICAgLy8gdGhhdCB3ZSBoYXZlIHJlbW92ZWQgdGhhdCBrZXkuIFdlIGp1c3RcbiAgICAgIC8vIHNldCBpdCB0byBmYWxzZSBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgc29cbiAgICAgIC8vIHRoYXQgd2UgZG9uJ3QgbmVlZCB0byBsb29rIGl0IHVwIGFnYWluIGluIGxvY2FsU3RvcmFnZVxuICAgICAgaWYgKGNhY2hlZE9iamVjdFtrZXldID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIGtleSBpcyBjYWNoZWQsIHJldHVybiBpdC4gQnV0IG1ha2Ugc3VyZVxuICAgICAgLy8gdG8gbWFrZSBhIGRlZXAgY29weSBiZWZvcmVoYW5kICg9PiB0cnVlKVxuICAgICAgaWYgKGNhY2hlZE9iamVjdFtrZXldKSB7XG4gICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgY2FjaGVkT2JqZWN0W2tleV0pO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiBvYmplY3QgaXMgbm90IHlldCBjYWNoZWQsIGxvYWQgaXQgZnJvbSBsb2NhbFN0b3JlXG4gICAgICBvYmplY3QgPSBnZXRPYmplY3QodHlwZSwgaWQpO1xuXG4gICAgICAvLyBzdG9wIGhlcmUgaWYgb2JqZWN0IGRpZCBub3QgZXhpc3QgaW4gbG9jYWxTdG9yZVxuICAgICAgLy8gYW5kIGNhY2hlIGl0IHNvIHdlIGRvbid0IG5lZWQgdG8gbG9vayBpdCB1cCBhZ2FpblxuICAgICAgaWYgKG9iamVjdCA9PT0gZmFsc2UpIHtcbiAgICAgICAgY2xlYXJDaGFuZ2VkKHR5cGUsIGlkKTtcbiAgICAgICAgY2FjaGVkT2JqZWN0W2tleV0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgaWYgKGlzTWFya2VkQXNEZWxldGVkKG9iamVjdCkpIHtcbiAgICAgIG1hcmtBc0NoYW5nZWQodHlwZSwgaWQsIG9iamVjdCwgb3B0aW9ucyk7XG4gICAgICBjYWNoZWRPYmplY3Rba2V5XSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGhlcmUgaXMgd2hlcmUgd2UgY2FjaGUgdGhlIG9iamVjdCBmb3JcbiAgICAvLyBmdXR1cmUgcXVpY2sgYWNjZXNzXG4gICAgY2FjaGVkT2JqZWN0W2tleV0gPSAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KTtcblxuICAgIGlmIChoYXNMb2NhbENoYW5nZXMob2JqZWN0KSkge1xuICAgICAgbWFya0FzQ2hhbmdlZCh0eXBlLCBpZCwgY2FjaGVkT2JqZWN0W2tleV0sIG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjbGVhckNoYW5nZWQodHlwZSwgaWQpO1xuICAgIH1cblxuICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KTtcbiAgfVxuXG5cbiAgLy8gYm9vdHN0cmFwcGluZyBkaXJ0eSBvYmplY3RzLCB0byBtYWtlIHN1cmVcbiAgLy8gdGhhdCByZW1vdmVkIG9iamVjdHMgZ2V0IHB1c2hlZCBhZnRlclxuICAvLyBwYWdlIHJlbG9hZC5cbiAgLy9cbiAgZnVuY3Rpb24gYm9vdHN0cmFwRGlydHlPYmplY3RzKCkge1xuICAgIHZhciBpZCwga2V5cywgb2JqLCB0eXBlLCBfaSwgX2xlbiwgX3JlZjtcbiAgICBrZXlzID0gZGIuZ2V0SXRlbSgnX2RpcnR5Jyk7XG5cbiAgICBpZiAoIWtleXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBrZXlzID0ga2V5cy5zcGxpdCgnLCcpO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0ga2V5cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgX3JlZiA9IGtleXNbX2ldLnNwbGl0KCcvJyksXG4gICAgICB0eXBlID0gX3JlZlswXSxcbiAgICAgIGlkID0gX3JlZlsxXTtcbiAgICAgIG9iaiA9IGNhY2hlKHR5cGUsIGlkKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vXG4gIC8vIHN1YnNjcmliZSB0byBldmVudHMgY29taW5nIGZyb20gYWNjb3VudCAmIG91ciByZW1vdGUgc3RvcmUuXG4gIC8vXG4gIGZ1bmN0aW9uIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpIHtcblxuICAgIC8vIGFjY291bnQgZXZlbnRzXG4gICAgaG9vZGllLm9uKCdhY2NvdW50OmNsZWFudXAnLCBzdG9yZS5jbGVhcik7XG4gICAgaG9vZGllLm9uKCdhY2NvdW50OnNpZ251cCcsIG1hcmtBbGxBc0NoYW5nZWQpO1xuICAgIGhvb2RpZS5vbigncmVtb3RlOmJvb3RzdHJhcDpzdGFydCcsIHN0YXJ0Qm9vdHN0cmFwcGluZ01vZGUpO1xuICAgIGhvb2RpZS5vbigncmVtb3RlOmJvb3RzdHJhcDplbmQnLCBlbmRCb290c3RyYXBwaW5nTW9kZSk7XG5cbiAgICAvLyByZW1vdGUgZXZlbnRzXG4gICAgaG9vZGllLm9uKCdyZW1vdGU6Y2hhbmdlJywgaGFuZGxlUmVtb3RlQ2hhbmdlKTtcbiAgICBob29kaWUub24oJ3JlbW90ZTpwdXNoJywgaGFuZGxlUHVzaGVkT2JqZWN0KTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9uY2UgZnJvbSBvdXRzaWRlXG4gIHN0b3JlLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuICAgIGRlbGV0ZSBzdG9yZS5zdWJzY3JpYmVUb091dHNpZGVFdmVudHM7XG4gIH07XG5cblxuICAvL1xuICAvLyBNYXJrcyBvYmplY3QgYXMgY2hhbmdlZCAoZGlydHkpLiBUcmlnZ2VycyBhIGBzdG9yZTpkaXJ0eWAgZXZlbnQgaW1tZWRpYXRlbHkgYW5kIGFcbiAgLy8gYHN0b3JlOmlkbGVgIGV2ZW50IG9uY2UgdGhlcmUgaXMgbm8gY2hhbmdlIHdpdGhpbiAyIHNlY29uZHNcbiAgLy9cbiAgZnVuY3Rpb24gbWFya0FzQ2hhbmdlZCh0eXBlLCBpZCwgb2JqZWN0LCBvcHRpb25zKSB7XG4gICAgdmFyIGtleTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGtleSA9ICcnICsgdHlwZSArICcvJyArIGlkO1xuXG4gICAgZGlydHlba2V5XSA9IG9iamVjdDtcbiAgICBzYXZlRGlydHlJZHMoKTtcblxuICAgIGlmIChvcHRpb25zLnNpbGVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyaWdnZXJEaXJ0eUFuZElkbGVFdmVudHMoKTtcbiAgfVxuXG4gIC8vIENsZWFyIGNoYW5nZWRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmVtb3ZlcyBhbiBvYmplY3QgZnJvbSB0aGUgbGlzdCBvZiBvYmplY3RzIHRoYXQgYXJlIGZsYWdnZWQgdG8gYnkgc3luY2hlZCAoZGlydHkpXG4gIC8vIGFuZCB0cmlnZ2VycyBhIGBzdG9yZTpkaXJ0eWAgZXZlbnRcbiAgZnVuY3Rpb24gY2xlYXJDaGFuZ2VkKHR5cGUsIGlkKSB7XG4gICAgdmFyIGtleTtcbiAgICBpZiAodHlwZSAmJiBpZCkge1xuICAgICAga2V5ID0gJycgKyB0eXBlICsgJy8nICsgaWQ7XG4gICAgICBkZWxldGUgZGlydHlba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGlydHkgPSB7fTtcbiAgICB9XG4gICAgc2F2ZURpcnR5SWRzKCk7XG4gICAgcmV0dXJuIHdpbmRvdy5jbGVhclRpbWVvdXQoZGlydHlUaW1lb3V0KTtcbiAgfVxuXG5cbiAgLy8gTWFyayBhbGwgYXMgY2hhbmdlZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBNYXJrcyBhbGwgbG9jYWwgb2JqZWN0IGFzIGNoYW5nZWQgKGRpcnR5KSB0byBtYWtlIHRoZW0gc3luY1xuICAvLyB3aXRoIHJlbW90ZVxuICBmdW5jdGlvbiBtYXJrQWxsQXNDaGFuZ2VkKCkge1xuICAgIHJldHVybiBzdG9yZS5maW5kQWxsKCkucGlwZShmdW5jdGlvbihvYmplY3RzKSB7XG4gICAgICB2YXIga2V5LCBvYmplY3QsIF9pLCBfbGVuO1xuXG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG9iamVjdHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgb2JqZWN0ID0gb2JqZWN0c1tfaV07XG4gICAgICAgIGtleSA9ICcnICsgb2JqZWN0LnR5cGUgKyAnLycgKyBvYmplY3QuaWQ7XG4gICAgICAgIGRpcnR5W2tleV0gPSBvYmplY3Q7XG4gICAgICB9XG5cbiAgICAgIHNhdmVEaXJ0eUlkcygpO1xuICAgICAgdHJpZ2dlckRpcnR5QW5kSWRsZUV2ZW50cygpO1xuICAgIH0pO1xuICB9XG5cblxuICAvLyB3aGVuIGEgY2hhbmdlIGNvbWUncyBmcm9tIG91ciByZW1vdGUgc3RvcmUsIHdlIGRpZmZlcmVudGlhdGVcbiAgLy8gd2hldGhlciBhbiBvYmplY3QgaGFzIGJlZW4gcmVtb3ZlZCBvciBhZGRlZCAvIHVwZGF0ZWQgYW5kXG4gIC8vIHJlZmxlY3QgdGhlIGNoYW5nZSBpbiBvdXIgbG9jYWwgc3RvcmUuXG4gIGZ1bmN0aW9uIGhhbmRsZVJlbW90ZUNoYW5nZSh0eXBlT2ZDaGFuZ2UsIG9iamVjdCkge1xuICAgIGlmICh0eXBlT2ZDaGFuZ2UgPT09ICdyZW1vdmUnKSB7XG4gICAgICBzdG9yZS5yZW1vdmUob2JqZWN0LnR5cGUsIG9iamVjdC5pZCwge1xuICAgICAgICByZW1vdGU6IHRydWUsXG4gICAgICAgIHVwZGF0ZTogb2JqZWN0XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RvcmUuc2F2ZShvYmplY3QudHlwZSwgb2JqZWN0LmlkLCBvYmplY3QsIHtcbiAgICAgICAgcmVtb3RlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuXG4gIC8vXG4gIC8vIGFsbCBsb2NhbCBjaGFuZ2VzIGdldCBidWxrIHB1c2hlZC4gRm9yIGVhY2ggb2JqZWN0IHdpdGggbG9jYWxcbiAgLy8gY2hhbmdlcyB0aGF0IGhhcyBiZWVuIHB1c2hlZCB3ZSB0cmlnZ2VyIGEgc3luYyBldmVudFxuICBmdW5jdGlvbiBoYW5kbGVQdXNoZWRPYmplY3Qob2JqZWN0KSB7XG4gICAgdHJpZ2dlckV2ZW50cygnc3luYycsIG9iamVjdCk7XG4gIH1cblxuXG4gIC8vIG1vcmUgYWR2YW5jZWQgbG9jYWxTdG9yYWdlIHdyYXBwZXJzIHRvIGZpbmQvc2F2ZSBvYmplY3RzXG4gIGZ1bmN0aW9uIHNldE9iamVjdCh0eXBlLCBpZCwgb2JqZWN0KSB7XG4gICAgdmFyIGtleSwgc3RvcmU7XG5cbiAgICBrZXkgPSAnJyArIHR5cGUgKyAnLycgKyBpZDtcbiAgICBzdG9yZSA9ICQuZXh0ZW5kKHt9LCBvYmplY3QpO1xuXG4gICAgZGVsZXRlIHN0b3JlLnR5cGU7XG4gICAgZGVsZXRlIHN0b3JlLmlkO1xuICAgIHJldHVybiBkYi5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkoc3RvcmUpKTtcbiAgfVxuICBmdW5jdGlvbiBnZXRPYmplY3QodHlwZSwgaWQpIHtcbiAgICB2YXIga2V5LCBvYmo7XG5cbiAgICBrZXkgPSAnJyArIHR5cGUgKyAnLycgKyBpZDtcbiAgICB2YXIganNvbiA9IGRiLmdldEl0ZW0oa2V5KTtcblxuICAgIGlmIChqc29uKSB7XG4gICAgICBvYmogPSBKU09OLnBhcnNlKGpzb24pO1xuICAgICAgb2JqLnR5cGUgPSB0eXBlO1xuICAgICAgb2JqLmlkID0gaWQ7XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cblxuICAvLyBzdG9yZSBJRHMgb2YgZGlydHkgb2JqZWN0c1xuICBmdW5jdGlvbiBzYXZlRGlydHlJZHMoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICgkLmlzRW1wdHlPYmplY3QoZGlydHkpKSB7XG4gICAgICAgIGRiLnJlbW92ZUl0ZW0oJ19kaXJ0eScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGlkcyA9IE9iamVjdC5rZXlzKGRpcnR5KTtcbiAgICAgICAgZGIuc2V0SXRlbSgnX2RpcnR5JywgaWRzLmpvaW4oJywnKSk7XG4gICAgICB9XG4gICAgfSBjYXRjaChlKSB7fVxuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gbm93KCkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShuZXcgRGF0ZSgpKS5yZXBsYWNlKC9bJ1wiXS9nLCAnJyk7XG4gIH1cblxuXG4gIC8vIGEgc2VtYW50aWMga2V5IGNvbnNpc3RzIG9mIGEgdmFsaWQgdHlwZSAmIGlkLCBzZXBhcmF0ZWQgYnkgYSBcIi9cIlxuICB2YXIgc2VtYW50aWNJZFBhdHRlcm4gPSBuZXcgUmVnRXhwKC9eW2EteiRdW2EtejAtOV0rXFwvW2EtejAtOV0rJC8pO1xuICBmdW5jdGlvbiBpc1NlbWFudGljS2V5KGtleSkge1xuICAgIHJldHVybiBzZW1hbnRpY0lkUGF0dGVybi50ZXN0KGtleSk7XG4gIH1cblxuICAvLyBgaGFzTG9jYWxDaGFuZ2VzYCByZXR1cm5zIHRydWUgaWYgdGhlcmUgaXMgYSBsb2NhbCBjaGFuZ2UgdGhhdFxuICAvLyBoYXMgbm90IGJlZW4gc3luYydkIHlldC5cbiAgZnVuY3Rpb24gaGFzTG9jYWxDaGFuZ2VzKG9iamVjdCkge1xuICAgIGlmICghb2JqZWN0LnVwZGF0ZWRBdCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIW9iamVjdC5fc3luY2VkQXQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0Ll9zeW5jZWRBdCA8IG9iamVjdC51cGRhdGVkQXQ7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBpc01hcmtlZEFzRGVsZXRlZChvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0Ll9kZWxldGVkID09PSB0cnVlO1xuICB9XG5cbiAgLy8gdGhpcyBpcyB3aGVyZSBhbGwgdGhlIHN0b3JlIGV2ZW50cyBnZXQgdHJpZ2dlcmVkLFxuICAvLyBsaWtlIGFkZDp0YXNrLCBjaGFuZ2U6bm90ZTphYmM0NTY3LCByZW1vdmUsIGV0Yy5cbiAgZnVuY3Rpb24gdHJpZ2dlckV2ZW50cyhldmVudE5hbWUsIG9iamVjdCwgb3B0aW9ucykge1xuICAgIHN0b3JlLnRyaWdnZXIoZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG4gICAgc3RvcmUudHJpZ2dlcihvYmplY3QudHlwZSArICc6JyArIGV2ZW50TmFtZSwgJC5leHRlbmQodHJ1ZSwge30sIG9iamVjdCksIG9wdGlvbnMpO1xuXG4gICAgLy8gREVQUkVDQVRFRFxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE0NlxuICAgIHN0b3JlLnRyaWdnZXIoZXZlbnROYW1lICsgJzonICsgb2JqZWN0LnR5cGUsICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcblxuICAgIGlmIChldmVudE5hbWUgIT09ICduZXcnKSB7XG4gICAgICBzdG9yZS50cmlnZ2VyKCBvYmplY3QudHlwZSArICc6JyArIG9iamVjdC5pZCsgJzonICsgZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cbiAgICAgIC8vIERFUFJFQ0FURURcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE0NlxuICAgICAgc3RvcmUudHJpZ2dlciggZXZlbnROYW1lICsgJzonICsgb2JqZWN0LnR5cGUgKyAnOicgKyBvYmplY3QuaWQsICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcbiAgICB9XG5cblxuXG4gICAgLy8gc3luYyBldmVudHMgaGF2ZSBubyBjaGFuZ2VzLCBzbyB3ZSBkb24ndCB0cmlnZ2VyXG4gICAgLy8gXCJjaGFuZ2VcIiBldmVudHMuXG4gICAgaWYgKGV2ZW50TmFtZSA9PT0gJ3N5bmMnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3RvcmUudHJpZ2dlcignY2hhbmdlJywgZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG4gICAgc3RvcmUudHJpZ2dlcihvYmplY3QudHlwZSArICc6Y2hhbmdlJywgZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cbiAgICAvLyBERVBSRUNBVEVEXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hvb2RpZWhxL2hvb2RpZS5qcy9pc3N1ZXMvMTQ2XG4gICAgc3RvcmUudHJpZ2dlcignY2hhbmdlOicgKyBvYmplY3QudHlwZSwgZXZlbnROYW1lLCAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cblxuICAgIGlmIChldmVudE5hbWUgIT09ICduZXcnKSB7XG4gICAgICBzdG9yZS50cmlnZ2VyKG9iamVjdC50eXBlICsgJzonICsgb2JqZWN0LmlkICsgJzpjaGFuZ2UnLCBldmVudE5hbWUsICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcblxuICAgICAgLy8gREVQUkVDQVRFRFxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hvb2RpZWhxL2hvb2RpZS5qcy9pc3N1ZXMvMTQ2XG4gICAgICBzdG9yZS50cmlnZ2VyKCdjaGFuZ2U6JyArIG9iamVjdC50eXBlICsgJzonICsgb2JqZWN0LmlkLCBldmVudE5hbWUsICQuZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICAvLyB3aGVuIGFuIG9iamVjdCBnZXRzIGNoYW5nZWQsIHR3byBzcGVjaWFsIGV2ZW50cyBnZXQgdHJpZ2dlcmQ6XG4gIC8vXG4gIC8vIDEuIGRpcnR5IGV2ZW50XG4gIC8vICAgIHRoZSBgZGlydHlgIGV2ZW50IGdldHMgdHJpZ2dlcmVkIGltbWVkaWF0ZWx5LCBmb3IgZXZlcnlcbiAgLy8gICAgY2hhbmdlIHRoYXQgaGFwcGVucy5cbiAgLy8gMi4gaWRsZSBldmVudFxuICAvLyAgICB0aGUgYGlkbGVgIGV2ZW50IGdldHMgdHJpZ2dlcmVkIGFmdGVyIGEgc2hvcnQgdGltZW91dCBvZlxuICAvLyAgICBubyBjaGFuZ2VzLCBlLmcuIDIgc2Vjb25kcy5cbiAgdmFyIGRpcnR5VGltZW91dDtcbiAgZnVuY3Rpb24gdHJpZ2dlckRpcnR5QW5kSWRsZUV2ZW50cygpIHtcbiAgICBzdG9yZS50cmlnZ2VyKCdkaXJ0eScpO1xuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoZGlydHlUaW1lb3V0KTtcblxuICAgIGRpcnR5VGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgc3RvcmUudHJpZ2dlcignaWRsZScsIHN0b3JlLmNoYW5nZWRPYmplY3RzKCkpO1xuICAgIH0sIGlkbGVUaW1lb3V0KTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIHN0YXJ0Qm9vdHN0cmFwcGluZ01vZGUoKSB7XG4gICAgYm9vdHN0cmFwcGluZyA9IHRydWU7XG4gICAgc3RvcmUudHJpZ2dlcignYm9vdHN0cmFwOnN0YXJ0Jyk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBlbmRCb290c3RyYXBwaW5nTW9kZSgpIHtcbiAgICB2YXIgbWV0aG9kQ2FsbCwgbWV0aG9kLCBhcmdzLCBkZWZlcjtcblxuICAgIGJvb3RzdHJhcHBpbmcgPSBmYWxzZTtcbiAgICB3aGlsZShxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICBtZXRob2RDYWxsID0gcXVldWUuc2hpZnQoKTtcbiAgICAgIG1ldGhvZCA9IG1ldGhvZENhbGxbMF07XG4gICAgICBhcmdzID0gbWV0aG9kQ2FsbFsxXTtcbiAgICAgIGRlZmVyID0gbWV0aG9kQ2FsbFsyXTtcbiAgICAgIGxvY2FsU3RvcmVbbWV0aG9kXS5hcHBseShsb2NhbFN0b3JlLCBhcmdzKS50aGVuKGRlZmVyLnJlc29sdmUsIGRlZmVyLnJlamVjdCk7XG4gICAgfVxuXG4gICAgc3RvcmUudHJpZ2dlcignYm9vdHN0cmFwOmVuZCcpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gZW5xdWV1ZShtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgZGVmZXIgPSBob29kaWUuZGVmZXIoKTtcbiAgICBxdWV1ZS5wdXNoKFttZXRob2QsIGFyZ3MsIGRlZmVyXSk7XG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIC8vIHBhdGNoSWZOb3RQZXJzaXN0YW50XG4gIC8vXG4gIGZ1bmN0aW9uIHBhdGNoSWZOb3RQZXJzaXN0YW50ICgpIHtcbiAgICBpZiAoIXN0b3JlLmlzUGVyc2lzdGVudCgpKSB7XG4gICAgICBkYiA9IHtcbiAgICAgICAgZ2V0SXRlbTogZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9LFxuICAgICAgICBzZXRJdGVtOiBmdW5jdGlvbigpIHsgcmV0dXJuIG51bGw7IH0sXG4gICAgICAgIHJlbW92ZUl0ZW06IGZ1bmN0aW9uKCkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgICAga2V5OiBmdW5jdGlvbigpIHsgcmV0dXJuIG51bGw7IH0sXG4gICAgICAgIGxlbmd0aDogZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG5cbiAgLy9cbiAgLy8gaW5pdGlhbGl6YXRpb25cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuICAvL1xuXG4gIC8vIGlmIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBsb2NhbCBzdG9yYWdlIHBlcnNpc3RlbmNlLFxuICAvLyBlLmcuIFNhZmFyaSBpbiBwcml2YXRlIG1vZGUsIG92ZXJpdGUgdGhlIHJlc3BlY3RpdmUgbWV0aG9kcy5cblxuXG5cbiAgLy9cbiAgLy8gZXhwb3NlIHB1YmxpYyBBUElcbiAgLy9cbiAgLy8gaW5oZXJpdCBmcm9tIEhvb2RpZXMgU3RvcmUgQVBJXG4gIGhvb2RpZS5zdG9yZSA9IHN0b3JlO1xuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9uY2UgZnJvbSBvdXRzaWRlXG4gIHN0b3JlLmJvb3RzdHJhcERpcnR5T2JqZWN0cyA9IGZ1bmN0aW9uKCkge1xuICAgIGJvb3RzdHJhcERpcnR5T2JqZWN0cygpO1xuICAgIGRlbGV0ZSBzdG9yZS5ib290c3RyYXBEaXJ0eU9iamVjdHM7XG4gIH07XG5cbiAgLy8gYWxsb3cgdG8gcnVuIHRoaXMgb25jZSBmcm9tIG91dHNpZGVcbiAgc3RvcmUucGF0Y2hJZk5vdFBlcnNpc3RhbnQgPSBmdW5jdGlvbigpIHtcbiAgICBwYXRjaElmTm90UGVyc2lzdGFudCgpO1xuICAgIGRlbGV0ZSBzdG9yZS5wYXRjaElmTm90UGVyc2lzdGFudDtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVTdG9yZTtcbiIsIi8vIE9wZW4gc3RvcmVzXG4vLyAtLS0tLS0tLS0tLS0tXG5cbnZhciBob29kaWVSZW1vdGVTdG9yZSA9IHJlcXVpcmUoJy4vcmVtb3RlX3N0b3JlJyk7XG5cbnZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKTtcblxuZnVuY3Rpb24gaG9vZGllT3Blbihob29kaWUpIHtcblxuICAvLyBnZW5lcmljIG1ldGhvZCB0byBvcGVuIGEgc3RvcmUuIFVzZWQgYnlcbiAgLy9cbiAgLy8gKiBob29kaWUucmVtb3RlXG4gIC8vICogaG9vZGllLnVzZXIoXCJqb2VcIilcbiAgLy8gKiBob29kaWUuZ2xvYmFsXG4gIC8vICogLi4uIGFuZCBtb3JlXG4gIC8vXG4gIC8vICAgICBob29kaWUub3BlbihcInNvbWVfc3RvcmVfbmFtZVwiKS5maW5kQWxsKClcbiAgLy9cbiAgZnVuY3Rpb24gb3BlbihzdG9yZU5hbWUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIGV4dGVuZChvcHRpb25zLCB7XG4gICAgICBuYW1lOiBzdG9yZU5hbWVcbiAgICB9KTtcblxuICAgIHJldHVybiBob29kaWVSZW1vdGVTdG9yZShob29kaWUsIG9wdGlvbnMpO1xuICB9XG5cbiAgLy9cbiAgLy8gUHVibGljIEFQSVxuICAvL1xuICBob29kaWUub3BlbiA9IG9wZW47XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllT3BlbjtcbiIsIi8vIEhvb2RpZSBEZWZlcnMgLyBQcm9taXNlc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIHJldHVybnMgYSBkZWZlciBvYmplY3QgZm9yIGN1c3RvbSBwcm9taXNlIGhhbmRsaW5ncy5cbi8vIFByb21pc2VzIGFyZSBoZWF2ZWx5IHVzZWQgdGhyb3VnaG91dCB0aGUgY29kZSBvZiBob29kaWUuXG4vLyBXZSBjdXJyZW50bHkgYm9ycm93IGpRdWVyeSdzIGltcGxlbWVudGF0aW9uOlxuLy8gaHR0cDovL2FwaS5qcXVlcnkuY29tL2NhdGVnb3J5L2RlZmVycmVkLW9iamVjdC9cbi8vXG4vLyAgICAgZGVmZXIgPSBob29kaWUuZGVmZXIoKVxuLy8gICAgIGlmIChnb29kKSB7XG4vLyAgICAgICBkZWZlci5yZXNvbHZlKCdnb29kLicpXG4vLyAgICAgfSBlbHNlIHtcbi8vICAgICAgIGRlZmVyLnJlamVjdCgnbm90IGdvb2QuJylcbi8vICAgICB9XG4vLyAgICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKVxuLy9cbnZhciBIb29kaWVFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3InKTtcblxuLy9cbmZ1bmN0aW9uIGhvb2RpZVByb21pc2VzIChob29kaWUpIHtcbiAgdmFyICRkZWZlciA9IHdpbmRvdy5qUXVlcnkuRGVmZXJyZWQ7XG5cbiAgLy8gcmV0dXJucyB0cnVlIGlmIHBhc3NlZCBvYmplY3QgaXMgYSBwcm9taXNlIChidXQgbm90IGEgZGVmZXJyZWQpLFxuICAvLyBvdGhlcndpc2UgZmFsc2UuXG4gIGZ1bmN0aW9uIGlzUHJvbWlzZShvYmplY3QpIHtcbiAgICByZXR1cm4gISEgKG9iamVjdCAmJlxuICAgICAgICAgICAgICAgdHlwZW9mIG9iamVjdC5kb25lID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAgICAgICAgICB0eXBlb2Ygb2JqZWN0LnJlc29sdmUgIT09ICdmdW5jdGlvbicpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gcmVzb2x2ZSgpIHtcbiAgICByZXR1cm4gJGRlZmVyKCkucmVzb2x2ZSgpLnByb21pc2UoKTtcbiAgfVxuXG5cbiAgLy9cbiAgZnVuY3Rpb24gcmVqZWN0KCkge1xuICAgIHJldHVybiAkZGVmZXIoKS5yZWplY3QoKS5wcm9taXNlKCk7XG4gIH1cblxuXG4gIC8vXG4gIGZ1bmN0aW9uIHJlc29sdmVXaXRoKCkge1xuICAgIHZhciBfZGVmZXIgPSAkZGVmZXIoKTtcbiAgICByZXR1cm4gX2RlZmVyLnJlc29sdmUuYXBwbHkoX2RlZmVyLCBhcmd1bWVudHMpLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIHJlamVjdFdpdGgoZXJyb3JQcm9wZXJ0aWVzKSB7XG4gICAgdmFyIF9kZWZlciA9ICRkZWZlcigpO1xuICAgIHZhciBlcnJvciA9IG5ldyBIb29kaWVFcnJvcihlcnJvclByb3BlcnRpZXMpO1xuICAgIHJldHVybiBfZGVmZXIucmVqZWN0KGVycm9yKS5wcm9taXNlKCk7XG4gIH1cblxuICAvL1xuICAvLyBQdWJsaWMgQVBJXG4gIC8vXG4gIGhvb2RpZS5kZWZlciA9ICRkZWZlcjtcbiAgaG9vZGllLmlzUHJvbWlzZSA9IGlzUHJvbWlzZTtcbiAgaG9vZGllLnJlc29sdmUgPSByZXNvbHZlO1xuICBob29kaWUucmVqZWN0ID0gcmVqZWN0O1xuICBob29kaWUucmVzb2x2ZVdpdGggPSByZXNvbHZlV2l0aDtcbiAgaG9vZGllLnJlamVjdFdpdGggPSByZWplY3RXaXRoO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVByb21pc2VzO1xuIiwiLy8gUmVtb3RlXG4vLyA9PT09PT09PVxuXG4vLyBDb25uZWN0aW9uIHRvIGEgcmVtb3RlIENvdWNoIERhdGFiYXNlLlxuLy9cbi8vIHN0b3JlIEFQSVxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuLy9cbi8vIG9iamVjdCBsb2FkaW5nIC8gdXBkYXRpbmcgLyBkZWxldGluZ1xuLy9cbi8vICogZmluZCh0eXBlLCBpZClcbi8vICogZmluZEFsbCh0eXBlIClcbi8vICogYWRkKHR5cGUsIG9iamVjdClcbi8vICogc2F2ZSh0eXBlLCBpZCwgb2JqZWN0KVxuLy8gKiB1cGRhdGUodHlwZSwgaWQsIG5ld19wcm9wZXJ0aWVzIClcbi8vICogdXBkYXRlQWxsKCB0eXBlLCBuZXdfcHJvcGVydGllcylcbi8vICogcmVtb3ZlKHR5cGUsIGlkKVxuLy8gKiByZW1vdmVBbGwodHlwZSlcbi8vXG4vLyBjdXN0b20gcmVxdWVzdHNcbi8vXG4vLyAqIHJlcXVlc3QodmlldywgcGFyYW1zKVxuLy8gKiBnZXQodmlldywgcGFyYW1zKVxuLy8gKiBwb3N0KHZpZXcsIHBhcmFtcylcbi8vXG4vLyBzeW5jaHJvbml6YXRpb25cbi8vXG4vLyAqIGNvbm5lY3QoKVxuLy8gKiBkaXNjb25uZWN0KClcbi8vICogcHVsbCgpXG4vLyAqIHB1c2goKVxuLy8gKiBzeW5jKClcbi8vXG4vLyBldmVudCBiaW5kaW5nXG4vL1xuLy8gKiBvbihldmVudCwgY2FsbGJhY2spXG4vL1xudmFyIGhvb2RpZVN0b3JlQXBpID0gcmVxdWlyZSgnLi9zdG9yZScpO1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVSZW1vdGVTdG9yZSAoaG9vZGllLCBvcHRpb25zKSB7XG5cbiAgdmFyIHJlbW90ZVN0b3JlID0ge307XG5cblxuICAvLyBSZW1vdGUgU3RvcmUgUGVyc2lzdGFuY2UgbWV0aG9kc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gZmluZFxuICAvLyAtLS0tLS1cblxuICAvLyBmaW5kIG9uZSBvYmplY3RcbiAgLy9cbiAgcmVtb3RlU3RvcmUuZmluZCA9IGZ1bmN0aW9uIGZpbmQodHlwZSwgaWQpIHtcbiAgICB2YXIgcGF0aDtcblxuICAgIHBhdGggPSB0eXBlICsgJy8nICsgaWQ7XG5cbiAgICBpZiAocmVtb3RlLnByZWZpeCkge1xuICAgICAgcGF0aCA9IHJlbW90ZS5wcmVmaXggKyBwYXRoO1xuICAgIH1cblxuICAgIHBhdGggPSAnLycgKyBlbmNvZGVVUklDb21wb25lbnQocGF0aCk7XG5cbiAgICByZXR1cm4gcmVtb3RlLnJlcXVlc3QoJ0dFVCcsIHBhdGgpLnRoZW4ocGFyc2VGcm9tUmVtb3RlKTtcbiAgfTtcblxuXG4gIC8vIGZpbmRBbGxcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gZmluZCBhbGwgb2JqZWN0cywgY2FuIGJlIGZpbGV0ZXJlZCBieSBhIHR5cGVcbiAgLy9cbiAgcmVtb3RlU3RvcmUuZmluZEFsbCA9IGZ1bmN0aW9uIGZpbmRBbGwodHlwZSkge1xuICAgIHZhciBlbmRrZXksIHBhdGgsIHN0YXJ0a2V5O1xuXG4gICAgcGF0aCA9ICcvX2FsbF9kb2NzP2luY2x1ZGVfZG9jcz10cnVlJztcblxuICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgIGNhc2UgKHR5cGUgIT09IHVuZGVmaW5lZCkgJiYgcmVtb3RlLnByZWZpeCAhPT0gJyc6XG4gICAgICBzdGFydGtleSA9IHJlbW90ZS5wcmVmaXggKyB0eXBlICsgJy8nO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSB0eXBlICE9PSB1bmRlZmluZWQ6XG4gICAgICBzdGFydGtleSA9IHR5cGUgKyAnLyc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIHJlbW90ZS5wcmVmaXggIT09ICcnOlxuICAgICAgc3RhcnRrZXkgPSByZW1vdGUucHJlZml4O1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHN0YXJ0a2V5ID0gJyc7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0a2V5KSB7XG5cbiAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IG9ubHkgb2JqZWN0cyBzdGFydGluZyB3aXRoXG4gICAgICAvLyBgc3RhcnRrZXlgIHdpbGwgYmUgcmV0dXJuZWRcbiAgICAgIGVuZGtleSA9IHN0YXJ0a2V5LnJlcGxhY2UoLy4kLywgZnVuY3Rpb24oY2hhcnMpIHtcbiAgICAgICAgdmFyIGNoYXJDb2RlO1xuICAgICAgICBjaGFyQ29kZSA9IGNoYXJzLmNoYXJDb2RlQXQoMCk7XG4gICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNoYXJDb2RlICsgMSk7XG4gICAgICB9KTtcbiAgICAgIHBhdGggPSAnJyArIHBhdGggKyAnJnN0YXJ0a2V5PVwiJyArIChlbmNvZGVVUklDb21wb25lbnQoc3RhcnRrZXkpKSArICdcIiZlbmRrZXk9XCInICsgKGVuY29kZVVSSUNvbXBvbmVudChlbmRrZXkpKSArICdcIic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlbW90ZS5yZXF1ZXN0KCdHRVQnLCBwYXRoKS50aGVuKG1hcERvY3NGcm9tRmluZEFsbCkudGhlbihwYXJzZUFsbEZyb21SZW1vdGUpO1xuICB9O1xuXG5cbiAgLy8gc2F2ZVxuICAvLyAtLS0tLS1cblxuICAvLyBzYXZlIGEgbmV3IG9iamVjdC4gSWYgaXQgZXhpc3RlZCBiZWZvcmUsIGFsbCBwcm9wZXJ0aWVzXG4gIC8vIHdpbGwgYmUgb3ZlcndyaXR0ZW5cbiAgLy9cbiAgcmVtb3RlU3RvcmUuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUob2JqZWN0KSB7XG4gICAgdmFyIHBhdGg7XG5cbiAgICBpZiAoIW9iamVjdC5pZCkge1xuICAgICAgb2JqZWN0LmlkID0gaG9vZGllLmdlbmVyYXRlSWQoKTtcbiAgICB9XG5cbiAgICBvYmplY3QgPSBwYXJzZUZvclJlbW90ZShvYmplY3QpO1xuICAgIHBhdGggPSAnLycgKyBlbmNvZGVVUklDb21wb25lbnQob2JqZWN0Ll9pZCk7XG4gICAgcmV0dXJuIHJlbW90ZS5yZXF1ZXN0KCdQVVQnLCBwYXRoLCB7XG4gICAgICBkYXRhOiBvYmplY3RcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIHJlbW92ZVxuICAvLyAtLS0tLS0tLS1cblxuICAvLyByZW1vdmUgb25lIG9iamVjdFxuICAvL1xuICByZW1vdGVTdG9yZS5yZW1vdmUgPSBmdW5jdGlvbiByZW1vdmUodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gcmVtb3RlLnVwZGF0ZSh0eXBlLCBpZCwge1xuICAgICAgX2RlbGV0ZWQ6IHRydWVcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIHJlbW92ZUFsbFxuICAvLyAtLS0tLS0tLS0tLS1cblxuICAvLyByZW1vdmUgYWxsIG9iamVjdHMsIGNhbiBiZSBmaWx0ZXJlZCBieSB0eXBlXG4gIC8vXG4gIHJlbW90ZVN0b3JlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uIHJlbW92ZUFsbCh0eXBlKSB7XG4gICAgcmV0dXJuIHJlbW90ZS51cGRhdGVBbGwodHlwZSwge1xuICAgICAgX2RlbGV0ZWQ6IHRydWVcbiAgICB9KTtcbiAgfTtcblxuXG4gIHZhciByZW1vdGUgPSBob29kaWVTdG9yZUFwaShob29kaWUsIHtcblxuICAgIG5hbWU6IG9wdGlvbnMubmFtZSxcblxuICAgIGJhY2tlbmQ6IHtcbiAgICAgIHNhdmU6IHJlbW90ZVN0b3JlLnNhdmUsXG4gICAgICBmaW5kOiByZW1vdGVTdG9yZS5maW5kLFxuICAgICAgZmluZEFsbDogcmVtb3RlU3RvcmUuZmluZEFsbCxcbiAgICAgIHJlbW92ZTogcmVtb3RlU3RvcmUucmVtb3ZlLFxuICAgICAgcmVtb3ZlQWxsOiByZW1vdGVTdG9yZS5yZW1vdmVBbGxcbiAgICB9XG4gIH0pO1xuXG5cblxuXG5cbiAgLy8gcHJvcGVydGllc1xuICAvLyAtLS0tLS0tLS0tLS1cblxuICAvLyBuYW1lXG5cbiAgLy8gdGhlIG5hbWUgb2YgdGhlIFJlbW90ZSBpcyB0aGUgbmFtZSBvZiB0aGVcbiAgLy8gQ291Y2hEQiBkYXRhYmFzZSBhbmQgaXMgYWxzbyB1c2VkIHRvIHByZWZpeFxuICAvLyB0cmlnZ2VyZWQgZXZlbnRzXG4gIC8vXG4gIHZhciByZW1vdGVOYW1lID0gbnVsbDtcblxuXG4gIC8vIHN5bmNcblxuICAvLyBpZiBzZXQgdG8gdHJ1ZSwgdXBkYXRlcyB3aWxsIGJlIGNvbnRpbnVvdXNseSBwdWxsZWRcbiAgLy8gYW5kIHB1c2hlZC4gQWx0ZXJuYXRpdmVseSwgYHN5bmNgIGNhbiBiZSBzZXQgdG9cbiAgLy8gYHB1bGw6IHRydWVgIG9yIGBwdXNoOiB0cnVlYC5cbiAgLy9cbiAgcmVtb3RlLmNvbm5lY3RlZCA9IGZhbHNlO1xuXG5cbiAgLy8gcHJlZml4XG5cbiAgLy8gcHJlZml4IGZvciBkb2NzIGluIGEgQ291Y2hEQiBkYXRhYmFzZSwgZS5nLiBhbGwgZG9jc1xuICAvLyBpbiBwdWJsaWMgdXNlciBzdG9yZXMgYXJlIHByZWZpeGVkIGJ5ICckcHVibGljLydcbiAgLy9cbiAgcmVtb3RlLnByZWZpeCA9ICcnO1xuICB2YXIgcmVtb3RlUHJlZml4UGF0dGVybiA9IG5ldyBSZWdFeHAoJ14nKTtcblxuXG4gIC8vIGRlZmF1bHRzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvL1xuICBpZiAob3B0aW9ucy5uYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICByZW1vdGVOYW1lID0gb3B0aW9ucy5uYW1lO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMucHJlZml4ICE9PSB1bmRlZmluZWQpIHtcbiAgICByZW1vdGUucHJlZml4ID0gb3B0aW9ucy5wcmVmaXg7XG4gICAgcmVtb3RlUHJlZml4UGF0dGVybiA9IG5ldyBSZWdFeHAoJ14nICsgcmVtb3RlLnByZWZpeCk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5iYXNlVXJsICE9PSBudWxsKSB7XG4gICAgcmVtb3RlLmJhc2VVcmwgPSBvcHRpb25zLmJhc2VVcmw7XG4gIH1cblxuXG4gIC8vIHJlcXVlc3RcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gd3JhcHBlciBmb3IgaG9vZGllLnJlcXVlc3QsIHdpdGggc29tZSBzdG9yZSBzcGVjaWZpYyBkZWZhdWx0c1xuICAvLyBhbmQgYSBwcmVmaXhlZCBwYXRoXG4gIC8vXG4gIHJlbW90ZS5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdCh0eXBlLCBwYXRoLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAocmVtb3RlTmFtZSkge1xuICAgICAgcGF0aCA9ICcvJyArIChlbmNvZGVVUklDb21wb25lbnQocmVtb3RlTmFtZSkpICsgcGF0aDtcbiAgICB9XG5cbiAgICBpZiAocmVtb3RlLmJhc2VVcmwpIHtcbiAgICAgIHBhdGggPSAnJyArIHJlbW90ZS5iYXNlVXJsICsgcGF0aDtcbiAgICB9XG5cbiAgICBvcHRpb25zLmNvbnRlbnRUeXBlID0gb3B0aW9ucy5jb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24vanNvbic7XG5cbiAgICBpZiAodHlwZSA9PT0gJ1BPU1QnIHx8IHR5cGUgPT09ICdQVVQnKSB7XG4gICAgICBvcHRpb25zLmRhdGFUeXBlID0gb3B0aW9ucy5kYXRhVHlwZSB8fCAnanNvbic7XG4gICAgICBvcHRpb25zLnByb2Nlc3NEYXRhID0gb3B0aW9ucy5wcm9jZXNzRGF0YSB8fCBmYWxzZTtcbiAgICAgIG9wdGlvbnMuZGF0YSA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiBob29kaWUucmVxdWVzdCh0eXBlLCBwYXRoLCBvcHRpb25zKTtcbiAgfTtcblxuXG4gIC8vIGlzS25vd25PYmplY3RcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gZGV0ZXJtaW5lIGJldHdlZW4gYSBrbm93biBhbmQgYSBuZXcgb2JqZWN0XG4gIC8vXG4gIHJlbW90ZS5pc0tub3duT2JqZWN0ID0gZnVuY3Rpb24gaXNLbm93bk9iamVjdChvYmplY3QpIHtcbiAgICB2YXIga2V5ID0gJycgKyBvYmplY3QudHlwZSArICcvJyArIG9iamVjdC5pZDtcblxuICAgIGlmIChrbm93bk9iamVjdHNba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4ga25vd25PYmplY3RzW2tleV07XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gbWFya0FzS25vd25PYmplY3RcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGRldGVybWluZSBiZXR3ZWVuIGEga25vd24gYW5kIGEgbmV3IG9iamVjdFxuICAvL1xuICByZW1vdGUubWFya0FzS25vd25PYmplY3QgPSBmdW5jdGlvbiBtYXJrQXNLbm93bk9iamVjdChvYmplY3QpIHtcbiAgICB2YXIga2V5ID0gJycgKyBvYmplY3QudHlwZSArICcvJyArIG9iamVjdC5pZDtcbiAgICBrbm93bk9iamVjdHNba2V5XSA9IDE7XG4gICAgcmV0dXJuIGtub3duT2JqZWN0c1trZXldO1xuICB9O1xuXG5cbiAgLy8gc3luY2hyb25pemF0aW9uXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gQ29ubmVjdFxuICAvLyAtLS0tLS0tLS1cblxuICAvLyBzdGFydCBzeW5jaW5nLiBgcmVtb3RlLmJvb3RzdHJhcCgpYCB3aWxsIGF1dG9tYXRpY2FsbHkgc3RhcnRcbiAgLy8gcHVsbGluZyB3aGVuIGByZW1vdGUuY29ubmVjdGVkYCByZW1haW5zIHRydWUuXG4gIC8vXG4gIHJlbW90ZS5jb25uZWN0ID0gZnVuY3Rpb24gY29ubmVjdChuYW1lKSB7XG4gICAgaWYgKG5hbWUpIHtcbiAgICAgIHJlbW90ZU5hbWUgPSBuYW1lO1xuICAgIH1cbiAgICByZW1vdGUuY29ubmVjdGVkID0gdHJ1ZTtcbiAgICByZW1vdGUudHJpZ2dlcignY29ubmVjdCcpO1xuICAgIHJldHVybiByZW1vdGUuYm9vdHN0cmFwKCkudGhlbiggZnVuY3Rpb24oKSB7IHJlbW90ZS5wdXNoKCk7IH0gKTtcbiAgfTtcblxuXG4gIC8vIERpc2Nvbm5lY3RcbiAgLy8gLS0tLS0tLS0tLS0tXG5cbiAgLy8gc3RvcCBzeW5jaW5nIGNoYW5nZXMgZnJvbSByZW1vdGUgc3RvcmVcbiAgLy9cbiAgcmVtb3RlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiBkaXNjb25uZWN0KCkge1xuICAgIHJlbW90ZS5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICByZW1vdGUudHJpZ2dlcignZGlzY29ubmVjdCcpOyAvLyBUT0RPOiBzcGVjIHRoYXRcblxuICAgIGlmIChwdWxsUmVxdWVzdCkge1xuICAgICAgcHVsbFJlcXVlc3QuYWJvcnQoKTtcbiAgICB9XG5cbiAgICBpZiAocHVzaFJlcXVlc3QpIHtcbiAgICAgIHB1c2hSZXF1ZXN0LmFib3J0KCk7XG4gICAgfVxuXG4gIH07XG5cblxuICAvLyBpc0Nvbm5lY3RlZFxuICAvLyAtLS0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgcmVtb3RlLmlzQ29ubmVjdGVkID0gZnVuY3Rpb24gaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHJlbW90ZS5jb25uZWN0ZWQ7XG4gIH07XG5cblxuICAvLyBnZXRTaW5jZU5yXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIHJldHVybnMgdGhlIHNlcXVlbmNlIG51bWJlciBmcm9tIHdpY2ggdG8gc3RhcnQgdG8gZmluZCBjaGFuZ2VzIGluIHB1bGxcbiAgLy9cbiAgdmFyIHNpbmNlID0gb3B0aW9ucy5zaW5jZSB8fCAwOyAvLyBUT0RPOiBzcGVjIHRoYXQhXG4gIHJlbW90ZS5nZXRTaW5jZU5yID0gZnVuY3Rpb24gZ2V0U2luY2VOcigpIHtcbiAgICBpZiAodHlwZW9mIHNpbmNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gc2luY2UoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2luY2U7XG4gIH07XG5cblxuICAvLyBib290c3RyYXBcbiAgLy8gLS0tLS0tLS0tLS1cblxuICAvLyBpbml0YWwgcHVsbCBvZiBkYXRhIG9mIHRoZSByZW1vdGUgc3RvcmUuIEJ5IGRlZmF1bHQsIHdlIHB1bGwgYWxsXG4gIC8vIGNoYW5nZXMgc2luY2UgdGhlIGJlZ2lubmluZywgYnV0IHRoaXMgYmVoYXZpb3IgbWlnaHQgYmUgYWRqdXN0ZWQsXG4gIC8vIGUuZyBmb3IgYSBmaWx0ZXJlZCBib290c3RyYXAuXG4gIC8vXG4gIHZhciBpc0Jvb3RzdHJhcHBpbmcgPSBmYWxzZTtcbiAgcmVtb3RlLmJvb3RzdHJhcCA9IGZ1bmN0aW9uIGJvb3RzdHJhcCgpIHtcbiAgICBpc0Jvb3RzdHJhcHBpbmcgPSB0cnVlO1xuICAgIHJlbW90ZS50cmlnZ2VyKCdib290c3RyYXA6c3RhcnQnKTtcbiAgICByZXR1cm4gcmVtb3RlLnB1bGwoKS5kb25lKCBoYW5kbGVCb290c3RyYXBTdWNjZXNzICk7XG4gIH07XG5cblxuICAvLyBwdWxsIGNoYW5nZXNcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBhLmsuYS4gbWFrZSBhIEdFVCByZXF1ZXN0IHRvIENvdWNoREIncyBgX2NoYW5nZXNgIGZlZWQuXG4gIC8vIFdlIGN1cnJlbnRseSBtYWtlIGxvbmcgcG9sbCByZXF1ZXN0cywgdGhhdCB3ZSBtYW51YWxseSBhYm9ydFxuICAvLyBhbmQgcmVzdGFydCBlYWNoIDI1IHNlY29uZHMuXG4gIC8vXG4gIHZhciBwdWxsUmVxdWVzdCwgcHVsbFJlcXVlc3RUaW1lb3V0O1xuICByZW1vdGUucHVsbCA9IGZ1bmN0aW9uIHB1bGwoKSB7XG4gICAgcHVsbFJlcXVlc3QgPSByZW1vdGUucmVxdWVzdCgnR0VUJywgcHVsbFVybCgpKTtcblxuICAgIGlmIChyZW1vdGUuaXNDb25uZWN0ZWQoKSkge1xuICAgICAgd2luZG93LmNsZWFyVGltZW91dChwdWxsUmVxdWVzdFRpbWVvdXQpO1xuICAgICAgcHVsbFJlcXVlc3RUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQocmVzdGFydFB1bGxSZXF1ZXN0LCAyNTAwMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHB1bGxSZXF1ZXN0LmRvbmUoaGFuZGxlUHVsbFN1Y2Nlc3MpLmZhaWwoaGFuZGxlUHVsbEVycm9yKTtcbiAgfTtcblxuXG4gIC8vIHB1c2ggY2hhbmdlc1xuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFB1c2ggb2JqZWN0cyB0byByZW1vdGUgc3RvcmUgdXNpbmcgdGhlIGBfYnVsa19kb2NzYCBBUEkuXG4gIC8vXG4gIHZhciBwdXNoUmVxdWVzdDtcbiAgcmVtb3RlLnB1c2ggPSBmdW5jdGlvbiBwdXNoKG9iamVjdHMpIHtcbiAgICB2YXIgb2JqZWN0LCBvYmplY3RzRm9yUmVtb3RlLCBfaSwgX2xlbjtcblxuICAgIGlmICghJC5pc0FycmF5KG9iamVjdHMpKSB7XG4gICAgICBvYmplY3RzID0gZGVmYXVsdE9iamVjdHNUb1B1c2goKTtcbiAgICB9XG5cbiAgICBpZiAob2JqZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZVdpdGgoW10pO1xuICAgIH1cblxuICAgIG9iamVjdHNGb3JSZW1vdGUgPSBbXTtcblxuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gb2JqZWN0cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuXG4gICAgICAvLyBkb24ndCBtZXNzIHdpdGggb3JpZ2luYWwgb2JqZWN0c1xuICAgICAgb2JqZWN0ID0gZXh0ZW5kKHRydWUsIHt9LCBvYmplY3RzW19pXSk7XG4gICAgICBhZGRSZXZpc2lvblRvKG9iamVjdCk7XG4gICAgICBvYmplY3QgPSBwYXJzZUZvclJlbW90ZShvYmplY3QpO1xuICAgICAgb2JqZWN0c0ZvclJlbW90ZS5wdXNoKG9iamVjdCk7XG4gICAgfVxuICAgIHB1c2hSZXF1ZXN0ID0gcmVtb3RlLnJlcXVlc3QoJ1BPU1QnLCAnL19idWxrX2RvY3MnLCB7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIGRvY3M6IG9iamVjdHNGb3JSZW1vdGUsXG4gICAgICAgIG5ld19lZGl0czogZmFsc2VcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHB1c2hSZXF1ZXN0LmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iamVjdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmVtb3RlLnRyaWdnZXIoJ3B1c2gnLCBvYmplY3RzW2ldKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcHVzaFJlcXVlc3Q7XG4gIH07XG5cbiAgLy8gc3luYyBjaGFuZ2VzXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcHVzaCBvYmplY3RzLCB0aGVuIHB1bGwgdXBkYXRlcy5cbiAgLy9cbiAgcmVtb3RlLnN5bmMgPSBmdW5jdGlvbiBzeW5jKG9iamVjdHMpIHtcbiAgICByZXR1cm4gcmVtb3RlLnB1c2gob2JqZWN0cykudGhlbihyZW1vdGUucHVsbCk7XG4gIH07XG5cbiAgLy9cbiAgLy8gUHJpdmF0ZVxuICAvLyAtLS0tLS0tLS1cbiAgLy9cblxuICAvLyBpbiBvcmRlciB0byBkaWZmZXJlbnRpYXRlIHdoZXRoZXIgYW4gb2JqZWN0IGZyb20gcmVtb3RlIHNob3VsZCB0cmlnZ2VyIGEgJ25ldydcbiAgLy8gb3IgYW4gJ3VwZGF0ZScgZXZlbnQsIHdlIHN0b3JlIGEgaGFzaCBvZiBrbm93biBvYmplY3RzXG4gIHZhciBrbm93bk9iamVjdHMgPSB7fTtcblxuXG4gIC8vIHZhbGlkIENvdWNoREIgZG9jIGF0dHJpYnV0ZXMgc3RhcnRpbmcgd2l0aCBhbiB1bmRlcnNjb3JlXG4gIC8vXG4gIHZhciB2YWxpZFNwZWNpYWxBdHRyaWJ1dGVzID0gWydfaWQnLCAnX3JldicsICdfZGVsZXRlZCcsICdfcmV2aXNpb25zJywgJ19hdHRhY2htZW50cyddO1xuXG5cbiAgLy8gZGVmYXVsdCBvYmplY3RzIHRvIHB1c2hcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyB3aGVuIHB1c2hlZCB3aXRob3V0IHBhc3NpbmcgYW55IG9iamVjdHMsIHRoZSBvYmplY3RzIHJldHVybmVkIGZyb21cbiAgLy8gdGhpcyBtZXRob2Qgd2lsbCBiZSBwYXNzZWQuIEl0IGNhbiBiZSBvdmVyd3JpdHRlbiBieSBwYXNzaW5nIGFuXG4gIC8vIGFycmF5IG9mIG9iamVjdHMgb3IgYSBmdW5jdGlvbiBhcyBgb3B0aW9ucy5vYmplY3RzYFxuICAvL1xuICB2YXIgZGVmYXVsdE9iamVjdHNUb1B1c2ggPSBmdW5jdGlvbiBkZWZhdWx0T2JqZWN0c1RvUHVzaCgpIHtcbiAgICByZXR1cm4gW107XG4gIH07XG4gIGlmIChvcHRpb25zLmRlZmF1bHRPYmplY3RzVG9QdXNoKSB7XG4gICAgaWYgKCQuaXNBcnJheShvcHRpb25zLmRlZmF1bHRPYmplY3RzVG9QdXNoKSkge1xuICAgICAgZGVmYXVsdE9iamVjdHNUb1B1c2ggPSBmdW5jdGlvbiBkZWZhdWx0T2JqZWN0c1RvUHVzaCgpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuZGVmYXVsdE9iamVjdHNUb1B1c2g7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZhdWx0T2JqZWN0c1RvUHVzaCA9IG9wdGlvbnMuZGVmYXVsdE9iamVjdHNUb1B1c2g7XG4gICAgfVxuICB9XG5cblxuICAvLyBzZXRTaW5jZU5yXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIHNldHMgdGhlIHNlcXVlbmNlIG51bWJlciBmcm9tIHdpY2ggdG8gc3RhcnQgdG8gZmluZCBjaGFuZ2VzIGluIHB1bGwuXG4gIC8vIElmIHJlbW90ZSBzdG9yZSB3YXMgaW5pdGlhbGl6ZWQgd2l0aCBzaW5jZSA6IGZ1bmN0aW9uKG5yKSB7IC4uLiB9LFxuICAvLyBjYWxsIHRoZSBmdW5jdGlvbiB3aXRoIHRoZSBzZXEgcGFzc2VkLiBPdGhlcndpc2Ugc2ltcGx5IHNldCB0aGUgc2VxXG4gIC8vIG51bWJlciBhbmQgcmV0dXJuIGl0LlxuICAvL1xuICBmdW5jdGlvbiBzZXRTaW5jZU5yKHNlcSkge1xuICAgIGlmICh0eXBlb2Ygc2luY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBzaW5jZShzZXEpO1xuICAgIH1cblxuICAgIHNpbmNlID0gc2VxO1xuICAgIHJldHVybiBzaW5jZTtcbiAgfVxuXG5cbiAgLy8gUGFyc2UgZm9yIHJlbW90ZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBwYXJzZSBvYmplY3QgZm9yIHJlbW90ZSBzdG9yYWdlLiBBbGwgcHJvcGVydGllcyBzdGFydGluZyB3aXRoIGFuXG4gIC8vIGB1bmRlcnNjb3JlYCBkbyBub3QgZ2V0IHN5bmNocm9uaXplZCBkZXNwaXRlIHRoZSBzcGVjaWFsIHByb3BlcnRpZXNcbiAgLy8gYF9pZGAsIGBfcmV2YCBhbmQgYF9kZWxldGVkYCAoc2VlIGFib3ZlKVxuICAvL1xuICAvLyBBbHNvIGBpZGAgZ2V0cyByZXBsYWNlZCB3aXRoIGBfaWRgIHdoaWNoIGNvbnNpc3RzIG9mIHR5cGUgJiBpZFxuICAvL1xuICBmdW5jdGlvbiBwYXJzZUZvclJlbW90ZShvYmplY3QpIHtcbiAgICB2YXIgYXR0ciwgcHJvcGVydGllcztcbiAgICBwcm9wZXJ0aWVzID0gZXh0ZW5kKHt9LCBvYmplY3QpO1xuXG4gICAgZm9yIChhdHRyIGluIHByb3BlcnRpZXMpIHtcbiAgICAgIGlmIChwcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KGF0dHIpKSB7XG4gICAgICAgIGlmICh2YWxpZFNwZWNpYWxBdHRyaWJ1dGVzLmluZGV4T2YoYXR0cikgIT09IC0xKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEvXl8vLnRlc3QoYXR0cikpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgcHJvcGVydGllc1thdHRyXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBwcmVwYXJlIENvdWNoREIgaWRcbiAgICBwcm9wZXJ0aWVzLl9pZCA9ICcnICsgcHJvcGVydGllcy50eXBlICsgJy8nICsgcHJvcGVydGllcy5pZDtcbiAgICBpZiAocmVtb3RlLnByZWZpeCkge1xuICAgICAgcHJvcGVydGllcy5faWQgPSAnJyArIHJlbW90ZS5wcmVmaXggKyBwcm9wZXJ0aWVzLl9pZDtcbiAgICB9XG4gICAgZGVsZXRlIHByb3BlcnRpZXMuaWQ7XG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG4gIH1cblxuXG4gIC8vICMjIyBfcGFyc2VGcm9tUmVtb3RlXG5cbiAgLy8gbm9ybWFsaXplIG9iamVjdHMgY29taW5nIGZyb20gcmVtb3RlXG4gIC8vXG4gIC8vIHJlbmFtZXMgYF9pZGAgYXR0cmlidXRlIHRvIGBpZGAgYW5kIHJlbW92ZXMgdGhlIHR5cGUgZnJvbSB0aGUgaWQsXG4gIC8vIGUuZy4gYHR5cGUvMTIzYCAtPiBgMTIzYFxuICAvL1xuICBmdW5jdGlvbiBwYXJzZUZyb21SZW1vdGUob2JqZWN0KSB7XG4gICAgdmFyIGlkLCBpZ25vcmUsIF9yZWY7XG5cbiAgICAvLyBoYW5kbGUgaWQgYW5kIHR5cGVcbiAgICBpZCA9IG9iamVjdC5faWQgfHwgb2JqZWN0LmlkO1xuICAgIGRlbGV0ZSBvYmplY3QuX2lkO1xuXG4gICAgaWYgKHJlbW90ZS5wcmVmaXgpIHtcbiAgICAgIGlkID0gaWQucmVwbGFjZShyZW1vdGVQcmVmaXhQYXR0ZXJuLCAnJyk7XG4gICAgICAvLyBpZCA9IGlkLnJlcGxhY2UobmV3IFJlZ0V4cCgnXicgKyByZW1vdGUucHJlZml4KSwgJycpO1xuICAgIH1cblxuICAgIC8vIHR1cm4gZG9jLzEyMyBpbnRvIHR5cGUgPSBkb2MgJiBpZCA9IDEyM1xuICAgIC8vIE5PVEU6IHdlIGRvbid0IHVzZSBhIHNpbXBsZSBpZC5zcGxpdCgvXFwvLykgaGVyZSxcbiAgICAvLyBhcyBpbiBzb21lIGNhc2VzIElEcyBtaWdodCBjb250YWluICcvJywgdG9vXG4gICAgLy9cbiAgICBfcmVmID0gaWQubWF0Y2goLyhbXlxcL10rKVxcLyguKikvKSxcbiAgICBpZ25vcmUgPSBfcmVmWzBdLFxuICAgIG9iamVjdC50eXBlID0gX3JlZlsxXSxcbiAgICBvYmplY3QuaWQgPSBfcmVmWzJdO1xuXG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlQWxsRnJvbVJlbW90ZShvYmplY3RzKSB7XG4gICAgdmFyIG9iamVjdCwgX2ksIF9sZW4sIF9yZXN1bHRzO1xuICAgIF9yZXN1bHRzID0gW107XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBvYmplY3RzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBvYmplY3QgPSBvYmplY3RzW19pXTtcbiAgICAgIF9yZXN1bHRzLnB1c2gocGFyc2VGcm9tUmVtb3RlKG9iamVjdCkpO1xuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH1cblxuXG4gIC8vICMjIyBfYWRkUmV2aXNpb25Ub1xuXG4gIC8vIGV4dGVuZHMgcGFzc2VkIG9iamVjdCB3aXRoIGEgX3JldiBwcm9wZXJ0eVxuICAvL1xuICBmdW5jdGlvbiBhZGRSZXZpc2lvblRvKGF0dHJpYnV0ZXMpIHtcbiAgICB2YXIgY3VycmVudFJldklkLCBjdXJyZW50UmV2TnIsIG5ld1JldmlzaW9uSWQsIF9yZWY7XG4gICAgdHJ5IHtcbiAgICAgIF9yZWYgPSBhdHRyaWJ1dGVzLl9yZXYuc3BsaXQoLy0vKSxcbiAgICAgIGN1cnJlbnRSZXZOciA9IF9yZWZbMF0sXG4gICAgICBjdXJyZW50UmV2SWQgPSBfcmVmWzFdO1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge31cbiAgICBjdXJyZW50UmV2TnIgPSBwYXJzZUludChjdXJyZW50UmV2TnIsIDEwKSB8fCAwO1xuICAgIG5ld1JldmlzaW9uSWQgPSBnZW5lcmF0ZU5ld1JldmlzaW9uSWQoKTtcblxuICAgIC8vIGxvY2FsIGNoYW5nZXMgYXJlIG5vdCBtZWFudCB0byBiZSByZXBsaWNhdGVkIG91dHNpZGUgb2YgdGhlXG4gICAgLy8gdXNlcnMgZGF0YWJhc2UsIHRoZXJlZm9yZSB0aGUgYC1sb2NhbGAgc3VmZml4LlxuICAgIGlmIChhdHRyaWJ1dGVzLl8kbG9jYWwpIHtcbiAgICAgIG5ld1JldmlzaW9uSWQgKz0gJy1sb2NhbCc7XG4gICAgfVxuXG4gICAgYXR0cmlidXRlcy5fcmV2ID0gJycgKyAoY3VycmVudFJldk5yICsgMSkgKyAnLScgKyBuZXdSZXZpc2lvbklkO1xuICAgIGF0dHJpYnV0ZXMuX3JldmlzaW9ucyA9IHtcbiAgICAgIHN0YXJ0OiAxLFxuICAgICAgaWRzOiBbbmV3UmV2aXNpb25JZF1cbiAgICB9O1xuXG4gICAgaWYgKGN1cnJlbnRSZXZJZCkge1xuICAgICAgYXR0cmlidXRlcy5fcmV2aXNpb25zLnN0YXJ0ICs9IGN1cnJlbnRSZXZOcjtcbiAgICAgIHJldHVybiBhdHRyaWJ1dGVzLl9yZXZpc2lvbnMuaWRzLnB1c2goY3VycmVudFJldklkKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vICMjIyBnZW5lcmF0ZSBuZXcgcmV2aXNpb24gaWRcblxuICAvL1xuICBmdW5jdGlvbiBnZW5lcmF0ZU5ld1JldmlzaW9uSWQoKSB7XG4gICAgcmV0dXJuIGhvb2RpZS5nZW5lcmF0ZUlkKDkpO1xuICB9XG5cblxuICAvLyAjIyMgbWFwIGRvY3MgZnJvbSBmaW5kQWxsXG5cbiAgLy9cbiAgZnVuY3Rpb24gbWFwRG9jc0Zyb21GaW5kQWxsKHJlc3BvbnNlKSB7XG4gICAgcmV0dXJuIHJlc3BvbnNlLnJvd3MubWFwKGZ1bmN0aW9uKHJvdykge1xuICAgICAgcmV0dXJuIHJvdy5kb2M7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vICMjIyBwdWxsIHVybFxuXG4gIC8vIERlcGVuZGluZyBvbiB3aGV0aGVyIHJlbW90ZSBpcyBjb25uZWN0ZWQgKD0gcHVsbGluZyBjaGFuZ2VzIGNvbnRpbnVvdXNseSlcbiAgLy8gcmV0dXJuIGEgbG9uZ3BvbGwgVVJMIG9yIG5vdC4gSWYgaXQgaXMgYSBiZWdpbm5pbmcgYm9vdHN0cmFwIHJlcXVlc3QsIGRvXG4gIC8vIG5vdCByZXR1cm4gYSBsb25ncG9sbCBVUkwsIGFzIHdlIHdhbnQgaXQgdG8gZmluaXNoIHJpZ2h0IGF3YXksIGV2ZW4gaWYgdGhlcmVcbiAgLy8gYXJlIG5vIGNoYW5nZXMgb24gcmVtb3RlLlxuICAvL1xuICBmdW5jdGlvbiBwdWxsVXJsKCkge1xuICAgIHZhciBzaW5jZTtcbiAgICBzaW5jZSA9IHJlbW90ZS5nZXRTaW5jZU5yKCk7XG4gICAgaWYgKHJlbW90ZS5pc0Nvbm5lY3RlZCgpICYmICFpc0Jvb3RzdHJhcHBpbmcpIHtcbiAgICAgIHJldHVybiAnL19jaGFuZ2VzP2luY2x1ZGVfZG9jcz10cnVlJnNpbmNlPScgKyBzaW5jZSArICcmaGVhcnRiZWF0PTEwMDAwJmZlZWQ9bG9uZ3BvbGwnO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJy9fY2hhbmdlcz9pbmNsdWRlX2RvY3M9dHJ1ZSZzaW5jZT0nICsgc2luY2U7XG4gICAgfVxuICB9XG5cblxuICAvLyAjIyMgcmVzdGFydCBwdWxsIHJlcXVlc3RcblxuICAvLyByZXF1ZXN0IGdldHMgcmVzdGFydGVkIGF1dG9tYXRpY2NhbGx5XG4gIC8vIHdoZW4gYWJvcnRlZCAoc2VlIGhhbmRsZVB1bGxFcnJvcilcbiAgZnVuY3Rpb24gcmVzdGFydFB1bGxSZXF1ZXN0KCkge1xuICAgIGlmIChwdWxsUmVxdWVzdCkge1xuICAgICAgcHVsbFJlcXVlc3QuYWJvcnQoKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vICMjIyBwdWxsIHN1Y2Nlc3MgaGFuZGxlclxuXG4gIC8vIHJlcXVlc3QgZ2V0cyByZXN0YXJ0ZWQgYXV0b21hdGljY2FsbHlcbiAgLy8gd2hlbiBhYm9ydGVkIChzZWUgaGFuZGxlUHVsbEVycm9yKVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVQdWxsU3VjY2VzcyhyZXNwb25zZSkge1xuICAgIHNldFNpbmNlTnIocmVzcG9uc2UubGFzdF9zZXEpO1xuICAgIGhhbmRsZVB1bGxSZXN1bHRzKHJlc3BvbnNlLnJlc3VsdHMpO1xuICAgIGlmIChyZW1vdGUuaXNDb25uZWN0ZWQoKSkge1xuICAgICAgcmV0dXJuIHJlbW90ZS5wdWxsKCk7XG4gICAgfVxuICB9XG5cblxuICAvLyAjIyMgcHVsbCBlcnJvciBoYW5kbGVyXG5cbiAgLy8gd2hlbiB0aGVyZSBpcyBhIGNoYW5nZSwgdHJpZ2dlciBldmVudCxcbiAgLy8gdGhlbiBjaGVjayBmb3IgYW5vdGhlciBjaGFuZ2VcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlUHVsbEVycm9yKHhociwgZXJyb3IpIHtcbiAgICBpZiAoIXJlbW90ZS5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3dpdGNoICh4aHIuc3RhdHVzKSB7XG4gICAgICAvLyBTZXNzaW9uIGlzIGludmFsaWQuIFVzZXIgaXMgc3RpbGwgbG9naW4sIGJ1dCBuZWVkcyB0byByZWF1dGhlbnRpY2F0ZVxuICAgICAgLy8gYmVmb3JlIHN5bmMgY2FuIGJlIGNvbnRpbnVlZFxuICAgIGNhc2UgNDAxOlxuICAgICAgcmVtb3RlLnRyaWdnZXIoJ2Vycm9yOnVuYXV0aGVudGljYXRlZCcsIGVycm9yKTtcbiAgICAgIHJldHVybiByZW1vdGUuZGlzY29ubmVjdCgpO1xuXG4gICAgIC8vIHRoZSA0MDQgY29tZXMsIHdoZW4gdGhlIHJlcXVlc3RlZCBEQiBoYXMgYmVlbiByZW1vdmVkXG4gICAgIC8vIG9yIGRvZXMgbm90IGV4aXN0IHlldC5cbiAgICAgLy9cbiAgICAgLy8gQlVUOiBpdCBtaWdodCBhbHNvIGhhcHBlbiB0aGF0IHRoZSBiYWNrZ3JvdW5kIHdvcmtlcnMgZGlkXG4gICAgIC8vICAgICAgbm90IGNyZWF0ZSBhIHBlbmRpbmcgZGF0YWJhc2UgeWV0LiBUaGVyZWZvcmUsXG4gICAgIC8vICAgICAgd2UgdHJ5IGl0IGFnYWluIGluIDMgc2Vjb25kc1xuICAgICAvL1xuICAgICAvLyBUT0RPOiByZXZpZXcgLyByZXRoaW5rIHRoYXQuXG4gICAgIC8vXG5cbiAgICBjYXNlIDQwNDpcbiAgICAgIHJldHVybiB3aW5kb3cuc2V0VGltZW91dChyZW1vdGUucHVsbCwgMzAwMCk7XG5cbiAgICBjYXNlIDUwMDpcbiAgICAgIC8vXG4gICAgICAvLyBQbGVhc2Ugc2VydmVyLCBkb24ndCBnaXZlIHVzIHRoZXNlLiBBdCBsZWFzdCBub3QgcGVyc2lzdGVudGx5XG4gICAgICAvL1xuICAgICAgcmVtb3RlLnRyaWdnZXIoJ2Vycm9yOnNlcnZlcicsIGVycm9yKTtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KHJlbW90ZS5wdWxsLCAzMDAwKTtcbiAgICAgIHJldHVybiBob29kaWUuY2hlY2tDb25uZWN0aW9uKCk7XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIHVzdWFsbHkgYSAwLCB3aGljaCBzdGFuZHMgZm9yIHRpbWVvdXQgb3Igc2VydmVyIG5vdCByZWFjaGFibGUuXG4gICAgICBpZiAoeGhyLnN0YXR1c1RleHQgPT09ICdhYm9ydCcpIHtcbiAgICAgICAgLy8gbWFudWFsIGFib3J0IGFmdGVyIDI1c2VjLiByZXN0YXJ0IHB1bGxpbmcgY2hhbmdlcyBkaXJlY3RseSB3aGVuIGNvbm5lY3RlZFxuICAgICAgICByZXR1cm4gcmVtb3RlLnB1bGwoKTtcbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy8gb29wcy4gVGhpcyBtaWdodCBiZSBjYXVzZWQgYnkgYW4gdW5yZWFjaGFibGUgc2VydmVyLlxuICAgICAgICAvLyBPciB0aGUgc2VydmVyIGNhbmNlbGxlZCBpdCBmb3Igd2hhdCBldmVyIHJlYXNvbiwgZS5nLlxuICAgICAgICAvLyBoZXJva3Uga2lsbHMgdGhlIHJlcXVlc3QgYWZ0ZXIgfjMwcy5cbiAgICAgICAgLy8gd2UnbGwgdHJ5IGFnYWluIGFmdGVyIGEgM3MgdGltZW91dFxuICAgICAgICAvL1xuICAgICAgICB3aW5kb3cuc2V0VGltZW91dChyZW1vdGUucHVsbCwgMzAwMCk7XG4gICAgICAgIHJldHVybiBob29kaWUuY2hlY2tDb25uZWN0aW9uKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICAvLyAjIyMgaGFuZGxlIGNoYW5nZXMgZnJvbSByZW1vdGVcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQm9vdHN0cmFwU3VjY2VzcygpIHtcbiAgICBpc0Jvb3RzdHJhcHBpbmcgPSBmYWxzZTtcbiAgICByZW1vdGUudHJpZ2dlcignYm9vdHN0cmFwOmVuZCcpO1xuICB9XG5cbiAgLy8gIyMjIGhhbmRsZSBjaGFuZ2VzIGZyb20gcmVtb3RlXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZVB1bGxSZXN1bHRzKGNoYW5nZXMpIHtcbiAgICB2YXIgZG9jLCBldmVudCwgb2JqZWN0LCBfaSwgX2xlbjtcblxuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gY2hhbmdlcy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgZG9jID0gY2hhbmdlc1tfaV0uZG9jO1xuXG4gICAgICBpZiAocmVtb3RlLnByZWZpeCAmJiBkb2MuX2lkLmluZGV4T2YocmVtb3RlLnByZWZpeCkgIT09IDApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIG9iamVjdCA9IHBhcnNlRnJvbVJlbW90ZShkb2MpO1xuXG4gICAgICBpZiAob2JqZWN0Ll9kZWxldGVkKSB7XG4gICAgICAgIGlmICghcmVtb3RlLmlzS25vd25PYmplY3Qob2JqZWN0KSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50ID0gJ3JlbW92ZSc7XG4gICAgICAgIHJlbW90ZS5pc0tub3duT2JqZWN0KG9iamVjdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocmVtb3RlLmlzS25vd25PYmplY3Qob2JqZWN0KSkge1xuICAgICAgICAgIGV2ZW50ID0gJ3VwZGF0ZSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXZlbnQgPSAnYWRkJztcbiAgICAgICAgICByZW1vdGUubWFya0FzS25vd25PYmplY3Qob2JqZWN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZW1vdGUudHJpZ2dlcihldmVudCwgb2JqZWN0KTtcbiAgICAgIHJlbW90ZS50cmlnZ2VyKGV2ZW50ICsgJzonICsgb2JqZWN0LnR5cGUsIG9iamVjdCk7XG4gICAgICByZW1vdGUudHJpZ2dlcihldmVudCArICc6JyArIG9iamVjdC50eXBlICsgJzonICsgb2JqZWN0LmlkLCBvYmplY3QpO1xuICAgICAgcmVtb3RlLnRyaWdnZXIoJ2NoYW5nZScsIGV2ZW50LCBvYmplY3QpO1xuICAgICAgcmVtb3RlLnRyaWdnZXIoJ2NoYW5nZTonICsgb2JqZWN0LnR5cGUsIGV2ZW50LCBvYmplY3QpO1xuICAgICAgcmVtb3RlLnRyaWdnZXIoJ2NoYW5nZTonICsgb2JqZWN0LnR5cGUgKyAnOicgKyBvYmplY3QuaWQsIGV2ZW50LCBvYmplY3QpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gYm9vdHN0cmFwIGtub3duIG9iamVjdHNcbiAgLy9cbiAgaWYgKG9wdGlvbnMua25vd25PYmplY3RzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLmtub3duT2JqZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVtb3RlLm1hcmtBc0tub3duT2JqZWN0KHtcbiAgICAgICAgdHlwZTogb3B0aW9ucy5rbm93bk9iamVjdHNbaV0udHlwZSxcbiAgICAgICAgaWQ6IG9wdGlvbnMua25vd25PYmplY3RzW2ldLmlkXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuXG4gIC8vIGV4cG9zZSBwdWJsaWMgQVBJXG4gIHJldHVybiByZW1vdGU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllUmVtb3RlU3RvcmU7XG4iLCIvL1xuLy8gaG9vZGllLnJlcXVlc3Rcbi8vID09PT09PT09PT09PT09PT1cblxuLy8gSG9vZGllJ3MgY2VudHJhbCBwbGFjZSB0byBzZW5kIHJlcXVlc3QgdG8gaXRzIGJhY2tlbmQuXG4vLyBBdCB0aGUgbW9tZW50LCBpdCdzIGEgd3JhcHBlciBhcm91bmQgalF1ZXJ5J3MgYWpheCBtZXRob2QsXG4vLyBidXQgd2UgbWlnaHQgZ2V0IHJpZCBvZiB0aGlzIGRlcGVuZGVuY3kgaW4gdGhlIGZ1dHVyZS5cbi8vXG4vLyBJdCBoYXMgYnVpbGQgaW4gc3VwcG9ydCBmb3IgQ09SUyBhbmQgYSBzdGFuZGFyZCBlcnJvclxuLy8gaGFuZGxpbmcgdGhhdCBub3JtYWxpemVzIGVycm9ycyByZXR1cm5lZCBieSBDb3VjaERCXG4vLyB0byBKYXZhU2NyaXB0J3MgbmF0aXYgY29udmVudGlvbnMgb2YgZXJyb3JzIGhhdmluZ1xuLy8gYSBuYW1lICYgYSBtZXNzYWdlIHByb3BlcnR5LlxuLy9cbi8vIENvbW1vbiBlcnJvcnMgdG8gZXhwZWN0OlxuLy9cbi8vICogSG9vZGllUmVxdWVzdEVycm9yXG4vLyAqIEhvb2RpZVVuYXV0aG9yaXplZEVycm9yXG4vLyAqIEhvb2RpZUNvbmZsaWN0RXJyb3Jcbi8vICogSG9vZGllU2VydmVyRXJyb3Jcbi8vXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG5cbmZ1bmN0aW9uIGhvb2RpZVJlcXVlc3QoaG9vZGllKSB7XG4gIHZhciAkYWpheCA9ICQuYWpheDtcblxuICAvLyBIb29kaWUgYmFja2VuZCBsaXN0ZW50cyB0byByZXF1ZXN0cyBwcmVmaXhlZCBieSAvX2FwaSxcbiAgLy8gc28gd2UgcHJlZml4IGFsbCByZXF1ZXN0cyB3aXRoIHJlbGF0aXZlIFVSTHNcbiAgdmFyIEFQSV9QQVRIID0gJy9fYXBpJztcblxuICAvLyBSZXF1ZXN0c1xuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy8gc2VuZHMgcmVxdWVzdHMgdG8gdGhlIGhvb2RpZSBiYWNrZW5kLlxuICAvL1xuICAvLyAgICAgcHJvbWlzZSA9IGhvb2RpZS5yZXF1ZXN0KCdHRVQnLCAnL3VzZXJfZGF0YWJhc2UvZG9jX2lkJylcbiAgLy9cbiAgZnVuY3Rpb24gcmVxdWVzdCh0eXBlLCB1cmwsIG9wdGlvbnMpIHtcbiAgICB2YXIgZGVmYXVsdHMsIHJlcXVlc3RQcm9taXNlLCBwaXBlZFByb21pc2U7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIGRlZmF1bHRzID0ge1xuICAgICAgdHlwZTogdHlwZSxcbiAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICB9O1xuXG4gICAgLy8gaWYgYWJzb2x1dGUgcGF0aCBwYXNzZWQsIHNldCBDT1JTIGhlYWRlcnNcblxuICAgIC8vIGlmIHJlbGF0aXZlIHBhdGggcGFzc2VkLCBwcmVmaXggd2l0aCBiYXNlVXJsXG4gICAgaWYgKCEvXmh0dHAvLnRlc3QodXJsKSkge1xuICAgICAgdXJsID0gKGhvb2RpZS5iYXNlVXJsIHx8ICcnKSArIEFQSV9QQVRIICsgdXJsO1xuICAgIH1cblxuICAgIC8vIGlmIHVybCBpcyBjcm9zcyBkb21haW4sIHNldCBDT1JTIGhlYWRlcnNcbiAgICBpZiAoL15odHRwLy50ZXN0KHVybCkpIHtcbiAgICAgIGRlZmF1bHRzLnhockZpZWxkcyA9IHtcbiAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlXG4gICAgICB9O1xuICAgICAgZGVmYXVsdHMuY3Jvc3NEb21haW4gPSB0cnVlO1xuICAgIH1cblxuICAgIGRlZmF1bHRzLnVybCA9IHVybDtcblxuXG4gICAgLy8gd2UgYXJlIHBpcGluZyB0aGUgcmVzdWx0IG9mIHRoZSByZXF1ZXN0IHRvIHJldHVybiBhIG5pY2VyXG4gICAgLy8gZXJyb3IgaWYgdGhlIHJlcXVlc3QgY2Fubm90IHJlYWNoIHRoZSBzZXJ2ZXIgYXQgYWxsLlxuICAgIC8vIFdlIGNhbid0IHJldHVybiB0aGUgcHJvbWlzZSBvZiBhamF4IGRpcmVjdGx5IGJlY2F1c2Ugb2ZcbiAgICAvLyB0aGUgcGlwaW5nLCBhcyBmb3Igd2hhdGV2ZXIgcmVhc29uIHRoZSByZXR1cm5lZCBwcm9taXNlXG4gICAgLy8gZG9lcyBub3QgaGF2ZSB0aGUgYGFib3J0YCBtZXRob2QgYW55IG1vcmUsIG1heWJlIG90aGVyc1xuICAgIC8vIGFzIHdlbGwuIFNlZSBhbHNvIGh0dHA6Ly9idWdzLmpxdWVyeS5jb20vdGlja2V0LzE0MTA0XG4gICAgcmVxdWVzdFByb21pc2UgPSAkYWpheChleHRlbmQoZGVmYXVsdHMsIG9wdGlvbnMpKTtcbiAgICBwaXBlZFByb21pc2UgPSByZXF1ZXN0UHJvbWlzZS50aGVuKCBudWxsLCBoYW5kbGVSZXF1ZXN0RXJyb3IpO1xuICAgIHBpcGVkUHJvbWlzZS5hYm9ydCA9IHJlcXVlc3RQcm9taXNlLmFib3J0O1xuXG4gICAgcmV0dXJuIHBpcGVkUHJvbWlzZTtcbiAgfVxuXG4gIC8vXG4gIC8vXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZVJlcXVlc3RFcnJvcih4aHIpIHtcbiAgICB2YXIgZXJyb3I7XG5cbiAgICB0cnkge1xuICAgICAgZXJyb3IgPSBwYXJzZUVycm9yRnJvbVJlc3BvbnNlKHhocik7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG5cbiAgICAgIGlmICh4aHIucmVzcG9uc2VUZXh0KSB7XG4gICAgICAgIGVycm9yID0geGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVycm9yID0ge1xuICAgICAgICAgIG5hbWU6ICdIb29kaWVDb25uZWN0aW9uRXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6ICdDb3VsZCBub3QgY29ubmVjdCB0byBIb29kaWUgc2VydmVyIGF0IHt7dXJsfX0uJyxcbiAgICAgICAgICB1cmw6IGhvb2RpZS5iYXNlVXJsIHx8ICcvJ1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aChlcnJvcikucHJvbWlzZSgpO1xuICB9XG5cbiAgLy9cbiAgLy8gQ291Y2hEQiByZXR1cm5zIGVycm9ycyBpbiBKU09OIGZvcm1hdCwgd2l0aCB0aGUgcHJvcGVydGllc1xuICAvLyBgZXJyb3JgIGFuZCBgcmVhc29uYC4gSG9vZGllIHVzZXMgSmF2YVNjcmlwdCdzIG5hdGl2ZSBFcnJvclxuICAvLyBwcm9wZXJ0aWVzIGBuYW1lYCBhbmQgYG1lc3NhZ2VgIGluc3RlYWQsIHNvIHdlIGFyZSBub3JtYWxpemluZ1xuICAvLyB0aGF0LlxuICAvL1xuICAvLyBCZXNpZGVzIHRoZSByZW5hbWluZyB3ZSBhbHNvIGRvIGEgbWF0Y2hpbmcgd2l0aCBhIG1hcCBvZiBrbm93blxuICAvLyBlcnJvcnMgdG8gbWFrZSB0aGVtIG1vcmUgY2xlYXIuIEZvciByZWZlcmVuY2UsIHNlZVxuICAvLyBodHRwczovL3dpa2kuYXBhY2hlLm9yZy9jb3VjaGRiL0RlZmF1bHRfaHR0cF9lcnJvcnMgJlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYXBhY2hlL2NvdWNoZGIvYmxvYi9tYXN0ZXIvc3JjL2NvdWNoZGIvY291Y2hfaHR0cGQuZXJsI0w4MDdcbiAgLy9cblxuICBmdW5jdGlvbiBwYXJzZUVycm9yRnJvbVJlc3BvbnNlKHhocikge1xuICAgIHZhciBlcnJvciA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG5cbiAgICAvLyBnZXQgZXJyb3IgbmFtZVxuICAgIGVycm9yLm5hbWUgPSBIVFRQX1NUQVRVU19FUlJPUl9NQVBbeGhyLnN0YXR1c107XG4gICAgaWYgKCEgZXJyb3IubmFtZSkge1xuICAgICAgZXJyb3IubmFtZSA9IGhvb2RpZWZ5UmVxdWVzdEVycm9yTmFtZShlcnJvci5lcnJvcik7XG4gICAgfVxuXG4gICAgLy8gc3RvcmUgc3RhdHVzICYgbWVzc2FnZVxuICAgIGVycm9yLnN0YXR1cyA9IHhoci5zdGF0dXM7XG4gICAgZXJyb3IubWVzc2FnZSA9IGVycm9yLnJlYXNvbiB8fCAnJztcbiAgICBlcnJvci5tZXNzYWdlID0gZXJyb3IubWVzc2FnZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGVycm9yLm1lc3NhZ2Uuc2xpY2UoMSk7XG5cbiAgICAvLyBjbGVhbnVwXG4gICAgZGVsZXRlIGVycm9yLmVycm9yO1xuICAgIGRlbGV0ZSBlcnJvci5yZWFzb247XG5cbiAgICByZXR1cm4gZXJyb3I7XG4gIH1cblxuICAvLyBtYXAgQ291Y2hEQiBIVFRQIHN0YXR1cyBjb2RlcyB0byBIb29kaWUgRXJyb3JzXG4gIHZhciBIVFRQX1NUQVRVU19FUlJPUl9NQVAgPSB7XG4gICAgNDAwOiAnSG9vZGllUmVxdWVzdEVycm9yJywgLy8gYmFkIHJlcXVlc3RcbiAgICA0MDE6ICdIb29kaWVVbmF1dGhvcml6ZWRFcnJvcicsXG4gICAgNDAzOiAnSG9vZGllUmVxdWVzdEVycm9yJywgLy8gZm9yYmlkZGVuXG4gICAgNDA0OiAnSG9vZGllTm90Rm91bmRFcnJvcicsIC8vIGZvcmJpZGRlblxuICAgIDQwOTogJ0hvb2RpZUNvbmZsaWN0RXJyb3InLFxuICAgIDQxMjogJ0hvb2RpZUNvbmZsaWN0RXJyb3InLCAvLyBmaWxlIGV4aXN0XG4gICAgNTAwOiAnSG9vZGllU2VydmVyRXJyb3InXG4gIH07XG5cblxuICBmdW5jdGlvbiBob29kaWVmeVJlcXVlc3RFcnJvck5hbWUobmFtZSkge1xuICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLyheXFx3fF9cXHcpL2csIGZ1bmN0aW9uIChtYXRjaCkge1xuICAgICAgcmV0dXJuIChtYXRjaFsxXSB8fCBtYXRjaFswXSkudG9VcHBlckNhc2UoKTtcbiAgICB9KTtcbiAgICByZXR1cm4gJ0hvb2RpZScgKyBuYW1lICsgJ0Vycm9yJztcbiAgfVxuXG5cbiAgLy9cbiAgLy8gcHVibGljIEFQSVxuICAvL1xuICBob29kaWUucmVxdWVzdCA9IHJlcXVlc3Q7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllUmVxdWVzdDtcbiIsIi8vIHNjb3BlZCBTdG9yZVxuLy8gPT09PT09PT09PT09XG5cbi8vIHNhbWUgYXMgc3RvcmUsIGJ1dCB3aXRoIHR5cGUgcHJlc2V0IHRvIGFuIGluaXRpYWxseVxuLy8gcGFzc2VkIHZhbHVlLlxuLy9cbnZhciBob29kaWVFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllU2NvcGVkU3RvcmVBcGkoaG9vZGllLCBzdG9yZUFwaSwgb3B0aW9ucykge1xuXG4gIC8vIG5hbWVcbiAgdmFyIHN0b3JlTmFtZSA9IG9wdGlvbnMubmFtZSB8fCAnc3RvcmUnO1xuICB2YXIgdHlwZSA9IG9wdGlvbnMudHlwZTtcbiAgdmFyIGlkID0gb3B0aW9ucy5pZDtcblxuICB2YXIgYXBpID0ge307XG5cbiAgLy8gc2NvcGVkIGJ5IHR5cGUgb25seVxuICBpZiAoIWlkKSB7XG5cbiAgICAvLyBhZGQgZXZlbnRzXG4gICAgaG9vZGllRXZlbnRzKGhvb2RpZSwge1xuICAgICAgY29udGV4dDogYXBpLFxuICAgICAgbmFtZXNwYWNlOiBzdG9yZU5hbWUgKyAnOicgKyB0eXBlXG4gICAgfSk7XG5cbiAgICAvL1xuICAgIGFwaS5zYXZlID0gZnVuY3Rpb24gc2F2ZShpZCwgcHJvcGVydGllcywgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLnNhdmUodHlwZSwgaWQsIHByb3BlcnRpZXMsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5hZGQgPSBmdW5jdGlvbiBhZGQocHJvcGVydGllcywgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLmFkZCh0eXBlLCBwcm9wZXJ0aWVzLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkuZmluZCA9IGZ1bmN0aW9uIGZpbmQoaWQpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS5maW5kKHR5cGUsIGlkKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkuZmluZE9yQWRkID0gZnVuY3Rpb24gZmluZE9yQWRkKGlkLCBwcm9wZXJ0aWVzKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkuZmluZE9yQWRkKHR5cGUsIGlkLCBwcm9wZXJ0aWVzKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkuZmluZEFsbCA9IGZ1bmN0aW9uIGZpbmRBbGwob3B0aW9ucykge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLmZpbmRBbGwodHlwZSwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZShpZCwgb2JqZWN0VXBkYXRlLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkudXBkYXRlKHR5cGUsIGlkLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS51cGRhdGVBbGwgPSBmdW5jdGlvbiB1cGRhdGVBbGwob2JqZWN0VXBkYXRlLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkudXBkYXRlQWxsKHR5cGUsIG9iamVjdFVwZGF0ZSwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZShpZCwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLnJlbW92ZSh0eXBlLCBpZCwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnJlbW92ZUFsbCA9IGZ1bmN0aW9uIHJlbW92ZUFsbChvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkucmVtb3ZlQWxsKHR5cGUsIG9wdGlvbnMpO1xuICAgIH07XG4gIH1cblxuICAvLyBzY29wZWQgYnkgYm90aDogdHlwZSAmIGlkXG4gIGlmIChpZCkge1xuXG4gICAgLy8gYWRkIGV2ZW50c1xuICAgIGhvb2RpZUV2ZW50cyhob29kaWUsIHtcbiAgICAgIGNvbnRleHQ6IGFwaSxcbiAgICAgIG5hbWVzcGFjZTogc3RvcmVOYW1lICsgJzonICsgdHlwZSArICc6JyArIGlkXG4gICAgfSk7XG5cbiAgICAvL1xuICAgIGFwaS5zYXZlID0gZnVuY3Rpb24gc2F2ZShwcm9wZXJ0aWVzLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkuc2F2ZSh0eXBlLCBpZCwgcHJvcGVydGllcywgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLmZpbmQgPSBmdW5jdGlvbiBmaW5kKCkge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLmZpbmQodHlwZSwgaWQpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUob2JqZWN0VXBkYXRlLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkudXBkYXRlKHR5cGUsIGlkLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5yZW1vdmUgPSBmdW5jdGlvbiByZW1vdmUob3B0aW9ucykge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLnJlbW92ZSh0eXBlLCBpZCwgb3B0aW9ucyk7XG4gICAgfTtcbiAgfVxuXG4gIC8vXG4gIGFwaS5kZWNvcmF0ZVByb21pc2VzID0gc3RvcmVBcGkuZGVjb3JhdGVQcm9taXNlcztcbiAgYXBpLnZhbGlkYXRlID0gc3RvcmVBcGkudmFsaWRhdGU7XG5cbiAgcmV0dXJuIGFwaTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVTY29wZWRTdG9yZUFwaTtcbiIsIi8vIHNjb3BlZCBTdG9yZVxuLy8gPT09PT09PT09PT09XG5cbi8vIHNhbWUgYXMgc3RvcmUsIGJ1dCB3aXRoIHR5cGUgcHJlc2V0IHRvIGFuIGluaXRpYWxseVxuLy8gcGFzc2VkIHZhbHVlLlxuLy9cbnZhciBob29kaWVFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllU2NvcGVkVGFzayhob29kaWUsIHRhc2tBcGksIG9wdGlvbnMpIHtcblxuICB2YXIgdHlwZSA9IG9wdGlvbnMudHlwZTtcbiAgdmFyIGlkID0gb3B0aW9ucy5pZDtcblxuICB2YXIgYXBpID0ge307XG5cbiAgLy8gc2NvcGVkIGJ5IHR5cGUgb25seVxuICBpZiAoIWlkKSB7XG5cbiAgICAvLyBhZGQgZXZlbnRzXG4gICAgaG9vZGllRXZlbnRzKGhvb2RpZSwge1xuICAgICAgY29udGV4dDogYXBpLFxuICAgICAgbmFtZXNwYWNlOiAndGFzazonICsgdHlwZVxuICAgIH0pO1xuXG4gICAgLy9cbiAgICBhcGkuc3RhcnQgPSBmdW5jdGlvbiBzdGFydChwcm9wZXJ0aWVzKSB7XG4gICAgICByZXR1cm4gdGFza0FwaS5zdGFydCh0eXBlLCBwcm9wZXJ0aWVzKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKGlkKSB7XG4gICAgICByZXR1cm4gdGFza0FwaS5jYW5jZWwodHlwZSwgaWQpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5yZXN0YXJ0ID0gZnVuY3Rpb24gcmVzdGFydChpZCwgdXBkYXRlKSB7XG4gICAgICByZXR1cm4gdGFza0FwaS5yZXN0YXJ0KHR5cGUsIGlkLCB1cGRhdGUpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5jYW5jZWxBbGwgPSBmdW5jdGlvbiBjYW5jZWxBbGwoKSB7XG4gICAgICByZXR1cm4gdGFza0FwaS5jYW5jZWxBbGwodHlwZSk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnJlc3RhcnRBbGwgPSBmdW5jdGlvbiByZXN0YXJ0QWxsKHVwZGF0ZSkge1xuICAgICAgcmV0dXJuIHRhc2tBcGkucmVzdGFydEFsbCh0eXBlLCB1cGRhdGUpO1xuICAgIH07XG4gIH1cblxuICAvLyBzY29wZWQgYnkgYm90aDogdHlwZSAmIGlkXG4gIGlmIChpZCkge1xuXG4gICAgLy8gYWRkIGV2ZW50c1xuICAgIGhvb2RpZUV2ZW50cyhob29kaWUsIHtcbiAgICAgIGNvbnRleHQ6IGFwaSxcbiAgICAgIG5hbWVzcGFjZTogJ3Rhc2s6JyArIHR5cGUgKyAnOicgKyBpZFxuICAgIH0pO1xuXG4gICAgLy9cbiAgICBhcGkuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xuICAgICAgcmV0dXJuIHRhc2tBcGkuY2FuY2VsKHR5cGUsIGlkKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkucmVzdGFydCA9IGZ1bmN0aW9uIHJlc3RhcnQodXBkYXRlKSB7XG4gICAgICByZXR1cm4gdGFza0FwaS5yZXN0YXJ0KHR5cGUsIGlkLCB1cGRhdGUpO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gYXBpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVNjb3BlZFRhc2s7XG4iLCIvLyBTdG9yZVxuLy8gPT09PT09PT09PT09XG5cbi8vIFRoaXMgY2xhc3MgZGVmaW5lcyB0aGUgQVBJIHRoYXQgaG9vZGllLnN0b3JlIChsb2NhbCBzdG9yZSkgYW5kIGhvb2RpZS5vcGVuXG4vLyAocmVtb3RlIHN0b3JlKSBpbXBsZW1lbnQgdG8gYXNzdXJlIGEgY29oZXJlbnQgQVBJLiBJdCBhbHNvIGltcGxlbWVudHMgc29tZVxuLy8gYmFzaWMgdmFsaWRhdGlvbnMuXG4vL1xuLy8gVGhlIHJldHVybmVkIEFQSSBwcm92aWRlcyB0aGUgZm9sbG93aW5nIG1ldGhvZHM6XG4vL1xuLy8gKiB2YWxpZGF0ZVxuLy8gKiBzYXZlXG4vLyAqIGFkZFxuLy8gKiBmaW5kXG4vLyAqIGZpbmRPckFkZFxuLy8gKiBmaW5kQWxsXG4vLyAqIHVwZGF0ZVxuLy8gKiB1cGRhdGVBbGxcbi8vICogcmVtb3ZlXG4vLyAqIHJlbW92ZUFsbFxuLy8gKiBkZWNvcmF0ZVByb21pc2VzXG4vLyAqIHRyaWdnZXJcbi8vICogb25cbi8vICogdW5iaW5kXG4vL1xuLy8gQXQgdGhlIHNhbWUgdGltZSwgdGhlIHJldHVybmVkIEFQSSBjYW4gYmUgY2FsbGVkIGFzIGZ1bmN0aW9uIHJldHVybmluZyBhXG4vLyBzdG9yZSBzY29wZWQgYnkgdGhlIHBhc3NlZCB0eXBlLCBmb3IgZXhhbXBsZVxuLy9cbi8vICAgICB2YXIgdGFza1N0b3JlID0gaG9vZGllLnN0b3JlKCd0YXNrJyk7XG4vLyAgICAgdGFza1N0b3JlLmZpbmRBbGwoKS50aGVuKCBzaG93QWxsVGFza3MgKTtcbi8vICAgICB0YXNrU3RvcmUudXBkYXRlKCdpZDEyMycsIHtkb25lOiB0cnVlfSk7XG4vL1xuXG4vL1xudmFyIGhvb2RpZVNjb3BlZFN0b3JlQXBpID0gcmVxdWlyZSgnLi9zY29wZWRfc3RvcmUnKTtcbnZhciBob29kaWVFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIEhvb2RpZUVycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpO1xudmFyIEhvb2RpZU9iamVjdFR5cGVFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3Ivb2JqZWN0X3R5cGUnKTtcbnZhciBIb29kaWVPYmplY3RJZEVycm9yID0gcmVxdWlyZSgnLi9lcnJvci9vYmplY3RfaWQnKTtcblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ2V4dGVuZCcpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllU3RvcmVBcGkoaG9vZGllLCBvcHRpb25zKSB7XG5cbiAgLy8gcGVyc2lzdGFuY2UgbG9naWNcbiAgdmFyIGJhY2tlbmQgPSB7fTtcblxuICAvLyBleHRlbmQgdGhpcyBwcm9wZXJ0eSB3aXRoIGV4dHJhIGZ1bmN0aW9ucyB0aGF0IHdpbGwgYmUgYXZhaWxhYmxlXG4gIC8vIG9uIGFsbCBwcm9taXNlcyByZXR1cm5lZCBieSBob29kaWUuc3RvcmUgQVBJLiBJdCBoYXMgYSByZWZlcmVuY2VcbiAgLy8gdG8gY3VycmVudCBob29kaWUgaW5zdGFuY2UgYnkgZGVmYXVsdFxuICB2YXIgcHJvbWlzZUFwaSA9IHtcbiAgICBob29kaWU6IGhvb2RpZVxuICB9O1xuXG4gIC8vIG5hbWVcbiAgdmFyIHN0b3JlTmFtZSA9IG9wdGlvbnMubmFtZSB8fCAnc3RvcmUnO1xuXG4gIC8vIHB1YmxpYyBBUElcbiAgdmFyIGFwaSA9IGZ1bmN0aW9uIGFwaSh0eXBlLCBpZCkge1xuICAgIHZhciBzY29wZWRPcHRpb25zID0gZXh0ZW5kKHRydWUsIHt0eXBlOiB0eXBlLCBpZDogaWR9LCBvcHRpb25zKTtcbiAgICByZXR1cm4gaG9vZGllU2NvcGVkU3RvcmVBcGkoaG9vZGllLCBhcGksIHNjb3BlZE9wdGlvbnMpO1xuICB9O1xuXG4gIC8vIGFkZCBldmVudCBBUElcbiAgaG9vZGllRXZlbnRzKGhvb2RpZSwge1xuICAgIGNvbnRleHQ6IGFwaSxcbiAgICBuYW1lc3BhY2U6IHN0b3JlTmFtZVxuICB9KTtcblxuXG4gIC8vIFZhbGlkYXRlXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gYnkgZGVmYXVsdCwgd2Ugb25seSBjaGVjayBmb3IgYSB2YWxpZCB0eXBlICYgaWQuXG4gIC8vIHRoZSB2YWxpZGF0ZSBtZXRob2QgY2FuIGJlIG92ZXJ3cml0ZW4gYnkgcGFzc2luZ1xuICAvLyBvcHRpb25zLnZhbGlkYXRlXG4gIC8vXG4gIC8vIGlmIGB2YWxpZGF0ZWAgcmV0dXJucyBub3RoaW5nLCB0aGUgcGFzc2VkIG9iamVjdCBpc1xuICAvLyB2YWxpZC4gT3RoZXJ3aXNlIGl0IHJldHVybnMgYW4gZXJyb3JcbiAgLy9cbiAgYXBpLnZhbGlkYXRlID0gb3B0aW9ucy52YWxpZGF0ZTtcblxuICBpZiAoIW9wdGlvbnMudmFsaWRhdGUpIHtcblxuICAgIGFwaS52YWxpZGF0ZSA9IGZ1bmN0aW9uKG9iamVjdCAvKiwgb3B0aW9ucyAqLykge1xuXG4gICAgICBpZiAoIW9iamVjdCkge1xuICAgICAgICByZXR1cm4gbmV3IEhvb2RpZUVycm9yKHtcbiAgICAgICAgICBuYW1lOiAnSW52YWxpZE9iamVjdEVycm9yJyxcbiAgICAgICAgICBtZXNzYWdlOiAnTm8gb2JqZWN0IHBhc3NlZC4nXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoSG9vZGllT2JqZWN0VHlwZUVycm9yLmlzSW52YWxpZChvYmplY3QudHlwZSwgdmFsaWRJZE9yVHlwZVBhdHRlcm4pKSB7XG4gICAgICAgIHJldHVybiBuZXcgSG9vZGllT2JqZWN0VHlwZUVycm9yKHtcbiAgICAgICAgICB0eXBlOiBvYmplY3QudHlwZSxcbiAgICAgICAgICBydWxlczogdmFsaWRJZE9yVHlwZVJ1bGVzXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9iamVjdC5pZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChIb29kaWVPYmplY3RJZEVycm9yLmlzSW52YWxpZChvYmplY3QuaWQsIHZhbGlkSWRPclR5cGVQYXR0ZXJuKSkge1xuICAgICAgICByZXR1cm4gbmV3IEhvb2RpZU9iamVjdElkRXJyb3Ioe1xuICAgICAgICAgIGlkOiBvYmplY3QuaWQsXG4gICAgICAgICAgcnVsZXM6IHZhbGlkSWRPclR5cGVSdWxlc1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgIH07XG5cbiAgfVxuXG4gIC8vIFNhdmVcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBjcmVhdGVzIG9yIHJlcGxhY2VzIGFuIGFuIGV2ZW50dWFsbHkgZXhpc3Rpbmcgb2JqZWN0IGluIHRoZSBzdG9yZVxuICAvLyB3aXRoIHNhbWUgdHlwZSAmIGlkLlxuICAvL1xuICAvLyBXaGVuIGlkIGlzIHVuZGVmaW5lZCwgaXQgZ2V0cyBnZW5lcmF0ZWQgYW5kIGEgbmV3IG9iamVjdCBnZXRzIHNhdmVkXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2U6XG4gIC8vXG4gIC8vICAgICBzdG9yZS5zYXZlKCdjYXInLCB1bmRlZmluZWQsIHtjb2xvcjogJ3JlZCd9KVxuICAvLyAgICAgc3RvcmUuc2F2ZSgnY2FyJywgJ2FiYzQ1NjcnLCB7Y29sb3I6ICdyZWQnfSlcbiAgLy9cbiAgYXBpLnNhdmUgPSBmdW5jdGlvbiBzYXZlKHR5cGUsIGlkLCBwcm9wZXJ0aWVzLCBvcHRpb25zKSB7XG5cbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IGV4dGVuZCh0cnVlLCB7fSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICAvLyBkb24ndCBtZXNzIHdpdGggcGFzc2VkIG9iamVjdFxuICAgIHZhciBvYmplY3QgPSBleHRlbmQodHJ1ZSwge30sIHByb3BlcnRpZXMsIHtcbiAgICAgIHR5cGU6IHR5cGUsXG4gICAgICBpZDogaWRcbiAgICB9KTtcblxuICAgIC8vIHZhbGlkYXRpb25zXG4gICAgdmFyIGVycm9yID0gYXBpLnZhbGlkYXRlKG9iamVjdCwgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aChlcnJvcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggYmFja2VuZC5zYXZlKG9iamVjdCwgb3B0aW9ucyB8fCB7fSkgKTtcbiAgfTtcblxuXG4gIC8vIEFkZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gYC5hZGRgIGlzIGFuIGFsaWFzIGZvciBgLnNhdmVgLCB3aXRoIHRoZSBkaWZmZXJlbmNlIHRoYXQgdGhlcmUgaXMgbm8gaWQgYXJndW1lbnQuXG4gIC8vIEludGVybmFsbHkgaXQgc2ltcGx5IGNhbGxzIGAuc2F2ZSh0eXBlLCB1bmRlZmluZWQsIG9iamVjdCkuXG4gIC8vXG4gIGFwaS5hZGQgPSBmdW5jdGlvbiBhZGQodHlwZSwgcHJvcGVydGllcywgb3B0aW9ucykge1xuXG4gICAgaWYgKHByb3BlcnRpZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcHJvcGVydGllcyA9IHt9O1xuICAgIH1cblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgcmV0dXJuIGFwaS5zYXZlKHR5cGUsIHByb3BlcnRpZXMuaWQsIHByb3BlcnRpZXMsIG9wdGlvbnMpO1xuICB9O1xuXG5cbiAgLy8gZmluZFxuICAvLyAtLS0tLS1cblxuICAvL1xuICBhcGkuZmluZCA9IGZ1bmN0aW9uIGZpbmQodHlwZSwgaWQpIHtcblxuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIGJhY2tlbmQuZmluZCh0eXBlLCBpZCkgKTtcbiAgfTtcblxuXG4gIC8vIGZpbmQgb3IgYWRkXG4gIC8vIC0tLS0tLS0tLS0tLS1cblxuICAvLyAxLiBUcnkgdG8gZmluZCBhIHNoYXJlIGJ5IGdpdmVuIGlkXG4gIC8vIDIuIElmIHNoYXJlIGNvdWxkIGJlIGZvdW5kLCByZXR1cm4gaXRcbiAgLy8gMy4gSWYgbm90LCBhZGQgb25lIGFuZCByZXR1cm4gaXQuXG4gIC8vXG4gIGFwaS5maW5kT3JBZGQgPSBmdW5jdGlvbiBmaW5kT3JBZGQodHlwZSwgaWQsIHByb3BlcnRpZXMpIHtcblxuICAgIGlmIChwcm9wZXJ0aWVzID09PSBudWxsKSB7XG4gICAgICBwcm9wZXJ0aWVzID0ge307XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlTm90Rm91bmQoKSB7XG4gICAgICB2YXIgbmV3UHJvcGVydGllcztcbiAgICAgIG5ld1Byb3BlcnRpZXMgPSBleHRlbmQodHJ1ZSwge1xuICAgICAgICBpZDogaWRcbiAgICAgIH0sIHByb3BlcnRpZXMpO1xuICAgICAgcmV0dXJuIGFwaS5hZGQodHlwZSwgbmV3UHJvcGVydGllcyk7XG4gICAgfVxuXG4gICAgLy8gcHJvbWlzZSBkZWNvcmF0aW9ucyBnZXQgbG9zdCB3aGVuIHBpcGVkIHRocm91Z2ggYHRoZW5gLFxuICAgIC8vIHRoYXQncyB3aHkgd2UgbmVlZCB0byBkZWNvcmF0ZSB0aGUgZmluZCdzIHByb21pc2UgYWdhaW4uXG4gICAgdmFyIHByb21pc2UgPSBhcGkuZmluZCh0eXBlLCBpZCkudGhlbihudWxsLCBoYW5kbGVOb3RGb3VuZCk7XG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggcHJvbWlzZSApO1xuICB9O1xuXG5cbiAgLy8gZmluZEFsbFxuICAvLyAtLS0tLS0tLS0tLS1cblxuICAvLyByZXR1cm5zIGFsbCBvYmplY3RzIGZyb20gc3RvcmUuXG4gIC8vIENhbiBiZSBvcHRpb25hbGx5IGZpbHRlcmVkIGJ5IGEgdHlwZSBvciBhIGZ1bmN0aW9uXG4gIC8vXG4gIGFwaS5maW5kQWxsID0gZnVuY3Rpb24gZmluZEFsbCh0eXBlLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggYmFja2VuZC5maW5kQWxsKHR5cGUsIG9wdGlvbnMpICk7XG4gIH07XG5cblxuICAvLyBVcGRhdGVcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEluIGNvbnRyYXN0IHRvIGAuc2F2ZWAsIHRoZSBgLnVwZGF0ZWAgbWV0aG9kIGRvZXMgbm90IHJlcGxhY2UgdGhlIHN0b3JlZCBvYmplY3QsXG4gIC8vIGJ1dCBvbmx5IGNoYW5nZXMgdGhlIHBhc3NlZCBhdHRyaWJ1dGVzIG9mIGFuIGV4c3Rpbmcgb2JqZWN0LCBpZiBpdCBleGlzdHNcbiAgLy9cbiAgLy8gYm90aCBhIGhhc2ggb2Yga2V5L3ZhbHVlcyBvciBhIGZ1bmN0aW9uIHRoYXQgYXBwbGllcyB0aGUgdXBkYXRlIHRvIHRoZSBwYXNzZWRcbiAgLy8gb2JqZWN0IGNhbiBiZSBwYXNzZWQuXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2VcbiAgLy9cbiAgLy8gaG9vZGllLnN0b3JlLnVwZGF0ZSgnY2FyJywgJ2FiYzQ1NjcnLCB7c29sZDogdHJ1ZX0pXG4gIC8vIGhvb2RpZS5zdG9yZS51cGRhdGUoJ2NhcicsICdhYmM0NTY3JywgZnVuY3Rpb24ob2JqKSB7IG9iai5zb2xkID0gdHJ1ZSB9KVxuICAvL1xuICBhcGkudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKHR5cGUsIGlkLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcblxuICAgIGZ1bmN0aW9uIGhhbmRsZUZvdW5kKGN1cnJlbnRPYmplY3QpIHtcbiAgICAgIHZhciBjaGFuZ2VkUHJvcGVydGllcywgbmV3T2JqLCB2YWx1ZTtcblxuICAgICAgLy8gbm9ybWFsaXplIGlucHV0XG4gICAgICBuZXdPYmogPSBleHRlbmQodHJ1ZSwge30sIGN1cnJlbnRPYmplY3QpO1xuXG4gICAgICBpZiAodHlwZW9mIG9iamVjdFVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvYmplY3RVcGRhdGUgPSBvYmplY3RVcGRhdGUobmV3T2JqKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFvYmplY3RVcGRhdGUpIHtcbiAgICAgICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlV2l0aChjdXJyZW50T2JqZWN0KTtcbiAgICAgIH1cblxuICAgICAgLy8gY2hlY2sgaWYgc29tZXRoaW5nIGNoYW5nZWRcbiAgICAgIGNoYW5nZWRQcm9wZXJ0aWVzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX3Jlc3VsdHMgPSBbXTtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0VXBkYXRlKSB7XG4gICAgICAgICAgaWYgKG9iamVjdFVwZGF0ZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG9iamVjdFVwZGF0ZVtrZXldO1xuICAgICAgICAgICAgaWYgKChjdXJyZW50T2JqZWN0W2tleV0gIT09IHZhbHVlKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB3b3JrYXJvdW5kIGZvciB1bmRlZmluZWQgdmFsdWVzLCBhcyAkLmV4dGVuZCBpZ25vcmVzIHRoZXNlXG4gICAgICAgICAgICBuZXdPYmpba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChrZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9KSgpO1xuXG4gICAgICBpZiAoIShjaGFuZ2VkUHJvcGVydGllcy5sZW5ndGggfHwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlV2l0aChuZXdPYmopO1xuICAgICAgfVxuXG4gICAgICAvL2FwcGx5IHVwZGF0ZVxuICAgICAgcmV0dXJuIGFwaS5zYXZlKHR5cGUsIGlkLCBuZXdPYmosIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIHByb21pc2UgZGVjb3JhdGlvbnMgZ2V0IGxvc3Qgd2hlbiBwaXBlZCB0aHJvdWdoIGB0aGVuYCxcbiAgICAvLyB0aGF0J3Mgd2h5IHdlIG5lZWQgdG8gZGVjb3JhdGUgdGhlIGZpbmQncyBwcm9taXNlIGFnYWluLlxuICAgIHZhciBwcm9taXNlID0gYXBpLmZpbmQodHlwZSwgaWQpLnRoZW4oaGFuZGxlRm91bmQpO1xuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIHByb21pc2UgKTtcbiAgfTtcblxuXG4gIC8vIHVwZGF0ZU9yQWRkXG4gIC8vIC0tLS0tLS0tLS0tLS1cblxuICAvLyBzYW1lIGFzIGAudXBkYXRlKClgLCBidXQgaW4gY2FzZSB0aGUgb2JqZWN0IGNhbm5vdCBiZSBmb3VuZCxcbiAgLy8gaXQgZ2V0cyBjcmVhdGVkXG4gIC8vXG4gIGFwaS51cGRhdGVPckFkZCA9IGZ1bmN0aW9uIHVwZGF0ZU9yQWRkKHR5cGUsIGlkLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcbiAgICBmdW5jdGlvbiBoYW5kbGVOb3RGb3VuZCgpIHtcbiAgICAgIHZhciBwcm9wZXJ0aWVzID0gZXh0ZW5kKHRydWUsIHt9LCBvYmplY3RVcGRhdGUsIHtcbiAgICAgICAgaWQ6IGlkXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGFwaS5hZGQodHlwZSwgcHJvcGVydGllcywgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgdmFyIHByb21pc2UgPSBhcGkudXBkYXRlKHR5cGUsIGlkLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpLnRoZW4obnVsbCwgaGFuZGxlTm90Rm91bmQpO1xuXG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggcHJvbWlzZSApO1xuICB9O1xuXG5cbiAgLy8gdXBkYXRlQWxsXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gdXBkYXRlIGFsbCBvYmplY3RzIGluIHRoZSBzdG9yZSwgY2FuIGJlIG9wdGlvbmFsbHkgZmlsdGVyZWQgYnkgYSBmdW5jdGlvblxuICAvLyBBcyBhbiBhbHRlcm5hdGl2ZSwgYW4gYXJyYXkgb2Ygb2JqZWN0cyBjYW4gYmUgcGFzc2VkXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2VcbiAgLy9cbiAgLy8gaG9vZGllLnN0b3JlLnVwZGF0ZUFsbCgpXG4gIC8vXG4gIGFwaS51cGRhdGVBbGwgPSBmdW5jdGlvbiB1cGRhdGVBbGwoZmlsdGVyT3JPYmplY3RzLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgcHJvbWlzZTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLy8gbm9ybWFsaXplIHRoZSBpbnB1dDogbWFrZSBzdXJlIHdlIGhhdmUgYWxsIG9iamVjdHNcbiAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICBjYXNlIHR5cGVvZiBmaWx0ZXJPck9iamVjdHMgPT09ICdzdHJpbmcnOlxuICAgICAgcHJvbWlzZSA9IGFwaS5maW5kQWxsKGZpbHRlck9yT2JqZWN0cyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGhvb2RpZS5pc1Byb21pc2UoZmlsdGVyT3JPYmplY3RzKTpcbiAgICAgIHByb21pc2UgPSBmaWx0ZXJPck9iamVjdHM7XG4gICAgICBicmVhaztcbiAgICBjYXNlICQuaXNBcnJheShmaWx0ZXJPck9iamVjdHMpOlxuICAgICAgcHJvbWlzZSA9IGhvb2RpZS5kZWZlcigpLnJlc29sdmUoZmlsdGVyT3JPYmplY3RzKS5wcm9taXNlKCk7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OiAvLyBlLmcuIG51bGwsIHVwZGF0ZSBhbGxcbiAgICAgIHByb21pc2UgPSBhcGkuZmluZEFsbCgpO1xuICAgIH1cblxuICAgIHByb21pc2UgPSBwcm9taXNlLnRoZW4oZnVuY3Rpb24ob2JqZWN0cykge1xuICAgICAgLy8gbm93IHdlIHVwZGF0ZSBhbGwgb2JqZWN0cyBvbmUgYnkgb25lIGFuZCByZXR1cm4gYSBwcm9taXNlXG4gICAgICAvLyB0aGF0IHdpbGwgYmUgcmVzb2x2ZWQgb25jZSBhbGwgdXBkYXRlcyBoYXZlIGJlZW4gZmluaXNoZWRcbiAgICAgIHZhciBvYmplY3QsIF91cGRhdGVQcm9taXNlcztcblxuICAgICAgaWYgKCEkLmlzQXJyYXkob2JqZWN0cykpIHtcbiAgICAgICAgb2JqZWN0cyA9IFtvYmplY3RzXTtcbiAgICAgIH1cblxuICAgICAgX3VwZGF0ZVByb21pc2VzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX2ksIF9sZW4sIF9yZXN1bHRzO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG9iamVjdHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICBvYmplY3QgPSBvYmplY3RzW19pXTtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKGFwaS51cGRhdGUob2JqZWN0LnR5cGUsIG9iamVjdC5pZCwgb2JqZWN0VXBkYXRlLCBvcHRpb25zKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfSkoKTtcblxuICAgICAgcmV0dXJuICQud2hlbi5hcHBseShudWxsLCBfdXBkYXRlUHJvbWlzZXMpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggcHJvbWlzZSApO1xuICB9O1xuXG5cbiAgLy8gUmVtb3ZlXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIFJlbW92ZXMgb25lIG9iamVjdCBzcGVjaWZpZWQgYnkgYHR5cGVgIGFuZCBgaWRgLlxuICAvL1xuICAvLyB3aGVuIG9iamVjdCBoYXMgYmVlbiBzeW5jZWQgYmVmb3JlLCBtYXJrIGl0IGFzIGRlbGV0ZWQuXG4gIC8vIE90aGVyd2lzZSByZW1vdmUgaXQgZnJvbSBTdG9yZS5cbiAgLy9cbiAgYXBpLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZSh0eXBlLCBpZCwgb3B0aW9ucykge1xuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIGJhY2tlbmQucmVtb3ZlKHR5cGUsIGlkLCBvcHRpb25zIHx8IHt9KSApO1xuICB9O1xuXG5cbiAgLy8gcmVtb3ZlQWxsXG4gIC8vIC0tLS0tLS0tLS0tXG5cbiAgLy8gRGVzdHJveWUgYWxsIG9iamVjdHMuIENhbiBiZSBmaWx0ZXJlZCBieSBhIHR5cGVcbiAgLy9cbiAgYXBpLnJlbW92ZUFsbCA9IGZ1bmN0aW9uIHJlbW92ZUFsbCh0eXBlLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggYmFja2VuZC5yZW1vdmVBbGwodHlwZSwgb3B0aW9ucyB8fCB7fSkgKTtcbiAgfTtcblxuXG4gIC8vIGRlY29yYXRlIHByb21pc2VzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBleHRlbmQgcHJvbWlzZXMgcmV0dXJuZWQgYnkgc3RvcmUuYXBpXG4gIGFwaS5kZWNvcmF0ZVByb21pc2VzID0gZnVuY3Rpb24gZGVjb3JhdGVQcm9taXNlcyhtZXRob2RzKSB7XG4gICAgcmV0dXJuIGV4dGVuZChwcm9taXNlQXBpLCBtZXRob2RzKTtcbiAgfTtcblxuXG5cbiAgLy8gcmVxdWlyZWQgYmFja2VuZCBtZXRob2RzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaWYgKCFvcHRpb25zLmJhY2tlbmQgKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdvcHRpb25zLmJhY2tlbmQgbXVzdCBiZSBwYXNzZWQnKTtcbiAgfVxuXG4gIHZhciByZXF1aXJlZCA9ICdzYXZlIGZpbmQgZmluZEFsbCByZW1vdmUgcmVtb3ZlQWxsJy5zcGxpdCgnICcpO1xuXG4gIHJlcXVpcmVkLmZvckVhY2goIGZ1bmN0aW9uKG1ldGhvZE5hbWUpIHtcblxuICAgIGlmICghb3B0aW9ucy5iYWNrZW5kW21ldGhvZE5hbWVdKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ29wdGlvbnMuYmFja2VuZC4nK21ldGhvZE5hbWUrJyBtdXN0IGJlIHBhc3NlZC4nKTtcbiAgICB9XG5cbiAgICBiYWNrZW5kW21ldGhvZE5hbWVdID0gb3B0aW9ucy5iYWNrZW5kW21ldGhvZE5hbWVdO1xuICB9KTtcblxuXG4gIC8vIFByaXZhdGVcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gLyBub3QgYWxsb3dlZCBmb3IgaWRcbiAgdmFyIHZhbGlkSWRPclR5cGVQYXR0ZXJuID0gL15bXlxcL10rJC87XG4gIHZhciB2YWxpZElkT3JUeXBlUnVsZXMgPSAnLyBub3QgYWxsb3dlZCc7XG5cbiAgLy9cbiAgZnVuY3Rpb24gZGVjb3JhdGVQcm9taXNlKHByb21pc2UpIHtcbiAgICByZXR1cm4gZXh0ZW5kKHByb21pc2UsIHByb21pc2VBcGkpO1xuICB9XG5cbiAgcmV0dXJuIGFwaTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVTdG9yZUFwaTtcbiIsIi8vIFRhc2tzXG4vLyA9PT09PT09PT09PT1cblxuLy8gVGhpcyBjbGFzcyBkZWZpbmVzIHRoZSBob29kaWUudGFzayBBUEkuXG4vL1xuLy8gVGhlIHJldHVybmVkIEFQSSBwcm92aWRlcyB0aGUgZm9sbG93aW5nIG1ldGhvZHM6XG4vL1xuLy8gKiBzdGFydFxuLy8gKiBjYW5jZWxcbi8vICogcmVzdGFydFxuLy8gKiByZW1vdmVcbi8vICogb25cbi8vICogb25lXG4vLyAqIHVuYmluZFxuLy9cbi8vIEF0IHRoZSBzYW1lIHRpbWUsIHRoZSByZXR1cm5lZCBBUEkgY2FuIGJlIGNhbGxlZCBhcyBmdW5jdGlvbiByZXR1cm5pbmcgYVxuLy8gc3RvcmUgc2NvcGVkIGJ5IHRoZSBwYXNzZWQgdHlwZSwgZm9yIGV4YW1wbGVcbi8vXG4vLyAgICAgdmFyIGVtYWlsVGFza3MgPSBob29kaWUudGFzaygnZW1haWwnKTtcbi8vICAgICBlbWFpbFRhc2tzLnN0YXJ0KCBwcm9wZXJ0aWVzICk7XG4vLyAgICAgZW1haWxUYXNrcy5jYW5jZWwoJ2lkMTIzJyk7XG4vL1xudmFyIGhvb2RpZUV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgaG9vZGllU2NvcGVkVGFzayA9IHJlcXVpcmUoJy4vc2NvcGVkX3Rhc2snKTtcbnZhciBIb29kaWVFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3InKTtcblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ2V4dGVuZCcpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllVGFzayhob29kaWUpIHtcblxuICAvLyBwdWJsaWMgQVBJXG4gIHZhciBhcGkgPSBmdW5jdGlvbiBhcGkodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gaG9vZGllU2NvcGVkVGFzayhob29kaWUsIGFwaSwge3R5cGU6IHR5cGUsIGlkOiBpZH0pO1xuICB9O1xuXG4gIC8vIGFkZCBldmVudHMgQVBJXG4gIGhvb2RpZUV2ZW50cyhob29kaWUsIHsgY29udGV4dDogYXBpLCBuYW1lc3BhY2U6ICd0YXNrJyB9KTtcblxuXG4gIC8vIHN0YXJ0XG4gIC8vIC0tLS0tLS1cblxuICAvLyBzdGFydCBhIG5ldyB0YXNrLiBJZiB0aGUgdXNlciBoYXMgbm8gYWNjb3VudCB5ZXQsIGhvb2RpZSB0cmllcyB0byBzaWduIHVwXG4gIC8vIGZvciBhbiBhbm9ueW1vdXMgYWNjb3VudCBpbiB0aGUgYmFja2dyb3VuZC4gSWYgdGhhdCBmYWlscywgdGhlIHJldHVybmVkXG4gIC8vIHByb21pc2Ugd2lsbCBiZSByZWplY3RlZC5cbiAgLy9cbiAgYXBpLnN0YXJ0ID0gZnVuY3Rpb24odHlwZSwgcHJvcGVydGllcykge1xuICAgIGlmIChob29kaWUuYWNjb3VudC5oYXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiBob29kaWUuc3RvcmUuYWRkKCckJyt0eXBlLCBwcm9wZXJ0aWVzKS50aGVuKGhhbmRsZU5ld1Rhc2spO1xuICAgIH1cblxuICAgIHJldHVybiBob29kaWUuYWNjb3VudC5hbm9ueW1vdXNTaWduVXAoKS50aGVuKCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhcGkuc3RhcnQodHlwZSwgcHJvcGVydGllcyk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyBjYW5jZWxcbiAgLy8gLS0tLS0tLVxuXG4gIC8vIGNhbmNlbCBhIHJ1bm5pbmcgdGFza1xuICAvL1xuICBhcGkuY2FuY2VsID0gZnVuY3Rpb24odHlwZSwgaWQpIHtcbiAgICByZXR1cm4gaG9vZGllLnN0b3JlLnVwZGF0ZSgnJCcgKyB0eXBlLCBpZCwge1xuICAgICAgY2FuY2VsbGVkQXQ6IG5vdygpXG4gICAgfSkudGhlbihoYW5kbGVDYW5jZWxsZWRUYXNrT2JqZWN0KTtcbiAgfTtcblxuXG4gIC8vIHJlc3RhcnRcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gZmlyc3QsIHdlIHRyeSB0byBjYW5jZWwgYSBydW5uaW5nIHRhc2suIElmIHRoYXQgc3VjY2VlZHMsIHdlIHN0YXJ0XG4gIC8vIGEgbmV3IG9uZSB3aXRoIHRoZSBzYW1lIHByb3BlcnRpZXMgYXMgdGhlIG9yaWdpbmFsXG4gIC8vXG4gIGFwaS5yZXN0YXJ0ID0gZnVuY3Rpb24odHlwZSwgaWQsIHVwZGF0ZSkge1xuICAgIHZhciBzdGFydCA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgZXh0ZW5kKG9iamVjdCwgdXBkYXRlKTtcbiAgICAgIGRlbGV0ZSBvYmplY3QuJGVycm9yO1xuICAgICAgZGVsZXRlIG9iamVjdC4kcHJvY2Vzc2VkQXQ7XG4gICAgICBkZWxldGUgb2JqZWN0LmNhbmNlbGxlZEF0O1xuICAgICAgcmV0dXJuIGFwaS5zdGFydChvYmplY3QudHlwZSwgb2JqZWN0KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGFwaS5jYW5jZWwodHlwZSwgaWQpLnRoZW4oc3RhcnQpO1xuICB9O1xuXG4gIC8vIGNhbmNlbEFsbFxuICAvLyAtLS0tLS0tLS0tLVxuXG4gIC8vXG4gIGFwaS5jYW5jZWxBbGwgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgcmV0dXJuIGZpbmRBbGwodHlwZSkudGhlbiggY2FuY2VsVGFza09iamVjdHMgKTtcbiAgfTtcblxuICAvLyByZXN0YXJ0QWxsXG4gIC8vIC0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgYXBpLnJlc3RhcnRBbGwgPSBmdW5jdGlvbih0eXBlLCB1cGRhdGUpIHtcblxuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHVwZGF0ZSA9IHR5cGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbmRBbGwodHlwZSkudGhlbiggZnVuY3Rpb24odGFza09iamVjdHMpIHtcbiAgICAgIHJlc3RhcnRUYXNrT2JqZWN0cyh0YXNrT2JqZWN0cywgdXBkYXRlKTtcbiAgICB9KTtcblxuICB9O1xuXG5cbiAgLy9cbiAgLy8gc3Vic2NyaWJlIHRvIHN0b3JlIGV2ZW50c1xuICAvLyB3ZSBzdWJzY3JpYmUgdG8gYWxsIHN0b3JlIGNoYW5nZXMsIHBpcGUgdGhyb3VnaCB0aGUgdGFzayBvbmVzLFxuICAvLyBtYWtpbmcgYSBmZXcgY2hhbmdlcyBhbG9uZyB0aGUgd2F5LlxuICAvL1xuICBmdW5jdGlvbiBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKSB7XG4gICAgLy8gYWNjb3VudCBldmVudHNcbiAgICBob29kaWUub24oJ3N0b3JlOmNoYW5nZScsIGhhbmRsZVN0b3JlQ2hhbmdlKTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9ubHkgb25jZSBmcm9tIG91dHNpZGUgKGR1cmluZyBIb29kaWUgaW5pdGlhbGl6YXRpb24pXG4gIGFwaS5zdWJzY3JpYmVUb091dHNpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKTtcbiAgICBkZWxldGUgYXBpLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cztcbiAgfTtcblxuXG4gIC8vIFByaXZhdGVcbiAgLy8gLS0tLS0tLVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZU5ld1Rhc2sob2JqZWN0KSB7XG4gICAgdmFyIGRlZmVyID0gaG9vZGllLmRlZmVyKCk7XG4gICAgdmFyIHRhc2tTdG9yZSA9IGhvb2RpZS5zdG9yZShvYmplY3QudHlwZSwgb2JqZWN0LmlkKTtcblxuICAgIHRhc2tTdG9yZS5vbigncmVtb3ZlJywgZnVuY3Rpb24ob2JqZWN0KSB7XG5cbiAgICAgIC8vIHJlbW92ZSBcIiRcIiBmcm9tIHR5cGVcbiAgICAgIG9iamVjdC50eXBlID0gb2JqZWN0LnR5cGUuc3Vic3RyKDEpO1xuXG4gICAgICAvLyB0YXNrIGZpbmlzaGVkIGJ5IHdvcmtlci5cbiAgICAgIGlmKG9iamVjdC4kcHJvY2Vzc2VkQXQpIHtcbiAgICAgICAgcmV0dXJuIGRlZmVyLnJlc29sdmUob2JqZWN0KTtcbiAgICAgIH1cblxuICAgICAgLy8gbWFudWFsbHkgcmVtb3ZlZCAvIGNhbmNlbGxlZC5cbiAgICAgIGRlZmVyLnJlamVjdChuZXcgSG9vZGllRXJyb3Ioe1xuICAgICAgICBtZXNzYWdlOiAnVGFzayBoYXMgYmVlbiBjYW5jZWxsZWQnLFxuICAgICAgICB0YXNrOiBvYmplY3RcbiAgICAgIH0pKTtcbiAgICB9KTtcblxuICAgIHRhc2tTdG9yZS5vbigndXBkYXRlJywgZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICB2YXIgZXJyb3IgPSBvYmplY3QuJGVycm9yO1xuXG4gICAgICBpZiAoISBvYmplY3QuJGVycm9yKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gcmVtb3ZlIFwiJFwiIGZyb20gdHlwZVxuICAgICAgb2JqZWN0LnR5cGUgPSBvYmplY3QudHlwZS5zdWJzdHIoMSk7XG5cbiAgICAgIGRlbGV0ZSBvYmplY3QuJGVycm9yO1xuICAgICAgZXJyb3Iub2JqZWN0ID0gb2JqZWN0O1xuICAgICAgZXJyb3IubWVzc2FnZSA9IGVycm9yLm1lc3NhZ2UgfHwgJ1NvbWV0aGluZyB3ZW50IHdyb25nJztcblxuICAgICAgZGVmZXIucmVqZWN0KG5ldyBIb29kaWVFcnJvcihlcnJvcikpO1xuXG4gICAgICAvLyByZW1vdmUgZXJyb3JlZCB0YXNrXG4gICAgICBob29kaWUuc3RvcmUucmVtb3ZlKCckJyArIG9iamVjdC50eXBlLCBvYmplY3QuaWQpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZUNhbmNlbGxlZFRhc2tPYmplY3QgKHRhc2tPYmplY3QpIHtcbiAgICB2YXIgZGVmZXI7XG4gICAgdmFyIHR5cGUgPSB0YXNrT2JqZWN0LnR5cGU7IC8vIG5vIG5lZWQgdG8gcHJlZml4IHdpdGggJCwgaXQncyBhbHJlYWR5IHByZWZpeGVkLlxuICAgIHZhciBpZCA9IHRhc2tPYmplY3QuaWQ7XG4gICAgdmFyIHJlbW92ZVByb21pc2UgPSBob29kaWUuc3RvcmUucmVtb3ZlKHR5cGUsIGlkKTtcblxuICAgIGlmICghdGFza09iamVjdC5fcmV2KSB7XG4gICAgICAvLyB0YXNrIGhhcyBub3QgeWV0IGJlZW4gc3luY2VkLlxuICAgICAgcmV0dXJuIHJlbW92ZVByb21pc2U7XG4gICAgfVxuXG4gICAgZGVmZXIgPSBob29kaWUuZGVmZXIoKTtcbiAgICBob29kaWUub25lKCdzdG9yZTpzeW5jOicrdHlwZSsnOicraWQsIGRlZmVyLnJlc29sdmUpO1xuICAgIHJlbW92ZVByb21pc2UuZmFpbChkZWZlci5yZWplY3QpO1xuXG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZVN0b3JlQ2hhbmdlKGV2ZW50TmFtZSwgb2JqZWN0LCBvcHRpb25zKSB7XG4gICAgaWYgKG9iamVjdC50eXBlWzBdICE9PSAnJCcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBvYmplY3QudHlwZSA9IG9iamVjdC50eXBlLnN1YnN0cigxKTtcbiAgICB0cmlnZ2VyRXZlbnRzKGV2ZW50TmFtZSwgb2JqZWN0LCBvcHRpb25zKTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGZpbmRBbGwgKHR5cGUpIHtcbiAgICB2YXIgc3RhcnRzV2l0aCA9ICckJztcbiAgICB2YXIgZmlsdGVyO1xuICAgIGlmICh0eXBlKSB7XG4gICAgICBzdGFydHNXaXRoICs9IHR5cGU7XG4gICAgfVxuXG4gICAgZmlsdGVyID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICByZXR1cm4gb2JqZWN0LnR5cGUuaW5kZXhPZihzdGFydHNXaXRoKSA9PT0gMDtcbiAgICB9O1xuICAgIHJldHVybiBob29kaWUuc3RvcmUuZmluZEFsbChmaWx0ZXIpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gY2FuY2VsVGFza09iamVjdHMgKHRhc2tPYmplY3RzKSB7XG4gICAgcmV0dXJuIHRhc2tPYmplY3RzLm1hcCggZnVuY3Rpb24odGFza09iamVjdCkge1xuICAgICAgcmV0dXJuIGFwaS5jYW5jZWwodGFza09iamVjdC50eXBlLnN1YnN0cigxKSwgdGFza09iamVjdC5pZCk7XG4gICAgfSk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiByZXN0YXJ0VGFza09iamVjdHMgKHRhc2tPYmplY3RzLCB1cGRhdGUpIHtcbiAgICByZXR1cm4gdGFza09iamVjdHMubWFwKCBmdW5jdGlvbih0YXNrT2JqZWN0KSB7XG4gICAgICByZXR1cm4gYXBpLnJlc3RhcnQodGFza09iamVjdC50eXBlLnN1YnN0cigxKSwgdGFza09iamVjdC5pZCwgdXBkYXRlKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIHRoaXMgaXMgd2hlcmUgYWxsIHRoZSB0YXNrIGV2ZW50cyBnZXQgdHJpZ2dlcmVkLFxuICAvLyBsaWtlIGFkZDptZXNzYWdlLCBjaGFuZ2U6bWVzc2FnZTphYmM0NTY3LCByZW1vdmUsIGV0Yy5cbiAgZnVuY3Rpb24gdHJpZ2dlckV2ZW50cyhldmVudE5hbWUsIHRhc2ssIG9wdGlvbnMpIHtcbiAgICB2YXIgZXJyb3I7XG5cbiAgICAvLyBcIm5ld1wiIHRhc2tzIGFyZSB0cmlnZ2VyIGFzIFwic3RhcnRcIiBldmVudHNcbiAgICBpZiAoZXZlbnROYW1lID09PSAnbmV3Jykge1xuICAgICAgZXZlbnROYW1lID0gJ3N0YXJ0JztcbiAgICB9XG5cbiAgICBpZiAoZXZlbnROYW1lID09PSAncmVtb3ZlJyAmJiB0YXNrLmNhbmNlbGxlZEF0KSB7XG4gICAgICBldmVudE5hbWUgPSAnY2FuY2VsJztcbiAgICB9XG5cbiAgICBpZiAoZXZlbnROYW1lID09PSAncmVtb3ZlJyAmJiB0YXNrLiRwcm9jZXNzZWRBdCkge1xuICAgICAgZXZlbnROYW1lID0gJ3N1Y2Nlc3MnO1xuICAgIH1cblxuICAgIGlmIChldmVudE5hbWUgPT09ICd1cGRhdGUnICYmIHRhc2suJGVycm9yKSB7XG4gICAgICBldmVudE5hbWUgPSAnZXJyb3InO1xuICAgICAgZXJyb3IgPSB0YXNrLiRlcnJvcjtcbiAgICAgIGRlbGV0ZSB0YXNrLiRlcnJvcjtcblxuICAgICAgYXBpLnRyaWdnZXIoJ2Vycm9yJywgZXJyb3IsIHRhc2ssIG9wdGlvbnMpO1xuICAgICAgYXBpLnRyaWdnZXIodGFzay50eXBlICsgJzplcnJvcicsIGVycm9yLCB0YXNrLCBvcHRpb25zKTtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6JyArIHRhc2suaWQgKyAnOmVycm9yJywgZXJyb3IsIHRhc2ssIG9wdGlvbnMpO1xuXG4gICAgICBvcHRpb25zID0gZXh0ZW5kKHt9LCBvcHRpb25zLCB7XG4gICAgICAgIGVycm9yOiBlcnJvclxuICAgICAgfSk7XG5cbiAgICAgIGFwaS50cmlnZ2VyKCdjaGFuZ2UnLCAnZXJyb3InLCB0YXNrLCBvcHRpb25zKTtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6Y2hhbmdlJywgJ2Vycm9yJywgdGFzaywgb3B0aW9ucyk7XG4gICAgICBhcGkudHJpZ2dlcih0YXNrLnR5cGUgKyAnOicgKyB0YXNrLmlkICsgJzpjaGFuZ2UnLCAnZXJyb3InLCB0YXNrLCBvcHRpb25zKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGlnbm9yZSBhbGwgdGhlIG90aGVyIGV2ZW50c1xuICAgIGlmIChldmVudE5hbWUgIT09ICdzdGFydCcgJiYgZXZlbnROYW1lICE9PSAnY2FuY2VsJyAmJiBldmVudE5hbWUgIT09ICdzdWNjZXNzJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGFwaS50cmlnZ2VyKGV2ZW50TmFtZSwgdGFzaywgb3B0aW9ucyk7XG4gICAgYXBpLnRyaWdnZXIodGFzay50eXBlICsgJzonICsgZXZlbnROYW1lLCB0YXNrLCBvcHRpb25zKTtcblxuICAgIGlmIChldmVudE5hbWUgIT09ICdzdGFydCcpIHtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6JyArIHRhc2suaWQgKyAnOicgKyBldmVudE5hbWUsIHRhc2ssIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGFwaS50cmlnZ2VyKCdjaGFuZ2UnLCBldmVudE5hbWUsIHRhc2ssIG9wdGlvbnMpO1xuICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6Y2hhbmdlJywgZXZlbnROYW1lLCB0YXNrLCBvcHRpb25zKTtcblxuICAgIGlmIChldmVudE5hbWUgIT09ICdzdGFydCcpIHtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6JyArIHRhc2suaWQgKyAnOmNoYW5nZScsIGV2ZW50TmFtZSwgdGFzaywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gbm93KCkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShuZXcgRGF0ZSgpKS5yZXBsYWNlKC9bJ1wiXS9nLCAnJyk7XG4gIH1cblxuICAvLyBleHRlbmQgaG9vZGllXG4gIGhvb2RpZS50YXNrID0gYXBpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVRhc2s7XG4iXX0=
(2)
});
;