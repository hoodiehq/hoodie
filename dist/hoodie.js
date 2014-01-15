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
var hoodieConnection = require('./hoodie/connection');
var hoodieDispose = require('./hoodie/dispose');
var hoodieEvents = require('./hoodie/events');
var hoodieGenerateId = require('./hoodie/generate_id');
var hoodieId = require('./hoodie/id');
var hoodieLocalStore = require('./hoodie/local_store');
var hoodieOpen = require('./hoodie/open');
var hoodiePromises = require('./hoodie/promises');
var hoodieRequest = require('./hoodie/request');
var hoodieTask = require('./hoodie/task');

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

  // * hoodie.id
  hoodie.extend(hoodieId);


  //
  // Initializations
  //

  // init config
  hoodie.config.init();

  // init hoodieId
  hoodie.id.init();

  // set username from config (local store)
  hoodie.account.username = hoodie.config.get('_account.username');

  // check for pending password reset
  hoodie.account.checkPasswordReset();

  // hoodie.id
  hoodie.id.subscribeToOutsideEvents();

  // hoodie.config
  hoodie.config.subscribeToOutsideEvents();

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
  global.addEventListener('online', hoodie.checkConnection, false);
  global.addEventListener('offline', hoodie.checkConnection, false);

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

},{"./hoodie/account":3,"./hoodie/account_remote":4,"./hoodie/config":5,"./hoodie/connection":6,"./hoodie/dispose":7,"./hoodie/events":11,"./hoodie/generate_id":12,"./hoodie/id":13,"./hoodie/local_store":14,"./hoodie/open":15,"./hoodie/promises":16,"./hoodie/request":18,"./hoodie/task":22}],3:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// Hoodie.Account
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
        hoodieId: hoodie.id(),
        database: account.db(),
        updatedAt: now(),
        createdAt: now(),
        signedUpAt: username !== hoodie.id() ? now() : void 0
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
    username = hoodie.id();

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
  // can compare the username to the hoodie.id, which is the
  // same for anonymous accounts.
  account.hasAnonymousAccount = function hasAnonymousAccount() {
    return account.username === hoodie.id();
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
          object.createdBy = hoodie.id();
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
    return 'user/' + hoodie.id();
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
          global.setTimeout(account.checkPasswordReset, 1000);
          return;
        }
        return account.trigger('error:passwordreset', error);
      });
    });
  };


  // change username
  // -----------------

  // Note: the hoodie API requires the current password for security reasons,
  // but technically we cannot (yet) prevent the user to change the username
  // without knowing the current password, so it's ignored in the current
  // implementation.
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

    global.setTimeout(function() {
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
      var defer, username, hoodieId;

      defer = hoodie.defer();
      username = response.name.replace(/^user(_anonymous)?\//, '');
      hoodieId = response.roles[0];

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
      authenticated = true;

      //
      // options.silent is true when we need to sign in the
      // the user without signIn method being called. That's
      // currently the case for changeUsername.
      // Also don't trigger 'signin' when reauthenticating
      //
      if (!(options.silent || options.reauthenticated)) {
        if (account.hasAnonymousAccount()) {
          account.trigger('signin:anonymous', username);
        } else {
          account.trigger('signin', username, hoodieId);
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
  function handlePasswordResetStatusRequestSuccess(passwordResetObject) {
    var error;

    if (passwordResetObject.$error) {
      error = passwordResetObject.$error;
      error.object = passwordResetObject;
      delete error.object.$error;
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
    account.on('error:passwordreset', removePasswordResetObject );
    account.on('error:passwordreset', defer.reject );

    // clean up callbacks when either gets called
    defer.always( function() {
      account.unbind('passwordreset', defer.resolve );
      account.unbind('error:passwordreset', removePasswordResetObject );
      account.unbind('error:passwordreset', defer.reject );
    });

    return defer.promise();
  }

  //
  // when a password reset fails, remove it from /_users
  //
  function removePasswordResetObject (error) {
    var passwordResetObject = error.object;

    // get username & password for authentication
    var username = passwordResetObject.name; // $passwordReset/username/randomhash
    var password = username.substr(15); // => // username/randomhash
    var url = '/_users/' + (encodeURIComponent(userDocPrefix + ':' + username));
    var hash = btoa(username + ':' + password);

    // mark as deleted
    passwordResetObject._deleted = true;

    var options = {
      headers: {
        Authorization: 'Basic ' + hash
      },
      contentType: 'application/json',
      data: JSON.stringify(passwordResetObject)
    };

    // cleanup
    account.request('PUT', url, options);
    hoodie.config.unset('_account.resetPasswordId');
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
  function cleanup() {

    // hoodie.store is listening on this one
    account.trigger('cleanup');
    authenticated = undefined;
    setUsername(undefined);

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
  // its hoodie.id() (see `anonymousSignUp`)
  //
  // We differentiate with `hasAnonymousAccount()`, because `userTypeAndId`
  // is used within `signUp` method, so we need to be able to differentiate
  // between anonymous and normal users before an account has been created.
  //
  function userTypeAndId(username) {
    var type;

    if (username === hoodie.id()) {
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

  // unsets a configuration. If configuration is present, calls
  // config.set(key, undefined). Otherwise resolves without store
  // interaction.
  //
  config.unset = function unset(key) {
    if (typeof config.get(key) === 'undefined') {
      return hoodie.resolve();
    }

    return config.set(key, undefined);
  };

  //
  // load current configuration from localStore.
  // The init method to be called on hoodie startup
  //
  function init() {
    // TODO: I really don't like this being here. And I don't like that if the
    //       store API will be truly async one day, this will fall on our feet.
    //       We should discuss if we make config a simple object in localStorage,
    //       outside of hoodie.store, and use localStorage sync API directly to
    //       interact with it, also in future versions.
    hoodie.store.find(type, id).done(function(obj) {
      cache = obj;
    });
  }

  // allow to run init only once
  config.init = function() {
    init();
    delete config.init;
  };

  //
  // subscribe to events coming from other modules
  //
  function subscribeToOutsideEvents() {
    hoodie.on('account:cleanup', config.clear);
  }

  // allow to run this once from outside
  config.subscribeToOutsideEvents = function() {
    subscribeToOutsideEvents();
    delete config.subscribeToOutsideEvents;
  };

  // exspose public API
  hoodie.config = config;
}

module.exports = hoodieConfig;

},{}],6:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// hoodie.checkConnection() & hoodie.isConnected()
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

    global.clearTimeout(checkConnectionTimeout);

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

    checkConnectionTimeout = global.setTimeout(hoodie.checkConnection, checkConnectionInterval);

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

    checkConnectionTimeout = global.setTimeout(hoodie.checkConnection, checkConnectionInterval);

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
    throw new Error('FATAL: error.message must be set');
  }

  // must check for properties, as this.name is always set.
  if (! properties.name) {
    properties.name = 'HoodieError';
  }

  extend(this, properties);

  properties.message = properties.message.replace(errorMessageReplacePattern, function(match) {
    var property = match.match(errorMessageFindPropertyPattern)[0];
    return properties[property];
  });

  extend(this, properties);
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
// hoodie.id
// =========

// generates a random id and persists using hoodie.config
// until the user signs out or deletes local data
function hoodieId (hoodie) {
  var id;

  function getId() {
    if (! id) {
      setId( hoodie.generateId() );
    }
    return id;
  }

  function setId(newId) {
    id = newId;
    hoodie.config.set('_hoodieId', newId);
  }

  function unsetId () {
    id = undefined;
    hoodie.config.unset('_hoodieId');
  }

  //
  // initialize
  //
  function init() {
    id = hoodie.config.get('_hoodieId');
  }

  // allow to run init only once from outside
  getId.init = function() {
    init();
    delete getId.init;
  };

  //
  // subscribe to events coming from other modules
  //
  function subscribeToOutsideEvents() {
    hoodie.on('account:cleanup', unsetId);
    hoodie.on('account:signin', function(username, hoodieId) {
      setId(hoodieId);
    });
  }

  // allow to run this only once from outside
  getId.subscribeToOutsideEvents = function() {
    subscribeToOutsideEvents();
    delete getId.subscribeToOutsideEvents;
  };

  //
  // Public API
  //
  hoodie.id = getId;
}

module.exports = hoodieId;

},{}],14:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// LocalStore
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
      object.createdBy = object.createdBy || hoodie.id();
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
      if (!global.localStorage) {
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
      return global.localStorage.getItem(key);
    },
    setItem: function(key, value) {
      return global.localStorage.setItem(key, value);
    },
    removeItem: function(key) {
      return global.localStorage.removeItem(key);
    },
    key: function(nr) {
      return global.localStorage.key(nr);
    },
    length: function() {
      return global.localStorage.length;
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
        return extend(true, {}, cachedObject[key]);
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
    cachedObject[key] = extend(true, {}, object);

    if (hasLocalChanges(object)) {
      markAsChanged(type, id, cachedObject[key], options);
    } else {
      clearChanged(type, id);
    }

    return extend(true, {}, object);
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
    return global.clearTimeout(dirtyTimeout);
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
    store = extend({}, object);

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
    store.trigger(eventName, extend(true, {}, object), options);
    store.trigger(object.type + ':' + eventName, extend(true, {}, object), options);

    // DEPRECATED
    // https://github.com/hoodiehq/hoodie.js/issues/146
    store.trigger(eventName + ':' + object.type, extend(true, {}, object), options);

    if (eventName !== 'new') {
      store.trigger( object.type + ':' + object.id+ ':' + eventName, extend(true, {}, object), options);

      // DEPRECATED
      // https://github.com/hoodiehq/hoodie.js/issues/146
      store.trigger( eventName + ':' + object.type + ':' + object.id, extend(true, {}, object), options);
    }



    // sync events have no changes, so we don't trigger
    // "change" events.
    if (eventName === 'sync') {
      return;
    }

    store.trigger('change', eventName, extend(true, {}, object), options);
    store.trigger(object.type + ':change', eventName, extend(true, {}, object), options);

    // DEPRECATED
    // https://github.com/hoodiehq/hoodie.js/issues/146
    store.trigger('change:' + object.type, eventName, extend(true, {}, object), options);


    if (eventName !== 'new') {
      store.trigger(object.type + ':' + object.id + ':change', eventName, extend(true, {}, object), options);

      // DEPRECATED
      // https://github.com/hoodiehq/hoodie.js/issues/146
      store.trigger('change:' + object.type + ':' + object.id, eventName, extend(true, {}, object), options);
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
    global.clearTimeout(dirtyTimeout);

    dirtyTimeout = global.setTimeout(function() {
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

},{"./error/object_id":9,"./error/object_type":10,"./store":21,"extend":1}],15:[function(require,module,exports){
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

},{"./remote_store":17,"extend":1}],16:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// Hoodie Defers / Promises
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
  var $defer = global.jQuery.Deferred;

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

},{"./error":8}],17:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// Remote
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
      global.clearTimeout(pullRequestTimeout);
      pullRequestTimeout = global.setTimeout(restartPullRequest, 25000);
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
      return global.setTimeout(remote.pull, 3000);

    case 500:
      //
      // Please server, don't give us these. At least not persistently
      //
      remote.trigger('error:server', error);
      global.setTimeout(remote.pull, 3000);
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
        global.setTimeout(remote.pull, 3000);
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

},{"./store":21,"extend":1}],18:[function(require,module,exports){
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

},{"extend":1}],19:[function(require,module,exports){
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

},{"./events":11}],20:[function(require,module,exports){
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

},{"./events":11}],21:[function(require,module,exports){
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
            // workaround for undefined values, as extend ignores these
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

},{"./error":8,"./error/object_id":9,"./error/object_type":10,"./events":11,"./scoped_store":19,"extend":1}],22:[function(require,module,exports){
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

},{"./error":8,"./events":11,"./scoped_task":20,"extend":1}]},{},[2])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL25vZGVfbW9kdWxlcy9leHRlbmQvaW5kZXguanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvYWNjb3VudC5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9hY2NvdW50X3JlbW90ZS5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9jb25maWcuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvY29ubmVjdGlvbi5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9kaXNwb3NlLmpzIiwiL1VzZXJzL2dyZWdvci9KYXZhU2NyaXB0cy9ob29kLmllL2hvb2RpZS5qcy9zcmMvaG9vZGllL2Vycm9yLmpzIiwiL1VzZXJzL2dyZWdvci9KYXZhU2NyaXB0cy9ob29kLmllL2hvb2RpZS5qcy9zcmMvaG9vZGllL2Vycm9yL29iamVjdF9pZC5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9lcnJvci9vYmplY3RfdHlwZS5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9ldmVudHMuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvZ2VuZXJhdGVfaWQuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvaWQuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvbG9jYWxfc3RvcmUuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvb3Blbi5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9wcm9taXNlcy5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9yZW1vdGVfc3RvcmUuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvcmVxdWVzdC5qcyIsIi9Vc2Vycy9ncmVnb3IvSmF2YVNjcmlwdHMvaG9vZC5pZS9ob29kaWUuanMvc3JjL2hvb2RpZS9zY29wZWRfc3RvcmUuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvc2NvcGVkX3Rhc2suanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvc3RvcmUuanMiLCIvVXNlcnMvZ3JlZ29yL0phdmFTY3JpcHRzL2hvb2QuaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvdGFzay5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JtQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcjlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuZnVuY3Rpb24gaXNQbGFpbk9iamVjdChvYmopIHtcblx0aWYgKCFvYmogfHwgdG9TdHJpbmcuY2FsbChvYmopICE9PSAnW29iamVjdCBPYmplY3RdJyB8fCBvYmoubm9kZVR5cGUgfHwgb2JqLnNldEludGVydmFsKVxuXHRcdHJldHVybiBmYWxzZTtcblxuXHR2YXIgaGFzX293bl9jb25zdHJ1Y3RvciA9IGhhc093bi5jYWxsKG9iaiwgJ2NvbnN0cnVjdG9yJyk7XG5cdHZhciBoYXNfaXNfcHJvcGVydHlfb2ZfbWV0aG9kID0gaGFzT3duLmNhbGwob2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSwgJ2lzUHJvdG90eXBlT2YnKTtcblx0Ly8gTm90IG93biBjb25zdHJ1Y3RvciBwcm9wZXJ0eSBtdXN0IGJlIE9iamVjdFxuXHRpZiAob2JqLmNvbnN0cnVjdG9yICYmICFoYXNfb3duX2NvbnN0cnVjdG9yICYmICFoYXNfaXNfcHJvcGVydHlfb2ZfbWV0aG9kKVxuXHRcdHJldHVybiBmYWxzZTtcblxuXHQvLyBPd24gcHJvcGVydGllcyBhcmUgZW51bWVyYXRlZCBmaXJzdGx5LCBzbyB0byBzcGVlZCB1cCxcblx0Ly8gaWYgbGFzdCBvbmUgaXMgb3duLCB0aGVuIGFsbCBwcm9wZXJ0aWVzIGFyZSBvd24uXG5cdHZhciBrZXk7XG5cdGZvciAoIGtleSBpbiBvYmogKSB7fVxuXG5cdHJldHVybiBrZXkgPT09IHVuZGVmaW5lZCB8fCBoYXNPd24uY2FsbCggb2JqLCBrZXkgKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZXh0ZW5kKCkge1xuXHR2YXIgb3B0aW9ucywgbmFtZSwgc3JjLCBjb3B5LCBjb3B5SXNBcnJheSwgY2xvbmUsXG5cdCAgICB0YXJnZXQgPSBhcmd1bWVudHNbMF0gfHwge30sXG5cdCAgICBpID0gMSxcblx0ICAgIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGgsXG5cdCAgICBkZWVwID0gZmFsc2U7XG5cblx0Ly8gSGFuZGxlIGEgZGVlcCBjb3B5IHNpdHVhdGlvblxuXHRpZiAoIHR5cGVvZiB0YXJnZXQgPT09IFwiYm9vbGVhblwiICkge1xuXHRcdGRlZXAgPSB0YXJnZXQ7XG5cdFx0dGFyZ2V0ID0gYXJndW1lbnRzWzFdIHx8IHt9O1xuXHRcdC8vIHNraXAgdGhlIGJvb2xlYW4gYW5kIHRoZSB0YXJnZXRcblx0XHRpID0gMjtcblx0fVxuXG5cdC8vIEhhbmRsZSBjYXNlIHdoZW4gdGFyZ2V0IGlzIGEgc3RyaW5nIG9yIHNvbWV0aGluZyAocG9zc2libGUgaW4gZGVlcCBjb3B5KVxuXHRpZiAoIHR5cGVvZiB0YXJnZXQgIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHRhcmdldCAhPT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0dGFyZ2V0ID0ge307XG5cdH1cblxuXHRmb3IgKCA7IGkgPCBsZW5ndGg7IGkrKyApIHtcblx0XHQvLyBPbmx5IGRlYWwgd2l0aCBub24tbnVsbC91bmRlZmluZWQgdmFsdWVzXG5cdFx0aWYgKCAob3B0aW9ucyA9IGFyZ3VtZW50c1sgaSBdKSAhPSBudWxsICkge1xuXHRcdFx0Ly8gRXh0ZW5kIHRoZSBiYXNlIG9iamVjdFxuXHRcdFx0Zm9yICggbmFtZSBpbiBvcHRpb25zICkge1xuXHRcdFx0XHRzcmMgPSB0YXJnZXRbIG5hbWUgXTtcblx0XHRcdFx0Y29weSA9IG9wdGlvbnNbIG5hbWUgXTtcblxuXHRcdFx0XHQvLyBQcmV2ZW50IG5ldmVyLWVuZGluZyBsb29wXG5cdFx0XHRcdGlmICggdGFyZ2V0ID09PSBjb3B5ICkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gUmVjdXJzZSBpZiB3ZSdyZSBtZXJnaW5nIHBsYWluIG9iamVjdHMgb3IgYXJyYXlzXG5cdFx0XHRcdGlmICggZGVlcCAmJiBjb3B5ICYmICggaXNQbGFpbk9iamVjdChjb3B5KSB8fCAoY29weUlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGNvcHkpKSApICkge1xuXHRcdFx0XHRcdGlmICggY29weUlzQXJyYXkgKSB7XG5cdFx0XHRcdFx0XHRjb3B5SXNBcnJheSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0Y2xvbmUgPSBzcmMgJiYgQXJyYXkuaXNBcnJheShzcmMpID8gc3JjIDogW107XG5cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y2xvbmUgPSBzcmMgJiYgaXNQbGFpbk9iamVjdChzcmMpID8gc3JjIDoge307XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gTmV2ZXIgbW92ZSBvcmlnaW5hbCBvYmplY3RzLCBjbG9uZSB0aGVtXG5cdFx0XHRcdFx0dGFyZ2V0WyBuYW1lIF0gPSBleHRlbmQoIGRlZXAsIGNsb25lLCBjb3B5ICk7XG5cblx0XHRcdFx0Ly8gRG9uJ3QgYnJpbmcgaW4gdW5kZWZpbmVkIHZhbHVlc1xuXHRcdFx0XHR9IGVsc2UgaWYgKCBjb3B5ICE9PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRcdFx0dGFyZ2V0WyBuYW1lIF0gPSBjb3B5O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gUmV0dXJuIHRoZSBtb2RpZmllZCBvYmplY3Rcblx0cmV0dXJuIHRhcmdldDtcbn07XG4iLCJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTsvLyBIb29kaWUgQ29yZVxuLy8gLS0tLS0tLS0tLS0tLVxuLy9cbi8vIHRoZSBkb29yIHRvIHdvcmxkIGRvbWluYXRpb24gKGFwcHMpXG4vL1xuXG52YXIgaG9vZGllQWNjb3VudCA9IHJlcXVpcmUoJy4vaG9vZGllL2FjY291bnQnKTtcbnZhciBob29kaWVBY2NvdW50UmVtb3RlID0gcmVxdWlyZSgnLi9ob29kaWUvYWNjb3VudF9yZW1vdGUnKTtcbnZhciBob29kaWVDb25maWcgPSByZXF1aXJlKCcuL2hvb2RpZS9jb25maWcnKTtcbnZhciBob29kaWVDb25uZWN0aW9uID0gcmVxdWlyZSgnLi9ob29kaWUvY29ubmVjdGlvbicpO1xudmFyIGhvb2RpZURpc3Bvc2UgPSByZXF1aXJlKCcuL2hvb2RpZS9kaXNwb3NlJyk7XG52YXIgaG9vZGllRXZlbnRzID0gcmVxdWlyZSgnLi9ob29kaWUvZXZlbnRzJyk7XG52YXIgaG9vZGllR2VuZXJhdGVJZCA9IHJlcXVpcmUoJy4vaG9vZGllL2dlbmVyYXRlX2lkJyk7XG52YXIgaG9vZGllSWQgPSByZXF1aXJlKCcuL2hvb2RpZS9pZCcpO1xudmFyIGhvb2RpZUxvY2FsU3RvcmUgPSByZXF1aXJlKCcuL2hvb2RpZS9sb2NhbF9zdG9yZScpO1xudmFyIGhvb2RpZU9wZW4gPSByZXF1aXJlKCcuL2hvb2RpZS9vcGVuJyk7XG52YXIgaG9vZGllUHJvbWlzZXMgPSByZXF1aXJlKCcuL2hvb2RpZS9wcm9taXNlcycpO1xudmFyIGhvb2RpZVJlcXVlc3QgPSByZXF1aXJlKCcuL2hvb2RpZS9yZXF1ZXN0Jyk7XG52YXIgaG9vZGllVGFzayA9IHJlcXVpcmUoJy4vaG9vZGllL3Rhc2snKTtcblxuLy8gQ29uc3RydWN0b3Jcbi8vIC0tLS0tLS0tLS0tLS1cblxuLy8gV2hlbiBpbml0aWFsaXppbmcgYSBob29kaWUgaW5zdGFuY2UsIGFuIG9wdGlvbmFsIFVSTFxuLy8gY2FuIGJlIHBhc3NlZC4gVGhhdCdzIHRoZSBVUkwgb2YgdGhlIGhvb2RpZSBiYWNrZW5kLlxuLy8gSWYgbm8gVVJMIHBhc3NlZCBpdCBkZWZhdWx0cyB0byB0aGUgY3VycmVudCBkb21haW4uXG4vL1xuLy8gICAgIC8vIGluaXQgYSBuZXcgaG9vZGllIGluc3RhbmNlXG4vLyAgICAgaG9vZGllID0gbmV3IEhvb2RpZVxuLy9cbmZ1bmN0aW9uIEhvb2RpZShiYXNlVXJsKSB7XG4gIHZhciBob29kaWUgPSB0aGlzO1xuXG4gIC8vIGVuZm9yY2UgaW5pdGlhbGl6YXRpb24gd2l0aCBgbmV3YFxuICBpZiAoIShob29kaWUgaW5zdGFuY2VvZiBIb29kaWUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1c2FnZTogbmV3IEhvb2RpZSh1cmwpOycpO1xuICB9XG5cbiAgaWYgKGJhc2VVcmwpIHtcbiAgICAvLyByZW1vdmUgdHJhaWxpbmcgc2xhc2hlc1xuICAgIGhvb2RpZS5iYXNlVXJsID0gYmFzZVVybC5yZXBsYWNlKC9cXC8rJC8sICcnKTtcbiAgfVxuXG5cbiAgLy8gaG9vZGllLmV4dGVuZFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBleHRlbmQgaG9vZGllIGluc3RhbmNlOlxuICAvL1xuICAvLyAgICAgaG9vZGllLmV4dGVuZChmdW5jdGlvbihob29kaWUpIHt9IClcbiAgLy9cbiAgaG9vZGllLmV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZChleHRlbnNpb24pIHtcbiAgICBleHRlbnNpb24oaG9vZGllKTtcbiAgfTtcblxuXG4gIC8vXG4gIC8vIEV4dGVuZGluZyBob29kaWUgY29yZVxuICAvL1xuXG4gIC8vICogaG9vZGllLmJpbmRcbiAgLy8gKiBob29kaWUub25cbiAgLy8gKiBob29kaWUub25lXG4gIC8vICogaG9vZGllLnRyaWdnZXJcbiAgLy8gKiBob29kaWUudW5iaW5kXG4gIC8vICogaG9vZGllLm9mZlxuICBob29kaWUuZXh0ZW5kKGhvb2RpZUV2ZW50cyk7XG5cblxuICAvLyAqIGhvb2RpZS5kZWZlclxuICAvLyAqIGhvb2RpZS5pc1Byb21pc2VcbiAgLy8gKiBob29kaWUucmVzb2x2ZVxuICAvLyAqIGhvb2RpZS5yZWplY3RcbiAgLy8gKiBob29kaWUucmVzb2x2ZVdpdGhcbiAgLy8gKiBob29kaWUucmVqZWN0V2l0aFxuICBob29kaWUuZXh0ZW5kKGhvb2RpZVByb21pc2VzICk7XG5cbiAgLy8gKiBob29kaWUucmVxdWVzdFxuICBob29kaWUuZXh0ZW5kKGhvb2RpZVJlcXVlc3QpO1xuXG4gIC8vICogaG9vZGllLmlzT25saW5lXG4gIC8vICogaG9vZGllLmNoZWNrQ29ubmVjdGlvblxuICBob29kaWUuZXh0ZW5kKGhvb2RpZUNvbm5lY3Rpb24pO1xuXG4gIC8vICogaG9vZGllLnV1aWRcbiAgaG9vZGllLmV4dGVuZChob29kaWVHZW5lcmF0ZUlkKTtcblxuICAvLyAqIGhvb2RpZS5kaXNwb3NlXG4gIGhvb2RpZS5leHRlbmQoaG9vZGllRGlzcG9zZSk7XG5cbiAgLy8gKiBob29kaWUub3BlblxuICBob29kaWUuZXh0ZW5kKGhvb2RpZU9wZW4pO1xuXG4gIC8vICogaG9vZGllLnN0b3JlXG4gIGhvb2RpZS5leHRlbmQoaG9vZGllTG9jYWxTdG9yZSk7XG5cbiAgLy8gKiBob29kaWUudGFza1xuICBob29kaWUuZXh0ZW5kKGhvb2RpZVRhc2spO1xuXG4gIC8vICogaG9vZGllLmNvbmZpZ1xuICBob29kaWUuZXh0ZW5kKGhvb2RpZUNvbmZpZyk7XG5cbiAgLy8gKiBob29kaWUuYWNjb3VudFxuICBob29kaWUuZXh0ZW5kKGhvb2RpZUFjY291bnQpO1xuXG4gIC8vICogaG9vZGllLnJlbW90ZVxuICBob29kaWUuZXh0ZW5kKGhvb2RpZUFjY291bnRSZW1vdGUpO1xuXG4gIC8vICogaG9vZGllLmlkXG4gIGhvb2RpZS5leHRlbmQoaG9vZGllSWQpO1xuXG5cbiAgLy9cbiAgLy8gSW5pdGlhbGl6YXRpb25zXG4gIC8vXG5cbiAgLy8gaW5pdCBjb25maWdcbiAgaG9vZGllLmNvbmZpZy5pbml0KCk7XG5cbiAgLy8gaW5pdCBob29kaWVJZFxuICBob29kaWUuaWQuaW5pdCgpO1xuXG4gIC8vIHNldCB1c2VybmFtZSBmcm9tIGNvbmZpZyAobG9jYWwgc3RvcmUpXG4gIGhvb2RpZS5hY2NvdW50LnVzZXJuYW1lID0gaG9vZGllLmNvbmZpZy5nZXQoJ19hY2NvdW50LnVzZXJuYW1lJyk7XG5cbiAgLy8gY2hlY2sgZm9yIHBlbmRpbmcgcGFzc3dvcmQgcmVzZXRcbiAgaG9vZGllLmFjY291bnQuY2hlY2tQYXNzd29yZFJlc2V0KCk7XG5cbiAgLy8gaG9vZGllLmlkXG4gIGhvb2RpZS5pZC5zdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKTtcblxuICAvLyBob29kaWUuY29uZmlnXG4gIGhvb2RpZS5jb25maWcuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG5cbiAgLy8gaG9vZGllLnN0b3JlXG4gIGhvb2RpZS5zdG9yZS5wYXRjaElmTm90UGVyc2lzdGFudCgpO1xuICBob29kaWUuc3RvcmUuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG4gIGhvb2RpZS5zdG9yZS5ib290c3RyYXBEaXJ0eU9iamVjdHMoKTtcblxuICAvLyBob29kaWUucmVtb3RlXG4gIGhvb2RpZS5yZW1vdGUuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG5cbiAgLy8gaG9vZGllLnRhc2tcbiAgaG9vZGllLnRhc2suc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG5cbiAgLy8gYXV0aGVudGljYXRlXG4gIC8vIHdlIHVzZSBhIGNsb3N1cmUgdG8gbm90IHBhc3MgdGhlIHVzZXJuYW1lIHRvIGNvbm5lY3QsIGFzIGl0XG4gIC8vIHdvdWxkIHNldCB0aGUgbmFtZSBvZiB0aGUgcmVtb3RlIHN0b3JlLCB3aGljaCBpcyBub3QgdGhlIHVzZXJuYW1lLlxuICBob29kaWUuYWNjb3VudC5hdXRoZW50aWNhdGUoKS50aGVuKCBmdW5jdGlvbiggLyogdXNlcm5hbWUgKi8gKSB7XG4gICAgaG9vZGllLnJlbW90ZS5jb25uZWN0KCk7XG4gIH0pO1xuXG4gIC8vIGNoZWNrIGNvbm5lY3Rpb24gd2hlbiBicm93c2VyIGdvZXMgb25saW5lIC8gb2ZmbGluZVxuICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcignb25saW5lJywgaG9vZGllLmNoZWNrQ29ubmVjdGlvbiwgZmFsc2UpO1xuICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcignb2ZmbGluZScsIGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24sIGZhbHNlKTtcblxuICAvLyBzdGFydCBjaGVja2luZyBjb25uZWN0aW9uXG4gIGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24oKTtcblxuICAvL1xuICAvLyBsb2FkaW5nIHVzZXIgZXh0ZW5zaW9uc1xuICAvL1xuICBhcHBseUV4dGVuc2lvbnMoaG9vZGllKTtcbn1cblxuLy8gRXh0ZW5kaW5nIGhvb2RpZVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFlvdSBjYW4gZXh0ZW5kIHRoZSBIb29kaWUgY2xhc3MgbGlrZSBzbzpcbi8vXG4vLyBIb29kaWUuZXh0ZW5kKGZ1bmNpb24oaG9vZGllKSB7IGhvb2RpZS5teU1hZ2ljID0gZnVuY3Rpb24oKSB7fSB9KVxuLy9cblxudmFyIGV4dGVuc2lvbnMgPSBbXTtcblxuSG9vZGllLmV4dGVuZCA9IGZ1bmN0aW9uKGV4dGVuc2lvbikge1xuICBleHRlbnNpb25zLnB1c2goZXh0ZW5zaW9uKTtcbn07XG5cbi8vXG4vLyBkZXRlY3QgYXZhaWxhYmxlIGV4dGVuc2lvbnMgYW5kIGF0dGFjaCB0byBIb29kaWUgT2JqZWN0LlxuLy9cbmZ1bmN0aW9uIGFwcGx5RXh0ZW5zaW9ucyhob29kaWUpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBleHRlbnNpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgZXh0ZW5zaW9uc1tpXShob29kaWUpO1xuICB9XG59XG5cbi8vXG4vLyBleHBvc2UgSG9vZGllIHRvIG1vZHVsZSBsb2FkZXJzLiBCYXNlZCBvbiBqUXVlcnkncyBpbXBsZW1lbnRhdGlvbi5cbi8vXG5pZiAoIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZSAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuXG4gIC8vIEV4cG9zZSBIb29kaWUgYXMgbW9kdWxlLmV4cG9ydHMgaW4gbG9hZGVycyB0aGF0IGltcGxlbWVudCB0aGUgTm9kZVxuICAvLyBtb2R1bGUgcGF0dGVybiAoaW5jbHVkaW5nIGJyb3dzZXJpZnkpLiBEbyBub3QgY3JlYXRlIHRoZSBnbG9iYWwsIHNpbmNlXG4gIC8vIHRoZSB1c2VyIHdpbGwgYmUgc3RvcmluZyBpdCB0aGVtc2VsdmVzIGxvY2FsbHksIGFuZCBnbG9iYWxzIGFyZSBmcm93bmVkXG4gIC8vIHVwb24gaW4gdGhlIE5vZGUgbW9kdWxlIHdvcmxkLlxuICBtb2R1bGUuZXhwb3J0cyA9IEhvb2RpZTtcblxuXG59IGVsc2UgaWYgKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG5cbiAgLy8gUmVnaXN0ZXIgYXMgYSBuYW1lZCBBTUQgbW9kdWxlLCBzaW5jZSBIb29kaWUgY2FuIGJlIGNvbmNhdGVuYXRlZCB3aXRoIG90aGVyXG4gIC8vIGZpbGVzIHRoYXQgbWF5IHVzZSBkZWZpbmUsIGJ1dCBub3QgdmlhIGEgcHJvcGVyIGNvbmNhdGVuYXRpb24gc2NyaXB0IHRoYXRcbiAgLy8gdW5kZXJzdGFuZHMgYW5vbnltb3VzIEFNRCBtb2R1bGVzLiBBIG5hbWVkIEFNRCBpcyBzYWZlc3QgYW5kIG1vc3Qgcm9idXN0XG4gIC8vIHdheSB0byByZWdpc3Rlci4gTG93ZXJjYXNlIGhvb2RpZSBpcyB1c2VkIGJlY2F1c2UgQU1EIG1vZHVsZSBuYW1lcyBhcmVcbiAgLy8gZGVyaXZlZCBmcm9tIGZpbGUgbmFtZXMsIGFuZCBIb29kaWUgaXMgbm9ybWFsbHkgZGVsaXZlcmVkIGluIGEgbG93ZXJjYXNlXG4gIC8vIGZpbGUgbmFtZS5cbiAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gSG9vZGllO1xuICB9KTtcblxufSBlbHNlIHtcblxuICAvLyBzZXQgZ2xvYmFsXG4gIGdsb2JhbC5Ib29kaWUgPSBIb29kaWU7XG59XG4iLCJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTsvLyBIb29kaWUuQWNjb3VudFxuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgaG9vZGllRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKTtcblxuLy9cbmZ1bmN0aW9uIGhvb2RpZUFjY291bnQgKGhvb2RpZSkge1xuICAvLyBwdWJsaWMgQVBJXG4gIHZhciBhY2NvdW50ID0ge307XG5cbiAgLy8gZmxhZyB3aGV0aGVyIHVzZXIgaXMgY3VycmVudGx5IGF1dGhlbnRpY2F0ZWQgb3Igbm90XG4gIHZhciBhdXRoZW50aWNhdGVkO1xuXG4gIC8vIGNhY2hlIGZvciBDb3VjaERCIF91c2VycyBkb2NcbiAgdmFyIHVzZXJEb2MgPSB7fTtcblxuICAvLyBtYXAgb2YgcmVxdWVzdFByb21pc2VzLiBXZSBtYWludGFpbiB0aGlzIGxpc3QgdG8gYXZvaWQgc2VuZGluZ1xuICAvLyB0aGUgc2FtZSByZXF1ZXN0cyBzZXZlcmFsIHRpbWVzLlxuICB2YXIgcmVxdWVzdHMgPSB7fTtcblxuICAvLyBkZWZhdWx0IGNvdWNoREIgdXNlciBkb2MgcHJlZml4XG4gIHZhciB1c2VyRG9jUHJlZml4ID0gJ29yZy5jb3VjaGRiLnVzZXInO1xuXG4gIC8vIGFkZCBldmVudHMgQVBJXG4gIGhvb2RpZUV2ZW50cyhob29kaWUsIHsgY29udGV4dDogYWNjb3VudCwgbmFtZXNwYWNlOiAnYWNjb3VudCd9KTtcblxuICAvLyBBdXRoZW50aWNhdGVcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBVc2UgdGhpcyBtZXRob2QgdG8gYXNzdXJlIHRoYXQgdGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZDpcbiAgLy8gYGhvb2RpZS5hY2NvdW50LmF1dGhlbnRpY2F0ZSgpLmRvbmUoIGRvU29tZXRoaW5nICkuZmFpbCggaGFuZGxlRXJyb3IgKWBcbiAgLy9cbiAgYWNjb3VudC5hdXRoZW50aWNhdGUgPSBmdW5jdGlvbiBhdXRoZW50aWNhdGUoKSB7XG4gICAgdmFyIHNlbmRBbmRIYW5kbGVBdXRoUmVxdWVzdDtcblxuICAgIC8vIGFscmVhZHkgdHJpZWQgdG8gYXV0aGVudGljYXRlLCBhbmQgZmFpbGVkXG4gICAgaWYgKGF1dGhlbnRpY2F0ZWQgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdCgpO1xuICAgIH1cblxuICAgIC8vIGFscmVhZHkgdHJpZWQgdG8gYXV0aGVudGljYXRlLCBhbmQgc3VjY2VlZGVkXG4gICAgaWYgKGF1dGhlbnRpY2F0ZWQgPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZVdpdGgoYWNjb3VudC51c2VybmFtZSk7XG4gICAgfVxuXG4gICAgLy8gaWYgdGhlcmUgaXMgYSBwZW5kaW5nIHNpZ25PdXQgcmVxdWVzdCwgcmV0dXJuIGl0cyBwcm9taXNlLFxuICAgIC8vIGJ1dCBwaXBlIGl0IHNvIHRoYXQgaXQgYWx3YXlzIGVuZHMgdXAgcmVqZWN0ZWRcbiAgICAvL1xuICAgIGlmIChyZXF1ZXN0cy5zaWduT3V0ICYmIHJlcXVlc3RzLnNpZ25PdXQuc3RhdGUoKSA9PT0gJ3BlbmRpbmcnKSB7XG4gICAgICByZXR1cm4gcmVxdWVzdHMuc2lnbk91dC50aGVuKGhvb2RpZS5yZWplY3QpO1xuICAgIH1cblxuICAgIC8vIGlmIHRoZXJlIGlzIGEgcGVuZGluZyBzaWduSW4gcmVxdWVzdCwgcmV0dXJuIGl0cyBwcm9taXNlXG4gICAgLy9cbiAgICBpZiAocmVxdWVzdHMuc2lnbkluICYmIHJlcXVlc3RzLnNpZ25Jbi5zdGF0ZSgpID09PSAncGVuZGluZycpIHtcbiAgICAgIHJldHVybiByZXF1ZXN0cy5zaWduSW47XG4gICAgfVxuXG4gICAgLy8gaWYgdXNlciBoYXMgbm8gYWNjb3VudCwgbWFrZSBzdXJlIHRvIGVuZCB0aGUgc2Vzc2lvblxuICAgIGlmICghIGFjY291bnQuaGFzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gc2VuZFNpZ25PdXRSZXF1ZXN0KCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gaG9vZGllLnJlamVjdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gc2VuZCByZXF1ZXN0IHRvIGNoZWNrIGZvciBzZXNzaW9uIHN0YXR1cy4gSWYgdGhlcmUgaXMgYVxuICAgIC8vIHBlbmRpbmcgcmVxdWVzdCBhbHJlYWR5LCByZXR1cm4gaXRzIHByb21pc2UuXG4gICAgLy9cbiAgICBzZW5kQW5kSGFuZGxlQXV0aFJlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhY2NvdW50LnJlcXVlc3QoJ0dFVCcsICcvX3Nlc3Npb24nKS50aGVuKFxuICAgICAgICBoYW5kbGVBdXRoZW50aWNhdGVSZXF1ZXN0U3VjY2Vzc1xuICAgICAgKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHdpdGhTaW5nbGVSZXF1ZXN0KCdhdXRoZW50aWNhdGUnLCBzZW5kQW5kSGFuZGxlQXV0aFJlcXVlc3QpO1xuICB9O1xuXG5cbiAgLy8gaGFzVmFsaWRTZXNzaW9uXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmV0dXJucyB0cnVlIGlmIHRoZSB1c2VyIGlzIGN1cnJlbnRseSBzaWduZWQgYnV0IGhhcyBubyB2YWxpZCBzZXNzaW9uLFxuICAvLyBtZWFuaW5nIHRoYXQgdGhlIGRhdGEgY2Fubm90IGJlIHN5bmNocm9uaXplZC5cbiAgLy9cbiAgYWNjb3VudC5oYXNWYWxpZFNlc3Npb24gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoISBhY2NvdW50Lmhhc0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBhdXRoZW50aWNhdGVkID09PSB0cnVlO1xuICB9O1xuXG5cbiAgLy8gaGFzSW52YWxpZFNlc3Npb25cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyByZXR1cm5zIHRydWUgaWYgdGhlIHVzZXIgaXMgY3VycmVudGx5IHNpZ25lZCBidXQgaGFzIG5vIHZhbGlkIHNlc3Npb24sXG4gIC8vIG1lYW5pbmcgdGhhdCB0aGUgZGF0YSBjYW5ub3QgYmUgc3luY2hyb25pemVkLlxuICAvL1xuICBhY2NvdW50Lmhhc0ludmFsaWRTZXNzaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEgYWNjb3VudC5oYXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXV0aGVudGljYXRlZCA9PT0gZmFsc2U7XG4gIH07XG5cblxuICAvLyBzaWduIHVwIHdpdGggdXNlcm5hbWUgJiBwYXNzd29yZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gdXNlcyBzdGFuZGFyZCBDb3VjaERCIEFQSSB0byBjcmVhdGUgYSBuZXcgZG9jdW1lbnQgaW4gX3VzZXJzIGRiLlxuICAvLyBUaGUgYmFja2VuZCB3aWxsIGF1dG9tYXRpY2FsbHkgY3JlYXRlIGEgdXNlckRCIGJhc2VkIG9uIHRoZSB1c2VybmFtZVxuICAvLyBhZGRyZXNzIGFuZCBhcHByb3ZlIHRoZSBhY2NvdW50IGJ5IGFkZGluZyBhICdjb25maXJtZWQnIHJvbGUgdG8gdGhlXG4gIC8vIHVzZXIgZG9jLiBUaGUgYWNjb3VudCBjb25maXJtYXRpb24gbWlnaHQgdGFrZSBhIHdoaWxlLCBzbyB3ZSBrZWVwIHRyeWluZ1xuICAvLyB0byBzaWduIGluIHdpdGggYSAzMDBtcyB0aW1lb3V0LlxuICAvL1xuICBhY2NvdW50LnNpZ25VcCA9IGZ1bmN0aW9uIHNpZ25VcCh1c2VybmFtZSwgcGFzc3dvcmQpIHtcblxuICAgIGlmIChwYXNzd29yZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBwYXNzd29yZCA9ICcnO1xuICAgIH1cblxuICAgIGlmICghdXNlcm5hbWUpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aCgnVXNlcm5hbWUgbXVzdCBiZSBzZXQuJyk7XG4gICAgfVxuXG4gICAgaWYgKGFjY291bnQuaGFzQW5vbnltb3VzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gdXBncmFkZUFub255bW91c0FjY291bnQodXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICB9XG5cbiAgICBpZiAoYWNjb3VudC5oYXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aCgnTXVzdCBzaWduIG91dCBmaXJzdC4nKTtcbiAgICB9XG5cbiAgICAvLyBkb3duY2FzZSB1c2VybmFtZVxuICAgIHVzZXJuYW1lID0gdXNlcm5hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBfaWQ6IHVzZXJEb2NLZXkodXNlcm5hbWUpLFxuICAgICAgICBuYW1lOiB1c2VyVHlwZUFuZElkKHVzZXJuYW1lKSxcbiAgICAgICAgdHlwZTogJ3VzZXInLFxuICAgICAgICByb2xlczogW10sXG4gICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcbiAgICAgICAgaG9vZGllSWQ6IGhvb2RpZS5pZCgpLFxuICAgICAgICBkYXRhYmFzZTogYWNjb3VudC5kYigpLFxuICAgICAgICB1cGRhdGVkQXQ6IG5vdygpLFxuICAgICAgICBjcmVhdGVkQXQ6IG5vdygpLFxuICAgICAgICBzaWduZWRVcEF0OiB1c2VybmFtZSAhPT0gaG9vZGllLmlkKCkgPyBub3coKSA6IHZvaWQgMFxuICAgICAgfSksXG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfTtcblxuICAgIHJldHVybiBhY2NvdW50LnJlcXVlc3QoJ1BVVCcsIHVzZXJEb2NVcmwodXNlcm5hbWUpLCBvcHRpb25zKS50aGVuKFxuICAgICAgaGFuZGxlU2lnblVwU3VjY2Vzcyh1c2VybmFtZSwgcGFzc3dvcmQpLFxuICAgICAgaGFuZGxlU2lnblVwRXJyb3IodXNlcm5hbWUpXG4gICAgKTtcbiAgfTtcblxuXG4gIC8vIGFub255bW91cyBzaWduIHVwXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBJZiB0aGUgdXNlciBkaWQgbm90IHNpZ24gdXAgaGltc2VsZiB5ZXQsIGJ1dCBkYXRhIG5lZWRzIHRvIGJlIHRyYW5zZmVyZWRcbiAgLy8gdG8gdGhlIGNvdWNoLCBlLmcuIHRvIHNlbmQgYW4gZW1haWwgb3IgdG8gc2hhcmUgZGF0YSwgdGhlIGFub255bW91c1NpZ25VcFxuICAvLyBtZXRob2QgY2FuIGJlIHVzZWQuIEl0IGdlbmVyYXRlcyBhIHJhbmRvbSBwYXNzd29yZCBhbmQgc3RvcmVzIGl0IGxvY2FsbHlcbiAgLy8gaW4gdGhlIGJyb3dzZXIuXG4gIC8vXG4gIC8vIElmIHRoZSB1c2VyIHNpZ25lcyB1cCBmb3IgcmVhbCBsYXRlciwgd2UgJ3VwZ3JhZGUnIGhpcyBhY2NvdW50LCBtZWFuaW5nIHdlXG4gIC8vIGNoYW5nZSBoaXMgdXNlcm5hbWUgYW5kIHBhc3N3b3JkIGludGVybmFsbHkgaW5zdGVhZCBvZiBjcmVhdGluZyBhbm90aGVyIHVzZXIuXG4gIC8vXG4gIGFjY291bnQuYW5vbnltb3VzU2lnblVwID0gZnVuY3Rpb24gYW5vbnltb3VzU2lnblVwKCkge1xuICAgIHZhciBwYXNzd29yZCwgdXNlcm5hbWU7XG5cbiAgICBwYXNzd29yZCA9IGhvb2RpZS5nZW5lcmF0ZUlkKDEwKTtcbiAgICB1c2VybmFtZSA9IGhvb2RpZS5pZCgpO1xuXG4gICAgcmV0dXJuIGFjY291bnQuc2lnblVwKHVzZXJuYW1lLCBwYXNzd29yZCkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgIHNldEFub255bW91c1Bhc3N3b3JkKHBhc3N3b3JkKTtcbiAgICAgIHJldHVybiBhY2NvdW50LnRyaWdnZXIoJ3NpZ251cDphbm9ueW1vdXMnLCB1c2VybmFtZSk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyBoYXNBY2NvdW50XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vXG4gIGFjY291bnQuaGFzQWNjb3VudCA9IGZ1bmN0aW9uIGhhc0FjY291bnQoKSB7XG4gICAgcmV0dXJuICEhYWNjb3VudC51c2VybmFtZTtcbiAgfTtcblxuXG4gIC8vIGhhc0Fub255bW91c0FjY291bnRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gYW5vbnltb3VzIGFjY291bnRzIGdldCBjcmVhdGVkIHdoZW4gZGF0YSBuZWVkcyB0byBiZVxuICAvLyBzeW5jZWQgd2l0aG91dCB0aGUgdXNlciBoYXZpbmcgYW4gYWNjb3VudC4gVGhhdCBoYXBwZW5zXG4gIC8vIGF1dG9tYXRpY2FsbHkgd2hlbiB0aGUgdXNlciBjcmVhdGVzIGEgdGFzaywgYnV0IGNhbiBhbHNvXG4gIC8vIGJlIGRvbmUgbWFudWFsbHkgdXNpbmcgaG9vZGllLmFjY291bnQuYW5vbnltb3VzU2lnblVwKCksXG4gIC8vIGUuZy4gdG8gcHJldmVudCBkYXRhIGxvc3MuXG4gIC8vXG4gIC8vIFRvIGRldGVybWluZSBiZXR3ZWVuIGFub255bW91cyBhbmQgXCJyZWFsXCIgYWNjb3VudHMsIHdlXG4gIC8vIGNhbiBjb21wYXJlIHRoZSB1c2VybmFtZSB0byB0aGUgaG9vZGllLmlkLCB3aGljaCBpcyB0aGVcbiAgLy8gc2FtZSBmb3IgYW5vbnltb3VzIGFjY291bnRzLlxuICBhY2NvdW50Lmhhc0Fub255bW91c0FjY291bnQgPSBmdW5jdGlvbiBoYXNBbm9ueW1vdXNBY2NvdW50KCkge1xuICAgIHJldHVybiBhY2NvdW50LnVzZXJuYW1lID09PSBob29kaWUuaWQoKTtcbiAgfTtcblxuXG4gIC8vIHNldCAvIGdldCAvIHJlbW92ZSBhbm9ueW1vdXMgcGFzc3dvcmRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgdmFyIGFub255bW91c1Bhc3N3b3JkS2V5ID0gJ19hY2NvdW50LmFub255bW91c1Bhc3N3b3JkJztcblxuICBmdW5jdGlvbiBzZXRBbm9ueW1vdXNQYXNzd29yZChwYXNzd29yZCkge1xuICAgIHJldHVybiBob29kaWUuY29uZmlnLnNldChhbm9ueW1vdXNQYXNzd29yZEtleSwgcGFzc3dvcmQpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0QW5vbnltb3VzUGFzc3dvcmQoKSB7XG4gICAgcmV0dXJuIGhvb2RpZS5jb25maWcuZ2V0KGFub255bW91c1Bhc3N3b3JkS2V5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZUFub255bW91c1Bhc3N3b3JkKCkge1xuICAgIHJldHVybiBob29kaWUuY29uZmlnLnVuc2V0KGFub255bW91c1Bhc3N3b3JkS2V5KTtcbiAgfVxuXG5cbiAgLy8gc2lnbiBpbiB3aXRoIHVzZXJuYW1lICYgcGFzc3dvcmRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHVzZXMgc3RhbmRhcmQgQ291Y2hEQiBBUEkgdG8gY3JlYXRlIGEgbmV3IHVzZXIgc2Vzc2lvbiAoUE9TVCAvX3Nlc3Npb24pLlxuICAvLyBCZXNpZGVzIHRoZSBzdGFuZGFyZCBzaWduIGluIHdlIGFsc28gY2hlY2sgaWYgdGhlIGFjY291bnQgaGFzIGJlZW4gY29uZmlybWVkXG4gIC8vIChyb2xlcyBpbmNsdWRlICdjb25maXJtZWQnIHJvbGUpLlxuICAvL1xuICAvLyBXaGVuIHNpZ25pbmcgaW4sIGJ5IGRlZmF1bHQgYWxsIGxvY2FsIGRhdGEgZ2V0cyBjbGVhcmVkIGJlZm9yZWhhbmQgKHdpdGggYSBzaWduT3V0KS5cbiAgLy8gT3RoZXJ3aXNlIGRhdGEgdGhhdCBoYXMgYmVlbiBjcmVhdGVkIGJlZm9yZWhhbmQgKGF1dGhlbnRpY2F0ZWQgd2l0aCBhbm90aGVyIHVzZXJcbiAgLy8gYWNjb3VudCBvciBhbm9ueW1vdXNseSkgd291bGQgYmUgbWVyZ2VkIGludG8gdGhlIHVzZXIgYWNjb3VudCB0aGF0IHNpZ25zIGluLlxuICAvLyBUaGF0IGFwcGxpZXMgb25seSBpZiB1c2VybmFtZSBpc24ndCB0aGUgc2FtZSBhcyBjdXJyZW50IHVzZXJuYW1lLlxuICAvL1xuICAvLyBUbyBwcmV2ZW50IGRhdGEgbG9zcywgc2lnbkluIGNhbiBiZSBjYWxsZWQgd2l0aCBvcHRpb25zLm1vdmVEYXRhID0gdHJ1ZSwgdGhhdCB3bGxcbiAgLy8gbW92ZSBhbGwgZGF0YSBmcm9tIHRoZSBhbm9ueW1vdXMgYWNjb3VudCB0byB0aGUgYWNjb3VudCB0aGUgdXNlciBzaWduZWQgaW50by5cbiAgLy9cbiAgYWNjb3VudC5zaWduSW4gPSBmdW5jdGlvbiBzaWduSW4odXNlcm5hbWUsIHBhc3N3b3JkLCBvcHRpb25zKSB7XG4gICAgdmFyIHNpZ25PdXRBbmRTaWduSW4gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhY2NvdW50LnNpZ25PdXQoe1xuICAgICAgICBzaWxlbnQ6IHRydWVcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzZW5kU2lnbkluUmVxdWVzdCh1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICB2YXIgY3VycmVudERhdGE7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIGlmICh1c2VybmFtZSA9PT0gbnVsbCkge1xuICAgICAgdXNlcm5hbWUgPSAnJztcbiAgICB9XG5cbiAgICBpZiAocGFzc3dvcmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcGFzc3dvcmQgPSAnJztcbiAgICB9XG5cbiAgICAvLyBkb3duY2FzZVxuICAgIHVzZXJuYW1lID0gdXNlcm5hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgIGlmICh1c2VybmFtZSAhPT0gYWNjb3VudC51c2VybmFtZSkge1xuICAgICAgaWYgKCEgb3B0aW9ucy5tb3ZlRGF0YSkge1xuICAgICAgICByZXR1cm4gc2lnbk91dEFuZFNpZ25JbigpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaG9vZGllLnN0b3JlLmZpbmRBbGwoKVxuICAgICAgLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBjdXJyZW50RGF0YSA9IGRhdGE7XG4gICAgICB9KVxuICAgICAgLnRoZW4oc2lnbk91dEFuZFNpZ25JbilcbiAgICAgIC5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgICBjdXJyZW50RGF0YS5mb3JFYWNoKGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgICAgIHZhciB0eXBlID0gb2JqZWN0LnR5cGU7XG5cbiAgICAgICAgICAvLyBpZ25vcmUgdGhlIGFjY291bnQgc2V0dGluZ3NcbiAgICAgICAgICBpZiAodHlwZSA9PT0gJyRjb25maWcnICYmIG9iamVjdC5pZCA9PT0gJ2hvb2RpZScpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBkZWxldGUgb2JqZWN0LnR5cGU7XG4gICAgICAgICAgb2JqZWN0LmNyZWF0ZWRCeSA9IGhvb2RpZS5pZCgpO1xuICAgICAgICAgIGhvb2RpZS5zdG9yZS5hZGQodHlwZSwgb2JqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2VuZFNpZ25JblJlcXVlc3QodXNlcm5hbWUsIHBhc3N3b3JkLCB7XG4gICAgICAgIHJlYXV0aGVudGljYXRlZDogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gc2lnbiBvdXRcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gdXNlcyBzdGFuZGFyZCBDb3VjaERCIEFQSSB0byBpbnZhbGlkYXRlIGEgdXNlciBzZXNzaW9uIChERUxFVEUgL19zZXNzaW9uKVxuICAvL1xuICBhY2NvdW50LnNpZ25PdXQgPSBmdW5jdGlvbiBzaWduT3V0KG9wdGlvbnMpIHtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKCFhY2NvdW50Lmhhc0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIGNsZWFudXAoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB7XG4gICAgICAgICAgcmV0dXJuIGFjY291bnQudHJpZ2dlcignc2lnbm91dCcpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHVzaExvY2FsQ2hhbmdlcyhvcHRpb25zKVxuICAgIC50aGVuKGhvb2RpZS5yZW1vdGUuZGlzY29ubmVjdClcbiAgICAudGhlbihzZW5kU2lnbk91dFJlcXVlc3QpXG4gICAgLnRoZW4oY2xlYW51cEFuZFRyaWdnZXJTaWduT3V0KTtcbiAgfTtcblxuXG4gIC8vIFJlcXVlc3RcbiAgLy8gLS0tXG5cbiAgLy8gc2hvcnRjdXQgZm9yIGBob29kaWUucmVxdWVzdGBcbiAgLy9cbiAgYWNjb3VudC5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdCh0eXBlLCBwYXRoLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgcmV0dXJuIGhvb2RpZS5yZXF1ZXN0LmFwcGx5KGhvb2RpZSwgYXJndW1lbnRzKTtcbiAgfTtcblxuXG4gIC8vIGRiXG4gIC8vIC0tLS1cblxuICAvLyByZXR1cm4gbmFtZSBvZiBkYlxuICAvL1xuICBhY2NvdW50LmRiID0gZnVuY3Rpb24gZGIoKSB7XG4gICAgcmV0dXJuICd1c2VyLycgKyBob29kaWUuaWQoKTtcbiAgfTtcblxuXG4gIC8vIGZldGNoXG4gIC8vIC0tLS0tLS1cblxuICAvLyBmZXRjaGVzIF91c2VycyBkb2MgZnJvbSBDb3VjaERCIGFuZCBjYWNoZXMgaXQgaW4gX2RvY1xuICAvL1xuICBhY2NvdW50LmZldGNoID0gZnVuY3Rpb24gZmV0Y2godXNlcm5hbWUpIHtcblxuICAgIGlmICh1c2VybmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB1c2VybmFtZSA9IGFjY291bnQudXNlcm5hbWU7XG4gICAgfVxuXG4gICAgaWYgKCF1c2VybmFtZSkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKHtcbiAgICAgICAgbmFtZTogJ0hvb2RpZVVuYXV0aG9yaXplZEVycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ05vdCBzaWduZWQgaW4nXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gd2l0aFNpbmdsZVJlcXVlc3QoJ2ZldGNoJywgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5yZXF1ZXN0KCdHRVQnLCB1c2VyRG9jVXJsKHVzZXJuYW1lKSkuZG9uZShmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB1c2VyRG9jID0gcmVzcG9uc2U7XG4gICAgICAgIHJldHVybiB1c2VyRG9jO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyBjaGFuZ2UgcGFzc3dvcmRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBOb3RlOiB0aGUgaG9vZGllIEFQSSByZXF1aXJlcyB0aGUgY3VycmVudFBhc3N3b3JkIGZvciBzZWN1cml0eSByZWFzb25zLFxuICAvLyBidXQgY291Y2hEYiBkb2Vzbid0IHJlcXVpcmUgaXQgZm9yIGEgcGFzc3dvcmQgY2hhbmdlLCBzbyBpdCdzIGlnbm9yZWRcbiAgLy8gaW4gdGhpcyBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgaG9vZGllIEFQSS5cbiAgLy9cbiAgYWNjb3VudC5jaGFuZ2VQYXNzd29yZCA9IGZ1bmN0aW9uIGNoYW5nZVBhc3N3b3JkKGN1cnJlbnRQYXNzd29yZCwgbmV3UGFzc3dvcmQpIHtcblxuICAgIGlmICghYWNjb3VudC51c2VybmFtZSkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKHtcbiAgICAgICAgbmFtZTogJ0hvb2RpZVVuYXV0aG9yaXplZEVycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ05vdCBzaWduZWQgaW4nXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBob29kaWUucmVtb3RlLmRpc2Nvbm5lY3QoKTtcblxuICAgIHJldHVybiBhY2NvdW50LmZldGNoKCkudGhlbihcbiAgICAgIHNlbmRDaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkUmVxdWVzdChjdXJyZW50UGFzc3dvcmQsIG51bGwsIG5ld1Bhc3N3b3JkKVxuICAgICk7XG4gIH07XG5cblxuICAvLyByZXNldCBwYXNzd29yZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhpcyBpcyBraW5kIG9mIGEgaGFjay4gV2UgbmVlZCB0byBjcmVhdGUgYW4gb2JqZWN0IGFub255bW91c2x5XG4gIC8vIHRoYXQgaXMgbm90IGV4cG9zZWQgdG8gb3RoZXJzLiBUaGUgb25seSBDb3VjaERCIEFQSSBvdGhlcmluZyBzdWNoXG4gIC8vIGZ1bmN0aW9uYWxpdHkgaXMgdGhlIF91c2VycyBkYXRhYmFzZS5cbiAgLy9cbiAgLy8gU28gd2UgYWN0dWFseSBzaWduIHVwIGEgbmV3IGNvdWNoREIgdXNlciB3aXRoIHNvbWUgc3BlY2lhbCBhdHRyaWJ1dGVzLlxuICAvLyBJdCB3aWxsIGJlIHBpY2tlZCB1cCBieSB0aGUgcGFzc3dvcmQgcmVzZXQgd29ya2VyIGFuZCByZW1vdmVlZFxuICAvLyBvbmNlIHRoZSBwYXNzd29yZCB3YXMgcmVzZXR0ZWQuXG4gIC8vXG4gIGFjY291bnQucmVzZXRQYXNzd29yZCA9IGZ1bmN0aW9uIHJlc2V0UGFzc3dvcmQodXNlcm5hbWUpIHtcbiAgICB2YXIgZGF0YSwga2V5LCBvcHRpb25zLCByZXNldFBhc3N3b3JkSWQ7XG5cbiAgICByZXNldFBhc3N3b3JkSWQgPSBob29kaWUuY29uZmlnLmdldCgnX2FjY291bnQucmVzZXRQYXNzd29yZElkJyk7XG5cbiAgICBpZiAocmVzZXRQYXNzd29yZElkKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5jaGVja1Bhc3N3b3JkUmVzZXQoKTtcbiAgICB9XG5cbiAgICByZXNldFBhc3N3b3JkSWQgPSAnJyArIHVzZXJuYW1lICsgJy8nICsgKGhvb2RpZS5nZW5lcmF0ZUlkKCkpO1xuXG4gICAgaG9vZGllLmNvbmZpZy5zZXQoJ19hY2NvdW50LnJlc2V0UGFzc3dvcmRJZCcsIHJlc2V0UGFzc3dvcmRJZCk7XG5cbiAgICBrZXkgPSAnJyArIHVzZXJEb2NQcmVmaXggKyAnOiRwYXNzd29yZFJlc2V0LycgKyByZXNldFBhc3N3b3JkSWQ7XG5cbiAgICBkYXRhID0ge1xuICAgICAgX2lkOiBrZXksXG4gICAgICBuYW1lOiAnJHBhc3N3b3JkUmVzZXQvJyArIHJlc2V0UGFzc3dvcmRJZCxcbiAgICAgIHR5cGU6ICd1c2VyJyxcbiAgICAgIHJvbGVzOiBbXSxcbiAgICAgIHBhc3N3b3JkOiByZXNldFBhc3N3b3JkSWQsXG4gICAgICBjcmVhdGVkQXQ6IG5vdygpLFxuICAgICAgdXBkYXRlZEF0OiBub3coKVxuICAgIH07XG5cbiAgICBvcHRpb25zID0ge1xuICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfTtcblxuICAgIC8vIFRPRE86IHNwZWMgdGhhdCBjaGVja1Bhc3N3b3JkUmVzZXQgZ2V0cyBleGVjdXRlZFxuICAgIHJldHVybiB3aXRoUHJldmlvdXNSZXF1ZXN0c0Fib3J0ZWQoJ3Jlc2V0UGFzc3dvcmQnLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhY2NvdW50LnJlcXVlc3QoJ1BVVCcsICcvX3VzZXJzLycgKyAoZW5jb2RlVVJJQ29tcG9uZW50KGtleSkpLCBvcHRpb25zKS5kb25lKCBhY2NvdW50LmNoZWNrUGFzc3dvcmRSZXNldCApXG4gICAgICAudGhlbiggYXdhaXRQYXNzd29yZFJlc2V0UmVzdWx0ICk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gY2hlY2tQYXNzd29yZFJlc2V0XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGNoZWNrIGZvciB0aGUgc3RhdHVzIG9mIGEgcGFzc3dvcmQgcmVzZXQuIEl0IG1pZ2h0IHRha2VcbiAgLy8gYSB3aGlsZSB1bnRpbCB0aGUgcGFzc3dvcmQgcmVzZXQgd29ya2VyIHBpY2tzIHVwIHRoZSBqb2JcbiAgLy8gYW5kIHVwZGF0ZXMgaXRcbiAgLy9cbiAgLy8gSWYgYSBwYXNzd29yZCByZXNldCByZXF1ZXN0IHdhcyBzdWNjZXNzZnVsLCB0aGUgJHBhc3N3b3JkUmVxdWVzdFxuICAvLyBkb2MgZ2V0cyByZW1vdmVkIGZyb20gX3VzZXJzIGJ5IHRoZSB3b3JrZXIsIHRoZXJlZm9yZSBhIDQwMSBpc1xuICAvLyB3aGF0IHdlIGFyZSB3YWl0aW5nIGZvci5cbiAgLy9cbiAgLy8gT25jZSBjYWxsZWQsIGl0IGNvbnRpbnVlcyB0byByZXF1ZXN0IHRoZSBzdGF0dXMgdXBkYXRlIHdpdGggYVxuICAvLyBvbmUgc2Vjb25kIHRpbWVvdXQuXG4gIC8vXG4gIGFjY291bnQuY2hlY2tQYXNzd29yZFJlc2V0ID0gZnVuY3Rpb24gY2hlY2tQYXNzd29yZFJlc2V0KCkge1xuICAgIHZhciBoYXNoLCBvcHRpb25zLCByZXNldFBhc3N3b3JkSWQsIHVybCwgdXNlcm5hbWU7XG5cbiAgICAvLyByZWplY3QgaWYgdGhlcmUgaXMgbm8gcGVuZGluZyBwYXNzd29yZCByZXNldCByZXF1ZXN0XG4gICAgcmVzZXRQYXNzd29yZElkID0gaG9vZGllLmNvbmZpZy5nZXQoJ19hY2NvdW50LnJlc2V0UGFzc3dvcmRJZCcpO1xuXG4gICAgaWYgKCFyZXNldFBhc3N3b3JkSWQpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aCgnTm8gcGVuZGluZyBwYXNzd29yZCByZXNldC4nKTtcbiAgICB9XG5cbiAgICAvLyBzZW5kIHJlcXVlc3QgdG8gY2hlY2sgc3RhdHVzIG9mIHBhc3N3b3JkIHJlc2V0XG4gICAgdXNlcm5hbWUgPSAnJHBhc3N3b3JkUmVzZXQvJyArIHJlc2V0UGFzc3dvcmRJZDtcbiAgICB1cmwgPSAnL191c2Vycy8nICsgKGVuY29kZVVSSUNvbXBvbmVudCh1c2VyRG9jUHJlZml4ICsgJzonICsgdXNlcm5hbWUpKTtcbiAgICBoYXNoID0gYnRvYSh1c2VybmFtZSArICc6JyArIHJlc2V0UGFzc3dvcmRJZCk7XG5cbiAgICBvcHRpb25zID0ge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmFzaWMgJyArIGhhc2hcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgncGFzc3dvcmRSZXNldFN0YXR1cycsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnR0VUJywgdXJsLCBvcHRpb25zKS50aGVuKFxuICAgICAgICBoYW5kbGVQYXNzd29yZFJlc2V0U3RhdHVzUmVxdWVzdFN1Y2Nlc3MsXG4gICAgICAgIGhhbmRsZVBhc3N3b3JkUmVzZXRTdGF0dXNSZXF1ZXN0RXJyb3JcbiAgICAgICkuZmFpbChmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0hvb2RpZVBlbmRpbmdFcnJvcicpIHtcbiAgICAgICAgICBnbG9iYWwuc2V0VGltZW91dChhY2NvdW50LmNoZWNrUGFzc3dvcmRSZXNldCwgMTAwMCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2NvdW50LnRyaWdnZXIoJ2Vycm9yOnBhc3N3b3JkcmVzZXQnLCBlcnJvcik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIGNoYW5nZSB1c2VybmFtZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIE5vdGU6IHRoZSBob29kaWUgQVBJIHJlcXVpcmVzIHRoZSBjdXJyZW50IHBhc3N3b3JkIGZvciBzZWN1cml0eSByZWFzb25zLFxuICAvLyBidXQgdGVjaG5pY2FsbHkgd2UgY2Fubm90ICh5ZXQpIHByZXZlbnQgdGhlIHVzZXIgdG8gY2hhbmdlIHRoZSB1c2VybmFtZVxuICAvLyB3aXRob3V0IGtub3dpbmcgdGhlIGN1cnJlbnQgcGFzc3dvcmQsIHNvIGl0J3MgaWdub3JlZCBpbiB0aGUgY3VycmVudFxuICAvLyBpbXBsZW1lbnRhdGlvbi5cbiAgLy9cbiAgLy8gQnV0IHRoZSBjdXJyZW50IHBhc3N3b3JkIGlzIG5lZWRlZCB0byBsb2dpbiB3aXRoIHRoZSBuZXcgdXNlcm5hbWUuXG4gIC8vXG4gIGFjY291bnQuY2hhbmdlVXNlcm5hbWUgPSBmdW5jdGlvbiBjaGFuZ2VVc2VybmFtZShjdXJyZW50UGFzc3dvcmQsIG5ld1VzZXJuYW1lKSB7XG4gICAgbmV3VXNlcm5hbWUgPSBuZXdVc2VybmFtZSB8fCAnJztcbiAgICByZXR1cm4gY2hhbmdlVXNlcm5hbWVBbmRQYXNzd29yZChjdXJyZW50UGFzc3dvcmQsIG5ld1VzZXJuYW1lLnRvTG93ZXJDYXNlKCkpO1xuICB9O1xuXG5cbiAgLy8gZGVzdHJveVxuICAvLyAtLS0tLS0tLS1cblxuICAvLyBkZXN0cm95cyBhIHVzZXIncyBhY2NvdW50XG4gIC8vXG4gIGFjY291bnQuZGVzdHJveSA9IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgaWYgKCFhY2NvdW50Lmhhc0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIGNsZWFudXBBbmRUcmlnZ2VyU2lnbk91dCgpO1xuICAgIH1cblxuICAgIHJldHVybiBhY2NvdW50LmZldGNoKCkudGhlbihcbiAgICAgIGhhbmRsZUZldGNoQmVmb3JlRGVzdHJveVN1Y2Nlc3MsXG4gICAgICBoYW5kbGVGZXRjaEJlZm9yZURlc3Ryb3lFcnJvclxuICAgICkudGhlbihjbGVhbnVwQW5kVHJpZ2dlclNpZ25PdXQpO1xuICB9O1xuXG5cbiAgLy9cbiAgLy8gc3Vic2NyaWJlIHRvIGV2ZW50cyBjb21pbmcgb3V0c2lkZVxuICAvL1xuICBmdW5jdGlvbiBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKSB7XG4gICAgaG9vZGllLm9uKCdyZW1vdGU6ZXJyb3I6dW5hdXRoZW50aWNhdGVkJywgcmVhdXRoZW50aWNhdGUpO1xuICB9XG5cbiAgLy8gYWxsb3cgdG8gcnVuIHRoaXMgb25jZSBmcm9tIG91dHNpZGVcbiAgYWNjb3VudC5zdWJzY3JpYmVUb091dHNpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKTtcbiAgICBkZWxldGUgYWNjb3VudC5zdWJzY3JpYmVUb091dHNpZGVFdmVudHM7XG4gIH07XG5cblxuICAvLyBQUklWQVRFXG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHJlYXV0aGVudGljYXRlOiBmb3JjZSBob29kaWUgdG8gcmVhdXRoZW50aWNhdGVcbiAgZnVuY3Rpb24gcmVhdXRoZW50aWNhdGUgKCkge1xuICAgIGF1dGhlbnRpY2F0ZWQgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIGFjY291bnQuYXV0aGVudGljYXRlKCk7XG4gIH1cblxuICAvLyBzZXR0ZXJzXG4gIGZ1bmN0aW9uIHNldFVzZXJuYW1lKG5ld1VzZXJuYW1lKSB7XG4gICAgaWYgKGFjY291bnQudXNlcm5hbWUgPT09IG5ld1VzZXJuYW1lKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYWNjb3VudC51c2VybmFtZSA9IG5ld1VzZXJuYW1lO1xuXG4gICAgcmV0dXJuIGhvb2RpZS5jb25maWcuc2V0KCdfYWNjb3VudC51c2VybmFtZScsIG5ld1VzZXJuYW1lKTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gaGFuZGxlIGEgc3VjY2Vzc2Z1bCBhdXRoZW50aWNhdGlvbiByZXF1ZXN0LlxuICAvL1xuICAvLyBBcyBsb25nIGFzIHRoZXJlIGlzIG5vIHNlcnZlciBlcnJvciBvciBpbnRlcm5ldCBjb25uZWN0aW9uIGlzc3VlLFxuICAvLyB0aGUgYXV0aGVudGljYXRlIHJlcXVlc3QgKEdFVCAvX3Nlc3Npb24pIGRvZXMgYWx3YXlzIHJldHVyblxuICAvLyBhIDIwMCBzdGF0dXMuIFRvIGRpZmZlcmVudGlhdGUgd2hldGhlciB0aGUgdXNlciBpcyBzaWduZWQgaW4gb3JcbiAgLy8gbm90LCB3ZSBjaGVjayBgdXNlckN0eC5uYW1lYCBpbiB0aGUgcmVzcG9uc2UuIElmIHRoZSB1c2VyIGlzIG5vdFxuICAvLyBzaWduZWQgaW4sIGl0J3MgbnVsbCwgb3RoZXJ3aXNlIHRoZSBuYW1lIHRoZSB1c2VyIHNpZ25lZCBpbiB3aXRoXG4gIC8vXG4gIC8vIElmIHRoZSB1c2VyIGlzIG5vdCBzaWduZWQgaW4sIHdlIGRpZmVlcmVudGlhdGUgYmV0d2VlbiB1c2VycyB0aGF0XG4gIC8vIHNpZ25lZCBpbiB3aXRoIGEgdXNlcm5hbWUgLyBwYXNzd29yZCBvciBhbm9ueW1vdXNseS4gRm9yIGFub255bW91c1xuICAvLyB1c2VycywgdGhlIHBhc3N3b3JkIGlzIHN0b3JlZCBpbiBsb2NhbCBzdG9yZSwgc28gd2UgZG9uJ3QgbmVlZFxuICAvLyB0byB0cmlnZ2VyIGFuICd1bmF1dGhlbnRpY2F0ZWQnIGVycm9yLCBidXQgaW5zdGVhZCB0cnkgdG8gc2lnbiBpbi5cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQXV0aGVudGljYXRlUmVxdWVzdFN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICBpZiAocmVzcG9uc2UudXNlckN0eC5uYW1lKSB7XG4gICAgICBhdXRoZW50aWNhdGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZVdpdGgoYWNjb3VudC51c2VybmFtZSk7XG4gICAgfVxuXG4gICAgaWYgKGFjY291bnQuaGFzQW5vbnltb3VzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5zaWduSW4oYWNjb3VudC51c2VybmFtZSwgZ2V0QW5vbnltb3VzUGFzc3dvcmQoKSk7XG4gICAgfVxuXG4gICAgYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgIGFjY291bnQudHJpZ2dlcignZXJyb3I6dW5hdXRoZW50aWNhdGVkJyk7XG4gICAgcmV0dXJuIGhvb2RpZS5yZWplY3QoKTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gaGFuZGxlIHJlc3BvbnNlIG9mIGEgc3VjY2Vzc2Z1bCBzaWduVXAgcmVxdWVzdC5cbiAgLy8gUmVzcG9uc2UgbG9va3MgbGlrZTpcbiAgLy9cbiAgLy8gICAgIHtcbiAgLy8gICAgICAgICAnb2snOiB0cnVlLFxuICAvLyAgICAgICAgICdpZCc6ICdvcmcuY291Y2hkYi51c2VyOmpvZScsXG4gIC8vICAgICAgICAgJ3Jldic6ICcxLWU4NzQ3ZDlhZTk3NzY3MDZkYTkyODEwYjFiYWE0MjQ4J1xuICAvLyAgICAgfVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVTaWduVXBTdWNjZXNzKHVzZXJuYW1lLCBwYXNzd29yZCkge1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICBhY2NvdW50LnRyaWdnZXIoJ3NpZ251cCcsIHVzZXJuYW1lKTtcbiAgICAgIHVzZXJEb2MuX3JldiA9IHJlc3BvbnNlLnJldjtcbiAgICAgIHJldHVybiBkZWxheWVkU2lnbkluKHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgfTtcbiAgfVxuXG4gIC8vXG4gIC8vIGhhbmRsZSByZXNwb25zZSBvZiBhIGZhaWxlZCBzaWduVXAgcmVxdWVzdC5cbiAgLy9cbiAgLy8gSW4gY2FzZSBvZiBhIGNvbmZsaWN0LCByZWplY3Qgd2l0aCBcInVzZXJuYW1lIGFscmVhZHkgZXhpc3RzXCIgZXJyb3JcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hvb2RpZWhxL2hvb2RpZS5qcy9pc3N1ZXMvMTc0XG4gIC8vIEVycm9yIHBhc3NlZCBmb3IgaG9vZGllLnJlcXVlc3QgbG9va3MgbGlrZSB0aGlzXG4gIC8vXG4gIC8vICAgICB7XG4gIC8vICAgICAgICAgXCJuYW1lXCI6IFwiSG9vZGllQ29uZmxpY3RFcnJvclwiLFxuICAvLyAgICAgICAgIFwibWVzc2FnZVwiOiBcIk9iamVjdCBhbHJlYWR5IGV4aXN0cy5cIlxuICAvLyAgICAgfVxuICBmdW5jdGlvbiBoYW5kbGVTaWduVXBFcnJvcih1c2VybmFtZSkge1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0hvb2RpZUNvbmZsaWN0RXJyb3InKSB7XG4gICAgICAgIGVycm9yLm1lc3NhZ2UgPSAnVXNlcm5hbWUgJyArIHVzZXJuYW1lICsgJyBhbHJlYWR5IGV4aXN0cyc7XG4gICAgICB9XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoZXJyb3IpO1xuICAgIH07XG4gIH1cblxuXG4gIC8vXG4gIC8vIGEgZGVsYXllZCBzaWduIGluIGlzIHVzZWQgYWZ0ZXIgc2lnbiB1cCBhbmQgYWZ0ZXIgYVxuICAvLyB1c2VybmFtZSBjaGFuZ2UuXG4gIC8vXG4gIGZ1bmN0aW9uIGRlbGF5ZWRTaWduSW4odXNlcm5hbWUsIHBhc3N3b3JkLCBvcHRpb25zLCBkZWZlcikge1xuXG4gICAgLy8gZGVsYXllZFNpZ25JbiBtaWdodCBjYWxsIGl0c2VsZiwgd2hlbiB0aGUgdXNlciBhY2NvdW50XG4gICAgLy8gaXMgcGVuZGluZy4gSW4gdGhpcyBjYXNlIGl0IHBhc3NlcyB0aGUgb3JpZ2luYWwgZGVmZXIsXG4gICAgLy8gdG8ga2VlcCBhIHJlZmVyZW5jZSBhbmQgZmluYWxseSByZXNvbHZlIC8gcmVqZWN0IGl0XG4gICAgLy8gYXQgc29tZSBwb2ludFxuICAgIGlmICghZGVmZXIpIHtcbiAgICAgIGRlZmVyID0gaG9vZGllLmRlZmVyKCk7XG4gICAgfVxuXG4gICAgZ2xvYmFsLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IHNlbmRTaWduSW5SZXF1ZXN0KHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgICBwcm9taXNlLmRvbmUoZGVmZXIucmVzb2x2ZSk7XG4gICAgICBwcm9taXNlLmZhaWwoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgaWYgKGVycm9yLm5hbWUgPT09ICdIb29kaWVBY2NvdW50VW5jb25maXJtZWRFcnJvcicpIHtcblxuICAgICAgICAgIC8vIEl0IG1pZ2h0IHRha2UgYSBiaXQgdW50aWwgdGhlIGFjY291bnQgaGFzIGJlZW4gY29uZmlybWVkXG4gICAgICAgICAgZGVsYXllZFNpZ25Jbih1c2VybmFtZSwgcGFzc3dvcmQsIG9wdGlvbnMsIGRlZmVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWZlci5yZWplY3QuYXBwbHkoZGVmZXIsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfSwgMzAwKTtcblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIHBhcnNlIGEgc3VjY2Vzc2Z1bCBzaWduIGluIHJlc3BvbnNlIGZyb20gY291Y2hEQi5cbiAgLy8gUmVzcG9uc2UgbG9va3MgbGlrZTpcbiAgLy9cbiAgLy8gICAgIHtcbiAgLy8gICAgICAgICAnb2snOiB0cnVlLFxuICAvLyAgICAgICAgICduYW1lJzogJ3Rlc3QxJyxcbiAgLy8gICAgICAgICAncm9sZXMnOiBbXG4gIC8vICAgICAgICAgICAgICdtdnU4NWh5JyxcbiAgLy8gICAgICAgICAgICAgJ2NvbmZpcm1lZCdcbiAgLy8gICAgICAgICBdXG4gIC8vICAgICB9XG4gIC8vXG4gIC8vIHdlIHdhbnQgdG8gdHVybiBpdCBpbnRvICd0ZXN0MScsICdtdnU4NWh5JyBvciByZWplY3QgdGhlIHByb21pc2VcbiAgLy8gaW4gY2FzZSBhbiBlcnJvciBvY2N1cmVkICgncm9sZXMnIGFycmF5IGNvbnRhaW5zICdlcnJvcicpXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZVNpZ25JblN1Y2Nlc3Mob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICB2YXIgZGVmZXIsIHVzZXJuYW1lLCBob29kaWVJZDtcblxuICAgICAgZGVmZXIgPSBob29kaWUuZGVmZXIoKTtcbiAgICAgIHVzZXJuYW1lID0gcmVzcG9uc2UubmFtZS5yZXBsYWNlKC9edXNlcihfYW5vbnltb3VzKT9cXC8vLCAnJyk7XG4gICAgICBob29kaWVJZCA9IHJlc3BvbnNlLnJvbGVzWzBdO1xuXG4gICAgICAvL1xuICAgICAgLy8gaWYgYW4gZXJyb3Igb2NjdXJlZCwgdGhlIHVzZXJEQiB3b3JrZXIgc3RvcmVzIGl0IHRvIHRoZSAkZXJyb3IgYXR0cmlidXRlXG4gICAgICAvLyBhbmQgYWRkcyB0aGUgJ2Vycm9yJyByb2xlIHRvIHRoZSB1c2VycyBkb2Mgb2JqZWN0LiBJZiB0aGUgdXNlciBoYXMgdGhlXG4gICAgICAvLyAnZXJyb3InIHJvbGUsIHdlIG5lZWQgdG8gZmV0Y2ggaGlzIF91c2VycyBkb2MgdG8gZmluZCBvdXQgd2hhdCB0aGUgZXJyb3JcbiAgICAgIC8vIGlzLCBiZWZvcmUgd2UgY2FuIHJlamVjdCB0aGUgcHJvbWlzZS5cbiAgICAgIC8vXG4gICAgICBpZiAocmVzcG9uc2Uucm9sZXMuaW5kZXhPZignZXJyb3InKSAhPT0gLTEpIHtcbiAgICAgICAgYWNjb3VudC5mZXRjaCh1c2VybmFtZSkuZmFpbChkZWZlci5yZWplY3QpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGRlZmVyLnJlamVjdCh1c2VyRG9jLiRlcnJvcik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICAgICAgfVxuXG4gICAgICAvL1xuICAgICAgLy8gV2hlbiB0aGUgdXNlckRCIHdvcmtlciBjcmVhdGVkIHRoZSBkYXRhYmFzZSBmb3IgdGhlIHVzZXIgYW5kIGV2ZXJ0aGluZ1xuICAgICAgLy8gd29ya2VkIG91dCwgaXQgYWRkcyB0aGUgcm9sZSAnY29uZmlybWVkJyB0byB0aGUgdXNlci4gSWYgdGhlIHJvbGUgaXNcbiAgICAgIC8vIG5vdCBwcmVzZW50IHlldCwgaXQgbWlnaHQgYmUgdGhhdCB0aGUgd29ya2VyIGRpZG4ndCBwaWNrIHVwIHRoZSB0aGVcbiAgICAgIC8vIHVzZXIgZG9jIHlldCwgb3IgdGhlcmUgd2FzIGFuIGVycm9yLiBJbiB0aGlzIGNhc2VzLCB3ZSByZWplY3QgdGhlIHByb21pc2VcbiAgICAgIC8vIHdpdGggYW4gJ3VuY29maXJtZWQgZXJyb3InXG4gICAgICAvL1xuICAgICAgaWYgKHJlc3BvbnNlLnJvbGVzLmluZGV4T2YoJ2NvbmZpcm1lZCcpID09PSAtMSkge1xuICAgICAgICByZXR1cm4gZGVmZXIucmVqZWN0KHtcbiAgICAgICAgICBuYW1lOiAnSG9vZGllQWNjb3VudFVuY29uZmlybWVkRXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6ICdBY2NvdW50IGhhcyBub3QgYmVlbiBjb25maXJtZWQgeWV0J1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgc2V0VXNlcm5hbWUodXNlcm5hbWUpO1xuICAgICAgYXV0aGVudGljYXRlZCA9IHRydWU7XG5cbiAgICAgIC8vXG4gICAgICAvLyBvcHRpb25zLnNpbGVudCBpcyB0cnVlIHdoZW4gd2UgbmVlZCB0byBzaWduIGluIHRoZVxuICAgICAgLy8gdGhlIHVzZXIgd2l0aG91dCBzaWduSW4gbWV0aG9kIGJlaW5nIGNhbGxlZC4gVGhhdCdzXG4gICAgICAvLyBjdXJyZW50bHkgdGhlIGNhc2UgZm9yIGNoYW5nZVVzZXJuYW1lLlxuICAgICAgLy8gQWxzbyBkb24ndCB0cmlnZ2VyICdzaWduaW4nIHdoZW4gcmVhdXRoZW50aWNhdGluZ1xuICAgICAgLy9cbiAgICAgIGlmICghKG9wdGlvbnMuc2lsZW50IHx8IG9wdGlvbnMucmVhdXRoZW50aWNhdGVkKSkge1xuICAgICAgICBpZiAoYWNjb3VudC5oYXNBbm9ueW1vdXNBY2NvdW50KCkpIHtcbiAgICAgICAgICBhY2NvdW50LnRyaWdnZXIoJ3NpZ25pbjphbm9ueW1vdXMnLCB1c2VybmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWNjb3VudC50cmlnZ2VyKCdzaWduaW4nLCB1c2VybmFtZSwgaG9vZGllSWQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHVzZXIgcmVhdXRoZW50aWNhdGVkLCBtZWFuaW5nXG4gICAgICBpZiAob3B0aW9ucy5yZWF1dGhlbnRpY2F0ZWQpIHtcbiAgICAgICAgYWNjb3VudC50cmlnZ2VyKCdyZWF1dGhlbnRpY2F0ZWQnLCB1c2VybmFtZSk7XG4gICAgICB9XG5cbiAgICAgIGFjY291bnQuZmV0Y2goKTtcbiAgICAgIHJldHVybiBkZWZlci5yZXNvbHZlKHVzZXJuYW1lLCByZXNwb25zZS5yb2xlc1swXSk7XG4gICAgfTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gSWYgdGhlIHJlcXVlc3Qgd2FzIHN1Y2Nlc3NmdWwgdGhlcmUgbWlnaHQgaGF2ZSBvY2N1cmVkIGFuXG4gIC8vIGVycm9yLCB3aGljaCB0aGUgd29ya2VyIHN0b3JlZCBpbiB0aGUgc3BlY2lhbCAkZXJyb3IgYXR0cmlidXRlLlxuICAvLyBJZiB0aGF0IGhhcHBlbnMsIHdlIHJldHVybiBhIHJlamVjdGVkIHByb21pc2Ugd2l0aCB0aGUgZXJyb3JcbiAgLy8gT3RoZXJ3aXNlIHJlamVjdCB0aGUgcHJvbWlzZSB3aXRoIGEgJ3BlbmRpbmcnIGVycm9yLFxuICAvLyBhcyB3ZSBhcmUgbm90IHdhaXRpbmcgZm9yIGEgc3VjY2VzcyBmdWxsIHJlc3BvbnNlLCBidXQgYSA0MDFcbiAgLy8gZXJyb3IsIGluZGljYXRpbmcgdGhhdCBvdXIgcGFzc3dvcmQgd2FzIGNoYW5nZWQgYW5kIG91clxuICAvLyBjdXJyZW50IHNlc3Npb24gaGFzIGJlZW4gaW52YWxpZGF0ZWRcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlUGFzc3dvcmRSZXNldFN0YXR1c1JlcXVlc3RTdWNjZXNzKHBhc3N3b3JkUmVzZXRPYmplY3QpIHtcbiAgICB2YXIgZXJyb3I7XG5cbiAgICBpZiAocGFzc3dvcmRSZXNldE9iamVjdC4kZXJyb3IpIHtcbiAgICAgIGVycm9yID0gcGFzc3dvcmRSZXNldE9iamVjdC4kZXJyb3I7XG4gICAgICBlcnJvci5vYmplY3QgPSBwYXNzd29yZFJlc2V0T2JqZWN0O1xuICAgICAgZGVsZXRlIGVycm9yLm9iamVjdC4kZXJyb3I7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9yID0ge1xuICAgICAgICBuYW1lOiAnSG9vZGllUGVuZGluZ0Vycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ1Bhc3N3b3JkIHJlc2V0IGlzIHN0aWxsIHBlbmRpbmcnXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoZXJyb3IpO1xuICB9XG5cblxuICAvL1xuICAvLyBJZiB0aGUgZXJyb3IgaXMgYSA0MDEsIGl0J3MgZXhhY3RseSB3aGF0IHdlJ3ZlIGJlZW4gd2FpdGluZyBmb3IuXG4gIC8vIEluIHRoaXMgY2FzZSB3ZSByZXNvbHZlIHRoZSBwcm9taXNlLlxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVQYXNzd29yZFJlc2V0U3RhdHVzUmVxdWVzdEVycm9yKGVycm9yKSB7XG4gICAgaWYgKGVycm9yLm5hbWUgPT09ICdIb29kaWVVbmF1dGhvcml6ZWRFcnJvcicpIHtcbiAgICAgIGhvb2RpZS5jb25maWcudW5zZXQoJ19hY2NvdW50LnJlc2V0UGFzc3dvcmRJZCcpO1xuICAgICAgYWNjb3VudC50cmlnZ2VyKCdwYXNzd29yZHJlc2V0Jyk7XG5cbiAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy9cbiAgLy8gd2FpdCB1bnRpbCBhIHBhc3N3b3JkIHJlc2V0IGdldHMgZWl0aGVyIGNvbXBsZXRlZCBvciBtYXJrZWQgYXMgZmFpbGVkXG4gIC8vIGFuZCByZXNvbHZlIC8gcmVqZWN0IHJlc3BlY3RpdmVseVxuICAvL1xuICBmdW5jdGlvbiBhd2FpdFBhc3N3b3JkUmVzZXRSZXN1bHQoKSB7XG4gICAgdmFyIGRlZmVyID0gaG9vZGllLmRlZmVyKCk7XG5cbiAgICBhY2NvdW50Lm9uZSgncGFzc3dvcmRyZXNldCcsIGRlZmVyLnJlc29sdmUgKTtcbiAgICBhY2NvdW50Lm9uKCdlcnJvcjpwYXNzd29yZHJlc2V0JywgcmVtb3ZlUGFzc3dvcmRSZXNldE9iamVjdCApO1xuICAgIGFjY291bnQub24oJ2Vycm9yOnBhc3N3b3JkcmVzZXQnLCBkZWZlci5yZWplY3QgKTtcblxuICAgIC8vIGNsZWFuIHVwIGNhbGxiYWNrcyB3aGVuIGVpdGhlciBnZXRzIGNhbGxlZFxuICAgIGRlZmVyLmFsd2F5cyggZnVuY3Rpb24oKSB7XG4gICAgICBhY2NvdW50LnVuYmluZCgncGFzc3dvcmRyZXNldCcsIGRlZmVyLnJlc29sdmUgKTtcbiAgICAgIGFjY291bnQudW5iaW5kKCdlcnJvcjpwYXNzd29yZHJlc2V0JywgcmVtb3ZlUGFzc3dvcmRSZXNldE9iamVjdCApO1xuICAgICAgYWNjb3VudC51bmJpbmQoJ2Vycm9yOnBhc3N3b3JkcmVzZXQnLCBkZWZlci5yZWplY3QgKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH1cblxuICAvL1xuICAvLyB3aGVuIGEgcGFzc3dvcmQgcmVzZXQgZmFpbHMsIHJlbW92ZSBpdCBmcm9tIC9fdXNlcnNcbiAgLy9cbiAgZnVuY3Rpb24gcmVtb3ZlUGFzc3dvcmRSZXNldE9iamVjdCAoZXJyb3IpIHtcbiAgICB2YXIgcGFzc3dvcmRSZXNldE9iamVjdCA9IGVycm9yLm9iamVjdDtcblxuICAgIC8vIGdldCB1c2VybmFtZSAmIHBhc3N3b3JkIGZvciBhdXRoZW50aWNhdGlvblxuICAgIHZhciB1c2VybmFtZSA9IHBhc3N3b3JkUmVzZXRPYmplY3QubmFtZTsgLy8gJHBhc3N3b3JkUmVzZXQvdXNlcm5hbWUvcmFuZG9taGFzaFxuICAgIHZhciBwYXNzd29yZCA9IHVzZXJuYW1lLnN1YnN0cigxNSk7IC8vID0+IC8vIHVzZXJuYW1lL3JhbmRvbWhhc2hcbiAgICB2YXIgdXJsID0gJy9fdXNlcnMvJyArIChlbmNvZGVVUklDb21wb25lbnQodXNlckRvY1ByZWZpeCArICc6JyArIHVzZXJuYW1lKSk7XG4gICAgdmFyIGhhc2ggPSBidG9hKHVzZXJuYW1lICsgJzonICsgcGFzc3dvcmQpO1xuXG4gICAgLy8gbWFyayBhcyBkZWxldGVkXG4gICAgcGFzc3dvcmRSZXNldE9iamVjdC5fZGVsZXRlZCA9IHRydWU7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0Jhc2ljICcgKyBoYXNoXG4gICAgICB9LFxuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHBhc3N3b3JkUmVzZXRPYmplY3QpXG4gICAgfTtcblxuICAgIC8vIGNsZWFudXBcbiAgICBhY2NvdW50LnJlcXVlc3QoJ1BVVCcsIHVybCwgb3B0aW9ucyk7XG4gICAgaG9vZGllLmNvbmZpZy51bnNldCgnX2FjY291bnQucmVzZXRQYXNzd29yZElkJyk7XG4gIH1cblxuICAvL1xuICAvLyBjaGFuZ2UgdXNlcm5hbWUgYW5kIHBhc3N3b3JkIGluIDMgc3RlcHNcbiAgLy9cbiAgLy8gMS4gYXNzdXJlIHdlIGhhdmUgYSB2YWxpZCBzZXNzaW9uXG4gIC8vIDIuIHVwZGF0ZSBfdXNlcnMgZG9jIHdpdGggbmV3IHVzZXJuYW1lIGFuZCBuZXcgcGFzc3dvcmQgKGlmIHByb3ZpZGVkKVxuICAvLyAzLiBzaWduIGluIHdpdGggbmV3IGNyZWRlbnRpYWxzIHRvIGNyZWF0ZSBuZXcgc2VzaW9uLlxuICAvL1xuICBmdW5jdGlvbiBjaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkKGN1cnJlbnRQYXNzd29yZCwgbmV3VXNlcm5hbWUsIG5ld1Bhc3N3b3JkKSB7XG5cbiAgICByZXR1cm4gc2VuZFNpZ25JblJlcXVlc3QoYWNjb3VudC51c2VybmFtZSwgY3VycmVudFBhc3N3b3JkLCB7XG4gICAgICBzaWxlbnQ6IHRydWVcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFjY291bnQuZmV0Y2goKS50aGVuKFxuICAgICAgICBzZW5kQ2hhbmdlVXNlcm5hbWVBbmRQYXNzd29yZFJlcXVlc3QoY3VycmVudFBhc3N3b3JkLCBuZXdVc2VybmFtZSwgbmV3UGFzc3dvcmQpXG4gICAgICApO1xuICAgIH0pO1xuICB9XG5cblxuICAvL1xuICAvLyB0dXJuIGFuIGFub255bW91cyBhY2NvdW50IGludG8gYSByZWFsIGFjY291bnRcbiAgLy9cbiAgZnVuY3Rpb24gdXBncmFkZUFub255bW91c0FjY291bnQodXNlcm5hbWUsIHBhc3N3b3JkKSB7XG4gICAgdmFyIGN1cnJlbnRQYXNzd29yZCA9IGdldEFub255bW91c1Bhc3N3b3JkKCk7XG5cbiAgICByZXR1cm4gY2hhbmdlVXNlcm5hbWVBbmRQYXNzd29yZChjdXJyZW50UGFzc3dvcmQsIHVzZXJuYW1lLCBwYXNzd29yZCkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgIGFjY291bnQudHJpZ2dlcignc2lnbnVwJywgdXNlcm5hbWUpO1xuICAgICAgcmVtb3ZlQW5vbnltb3VzUGFzc3dvcmQoKTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gd2Ugbm93IGNhbiBiZSBzdXJlIHRoYXQgd2UgZmV0Y2hlZCB0aGUgbGF0ZXN0IF91c2VycyBkb2MsIHNvIHdlIGNhbiB1cGRhdGUgaXRcbiAgLy8gd2l0aG91dCBhIHBvdGVudGlhbCBjb25mbGljdCBlcnJvci5cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlRmV0Y2hCZWZvcmVEZXN0cm95U3VjY2VzcygpIHtcblxuICAgIGhvb2RpZS5yZW1vdGUuZGlzY29ubmVjdCgpO1xuICAgIHVzZXJEb2MuX2RlbGV0ZWQgPSB0cnVlO1xuXG4gICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgndXBkYXRlVXNlcnNEb2MnLCBmdW5jdGlvbigpIHtcbiAgICAgIGFjY291bnQucmVxdWVzdCgnUFVUJywgdXNlckRvY1VybCgpLCB7XG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHVzZXJEb2MpLFxuICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gZGVwZW5kZW5kIG9uIHdoYXQga2luZCBvZiBlcnJvciB3ZSBnZXQsIHdlIHdhbnQgdG8gaWdub3JlXG4gIC8vIGl0IG9yIG5vdC5cbiAgLy8gV2hlbiB3ZSBnZXQgYSAnSG9vZGllTm90Rm91bmRFcnJvcicgaXQgbWVhbnMgdGhhdCB0aGUgX3VzZXJzIGRvYyBoYWJlXG4gIC8vIGJlZW4gcmVtb3ZlZCBhbHJlYWR5LCBzbyB3ZSBkb24ndCBuZWVkIHRvIGRvIGl0IGFueW1vcmUsIGJ1dFxuICAvLyBzdGlsbCB3YW50IHRvIGZpbmlzaCB0aGUgZGVzdHJveSBsb2NhbGx5LCBzbyB3ZSByZXR1cm4gYVxuICAvLyByZXNvbHZlZCBwcm9taXNlXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZUZldGNoQmVmb3JlRGVzdHJveUVycm9yKGVycm9yKSB7XG4gICAgaWYgKGVycm9yLm5hbWUgPT09ICdIb29kaWVOb3RGb3VuZEVycm9yJykge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aChlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLy9cbiAgLy8gcmVtb3ZlIGV2ZXJ5dGhpbmcgZm9ybSB0aGUgY3VycmVudCBhY2NvdW50LCBzbyBhIG5ldyBhY2NvdW50IGNhbiBiZSBpbml0aWF0ZWQuXG4gIC8vXG4gIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG5cbiAgICAvLyBob29kaWUuc3RvcmUgaXMgbGlzdGVuaW5nIG9uIHRoaXMgb25lXG4gICAgYWNjb3VudC50cmlnZ2VyKCdjbGVhbnVwJyk7XG4gICAgYXV0aGVudGljYXRlZCA9IHVuZGVmaW5lZDtcbiAgICBzZXRVc2VybmFtZSh1bmRlZmluZWQpO1xuXG4gICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlKCk7XG4gIH1cblxuXG4gIC8vXG4gIGZ1bmN0aW9uIGNsZWFudXBBbmRUcmlnZ2VyU2lnbk91dCgpIHtcbiAgICByZXR1cm4gY2xlYW51cCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC50cmlnZ2VyKCdzaWdub3V0Jyk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIGRlcGVuZGluZyBvbiB3ZXRoZXIgdGhlIHVzZXIgc2lnbmVkVXAgbWFudWFsbHkgb3IgaGFzIGJlZW4gc2lnbmVkIHVwXG4gIC8vIGFub255bW91c2x5IHRoZSBwcmVmaXggaW4gdGhlIENvdWNoREIgX3VzZXJzIGRvYyBkaWZmZXJlbnRpYXRlcy5cbiAgLy8gQW4gYW5vbnltb3VzIHVzZXIgaXMgY2hhcmFjdGVyaXplZCBieSBpdHMgdXNlcm5hbWUsIHRoYXQgZXF1YWxzXG4gIC8vIGl0cyBob29kaWUuaWQoKSAoc2VlIGBhbm9ueW1vdXNTaWduVXBgKVxuICAvL1xuICAvLyBXZSBkaWZmZXJlbnRpYXRlIHdpdGggYGhhc0Fub255bW91c0FjY291bnQoKWAsIGJlY2F1c2UgYHVzZXJUeXBlQW5kSWRgXG4gIC8vIGlzIHVzZWQgd2l0aGluIGBzaWduVXBgIG1ldGhvZCwgc28gd2UgbmVlZCB0byBiZSBhYmxlIHRvIGRpZmZlcmVudGlhdGVcbiAgLy8gYmV0d2VlbiBhbm9ueW1vdXMgYW5kIG5vcm1hbCB1c2VycyBiZWZvcmUgYW4gYWNjb3VudCBoYXMgYmVlbiBjcmVhdGVkLlxuICAvL1xuICBmdW5jdGlvbiB1c2VyVHlwZUFuZElkKHVzZXJuYW1lKSB7XG4gICAgdmFyIHR5cGU7XG5cbiAgICBpZiAodXNlcm5hbWUgPT09IGhvb2RpZS5pZCgpKSB7XG4gICAgICB0eXBlID0gJ3VzZXJfYW5vbnltb3VzJztcbiAgICB9IGVsc2Uge1xuICAgICAgdHlwZSA9ICd1c2VyJztcbiAgICB9XG4gICAgcmV0dXJuICcnICsgdHlwZSArICcvJyArIHVzZXJuYW1lO1xuICB9XG5cblxuICAvL1xuICAvLyB0dXJuIGEgdXNlcm5hbWUgaW50byBhIHZhbGlkIF91c2VycyBkb2MuX2lkXG4gIC8vXG4gIGZ1bmN0aW9uIHVzZXJEb2NLZXkodXNlcm5hbWUpIHtcbiAgICB1c2VybmFtZSA9IHVzZXJuYW1lIHx8IGFjY291bnQudXNlcm5hbWU7XG4gICAgcmV0dXJuICcnICsgdXNlckRvY1ByZWZpeCArICc6JyArICh1c2VyVHlwZUFuZElkKHVzZXJuYW1lKSk7XG4gIH1cblxuICAvL1xuICAvLyBnZXQgVVJMIG9mIG15IF91c2VycyBkb2NcbiAgLy9cbiAgZnVuY3Rpb24gdXNlckRvY1VybCh1c2VybmFtZSkge1xuICAgIHJldHVybiAnL191c2Vycy8nICsgKGVuY29kZVVSSUNvbXBvbmVudCh1c2VyRG9jS2V5KHVzZXJuYW1lKSkpO1xuICB9XG5cblxuICAvL1xuICAvLyB1cGRhdGUgbXkgX3VzZXJzIGRvYy5cbiAgLy9cbiAgLy8gSWYgYSBuZXcgdXNlcm5hbWUgaGFzIGJlZW4gcGFzc2VkLCB3ZSBzZXQgdGhlIHNwZWNpYWwgYXR0cmlidXQgJG5ld1VzZXJuYW1lLlxuICAvLyBUaGlzIHdpbGwgbGV0IHRoZSB1c2VybmFtZSBjaGFuZ2Ugd29ya2VyIGNyZWF0ZSBjcmVhdGUgYSBuZXcgX3VzZXJzIGRvYyBmb3JcbiAgLy8gdGhlIG5ldyB1c2VybmFtZSBhbmQgcmVtb3ZlIHRoZSBjdXJyZW50IG9uZVxuICAvL1xuICAvLyBJZiBhIG5ldyBwYXNzd29yZCBoYXMgYmVlbiBwYXNzZWQsIHNhbHQgYW5kIHBhc3N3b3JkX3NoYSBnZXQgcmVtb3ZlZFxuICAvLyBmcm9tIF91c2VycyBkb2MgYW5kIGFkZCB0aGUgcGFzc3dvcmQgaW4gY2xlYXIgdGV4dC4gQ291Y2hEQiB3aWxsIHJlcGxhY2UgaXQgd2l0aFxuICAvLyBhY2NvcmRpbmcgcGFzc3dvcmRfc2hhIGFuZCBhIG5ldyBzYWx0IHNlcnZlciBzaWRlXG4gIC8vXG4gIGZ1bmN0aW9uIHNlbmRDaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkUmVxdWVzdChjdXJyZW50UGFzc3dvcmQsIG5ld1VzZXJuYW1lLCBuZXdQYXNzd29yZCkge1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgLy8gcHJlcGFyZSB1cGRhdGVkIF91c2VycyBkb2NcbiAgICAgIHZhciBkYXRhID0gZXh0ZW5kKHt9LCB1c2VyRG9jKTtcblxuICAgICAgaWYgKG5ld1VzZXJuYW1lKSB7XG4gICAgICAgIGRhdGEuJG5ld1VzZXJuYW1lID0gbmV3VXNlcm5hbWU7XG4gICAgICB9XG5cbiAgICAgIGRhdGEudXBkYXRlZEF0ID0gbm93KCk7XG4gICAgICBkYXRhLnNpZ25lZFVwQXQgPSBkYXRhLnNpZ25lZFVwQXQgfHwgbm93KCk7XG5cbiAgICAgIC8vIHRyaWdnZXIgcGFzc3dvcmQgdXBkYXRlIHdoZW4gbmV3UGFzc3dvcmQgc2V0XG4gICAgICBpZiAobmV3UGFzc3dvcmQgIT09IG51bGwpIHtcbiAgICAgICAgZGVsZXRlIGRhdGEuc2FsdDtcbiAgICAgICAgZGVsZXRlIGRhdGEucGFzc3dvcmRfc2hhO1xuICAgICAgICBkYXRhLnBhc3N3b3JkID0gbmV3UGFzc3dvcmQ7XG4gICAgICB9XG5cbiAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgndXBkYXRlVXNlcnNEb2MnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnUFVUJywgdXNlckRvY1VybCgpLCBvcHRpb25zKS50aGVuKFxuICAgICAgICAgIGhhbmRsZUNoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmRSZXF1ZXN0KG5ld1VzZXJuYW1lLCBuZXdQYXNzd29yZCB8fCBjdXJyZW50UGFzc3dvcmQpXG4gICAgICAgICk7XG4gICAgICB9KTtcblxuICAgIH07XG4gIH1cblxuXG4gIC8vXG4gIC8vIGRlcGVuZGluZyBvbiB3aGV0aGVyIGEgbmV3VXNlcm5hbWUgaGFzIGJlZW4gcGFzc2VkLCB3ZSBjYW4gc2lnbiBpbiByaWdodCBhd2F5XG4gIC8vIG9yIGhhdmUgdG8gdXNlIHRoZSBkZWxheWVkIHNpZ24gaW4gdG8gZ2l2ZSB0aGUgdXNlcm5hbWUgY2hhbmdlIHdvcmtlciBzb21lIHRpbWVcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQ2hhbmdlVXNlcm5hbWVBbmRQYXNzd29yZFJlcXVlc3QobmV3VXNlcm5hbWUsIG5ld1Bhc3N3b3JkKSB7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBob29kaWUucmVtb3RlLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgaWYgKG5ld1VzZXJuYW1lKSB7XG4gICAgICAgIHJldHVybiBkZWxheWVkU2lnbkluKG5ld1VzZXJuYW1lLCBuZXdQYXNzd29yZCwge1xuICAgICAgICAgIHNpbGVudDogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBhY2NvdW50LnNpZ25JbihhY2NvdW50LnVzZXJuYW1lLCBuZXdQYXNzd29yZCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gbWFrZSBzdXJlIHRoYXQgdGhlIHNhbWUgcmVxdWVzdCBkb2Vzbid0IGdldCBzZW50IHR3aWNlXG4gIC8vIGJ5IGNhbmNlbGxpbmcgdGhlIHByZXZpb3VzIG9uZS5cbiAgLy9cbiAgZnVuY3Rpb24gd2l0aFByZXZpb3VzUmVxdWVzdHNBYm9ydGVkKG5hbWUsIHJlcXVlc3RGdW5jdGlvbikge1xuICAgIGlmIChyZXF1ZXN0c1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZW9mIHJlcXVlc3RzW25hbWVdLmFib3J0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJlcXVlc3RzW25hbWVdLmFib3J0KCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJlcXVlc3RzW25hbWVdID0gcmVxdWVzdEZ1bmN0aW9uKCk7XG4gICAgcmV0dXJuIHJlcXVlc3RzW25hbWVdO1xuICB9XG5cblxuICAvL1xuICAvLyBpZiB0aGVyZSBpcyBhIHBlbmRpbmcgcmVxdWVzdCwgcmV0dXJuIGl0cyBwcm9taXNlIGluc3RlYWRcbiAgLy8gb2Ygc2VuZGluZyBhbm90aGVyIHJlcXVlc3RcbiAgLy9cbiAgZnVuY3Rpb24gd2l0aFNpbmdsZVJlcXVlc3QobmFtZSwgcmVxdWVzdEZ1bmN0aW9uKSB7XG5cbiAgICBpZiAocmVxdWVzdHNbbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGVvZiByZXF1ZXN0c1tuYW1lXS5zdGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAocmVxdWVzdHNbbmFtZV0uc3RhdGUoKSA9PT0gJ3BlbmRpbmcnKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcXVlc3RzW25hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVxdWVzdHNbbmFtZV0gPSByZXF1ZXN0RnVuY3Rpb24oKTtcbiAgICByZXR1cm4gcmVxdWVzdHNbbmFtZV07XG4gIH1cblxuXG4gIC8vXG4gIC8vIHB1c2ggbG9jYWwgY2hhbmdlcyB3aGVuIHVzZXIgc2lnbnMgb3V0LCB1bmxlc3MgaGUgZW5mb3JjZXMgc2lnbiBvdXRcbiAgLy8gaW4gYW55IGNhc2Ugd2l0aCBge2lnbm9yZUxvY2FsQ2hhbmdlczogdHJ1ZX1gXG4gIC8vXG4gIGZ1bmN0aW9uIHB1c2hMb2NhbENoYW5nZXMob3B0aW9ucykge1xuICAgIGlmKGhvb2RpZS5zdG9yZS5oYXNMb2NhbENoYW5nZXMoKSAmJiAhb3B0aW9ucy5pZ25vcmVMb2NhbENoYW5nZXMpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVtb3RlLnB1c2goKTtcbiAgICB9XG4gICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlKCk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBzZW5kU2lnbk91dFJlcXVlc3QoKSB7XG4gICAgcmV0dXJuIHdpdGhTaW5nbGVSZXF1ZXN0KCdzaWduT3V0JywgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5yZXF1ZXN0KCdERUxFVEUnLCAnL19zZXNzaW9uJyk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIHRoZSBzaWduIGluIHJlcXVlc3QgdGhhdCBzdGFydHMgYSBDb3VjaERCIHNlc3Npb24gaWZcbiAgLy8gaXQgc3VjY2VlZHMuIFdlIHNlcGFyYXRlZCB0aGUgYWN0dWFsIHNpZ24gaW4gcmVxdWVzdCBmcm9tXG4gIC8vIHRoZSBzaWduSW4gbWV0aG9kLCBhcyB0aGUgbGF0dGVyIGFsc28gcnVucyBzaWduT3V0IGludGVucnRhbGx5XG4gIC8vIHRvIGNsZWFuIHVwIGxvY2FsIGRhdGEgYmVmb3JlIHN0YXJ0aW5nIGEgbmV3IHNlc3Npb24uIEJ1dCBhc1xuICAvLyBvdGhlciBtZXRob2RzIGxpa2Ugc2lnblVwIG9yIGNoYW5nZVBhc3N3b3JkIGRvIGFsc28gbmVlZCB0b1xuICAvLyBzaWduIGluIHRoZSB1c2VyIChhZ2FpbiksIHRoZXNlIG5lZWQgdG8gc2VuZCB0aGUgc2lnbiBpblxuICAvLyByZXF1ZXN0IGJ1dCB3aXRob3V0IGEgc2lnbk91dCBiZWZvcmVoYW5kLCBhcyB0aGUgdXNlciByZW1haW5zXG4gIC8vIHRoZSBzYW1lLlxuICAvL1xuICBmdW5jdGlvbiBzZW5kU2lnbkluUmVxdWVzdCh1c2VybmFtZSwgcGFzc3dvcmQsIG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxdWVzdE9wdGlvbnMgPSB7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIG5hbWU6IHVzZXJUeXBlQW5kSWQodXNlcm5hbWUpLFxuICAgICAgICBwYXNzd29yZDogcGFzc3dvcmRcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgnc2lnbkluJywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IGFjY291bnQucmVxdWVzdCgnUE9TVCcsICcvX3Nlc3Npb24nLCByZXF1ZXN0T3B0aW9ucyk7XG5cbiAgICAgIHJldHVybiBwcm9taXNlLnRoZW4oXG4gICAgICAgIGhhbmRsZVNpZ25JblN1Y2Nlc3Mob3B0aW9ucylcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBub3coKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCk7XG4gIH1cblxuICAvL1xuICAvLyBleHBvc2UgcHVibGljIGFjY291bnQgQVBJXG4gIC8vXG4gIGhvb2RpZS5hY2NvdW50ID0gYWNjb3VudDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVBY2NvdW50O1xuIiwiLy8gQWNjb3VudFJlbW90ZVxuLy8gPT09PT09PT09PT09PT09XG5cbi8vIENvbm5lY3Rpb24gLyBTb2NrZXQgdG8gb3VyIGNvdWNoXG4vL1xuLy8gQWNjb3VudFJlbW90ZSBpcyB1c2luZyBDb3VjaERCJ3MgYF9jaGFuZ2VzYCBmZWVkIHRvXG4vLyBsaXN0ZW4gdG8gY2hhbmdlcyBhbmQgYF9idWxrX2RvY3NgIHRvIHB1c2ggbG9jYWwgY2hhbmdlc1xuLy9cbi8vIFdoZW4gaG9vZGllLnJlbW90ZSBpcyBjb250aW51b3VzbHkgc3luY2luZyAoZGVmYXVsdCksXG4vLyBpdCB3aWxsIGNvbnRpbnVvdXNseSAgc3luY2hyb25pemUgd2l0aCBsb2NhbCBzdG9yZSxcbi8vIG90aGVyd2lzZSBzeW5jLCBwdWxsIG9yIHB1c2ggY2FuIGJlIGNhbGxlZCBtYW51YWxseVxuLy9cblxuZnVuY3Rpb24gaG9vZGllUmVtb3RlIChob29kaWUpIHtcbiAgLy8gaW5oZXJpdCBmcm9tIEhvb2RpZXMgU3RvcmUgQVBJXG4gIHZhciByZW1vdGUgPSBob29kaWUub3Blbihob29kaWUuYWNjb3VudC5kYigpLCB7XG5cbiAgICAvLyB3ZSdyZSBhbHdheXMgY29ubmVjdGVkIHRvIG91ciBvd24gZGJcbiAgICBjb25uZWN0ZWQ6IHRydWUsXG5cbiAgICAvLyBkbyBub3QgcHJlZml4IGZpbGVzIGZvciBteSBvd24gcmVtb3RlXG4gICAgcHJlZml4OiAnJyxcblxuICAgIC8vXG4gICAgc2luY2U6IHNpbmNlTnJDYWxsYmFjayxcblxuICAgIC8vXG4gICAgZGVmYXVsdE9iamVjdHNUb1B1c2g6IGhvb2RpZS5zdG9yZS5jaGFuZ2VkT2JqZWN0cyxcblxuICAgIC8vXG4gICAga25vd25PYmplY3RzOiBob29kaWUuc3RvcmUuaW5kZXgoKS5tYXAoIGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyIHR5cGVBbmRJZCA9IGtleS5zcGxpdCgvXFwvLyk7XG4gICAgICByZXR1cm4geyB0eXBlOiB0eXBlQW5kSWRbMF0sIGlkOiB0eXBlQW5kSWRbMV19O1xuICAgIH0pXG4gIH0pO1xuXG4gIC8vIENvbm5lY3RcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gd2Ugc2xpZ2h0bHkgZXh0ZW5kIHRoZSBvcmlnaW5hbCByZW1vdGUuY29ubmVjdCBtZXRob2RcbiAgLy8gcHJvdmlkZWQgYnkgYGhvb2RpZVJlbW90ZVN0b3JlYCwgdG8gY2hlY2sgaWYgdGhlIHVzZXJcbiAgLy8gaGFzIGFuIGFjY291bnQgYmVmb3JlaGFuZC4gV2UgYWxzbyBoYXJkY29kZSB0aGUgcmlnaHRcbiAgLy8gbmFtZSBmb3IgcmVtb3RlIChjdXJyZW50IHVzZXIncyBkYXRhYmFzZSBuYW1lKVxuICAvL1xuICB2YXIgb3JpZ2luYWxDb25uZWN0TWV0aG9kID0gcmVtb3RlLmNvbm5lY3Q7XG4gIHJlbW90ZS5jb25uZWN0ID0gZnVuY3Rpb24gY29ubmVjdCgpIHtcbiAgICBpZiAoISBob29kaWUuYWNjb3VudC5oYXNBY2NvdW50KCkgKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlamVjdFdpdGgoJ1VzZXIgaGFzIG5vIGRhdGFiYXNlIHRvIGNvbm5lY3QgdG8nKTtcbiAgICB9XG4gICAgcmV0dXJuIG9yaWdpbmFsQ29ubmVjdE1ldGhvZCggaG9vZGllLmFjY291bnQuZGIoKSApO1xuICB9O1xuXG4gIC8vIHRyaWdnZXJcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gcHJveGllcyB0byBob29kaWUudHJpZ2dlclxuICByZW1vdGUudHJpZ2dlciA9IGZ1bmN0aW9uIHRyaWdnZXIoKSB7XG4gICAgdmFyIGV2ZW50TmFtZTtcblxuICAgIGV2ZW50TmFtZSA9IGFyZ3VtZW50c1swXTtcblxuICAgIHZhciBwYXJhbWV0ZXJzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuXG4gICAgcmV0dXJuIGhvb2RpZS50cmlnZ2VyLmFwcGx5KGhvb2RpZSwgWydyZW1vdGU6JyArIGV2ZW50TmFtZV0uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHBhcmFtZXRlcnMpKSk7XG4gIH07XG5cblxuICAvLyBvblxuICAvLyAtLS0tLS0tLS1cblxuICAvLyBwcm94aWVzIHRvIGhvb2RpZS5vblxuICByZW1vdGUub24gPSBmdW5jdGlvbiBvbihldmVudE5hbWUsIGRhdGEpIHtcbiAgICBldmVudE5hbWUgPSBldmVudE5hbWUucmVwbGFjZSgvKF58ICkoW14gXSspL2csICckMScrJ3JlbW90ZTokMicpO1xuICAgIHJldHVybiBob29kaWUub24oZXZlbnROYW1lLCBkYXRhKTtcbiAgfTtcblxuXG4gIC8vIHVuYmluZFxuICAvLyAtLS0tLS0tLS1cblxuICAvLyBwcm94aWVzIHRvIGhvb2RpZS51bmJpbmRcbiAgcmVtb3RlLnVuYmluZCA9IGZ1bmN0aW9uIHVuYmluZChldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgZXZlbnROYW1lID0gZXZlbnROYW1lLnJlcGxhY2UoLyhefCApKFteIF0rKS9nLCAnJDEnKydyZW1vdGU6JDInKTtcbiAgICByZXR1cm4gaG9vZGllLnVuYmluZChldmVudE5hbWUsIGNhbGxiYWNrKTtcbiAgfTtcblxuXG4gIC8vIFByaXZhdGVcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gZ2V0dGVyIC8gc2V0dGVyIGZvciBzaW5jZSBudW1iZXJcbiAgLy9cbiAgZnVuY3Rpb24gc2luY2VOckNhbGxiYWNrKHNpbmNlTnIpIHtcbiAgICBpZiAoc2luY2VOcikge1xuICAgICAgcmV0dXJuIGhvb2RpZS5jb25maWcuc2V0KCdfcmVtb3RlLnNpbmNlJywgc2luY2VOcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhvb2RpZS5jb25maWcuZ2V0KCdfcmVtb3RlLnNpbmNlJykgfHwgMDtcbiAgfVxuXG4gIC8vXG4gIC8vIHN1YnNjcmliZSB0byBldmVudHMgY29taW5nIGZyb20gb3V0c2lkZVxuICAvL1xuICBmdW5jdGlvbiBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKSB7XG5cbiAgICBob29kaWUub24oJ3JlbW90ZTpjb25uZWN0JywgZnVuY3Rpb24oKSB7XG4gICAgICBob29kaWUub24oJ3N0b3JlOmlkbGUnLCByZW1vdGUucHVzaCk7XG4gICAgICByZW1vdGUucHVzaCgpO1xuICAgIH0pO1xuXG4gICAgaG9vZGllLm9uKCdyZW1vdGU6ZGlzY29ubmVjdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgaG9vZGllLnVuYmluZCgnc3RvcmU6aWRsZScsIHJlbW90ZS5wdXNoKTtcbiAgICB9KTtcblxuICAgIGhvb2RpZS5vbignZGlzY29ubmVjdGVkJywgcmVtb3RlLmRpc2Nvbm5lY3QpO1xuICAgIGhvb2RpZS5vbigncmVjb25uZWN0ZWQnLCByZW1vdGUuY29ubmVjdCk7XG5cbiAgICAvLyBhY2NvdW50IGV2ZW50c1xuICAgIGhvb2RpZS5vbignYWNjb3VudDpzaWduaW4nLCByZW1vdGUuY29ubmVjdCk7XG4gICAgaG9vZGllLm9uKCdhY2NvdW50OnNpZ25pbjphbm9ueW1vdXMnLCByZW1vdGUuY29ubmVjdCk7XG5cbiAgICBob29kaWUub24oJ2FjY291bnQ6cmVhdXRoZW50aWNhdGVkJywgcmVtb3RlLmNvbm5lY3QpO1xuICAgIGhvb2RpZS5vbignYWNjb3VudDpzaWdub3V0JywgcmVtb3RlLmRpc2Nvbm5lY3QpO1xuICB9XG5cbiAgLy8gYWxsb3cgdG8gcnVuIHRoaXMgb25jZSBmcm9tIG91dHNpZGVcbiAgcmVtb3RlLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuICAgIGRlbGV0ZSByZW1vdGUuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzO1xuICB9O1xuXG4gIC8vXG4gIC8vIGV4cG9zZSByZW1vdGUgQVBJXG4gIC8vXG4gIGhvb2RpZS5yZW1vdGUgPSByZW1vdGU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllUmVtb3RlO1xuIiwiLy8gSG9vZGllIENvbmZpZyBBUElcbi8vID09PT09PT09PT09PT09PT09PT1cblxuLy9cbmZ1bmN0aW9uIGhvb2RpZUNvbmZpZyhob29kaWUpIHtcblxuICB2YXIgdHlwZSA9ICckY29uZmlnJztcbiAgdmFyIGlkID0gJ2hvb2RpZSc7XG4gIHZhciBjYWNoZSA9IHt9O1xuXG4gIC8vIHB1YmxpYyBBUElcbiAgdmFyIGNvbmZpZyA9IHt9O1xuXG5cbiAgLy8gc2V0XG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyBhZGRzIGEgY29uZmlndXJhdGlvblxuICAvL1xuICBjb25maWcuc2V0ID0gZnVuY3Rpb24gc2V0KGtleSwgdmFsdWUpIHtcbiAgICB2YXIgaXNTaWxlbnQsIHVwZGF0ZTtcblxuICAgIGlmIChjYWNoZVtrZXldID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNhY2hlW2tleV0gPSB2YWx1ZTtcblxuICAgIHVwZGF0ZSA9IHt9O1xuICAgIHVwZGF0ZVtrZXldID0gdmFsdWU7XG4gICAgaXNTaWxlbnQgPSBrZXkuY2hhckF0KDApID09PSAnXyc7XG5cbiAgICByZXR1cm4gaG9vZGllLnN0b3JlLnVwZGF0ZU9yQWRkKHR5cGUsIGlkLCB1cGRhdGUsIHtcbiAgICAgIHNpbGVudDogaXNTaWxlbnRcbiAgICB9KTtcbiAgfTtcblxuICAvLyBnZXRcbiAgLy8gLS0tLS0tLS0tLVxuXG4gIC8vIHJlY2VpdmVzIGEgY29uZmlndXJhdGlvblxuICAvL1xuICBjb25maWcuZ2V0ID0gZnVuY3Rpb24gZ2V0KGtleSkge1xuICAgIHJldHVybiBjYWNoZVtrZXldO1xuICB9O1xuXG4gIC8vIGNsZWFyXG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyBjbGVhcnMgY2FjaGUgYW5kIHJlbW92ZXMgb2JqZWN0IGZyb20gc3RvcmVcbiAgLy9cbiAgY29uZmlnLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgY2FjaGUgPSB7fTtcbiAgICByZXR1cm4gaG9vZGllLnN0b3JlLnJlbW92ZSh0eXBlLCBpZCk7XG4gIH07XG5cbiAgLy8gdW5zZXRcbiAgLy8gLS0tLS0tLS0tLVxuXG4gIC8vIHVuc2V0cyBhIGNvbmZpZ3VyYXRpb24uIElmIGNvbmZpZ3VyYXRpb24gaXMgcHJlc2VudCwgY2FsbHNcbiAgLy8gY29uZmlnLnNldChrZXksIHVuZGVmaW5lZCkuIE90aGVyd2lzZSByZXNvbHZlcyB3aXRob3V0IHN0b3JlXG4gIC8vIGludGVyYWN0aW9uLlxuICAvL1xuICBjb25maWcudW5zZXQgPSBmdW5jdGlvbiB1bnNldChrZXkpIHtcbiAgICBpZiAodHlwZW9mIGNvbmZpZy5nZXQoa2V5KSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBjb25maWcuc2V0KGtleSwgdW5kZWZpbmVkKTtcbiAgfTtcblxuICAvL1xuICAvLyBsb2FkIGN1cnJlbnQgY29uZmlndXJhdGlvbiBmcm9tIGxvY2FsU3RvcmUuXG4gIC8vIFRoZSBpbml0IG1ldGhvZCB0byBiZSBjYWxsZWQgb24gaG9vZGllIHN0YXJ0dXBcbiAgLy9cbiAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAvLyBUT0RPOiBJIHJlYWxseSBkb24ndCBsaWtlIHRoaXMgYmVpbmcgaGVyZS4gQW5kIEkgZG9uJ3QgbGlrZSB0aGF0IGlmIHRoZVxuICAgIC8vICAgICAgIHN0b3JlIEFQSSB3aWxsIGJlIHRydWx5IGFzeW5jIG9uZSBkYXksIHRoaXMgd2lsbCBmYWxsIG9uIG91ciBmZWV0LlxuICAgIC8vICAgICAgIFdlIHNob3VsZCBkaXNjdXNzIGlmIHdlIG1ha2UgY29uZmlnIGEgc2ltcGxlIG9iamVjdCBpbiBsb2NhbFN0b3JhZ2UsXG4gICAgLy8gICAgICAgb3V0c2lkZSBvZiBob29kaWUuc3RvcmUsIGFuZCB1c2UgbG9jYWxTdG9yYWdlIHN5bmMgQVBJIGRpcmVjdGx5IHRvXG4gICAgLy8gICAgICAgaW50ZXJhY3Qgd2l0aCBpdCwgYWxzbyBpbiBmdXR1cmUgdmVyc2lvbnMuXG4gICAgaG9vZGllLnN0b3JlLmZpbmQodHlwZSwgaWQpLmRvbmUoZnVuY3Rpb24ob2JqKSB7XG4gICAgICBjYWNoZSA9IG9iajtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biBpbml0IG9ubHkgb25jZVxuICBjb25maWcuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgIGluaXQoKTtcbiAgICBkZWxldGUgY29uZmlnLmluaXQ7XG4gIH07XG5cbiAgLy9cbiAgLy8gc3Vic2NyaWJlIHRvIGV2ZW50cyBjb21pbmcgZnJvbSBvdGhlciBtb2R1bGVzXG4gIC8vXG4gIGZ1bmN0aW9uIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpIHtcbiAgICBob29kaWUub24oJ2FjY291bnQ6Y2xlYW51cCcsIGNvbmZpZy5jbGVhcik7XG4gIH1cblxuICAvLyBhbGxvdyB0byBydW4gdGhpcyBvbmNlIGZyb20gb3V0c2lkZVxuICBjb25maWcuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG4gICAgZGVsZXRlIGNvbmZpZy5zdWJzY3JpYmVUb091dHNpZGVFdmVudHM7XG4gIH07XG5cbiAgLy8gZXhzcG9zZSBwdWJsaWMgQVBJXG4gIGhvb2RpZS5jb25maWcgPSBjb25maWc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllQ29uZmlnO1xuIiwidmFyIGdsb2JhbD10eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge307Ly8gaG9vZGllLmNoZWNrQ29ubmVjdGlvbigpICYgaG9vZGllLmlzQ29ubmVjdGVkKClcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuLy9cbmZ1bmN0aW9uIGhvb2RpZUNvbm5lY3Rpb24oaG9vZGllKSB7XG4gIC8vIHN0YXRlXG4gIHZhciBvbmxpbmUgPSB0cnVlO1xuICB2YXIgY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwgPSAzMDAwMDtcbiAgdmFyIGNoZWNrQ29ubmVjdGlvblJlcXVlc3QgPSBudWxsO1xuICB2YXIgY2hlY2tDb25uZWN0aW9uVGltZW91dCA9IG51bGw7XG5cbiAgLy8gQ2hlY2sgQ29ubmVjdGlvblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyB0aGUgYGNoZWNrQ29ubmVjdGlvbmAgbWV0aG9kIGlzIHVzZWQsIHdlbGwsIHRvIGNoZWNrIGlmXG4gIC8vIHRoZSBob29kaWUgYmFja2VuZCBpcyByZWFjaGFibGUgYXQgYGJhc2VVcmxgIG9yIG5vdC5cbiAgLy8gQ2hlY2sgQ29ubmVjdGlvbiBpcyBhdXRvbWF0aWNhbGx5IGNhbGxlZCBvbiBzdGFydHVwXG4gIC8vIGFuZCB0aGVuIGVhY2ggMzAgc2Vjb25kcy4gSWYgaXQgZmFpbHMsIGl0XG4gIC8vXG4gIC8vIC0gc2V0cyBgb25saW5lID0gZmFsc2VgXG4gIC8vIC0gdHJpZ2dlcnMgYG9mZmxpbmVgIGV2ZW50XG4gIC8vIC0gc2V0cyBgY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwgPSAzMDAwYFxuICAvL1xuICAvLyB3aGVuIGNvbm5lY3Rpb24gY2FuIGJlIHJlZXN0YWJsaXNoZWQsIGl0XG4gIC8vXG4gIC8vIC0gc2V0cyBgb25saW5lID0gdHJ1ZWBcbiAgLy8gLSB0cmlnZ2VycyBgb25saW5lYCBldmVudFxuICAvLyAtIHNldHMgYGNoZWNrQ29ubmVjdGlvbkludGVydmFsID0gMzAwMDBgXG4gIC8vXG4gIGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24gPSBmdW5jdGlvbiBjaGVja0Nvbm5lY3Rpb24oKSB7XG4gICAgdmFyIHJlcSA9IGNoZWNrQ29ubmVjdGlvblJlcXVlc3Q7XG5cbiAgICBpZiAocmVxICYmIHJlcS5zdGF0ZSgpID09PSAncGVuZGluZycpIHtcbiAgICAgIHJldHVybiByZXE7XG4gICAgfVxuXG4gICAgZ2xvYmFsLmNsZWFyVGltZW91dChjaGVja0Nvbm5lY3Rpb25UaW1lb3V0KTtcblxuICAgIGNoZWNrQ29ubmVjdGlvblJlcXVlc3QgPSBob29kaWUucmVxdWVzdCgnR0VUJywgJy8nKS50aGVuKFxuICAgICAgaGFuZGxlQ2hlY2tDb25uZWN0aW9uU3VjY2VzcyxcbiAgICAgIGhhbmRsZUNoZWNrQ29ubmVjdGlvbkVycm9yXG4gICAgKTtcblxuICAgIHJldHVybiBjaGVja0Nvbm5lY3Rpb25SZXF1ZXN0O1xuICB9O1xuXG5cbiAgLy8gaXNDb25uZWN0ZWRcbiAgLy8gLS0tLS0tLS0tLS0tLVxuXG4gIC8vXG4gIGhvb2RpZS5pc0Nvbm5lY3RlZCA9IGZ1bmN0aW9uIGlzQ29ubmVjdGVkKCkge1xuICAgIHJldHVybiBvbmxpbmU7XG4gIH07XG5cblxuICAvL1xuICAvL1xuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVDaGVja0Nvbm5lY3Rpb25TdWNjZXNzKCkge1xuICAgIGNoZWNrQ29ubmVjdGlvbkludGVydmFsID0gMzAwMDA7XG5cbiAgICBjaGVja0Nvbm5lY3Rpb25UaW1lb3V0ID0gZ2xvYmFsLnNldFRpbWVvdXQoaG9vZGllLmNoZWNrQ29ubmVjdGlvbiwgY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwpO1xuXG4gICAgaWYgKCFob29kaWUuaXNDb25uZWN0ZWQoKSkge1xuICAgICAgaG9vZGllLnRyaWdnZXIoJ3JlY29ubmVjdGVkJyk7XG4gICAgICBvbmxpbmUgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBob29kaWUucmVzb2x2ZSgpO1xuICB9XG5cblxuICAvL1xuICAvL1xuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVDaGVja0Nvbm5lY3Rpb25FcnJvcigpIHtcbiAgICBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCA9IDMwMDA7XG5cbiAgICBjaGVja0Nvbm5lY3Rpb25UaW1lb3V0ID0gZ2xvYmFsLnNldFRpbWVvdXQoaG9vZGllLmNoZWNrQ29ubmVjdGlvbiwgY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwpO1xuXG4gICAgaWYgKGhvb2RpZS5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgICBob29kaWUudHJpZ2dlcignZGlzY29ubmVjdGVkJyk7XG4gICAgICBvbmxpbmUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gaG9vZGllLnJlamVjdCgpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllQ29ubmVjdGlvbjtcbiIsIi8vIGhvb2RpZS5kaXNwb3NlXG4vLyA9PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIGhvb2RpZURpc3Bvc2UgKGhvb2RpZSkge1xuXG4gIC8vIGlmIGEgaG9vZGllIGluc3RhbmNlIGlzIG5vdCBuZWVkZWQgYW55bW9yZSwgaXQgY2FuXG4gIC8vIGJlIGRpc3Bvc2VkIHVzaW5nIHRoaXMgbWV0aG9kLiBBIGBkaXNwb3NlYCBldmVudFxuICAvLyBnZXRzIHRyaWdnZXJlZCB0aGF0IHRoZSBtb2R1bGVzIHJlYWN0IG9uLlxuICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgIGhvb2RpZS50cmlnZ2VyKCdkaXNwb3NlJyk7XG4gICAgaG9vZGllLnVuYmluZCgpO1xuICB9XG5cbiAgLy9cbiAgLy8gUHVibGljIEFQSVxuICAvL1xuICBob29kaWUuZGlzcG9zZSA9IGRpc3Bvc2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllRGlzcG9zZTtcbiIsIi8vIEhvb2RpZSBFcnJvclxuLy8gLS0tLS0tLS0tLS0tLVxuXG4vLyBXaXRoIHRoZSBjdXN0b20gaG9vZGllIGVycm9yIGZ1bmN0aW9uXG4vLyB3ZSBub3JtYWxpemUgYWxsIGVycm9ycyB0aGUgZ2V0IHJldHVybmVkXG4vLyB3aGVuIHVzaW5nIGhvb2RpZS5yZWplY3RXaXRoXG4vL1xuLy8gVGhlIG5hdGl2ZSBKYXZhU2NyaXB0IGVycm9yIG1ldGhvZCBoYXNcbi8vIGEgbmFtZSAmIGEgbWVzc2FnZSBwcm9wZXJ0eS4gSG9vZGllRXJyb3Jcbi8vIHJlcXVpcmVzIHRoZXNlLCBidXQgb24gdG9wIGFsbG93cyBmb3Jcbi8vIHVubGltaXRlZCBjdXN0b20gcHJvcGVydGllcy5cbi8vXG4vLyBJbnN0ZWFkIG9mIGJlaW5nIGluaXRpYWxpemVkIHdpdGgganVzdFxuLy8gdGhlIG1lc3NhZ2UsIEhvb2RpZUVycm9yIGV4cGVjdHMgYW5cbi8vIG9iamVjdCB3aXRoIHByb3Blcml0ZXMuIFRoZSBgbWVzc2FnZWBcbi8vIHByb3BlcnR5IGlzIHJlcXVpcmVkLiBUaGUgbmFtZSB3aWxsXG4vLyBmYWxsYmFjayB0byBgZXJyb3JgLlxuLy9cbi8vIGBtZXNzYWdlYCBjYW4gYWxzbyBjb250YWluIHBsYWNlaG9sZGVyc1xuLy8gaW4gdGhlIGZvcm0gb2YgYHt7cHJvcGVydHlOYW1lfX1gYCB3aGljaFxuLy8gd2lsbCBnZXQgcmVwbGFjZWQgYXV0b21hdGljYWxseSB3aXRoIHBhc3NlZFxuLy8gZXh0cmEgcHJvcGVydGllcy5cbi8vXG4vLyAjIyMgRXJyb3IgQ29udmVudGlvbnNcbi8vXG4vLyBXZSBmb2xsb3cgSmF2YVNjcmlwdCdzIG5hdGl2ZSBlcnJvciBjb252ZW50aW9ucyxcbi8vIG1lYW5pbmcgdGhhdCBlcnJvciBuYW1lcyBhcmUgY2FtZWxDYXNlIHdpdGggdGhlXG4vLyBmaXJzdCBsZXR0ZXIgdXBwZXJjYXNlIGFzIHdlbGwsIGFuZCB0aGUgbWVzc2FnZVxuLy8gc3RhcnRpbmcgd2l0aCBhbiB1cHBlcmNhc2UgbGV0dGVyLlxuLy9cbnZhciBlcnJvck1lc3NhZ2VSZXBsYWNlUGF0dGVybiA9IC9cXHtcXHtcXHMqXFx3K1xccypcXH1cXH0vZztcbnZhciBlcnJvck1lc3NhZ2VGaW5kUHJvcGVydHlQYXR0ZXJuID0gL1xcdysvO1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG5cbmZ1bmN0aW9uIEhvb2RpZUVycm9yKHByb3BlcnRpZXMpIHtcblxuICAvLyBub3JtYWxpemUgYXJndW1lbnRzXG4gIGlmICh0eXBlb2YgcHJvcGVydGllcyA9PT0gJ3N0cmluZycpIHtcbiAgICBwcm9wZXJ0aWVzID0ge1xuICAgICAgbWVzc2FnZTogcHJvcGVydGllc1xuICAgIH07XG4gIH1cblxuICBpZiAoISBwcm9wZXJ0aWVzLm1lc3NhZ2UpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZBVEFMOiBlcnJvci5tZXNzYWdlIG11c3QgYmUgc2V0Jyk7XG4gIH1cblxuICAvLyBtdXN0IGNoZWNrIGZvciBwcm9wZXJ0aWVzLCBhcyB0aGlzLm5hbWUgaXMgYWx3YXlzIHNldC5cbiAgaWYgKCEgcHJvcGVydGllcy5uYW1lKSB7XG4gICAgcHJvcGVydGllcy5uYW1lID0gJ0hvb2RpZUVycm9yJztcbiAgfVxuXG4gIGV4dGVuZCh0aGlzLCBwcm9wZXJ0aWVzKTtcblxuICBwcm9wZXJ0aWVzLm1lc3NhZ2UgPSBwcm9wZXJ0aWVzLm1lc3NhZ2UucmVwbGFjZShlcnJvck1lc3NhZ2VSZXBsYWNlUGF0dGVybiwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICB2YXIgcHJvcGVydHkgPSBtYXRjaC5tYXRjaChlcnJvck1lc3NhZ2VGaW5kUHJvcGVydHlQYXR0ZXJuKVswXTtcbiAgICByZXR1cm4gcHJvcGVydGllc1twcm9wZXJ0eV07XG4gIH0pO1xuXG4gIGV4dGVuZCh0aGlzLCBwcm9wZXJ0aWVzKTtcbn1cbkhvb2RpZUVycm9yLnByb3RvdHlwZSA9IG5ldyBFcnJvcigpO1xuSG9vZGllRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gSG9vZGllRXJyb3I7XG5cbm1vZHVsZS5leHBvcnRzID0gSG9vZGllRXJyb3I7XG4iLCIvLyBIb29kaWUgSW52YWxpZCBUeXBlIE9yIElkIEVycm9yXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIG9ubHkgbG93ZXJjYXNlIGxldHRlcnMsIG51bWJlcnMgYW5kIGRhc2hlc1xuLy8gYXJlIGFsbG93ZWQgZm9yIG9iamVjdCBJRHMuXG4vL1xudmFyIEhvb2RpZUVycm9yID0gcmVxdWlyZSgnLi4vZXJyb3InKTtcblxuLy9cbmZ1bmN0aW9uIEhvb2RpZU9iamVjdElkRXJyb3IocHJvcGVydGllcykge1xuICBwcm9wZXJ0aWVzLm5hbWUgPSAnSG9vZGllT2JqZWN0SWRFcnJvcic7XG4gIHByb3BlcnRpZXMubWVzc2FnZSA9ICdcInt7aWR9fVwiIGlzIGludmFsaWQgb2JqZWN0IGlkLiB7e3J1bGVzfX0uJztcblxuICByZXR1cm4gbmV3IEhvb2RpZUVycm9yKHByb3BlcnRpZXMpO1xufVxudmFyIHZhbGlkSWRQYXR0ZXJuID0gL15bYS16MC05XFwtXSskLztcbkhvb2RpZU9iamVjdElkRXJyb3IuaXNJbnZhbGlkID0gZnVuY3Rpb24oaWQsIGN1c3RvbVBhdHRlcm4pIHtcbiAgcmV0dXJuICEgKGN1c3RvbVBhdHRlcm4gfHwgdmFsaWRJZFBhdHRlcm4pLnRlc3QoaWQgfHwgJycpO1xufTtcbkhvb2RpZU9iamVjdElkRXJyb3IuaXNWYWxpZCA9IGZ1bmN0aW9uKGlkLCBjdXN0b21QYXR0ZXJuKSB7XG4gIHJldHVybiAoY3VzdG9tUGF0dGVybiB8fCB2YWxpZElkUGF0dGVybikudGVzdChpZCB8fCAnJyk7XG59O1xuSG9vZGllT2JqZWN0SWRFcnJvci5wcm90b3R5cGUucnVsZXMgPSAnTG93ZXJjYXNlIGxldHRlcnMsIG51bWJlcnMgYW5kIGRhc2hlcyBhbGxvd2VkIG9ubHkuIE11c3Qgc3RhcnQgd2l0aCBhIGxldHRlcic7XG5cbm1vZHVsZS5leHBvcnRzID0gSG9vZGllT2JqZWN0SWRFcnJvcjtcbiIsIi8vIEhvb2RpZSBJbnZhbGlkIFR5cGUgT3IgSWQgRXJyb3Jcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gb25seSBsb3dlcmNhc2UgbGV0dGVycywgbnVtYmVycyBhbmQgZGFzaGVzXG4vLyBhcmUgYWxsb3dlZCBmb3Igb2JqZWN0IHR5cGVzLCBwbHVzIG11c3Qgc3RhcnRcbi8vIHdpdGggYSBsZXR0ZXIuXG4vL1xudmFyIEhvb2RpZUVycm9yID0gcmVxdWlyZSgnLi4vZXJyb3InKTtcblxuLy9cbmZ1bmN0aW9uIEhvb2RpZU9iamVjdFR5cGVFcnJvcihwcm9wZXJ0aWVzKSB7XG4gIHByb3BlcnRpZXMubmFtZSA9ICdIb29kaWVPYmplY3RUeXBlRXJyb3InO1xuICBwcm9wZXJ0aWVzLm1lc3NhZ2UgPSAnXCJ7e3R5cGV9fVwiIGlzIGludmFsaWQgb2JqZWN0IHR5cGUuIHt7cnVsZXN9fS4nO1xuXG4gIHJldHVybiBuZXcgSG9vZGllRXJyb3IocHJvcGVydGllcyk7XG59XG52YXIgdmFsaWRUeXBlUGF0dGVybiA9IC9eW2EteiRdW2EtejAtOV0rJC87XG5Ib29kaWVPYmplY3RUeXBlRXJyb3IuaXNJbnZhbGlkID0gZnVuY3Rpb24odHlwZSwgY3VzdG9tUGF0dGVybikge1xuICByZXR1cm4gISAoY3VzdG9tUGF0dGVybiB8fCB2YWxpZFR5cGVQYXR0ZXJuKS50ZXN0KHR5cGUgfHwgJycpO1xufTtcbkhvb2RpZU9iamVjdFR5cGVFcnJvci5pc1ZhbGlkID0gZnVuY3Rpb24odHlwZSwgY3VzdG9tUGF0dGVybikge1xuICByZXR1cm4gKGN1c3RvbVBhdHRlcm4gfHwgdmFsaWRUeXBlUGF0dGVybikudGVzdCh0eXBlIHx8ICcnKTtcbn07XG5Ib29kaWVPYmplY3RUeXBlRXJyb3IucHJvdG90eXBlLnJ1bGVzID0gJ2xvd2VyY2FzZSBsZXR0ZXJzLCBudW1iZXJzIGFuZCBkYXNoZXMgYWxsb3dlZCBvbmx5LiBNdXN0IHN0YXJ0IHdpdGggYSBsZXR0ZXInO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhvb2RpZU9iamVjdFR5cGVFcnJvcjtcbiIsIi8vIEV2ZW50c1xuLy8gPT09PT09PT1cbi8vXG4vLyBleHRlbmQgYW55IENsYXNzIHdpdGggc3VwcG9ydCBmb3Jcbi8vXG4vLyAqIGBvYmplY3QuYmluZCgnZXZlbnQnLCBjYilgXG4vLyAqIGBvYmplY3QudW5iaW5kKCdldmVudCcsIGNiKWBcbi8vICogYG9iamVjdC50cmlnZ2VyKCdldmVudCcsIGFyZ3MuLi4pYFxuLy8gKiBgb2JqZWN0Lm9uZSgnZXYnLCBjYilgXG4vL1xuLy8gYmFzZWQgb24gW0V2ZW50cyBpbXBsZW1lbnRhdGlvbnMgZnJvbSBTcGluZV0oaHR0cHM6Ly9naXRodWIuY29tL21hY2NtYW4vc3BpbmUvYmxvYi9tYXN0ZXIvc3JjL3NwaW5lLmNvZmZlZSNMMSlcbi8vXG5cbi8vIGNhbGxiYWNrcyBhcmUgZ2xvYmFsLCB3aGlsZSB0aGUgZXZlbnRzIEFQSSBpcyB1c2VkIGF0IHNldmVyYWwgcGxhY2VzLFxuLy8gbGlrZSBob29kaWUub24gLyBob29kaWUuc3RvcmUub24gLyBob29kaWUudGFzay5vbiBldGMuXG4vL1xuXG5mdW5jdGlvbiBob29kaWVFdmVudHMoaG9vZGllLCBvcHRpb25zKSB7XG4gIHZhciBjb250ZXh0ID0gaG9vZGllO1xuICB2YXIgbmFtZXNwYWNlID0gJyc7XG5cbiAgLy8gbm9ybWFsaXplIG9wdGlvbnMgaGFzaFxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAvLyBtYWtlIHN1cmUgY2FsbGJhY2tzIGhhc2ggZXhpc3RzXG4gIGlmICghaG9vZGllLmV2ZW50c0NhbGxiYWNrcykge1xuICAgIGhvb2RpZS5ldmVudHNDYWxsYmFja3MgPSB7fTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmNvbnRleHQpIHtcbiAgICBjb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0O1xuICAgIG5hbWVzcGFjZSA9IG9wdGlvbnMubmFtZXNwYWNlICsgJzonO1xuICB9XG5cbiAgLy8gQmluZFxuICAvLyAtLS0tLS1cbiAgLy9cbiAgLy8gYmluZCBhIGNhbGxiYWNrIHRvIGFuIGV2ZW50IHRyaWdnZXJkIGJ5IHRoZSBvYmplY3RcbiAgLy9cbiAgLy8gICAgIG9iamVjdC5iaW5kICdjaGVhdCcsIGJsYW1lXG4gIC8vXG4gIGZ1bmN0aW9uIGJpbmQoZXYsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGV2cywgbmFtZSwgX2ksIF9sZW47XG5cbiAgICBldnMgPSBldi5zcGxpdCgnICcpO1xuXG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBldnMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIG5hbWUgPSBuYW1lc3BhY2UgKyBldnNbX2ldO1xuICAgICAgaG9vZGllLmV2ZW50c0NhbGxiYWNrc1tuYW1lXSA9IGhvb2RpZS5ldmVudHNDYWxsYmFja3NbbmFtZV0gfHwgW107XG4gICAgICBob29kaWUuZXZlbnRzQ2FsbGJhY2tzW25hbWVdLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbiAgfVxuXG4gIC8vIG9uZVxuICAvLyAtLS0tLVxuICAvL1xuICAvLyBzYW1lIGFzIGBiaW5kYCwgYnV0IGRvZXMgZ2V0IGV4ZWN1dGVkIG9ubHkgb25jZVxuICAvL1xuICAvLyAgICAgb2JqZWN0Lm9uZSAnZ3JvdW5kVG91Y2gnLCBnYW1lT3ZlclxuICAvL1xuICBmdW5jdGlvbiBvbmUoZXYsIGNhbGxiYWNrKSB7XG4gICAgZXYgPSBuYW1lc3BhY2UgKyBldjtcbiAgICB2YXIgd3JhcHBlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaG9vZGllLnVuYmluZChldiwgd3JhcHBlcik7XG4gICAgICBjYWxsYmFjay5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgaG9vZGllLmJpbmQoZXYsIHdyYXBwZXIpO1xuICB9XG5cbiAgLy8gdHJpZ2dlclxuICAvLyAtLS0tLS0tLS1cbiAgLy9cbiAgLy8gdHJpZ2dlciBhbiBldmVudCBhbmQgcGFzcyBvcHRpb25hbCBwYXJhbWV0ZXJzIGZvciBiaW5kaW5nLlxuICAvLyAgICAgb2JqZWN0LnRyaWdnZXIgJ3dpbicsIHNjb3JlOiAxMjMwXG4gIC8vXG4gIGZ1bmN0aW9uIHRyaWdnZXIoKSB7XG4gICAgdmFyIGFyZ3MsIGNhbGxiYWNrLCBldiwgbGlzdCwgX2ksIF9sZW47XG5cbiAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgIGV2ID0gYXJncy5zaGlmdCgpO1xuICAgIGV2ID0gbmFtZXNwYWNlICsgZXY7XG4gICAgbGlzdCA9IGhvb2RpZS5ldmVudHNDYWxsYmFja3NbZXZdO1xuXG4gICAgaWYgKCFsaXN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBsaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBjYWxsYmFjayA9IGxpc3RbX2ldO1xuICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyB1bmJpbmRcbiAgLy8gLS0tLS0tLS1cbiAgLy9cbiAgLy8gdW5iaW5kIHRvIGZyb20gYWxsIGJpbmRpbmdzLCBmcm9tIGFsbCBiaW5kaW5ncyBvZiBhIHNwZWNpZmljIGV2ZW50XG4gIC8vIG9yIGZyb20gYSBzcGVjaWZpYyBiaW5kaW5nLlxuICAvL1xuICAvLyAgICAgb2JqZWN0LnVuYmluZCgpXG4gIC8vICAgICBvYmplY3QudW5iaW5kICdtb3ZlJ1xuICAvLyAgICAgb2JqZWN0LnVuYmluZCAnbW92ZScsIGZvbGxvd1xuICAvL1xuICBmdW5jdGlvbiB1bmJpbmQoZXYsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGNiLCBpLCBsaXN0LCBfaSwgX2xlbiwgZXZOYW1lcztcblxuICAgIGlmICghZXYpIHtcbiAgICAgIGlmICghbmFtZXNwYWNlKSB7XG4gICAgICAgIGhvb2RpZS5ldmVudHNDYWxsYmFja3MgPSB7fTtcbiAgICAgIH1cblxuICAgICAgZXZOYW1lcyA9IE9iamVjdC5rZXlzKGhvb2RpZS5ldmVudHNDYWxsYmFja3MpO1xuICAgICAgZXZOYW1lcyA9IGV2TmFtZXMuZmlsdGVyKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4ga2V5LmluZGV4T2YobmFtZXNwYWNlKSA9PT0gMDtcbiAgICAgIH0pO1xuICAgICAgZXZOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBkZWxldGUgaG9vZGllLmV2ZW50c0NhbGxiYWNrc1trZXldO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldiA9IG5hbWVzcGFjZSArIGV2O1xuXG4gICAgbGlzdCA9IGhvb2RpZS5ldmVudHNDYWxsYmFja3NbZXZdO1xuXG4gICAgaWYgKCFsaXN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgZGVsZXRlIGhvb2RpZS5ldmVudHNDYWxsYmFja3NbZXZdO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoaSA9IF9pID0gMCwgX2xlbiA9IGxpc3QubGVuZ3RoOyBfaSA8IF9sZW47IGkgPSArK19pKSB7XG4gICAgICBjYiA9IGxpc3RbaV07XG5cblxuICAgICAgaWYgKGNiICE9PSBjYWxsYmFjaykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgbGlzdCA9IGxpc3Quc2xpY2UoKTtcbiAgICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgICAgaG9vZGllLmV2ZW50c0NhbGxiYWNrc1tldl0gPSBsaXN0O1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29udGV4dC5iaW5kID0gYmluZDtcbiAgY29udGV4dC5vbiA9IGJpbmQ7XG4gIGNvbnRleHQub25lID0gb25lO1xuICBjb250ZXh0LnRyaWdnZXIgPSB0cmlnZ2VyO1xuICBjb250ZXh0LnVuYmluZCA9IHVuYmluZDtcbiAgY29udGV4dC5vZmYgPSB1bmJpbmQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllRXZlbnRzO1xuIiwiLy8gaG9vZGllLmdlbmVyYXRlSWRcbi8vID09PT09PT09PT09PT1cblxuLy8gaGVscGVyIHRvIGdlbmVyYXRlIHVuaXF1ZSBpZHMuXG5mdW5jdGlvbiBob29kaWVHZW5lcmF0ZUlkIChob29kaWUpIHtcbiAgdmFyIGNoYXJzLCBpLCByYWRpeDtcblxuICAvLyB1dWlkcyBjb25zaXN0IG9mIG51bWJlcnMgYW5kIGxvd2VyY2FzZSBsZXR0ZXJzIG9ubHkuXG4gIC8vIFdlIHN0aWNrIHRvIGxvd2VyY2FzZSBsZXR0ZXJzIHRvIHByZXZlbnQgY29uZnVzaW9uXG4gIC8vIGFuZCB0byBwcmV2ZW50IGlzc3VlcyB3aXRoIENvdWNoREIsIGUuZy4gZGF0YWJhc2VcbiAgLy8gbmFtZXMgZG8gd29ubHkgYWxsb3cgZm9yIGxvd2VyY2FzZSBsZXR0ZXJzLlxuICBjaGFycyA9ICcwMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXonLnNwbGl0KCcnKTtcbiAgcmFkaXggPSBjaGFycy5sZW5ndGg7XG5cblxuICBmdW5jdGlvbiBnZW5lcmF0ZUlkKGxlbmd0aCkge1xuICAgIHZhciBpZCA9ICcnO1xuXG4gICAgLy8gZGVmYXVsdCB1dWlkIGxlbmd0aCB0byA3XG4gICAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZW5ndGggPSA3O1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHJhbmQgPSBNYXRoLnJhbmRvbSgpICogcmFkaXg7XG4gICAgICB2YXIgY2hhciA9IGNoYXJzW01hdGguZmxvb3IocmFuZCldO1xuICAgICAgaWQgKz0gU3RyaW5nKGNoYXIpLmNoYXJBdCgwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICAvL1xuICAvLyBQdWJsaWMgQVBJXG4gIC8vXG4gIGhvb2RpZS5nZW5lcmF0ZUlkID0gZ2VuZXJhdGVJZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVHZW5lcmF0ZUlkO1xuIiwiLy8gaG9vZGllLmlkXG4vLyA9PT09PT09PT1cblxuLy8gZ2VuZXJhdGVzIGEgcmFuZG9tIGlkIGFuZCBwZXJzaXN0cyB1c2luZyBob29kaWUuY29uZmlnXG4vLyB1bnRpbCB0aGUgdXNlciBzaWducyBvdXQgb3IgZGVsZXRlcyBsb2NhbCBkYXRhXG5mdW5jdGlvbiBob29kaWVJZCAoaG9vZGllKSB7XG4gIHZhciBpZDtcblxuICBmdW5jdGlvbiBnZXRJZCgpIHtcbiAgICBpZiAoISBpZCkge1xuICAgICAgc2V0SWQoIGhvb2RpZS5nZW5lcmF0ZUlkKCkgKTtcbiAgICB9XG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0SWQobmV3SWQpIHtcbiAgICBpZCA9IG5ld0lkO1xuICAgIGhvb2RpZS5jb25maWcuc2V0KCdfaG9vZGllSWQnLCBuZXdJZCk7XG4gIH1cblxuICBmdW5jdGlvbiB1bnNldElkICgpIHtcbiAgICBpZCA9IHVuZGVmaW5lZDtcbiAgICBob29kaWUuY29uZmlnLnVuc2V0KCdfaG9vZGllSWQnKTtcbiAgfVxuXG4gIC8vXG4gIC8vIGluaXRpYWxpemVcbiAgLy9cbiAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBpZCA9IGhvb2RpZS5jb25maWcuZ2V0KCdfaG9vZGllSWQnKTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biBpbml0IG9ubHkgb25jZSBmcm9tIG91dHNpZGVcbiAgZ2V0SWQuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgIGluaXQoKTtcbiAgICBkZWxldGUgZ2V0SWQuaW5pdDtcbiAgfTtcblxuICAvL1xuICAvLyBzdWJzY3JpYmUgdG8gZXZlbnRzIGNvbWluZyBmcm9tIG90aGVyIG1vZHVsZXNcbiAgLy9cbiAgZnVuY3Rpb24gc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCkge1xuICAgIGhvb2RpZS5vbignYWNjb3VudDpjbGVhbnVwJywgdW5zZXRJZCk7XG4gICAgaG9vZGllLm9uKCdhY2NvdW50OnNpZ25pbicsIGZ1bmN0aW9uKHVzZXJuYW1lLCBob29kaWVJZCkge1xuICAgICAgc2V0SWQoaG9vZGllSWQpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gYWxsb3cgdG8gcnVuIHRoaXMgb25seSBvbmNlIGZyb20gb3V0c2lkZVxuICBnZXRJZC5zdWJzY3JpYmVUb091dHNpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKTtcbiAgICBkZWxldGUgZ2V0SWQuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzO1xuICB9O1xuXG4gIC8vXG4gIC8vIFB1YmxpYyBBUElcbiAgLy9cbiAgaG9vZGllLmlkID0gZ2V0SWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllSWQ7XG4iLCJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTsvLyBMb2NhbFN0b3JlXG4vLyA9PT09PT09PT09PT1cblxuLy9cbnZhciBob29kaWVTdG9yZUFwaSA9IHJlcXVpcmUoJy4vc3RvcmUnKTtcbnZhciBIb29kaWVPYmplY3RUeXBlRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yL29iamVjdF90eXBlJyk7XG52YXIgSG9vZGllT2JqZWN0SWRFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3Ivb2JqZWN0X2lkJyk7XG5cbnZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKTtcblxuLy9cbmZ1bmN0aW9uIGhvb2RpZVN0b3JlIChob29kaWUpIHtcblxuICB2YXIgbG9jYWxTdG9yZSA9IHt9O1xuXG4gIC8vXG4gIC8vIHN0YXRlXG4gIC8vIC0tLS0tLS1cbiAgLy9cblxuICAvLyBjYWNoZSBvZiBsb2NhbFN0b3JhZ2UgZm9yIHF1aWNrZXIgYWNjZXNzXG4gIHZhciBjYWNoZWRPYmplY3QgPSB7fTtcblxuICAvLyBtYXAgb2YgZGlydHkgb2JqZWN0cyBieSB0aGVpciBpZHNcbiAgdmFyIGRpcnR5ID0ge307XG5cbiAgLy8gcXVldWUgb2YgbWV0aG9kIGNhbGxzIGRvbmUgZHVyaW5nIGJvb3RzdHJhcHBpbmdcbiAgdmFyIHF1ZXVlID0gW107XG5cbiAgLy8gMiBzZWNvbmRzIHRpbW91dCBiZWZvcmUgdHJpZ2dlcmluZyB0aGUgYHN0b3JlOmlkbGVgIGV2ZW50XG4gIC8vXG4gIHZhciBpZGxlVGltZW91dCA9IDIwMDA7XG5cblxuXG5cbiAgLy8gLS0tLS0tXG4gIC8vXG4gIC8vIHNhdmVzIHRoZSBwYXNzZWQgb2JqZWN0IGludG8gdGhlIHN0b3JlIGFuZCByZXBsYWNlc1xuICAvLyBhbiBldmVudHVhbGx5IGV4aXN0aW5nIG9iamVjdCB3aXRoIHNhbWUgdHlwZSAmIGlkLlxuICAvL1xuICAvLyBXaGVuIGlkIGlzIHVuZGVmaW5lZCwgaXQgZ2V0cyBnZW5lcmF0ZWQgYW4gbmV3IG9iamVjdCBnZXRzIHNhdmVkXG4gIC8vXG4gIC8vIEl0IGFsc28gYWRkcyB0aW1lc3RhbXBzIGFsb25nIHRoZSB3YXk6XG4gIC8vXG4gIC8vICogYGNyZWF0ZWRBdGAgdW5sZXNzIGl0IGFscmVhZHkgZXhpc3RzXG4gIC8vICogYHVwZGF0ZWRBdGAgZXZlcnkgdGltZVxuICAvLyAqIGBfc3luY2VkQXRgICBpZiBjaGFuZ2VzIGNvbWVzIGZyb20gcmVtb3RlXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2U6XG4gIC8vXG4gIC8vICAgICBzdG9yZS5zYXZlKCdjYXInLCB1bmRlZmluZWQsIHtjb2xvcjogJ3JlZCd9KVxuICAvLyAgICAgc3RvcmUuc2F2ZSgnY2FyJywgJ2FiYzQ1NjcnLCB7Y29sb3I6ICdyZWQnfSlcbiAgLy9cbiAgbG9jYWxTdG9yZS5zYXZlID0gZnVuY3Rpb24gc2F2ZShvYmplY3QsIG9wdGlvbnMpIHtcbiAgICB2YXIgY3VycmVudE9iamVjdCwgZGVmZXIsIGVycm9yLCBldmVudCwgaXNOZXcsIGtleTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLy8gaWYgc3RvcmUgaXMgY3VycmVudGx5IGJvb3RzdHJhcHBpbmcgZGF0YSBmcm9tIHJlbW90ZSxcbiAgICAvLyB3ZSdyZSBxdWV1ZWluZyBsb2NhbCBzYXZlcyB1bnRpbCBpdCdzIGZpbmlzaGVkLlxuICAgIGlmIChzdG9yZS5pc0Jvb3RzdHJhcHBpbmcoKSAmJiAhb3B0aW9ucy5yZW1vdGUpIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKCdzYXZlJywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICAvLyBnZW5lcmF0ZSBhbiBpZCBpZiBuZWNlc3NhcnlcbiAgICBpZiAob2JqZWN0LmlkKSB7XG4gICAgICBjdXJyZW50T2JqZWN0ID0gY2FjaGUob2JqZWN0LnR5cGUsIG9iamVjdC5pZCk7XG4gICAgICBpc05ldyA9IHR5cGVvZiBjdXJyZW50T2JqZWN0ICE9PSAnb2JqZWN0JztcbiAgICB9IGVsc2Uge1xuICAgICAgaXNOZXcgPSB0cnVlO1xuICAgICAgb2JqZWN0LmlkID0gaG9vZGllLmdlbmVyYXRlSWQoKTtcbiAgICB9XG5cbiAgICBpZiAoaXNOZXcpIHtcbiAgICAgIC8vIGFkZCBjcmVhdGVkQnkgaGFzaFxuICAgICAgb2JqZWN0LmNyZWF0ZWRCeSA9IG9iamVjdC5jcmVhdGVkQnkgfHwgaG9vZGllLmlkKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gbGVhdmUgY3JlYXRlZEJ5IGhhc2hcbiAgICAgIGlmIChjdXJyZW50T2JqZWN0LmNyZWF0ZWRCeSkge1xuICAgICAgICBvYmplY3QuY3JlYXRlZEJ5ID0gY3VycmVudE9iamVjdC5jcmVhdGVkQnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaGFuZGxlIGxvY2FsIHByb3BlcnRpZXMgYW5kIGhpZGRlbiBwcm9wZXJ0aWVzIHdpdGggJCBwcmVmaXhcbiAgICAvLyBrZWVwIGxvY2FsIHByb3BlcnRpZXMgZm9yIHJlbW90ZSB1cGRhdGVzXG4gICAgaWYgKCFpc05ldykge1xuXG4gICAgICAvLyBmb3IgcmVtb3RlIHVwZGF0ZXMsIGtlZXAgbG9jYWwgcHJvcGVydGllcyAoc3RhcnRpbmcgd2l0aCAnXycpXG4gICAgICAvLyBmb3IgbG9jYWwgdXBkYXRlcywga2VlcCBoaWRkZW4gcHJvcGVydGllcyAoc3RhcnRpbmcgd2l0aCAnJCcpXG4gICAgICBmb3IgKGtleSBpbiBjdXJyZW50T2JqZWN0KSB7XG4gICAgICAgIGlmICghb2JqZWN0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICBzd2l0Y2ggKGtleS5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlICdfJzpcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbW90ZSkge1xuICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IGN1cnJlbnRPYmplY3Rba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJyQnOlxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnJlbW90ZSkge1xuICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IGN1cnJlbnRPYmplY3Rba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhZGQgdGltZXN0YW1wc1xuICAgIGlmIChvcHRpb25zLnJlbW90ZSkge1xuICAgICAgb2JqZWN0Ll9zeW5jZWRBdCA9IG5vdygpO1xuICAgIH0gZWxzZSBpZiAoIW9wdGlvbnMuc2lsZW50KSB7XG4gICAgICBvYmplY3QudXBkYXRlZEF0ID0gbm93KCk7XG4gICAgICBvYmplY3QuY3JlYXRlZEF0ID0gb2JqZWN0LmNyZWF0ZWRBdCB8fCBvYmplY3QudXBkYXRlZEF0O1xuICAgIH1cblxuICAgIC8vIGhhbmRsZSBsb2NhbCBjaGFuZ2VzXG4gICAgLy9cbiAgICAvLyBBIGxvY2FsIGNoYW5nZSBpcyBtZWFudCB0byBiZSByZXBsaWNhdGVkIHRvIHRoZVxuICAgIC8vIHVzZXJzIGRhdGFiYXNlLCBidXQgbm90IGJleW9uZC4gRm9yIGV4YW1wbGUgd2hlblxuICAgIC8vIEkgc3Vic2NyaWJlZCB0byBhIHNoYXJlIGJ1dCB0aGVuIGRlY2lkZSB0byB1bnN1YnNjcmliZSxcbiAgICAvLyBhbGwgb2JqZWN0cyBnZXQgcmVtb3ZlZCB3aXRoIGxvY2FsOiB0cnVlIGZsYWcsIHNvIHRoYXRcbiAgICAvLyB0aGV5IGdldCByZW1vdmVkIGZyb20gbXkgZGF0YWJhc2UsIGJ1dCB3b24ndCBhbnl3aGVyZSBlbHNlLlxuICAgIGlmIChvcHRpb25zLmxvY2FsKSB7XG4gICAgICBvYmplY3QuXyRsb2NhbCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBvYmplY3QuXyRsb2NhbDtcbiAgICB9XG5cbiAgICBkZWZlciA9IGhvb2RpZS5kZWZlcigpO1xuXG4gICAgdHJ5IHtcbiAgICAgIG9iamVjdCA9IGNhY2hlKG9iamVjdC50eXBlLCBvYmplY3QuaWQsIG9iamVjdCwgb3B0aW9ucyk7XG4gICAgICBkZWZlci5yZXNvbHZlKG9iamVjdCwgaXNOZXcpLnByb21pc2UoKTtcbiAgICAgIGV2ZW50ID0gaXNOZXcgPyAnYWRkJyA6ICd1cGRhdGUnO1xuICAgICAgdHJpZ2dlckV2ZW50cyhldmVudCwgb2JqZWN0LCBvcHRpb25zKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGVycm9yID0gX2Vycm9yO1xuICAgICAgZGVmZXIucmVqZWN0KGVycm9yLnRvU3RyaW5nKCkpO1xuICAgIH1cblxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH07XG5cblxuICAvLyBmaW5kXG4gIC8vIC0tLS0tLVxuXG4gIC8vIGxvYWRzIG9uZSBvYmplY3QgZnJvbSBTdG9yZSwgc3BlY2lmaWVkIGJ5IGB0eXBlYCBhbmQgYGlkYFxuICAvL1xuICAvLyBleGFtcGxlIHVzYWdlOlxuICAvL1xuICAvLyAgICAgc3RvcmUuZmluZCgnY2FyJywgJ2FiYzQ1NjcnKVxuICBsb2NhbFN0b3JlLmZpbmQgPSBmdW5jdGlvbih0eXBlLCBpZCkge1xuICAgIHZhciBlcnJvciwgb2JqZWN0O1xuXG4gICAgLy8gaWYgc3RvcmUgaXMgY3VycmVudGx5IGJvb3RzdHJhcHBpbmcgZGF0YSBmcm9tIHJlbW90ZSxcbiAgICAvLyB3ZSdyZSBxdWV1ZWluZyB1bnRpbCBpdCdzIGZpbmlzaGVkXG4gICAgaWYgKHN0b3JlLmlzQm9vdHN0cmFwcGluZygpKSB7XG4gICAgICByZXR1cm4gZW5xdWV1ZSgnZmluZCcsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIG9iamVjdCA9IGNhY2hlKHR5cGUsIGlkKTtcbiAgICAgIGlmICghb2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aCh7XG4gICAgICAgICAgbmFtZTogJ0hvb2RpZU5vdEZvdW5kRXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6ICdcInt7dHlwZX19XCIgd2l0aCBpZCBcInt7aWR9fVwiIGNvdWxkIG5vdCBiZSBmb3VuZCdcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaG9vZGllLnJlc29sdmVXaXRoKG9iamVjdCk7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICBlcnJvciA9IF9lcnJvcjtcbiAgICAgIHJldHVybiBob29kaWUucmVqZWN0V2l0aChlcnJvcik7XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gZmluZEFsbFxuICAvLyAtLS0tLS0tLS1cblxuICAvLyByZXR1cm5zIGFsbCBvYmplY3RzIGZyb20gc3RvcmUuXG4gIC8vIENhbiBiZSBvcHRpb25hbGx5IGZpbHRlcmVkIGJ5IGEgdHlwZSBvciBhIGZ1bmN0aW9uXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2U6XG4gIC8vXG4gIC8vICAgICBzdG9yZS5maW5kQWxsKClcbiAgLy8gICAgIHN0b3JlLmZpbmRBbGwoJ2NhcicpXG4gIC8vICAgICBzdG9yZS5maW5kQWxsKGZ1bmN0aW9uKG9iaikgeyByZXR1cm4gb2JqLmJyYW5kID09ICdUZXNsYScgfSlcbiAgLy9cbiAgbG9jYWxTdG9yZS5maW5kQWxsID0gZnVuY3Rpb24gZmluZEFsbChmaWx0ZXIpIHtcbiAgICB2YXIgY3VycmVudFR5cGUsIGRlZmVyLCBlcnJvciwgaWQsIGtleSwga2V5cywgb2JqLCByZXN1bHRzLCB0eXBlO1xuXG5cblxuICAgIGlmIChmaWx0ZXIgPT0gbnVsbCkge1xuICAgICAgZmlsdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBpZiBzdG9yZSBpcyBjdXJyZW50bHkgYm9vdHN0cmFwcGluZyBkYXRhIGZyb20gcmVtb3RlLFxuICAgIC8vIHdlJ3JlIHF1ZXVlaW5nIHVudGlsIGl0J3MgZmluaXNoZWRcbiAgICBpZiAoc3RvcmUuaXNCb290c3RyYXBwaW5nKCkpIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKCdmaW5kQWxsJywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBrZXlzID0gc3RvcmUuaW5kZXgoKTtcblxuICAgIC8vIG5vcm1hbGl6ZSBmaWx0ZXJcbiAgICBpZiAodHlwZW9mIGZpbHRlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHR5cGUgPSBmaWx0ZXI7XG4gICAgICBmaWx0ZXIgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iai50eXBlID09PSB0eXBlO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBkZWZlciA9IGhvb2RpZS5kZWZlcigpO1xuXG4gICAgdHJ5IHtcblxuICAgICAgLy9cbiAgICAgIHJlc3VsdHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0ga2V5cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIGtleSA9IGtleXNbX2ldO1xuICAgICAgICAgIGlmICghKGlzU2VtYW50aWNLZXkoa2V5KSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfcmVmID0ga2V5LnNwbGl0KCcvJyksXG4gICAgICAgICAgY3VycmVudFR5cGUgPSBfcmVmWzBdLFxuICAgICAgICAgIGlkID0gX3JlZlsxXTtcblxuICAgICAgICAgIG9iaiA9IGNhY2hlKGN1cnJlbnRUeXBlLCBpZCk7XG4gICAgICAgICAgaWYgKG9iaiAmJiBmaWx0ZXIob2JqKSkge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChvYmopO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfSkuY2FsbCh0aGlzKTtcblxuICAgICAgLy8gc29ydCBmcm9tIG5ld2VzdCB0byBvbGRlc3RcbiAgICAgIHJlc3VsdHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIGlmIChhLmNyZWF0ZWRBdCA+IGIuY3JlYXRlZEF0KSB7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9IGVsc2UgaWYgKGEuY3JlYXRlZEF0IDwgYi5jcmVhdGVkQXQpIHtcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBkZWZlci5yZXNvbHZlKHJlc3VsdHMpLnByb21pc2UoKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGVycm9yID0gX2Vycm9yO1xuICAgICAgZGVmZXIucmVqZWN0KGVycm9yKS5wcm9taXNlKCk7XG4gICAgfVxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH07XG5cblxuICAvLyBSZW1vdmVcbiAgLy8gLS0tLS0tLS1cblxuICAvLyBSZW1vdmVzIG9uZSBvYmplY3Qgc3BlY2lmaWVkIGJ5IGB0eXBlYCBhbmQgYGlkYC5cbiAgLy9cbiAgLy8gd2hlbiBvYmplY3QgaGFzIGJlZW4gc3luY2VkIGJlZm9yZSwgbWFyayBpdCBhcyBkZWxldGVkLlxuICAvLyBPdGhlcndpc2UgcmVtb3ZlIGl0IGZyb20gU3RvcmUuXG4gIGxvY2FsU3RvcmUucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKHR5cGUsIGlkLCBvcHRpb25zKSB7XG4gICAgdmFyIGtleSwgb2JqZWN0LCBvYmplY3RXYXNNYXJrZWRBc0RlbGV0ZWQ7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIGlmIHN0b3JlIGlzIGN1cnJlbnRseSBib290c3RyYXBwaW5nIGRhdGEgZnJvbSByZW1vdGUsXG4gICAgLy8gd2UncmUgcXVldWVpbmcgbG9jYWwgcmVtb3ZlcyB1bnRpbCBpdCdzIGZpbmlzaGVkLlxuICAgIGlmIChzdG9yZS5pc0Jvb3RzdHJhcHBpbmcoKSAmJiAhb3B0aW9ucy5yZW1vdGUpIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKCdyZW1vdmUnLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIGtleSA9IHR5cGUgKyAnLycgKyBpZDtcblxuICAgIG9iamVjdCA9IGNhY2hlKHR5cGUsIGlkKTtcblxuICAgIC8vIGlmIGNoYW5nZSBjb21lcyBmcm9tIHJlbW90ZSwganVzdCBjbGVhbiB1cCBsb2NhbGx5XG4gICAgaWYgKG9wdGlvbnMucmVtb3RlKSB7XG4gICAgICBkYi5yZW1vdmVJdGVtKGtleSk7XG4gICAgICBvYmplY3RXYXNNYXJrZWRBc0RlbGV0ZWQgPSBjYWNoZWRPYmplY3Rba2V5XSAmJiBpc01hcmtlZEFzRGVsZXRlZChjYWNoZWRPYmplY3Rba2V5XSk7XG4gICAgICBjYWNoZWRPYmplY3Rba2V5XSA9IGZhbHNlO1xuICAgICAgY2xlYXJDaGFuZ2VkKHR5cGUsIGlkKTtcbiAgICAgIGlmIChvYmplY3RXYXNNYXJrZWRBc0RlbGV0ZWQgJiYgb2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBob29kaWUucmVzb2x2ZVdpdGgob2JqZWN0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIW9iamVjdCkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKHtcbiAgICAgICAgbmFtZTogJ0hvb2RpZU5vdEZvdW5kRXJyb3InLFxuICAgICAgICBtZXNzYWdlOiAnXCJ7e3R5cGV9fVwiIHdpdGggaWQgXCJ7e2lkfX1cIlwiIGNvdWxkIG5vdCBiZSBmb3VuZCdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChvYmplY3QuX3N5bmNlZEF0KSB7XG4gICAgICBvYmplY3QuX2RlbGV0ZWQgPSB0cnVlO1xuICAgICAgY2FjaGUodHlwZSwgaWQsIG9iamVjdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleSA9IHR5cGUgKyAnLycgKyBpZDtcbiAgICAgIGRiLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICAgIGNhY2hlZE9iamVjdFtrZXldID0gZmFsc2U7XG4gICAgICBjbGVhckNoYW5nZWQodHlwZSwgaWQpO1xuICAgIH1cblxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE0N1xuICAgIGlmIChvcHRpb25zLnVwZGF0ZSkge1xuICAgICAgb2JqZWN0ID0gb3B0aW9ucy51cGRhdGU7XG4gICAgICBkZWxldGUgb3B0aW9ucy51cGRhdGU7XG4gICAgfVxuICAgIHRyaWdnZXJFdmVudHMoJ3JlbW92ZScsIG9iamVjdCwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlV2l0aChvYmplY3QpO1xuICB9O1xuXG5cbiAgLy8gUmVtb3ZlIGFsbFxuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy8gUmVtb3ZlcyBvbmUgb2JqZWN0IHNwZWNpZmllZCBieSBgdHlwZWAgYW5kIGBpZGAuXG4gIC8vXG4gIC8vIHdoZW4gb2JqZWN0IGhhcyBiZWVuIHN5bmNlZCBiZWZvcmUsIG1hcmsgaXQgYXMgZGVsZXRlZC5cbiAgLy8gT3RoZXJ3aXNlIHJlbW92ZSBpdCBmcm9tIFN0b3JlLlxuICBsb2NhbFN0b3JlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uIHJlbW92ZUFsbCh0eXBlLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHN0b3JlLmZpbmRBbGwodHlwZSkudGhlbihmdW5jdGlvbihvYmplY3RzKSB7XG4gICAgICB2YXIgb2JqZWN0LCBfaSwgX2xlbiwgcmVzdWx0cztcblxuICAgICAgcmVzdWx0cyA9IFtdO1xuXG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG9iamVjdHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgb2JqZWN0ID0gb2JqZWN0c1tfaV07XG4gICAgICAgIHJlc3VsdHMucHVzaChzdG9yZS5yZW1vdmUob2JqZWN0LnR5cGUsIG9iamVjdC5pZCwgb3B0aW9ucykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyB2YWxpZGF0ZVxuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy9cbiAgZnVuY3Rpb24gdmFsaWRhdGUgKG9iamVjdCkge1xuXG4gICAgaWYgKEhvb2RpZU9iamVjdFR5cGVFcnJvci5pc0ludmFsaWQob2JqZWN0LnR5cGUpKSB7XG4gICAgICByZXR1cm4gbmV3IEhvb2RpZU9iamVjdFR5cGVFcnJvcih7XG4gICAgICAgIHR5cGU6IG9iamVjdC50eXBlXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIW9iamVjdC5pZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChIb29kaWVPYmplY3RJZEVycm9yLmlzSW52YWxpZChvYmplY3QuaWQpKSB7XG4gICAgICByZXR1cm4gbmV3IEhvb2RpZU9iamVjdElkRXJyb3Ioe1xuICAgICAgICBpZDogb2JqZWN0LmlkXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB2YXIgc3RvcmUgPSBob29kaWVTdG9yZUFwaShob29kaWUsIHtcblxuICAgIC8vIHZhbGlkYXRlXG4gICAgdmFsaWRhdGU6IHZhbGlkYXRlLFxuXG4gICAgYmFja2VuZDoge1xuICAgICAgc2F2ZTogbG9jYWxTdG9yZS5zYXZlLFxuICAgICAgZmluZDogbG9jYWxTdG9yZS5maW5kLFxuICAgICAgZmluZEFsbDogbG9jYWxTdG9yZS5maW5kQWxsLFxuICAgICAgcmVtb3ZlOiBsb2NhbFN0b3JlLnJlbW92ZSxcbiAgICAgIHJlbW92ZUFsbDogbG9jYWxTdG9yZS5yZW1vdmVBbGwsXG4gICAgfVxuICB9KTtcblxuXG5cbiAgLy8gZXh0ZW5kZWQgcHVibGljIEFQSVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG4gIC8vIGluZGV4XG4gIC8vIC0tLS0tLS1cblxuICAvLyBvYmplY3Qga2V5IGluZGV4XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjYWNoeVxuICBzdG9yZS5pbmRleCA9IGZ1bmN0aW9uIGluZGV4KCkge1xuICAgIHZhciBpLCBrZXksIGtleXMsIF9pLCBfcmVmO1xuICAgIGtleXMgPSBbXTtcbiAgICBmb3IgKGkgPSBfaSA9IDAsIF9yZWYgPSBkYi5sZW5ndGgoKTsgMCA8PSBfcmVmID8gX2kgPCBfcmVmIDogX2kgPiBfcmVmOyBpID0gMCA8PSBfcmVmID8gKytfaSA6IC0tX2kpIHtcbiAgICAgIGtleSA9IGRiLmtleShpKTtcbiAgICAgIGlmIChpc1NlbWFudGljS2V5KGtleSkpIHtcbiAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBrZXlzO1xuICB9O1xuXG5cbiAgLy8gY2hhbmdlZCBvYmplY3RzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmV0dXJucyBhbiBBcnJheSBvZiBhbGwgZGlydHkgZG9jdW1lbnRzXG4gIHN0b3JlLmNoYW5nZWRPYmplY3RzID0gZnVuY3Rpb24gY2hhbmdlZE9iamVjdHMoKSB7XG4gICAgdmFyIGlkLCBrZXksIG9iamVjdCwgdHlwZSwgX3JlZiwgX3JlZjEsIF9yZXN1bHRzO1xuXG4gICAgX3JlZiA9IGRpcnR5O1xuICAgIF9yZXN1bHRzID0gW107XG5cbiAgICBmb3IgKGtleSBpbiBfcmVmKSB7XG4gICAgICBpZiAoX3JlZi5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIG9iamVjdCA9IF9yZWZba2V5XTtcbiAgICAgICAgX3JlZjEgPSBrZXkuc3BsaXQoJy8nKSxcbiAgICAgICAgdHlwZSA9IF9yZWYxWzBdLFxuICAgICAgICBpZCA9IF9yZWYxWzFdO1xuICAgICAgICBvYmplY3QudHlwZSA9IHR5cGU7XG4gICAgICAgIG9iamVjdC5pZCA9IGlkO1xuICAgICAgICBfcmVzdWx0cy5wdXNoKG9iamVjdCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBfcmVzdWx0cztcbiAgfTtcblxuXG4gIC8vIElzIGRpcnR5P1xuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy8gV2hlbiBubyBhcmd1bWVudHMgcGFzc2VkLCByZXR1cm5zIGB0cnVlYCBvciBgZmFsc2VgIGRlcGVuZGluZyBvbiBpZiB0aGVyZSBhcmVcbiAgLy8gZGlydHkgb2JqZWN0cyBpbiB0aGUgc3RvcmUuXG4gIC8vXG4gIC8vIE90aGVyd2lzZSBpdCByZXR1cm5zIGB0cnVlYCBvciBgZmFsc2VgIGZvciB0aGUgcGFzc2VkIG9iamVjdC4gQW4gb2JqZWN0IGlzIGRpcnR5XG4gIC8vIGlmIGl0IGhhcyBubyBgX3N5bmNlZEF0YCBhdHRyaWJ1dGUgb3IgaWYgYHVwZGF0ZWRBdGAgaXMgbW9yZSByZWNlbnQgdGhhbiBgX3N5bmNlZEF0YFxuICBzdG9yZS5oYXNMb2NhbENoYW5nZXMgPSBmdW5jdGlvbih0eXBlLCBpZCkge1xuICAgIGlmICghdHlwZSkge1xuICAgICAgcmV0dXJuICEkLmlzRW1wdHlPYmplY3QoZGlydHkpO1xuICAgIH1cbiAgICB2YXIga2V5ID0gW3R5cGUsaWRdLmpvaW4oJy8nKTtcbiAgICBpZiAoZGlydHlba2V5XSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBoYXNMb2NhbENoYW5nZXMoY2FjaGUodHlwZSwgaWQpKTtcbiAgfTtcblxuXG4gIC8vIENsZWFyXG4gIC8vIC0tLS0tLVxuXG4gIC8vIGNsZWFycyBsb2NhbFN0b3JhZ2UgYW5kIGNhY2hlXG4gIC8vIFRPRE86IGRvIG5vdCBjbGVhciBlbnRpcmUgbG9jYWxTdG9yYWdlLCBjbGVhciBvbmx5IHRoZSBpdGVtcyB0aGF0IGhhdmUgYmVlbiBzdG9yZWRcbiAgLy8gICAgICAgdXNpbmcgYGhvb2RpZS5zdG9yZWAgYmVmb3JlLlxuICBzdG9yZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHZhciBkZWZlciwga2V5LCBrZXlzLCByZXN1bHRzO1xuICAgIGRlZmVyID0gaG9vZGllLmRlZmVyKCk7XG4gICAgdHJ5IHtcbiAgICAgIGtleXMgPSBzdG9yZS5pbmRleCgpO1xuICAgICAgcmVzdWx0cyA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIF9pLCBfbGVuLCBfcmVzdWx0cztcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBrZXlzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAga2V5ID0ga2V5c1tfaV07XG4gICAgICAgICAgaWYgKGlzU2VtYW50aWNLZXkoa2V5KSkge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChkYi5yZW1vdmVJdGVtKGtleSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9KS5jYWxsKHRoaXMpO1xuICAgICAgY2FjaGVkT2JqZWN0ID0ge307XG4gICAgICBjbGVhckNoYW5nZWQoKTtcbiAgICAgIGRlZmVyLnJlc29sdmUoKTtcbiAgICAgIHN0b3JlLnRyaWdnZXIoJ2NsZWFyJyk7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICBkZWZlci5yZWplY3QoX2Vycm9yKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfTtcblxuXG4gIC8vIGlzQm9vdHN0cmFwcGluZ1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHJldHVybnMgdHJ1ZSBpZiBzdG9yZSBpcyBjdXJyZW50bHkgYm9vdHN0cmFwcGluZyBkYXRhIGZyb20gcmVtb3RlLFxuICAvLyBvdGhlcndpc2UgZmFsc2UuXG4gIHZhciBib290c3RyYXBwaW5nID0gZmFsc2U7XG4gIHN0b3JlLmlzQm9vdHN0cmFwcGluZyA9IGZ1bmN0aW9uIGlzQm9vdHN0cmFwcGluZygpIHtcbiAgICByZXR1cm4gYm9vdHN0cmFwcGluZztcbiAgfTtcblxuXG4gIC8vIElzIHBlcnNpc3RhbnQ/XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyByZXR1cm5zIGB0cnVlYCBvciBgZmFsc2VgIGRlcGVuZGluZyBvbiB3aGV0aGVyIGxvY2FsU3RvcmFnZSBpcyBzdXBwb3J0ZWQgb3Igbm90LlxuICAvLyBCZXdhcmUgdGhhdCBzb21lIGJyb3dzZXJzIGxpa2UgU2FmYXJpIGRvIG5vdCBzdXBwb3J0IGxvY2FsU3RvcmFnZSBpbiBwcml2YXRlIG1vZGUuXG4gIC8vXG4gIC8vIGluc3BpcmVkIGJ5IHRoaXMgY2FwcHVjY2lubyBjb21taXRcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2NhcHB1Y2Npbm8vY2FwcHVjY2luby9jb21taXQvMDYzYjA1ZDk2NDNjMzViMzAzNTY4YTI4ODA5ZTRlYjMyMjRmNzFlY1xuICAvL1xuICBzdG9yZS5pc1BlcnNpc3RlbnQgPSBmdW5jdGlvbiBpc1BlcnNpc3RlbnQoKSB7XG4gICAgdHJ5IHtcblxuICAgICAgLy8gd2UndmUgdG8gcHV0IHRoaXMgaW4gaGVyZS4gSSd2ZSBzZWVuIEZpcmVmb3ggdGhyb3dpbmcgYFNlY3VyaXR5IGVycm9yOiAxMDAwYFxuICAgICAgLy8gd2hlbiBjb29raWVzIGhhdmUgYmVlbiBkaXNhYmxlZFxuICAgICAgaWYgKCFnbG9iYWwubG9jYWxTdG9yYWdlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gSnVzdCBiZWNhdXNlIGxvY2FsU3RvcmFnZSBleGlzdHMgZG9lcyBub3QgbWVhbiBpdCB3b3Jrcy4gSW4gcGFydGljdWxhciBpdCBtaWdodCBiZSBkaXNhYmxlZFxuICAgICAgLy8gYXMgaXQgaXMgd2hlbiBTYWZhcmkncyBwcml2YXRlIGJyb3dzaW5nIG1vZGUgaXMgYWN0aXZlLlxuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ1N0b3JhZ2UtVGVzdCcsICcxJyk7XG5cbiAgICAgIC8vIHRoYXQgc2hvdWxkIG5vdCBoYXBwZW4gLi4uXG4gICAgICBpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ1N0b3JhZ2UtVGVzdCcpICE9PSAnMScpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBva2F5LCBsZXQncyBjbGVhbiB1cCBpZiB3ZSBnb3QgaGVyZS5cbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdTdG9yYWdlLVRlc3QnKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcblxuICAgICAgLy8gaW4gY2FzZSBvZiBhbiBlcnJvciwgbGlrZSBTYWZhcmkncyBQcml2YXRlIE1vZGUsIHJldHVybiBmYWxzZVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIHdlJ3JlIGdvb2QuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cblxuXG5cbiAgLy9cbiAgLy8gUHJpdmF0ZSBtZXRob2RzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vXG5cblxuICAvLyBsb2NhbFN0b3JhZ2UgcHJveHlcbiAgLy9cbiAgdmFyIGRiID0ge1xuICAgIGdldEl0ZW06IGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGdsb2JhbC5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICAgIH0sXG4gICAgc2V0SXRlbTogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgcmV0dXJuIGdsb2JhbC5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIHZhbHVlKTtcbiAgICB9LFxuICAgIHJlbW92ZUl0ZW06IGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGdsb2JhbC5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xuICAgIH0sXG4gICAga2V5OiBmdW5jdGlvbihucikge1xuICAgICAgcmV0dXJuIGdsb2JhbC5sb2NhbFN0b3JhZ2Uua2V5KG5yKTtcbiAgICB9LFxuICAgIGxlbmd0aDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZ2xvYmFsLmxvY2FsU3RvcmFnZS5sZW5ndGg7XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gQ2FjaGVcbiAgLy8gLS0tLS0tLVxuXG4gIC8vIGxvYWRzIGFuIG9iamVjdCBzcGVjaWZpZWQgYnkgYHR5cGVgIGFuZCBgaWRgIG9ubHkgb25jZSBmcm9tIGxvY2FsU3RvcmFnZVxuICAvLyBhbmQgY2FjaGVzIGl0IGZvciBmYXN0ZXIgZnV0dXJlIGFjY2Vzcy4gVXBkYXRlcyBjYWNoZSB3aGVuIGB2YWx1ZWAgaXMgcGFzc2VkLlxuICAvL1xuICAvLyBBbHNvIGNoZWNrcyBpZiBvYmplY3QgbmVlZHMgdG8gYmUgc3luY2hlZCAoZGlydHkpIG9yIG5vdFxuICAvL1xuICAvLyBQYXNzIGBvcHRpb25zLnJlbW90ZSA9IHRydWVgIHdoZW4gb2JqZWN0IGNvbWVzIGZyb20gcmVtb3RlXG4gIC8vIFBhc3MgJ29wdGlvbnMuc2lsZW50ID0gdHJ1ZScgdG8gYXZvaWQgZXZlbnRzIGZyb20gYmVpbmcgdHJpZ2dlcmVkLlxuICBmdW5jdGlvbiBjYWNoZSh0eXBlLCBpZCwgb2JqZWN0LCBvcHRpb25zKSB7XG4gICAgdmFyIGtleTtcblxuICAgIGlmIChvYmplY3QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgb2JqZWN0ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAga2V5ID0gJycgKyB0eXBlICsgJy8nICsgaWQ7XG5cbiAgICBpZiAob2JqZWN0KSB7XG4gICAgICBleHRlbmQob2JqZWN0LCB7XG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIGlkOiBpZFxuICAgICAgfSk7XG5cbiAgICAgIHNldE9iamVjdCh0eXBlLCBpZCwgb2JqZWN0KTtcblxuICAgICAgaWYgKG9wdGlvbnMucmVtb3RlKSB7XG4gICAgICAgIGNsZWFyQ2hhbmdlZCh0eXBlLCBpZCk7XG4gICAgICAgIGNhY2hlZE9iamVjdFtrZXldID0gZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpO1xuICAgICAgICByZXR1cm4gY2FjaGVkT2JqZWN0W2tleV07XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAvLyBpZiB0aGUgY2FjaGVkIGtleSByZXR1cm5zIGZhbHNlLCBpdCBtZWFuc1xuICAgICAgLy8gdGhhdCB3ZSBoYXZlIHJlbW92ZWQgdGhhdCBrZXkuIFdlIGp1c3RcbiAgICAgIC8vIHNldCBpdCB0byBmYWxzZSBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgc29cbiAgICAgIC8vIHRoYXQgd2UgZG9uJ3QgbmVlZCB0byBsb29rIGl0IHVwIGFnYWluIGluIGxvY2FsU3RvcmFnZVxuICAgICAgaWYgKGNhY2hlZE9iamVjdFtrZXldID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIGtleSBpcyBjYWNoZWQsIHJldHVybiBpdC4gQnV0IG1ha2Ugc3VyZVxuICAgICAgLy8gdG8gbWFrZSBhIGRlZXAgY29weSBiZWZvcmVoYW5kICg9PiB0cnVlKVxuICAgICAgaWYgKGNhY2hlZE9iamVjdFtrZXldKSB7XG4gICAgICAgIHJldHVybiBleHRlbmQodHJ1ZSwge30sIGNhY2hlZE9iamVjdFtrZXldKTtcbiAgICAgIH1cblxuICAgICAgLy8gaWYgb2JqZWN0IGlzIG5vdCB5ZXQgY2FjaGVkLCBsb2FkIGl0IGZyb20gbG9jYWxTdG9yZVxuICAgICAgb2JqZWN0ID0gZ2V0T2JqZWN0KHR5cGUsIGlkKTtcblxuICAgICAgLy8gc3RvcCBoZXJlIGlmIG9iamVjdCBkaWQgbm90IGV4aXN0IGluIGxvY2FsU3RvcmVcbiAgICAgIC8vIGFuZCBjYWNoZSBpdCBzbyB3ZSBkb24ndCBuZWVkIHRvIGxvb2sgaXQgdXAgYWdhaW5cbiAgICAgIGlmIChvYmplY3QgPT09IGZhbHNlKSB7XG4gICAgICAgIGNsZWFyQ2hhbmdlZCh0eXBlLCBpZCk7XG4gICAgICAgIGNhY2hlZE9iamVjdFtrZXldID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIGlmIChpc01hcmtlZEFzRGVsZXRlZChvYmplY3QpKSB7XG4gICAgICBtYXJrQXNDaGFuZ2VkKHR5cGUsIGlkLCBvYmplY3QsIG9wdGlvbnMpO1xuICAgICAgY2FjaGVkT2JqZWN0W2tleV0gPSBmYWxzZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBoZXJlIGlzIHdoZXJlIHdlIGNhY2hlIHRoZSBvYmplY3QgZm9yXG4gICAgLy8gZnV0dXJlIHF1aWNrIGFjY2Vzc1xuICAgIGNhY2hlZE9iamVjdFtrZXldID0gZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpO1xuXG4gICAgaWYgKGhhc0xvY2FsQ2hhbmdlcyhvYmplY3QpKSB7XG4gICAgICBtYXJrQXNDaGFuZ2VkKHR5cGUsIGlkLCBjYWNoZWRPYmplY3Rba2V5XSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNsZWFyQ2hhbmdlZCh0eXBlLCBpZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KTtcbiAgfVxuXG5cbiAgLy8gYm9vdHN0cmFwcGluZyBkaXJ0eSBvYmplY3RzLCB0byBtYWtlIHN1cmVcbiAgLy8gdGhhdCByZW1vdmVkIG9iamVjdHMgZ2V0IHB1c2hlZCBhZnRlclxuICAvLyBwYWdlIHJlbG9hZC5cbiAgLy9cbiAgZnVuY3Rpb24gYm9vdHN0cmFwRGlydHlPYmplY3RzKCkge1xuICAgIHZhciBpZCwga2V5cywgb2JqLCB0eXBlLCBfaSwgX2xlbiwgX3JlZjtcbiAgICBrZXlzID0gZGIuZ2V0SXRlbSgnX2RpcnR5Jyk7XG5cbiAgICBpZiAoIWtleXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBrZXlzID0ga2V5cy5zcGxpdCgnLCcpO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0ga2V5cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgX3JlZiA9IGtleXNbX2ldLnNwbGl0KCcvJyksXG4gICAgICB0eXBlID0gX3JlZlswXSxcbiAgICAgIGlkID0gX3JlZlsxXTtcbiAgICAgIG9iaiA9IGNhY2hlKHR5cGUsIGlkKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vXG4gIC8vIHN1YnNjcmliZSB0byBldmVudHMgY29taW5nIGZyb20gYWNjb3VudCAmIG91ciByZW1vdGUgc3RvcmUuXG4gIC8vXG4gIGZ1bmN0aW9uIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpIHtcblxuICAgIC8vIGFjY291bnQgZXZlbnRzXG4gICAgaG9vZGllLm9uKCdhY2NvdW50OmNsZWFudXAnLCBzdG9yZS5jbGVhcik7XG4gICAgaG9vZGllLm9uKCdhY2NvdW50OnNpZ251cCcsIG1hcmtBbGxBc0NoYW5nZWQpO1xuICAgIGhvb2RpZS5vbigncmVtb3RlOmJvb3RzdHJhcDpzdGFydCcsIHN0YXJ0Qm9vdHN0cmFwcGluZ01vZGUpO1xuICAgIGhvb2RpZS5vbigncmVtb3RlOmJvb3RzdHJhcDplbmQnLCBlbmRCb290c3RyYXBwaW5nTW9kZSk7XG5cbiAgICAvLyByZW1vdGUgZXZlbnRzXG4gICAgaG9vZGllLm9uKCdyZW1vdGU6Y2hhbmdlJywgaGFuZGxlUmVtb3RlQ2hhbmdlKTtcbiAgICBob29kaWUub24oJ3JlbW90ZTpwdXNoJywgaGFuZGxlUHVzaGVkT2JqZWN0KTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9uY2UgZnJvbSBvdXRzaWRlXG4gIHN0b3JlLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuICAgIGRlbGV0ZSBzdG9yZS5zdWJzY3JpYmVUb091dHNpZGVFdmVudHM7XG4gIH07XG5cblxuICAvL1xuICAvLyBNYXJrcyBvYmplY3QgYXMgY2hhbmdlZCAoZGlydHkpLiBUcmlnZ2VycyBhIGBzdG9yZTpkaXJ0eWAgZXZlbnQgaW1tZWRpYXRlbHkgYW5kIGFcbiAgLy8gYHN0b3JlOmlkbGVgIGV2ZW50IG9uY2UgdGhlcmUgaXMgbm8gY2hhbmdlIHdpdGhpbiAyIHNlY29uZHNcbiAgLy9cbiAgZnVuY3Rpb24gbWFya0FzQ2hhbmdlZCh0eXBlLCBpZCwgb2JqZWN0LCBvcHRpb25zKSB7XG4gICAgdmFyIGtleTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGtleSA9ICcnICsgdHlwZSArICcvJyArIGlkO1xuXG4gICAgZGlydHlba2V5XSA9IG9iamVjdDtcbiAgICBzYXZlRGlydHlJZHMoKTtcblxuICAgIGlmIChvcHRpb25zLnNpbGVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyaWdnZXJEaXJ0eUFuZElkbGVFdmVudHMoKTtcbiAgfVxuXG4gIC8vIENsZWFyIGNoYW5nZWRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmVtb3ZlcyBhbiBvYmplY3QgZnJvbSB0aGUgbGlzdCBvZiBvYmplY3RzIHRoYXQgYXJlIGZsYWdnZWQgdG8gYnkgc3luY2hlZCAoZGlydHkpXG4gIC8vIGFuZCB0cmlnZ2VycyBhIGBzdG9yZTpkaXJ0eWAgZXZlbnRcbiAgZnVuY3Rpb24gY2xlYXJDaGFuZ2VkKHR5cGUsIGlkKSB7XG4gICAgdmFyIGtleTtcbiAgICBpZiAodHlwZSAmJiBpZCkge1xuICAgICAga2V5ID0gJycgKyB0eXBlICsgJy8nICsgaWQ7XG4gICAgICBkZWxldGUgZGlydHlba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGlydHkgPSB7fTtcbiAgICB9XG4gICAgc2F2ZURpcnR5SWRzKCk7XG4gICAgcmV0dXJuIGdsb2JhbC5jbGVhclRpbWVvdXQoZGlydHlUaW1lb3V0KTtcbiAgfVxuXG5cbiAgLy8gTWFyayBhbGwgYXMgY2hhbmdlZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBNYXJrcyBhbGwgbG9jYWwgb2JqZWN0IGFzIGNoYW5nZWQgKGRpcnR5KSB0byBtYWtlIHRoZW0gc3luY1xuICAvLyB3aXRoIHJlbW90ZVxuICBmdW5jdGlvbiBtYXJrQWxsQXNDaGFuZ2VkKCkge1xuICAgIHJldHVybiBzdG9yZS5maW5kQWxsKCkucGlwZShmdW5jdGlvbihvYmplY3RzKSB7XG4gICAgICB2YXIga2V5LCBvYmplY3QsIF9pLCBfbGVuO1xuXG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG9iamVjdHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgb2JqZWN0ID0gb2JqZWN0c1tfaV07XG4gICAgICAgIGtleSA9ICcnICsgb2JqZWN0LnR5cGUgKyAnLycgKyBvYmplY3QuaWQ7XG4gICAgICAgIGRpcnR5W2tleV0gPSBvYmplY3Q7XG4gICAgICB9XG5cbiAgICAgIHNhdmVEaXJ0eUlkcygpO1xuICAgICAgdHJpZ2dlckRpcnR5QW5kSWRsZUV2ZW50cygpO1xuICAgIH0pO1xuICB9XG5cblxuICAvLyB3aGVuIGEgY2hhbmdlIGNvbWUncyBmcm9tIG91ciByZW1vdGUgc3RvcmUsIHdlIGRpZmZlcmVudGlhdGVcbiAgLy8gd2hldGhlciBhbiBvYmplY3QgaGFzIGJlZW4gcmVtb3ZlZCBvciBhZGRlZCAvIHVwZGF0ZWQgYW5kXG4gIC8vIHJlZmxlY3QgdGhlIGNoYW5nZSBpbiBvdXIgbG9jYWwgc3RvcmUuXG4gIGZ1bmN0aW9uIGhhbmRsZVJlbW90ZUNoYW5nZSh0eXBlT2ZDaGFuZ2UsIG9iamVjdCkge1xuICAgIGlmICh0eXBlT2ZDaGFuZ2UgPT09ICdyZW1vdmUnKSB7XG4gICAgICBzdG9yZS5yZW1vdmUob2JqZWN0LnR5cGUsIG9iamVjdC5pZCwge1xuICAgICAgICByZW1vdGU6IHRydWUsXG4gICAgICAgIHVwZGF0ZTogb2JqZWN0XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RvcmUuc2F2ZShvYmplY3QudHlwZSwgb2JqZWN0LmlkLCBvYmplY3QsIHtcbiAgICAgICAgcmVtb3RlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuXG4gIC8vXG4gIC8vIGFsbCBsb2NhbCBjaGFuZ2VzIGdldCBidWxrIHB1c2hlZC4gRm9yIGVhY2ggb2JqZWN0IHdpdGggbG9jYWxcbiAgLy8gY2hhbmdlcyB0aGF0IGhhcyBiZWVuIHB1c2hlZCB3ZSB0cmlnZ2VyIGEgc3luYyBldmVudFxuICBmdW5jdGlvbiBoYW5kbGVQdXNoZWRPYmplY3Qob2JqZWN0KSB7XG4gICAgdHJpZ2dlckV2ZW50cygnc3luYycsIG9iamVjdCk7XG4gIH1cblxuXG4gIC8vIG1vcmUgYWR2YW5jZWQgbG9jYWxTdG9yYWdlIHdyYXBwZXJzIHRvIGZpbmQvc2F2ZSBvYmplY3RzXG4gIGZ1bmN0aW9uIHNldE9iamVjdCh0eXBlLCBpZCwgb2JqZWN0KSB7XG4gICAgdmFyIGtleSwgc3RvcmU7XG5cbiAgICBrZXkgPSAnJyArIHR5cGUgKyAnLycgKyBpZDtcbiAgICBzdG9yZSA9IGV4dGVuZCh7fSwgb2JqZWN0KTtcblxuICAgIGRlbGV0ZSBzdG9yZS50eXBlO1xuICAgIGRlbGV0ZSBzdG9yZS5pZDtcbiAgICByZXR1cm4gZGIuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KHN0b3JlKSk7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0T2JqZWN0KHR5cGUsIGlkKSB7XG4gICAgdmFyIGtleSwgb2JqO1xuXG4gICAga2V5ID0gJycgKyB0eXBlICsgJy8nICsgaWQ7XG4gICAgdmFyIGpzb24gPSBkYi5nZXRJdGVtKGtleSk7XG5cbiAgICBpZiAoanNvbikge1xuICAgICAgb2JqID0gSlNPTi5wYXJzZShqc29uKTtcbiAgICAgIG9iai50eXBlID0gdHlwZTtcbiAgICAgIG9iai5pZCA9IGlkO1xuICAgICAgcmV0dXJuIG9iajtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gc3RvcmUgSURzIG9mIGRpcnR5IG9iamVjdHNcbiAgZnVuY3Rpb24gc2F2ZURpcnR5SWRzKCkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoJC5pc0VtcHR5T2JqZWN0KGRpcnR5KSkge1xuICAgICAgICBkYi5yZW1vdmVJdGVtKCdfZGlydHknKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpZHMgPSBPYmplY3Qua2V5cyhkaXJ0eSk7XG4gICAgICAgIGRiLnNldEl0ZW0oJ19kaXJ0eScsIGlkcy5qb2luKCcsJykpO1xuICAgICAgfVxuICAgIH0gY2F0Y2goZSkge31cbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIG5vdygpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkobmV3IERhdGUoKSkucmVwbGFjZSgvWydcIl0vZywgJycpO1xuICB9XG5cblxuICAvLyBhIHNlbWFudGljIGtleSBjb25zaXN0cyBvZiBhIHZhbGlkIHR5cGUgJiBpZCwgc2VwYXJhdGVkIGJ5IGEgXCIvXCJcbiAgdmFyIHNlbWFudGljSWRQYXR0ZXJuID0gbmV3IFJlZ0V4cCgvXlthLXokXVthLXowLTldK1xcL1thLXowLTldKyQvKTtcbiAgZnVuY3Rpb24gaXNTZW1hbnRpY0tleShrZXkpIHtcbiAgICByZXR1cm4gc2VtYW50aWNJZFBhdHRlcm4udGVzdChrZXkpO1xuICB9XG5cbiAgLy8gYGhhc0xvY2FsQ2hhbmdlc2AgcmV0dXJucyB0cnVlIGlmIHRoZXJlIGlzIGEgbG9jYWwgY2hhbmdlIHRoYXRcbiAgLy8gaGFzIG5vdCBiZWVuIHN5bmMnZCB5ZXQuXG4gIGZ1bmN0aW9uIGhhc0xvY2FsQ2hhbmdlcyhvYmplY3QpIHtcbiAgICBpZiAoIW9iamVjdC51cGRhdGVkQXQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFvYmplY3QuX3N5bmNlZEF0KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdC5fc3luY2VkQXQgPCBvYmplY3QudXBkYXRlZEF0O1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gaXNNYXJrZWRBc0RlbGV0ZWQob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdC5fZGVsZXRlZCA9PT0gdHJ1ZTtcbiAgfVxuXG4gIC8vIHRoaXMgaXMgd2hlcmUgYWxsIHRoZSBzdG9yZSBldmVudHMgZ2V0IHRyaWdnZXJlZCxcbiAgLy8gbGlrZSBhZGQ6dGFzaywgY2hhbmdlOm5vdGU6YWJjNDU2NywgcmVtb3ZlLCBldGMuXG4gIGZ1bmN0aW9uIHRyaWdnZXJFdmVudHMoZXZlbnROYW1lLCBvYmplY3QsIG9wdGlvbnMpIHtcbiAgICBzdG9yZS50cmlnZ2VyKGV2ZW50TmFtZSwgZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcbiAgICBzdG9yZS50cmlnZ2VyKG9iamVjdC50eXBlICsgJzonICsgZXZlbnROYW1lLCBleHRlbmQodHJ1ZSwge30sIG9iamVjdCksIG9wdGlvbnMpO1xuXG4gICAgLy8gREVQUkVDQVRFRFxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE0NlxuICAgIHN0b3JlLnRyaWdnZXIoZXZlbnROYW1lICsgJzonICsgb2JqZWN0LnR5cGUsIGV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cbiAgICBpZiAoZXZlbnROYW1lICE9PSAnbmV3Jykge1xuICAgICAgc3RvcmUudHJpZ2dlciggb2JqZWN0LnR5cGUgKyAnOicgKyBvYmplY3QuaWQrICc6JyArIGV2ZW50TmFtZSwgZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcblxuICAgICAgLy8gREVQUkVDQVRFRFxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hvb2RpZWhxL2hvb2RpZS5qcy9pc3N1ZXMvMTQ2XG4gICAgICBzdG9yZS50cmlnZ2VyKCBldmVudE5hbWUgKyAnOicgKyBvYmplY3QudHlwZSArICc6JyArIG9iamVjdC5pZCwgZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcbiAgICB9XG5cblxuXG4gICAgLy8gc3luYyBldmVudHMgaGF2ZSBubyBjaGFuZ2VzLCBzbyB3ZSBkb24ndCB0cmlnZ2VyXG4gICAgLy8gXCJjaGFuZ2VcIiBldmVudHMuXG4gICAgaWYgKGV2ZW50TmFtZSA9PT0gJ3N5bmMnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3RvcmUudHJpZ2dlcignY2hhbmdlJywgZXZlbnROYW1lLCBleHRlbmQodHJ1ZSwge30sIG9iamVjdCksIG9wdGlvbnMpO1xuICAgIHN0b3JlLnRyaWdnZXIob2JqZWN0LnR5cGUgKyAnOmNoYW5nZScsIGV2ZW50TmFtZSwgZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcblxuICAgIC8vIERFUFJFQ0FURURcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vaG9vZGllaHEvaG9vZGllLmpzL2lzc3Vlcy8xNDZcbiAgICBzdG9yZS50cmlnZ2VyKCdjaGFuZ2U6JyArIG9iamVjdC50eXBlLCBldmVudE5hbWUsIGV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cblxuICAgIGlmIChldmVudE5hbWUgIT09ICduZXcnKSB7XG4gICAgICBzdG9yZS50cmlnZ2VyKG9iamVjdC50eXBlICsgJzonICsgb2JqZWN0LmlkICsgJzpjaGFuZ2UnLCBldmVudE5hbWUsIGV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cbiAgICAgIC8vIERFUFJFQ0FURURcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE0NlxuICAgICAgc3RvcmUudHJpZ2dlcignY2hhbmdlOicgKyBvYmplY3QudHlwZSArICc6JyArIG9iamVjdC5pZCwgZXZlbnROYW1lLCBleHRlbmQodHJ1ZSwge30sIG9iamVjdCksIG9wdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIC8vIHdoZW4gYW4gb2JqZWN0IGdldHMgY2hhbmdlZCwgdHdvIHNwZWNpYWwgZXZlbnRzIGdldCB0cmlnZ2VyZDpcbiAgLy9cbiAgLy8gMS4gZGlydHkgZXZlbnRcbiAgLy8gICAgdGhlIGBkaXJ0eWAgZXZlbnQgZ2V0cyB0cmlnZ2VyZWQgaW1tZWRpYXRlbHksIGZvciBldmVyeVxuICAvLyAgICBjaGFuZ2UgdGhhdCBoYXBwZW5zLlxuICAvLyAyLiBpZGxlIGV2ZW50XG4gIC8vICAgIHRoZSBgaWRsZWAgZXZlbnQgZ2V0cyB0cmlnZ2VyZWQgYWZ0ZXIgYSBzaG9ydCB0aW1lb3V0IG9mXG4gIC8vICAgIG5vIGNoYW5nZXMsIGUuZy4gMiBzZWNvbmRzLlxuICB2YXIgZGlydHlUaW1lb3V0O1xuICBmdW5jdGlvbiB0cmlnZ2VyRGlydHlBbmRJZGxlRXZlbnRzKCkge1xuICAgIHN0b3JlLnRyaWdnZXIoJ2RpcnR5Jyk7XG4gICAgZ2xvYmFsLmNsZWFyVGltZW91dChkaXJ0eVRpbWVvdXQpO1xuXG4gICAgZGlydHlUaW1lb3V0ID0gZ2xvYmFsLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBzdG9yZS50cmlnZ2VyKCdpZGxlJywgc3RvcmUuY2hhbmdlZE9iamVjdHMoKSk7XG4gICAgfSwgaWRsZVRpbWVvdXQpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gc3RhcnRCb290c3RyYXBwaW5nTW9kZSgpIHtcbiAgICBib290c3RyYXBwaW5nID0gdHJ1ZTtcbiAgICBzdG9yZS50cmlnZ2VyKCdib290c3RyYXA6c3RhcnQnKTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGVuZEJvb3RzdHJhcHBpbmdNb2RlKCkge1xuICAgIHZhciBtZXRob2RDYWxsLCBtZXRob2QsIGFyZ3MsIGRlZmVyO1xuXG4gICAgYm9vdHN0cmFwcGluZyA9IGZhbHNlO1xuICAgIHdoaWxlKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgIG1ldGhvZENhbGwgPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgbWV0aG9kID0gbWV0aG9kQ2FsbFswXTtcbiAgICAgIGFyZ3MgPSBtZXRob2RDYWxsWzFdO1xuICAgICAgZGVmZXIgPSBtZXRob2RDYWxsWzJdO1xuICAgICAgbG9jYWxTdG9yZVttZXRob2RdLmFwcGx5KGxvY2FsU3RvcmUsIGFyZ3MpLnRoZW4oZGVmZXIucmVzb2x2ZSwgZGVmZXIucmVqZWN0KTtcbiAgICB9XG5cbiAgICBzdG9yZS50cmlnZ2VyKCdib290c3RyYXA6ZW5kJyk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBlbnF1ZXVlKG1ldGhvZCwgYXJncykge1xuICAgIHZhciBkZWZlciA9IGhvb2RpZS5kZWZlcigpO1xuICAgIHF1ZXVlLnB1c2goW21ldGhvZCwgYXJncywgZGVmZXJdKTtcbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICB9XG5cbiAgLy9cbiAgLy8gcGF0Y2hJZk5vdFBlcnNpc3RhbnRcbiAgLy9cbiAgZnVuY3Rpb24gcGF0Y2hJZk5vdFBlcnNpc3RhbnQgKCkge1xuICAgIGlmICghc3RvcmUuaXNQZXJzaXN0ZW50KCkpIHtcbiAgICAgIGRiID0ge1xuICAgICAgICBnZXRJdGVtOiBmdW5jdGlvbigpIHsgcmV0dXJuIG51bGw7IH0sXG4gICAgICAgIHNldEl0ZW06IGZ1bmN0aW9uKCkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgICAgcmVtb3ZlSXRlbTogZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9LFxuICAgICAgICBrZXk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbnVsbDsgfSxcbiAgICAgICAgbGVuZ3RoOiBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH1cbiAgICAgIH07XG4gICAgfVxuICB9XG5cblxuICAvL1xuICAvLyBpbml0aWFsaXphdGlvblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG4gIC8vXG5cbiAgLy8gaWYgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGxvY2FsIHN0b3JhZ2UgcGVyc2lzdGVuY2UsXG4gIC8vIGUuZy4gU2FmYXJpIGluIHByaXZhdGUgbW9kZSwgb3Zlcml0ZSB0aGUgcmVzcGVjdGl2ZSBtZXRob2RzLlxuXG5cblxuICAvL1xuICAvLyBleHBvc2UgcHVibGljIEFQSVxuICAvL1xuICAvLyBpbmhlcml0IGZyb20gSG9vZGllcyBTdG9yZSBBUElcbiAgaG9vZGllLnN0b3JlID0gc3RvcmU7XG5cbiAgLy8gYWxsb3cgdG8gcnVuIHRoaXMgb25jZSBmcm9tIG91dHNpZGVcbiAgc3RvcmUuYm9vdHN0cmFwRGlydHlPYmplY3RzID0gZnVuY3Rpb24oKSB7XG4gICAgYm9vdHN0cmFwRGlydHlPYmplY3RzKCk7XG4gICAgZGVsZXRlIHN0b3JlLmJvb3RzdHJhcERpcnR5T2JqZWN0cztcbiAgfTtcblxuICAvLyBhbGxvdyB0byBydW4gdGhpcyBvbmNlIGZyb20gb3V0c2lkZVxuICBzdG9yZS5wYXRjaElmTm90UGVyc2lzdGFudCA9IGZ1bmN0aW9uKCkge1xuICAgIHBhdGNoSWZOb3RQZXJzaXN0YW50KCk7XG4gICAgZGVsZXRlIHN0b3JlLnBhdGNoSWZOb3RQZXJzaXN0YW50O1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVN0b3JlO1xuIiwiLy8gT3BlbiBzdG9yZXNcbi8vIC0tLS0tLS0tLS0tLS1cblxudmFyIGhvb2RpZVJlbW90ZVN0b3JlID0gcmVxdWlyZSgnLi9yZW1vdGVfc3RvcmUnKTtcblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ2V4dGVuZCcpO1xuXG5mdW5jdGlvbiBob29kaWVPcGVuKGhvb2RpZSkge1xuXG4gIC8vIGdlbmVyaWMgbWV0aG9kIHRvIG9wZW4gYSBzdG9yZS4gVXNlZCBieVxuICAvL1xuICAvLyAqIGhvb2RpZS5yZW1vdGVcbiAgLy8gKiBob29kaWUudXNlcihcImpvZVwiKVxuICAvLyAqIGhvb2RpZS5nbG9iYWxcbiAgLy8gKiAuLi4gYW5kIG1vcmVcbiAgLy9cbiAgLy8gICAgIGhvb2RpZS5vcGVuKFwic29tZV9zdG9yZV9uYW1lXCIpLmZpbmRBbGwoKVxuICAvL1xuICBmdW5jdGlvbiBvcGVuKHN0b3JlTmFtZSwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgZXh0ZW5kKG9wdGlvbnMsIHtcbiAgICAgIG5hbWU6IHN0b3JlTmFtZVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGhvb2RpZVJlbW90ZVN0b3JlKGhvb2RpZSwgb3B0aW9ucyk7XG4gIH1cblxuICAvL1xuICAvLyBQdWJsaWMgQVBJXG4gIC8vXG4gIGhvb2RpZS5vcGVuID0gb3Blbjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVPcGVuO1xuIiwidmFyIGdsb2JhbD10eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge307Ly8gSG9vZGllIERlZmVycyAvIFByb21pc2VzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gcmV0dXJucyBhIGRlZmVyIG9iamVjdCBmb3IgY3VzdG9tIHByb21pc2UgaGFuZGxpbmdzLlxuLy8gUHJvbWlzZXMgYXJlIGhlYXZlbHkgdXNlZCB0aHJvdWdob3V0IHRoZSBjb2RlIG9mIGhvb2RpZS5cbi8vIFdlIGN1cnJlbnRseSBib3Jyb3cgalF1ZXJ5J3MgaW1wbGVtZW50YXRpb246XG4vLyBodHRwOi8vYXBpLmpxdWVyeS5jb20vY2F0ZWdvcnkvZGVmZXJyZWQtb2JqZWN0L1xuLy9cbi8vICAgICBkZWZlciA9IGhvb2RpZS5kZWZlcigpXG4vLyAgICAgaWYgKGdvb2QpIHtcbi8vICAgICAgIGRlZmVyLnJlc29sdmUoJ2dvb2QuJylcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgZGVmZXIucmVqZWN0KCdub3QgZ29vZC4nKVxuLy8gICAgIH1cbi8vICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpXG4vL1xudmFyIEhvb2RpZUVycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllUHJvbWlzZXMgKGhvb2RpZSkge1xuICB2YXIgJGRlZmVyID0gZ2xvYmFsLmpRdWVyeS5EZWZlcnJlZDtcblxuICAvLyByZXR1cm5zIHRydWUgaWYgcGFzc2VkIG9iamVjdCBpcyBhIHByb21pc2UgKGJ1dCBub3QgYSBkZWZlcnJlZCksXG4gIC8vIG90aGVyd2lzZSBmYWxzZS5cbiAgZnVuY3Rpb24gaXNQcm9taXNlKG9iamVjdCkge1xuICAgIHJldHVybiAhISAob2JqZWN0ICYmXG4gICAgICAgICAgICAgICB0eXBlb2Ygb2JqZWN0LmRvbmUgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgICAgICAgIHR5cGVvZiBvYmplY3QucmVzb2x2ZSAhPT0gJ2Z1bmN0aW9uJyk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiByZXNvbHZlKCkge1xuICAgIHJldHVybiAkZGVmZXIoKS5yZXNvbHZlKCkucHJvbWlzZSgpO1xuICB9XG5cblxuICAvL1xuICBmdW5jdGlvbiByZWplY3QoKSB7XG4gICAgcmV0dXJuICRkZWZlcigpLnJlamVjdCgpLnByb21pc2UoKTtcbiAgfVxuXG5cbiAgLy9cbiAgZnVuY3Rpb24gcmVzb2x2ZVdpdGgoKSB7XG4gICAgdmFyIF9kZWZlciA9ICRkZWZlcigpO1xuICAgIHJldHVybiBfZGVmZXIucmVzb2x2ZS5hcHBseShfZGVmZXIsIGFyZ3VtZW50cykucHJvbWlzZSgpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gcmVqZWN0V2l0aChlcnJvclByb3BlcnRpZXMpIHtcbiAgICB2YXIgX2RlZmVyID0gJGRlZmVyKCk7XG4gICAgdmFyIGVycm9yID0gbmV3IEhvb2RpZUVycm9yKGVycm9yUHJvcGVydGllcyk7XG4gICAgcmV0dXJuIF9kZWZlci5yZWplY3QoZXJyb3IpLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIC8vIFB1YmxpYyBBUElcbiAgLy9cbiAgaG9vZGllLmRlZmVyID0gJGRlZmVyO1xuICBob29kaWUuaXNQcm9taXNlID0gaXNQcm9taXNlO1xuICBob29kaWUucmVzb2x2ZSA9IHJlc29sdmU7XG4gIGhvb2RpZS5yZWplY3QgPSByZWplY3Q7XG4gIGhvb2RpZS5yZXNvbHZlV2l0aCA9IHJlc29sdmVXaXRoO1xuICBob29kaWUucmVqZWN0V2l0aCA9IHJlamVjdFdpdGg7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllUHJvbWlzZXM7XG4iLCJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTsvLyBSZW1vdGVcbi8vID09PT09PT09XG5cbi8vIENvbm5lY3Rpb24gdG8gYSByZW1vdGUgQ291Y2ggRGF0YWJhc2UuXG4vL1xuLy8gc3RvcmUgQVBJXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG4vL1xuLy8gb2JqZWN0IGxvYWRpbmcgLyB1cGRhdGluZyAvIGRlbGV0aW5nXG4vL1xuLy8gKiBmaW5kKHR5cGUsIGlkKVxuLy8gKiBmaW5kQWxsKHR5cGUgKVxuLy8gKiBhZGQodHlwZSwgb2JqZWN0KVxuLy8gKiBzYXZlKHR5cGUsIGlkLCBvYmplY3QpXG4vLyAqIHVwZGF0ZSh0eXBlLCBpZCwgbmV3X3Byb3BlcnRpZXMgKVxuLy8gKiB1cGRhdGVBbGwoIHR5cGUsIG5ld19wcm9wZXJ0aWVzKVxuLy8gKiByZW1vdmUodHlwZSwgaWQpXG4vLyAqIHJlbW92ZUFsbCh0eXBlKVxuLy9cbi8vIGN1c3RvbSByZXF1ZXN0c1xuLy9cbi8vICogcmVxdWVzdCh2aWV3LCBwYXJhbXMpXG4vLyAqIGdldCh2aWV3LCBwYXJhbXMpXG4vLyAqIHBvc3QodmlldywgcGFyYW1zKVxuLy9cbi8vIHN5bmNocm9uaXphdGlvblxuLy9cbi8vICogY29ubmVjdCgpXG4vLyAqIGRpc2Nvbm5lY3QoKVxuLy8gKiBwdWxsKClcbi8vICogcHVzaCgpXG4vLyAqIHN5bmMoKVxuLy9cbi8vIGV2ZW50IGJpbmRpbmdcbi8vXG4vLyAqIG9uKGV2ZW50LCBjYWxsYmFjaylcbi8vXG52YXIgaG9vZGllU3RvcmVBcGkgPSByZXF1aXJlKCcuL3N0b3JlJyk7XG5cbnZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKTtcblxuLy9cbmZ1bmN0aW9uIGhvb2RpZVJlbW90ZVN0b3JlIChob29kaWUsIG9wdGlvbnMpIHtcblxuICB2YXIgcmVtb3RlU3RvcmUgPSB7fTtcblxuXG4gIC8vIFJlbW90ZSBTdG9yZSBQZXJzaXN0YW5jZSBtZXRob2RzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBmaW5kXG4gIC8vIC0tLS0tLVxuXG4gIC8vIGZpbmQgb25lIG9iamVjdFxuICAvL1xuICByZW1vdGVTdG9yZS5maW5kID0gZnVuY3Rpb24gZmluZCh0eXBlLCBpZCkge1xuICAgIHZhciBwYXRoO1xuXG4gICAgcGF0aCA9IHR5cGUgKyAnLycgKyBpZDtcblxuICAgIGlmIChyZW1vdGUucHJlZml4KSB7XG4gICAgICBwYXRoID0gcmVtb3RlLnByZWZpeCArIHBhdGg7XG4gICAgfVxuXG4gICAgcGF0aCA9ICcvJyArIGVuY29kZVVSSUNvbXBvbmVudChwYXRoKTtcblxuICAgIHJldHVybiByZW1vdGUucmVxdWVzdCgnR0VUJywgcGF0aCkudGhlbihwYXJzZUZyb21SZW1vdGUpO1xuICB9O1xuXG5cbiAgLy8gZmluZEFsbFxuICAvLyAtLS0tLS0tLS1cblxuICAvLyBmaW5kIGFsbCBvYmplY3RzLCBjYW4gYmUgZmlsZXRlcmVkIGJ5IGEgdHlwZVxuICAvL1xuICByZW1vdGVTdG9yZS5maW5kQWxsID0gZnVuY3Rpb24gZmluZEFsbCh0eXBlKSB7XG4gICAgdmFyIGVuZGtleSwgcGF0aCwgc3RhcnRrZXk7XG5cbiAgICBwYXRoID0gJy9fYWxsX2RvY3M/aW5jbHVkZV9kb2NzPXRydWUnO1xuXG4gICAgc3dpdGNoICh0cnVlKSB7XG4gICAgY2FzZSAodHlwZSAhPT0gdW5kZWZpbmVkKSAmJiByZW1vdGUucHJlZml4ICE9PSAnJzpcbiAgICAgIHN0YXJ0a2V5ID0gcmVtb3RlLnByZWZpeCArIHR5cGUgKyAnLyc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIHR5cGUgIT09IHVuZGVmaW5lZDpcbiAgICAgIHN0YXJ0a2V5ID0gdHlwZSArICcvJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgcmVtb3RlLnByZWZpeCAhPT0gJyc6XG4gICAgICBzdGFydGtleSA9IHJlbW90ZS5wcmVmaXg7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgc3RhcnRrZXkgPSAnJztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnRrZXkpIHtcblxuICAgICAgLy8gbWFrZSBzdXJlIHRoYXQgb25seSBvYmplY3RzIHN0YXJ0aW5nIHdpdGhcbiAgICAgIC8vIGBzdGFydGtleWAgd2lsbCBiZSByZXR1cm5lZFxuICAgICAgZW5ka2V5ID0gc3RhcnRrZXkucmVwbGFjZSgvLiQvLCBmdW5jdGlvbihjaGFycykge1xuICAgICAgICB2YXIgY2hhckNvZGU7XG4gICAgICAgIGNoYXJDb2RlID0gY2hhcnMuY2hhckNvZGVBdCgwKTtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY2hhckNvZGUgKyAxKTtcbiAgICAgIH0pO1xuICAgICAgcGF0aCA9ICcnICsgcGF0aCArICcmc3RhcnRrZXk9XCInICsgKGVuY29kZVVSSUNvbXBvbmVudChzdGFydGtleSkpICsgJ1wiJmVuZGtleT1cIicgKyAoZW5jb2RlVVJJQ29tcG9uZW50KGVuZGtleSkpICsgJ1wiJztcbiAgICB9XG5cbiAgICByZXR1cm4gcmVtb3RlLnJlcXVlc3QoJ0dFVCcsIHBhdGgpLnRoZW4obWFwRG9jc0Zyb21GaW5kQWxsKS50aGVuKHBhcnNlQWxsRnJvbVJlbW90ZSk7XG4gIH07XG5cblxuICAvLyBzYXZlXG4gIC8vIC0tLS0tLVxuXG4gIC8vIHNhdmUgYSBuZXcgb2JqZWN0LiBJZiBpdCBleGlzdGVkIGJlZm9yZSwgYWxsIHByb3BlcnRpZXNcbiAgLy8gd2lsbCBiZSBvdmVyd3JpdHRlblxuICAvL1xuICByZW1vdGVTdG9yZS5zYXZlID0gZnVuY3Rpb24gc2F2ZShvYmplY3QpIHtcbiAgICB2YXIgcGF0aDtcblxuICAgIGlmICghb2JqZWN0LmlkKSB7XG4gICAgICBvYmplY3QuaWQgPSBob29kaWUuZ2VuZXJhdGVJZCgpO1xuICAgIH1cblxuICAgIG9iamVjdCA9IHBhcnNlRm9yUmVtb3RlKG9iamVjdCk7XG4gICAgcGF0aCA9ICcvJyArIGVuY29kZVVSSUNvbXBvbmVudChvYmplY3QuX2lkKTtcbiAgICByZXR1cm4gcmVtb3RlLnJlcXVlc3QoJ1BVVCcsIHBhdGgsIHtcbiAgICAgIGRhdGE6IG9iamVjdFxuICAgIH0pO1xuICB9O1xuXG5cbiAgLy8gcmVtb3ZlXG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHJlbW92ZSBvbmUgb2JqZWN0XG4gIC8vXG4gIHJlbW90ZVN0b3JlLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZSh0eXBlLCBpZCkge1xuICAgIHJldHVybiByZW1vdGUudXBkYXRlKHR5cGUsIGlkLCB7XG4gICAgICBfZGVsZXRlZDogdHJ1ZVxuICAgIH0pO1xuICB9O1xuXG5cbiAgLy8gcmVtb3ZlQWxsXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIHJlbW92ZSBhbGwgb2JqZWN0cywgY2FuIGJlIGZpbHRlcmVkIGJ5IHR5cGVcbiAgLy9cbiAgcmVtb3RlU3RvcmUucmVtb3ZlQWxsID0gZnVuY3Rpb24gcmVtb3ZlQWxsKHR5cGUpIHtcbiAgICByZXR1cm4gcmVtb3RlLnVwZGF0ZUFsbCh0eXBlLCB7XG4gICAgICBfZGVsZXRlZDogdHJ1ZVxuICAgIH0pO1xuICB9O1xuXG5cbiAgdmFyIHJlbW90ZSA9IGhvb2RpZVN0b3JlQXBpKGhvb2RpZSwge1xuXG4gICAgbmFtZTogb3B0aW9ucy5uYW1lLFxuXG4gICAgYmFja2VuZDoge1xuICAgICAgc2F2ZTogcmVtb3RlU3RvcmUuc2F2ZSxcbiAgICAgIGZpbmQ6IHJlbW90ZVN0b3JlLmZpbmQsXG4gICAgICBmaW5kQWxsOiByZW1vdGVTdG9yZS5maW5kQWxsLFxuICAgICAgcmVtb3ZlOiByZW1vdGVTdG9yZS5yZW1vdmUsXG4gICAgICByZW1vdmVBbGw6IHJlbW90ZVN0b3JlLnJlbW92ZUFsbFxuICAgIH1cbiAgfSk7XG5cblxuXG5cblxuICAvLyBwcm9wZXJ0aWVzXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIG5hbWVcblxuICAvLyB0aGUgbmFtZSBvZiB0aGUgUmVtb3RlIGlzIHRoZSBuYW1lIG9mIHRoZVxuICAvLyBDb3VjaERCIGRhdGFiYXNlIGFuZCBpcyBhbHNvIHVzZWQgdG8gcHJlZml4XG4gIC8vIHRyaWdnZXJlZCBldmVudHNcbiAgLy9cbiAgdmFyIHJlbW90ZU5hbWUgPSBudWxsO1xuXG5cbiAgLy8gc3luY1xuXG4gIC8vIGlmIHNldCB0byB0cnVlLCB1cGRhdGVzIHdpbGwgYmUgY29udGludW91c2x5IHB1bGxlZFxuICAvLyBhbmQgcHVzaGVkLiBBbHRlcm5hdGl2ZWx5LCBgc3luY2AgY2FuIGJlIHNldCB0b1xuICAvLyBgcHVsbDogdHJ1ZWAgb3IgYHB1c2g6IHRydWVgLlxuICAvL1xuICByZW1vdGUuY29ubmVjdGVkID0gZmFsc2U7XG5cblxuICAvLyBwcmVmaXhcblxuICAvLyBwcmVmaXggZm9yIGRvY3MgaW4gYSBDb3VjaERCIGRhdGFiYXNlLCBlLmcuIGFsbCBkb2NzXG4gIC8vIGluIHB1YmxpYyB1c2VyIHN0b3JlcyBhcmUgcHJlZml4ZWQgYnkgJyRwdWJsaWMvJ1xuICAvL1xuICByZW1vdGUucHJlZml4ID0gJyc7XG4gIHZhciByZW1vdGVQcmVmaXhQYXR0ZXJuID0gbmV3IFJlZ0V4cCgnXicpO1xuXG5cbiAgLy8gZGVmYXVsdHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vXG4gIGlmIChvcHRpb25zLm5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgIHJlbW90ZU5hbWUgPSBvcHRpb25zLm5hbWU7XG4gIH1cblxuICBpZiAob3B0aW9ucy5wcmVmaXggIT09IHVuZGVmaW5lZCkge1xuICAgIHJlbW90ZS5wcmVmaXggPSBvcHRpb25zLnByZWZpeDtcbiAgICByZW1vdGVQcmVmaXhQYXR0ZXJuID0gbmV3IFJlZ0V4cCgnXicgKyByZW1vdGUucHJlZml4KTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmJhc2VVcmwgIT09IG51bGwpIHtcbiAgICByZW1vdGUuYmFzZVVybCA9IG9wdGlvbnMuYmFzZVVybDtcbiAgfVxuXG5cbiAgLy8gcmVxdWVzdFxuICAvLyAtLS0tLS0tLS1cblxuICAvLyB3cmFwcGVyIGZvciBob29kaWUucmVxdWVzdCwgd2l0aCBzb21lIHN0b3JlIHNwZWNpZmljIGRlZmF1bHRzXG4gIC8vIGFuZCBhIHByZWZpeGVkIHBhdGhcbiAgLy9cbiAgcmVtb3RlLnJlcXVlc3QgPSBmdW5jdGlvbiByZXF1ZXN0KHR5cGUsIHBhdGgsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIGlmIChyZW1vdGVOYW1lKSB7XG4gICAgICBwYXRoID0gJy8nICsgKGVuY29kZVVSSUNvbXBvbmVudChyZW1vdGVOYW1lKSkgKyBwYXRoO1xuICAgIH1cblxuICAgIGlmIChyZW1vdGUuYmFzZVVybCkge1xuICAgICAgcGF0aCA9ICcnICsgcmVtb3RlLmJhc2VVcmwgKyBwYXRoO1xuICAgIH1cblxuICAgIG9wdGlvbnMuY29udGVudFR5cGUgPSBvcHRpb25zLmNvbnRlbnRUeXBlIHx8ICdhcHBsaWNhdGlvbi9qc29uJztcblxuICAgIGlmICh0eXBlID09PSAnUE9TVCcgfHwgdHlwZSA9PT0gJ1BVVCcpIHtcbiAgICAgIG9wdGlvbnMuZGF0YVR5cGUgPSBvcHRpb25zLmRhdGFUeXBlIHx8ICdqc29uJztcbiAgICAgIG9wdGlvbnMucHJvY2Vzc0RhdGEgPSBvcHRpb25zLnByb2Nlc3NEYXRhIHx8IGZhbHNlO1xuICAgICAgb3B0aW9ucy5kYXRhID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5kYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIGhvb2RpZS5yZXF1ZXN0KHR5cGUsIHBhdGgsIG9wdGlvbnMpO1xuICB9O1xuXG5cbiAgLy8gaXNLbm93bk9iamVjdFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBkZXRlcm1pbmUgYmV0d2VlbiBhIGtub3duIGFuZCBhIG5ldyBvYmplY3RcbiAgLy9cbiAgcmVtb3RlLmlzS25vd25PYmplY3QgPSBmdW5jdGlvbiBpc0tub3duT2JqZWN0KG9iamVjdCkge1xuICAgIHZhciBrZXkgPSAnJyArIG9iamVjdC50eXBlICsgJy8nICsgb2JqZWN0LmlkO1xuXG4gICAgaWYgKGtub3duT2JqZWN0c1trZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBrbm93bk9iamVjdHNba2V5XTtcbiAgICB9XG4gIH07XG5cblxuICAvLyBtYXJrQXNLbm93bk9iamVjdFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gZGV0ZXJtaW5lIGJldHdlZW4gYSBrbm93biBhbmQgYSBuZXcgb2JqZWN0XG4gIC8vXG4gIHJlbW90ZS5tYXJrQXNLbm93bk9iamVjdCA9IGZ1bmN0aW9uIG1hcmtBc0tub3duT2JqZWN0KG9iamVjdCkge1xuICAgIHZhciBrZXkgPSAnJyArIG9iamVjdC50eXBlICsgJy8nICsgb2JqZWN0LmlkO1xuICAgIGtub3duT2JqZWN0c1trZXldID0gMTtcbiAgICByZXR1cm4ga25vd25PYmplY3RzW2tleV07XG4gIH07XG5cblxuICAvLyBzeW5jaHJvbml6YXRpb25cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBDb25uZWN0XG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHN0YXJ0IHN5bmNpbmcuIGByZW1vdGUuYm9vdHN0cmFwKClgIHdpbGwgYXV0b21hdGljYWxseSBzdGFydFxuICAvLyBwdWxsaW5nIHdoZW4gYHJlbW90ZS5jb25uZWN0ZWRgIHJlbWFpbnMgdHJ1ZS5cbiAgLy9cbiAgcmVtb3RlLmNvbm5lY3QgPSBmdW5jdGlvbiBjb25uZWN0KG5hbWUpIHtcbiAgICBpZiAobmFtZSkge1xuICAgICAgcmVtb3RlTmFtZSA9IG5hbWU7XG4gICAgfVxuICAgIHJlbW90ZS5jb25uZWN0ZWQgPSB0cnVlO1xuICAgIHJlbW90ZS50cmlnZ2VyKCdjb25uZWN0Jyk7XG4gICAgcmV0dXJuIHJlbW90ZS5ib290c3RyYXAoKS50aGVuKCBmdW5jdGlvbigpIHsgcmVtb3RlLnB1c2goKTsgfSApO1xuICB9O1xuXG5cbiAgLy8gRGlzY29ubmVjdFxuICAvLyAtLS0tLS0tLS0tLS1cblxuICAvLyBzdG9wIHN5bmNpbmcgY2hhbmdlcyBmcm9tIHJlbW90ZSBzdG9yZVxuICAvL1xuICByZW1vdGUuZGlzY29ubmVjdCA9IGZ1bmN0aW9uIGRpc2Nvbm5lY3QoKSB7XG4gICAgcmVtb3RlLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHJlbW90ZS50cmlnZ2VyKCdkaXNjb25uZWN0Jyk7IC8vIFRPRE86IHNwZWMgdGhhdFxuXG4gICAgaWYgKHB1bGxSZXF1ZXN0KSB7XG4gICAgICBwdWxsUmVxdWVzdC5hYm9ydCgpO1xuICAgIH1cblxuICAgIGlmIChwdXNoUmVxdWVzdCkge1xuICAgICAgcHVzaFJlcXVlc3QuYWJvcnQoKTtcbiAgICB9XG5cbiAgfTtcblxuXG4gIC8vIGlzQ29ubmVjdGVkXG4gIC8vIC0tLS0tLS0tLS0tLS1cblxuICAvL1xuICByZW1vdGUuaXNDb25uZWN0ZWQgPSBmdW5jdGlvbiBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gcmVtb3RlLmNvbm5lY3RlZDtcbiAgfTtcblxuXG4gIC8vIGdldFNpbmNlTnJcbiAgLy8gLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmV0dXJucyB0aGUgc2VxdWVuY2UgbnVtYmVyIGZyb20gd2ljaCB0byBzdGFydCB0byBmaW5kIGNoYW5nZXMgaW4gcHVsbFxuICAvL1xuICB2YXIgc2luY2UgPSBvcHRpb25zLnNpbmNlIHx8IDA7IC8vIFRPRE86IHNwZWMgdGhhdCFcbiAgcmVtb3RlLmdldFNpbmNlTnIgPSBmdW5jdGlvbiBnZXRTaW5jZU5yKCkge1xuICAgIGlmICh0eXBlb2Ygc2luY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBzaW5jZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBzaW5jZTtcbiAgfTtcblxuXG4gIC8vIGJvb3RzdHJhcFxuICAvLyAtLS0tLS0tLS0tLVxuXG4gIC8vIGluaXRhbCBwdWxsIG9mIGRhdGEgb2YgdGhlIHJlbW90ZSBzdG9yZS4gQnkgZGVmYXVsdCwgd2UgcHVsbCBhbGxcbiAgLy8gY2hhbmdlcyBzaW5jZSB0aGUgYmVnaW5uaW5nLCBidXQgdGhpcyBiZWhhdmlvciBtaWdodCBiZSBhZGp1c3RlZCxcbiAgLy8gZS5nIGZvciBhIGZpbHRlcmVkIGJvb3RzdHJhcC5cbiAgLy9cbiAgdmFyIGlzQm9vdHN0cmFwcGluZyA9IGZhbHNlO1xuICByZW1vdGUuYm9vdHN0cmFwID0gZnVuY3Rpb24gYm9vdHN0cmFwKCkge1xuICAgIGlzQm9vdHN0cmFwcGluZyA9IHRydWU7XG4gICAgcmVtb3RlLnRyaWdnZXIoJ2Jvb3RzdHJhcDpzdGFydCcpO1xuICAgIHJldHVybiByZW1vdGUucHVsbCgpLmRvbmUoIGhhbmRsZUJvb3RzdHJhcFN1Y2Nlc3MgKTtcbiAgfTtcblxuXG4gIC8vIHB1bGwgY2hhbmdlc1xuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGEuay5hLiBtYWtlIGEgR0VUIHJlcXVlc3QgdG8gQ291Y2hEQidzIGBfY2hhbmdlc2AgZmVlZC5cbiAgLy8gV2UgY3VycmVudGx5IG1ha2UgbG9uZyBwb2xsIHJlcXVlc3RzLCB0aGF0IHdlIG1hbnVhbGx5IGFib3J0XG4gIC8vIGFuZCByZXN0YXJ0IGVhY2ggMjUgc2Vjb25kcy5cbiAgLy9cbiAgdmFyIHB1bGxSZXF1ZXN0LCBwdWxsUmVxdWVzdFRpbWVvdXQ7XG4gIHJlbW90ZS5wdWxsID0gZnVuY3Rpb24gcHVsbCgpIHtcbiAgICBwdWxsUmVxdWVzdCA9IHJlbW90ZS5yZXF1ZXN0KCdHRVQnLCBwdWxsVXJsKCkpO1xuXG4gICAgaWYgKHJlbW90ZS5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgICBnbG9iYWwuY2xlYXJUaW1lb3V0KHB1bGxSZXF1ZXN0VGltZW91dCk7XG4gICAgICBwdWxsUmVxdWVzdFRpbWVvdXQgPSBnbG9iYWwuc2V0VGltZW91dChyZXN0YXJ0UHVsbFJlcXVlc3QsIDI1MDAwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHVsbFJlcXVlc3QuZG9uZShoYW5kbGVQdWxsU3VjY2VzcykuZmFpbChoYW5kbGVQdWxsRXJyb3IpO1xuICB9O1xuXG5cbiAgLy8gcHVzaCBjaGFuZ2VzXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUHVzaCBvYmplY3RzIHRvIHJlbW90ZSBzdG9yZSB1c2luZyB0aGUgYF9idWxrX2RvY3NgIEFQSS5cbiAgLy9cbiAgdmFyIHB1c2hSZXF1ZXN0O1xuICByZW1vdGUucHVzaCA9IGZ1bmN0aW9uIHB1c2gob2JqZWN0cykge1xuICAgIHZhciBvYmplY3QsIG9iamVjdHNGb3JSZW1vdGUsIF9pLCBfbGVuO1xuXG4gICAgaWYgKCEkLmlzQXJyYXkob2JqZWN0cykpIHtcbiAgICAgIG9iamVjdHMgPSBkZWZhdWx0T2JqZWN0c1RvUHVzaCgpO1xuICAgIH1cblxuICAgIGlmIChvYmplY3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlV2l0aChbXSk7XG4gICAgfVxuXG4gICAgb2JqZWN0c0ZvclJlbW90ZSA9IFtdO1xuXG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBvYmplY3RzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG5cbiAgICAgIC8vIGRvbid0IG1lc3Mgd2l0aCBvcmlnaW5hbCBvYmplY3RzXG4gICAgICBvYmplY3QgPSBleHRlbmQodHJ1ZSwge30sIG9iamVjdHNbX2ldKTtcbiAgICAgIGFkZFJldmlzaW9uVG8ob2JqZWN0KTtcbiAgICAgIG9iamVjdCA9IHBhcnNlRm9yUmVtb3RlKG9iamVjdCk7XG4gICAgICBvYmplY3RzRm9yUmVtb3RlLnB1c2gob2JqZWN0KTtcbiAgICB9XG4gICAgcHVzaFJlcXVlc3QgPSByZW1vdGUucmVxdWVzdCgnUE9TVCcsICcvX2J1bGtfZG9jcycsIHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgZG9jczogb2JqZWN0c0ZvclJlbW90ZSxcbiAgICAgICAgbmV3X2VkaXRzOiBmYWxzZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcHVzaFJlcXVlc3QuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICByZW1vdGUudHJpZ2dlcigncHVzaCcsIG9iamVjdHNbaV0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBwdXNoUmVxdWVzdDtcbiAgfTtcblxuICAvLyBzeW5jIGNoYW5nZXNcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBwdXNoIG9iamVjdHMsIHRoZW4gcHVsbCB1cGRhdGVzLlxuICAvL1xuICByZW1vdGUuc3luYyA9IGZ1bmN0aW9uIHN5bmMob2JqZWN0cykge1xuICAgIHJldHVybiByZW1vdGUucHVzaChvYmplY3RzKS50aGVuKHJlbW90ZS5wdWxsKTtcbiAgfTtcblxuICAvL1xuICAvLyBQcml2YXRlXG4gIC8vIC0tLS0tLS0tLVxuICAvL1xuXG4gIC8vIGluIG9yZGVyIHRvIGRpZmZlcmVudGlhdGUgd2hldGhlciBhbiBvYmplY3QgZnJvbSByZW1vdGUgc2hvdWxkIHRyaWdnZXIgYSAnbmV3J1xuICAvLyBvciBhbiAndXBkYXRlJyBldmVudCwgd2Ugc3RvcmUgYSBoYXNoIG9mIGtub3duIG9iamVjdHNcbiAgdmFyIGtub3duT2JqZWN0cyA9IHt9O1xuXG5cbiAgLy8gdmFsaWQgQ291Y2hEQiBkb2MgYXR0cmlidXRlcyBzdGFydGluZyB3aXRoIGFuIHVuZGVyc2NvcmVcbiAgLy9cbiAgdmFyIHZhbGlkU3BlY2lhbEF0dHJpYnV0ZXMgPSBbJ19pZCcsICdfcmV2JywgJ19kZWxldGVkJywgJ19yZXZpc2lvbnMnLCAnX2F0dGFjaG1lbnRzJ107XG5cblxuICAvLyBkZWZhdWx0IG9iamVjdHMgdG8gcHVzaFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHdoZW4gcHVzaGVkIHdpdGhvdXQgcGFzc2luZyBhbnkgb2JqZWN0cywgdGhlIG9iamVjdHMgcmV0dXJuZWQgZnJvbVxuICAvLyB0aGlzIG1ldGhvZCB3aWxsIGJlIHBhc3NlZC4gSXQgY2FuIGJlIG92ZXJ3cml0dGVuIGJ5IHBhc3NpbmcgYW5cbiAgLy8gYXJyYXkgb2Ygb2JqZWN0cyBvciBhIGZ1bmN0aW9uIGFzIGBvcHRpb25zLm9iamVjdHNgXG4gIC8vXG4gIHZhciBkZWZhdWx0T2JqZWN0c1RvUHVzaCA9IGZ1bmN0aW9uIGRlZmF1bHRPYmplY3RzVG9QdXNoKCkge1xuICAgIHJldHVybiBbXTtcbiAgfTtcbiAgaWYgKG9wdGlvbnMuZGVmYXVsdE9iamVjdHNUb1B1c2gpIHtcbiAgICBpZiAoJC5pc0FycmF5KG9wdGlvbnMuZGVmYXVsdE9iamVjdHNUb1B1c2gpKSB7XG4gICAgICBkZWZhdWx0T2JqZWN0c1RvUHVzaCA9IGZ1bmN0aW9uIGRlZmF1bHRPYmplY3RzVG9QdXNoKCkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5kZWZhdWx0T2JqZWN0c1RvUHVzaDtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlZmF1bHRPYmplY3RzVG9QdXNoID0gb3B0aW9ucy5kZWZhdWx0T2JqZWN0c1RvUHVzaDtcbiAgICB9XG4gIH1cblxuXG4gIC8vIHNldFNpbmNlTnJcbiAgLy8gLS0tLS0tLS0tLS0tXG5cbiAgLy8gc2V0cyB0aGUgc2VxdWVuY2UgbnVtYmVyIGZyb20gd2ljaCB0byBzdGFydCB0byBmaW5kIGNoYW5nZXMgaW4gcHVsbC5cbiAgLy8gSWYgcmVtb3RlIHN0b3JlIHdhcyBpbml0aWFsaXplZCB3aXRoIHNpbmNlIDogZnVuY3Rpb24obnIpIHsgLi4uIH0sXG4gIC8vIGNhbGwgdGhlIGZ1bmN0aW9uIHdpdGggdGhlIHNlcSBwYXNzZWQuIE90aGVyd2lzZSBzaW1wbHkgc2V0IHRoZSBzZXFcbiAgLy8gbnVtYmVyIGFuZCByZXR1cm4gaXQuXG4gIC8vXG4gIGZ1bmN0aW9uIHNldFNpbmNlTnIoc2VxKSB7XG4gICAgaWYgKHR5cGVvZiBzaW5jZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHNpbmNlKHNlcSk7XG4gICAgfVxuXG4gICAgc2luY2UgPSBzZXE7XG4gICAgcmV0dXJuIHNpbmNlO1xuICB9XG5cblxuICAvLyBQYXJzZSBmb3IgcmVtb3RlXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHBhcnNlIG9iamVjdCBmb3IgcmVtb3RlIHN0b3JhZ2UuIEFsbCBwcm9wZXJ0aWVzIHN0YXJ0aW5nIHdpdGggYW5cbiAgLy8gYHVuZGVyc2NvcmVgIGRvIG5vdCBnZXQgc3luY2hyb25pemVkIGRlc3BpdGUgdGhlIHNwZWNpYWwgcHJvcGVydGllc1xuICAvLyBgX2lkYCwgYF9yZXZgIGFuZCBgX2RlbGV0ZWRgIChzZWUgYWJvdmUpXG4gIC8vXG4gIC8vIEFsc28gYGlkYCBnZXRzIHJlcGxhY2VkIHdpdGggYF9pZGAgd2hpY2ggY29uc2lzdHMgb2YgdHlwZSAmIGlkXG4gIC8vXG4gIGZ1bmN0aW9uIHBhcnNlRm9yUmVtb3RlKG9iamVjdCkge1xuICAgIHZhciBhdHRyLCBwcm9wZXJ0aWVzO1xuICAgIHByb3BlcnRpZXMgPSBleHRlbmQoe30sIG9iamVjdCk7XG5cbiAgICBmb3IgKGF0dHIgaW4gcHJvcGVydGllcykge1xuICAgICAgaWYgKHByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkoYXR0cikpIHtcbiAgICAgICAgaWYgKHZhbGlkU3BlY2lhbEF0dHJpYnV0ZXMuaW5kZXhPZihhdHRyKSAhPT0gLTEpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIS9eXy8udGVzdChhdHRyKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGRlbGV0ZSBwcm9wZXJ0aWVzW2F0dHJdO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHByZXBhcmUgQ291Y2hEQiBpZFxuICAgIHByb3BlcnRpZXMuX2lkID0gJycgKyBwcm9wZXJ0aWVzLnR5cGUgKyAnLycgKyBwcm9wZXJ0aWVzLmlkO1xuICAgIGlmIChyZW1vdGUucHJlZml4KSB7XG4gICAgICBwcm9wZXJ0aWVzLl9pZCA9ICcnICsgcmVtb3RlLnByZWZpeCArIHByb3BlcnRpZXMuX2lkO1xuICAgIH1cbiAgICBkZWxldGUgcHJvcGVydGllcy5pZDtcbiAgICByZXR1cm4gcHJvcGVydGllcztcbiAgfVxuXG5cbiAgLy8gIyMjIF9wYXJzZUZyb21SZW1vdGVcblxuICAvLyBub3JtYWxpemUgb2JqZWN0cyBjb21pbmcgZnJvbSByZW1vdGVcbiAgLy9cbiAgLy8gcmVuYW1lcyBgX2lkYCBhdHRyaWJ1dGUgdG8gYGlkYCBhbmQgcmVtb3ZlcyB0aGUgdHlwZSBmcm9tIHRoZSBpZCxcbiAgLy8gZS5nLiBgdHlwZS8xMjNgIC0+IGAxMjNgXG4gIC8vXG4gIGZ1bmN0aW9uIHBhcnNlRnJvbVJlbW90ZShvYmplY3QpIHtcbiAgICB2YXIgaWQsIGlnbm9yZSwgX3JlZjtcblxuICAgIC8vIGhhbmRsZSBpZCBhbmQgdHlwZVxuICAgIGlkID0gb2JqZWN0Ll9pZCB8fCBvYmplY3QuaWQ7XG4gICAgZGVsZXRlIG9iamVjdC5faWQ7XG5cbiAgICBpZiAocmVtb3RlLnByZWZpeCkge1xuICAgICAgaWQgPSBpZC5yZXBsYWNlKHJlbW90ZVByZWZpeFBhdHRlcm4sICcnKTtcbiAgICAgIC8vIGlkID0gaWQucmVwbGFjZShuZXcgUmVnRXhwKCdeJyArIHJlbW90ZS5wcmVmaXgpLCAnJyk7XG4gICAgfVxuXG4gICAgLy8gdHVybiBkb2MvMTIzIGludG8gdHlwZSA9IGRvYyAmIGlkID0gMTIzXG4gICAgLy8gTk9URTogd2UgZG9uJ3QgdXNlIGEgc2ltcGxlIGlkLnNwbGl0KC9cXC8vKSBoZXJlLFxuICAgIC8vIGFzIGluIHNvbWUgY2FzZXMgSURzIG1pZ2h0IGNvbnRhaW4gJy8nLCB0b29cbiAgICAvL1xuICAgIF9yZWYgPSBpZC5tYXRjaCgvKFteXFwvXSspXFwvKC4qKS8pLFxuICAgIGlnbm9yZSA9IF9yZWZbMF0sXG4gICAgb2JqZWN0LnR5cGUgPSBfcmVmWzFdLFxuICAgIG9iamVjdC5pZCA9IF9yZWZbMl07XG5cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VBbGxGcm9tUmVtb3RlKG9iamVjdHMpIHtcbiAgICB2YXIgb2JqZWN0LCBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgX3Jlc3VsdHMgPSBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG9iamVjdHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIG9iamVjdCA9IG9iamVjdHNbX2ldO1xuICAgICAgX3Jlc3VsdHMucHVzaChwYXJzZUZyb21SZW1vdGUob2JqZWN0KSk7XG4gICAgfVxuICAgIHJldHVybiBfcmVzdWx0cztcbiAgfVxuXG5cbiAgLy8gIyMjIF9hZGRSZXZpc2lvblRvXG5cbiAgLy8gZXh0ZW5kcyBwYXNzZWQgb2JqZWN0IHdpdGggYSBfcmV2IHByb3BlcnR5XG4gIC8vXG4gIGZ1bmN0aW9uIGFkZFJldmlzaW9uVG8oYXR0cmlidXRlcykge1xuICAgIHZhciBjdXJyZW50UmV2SWQsIGN1cnJlbnRSZXZOciwgbmV3UmV2aXNpb25JZCwgX3JlZjtcbiAgICB0cnkge1xuICAgICAgX3JlZiA9IGF0dHJpYnV0ZXMuX3Jldi5zcGxpdCgvLS8pLFxuICAgICAgY3VycmVudFJldk5yID0gX3JlZlswXSxcbiAgICAgIGN1cnJlbnRSZXZJZCA9IF9yZWZbMV07XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7fVxuICAgIGN1cnJlbnRSZXZOciA9IHBhcnNlSW50KGN1cnJlbnRSZXZOciwgMTApIHx8IDA7XG4gICAgbmV3UmV2aXNpb25JZCA9IGdlbmVyYXRlTmV3UmV2aXNpb25JZCgpO1xuXG4gICAgLy8gbG9jYWwgY2hhbmdlcyBhcmUgbm90IG1lYW50IHRvIGJlIHJlcGxpY2F0ZWQgb3V0c2lkZSBvZiB0aGVcbiAgICAvLyB1c2VycyBkYXRhYmFzZSwgdGhlcmVmb3JlIHRoZSBgLWxvY2FsYCBzdWZmaXguXG4gICAgaWYgKGF0dHJpYnV0ZXMuXyRsb2NhbCkge1xuICAgICAgbmV3UmV2aXNpb25JZCArPSAnLWxvY2FsJztcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVzLl9yZXYgPSAnJyArIChjdXJyZW50UmV2TnIgKyAxKSArICctJyArIG5ld1JldmlzaW9uSWQ7XG4gICAgYXR0cmlidXRlcy5fcmV2aXNpb25zID0ge1xuICAgICAgc3RhcnQ6IDEsXG4gICAgICBpZHM6IFtuZXdSZXZpc2lvbklkXVxuICAgIH07XG5cbiAgICBpZiAoY3VycmVudFJldklkKSB7XG4gICAgICBhdHRyaWJ1dGVzLl9yZXZpc2lvbnMuc3RhcnQgKz0gY3VycmVudFJldk5yO1xuICAgICAgcmV0dXJuIGF0dHJpYnV0ZXMuX3JldmlzaW9ucy5pZHMucHVzaChjdXJyZW50UmV2SWQpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gIyMjIGdlbmVyYXRlIG5ldyByZXZpc2lvbiBpZFxuXG4gIC8vXG4gIGZ1bmN0aW9uIGdlbmVyYXRlTmV3UmV2aXNpb25JZCgpIHtcbiAgICByZXR1cm4gaG9vZGllLmdlbmVyYXRlSWQoOSk7XG4gIH1cblxuXG4gIC8vICMjIyBtYXAgZG9jcyBmcm9tIGZpbmRBbGxcblxuICAvL1xuICBmdW5jdGlvbiBtYXBEb2NzRnJvbUZpbmRBbGwocmVzcG9uc2UpIHtcbiAgICByZXR1cm4gcmVzcG9uc2Uucm93cy5tYXAoZnVuY3Rpb24ocm93KSB7XG4gICAgICByZXR1cm4gcm93LmRvYztcbiAgICB9KTtcbiAgfVxuXG5cbiAgLy8gIyMjIHB1bGwgdXJsXG5cbiAgLy8gRGVwZW5kaW5nIG9uIHdoZXRoZXIgcmVtb3RlIGlzIGNvbm5lY3RlZCAoPSBwdWxsaW5nIGNoYW5nZXMgY29udGludW91c2x5KVxuICAvLyByZXR1cm4gYSBsb25ncG9sbCBVUkwgb3Igbm90LiBJZiBpdCBpcyBhIGJlZ2lubmluZyBib290c3RyYXAgcmVxdWVzdCwgZG9cbiAgLy8gbm90IHJldHVybiBhIGxvbmdwb2xsIFVSTCwgYXMgd2Ugd2FudCBpdCB0byBmaW5pc2ggcmlnaHQgYXdheSwgZXZlbiBpZiB0aGVyZVxuICAvLyBhcmUgbm8gY2hhbmdlcyBvbiByZW1vdGUuXG4gIC8vXG4gIGZ1bmN0aW9uIHB1bGxVcmwoKSB7XG4gICAgdmFyIHNpbmNlO1xuICAgIHNpbmNlID0gcmVtb3RlLmdldFNpbmNlTnIoKTtcbiAgICBpZiAocmVtb3RlLmlzQ29ubmVjdGVkKCkgJiYgIWlzQm9vdHN0cmFwcGluZykge1xuICAgICAgcmV0dXJuICcvX2NoYW5nZXM/aW5jbHVkZV9kb2NzPXRydWUmc2luY2U9JyArIHNpbmNlICsgJyZoZWFydGJlYXQ9MTAwMDAmZmVlZD1sb25ncG9sbCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnL19jaGFuZ2VzP2luY2x1ZGVfZG9jcz10cnVlJnNpbmNlPScgKyBzaW5jZTtcbiAgICB9XG4gIH1cblxuXG4gIC8vICMjIyByZXN0YXJ0IHB1bGwgcmVxdWVzdFxuXG4gIC8vIHJlcXVlc3QgZ2V0cyByZXN0YXJ0ZWQgYXV0b21hdGljY2FsbHlcbiAgLy8gd2hlbiBhYm9ydGVkIChzZWUgaGFuZGxlUHVsbEVycm9yKVxuICBmdW5jdGlvbiByZXN0YXJ0UHVsbFJlcXVlc3QoKSB7XG4gICAgaWYgKHB1bGxSZXF1ZXN0KSB7XG4gICAgICBwdWxsUmVxdWVzdC5hYm9ydCgpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gIyMjIHB1bGwgc3VjY2VzcyBoYW5kbGVyXG5cbiAgLy8gcmVxdWVzdCBnZXRzIHJlc3RhcnRlZCBhdXRvbWF0aWNjYWxseVxuICAvLyB3aGVuIGFib3J0ZWQgKHNlZSBoYW5kbGVQdWxsRXJyb3IpXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZVB1bGxTdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgc2V0U2luY2VOcihyZXNwb25zZS5sYXN0X3NlcSk7XG4gICAgaGFuZGxlUHVsbFJlc3VsdHMocmVzcG9uc2UucmVzdWx0cyk7XG4gICAgaWYgKHJlbW90ZS5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgICByZXR1cm4gcmVtb3RlLnB1bGwoKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vICMjIyBwdWxsIGVycm9yIGhhbmRsZXJcblxuICAvLyB3aGVuIHRoZXJlIGlzIGEgY2hhbmdlLCB0cmlnZ2VyIGV2ZW50LFxuICAvLyB0aGVuIGNoZWNrIGZvciBhbm90aGVyIGNoYW5nZVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVQdWxsRXJyb3IoeGhyLCBlcnJvcikge1xuICAgIGlmICghcmVtb3RlLmlzQ29ubmVjdGVkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHhoci5zdGF0dXMpIHtcbiAgICAgIC8vIFNlc3Npb24gaXMgaW52YWxpZC4gVXNlciBpcyBzdGlsbCBsb2dpbiwgYnV0IG5lZWRzIHRvIHJlYXV0aGVudGljYXRlXG4gICAgICAvLyBiZWZvcmUgc3luYyBjYW4gYmUgY29udGludWVkXG4gICAgY2FzZSA0MDE6XG4gICAgICByZW1vdGUudHJpZ2dlcignZXJyb3I6dW5hdXRoZW50aWNhdGVkJywgZXJyb3IpO1xuICAgICAgcmV0dXJuIHJlbW90ZS5kaXNjb25uZWN0KCk7XG5cbiAgICAgLy8gdGhlIDQwNCBjb21lcywgd2hlbiB0aGUgcmVxdWVzdGVkIERCIGhhcyBiZWVuIHJlbW92ZWRcbiAgICAgLy8gb3IgZG9lcyBub3QgZXhpc3QgeWV0LlxuICAgICAvL1xuICAgICAvLyBCVVQ6IGl0IG1pZ2h0IGFsc28gaGFwcGVuIHRoYXQgdGhlIGJhY2tncm91bmQgd29ya2VycyBkaWRcbiAgICAgLy8gICAgICBub3QgY3JlYXRlIGEgcGVuZGluZyBkYXRhYmFzZSB5ZXQuIFRoZXJlZm9yZSxcbiAgICAgLy8gICAgICB3ZSB0cnkgaXQgYWdhaW4gaW4gMyBzZWNvbmRzXG4gICAgIC8vXG4gICAgIC8vIFRPRE86IHJldmlldyAvIHJldGhpbmsgdGhhdC5cbiAgICAgLy9cblxuICAgIGNhc2UgNDA0OlxuICAgICAgcmV0dXJuIGdsb2JhbC5zZXRUaW1lb3V0KHJlbW90ZS5wdWxsLCAzMDAwKTtcblxuICAgIGNhc2UgNTAwOlxuICAgICAgLy9cbiAgICAgIC8vIFBsZWFzZSBzZXJ2ZXIsIGRvbid0IGdpdmUgdXMgdGhlc2UuIEF0IGxlYXN0IG5vdCBwZXJzaXN0ZW50bHlcbiAgICAgIC8vXG4gICAgICByZW1vdGUudHJpZ2dlcignZXJyb3I6c2VydmVyJywgZXJyb3IpO1xuICAgICAgZ2xvYmFsLnNldFRpbWVvdXQocmVtb3RlLnB1bGwsIDMwMDApO1xuICAgICAgcmV0dXJuIGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICBkZWZhdWx0OlxuICAgICAgLy8gdXN1YWxseSBhIDAsIHdoaWNoIHN0YW5kcyBmb3IgdGltZW91dCBvciBzZXJ2ZXIgbm90IHJlYWNoYWJsZS5cbiAgICAgIGlmICh4aHIuc3RhdHVzVGV4dCA9PT0gJ2Fib3J0Jykge1xuICAgICAgICAvLyBtYW51YWwgYWJvcnQgYWZ0ZXIgMjVzZWMuIHJlc3RhcnQgcHVsbGluZyBjaGFuZ2VzIGRpcmVjdGx5IHdoZW4gY29ubmVjdGVkXG4gICAgICAgIHJldHVybiByZW1vdGUucHVsbCgpO1xuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAvLyBvb3BzLiBUaGlzIG1pZ2h0IGJlIGNhdXNlZCBieSBhbiB1bnJlYWNoYWJsZSBzZXJ2ZXIuXG4gICAgICAgIC8vIE9yIHRoZSBzZXJ2ZXIgY2FuY2VsbGVkIGl0IGZvciB3aGF0IGV2ZXIgcmVhc29uLCBlLmcuXG4gICAgICAgIC8vIGhlcm9rdSBraWxscyB0aGUgcmVxdWVzdCBhZnRlciB+MzBzLlxuICAgICAgICAvLyB3ZSdsbCB0cnkgYWdhaW4gYWZ0ZXIgYSAzcyB0aW1lb3V0XG4gICAgICAgIC8vXG4gICAgICAgIGdsb2JhbC5zZXRUaW1lb3V0KHJlbW90ZS5wdWxsLCAzMDAwKTtcbiAgICAgICAgcmV0dXJuIGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIC8vICMjIyBoYW5kbGUgY2hhbmdlcyBmcm9tIHJlbW90ZVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVCb290c3RyYXBTdWNjZXNzKCkge1xuICAgIGlzQm9vdHN0cmFwcGluZyA9IGZhbHNlO1xuICAgIHJlbW90ZS50cmlnZ2VyKCdib290c3RyYXA6ZW5kJyk7XG4gIH1cblxuICAvLyAjIyMgaGFuZGxlIGNoYW5nZXMgZnJvbSByZW1vdGVcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlUHVsbFJlc3VsdHMoY2hhbmdlcykge1xuICAgIHZhciBkb2MsIGV2ZW50LCBvYmplY3QsIF9pLCBfbGVuO1xuXG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBjaGFuZ2VzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBkb2MgPSBjaGFuZ2VzW19pXS5kb2M7XG5cbiAgICAgIGlmIChyZW1vdGUucHJlZml4ICYmIGRvYy5faWQuaW5kZXhPZihyZW1vdGUucHJlZml4KSAhPT0gMCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgb2JqZWN0ID0gcGFyc2VGcm9tUmVtb3RlKGRvYyk7XG5cbiAgICAgIGlmIChvYmplY3QuX2RlbGV0ZWQpIHtcbiAgICAgICAgaWYgKCFyZW1vdGUuaXNLbm93bk9iamVjdChvYmplY3QpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQgPSAncmVtb3ZlJztcbiAgICAgICAgcmVtb3RlLmlzS25vd25PYmplY3Qob2JqZWN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChyZW1vdGUuaXNLbm93bk9iamVjdChvYmplY3QpKSB7XG4gICAgICAgICAgZXZlbnQgPSAndXBkYXRlJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBldmVudCA9ICdhZGQnO1xuICAgICAgICAgIHJlbW90ZS5tYXJrQXNLbm93bk9iamVjdChvYmplY3QpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJlbW90ZS50cmlnZ2VyKGV2ZW50LCBvYmplY3QpO1xuICAgICAgcmVtb3RlLnRyaWdnZXIoZXZlbnQgKyAnOicgKyBvYmplY3QudHlwZSwgb2JqZWN0KTtcbiAgICAgIHJlbW90ZS50cmlnZ2VyKGV2ZW50ICsgJzonICsgb2JqZWN0LnR5cGUgKyAnOicgKyBvYmplY3QuaWQsIG9iamVjdCk7XG4gICAgICByZW1vdGUudHJpZ2dlcignY2hhbmdlJywgZXZlbnQsIG9iamVjdCk7XG4gICAgICByZW1vdGUudHJpZ2dlcignY2hhbmdlOicgKyBvYmplY3QudHlwZSwgZXZlbnQsIG9iamVjdCk7XG4gICAgICByZW1vdGUudHJpZ2dlcignY2hhbmdlOicgKyBvYmplY3QudHlwZSArICc6JyArIG9iamVjdC5pZCwgZXZlbnQsIG9iamVjdCk7XG4gICAgfVxuICB9XG5cblxuICAvLyBib290c3RyYXAga25vd24gb2JqZWN0c1xuICAvL1xuICBpZiAob3B0aW9ucy5rbm93bk9iamVjdHMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMua25vd25PYmplY3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZW1vdGUubWFya0FzS25vd25PYmplY3Qoe1xuICAgICAgICB0eXBlOiBvcHRpb25zLmtub3duT2JqZWN0c1tpXS50eXBlLFxuICAgICAgICBpZDogb3B0aW9ucy5rbm93bk9iamVjdHNbaV0uaWRcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gZXhwb3NlIHB1YmxpYyBBUElcbiAgcmV0dXJuIHJlbW90ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVSZW1vdGVTdG9yZTtcbiIsIi8vXG4vLyBob29kaWUucmVxdWVzdFxuLy8gPT09PT09PT09PT09PT09PVxuXG4vLyBIb29kaWUncyBjZW50cmFsIHBsYWNlIHRvIHNlbmQgcmVxdWVzdCB0byBpdHMgYmFja2VuZC5cbi8vIEF0IHRoZSBtb21lbnQsIGl0J3MgYSB3cmFwcGVyIGFyb3VuZCBqUXVlcnkncyBhamF4IG1ldGhvZCxcbi8vIGJ1dCB3ZSBtaWdodCBnZXQgcmlkIG9mIHRoaXMgZGVwZW5kZW5jeSBpbiB0aGUgZnV0dXJlLlxuLy9cbi8vIEl0IGhhcyBidWlsZCBpbiBzdXBwb3J0IGZvciBDT1JTIGFuZCBhIHN0YW5kYXJkIGVycm9yXG4vLyBoYW5kbGluZyB0aGF0IG5vcm1hbGl6ZXMgZXJyb3JzIHJldHVybmVkIGJ5IENvdWNoREJcbi8vIHRvIEphdmFTY3JpcHQncyBuYXRpdiBjb252ZW50aW9ucyBvZiBlcnJvcnMgaGF2aW5nXG4vLyBhIG5hbWUgJiBhIG1lc3NhZ2UgcHJvcGVydHkuXG4vL1xuLy8gQ29tbW9uIGVycm9ycyB0byBleHBlY3Q6XG4vL1xuLy8gKiBIb29kaWVSZXF1ZXN0RXJyb3Jcbi8vICogSG9vZGllVW5hdXRob3JpemVkRXJyb3Jcbi8vICogSG9vZGllQ29uZmxpY3RFcnJvclxuLy8gKiBIb29kaWVTZXJ2ZXJFcnJvclxuLy9cbnZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKTtcblxuZnVuY3Rpb24gaG9vZGllUmVxdWVzdChob29kaWUpIHtcbiAgdmFyICRhamF4ID0gJC5hamF4O1xuXG4gIC8vIEhvb2RpZSBiYWNrZW5kIGxpc3RlbnRzIHRvIHJlcXVlc3RzIHByZWZpeGVkIGJ5IC9fYXBpLFxuICAvLyBzbyB3ZSBwcmVmaXggYWxsIHJlcXVlc3RzIHdpdGggcmVsYXRpdmUgVVJMc1xuICB2YXIgQVBJX1BBVEggPSAnL19hcGknO1xuXG4gIC8vIFJlcXVlc3RzXG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyBzZW5kcyByZXF1ZXN0cyB0byB0aGUgaG9vZGllIGJhY2tlbmQuXG4gIC8vXG4gIC8vICAgICBwcm9taXNlID0gaG9vZGllLnJlcXVlc3QoJ0dFVCcsICcvdXNlcl9kYXRhYmFzZS9kb2NfaWQnKVxuICAvL1xuICBmdW5jdGlvbiByZXF1ZXN0KHR5cGUsIHVybCwgb3B0aW9ucykge1xuICAgIHZhciBkZWZhdWx0cywgcmVxdWVzdFByb21pc2UsIHBpcGVkUHJvbWlzZTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgZGVmYXVsdHMgPSB7XG4gICAgICB0eXBlOiB0eXBlLFxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIH07XG5cbiAgICAvLyBpZiBhYnNvbHV0ZSBwYXRoIHBhc3NlZCwgc2V0IENPUlMgaGVhZGVyc1xuXG4gICAgLy8gaWYgcmVsYXRpdmUgcGF0aCBwYXNzZWQsIHByZWZpeCB3aXRoIGJhc2VVcmxcbiAgICBpZiAoIS9eaHR0cC8udGVzdCh1cmwpKSB7XG4gICAgICB1cmwgPSAoaG9vZGllLmJhc2VVcmwgfHwgJycpICsgQVBJX1BBVEggKyB1cmw7XG4gICAgfVxuXG4gICAgLy8gaWYgdXJsIGlzIGNyb3NzIGRvbWFpbiwgc2V0IENPUlMgaGVhZGVyc1xuICAgIGlmICgvXmh0dHAvLnRlc3QodXJsKSkge1xuICAgICAgZGVmYXVsdHMueGhyRmllbGRzID0ge1xuICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWVcbiAgICAgIH07XG4gICAgICBkZWZhdWx0cy5jcm9zc0RvbWFpbiA9IHRydWU7XG4gICAgfVxuXG4gICAgZGVmYXVsdHMudXJsID0gdXJsO1xuXG5cbiAgICAvLyB3ZSBhcmUgcGlwaW5nIHRoZSByZXN1bHQgb2YgdGhlIHJlcXVlc3QgdG8gcmV0dXJuIGEgbmljZXJcbiAgICAvLyBlcnJvciBpZiB0aGUgcmVxdWVzdCBjYW5ub3QgcmVhY2ggdGhlIHNlcnZlciBhdCBhbGwuXG4gICAgLy8gV2UgY2FuJ3QgcmV0dXJuIHRoZSBwcm9taXNlIG9mIGFqYXggZGlyZWN0bHkgYmVjYXVzZSBvZlxuICAgIC8vIHRoZSBwaXBpbmcsIGFzIGZvciB3aGF0ZXZlciByZWFzb24gdGhlIHJldHVybmVkIHByb21pc2VcbiAgICAvLyBkb2VzIG5vdCBoYXZlIHRoZSBgYWJvcnRgIG1ldGhvZCBhbnkgbW9yZSwgbWF5YmUgb3RoZXJzXG4gICAgLy8gYXMgd2VsbC4gU2VlIGFsc28gaHR0cDovL2J1Z3MuanF1ZXJ5LmNvbS90aWNrZXQvMTQxMDRcbiAgICByZXF1ZXN0UHJvbWlzZSA9ICRhamF4KGV4dGVuZChkZWZhdWx0cywgb3B0aW9ucykpO1xuICAgIHBpcGVkUHJvbWlzZSA9IHJlcXVlc3RQcm9taXNlLnRoZW4oIG51bGwsIGhhbmRsZVJlcXVlc3RFcnJvcik7XG4gICAgcGlwZWRQcm9taXNlLmFib3J0ID0gcmVxdWVzdFByb21pc2UuYWJvcnQ7XG5cbiAgICByZXR1cm4gcGlwZWRQcm9taXNlO1xuICB9XG5cbiAgLy9cbiAgLy9cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlUmVxdWVzdEVycm9yKHhocikge1xuICAgIHZhciBlcnJvcjtcblxuICAgIHRyeSB7XG4gICAgICBlcnJvciA9IHBhcnNlRXJyb3JGcm9tUmVzcG9uc2UoeGhyKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcblxuICAgICAgaWYgKHhoci5yZXNwb25zZVRleHQpIHtcbiAgICAgICAgZXJyb3IgPSB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyb3IgPSB7XG4gICAgICAgICAgbmFtZTogJ0hvb2RpZUNvbm5lY3Rpb25FcnJvcicsXG4gICAgICAgICAgbWVzc2FnZTogJ0NvdWxkIG5vdCBjb25uZWN0IHRvIEhvb2RpZSBzZXJ2ZXIgYXQge3t1cmx9fS4nLFxuICAgICAgICAgIHVybDogaG9vZGllLmJhc2VVcmwgfHwgJy8nXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKGVycm9yKS5wcm9taXNlKCk7XG4gIH1cblxuICAvL1xuICAvLyBDb3VjaERCIHJldHVybnMgZXJyb3JzIGluIEpTT04gZm9ybWF0LCB3aXRoIHRoZSBwcm9wZXJ0aWVzXG4gIC8vIGBlcnJvcmAgYW5kIGByZWFzb25gLiBIb29kaWUgdXNlcyBKYXZhU2NyaXB0J3MgbmF0aXZlIEVycm9yXG4gIC8vIHByb3BlcnRpZXMgYG5hbWVgIGFuZCBgbWVzc2FnZWAgaW5zdGVhZCwgc28gd2UgYXJlIG5vcm1hbGl6aW5nXG4gIC8vIHRoYXQuXG4gIC8vXG4gIC8vIEJlc2lkZXMgdGhlIHJlbmFtaW5nIHdlIGFsc28gZG8gYSBtYXRjaGluZyB3aXRoIGEgbWFwIG9mIGtub3duXG4gIC8vIGVycm9ycyB0byBtYWtlIHRoZW0gbW9yZSBjbGVhci4gRm9yIHJlZmVyZW5jZSwgc2VlXG4gIC8vIGh0dHBzOi8vd2lraS5hcGFjaGUub3JnL2NvdWNoZGIvRGVmYXVsdF9odHRwX2Vycm9ycyAmXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hcGFjaGUvY291Y2hkYi9ibG9iL21hc3Rlci9zcmMvY291Y2hkYi9jb3VjaF9odHRwZC5lcmwjTDgwN1xuICAvL1xuXG4gIGZ1bmN0aW9uIHBhcnNlRXJyb3JGcm9tUmVzcG9uc2UoeGhyKSB7XG4gICAgdmFyIGVycm9yID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcblxuICAgIC8vIGdldCBlcnJvciBuYW1lXG4gICAgZXJyb3IubmFtZSA9IEhUVFBfU1RBVFVTX0VSUk9SX01BUFt4aHIuc3RhdHVzXTtcbiAgICBpZiAoISBlcnJvci5uYW1lKSB7XG4gICAgICBlcnJvci5uYW1lID0gaG9vZGllZnlSZXF1ZXN0RXJyb3JOYW1lKGVycm9yLmVycm9yKTtcbiAgICB9XG5cbiAgICAvLyBzdG9yZSBzdGF0dXMgJiBtZXNzYWdlXG4gICAgZXJyb3Iuc3RhdHVzID0geGhyLnN0YXR1cztcbiAgICBlcnJvci5tZXNzYWdlID0gZXJyb3IucmVhc29uIHx8ICcnO1xuICAgIGVycm9yLm1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgZXJyb3IubWVzc2FnZS5zbGljZSgxKTtcblxuICAgIC8vIGNsZWFudXBcbiAgICBkZWxldGUgZXJyb3IuZXJyb3I7XG4gICAgZGVsZXRlIGVycm9yLnJlYXNvbjtcblxuICAgIHJldHVybiBlcnJvcjtcbiAgfVxuXG4gIC8vIG1hcCBDb3VjaERCIEhUVFAgc3RhdHVzIGNvZGVzIHRvIEhvb2RpZSBFcnJvcnNcbiAgdmFyIEhUVFBfU1RBVFVTX0VSUk9SX01BUCA9IHtcbiAgICA0MDA6ICdIb29kaWVSZXF1ZXN0RXJyb3InLCAvLyBiYWQgcmVxdWVzdFxuICAgIDQwMTogJ0hvb2RpZVVuYXV0aG9yaXplZEVycm9yJyxcbiAgICA0MDM6ICdIb29kaWVSZXF1ZXN0RXJyb3InLCAvLyBmb3JiaWRkZW5cbiAgICA0MDQ6ICdIb29kaWVOb3RGb3VuZEVycm9yJywgLy8gZm9yYmlkZGVuXG4gICAgNDA5OiAnSG9vZGllQ29uZmxpY3RFcnJvcicsXG4gICAgNDEyOiAnSG9vZGllQ29uZmxpY3RFcnJvcicsIC8vIGZpbGUgZXhpc3RcbiAgICA1MDA6ICdIb29kaWVTZXJ2ZXJFcnJvcidcbiAgfTtcblxuXG4gIGZ1bmN0aW9uIGhvb2RpZWZ5UmVxdWVzdEVycm9yTmFtZShuYW1lKSB7XG4gICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvKF5cXHd8X1xcdykvZywgZnVuY3Rpb24gKG1hdGNoKSB7XG4gICAgICByZXR1cm4gKG1hdGNoWzFdIHx8IG1hdGNoWzBdKS50b1VwcGVyQ2FzZSgpO1xuICAgIH0pO1xuICAgIHJldHVybiAnSG9vZGllJyArIG5hbWUgKyAnRXJyb3InO1xuICB9XG5cblxuICAvL1xuICAvLyBwdWJsaWMgQVBJXG4gIC8vXG4gIGhvb2RpZS5yZXF1ZXN0ID0gcmVxdWVzdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVSZXF1ZXN0O1xuIiwiLy8gc2NvcGVkIFN0b3JlXG4vLyA9PT09PT09PT09PT1cblxuLy8gc2FtZSBhcyBzdG9yZSwgYnV0IHdpdGggdHlwZSBwcmVzZXQgdG8gYW4gaW5pdGlhbGx5XG4vLyBwYXNzZWQgdmFsdWUuXG4vL1xudmFyIGhvb2RpZUV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVTY29wZWRTdG9yZUFwaShob29kaWUsIHN0b3JlQXBpLCBvcHRpb25zKSB7XG5cbiAgLy8gbmFtZVxuICB2YXIgc3RvcmVOYW1lID0gb3B0aW9ucy5uYW1lIHx8ICdzdG9yZSc7XG4gIHZhciB0eXBlID0gb3B0aW9ucy50eXBlO1xuICB2YXIgaWQgPSBvcHRpb25zLmlkO1xuXG4gIHZhciBhcGkgPSB7fTtcblxuICAvLyBzY29wZWQgYnkgdHlwZSBvbmx5XG4gIGlmICghaWQpIHtcblxuICAgIC8vIGFkZCBldmVudHNcbiAgICBob29kaWVFdmVudHMoaG9vZGllLCB7XG4gICAgICBjb250ZXh0OiBhcGksXG4gICAgICBuYW1lc3BhY2U6IHN0b3JlTmFtZSArICc6JyArIHR5cGVcbiAgICB9KTtcblxuICAgIC8vXG4gICAgYXBpLnNhdmUgPSBmdW5jdGlvbiBzYXZlKGlkLCBwcm9wZXJ0aWVzLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkuc2F2ZSh0eXBlLCBpZCwgcHJvcGVydGllcywgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLmFkZCA9IGZ1bmN0aW9uIGFkZChwcm9wZXJ0aWVzLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkuYWRkKHR5cGUsIHByb3BlcnRpZXMsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5maW5kID0gZnVuY3Rpb24gZmluZChpZCkge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLmZpbmQodHlwZSwgaWQpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5maW5kT3JBZGQgPSBmdW5jdGlvbiBmaW5kT3JBZGQoaWQsIHByb3BlcnRpZXMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS5maW5kT3JBZGQodHlwZSwgaWQsIHByb3BlcnRpZXMpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5maW5kQWxsID0gZnVuY3Rpb24gZmluZEFsbChvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkuZmluZEFsbCh0eXBlLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKGlkLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS51cGRhdGUodHlwZSwgaWQsIG9iamVjdFVwZGF0ZSwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnVwZGF0ZUFsbCA9IGZ1bmN0aW9uIHVwZGF0ZUFsbChvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS51cGRhdGVBbGwodHlwZSwgb2JqZWN0VXBkYXRlLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKGlkLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkucmVtb3ZlKHR5cGUsIGlkLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkucmVtb3ZlQWxsID0gZnVuY3Rpb24gcmVtb3ZlQWxsKG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS5yZW1vdmVBbGwodHlwZSwgb3B0aW9ucyk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHNjb3BlZCBieSBib3RoOiB0eXBlICYgaWRcbiAgaWYgKGlkKSB7XG5cbiAgICAvLyBhZGQgZXZlbnRzXG4gICAgaG9vZGllRXZlbnRzKGhvb2RpZSwge1xuICAgICAgY29udGV4dDogYXBpLFxuICAgICAgbmFtZXNwYWNlOiBzdG9yZU5hbWUgKyAnOicgKyB0eXBlICsgJzonICsgaWRcbiAgICB9KTtcblxuICAgIC8vXG4gICAgYXBpLnNhdmUgPSBmdW5jdGlvbiBzYXZlKHByb3BlcnRpZXMsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS5zYXZlKHR5cGUsIGlkLCBwcm9wZXJ0aWVzLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkuZmluZCA9IGZ1bmN0aW9uIGZpbmQoKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkuZmluZCh0eXBlLCBpZCk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZShvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS51cGRhdGUodHlwZSwgaWQsIG9iamVjdFVwZGF0ZSwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZShvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkucmVtb3ZlKHR5cGUsIGlkLCBvcHRpb25zKTtcbiAgICB9O1xuICB9XG5cbiAgLy9cbiAgYXBpLmRlY29yYXRlUHJvbWlzZXMgPSBzdG9yZUFwaS5kZWNvcmF0ZVByb21pc2VzO1xuICBhcGkudmFsaWRhdGUgPSBzdG9yZUFwaS52YWxpZGF0ZTtcblxuICByZXR1cm4gYXBpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVNjb3BlZFN0b3JlQXBpO1xuIiwiLy8gc2NvcGVkIFN0b3JlXG4vLyA9PT09PT09PT09PT1cblxuLy8gc2FtZSBhcyBzdG9yZSwgYnV0IHdpdGggdHlwZSBwcmVzZXQgdG8gYW4gaW5pdGlhbGx5XG4vLyBwYXNzZWQgdmFsdWUuXG4vL1xudmFyIGhvb2RpZUV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVTY29wZWRUYXNrKGhvb2RpZSwgdGFza0FwaSwgb3B0aW9ucykge1xuXG4gIHZhciB0eXBlID0gb3B0aW9ucy50eXBlO1xuICB2YXIgaWQgPSBvcHRpb25zLmlkO1xuXG4gIHZhciBhcGkgPSB7fTtcblxuICAvLyBzY29wZWQgYnkgdHlwZSBvbmx5XG4gIGlmICghaWQpIHtcblxuICAgIC8vIGFkZCBldmVudHNcbiAgICBob29kaWVFdmVudHMoaG9vZGllLCB7XG4gICAgICBjb250ZXh0OiBhcGksXG4gICAgICBuYW1lc3BhY2U6ICd0YXNrOicgKyB0eXBlXG4gICAgfSk7XG5cbiAgICAvL1xuICAgIGFwaS5zdGFydCA9IGZ1bmN0aW9uIHN0YXJ0KHByb3BlcnRpZXMpIHtcbiAgICAgIHJldHVybiB0YXNrQXBpLnN0YXJ0KHR5cGUsIHByb3BlcnRpZXMpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5jYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoaWQpIHtcbiAgICAgIHJldHVybiB0YXNrQXBpLmNhbmNlbCh0eXBlLCBpZCk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnJlc3RhcnQgPSBmdW5jdGlvbiByZXN0YXJ0KGlkLCB1cGRhdGUpIHtcbiAgICAgIHJldHVybiB0YXNrQXBpLnJlc3RhcnQodHlwZSwgaWQsIHVwZGF0ZSk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLmNhbmNlbEFsbCA9IGZ1bmN0aW9uIGNhbmNlbEFsbCgpIHtcbiAgICAgIHJldHVybiB0YXNrQXBpLmNhbmNlbEFsbCh0eXBlKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkucmVzdGFydEFsbCA9IGZ1bmN0aW9uIHJlc3RhcnRBbGwodXBkYXRlKSB7XG4gICAgICByZXR1cm4gdGFza0FwaS5yZXN0YXJ0QWxsKHR5cGUsIHVwZGF0ZSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHNjb3BlZCBieSBib3RoOiB0eXBlICYgaWRcbiAgaWYgKGlkKSB7XG5cbiAgICAvLyBhZGQgZXZlbnRzXG4gICAgaG9vZGllRXZlbnRzKGhvb2RpZSwge1xuICAgICAgY29udGV4dDogYXBpLFxuICAgICAgbmFtZXNwYWNlOiAndGFzazonICsgdHlwZSArICc6JyArIGlkXG4gICAgfSk7XG5cbiAgICAvL1xuICAgIGFwaS5jYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XG4gICAgICByZXR1cm4gdGFza0FwaS5jYW5jZWwodHlwZSwgaWQpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5yZXN0YXJ0ID0gZnVuY3Rpb24gcmVzdGFydCh1cGRhdGUpIHtcbiAgICAgIHJldHVybiB0YXNrQXBpLnJlc3RhcnQodHlwZSwgaWQsIHVwZGF0ZSk7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBhcGk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllU2NvcGVkVGFzaztcbiIsIi8vIFN0b3JlXG4vLyA9PT09PT09PT09PT1cblxuLy8gVGhpcyBjbGFzcyBkZWZpbmVzIHRoZSBBUEkgdGhhdCBob29kaWUuc3RvcmUgKGxvY2FsIHN0b3JlKSBhbmQgaG9vZGllLm9wZW5cbi8vIChyZW1vdGUgc3RvcmUpIGltcGxlbWVudCB0byBhc3N1cmUgYSBjb2hlcmVudCBBUEkuIEl0IGFsc28gaW1wbGVtZW50cyBzb21lXG4vLyBiYXNpYyB2YWxpZGF0aW9ucy5cbi8vXG4vLyBUaGUgcmV0dXJuZWQgQVBJIHByb3ZpZGVzIHRoZSBmb2xsb3dpbmcgbWV0aG9kczpcbi8vXG4vLyAqIHZhbGlkYXRlXG4vLyAqIHNhdmVcbi8vICogYWRkXG4vLyAqIGZpbmRcbi8vICogZmluZE9yQWRkXG4vLyAqIGZpbmRBbGxcbi8vICogdXBkYXRlXG4vLyAqIHVwZGF0ZUFsbFxuLy8gKiByZW1vdmVcbi8vICogcmVtb3ZlQWxsXG4vLyAqIGRlY29yYXRlUHJvbWlzZXNcbi8vICogdHJpZ2dlclxuLy8gKiBvblxuLy8gKiB1bmJpbmRcbi8vXG4vLyBBdCB0aGUgc2FtZSB0aW1lLCB0aGUgcmV0dXJuZWQgQVBJIGNhbiBiZSBjYWxsZWQgYXMgZnVuY3Rpb24gcmV0dXJuaW5nIGFcbi8vIHN0b3JlIHNjb3BlZCBieSB0aGUgcGFzc2VkIHR5cGUsIGZvciBleGFtcGxlXG4vL1xuLy8gICAgIHZhciB0YXNrU3RvcmUgPSBob29kaWUuc3RvcmUoJ3Rhc2snKTtcbi8vICAgICB0YXNrU3RvcmUuZmluZEFsbCgpLnRoZW4oIHNob3dBbGxUYXNrcyApO1xuLy8gICAgIHRhc2tTdG9yZS51cGRhdGUoJ2lkMTIzJywge2RvbmU6IHRydWV9KTtcbi8vXG5cbi8vXG52YXIgaG9vZGllU2NvcGVkU3RvcmVBcGkgPSByZXF1aXJlKCcuL3Njb3BlZF9zdG9yZScpO1xudmFyIGhvb2RpZUV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgSG9vZGllRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yJyk7XG52YXIgSG9vZGllT2JqZWN0VHlwZUVycm9yID0gcmVxdWlyZSgnLi9lcnJvci9vYmplY3RfdHlwZScpO1xudmFyIEhvb2RpZU9iamVjdElkRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yL29iamVjdF9pZCcpO1xuXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVTdG9yZUFwaShob29kaWUsIG9wdGlvbnMpIHtcblxuICAvLyBwZXJzaXN0YW5jZSBsb2dpY1xuICB2YXIgYmFja2VuZCA9IHt9O1xuXG4gIC8vIGV4dGVuZCB0aGlzIHByb3BlcnR5IHdpdGggZXh0cmEgZnVuY3Rpb25zIHRoYXQgd2lsbCBiZSBhdmFpbGFibGVcbiAgLy8gb24gYWxsIHByb21pc2VzIHJldHVybmVkIGJ5IGhvb2RpZS5zdG9yZSBBUEkuIEl0IGhhcyBhIHJlZmVyZW5jZVxuICAvLyB0byBjdXJyZW50IGhvb2RpZSBpbnN0YW5jZSBieSBkZWZhdWx0XG4gIHZhciBwcm9taXNlQXBpID0ge1xuICAgIGhvb2RpZTogaG9vZGllXG4gIH07XG5cbiAgLy8gbmFtZVxuICB2YXIgc3RvcmVOYW1lID0gb3B0aW9ucy5uYW1lIHx8ICdzdG9yZSc7XG5cbiAgLy8gcHVibGljIEFQSVxuICB2YXIgYXBpID0gZnVuY3Rpb24gYXBpKHR5cGUsIGlkKSB7XG4gICAgdmFyIHNjb3BlZE9wdGlvbnMgPSBleHRlbmQodHJ1ZSwge3R5cGU6IHR5cGUsIGlkOiBpZH0sIG9wdGlvbnMpO1xuICAgIHJldHVybiBob29kaWVTY29wZWRTdG9yZUFwaShob29kaWUsIGFwaSwgc2NvcGVkT3B0aW9ucyk7XG4gIH07XG5cbiAgLy8gYWRkIGV2ZW50IEFQSVxuICBob29kaWVFdmVudHMoaG9vZGllLCB7XG4gICAgY29udGV4dDogYXBpLFxuICAgIG5hbWVzcGFjZTogc3RvcmVOYW1lXG4gIH0pO1xuXG5cbiAgLy8gVmFsaWRhdGVcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBieSBkZWZhdWx0LCB3ZSBvbmx5IGNoZWNrIGZvciBhIHZhbGlkIHR5cGUgJiBpZC5cbiAgLy8gdGhlIHZhbGlkYXRlIG1ldGhvZCBjYW4gYmUgb3ZlcndyaXRlbiBieSBwYXNzaW5nXG4gIC8vIG9wdGlvbnMudmFsaWRhdGVcbiAgLy9cbiAgLy8gaWYgYHZhbGlkYXRlYCByZXR1cm5zIG5vdGhpbmcsIHRoZSBwYXNzZWQgb2JqZWN0IGlzXG4gIC8vIHZhbGlkLiBPdGhlcndpc2UgaXQgcmV0dXJucyBhbiBlcnJvclxuICAvL1xuICBhcGkudmFsaWRhdGUgPSBvcHRpb25zLnZhbGlkYXRlO1xuXG4gIGlmICghb3B0aW9ucy52YWxpZGF0ZSkge1xuXG4gICAgYXBpLnZhbGlkYXRlID0gZnVuY3Rpb24ob2JqZWN0IC8qLCBvcHRpb25zICovKSB7XG5cbiAgICAgIGlmICghb2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBuZXcgSG9vZGllRXJyb3Ioe1xuICAgICAgICAgIG5hbWU6ICdJbnZhbGlkT2JqZWN0RXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6ICdObyBvYmplY3QgcGFzc2VkLidcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChIb29kaWVPYmplY3RUeXBlRXJyb3IuaXNJbnZhbGlkKG9iamVjdC50eXBlLCB2YWxpZElkT3JUeXBlUGF0dGVybikpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBIb29kaWVPYmplY3RUeXBlRXJyb3Ioe1xuICAgICAgICAgIHR5cGU6IG9iamVjdC50eXBlLFxuICAgICAgICAgIHJ1bGVzOiB2YWxpZElkT3JUeXBlUnVsZXNcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghb2JqZWN0LmlkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKEhvb2RpZU9iamVjdElkRXJyb3IuaXNJbnZhbGlkKG9iamVjdC5pZCwgdmFsaWRJZE9yVHlwZVBhdHRlcm4pKSB7XG4gICAgICAgIHJldHVybiBuZXcgSG9vZGllT2JqZWN0SWRFcnJvcih7XG4gICAgICAgICAgaWQ6IG9iamVjdC5pZCxcbiAgICAgICAgICBydWxlczogdmFsaWRJZE9yVHlwZVJ1bGVzXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgfTtcblxuICB9XG5cbiAgLy8gU2F2ZVxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGNyZWF0ZXMgb3IgcmVwbGFjZXMgYW4gYW4gZXZlbnR1YWxseSBleGlzdGluZyBvYmplY3QgaW4gdGhlIHN0b3JlXG4gIC8vIHdpdGggc2FtZSB0eXBlICYgaWQuXG4gIC8vXG4gIC8vIFdoZW4gaWQgaXMgdW5kZWZpbmVkLCBpdCBnZXRzIGdlbmVyYXRlZCBhbmQgYSBuZXcgb2JqZWN0IGdldHMgc2F2ZWRcbiAgLy9cbiAgLy8gZXhhbXBsZSB1c2FnZTpcbiAgLy9cbiAgLy8gICAgIHN0b3JlLnNhdmUoJ2NhcicsIHVuZGVmaW5lZCwge2NvbG9yOiAncmVkJ30pXG4gIC8vICAgICBzdG9yZS5zYXZlKCdjYXInLCAnYWJjNDU2NycsIHtjb2xvcjogJ3JlZCd9KVxuICAvL1xuICBhcGkuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUodHlwZSwgaWQsIHByb3BlcnRpZXMsIG9wdGlvbnMpIHtcblxuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gZXh0ZW5kKHRydWUsIHt9LCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cblxuICAgIC8vIGRvbid0IG1lc3Mgd2l0aCBwYXNzZWQgb2JqZWN0XG4gICAgdmFyIG9iamVjdCA9IGV4dGVuZCh0cnVlLCB7fSwgcHJvcGVydGllcywge1xuICAgICAgdHlwZTogdHlwZSxcbiAgICAgIGlkOiBpZFxuICAgIH0pO1xuXG4gICAgLy8gdmFsaWRhdGlvbnNcbiAgICB2YXIgZXJyb3IgPSBhcGkudmFsaWRhdGUob2JqZWN0LCBvcHRpb25zIHx8IHt9KTtcblxuICAgIGlmIChlcnJvcikge1xuICAgICAgcmV0dXJuIGhvb2RpZS5yZWplY3RXaXRoKGVycm9yKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVjb3JhdGVQcm9taXNlKCBiYWNrZW5kLnNhdmUob2JqZWN0LCBvcHRpb25zIHx8IHt9KSApO1xuICB9O1xuXG5cbiAgLy8gQWRkXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBgLmFkZGAgaXMgYW4gYWxpYXMgZm9yIGAuc2F2ZWAsIHdpdGggdGhlIGRpZmZlcmVuY2UgdGhhdCB0aGVyZSBpcyBubyBpZCBhcmd1bWVudC5cbiAgLy8gSW50ZXJuYWxseSBpdCBzaW1wbHkgY2FsbHMgYC5zYXZlKHR5cGUsIHVuZGVmaW5lZCwgb2JqZWN0KS5cbiAgLy9cbiAgYXBpLmFkZCA9IGZ1bmN0aW9uIGFkZCh0eXBlLCBwcm9wZXJ0aWVzLCBvcHRpb25zKSB7XG5cbiAgICBpZiAocHJvcGVydGllcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBwcm9wZXJ0aWVzID0ge307XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICByZXR1cm4gYXBpLnNhdmUodHlwZSwgcHJvcGVydGllcy5pZCwgcHJvcGVydGllcywgb3B0aW9ucyk7XG4gIH07XG5cblxuICAvLyBmaW5kXG4gIC8vIC0tLS0tLVxuXG4gIC8vXG4gIGFwaS5maW5kID0gZnVuY3Rpb24gZmluZCh0eXBlLCBpZCkge1xuXG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggYmFja2VuZC5maW5kKHR5cGUsIGlkKSApO1xuICB9O1xuXG5cbiAgLy8gZmluZCBvciBhZGRcbiAgLy8gLS0tLS0tLS0tLS0tLVxuXG4gIC8vIDEuIFRyeSB0byBmaW5kIGEgc2hhcmUgYnkgZ2l2ZW4gaWRcbiAgLy8gMi4gSWYgc2hhcmUgY291bGQgYmUgZm91bmQsIHJldHVybiBpdFxuICAvLyAzLiBJZiBub3QsIGFkZCBvbmUgYW5kIHJldHVybiBpdC5cbiAgLy9cbiAgYXBpLmZpbmRPckFkZCA9IGZ1bmN0aW9uIGZpbmRPckFkZCh0eXBlLCBpZCwgcHJvcGVydGllcykge1xuXG4gICAgaWYgKHByb3BlcnRpZXMgPT09IG51bGwpIHtcbiAgICAgIHByb3BlcnRpZXMgPSB7fTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVOb3RGb3VuZCgpIHtcbiAgICAgIHZhciBuZXdQcm9wZXJ0aWVzO1xuICAgICAgbmV3UHJvcGVydGllcyA9IGV4dGVuZCh0cnVlLCB7XG4gICAgICAgIGlkOiBpZFxuICAgICAgfSwgcHJvcGVydGllcyk7XG4gICAgICByZXR1cm4gYXBpLmFkZCh0eXBlLCBuZXdQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICAvLyBwcm9taXNlIGRlY29yYXRpb25zIGdldCBsb3N0IHdoZW4gcGlwZWQgdGhyb3VnaCBgdGhlbmAsXG4gICAgLy8gdGhhdCdzIHdoeSB3ZSBuZWVkIHRvIGRlY29yYXRlIHRoZSBmaW5kJ3MgcHJvbWlzZSBhZ2Fpbi5cbiAgICB2YXIgcHJvbWlzZSA9IGFwaS5maW5kKHR5cGUsIGlkKS50aGVuKG51bGwsIGhhbmRsZU5vdEZvdW5kKTtcbiAgICByZXR1cm4gZGVjb3JhdGVQcm9taXNlKCBwcm9taXNlICk7XG4gIH07XG5cblxuICAvLyBmaW5kQWxsXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIHJldHVybnMgYWxsIG9iamVjdHMgZnJvbSBzdG9yZS5cbiAgLy8gQ2FuIGJlIG9wdGlvbmFsbHkgZmlsdGVyZWQgYnkgYSB0eXBlIG9yIGEgZnVuY3Rpb25cbiAgLy9cbiAgYXBpLmZpbmRBbGwgPSBmdW5jdGlvbiBmaW5kQWxsKHR5cGUsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gZGVjb3JhdGVQcm9taXNlKCBiYWNrZW5kLmZpbmRBbGwodHlwZSwgb3B0aW9ucykgKTtcbiAgfTtcblxuXG4gIC8vIFVwZGF0ZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gSW4gY29udHJhc3QgdG8gYC5zYXZlYCwgdGhlIGAudXBkYXRlYCBtZXRob2QgZG9lcyBub3QgcmVwbGFjZSB0aGUgc3RvcmVkIG9iamVjdCxcbiAgLy8gYnV0IG9ubHkgY2hhbmdlcyB0aGUgcGFzc2VkIGF0dHJpYnV0ZXMgb2YgYW4gZXhzdGluZyBvYmplY3QsIGlmIGl0IGV4aXN0c1xuICAvL1xuICAvLyBib3RoIGEgaGFzaCBvZiBrZXkvdmFsdWVzIG9yIGEgZnVuY3Rpb24gdGhhdCBhcHBsaWVzIHRoZSB1cGRhdGUgdG8gdGhlIHBhc3NlZFxuICAvLyBvYmplY3QgY2FuIGJlIHBhc3NlZC5cbiAgLy9cbiAgLy8gZXhhbXBsZSB1c2FnZVxuICAvL1xuICAvLyBob29kaWUuc3RvcmUudXBkYXRlKCdjYXInLCAnYWJjNDU2NycsIHtzb2xkOiB0cnVlfSlcbiAgLy8gaG9vZGllLnN0b3JlLnVwZGF0ZSgnY2FyJywgJ2FiYzQ1NjcnLCBmdW5jdGlvbihvYmopIHsgb2JqLnNvbGQgPSB0cnVlIH0pXG4gIC8vXG4gIGFwaS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUodHlwZSwgaWQsIG9iamVjdFVwZGF0ZSwgb3B0aW9ucykge1xuXG4gICAgZnVuY3Rpb24gaGFuZGxlRm91bmQoY3VycmVudE9iamVjdCkge1xuICAgICAgdmFyIGNoYW5nZWRQcm9wZXJ0aWVzLCBuZXdPYmosIHZhbHVlO1xuXG4gICAgICAvLyBub3JtYWxpemUgaW5wdXRcbiAgICAgIG5ld09iaiA9IGV4dGVuZCh0cnVlLCB7fSwgY3VycmVudE9iamVjdCk7XG5cbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0VXBkYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9iamVjdFVwZGF0ZSA9IG9iamVjdFVwZGF0ZShuZXdPYmopO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9iamVjdFVwZGF0ZSkge1xuICAgICAgICByZXR1cm4gaG9vZGllLnJlc29sdmVXaXRoKGN1cnJlbnRPYmplY3QpO1xuICAgICAgfVxuXG4gICAgICAvLyBjaGVjayBpZiBzb21ldGhpbmcgY2hhbmdlZFxuICAgICAgY2hhbmdlZFByb3BlcnRpZXMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmplY3RVcGRhdGUpIHtcbiAgICAgICAgICBpZiAob2JqZWN0VXBkYXRlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gb2JqZWN0VXBkYXRlW2tleV07XG4gICAgICAgICAgICBpZiAoKGN1cnJlbnRPYmplY3Rba2V5XSAhPT0gdmFsdWUpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHdvcmthcm91bmQgZm9yIHVuZGVmaW5lZCB2YWx1ZXMsIGFzIGV4dGVuZCBpZ25vcmVzIHRoZXNlXG4gICAgICAgICAgICBuZXdPYmpba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChrZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9KSgpO1xuXG4gICAgICBpZiAoIShjaGFuZ2VkUHJvcGVydGllcy5sZW5ndGggfHwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGhvb2RpZS5yZXNvbHZlV2l0aChuZXdPYmopO1xuICAgICAgfVxuXG4gICAgICAvL2FwcGx5IHVwZGF0ZVxuICAgICAgcmV0dXJuIGFwaS5zYXZlKHR5cGUsIGlkLCBuZXdPYmosIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIHByb21pc2UgZGVjb3JhdGlvbnMgZ2V0IGxvc3Qgd2hlbiBwaXBlZCB0aHJvdWdoIGB0aGVuYCxcbiAgICAvLyB0aGF0J3Mgd2h5IHdlIG5lZWQgdG8gZGVjb3JhdGUgdGhlIGZpbmQncyBwcm9taXNlIGFnYWluLlxuICAgIHZhciBwcm9taXNlID0gYXBpLmZpbmQodHlwZSwgaWQpLnRoZW4oaGFuZGxlRm91bmQpO1xuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIHByb21pc2UgKTtcbiAgfTtcblxuXG4gIC8vIHVwZGF0ZU9yQWRkXG4gIC8vIC0tLS0tLS0tLS0tLS1cblxuICAvLyBzYW1lIGFzIGAudXBkYXRlKClgLCBidXQgaW4gY2FzZSB0aGUgb2JqZWN0IGNhbm5vdCBiZSBmb3VuZCxcbiAgLy8gaXQgZ2V0cyBjcmVhdGVkXG4gIC8vXG4gIGFwaS51cGRhdGVPckFkZCA9IGZ1bmN0aW9uIHVwZGF0ZU9yQWRkKHR5cGUsIGlkLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcbiAgICBmdW5jdGlvbiBoYW5kbGVOb3RGb3VuZCgpIHtcbiAgICAgIHZhciBwcm9wZXJ0aWVzID0gZXh0ZW5kKHRydWUsIHt9LCBvYmplY3RVcGRhdGUsIHtcbiAgICAgICAgaWQ6IGlkXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGFwaS5hZGQodHlwZSwgcHJvcGVydGllcywgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgdmFyIHByb21pc2UgPSBhcGkudXBkYXRlKHR5cGUsIGlkLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpLnRoZW4obnVsbCwgaGFuZGxlTm90Rm91bmQpO1xuXG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggcHJvbWlzZSApO1xuICB9O1xuXG5cbiAgLy8gdXBkYXRlQWxsXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gdXBkYXRlIGFsbCBvYmplY3RzIGluIHRoZSBzdG9yZSwgY2FuIGJlIG9wdGlvbmFsbHkgZmlsdGVyZWQgYnkgYSBmdW5jdGlvblxuICAvLyBBcyBhbiBhbHRlcm5hdGl2ZSwgYW4gYXJyYXkgb2Ygb2JqZWN0cyBjYW4gYmUgcGFzc2VkXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2VcbiAgLy9cbiAgLy8gaG9vZGllLnN0b3JlLnVwZGF0ZUFsbCgpXG4gIC8vXG4gIGFwaS51cGRhdGVBbGwgPSBmdW5jdGlvbiB1cGRhdGVBbGwoZmlsdGVyT3JPYmplY3RzLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgcHJvbWlzZTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLy8gbm9ybWFsaXplIHRoZSBpbnB1dDogbWFrZSBzdXJlIHdlIGhhdmUgYWxsIG9iamVjdHNcbiAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICBjYXNlIHR5cGVvZiBmaWx0ZXJPck9iamVjdHMgPT09ICdzdHJpbmcnOlxuICAgICAgcHJvbWlzZSA9IGFwaS5maW5kQWxsKGZpbHRlck9yT2JqZWN0cyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGhvb2RpZS5pc1Byb21pc2UoZmlsdGVyT3JPYmplY3RzKTpcbiAgICAgIHByb21pc2UgPSBmaWx0ZXJPck9iamVjdHM7XG4gICAgICBicmVhaztcbiAgICBjYXNlICQuaXNBcnJheShmaWx0ZXJPck9iamVjdHMpOlxuICAgICAgcHJvbWlzZSA9IGhvb2RpZS5kZWZlcigpLnJlc29sdmUoZmlsdGVyT3JPYmplY3RzKS5wcm9taXNlKCk7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OiAvLyBlLmcuIG51bGwsIHVwZGF0ZSBhbGxcbiAgICAgIHByb21pc2UgPSBhcGkuZmluZEFsbCgpO1xuICAgIH1cblxuICAgIHByb21pc2UgPSBwcm9taXNlLnRoZW4oZnVuY3Rpb24ob2JqZWN0cykge1xuICAgICAgLy8gbm93IHdlIHVwZGF0ZSBhbGwgb2JqZWN0cyBvbmUgYnkgb25lIGFuZCByZXR1cm4gYSBwcm9taXNlXG4gICAgICAvLyB0aGF0IHdpbGwgYmUgcmVzb2x2ZWQgb25jZSBhbGwgdXBkYXRlcyBoYXZlIGJlZW4gZmluaXNoZWRcbiAgICAgIHZhciBvYmplY3QsIF91cGRhdGVQcm9taXNlcztcblxuICAgICAgaWYgKCEkLmlzQXJyYXkob2JqZWN0cykpIHtcbiAgICAgICAgb2JqZWN0cyA9IFtvYmplY3RzXTtcbiAgICAgIH1cblxuICAgICAgX3VwZGF0ZVByb21pc2VzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX2ksIF9sZW4sIF9yZXN1bHRzO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IG9iamVjdHMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICBvYmplY3QgPSBvYmplY3RzW19pXTtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKGFwaS51cGRhdGUob2JqZWN0LnR5cGUsIG9iamVjdC5pZCwgb2JqZWN0VXBkYXRlLCBvcHRpb25zKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfSkoKTtcblxuICAgICAgcmV0dXJuICQud2hlbi5hcHBseShudWxsLCBfdXBkYXRlUHJvbWlzZXMpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggcHJvbWlzZSApO1xuICB9O1xuXG5cbiAgLy8gUmVtb3ZlXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIFJlbW92ZXMgb25lIG9iamVjdCBzcGVjaWZpZWQgYnkgYHR5cGVgIGFuZCBgaWRgLlxuICAvL1xuICAvLyB3aGVuIG9iamVjdCBoYXMgYmVlbiBzeW5jZWQgYmVmb3JlLCBtYXJrIGl0IGFzIGRlbGV0ZWQuXG4gIC8vIE90aGVyd2lzZSByZW1vdmUgaXQgZnJvbSBTdG9yZS5cbiAgLy9cbiAgYXBpLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZSh0eXBlLCBpZCwgb3B0aW9ucykge1xuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoIGJhY2tlbmQucmVtb3ZlKHR5cGUsIGlkLCBvcHRpb25zIHx8IHt9KSApO1xuICB9O1xuXG5cbiAgLy8gcmVtb3ZlQWxsXG4gIC8vIC0tLS0tLS0tLS0tXG5cbiAgLy8gRGVzdHJveWUgYWxsIG9iamVjdHMuIENhbiBiZSBmaWx0ZXJlZCBieSBhIHR5cGVcbiAgLy9cbiAgYXBpLnJlbW92ZUFsbCA9IGZ1bmN0aW9uIHJlbW92ZUFsbCh0eXBlLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIGRlY29yYXRlUHJvbWlzZSggYmFja2VuZC5yZW1vdmVBbGwodHlwZSwgb3B0aW9ucyB8fCB7fSkgKTtcbiAgfTtcblxuXG4gIC8vIGRlY29yYXRlIHByb21pc2VzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBleHRlbmQgcHJvbWlzZXMgcmV0dXJuZWQgYnkgc3RvcmUuYXBpXG4gIGFwaS5kZWNvcmF0ZVByb21pc2VzID0gZnVuY3Rpb24gZGVjb3JhdGVQcm9taXNlcyhtZXRob2RzKSB7XG4gICAgcmV0dXJuIGV4dGVuZChwcm9taXNlQXBpLCBtZXRob2RzKTtcbiAgfTtcblxuXG5cbiAgLy8gcmVxdWlyZWQgYmFja2VuZCBtZXRob2RzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaWYgKCFvcHRpb25zLmJhY2tlbmQgKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdvcHRpb25zLmJhY2tlbmQgbXVzdCBiZSBwYXNzZWQnKTtcbiAgfVxuXG4gIHZhciByZXF1aXJlZCA9ICdzYXZlIGZpbmQgZmluZEFsbCByZW1vdmUgcmVtb3ZlQWxsJy5zcGxpdCgnICcpO1xuXG4gIHJlcXVpcmVkLmZvckVhY2goIGZ1bmN0aW9uKG1ldGhvZE5hbWUpIHtcblxuICAgIGlmICghb3B0aW9ucy5iYWNrZW5kW21ldGhvZE5hbWVdKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ29wdGlvbnMuYmFja2VuZC4nK21ldGhvZE5hbWUrJyBtdXN0IGJlIHBhc3NlZC4nKTtcbiAgICB9XG5cbiAgICBiYWNrZW5kW21ldGhvZE5hbWVdID0gb3B0aW9ucy5iYWNrZW5kW21ldGhvZE5hbWVdO1xuICB9KTtcblxuXG4gIC8vIFByaXZhdGVcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gLyBub3QgYWxsb3dlZCBmb3IgaWRcbiAgdmFyIHZhbGlkSWRPclR5cGVQYXR0ZXJuID0gL15bXlxcL10rJC87XG4gIHZhciB2YWxpZElkT3JUeXBlUnVsZXMgPSAnLyBub3QgYWxsb3dlZCc7XG5cbiAgLy9cbiAgZnVuY3Rpb24gZGVjb3JhdGVQcm9taXNlKHByb21pc2UpIHtcbiAgICByZXR1cm4gZXh0ZW5kKHByb21pc2UsIHByb21pc2VBcGkpO1xuICB9XG5cbiAgcmV0dXJuIGFwaTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVTdG9yZUFwaTtcbiIsIi8vIFRhc2tzXG4vLyA9PT09PT09PT09PT1cblxuLy8gVGhpcyBjbGFzcyBkZWZpbmVzIHRoZSBob29kaWUudGFzayBBUEkuXG4vL1xuLy8gVGhlIHJldHVybmVkIEFQSSBwcm92aWRlcyB0aGUgZm9sbG93aW5nIG1ldGhvZHM6XG4vL1xuLy8gKiBzdGFydFxuLy8gKiBjYW5jZWxcbi8vICogcmVzdGFydFxuLy8gKiByZW1vdmVcbi8vICogb25cbi8vICogb25lXG4vLyAqIHVuYmluZFxuLy9cbi8vIEF0IHRoZSBzYW1lIHRpbWUsIHRoZSByZXR1cm5lZCBBUEkgY2FuIGJlIGNhbGxlZCBhcyBmdW5jdGlvbiByZXR1cm5pbmcgYVxuLy8gc3RvcmUgc2NvcGVkIGJ5IHRoZSBwYXNzZWQgdHlwZSwgZm9yIGV4YW1wbGVcbi8vXG4vLyAgICAgdmFyIGVtYWlsVGFza3MgPSBob29kaWUudGFzaygnZW1haWwnKTtcbi8vICAgICBlbWFpbFRhc2tzLnN0YXJ0KCBwcm9wZXJ0aWVzICk7XG4vLyAgICAgZW1haWxUYXNrcy5jYW5jZWwoJ2lkMTIzJyk7XG4vL1xudmFyIGhvb2RpZUV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgaG9vZGllU2NvcGVkVGFzayA9IHJlcXVpcmUoJy4vc2NvcGVkX3Rhc2snKTtcbnZhciBIb29kaWVFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3InKTtcblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ2V4dGVuZCcpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllVGFzayhob29kaWUpIHtcblxuICAvLyBwdWJsaWMgQVBJXG4gIHZhciBhcGkgPSBmdW5jdGlvbiBhcGkodHlwZSwgaWQpIHtcbiAgICByZXR1cm4gaG9vZGllU2NvcGVkVGFzayhob29kaWUsIGFwaSwge3R5cGU6IHR5cGUsIGlkOiBpZH0pO1xuICB9O1xuXG4gIC8vIGFkZCBldmVudHMgQVBJXG4gIGhvb2RpZUV2ZW50cyhob29kaWUsIHsgY29udGV4dDogYXBpLCBuYW1lc3BhY2U6ICd0YXNrJyB9KTtcblxuXG4gIC8vIHN0YXJ0XG4gIC8vIC0tLS0tLS1cblxuICAvLyBzdGFydCBhIG5ldyB0YXNrLiBJZiB0aGUgdXNlciBoYXMgbm8gYWNjb3VudCB5ZXQsIGhvb2RpZSB0cmllcyB0byBzaWduIHVwXG4gIC8vIGZvciBhbiBhbm9ueW1vdXMgYWNjb3VudCBpbiB0aGUgYmFja2dyb3VuZC4gSWYgdGhhdCBmYWlscywgdGhlIHJldHVybmVkXG4gIC8vIHByb21pc2Ugd2lsbCBiZSByZWplY3RlZC5cbiAgLy9cbiAgYXBpLnN0YXJ0ID0gZnVuY3Rpb24odHlwZSwgcHJvcGVydGllcykge1xuICAgIGlmIChob29kaWUuYWNjb3VudC5oYXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiBob29kaWUuc3RvcmUuYWRkKCckJyt0eXBlLCBwcm9wZXJ0aWVzKS50aGVuKGhhbmRsZU5ld1Rhc2spO1xuICAgIH1cblxuICAgIHJldHVybiBob29kaWUuYWNjb3VudC5hbm9ueW1vdXNTaWduVXAoKS50aGVuKCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhcGkuc3RhcnQodHlwZSwgcHJvcGVydGllcyk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyBjYW5jZWxcbiAgLy8gLS0tLS0tLVxuXG4gIC8vIGNhbmNlbCBhIHJ1bm5pbmcgdGFza1xuICAvL1xuICBhcGkuY2FuY2VsID0gZnVuY3Rpb24odHlwZSwgaWQpIHtcbiAgICByZXR1cm4gaG9vZGllLnN0b3JlLnVwZGF0ZSgnJCcgKyB0eXBlLCBpZCwge1xuICAgICAgY2FuY2VsbGVkQXQ6IG5vdygpXG4gICAgfSkudGhlbihoYW5kbGVDYW5jZWxsZWRUYXNrT2JqZWN0KTtcbiAgfTtcblxuXG4gIC8vIHJlc3RhcnRcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gZmlyc3QsIHdlIHRyeSB0byBjYW5jZWwgYSBydW5uaW5nIHRhc2suIElmIHRoYXQgc3VjY2VlZHMsIHdlIHN0YXJ0XG4gIC8vIGEgbmV3IG9uZSB3aXRoIHRoZSBzYW1lIHByb3BlcnRpZXMgYXMgdGhlIG9yaWdpbmFsXG4gIC8vXG4gIGFwaS5yZXN0YXJ0ID0gZnVuY3Rpb24odHlwZSwgaWQsIHVwZGF0ZSkge1xuICAgIHZhciBzdGFydCA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgZXh0ZW5kKG9iamVjdCwgdXBkYXRlKTtcbiAgICAgIGRlbGV0ZSBvYmplY3QuJGVycm9yO1xuICAgICAgZGVsZXRlIG9iamVjdC4kcHJvY2Vzc2VkQXQ7XG4gICAgICBkZWxldGUgb2JqZWN0LmNhbmNlbGxlZEF0O1xuICAgICAgcmV0dXJuIGFwaS5zdGFydChvYmplY3QudHlwZSwgb2JqZWN0KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGFwaS5jYW5jZWwodHlwZSwgaWQpLnRoZW4oc3RhcnQpO1xuICB9O1xuXG4gIC8vIGNhbmNlbEFsbFxuICAvLyAtLS0tLS0tLS0tLVxuXG4gIC8vXG4gIGFwaS5jYW5jZWxBbGwgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgcmV0dXJuIGZpbmRBbGwodHlwZSkudGhlbiggY2FuY2VsVGFza09iamVjdHMgKTtcbiAgfTtcblxuICAvLyByZXN0YXJ0QWxsXG4gIC8vIC0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgYXBpLnJlc3RhcnRBbGwgPSBmdW5jdGlvbih0eXBlLCB1cGRhdGUpIHtcblxuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHVwZGF0ZSA9IHR5cGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbmRBbGwodHlwZSkudGhlbiggZnVuY3Rpb24odGFza09iamVjdHMpIHtcbiAgICAgIHJlc3RhcnRUYXNrT2JqZWN0cyh0YXNrT2JqZWN0cywgdXBkYXRlKTtcbiAgICB9KTtcblxuICB9O1xuXG5cbiAgLy9cbiAgLy8gc3Vic2NyaWJlIHRvIHN0b3JlIGV2ZW50c1xuICAvLyB3ZSBzdWJzY3JpYmUgdG8gYWxsIHN0b3JlIGNoYW5nZXMsIHBpcGUgdGhyb3VnaCB0aGUgdGFzayBvbmVzLFxuICAvLyBtYWtpbmcgYSBmZXcgY2hhbmdlcyBhbG9uZyB0aGUgd2F5LlxuICAvL1xuICBmdW5jdGlvbiBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKSB7XG4gICAgLy8gYWNjb3VudCBldmVudHNcbiAgICBob29kaWUub24oJ3N0b3JlOmNoYW5nZScsIGhhbmRsZVN0b3JlQ2hhbmdlKTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9ubHkgb25jZSBmcm9tIG91dHNpZGUgKGR1cmluZyBIb29kaWUgaW5pdGlhbGl6YXRpb24pXG4gIGFwaS5zdWJzY3JpYmVUb091dHNpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKTtcbiAgICBkZWxldGUgYXBpLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cztcbiAgfTtcblxuXG4gIC8vIFByaXZhdGVcbiAgLy8gLS0tLS0tLVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZU5ld1Rhc2sob2JqZWN0KSB7XG4gICAgdmFyIGRlZmVyID0gaG9vZGllLmRlZmVyKCk7XG4gICAgdmFyIHRhc2tTdG9yZSA9IGhvb2RpZS5zdG9yZShvYmplY3QudHlwZSwgb2JqZWN0LmlkKTtcblxuICAgIHRhc2tTdG9yZS5vbigncmVtb3ZlJywgZnVuY3Rpb24ob2JqZWN0KSB7XG5cbiAgICAgIC8vIHJlbW92ZSBcIiRcIiBmcm9tIHR5cGVcbiAgICAgIG9iamVjdC50eXBlID0gb2JqZWN0LnR5cGUuc3Vic3RyKDEpO1xuXG4gICAgICAvLyB0YXNrIGZpbmlzaGVkIGJ5IHdvcmtlci5cbiAgICAgIGlmKG9iamVjdC4kcHJvY2Vzc2VkQXQpIHtcbiAgICAgICAgcmV0dXJuIGRlZmVyLnJlc29sdmUob2JqZWN0KTtcbiAgICAgIH1cblxuICAgICAgLy8gbWFudWFsbHkgcmVtb3ZlZCAvIGNhbmNlbGxlZC5cbiAgICAgIGRlZmVyLnJlamVjdChuZXcgSG9vZGllRXJyb3Ioe1xuICAgICAgICBtZXNzYWdlOiAnVGFzayBoYXMgYmVlbiBjYW5jZWxsZWQnLFxuICAgICAgICB0YXNrOiBvYmplY3RcbiAgICAgIH0pKTtcbiAgICB9KTtcblxuICAgIHRhc2tTdG9yZS5vbigndXBkYXRlJywgZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICB2YXIgZXJyb3IgPSBvYmplY3QuJGVycm9yO1xuXG4gICAgICBpZiAoISBvYmplY3QuJGVycm9yKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gcmVtb3ZlIFwiJFwiIGZyb20gdHlwZVxuICAgICAgb2JqZWN0LnR5cGUgPSBvYmplY3QudHlwZS5zdWJzdHIoMSk7XG5cbiAgICAgIGRlbGV0ZSBvYmplY3QuJGVycm9yO1xuICAgICAgZXJyb3Iub2JqZWN0ID0gb2JqZWN0O1xuICAgICAgZXJyb3IubWVzc2FnZSA9IGVycm9yLm1lc3NhZ2UgfHwgJ1NvbWV0aGluZyB3ZW50IHdyb25nJztcblxuICAgICAgZGVmZXIucmVqZWN0KG5ldyBIb29kaWVFcnJvcihlcnJvcikpO1xuXG4gICAgICAvLyByZW1vdmUgZXJyb3JlZCB0YXNrXG4gICAgICBob29kaWUuc3RvcmUucmVtb3ZlKCckJyArIG9iamVjdC50eXBlLCBvYmplY3QuaWQpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZUNhbmNlbGxlZFRhc2tPYmplY3QgKHRhc2tPYmplY3QpIHtcbiAgICB2YXIgZGVmZXI7XG4gICAgdmFyIHR5cGUgPSB0YXNrT2JqZWN0LnR5cGU7IC8vIG5vIG5lZWQgdG8gcHJlZml4IHdpdGggJCwgaXQncyBhbHJlYWR5IHByZWZpeGVkLlxuICAgIHZhciBpZCA9IHRhc2tPYmplY3QuaWQ7XG4gICAgdmFyIHJlbW92ZVByb21pc2UgPSBob29kaWUuc3RvcmUucmVtb3ZlKHR5cGUsIGlkKTtcblxuICAgIGlmICghdGFza09iamVjdC5fcmV2KSB7XG4gICAgICAvLyB0YXNrIGhhcyBub3QgeWV0IGJlZW4gc3luY2VkLlxuICAgICAgcmV0dXJuIHJlbW92ZVByb21pc2U7XG4gICAgfVxuXG4gICAgZGVmZXIgPSBob29kaWUuZGVmZXIoKTtcbiAgICBob29kaWUub25lKCdzdG9yZTpzeW5jOicrdHlwZSsnOicraWQsIGRlZmVyLnJlc29sdmUpO1xuICAgIHJlbW92ZVByb21pc2UuZmFpbChkZWZlci5yZWplY3QpO1xuXG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZVN0b3JlQ2hhbmdlKGV2ZW50TmFtZSwgb2JqZWN0LCBvcHRpb25zKSB7XG4gICAgaWYgKG9iamVjdC50eXBlWzBdICE9PSAnJCcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBvYmplY3QudHlwZSA9IG9iamVjdC50eXBlLnN1YnN0cigxKTtcbiAgICB0cmlnZ2VyRXZlbnRzKGV2ZW50TmFtZSwgb2JqZWN0LCBvcHRpb25zKTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGZpbmRBbGwgKHR5cGUpIHtcbiAgICB2YXIgc3RhcnRzV2l0aCA9ICckJztcbiAgICB2YXIgZmlsdGVyO1xuICAgIGlmICh0eXBlKSB7XG4gICAgICBzdGFydHNXaXRoICs9IHR5cGU7XG4gICAgfVxuXG4gICAgZmlsdGVyID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICByZXR1cm4gb2JqZWN0LnR5cGUuaW5kZXhPZihzdGFydHNXaXRoKSA9PT0gMDtcbiAgICB9O1xuICAgIHJldHVybiBob29kaWUuc3RvcmUuZmluZEFsbChmaWx0ZXIpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gY2FuY2VsVGFza09iamVjdHMgKHRhc2tPYmplY3RzKSB7XG4gICAgcmV0dXJuIHRhc2tPYmplY3RzLm1hcCggZnVuY3Rpb24odGFza09iamVjdCkge1xuICAgICAgcmV0dXJuIGFwaS5jYW5jZWwodGFza09iamVjdC50eXBlLnN1YnN0cigxKSwgdGFza09iamVjdC5pZCk7XG4gICAgfSk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiByZXN0YXJ0VGFza09iamVjdHMgKHRhc2tPYmplY3RzLCB1cGRhdGUpIHtcbiAgICByZXR1cm4gdGFza09iamVjdHMubWFwKCBmdW5jdGlvbih0YXNrT2JqZWN0KSB7XG4gICAgICByZXR1cm4gYXBpLnJlc3RhcnQodGFza09iamVjdC50eXBlLnN1YnN0cigxKSwgdGFza09iamVjdC5pZCwgdXBkYXRlKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIHRoaXMgaXMgd2hlcmUgYWxsIHRoZSB0YXNrIGV2ZW50cyBnZXQgdHJpZ2dlcmVkLFxuICAvLyBsaWtlIGFkZDptZXNzYWdlLCBjaGFuZ2U6bWVzc2FnZTphYmM0NTY3LCByZW1vdmUsIGV0Yy5cbiAgZnVuY3Rpb24gdHJpZ2dlckV2ZW50cyhldmVudE5hbWUsIHRhc2ssIG9wdGlvbnMpIHtcbiAgICB2YXIgZXJyb3I7XG5cbiAgICAvLyBcIm5ld1wiIHRhc2tzIGFyZSB0cmlnZ2VyIGFzIFwic3RhcnRcIiBldmVudHNcbiAgICBpZiAoZXZlbnROYW1lID09PSAnbmV3Jykge1xuICAgICAgZXZlbnROYW1lID0gJ3N0YXJ0JztcbiAgICB9XG5cbiAgICBpZiAoZXZlbnROYW1lID09PSAncmVtb3ZlJyAmJiB0YXNrLmNhbmNlbGxlZEF0KSB7XG4gICAgICBldmVudE5hbWUgPSAnY2FuY2VsJztcbiAgICB9XG5cbiAgICBpZiAoZXZlbnROYW1lID09PSAncmVtb3ZlJyAmJiB0YXNrLiRwcm9jZXNzZWRBdCkge1xuICAgICAgZXZlbnROYW1lID0gJ3N1Y2Nlc3MnO1xuICAgIH1cblxuICAgIGlmIChldmVudE5hbWUgPT09ICd1cGRhdGUnICYmIHRhc2suJGVycm9yKSB7XG4gICAgICBldmVudE5hbWUgPSAnZXJyb3InO1xuICAgICAgZXJyb3IgPSB0YXNrLiRlcnJvcjtcbiAgICAgIGRlbGV0ZSB0YXNrLiRlcnJvcjtcblxuICAgICAgYXBpLnRyaWdnZXIoJ2Vycm9yJywgZXJyb3IsIHRhc2ssIG9wdGlvbnMpO1xuICAgICAgYXBpLnRyaWdnZXIodGFzay50eXBlICsgJzplcnJvcicsIGVycm9yLCB0YXNrLCBvcHRpb25zKTtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6JyArIHRhc2suaWQgKyAnOmVycm9yJywgZXJyb3IsIHRhc2ssIG9wdGlvbnMpO1xuXG4gICAgICBvcHRpb25zID0gZXh0ZW5kKHt9LCBvcHRpb25zLCB7XG4gICAgICAgIGVycm9yOiBlcnJvclxuICAgICAgfSk7XG5cbiAgICAgIGFwaS50cmlnZ2VyKCdjaGFuZ2UnLCAnZXJyb3InLCB0YXNrLCBvcHRpb25zKTtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6Y2hhbmdlJywgJ2Vycm9yJywgdGFzaywgb3B0aW9ucyk7XG4gICAgICBhcGkudHJpZ2dlcih0YXNrLnR5cGUgKyAnOicgKyB0YXNrLmlkICsgJzpjaGFuZ2UnLCAnZXJyb3InLCB0YXNrLCBvcHRpb25zKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGlnbm9yZSBhbGwgdGhlIG90aGVyIGV2ZW50c1xuICAgIGlmIChldmVudE5hbWUgIT09ICdzdGFydCcgJiYgZXZlbnROYW1lICE9PSAnY2FuY2VsJyAmJiBldmVudE5hbWUgIT09ICdzdWNjZXNzJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGFwaS50cmlnZ2VyKGV2ZW50TmFtZSwgdGFzaywgb3B0aW9ucyk7XG4gICAgYXBpLnRyaWdnZXIodGFzay50eXBlICsgJzonICsgZXZlbnROYW1lLCB0YXNrLCBvcHRpb25zKTtcblxuICAgIGlmIChldmVudE5hbWUgIT09ICdzdGFydCcpIHtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6JyArIHRhc2suaWQgKyAnOicgKyBldmVudE5hbWUsIHRhc2ssIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGFwaS50cmlnZ2VyKCdjaGFuZ2UnLCBldmVudE5hbWUsIHRhc2ssIG9wdGlvbnMpO1xuICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6Y2hhbmdlJywgZXZlbnROYW1lLCB0YXNrLCBvcHRpb25zKTtcblxuICAgIGlmIChldmVudE5hbWUgIT09ICdzdGFydCcpIHtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6JyArIHRhc2suaWQgKyAnOmNoYW5nZScsIGV2ZW50TmFtZSwgdGFzaywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gbm93KCkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShuZXcgRGF0ZSgpKS5yZXBsYWNlKC9bJ1wiXS9nLCAnJyk7XG4gIH1cblxuICAvLyBleHRlbmQgaG9vZGllXG4gIGhvb2RpZS50YXNrID0gYXBpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVRhc2s7XG4iXX0=
(2)
});
;