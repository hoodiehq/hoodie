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
var hoodieAccountRemote = require('./hoodie/remote');
var hoodieConnection = require('./hoodie/connection');
var hoodieId = require('./hoodie/id');
var hoodieLocalStore = require('./hoodie/store');
var hoodieTask = require('./hoodie/task');
var hoodieOpen = require('./hoodie/open');
var hoodieRequest = require('./hoodie/request');
var hoodieConfig = require('./lib/config');
var hoodieEvents = require('./lib/events');

// for plugins
var lib = require('./lib');
var util = require('./utils');

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

  // remove trailing slashes
  hoodie.baseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : '';


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

  // * hoodie.isOnline
  // * hoodie.checkConnection
  hoodie.extend(hoodieConnection);

  // * hoodie.open
  hoodie.extend(hoodieOpen);

  // * hoodie.store
  hoodie.extend(hoodieLocalStore);

  // workaround, until we ship https://github.com/hoodiehq/hoodie.js/issues/199
  hoodie.store.patchIfNotPersistant();

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

  // * hoodie.request
  hoodie.extend(hoodieRequest);


  //
  // Initializations
  //

  // init config
  hoodie.config.init();

  // init hoodieId
  hoodie.id.init();

  // set username from config (local store)
  hoodie.account.username = hoodie.config.get('_account.username');

  // init hoodie.remote API
  hoodie.remote.init();

  // check for pending password reset
  hoodie.account.checkPasswordReset();

  // hoodie.id
  hoodie.id.subscribeToOutsideEvents();

  // hoodie.config
  hoodie.config.subscribeToOutsideEvents();

  // hoodie.store
  hoodie.store.subscribeToOutsideEvents();
  hoodie.store.bootstrapDirtyObjects();

  // hoodie.remote
  hoodie.remote.subscribeToOutsideEvents();

  // hoodie.task
  hoodie.task.subscribeToOutsideEvents();

  // authenticate
  // we use a closure to not pass the username to connect, as it
  // would set the name of the remote store, which is not the username.
  hoodie.account.authenticate().then(function( /* username */ ) {
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
    extensions[i](hoodie, lib, util);
  }
}

module.exports = Hoodie;

},{"./hoodie/account":3,"./hoodie/connection":4,"./hoodie/id":5,"./hoodie/open":6,"./hoodie/remote":7,"./hoodie/request":8,"./hoodie/store":9,"./hoodie/task":10,"./lib":17,"./lib/config":11,"./lib/events":16,"./utils":26}],3:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// Hoodie.Account
// ================

var hoodieEvents = require('../lib/events');
var extend = require('extend');
var generateId = require('../utils/generate_id');

var getDefer = require('../utils/promise/defer');
var reject = require('../utils/promise/reject');
var resolve = require('../utils/promise/resolve');
var rejectWith = require('../utils/promise/reject_with');
var resolveWith = require('../utils/promise/resolve_with');

//
function hoodieAccount(hoodie) {
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
  hoodieEvents(hoodie, {
    context: account,
    namespace: 'account'
  });

  // Authenticate
  // --------------

  // Use this method to assure that the user is authenticated:
  // `hoodie.account.authenticate().done( doSomething ).fail( handleError )`
  //
  account.authenticate = function authenticate() {
    var sendAndHandleAuthRequest;

    // already tried to authenticate, and failed
    if (authenticated === false) {
      return reject();
    }

    // already tried to authenticate, and succeeded
    if (authenticated === true) {
      return resolveWith(account.username);
    }

    // if there is a pending signOut request, return its promise,
    // but pipe it so that it always ends up rejected
    //
    if (requests.signOut && requests.signOut.state() === 'pending') {
      return requests.signOut.then(reject);
    }

    // if there is a pending signIn request, return its promise
    //
    if (requests.signIn && requests.signIn.state() === 'pending') {
      return requests.signIn;
    }

    // if user has no account, make sure to end the session
    if (!account.hasAccount()) {
      return sendSignOutRequest().then(function() {
        authenticated = false;
        return reject();
      });
    }

    // send request to check for session status. If there is a
    // pending request already, return its promise.
    //
    sendAndHandleAuthRequest = function() {
      return account.request('GET', '/_session').then(
      handleAuthenticateRequestSuccess);
    };

    return withSingleRequest('authenticate', sendAndHandleAuthRequest);
  };


  // hasValidSession
  // -----------------

  // returns true if the user is signed in, and has a valid cookie.
  //
  account.hasValidSession = function() {
    if (!account.hasAccount()) {
      return false;
    }

    return authenticated === true;
  };


  // hasInvalidSession
  // -----------------

  // returns true if the user is signed in, but does not have a valid cookie 
  //
  account.hasInvalidSession = function() {
    if (!account.hasAccount()) {
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
      return rejectWith('Username must be set.');
    }

    if (account.hasAnonymousAccount()) {
      return upgradeAnonymousAccount(username, password);
    }

    if (account.hasAccount()) {
      return rejectWith('Must sign out first.');
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
    handleSignUpSuccess(username, password), handleSignUpError(username));
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

    password = generateId(10);
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
      if (!options.moveData) {
        return signOutAndSignIn();
      }

      return hoodie.store.findAll().then(function(data) {
        currentData = data;
      }).then(signOutAndSignIn).done(function() {
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

    return pushLocalChanges(options).then(hoodie.remote.disconnect).then(sendSignOutRequest).then(cleanupAndTriggerSignOut);
  };


  // Request
  // ---

  // shortcut
  //
  account.request = function accountRequest(type, path, options) {
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
      return rejectWith({
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
      return rejectWith({
        name: 'HoodieUnauthorizedError',
        message: 'Not signed in'
      });
    }

    hoodie.remote.disconnect();

    return account.fetch().then(
    sendChangeUsernameAndPasswordRequest(currentPassword, null, newPassword));
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

    resetPasswordId = '' + username + '/' + (generateId());

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
      return account.request('PUT', '/_users/' + (encodeURIComponent(key)), options).done(account.checkPasswordReset).then(awaitPasswordResetResult);
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
      return rejectWith('No pending password reset.');
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

    return withSingleRequest('passwordResetStatus', function() {
      return account.request('GET', url, options).then(
      handlePasswordResetStatusRequestSuccess, handlePasswordResetStatusRequestError).fail(function(error) {
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
    if (newUsername !== account.username) {
      newUsername = newUsername || '';
      return changeUsernameAndPassword(currentPassword, newUsername.toLowerCase());
    }
    return rejectWith({
      name: 'HoodieConflictError',
      message: 'Usernames identical'
    });
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
    handleFetchBeforeDestroySuccess, handleFetchBeforeDestroyError).then(cleanupAndTriggerSignOut);
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
  function reauthenticate() {
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
      return resolveWith(account.username);
    }

    if (account.hasAnonymousAccount()) {
      return account.signIn(account.username, getAnonymousPassword());
    }

    authenticated = false;
    account.trigger('error:unauthenticated');
    return reject();
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
  // Error passed for request looks like this
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
      return rejectWith(error);
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
      defer = getDefer();
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

      defer = getDefer();
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
    return rejectWith(error);
  }


  //
  // If the error is a 401, it's exactly what we've been waiting for.
  // In this case we resolve the promise.
  //
  function handlePasswordResetStatusRequestError(error) {
    if (error.name === 'HoodieUnauthorizedError') {
      hoodie.config.unset('_account.resetPasswordId');
      account.trigger('passwordreset');

      return resolve();
    } else {
      return rejectWith(error);
    }
  }


  //
  // wait until a password reset gets either completed or marked as failed
  // and resolve / reject respectively
  //
  function awaitPasswordResetResult() {
    var defer = getDefer();

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
      sendChangeUsernameAndPasswordRequest(currentPassword, newUsername, newPassword));
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
      return resolve();
    } else {
      return rejectWith(error);
    }
  }

  //
  // remove everything form the current account, so a new account can be initiated.
  //
  function cleanup() {

    // allow other modules to clean up local data & caches
    account.trigger('cleanup');
    authenticated = undefined;
    setUsername(undefined);

    return resolve();
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
  // its hoodie.id (see `anonymousSignUp`)
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
      if (newPassword !== undefined) {
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
          handleChangeUsernameAndPasswordResponse(newUsername, newPassword || currentPassword)
        );
      });

    };
  }


  //
  // depending on whether a newUsername has been passed, we can sign in right away
  // or have to wait until the worker removed the old account
  //
  function handleChangeUsernameAndPasswordResponse(newUsername, newPassword) {

    return function() {
      hoodie.remote.disconnect();

      if (newUsername) {
        // note that if username has been changed, newPassword is the current password.
        // We always change either the one, or the other.
        return awaitCurrentAccountRemoved(account.username, newPassword).then( function() {
          return account.signIn(newUsername, newPassword);
        });
      } else {
        return account.signIn(account.username, newPassword);
      }
    };
  }

  //
  // keep sending sign in requests until the server returns a 401
  //
  function awaitCurrentAccountRemoved(username, password, defer) {
    if (!defer) {
      defer = getDefer();
    }

    var requestOptions = {
      data: {
        name: userTypeAndId(username),
        password: password
      }
    };

    withPreviousRequestsAborted('signIn', function() {
      return account.request('POST', '/_session', requestOptions);
    }).done(function() {
      global.setTimeout(awaitCurrentAccountRemoved, 300, username, password, defer);
    }).fail(function(error) {
      if (error.status === 401) {
        return defer.resolve();
      }

      defer.reject(error);
    });

    return defer.promise();
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
    if (hoodie.store.hasLocalChanges() && !options.ignoreLocalChanges) {
      return hoodie.remote.push();
    }
    return resolve();
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
      handleSignInSuccess(options));
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

},{"../lib/events":16,"../utils/generate_id":24,"../utils/promise/defer":28,"../utils/promise/reject":31,"../utils/promise/reject_with":32,"../utils/promise/resolve":33,"../utils/promise/resolve_with":34,"extend":1}],4:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// hoodie.checkConnection() & hoodie.isConnected()
// =================================================


var reject = require('../utils/promise/reject');
var resolve = require('../utils/promise/resolve');

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

    return resolve();
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

    return reject();
  }
}

module.exports = hoodieConnection;

},{"../utils/promise/reject":31,"../utils/promise/resolve":33}],5:[function(require,module,exports){
// hoodie.id
// =========

var generateId = require('../utils/generate_id');

// generates a random id and persists using hoodie.config
// until the user signs out or deletes local data
function hoodieId (hoodie) {
  var id;

  function getId() {
    if (! id) {
      setId( generateId() );
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

    // DEPRECATED, remove before 1.0
    if (! id) {
      hoodie.config.get('_account.ownerHash');
    }
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

},{"../utils/generate_id":24}],6:[function(require,module,exports){
// Open stores
// -------------

var hoodieRemoteStore = require('../lib/store/remote');
var extend = require('extend');

function hoodieOpen(hoodie) {

  // generic method to open a store.
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

},{"../lib/store/remote":20,"extend":1}],7:[function(require,module,exports){
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
// Note that hoodieRemote must be initialized before the
// API is available:
// 
//     hoodieRemote(hoodie);
//     hoodie.remote.init();
//

var rejectWith = require('../utils/promise/reject_with');

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
      return rejectWith('User has no database to connect to');
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

function hoodieRemoteFactory(hoodie) {

  var init = function() {
    hoodieRemote(hoodie);
  };

  hoodie.remote = {
    init: init
  };
}

module.exports = hoodieRemoteFactory;

},{"../utils/promise/reject_with":32}],8:[function(require,module,exports){
//
// hoodie.request
// ================

// Hoodie's central place to send request to its backend.
// At the moment, it's a wrapper around jQuery's ajax method,
// but we might get rid of this dependency in the future.
//
// It has build in support for CORS and a standard error
// handling that normalizes errors returned by CouchDB
// to JavaScript's native conventions of errors having
// a name & a message property.
//
// Common errors to expect:
//
// * HoodieRequestError
// * HoodieUnauthorizedError
// * HoodieConflictError
// * HoodieServerError

var hoodiefyRequestErrorName = require('../utils/hoodiefy_request_error_name');
var extend = require('extend');
var rejectWith = require('../utils/promise/reject_with');

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

    return rejectWith(error).promise();
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

  //
  // public API
  //
  hoodie.request = request;
}

module.exports = hoodieRequest;

},{"../utils/hoodiefy_request_error_name":25,"../utils/promise/reject_with":32,"extend":1}],9:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// LocalStore
// ============

//
var hoodieStoreApi = require('../lib/store/api');
var HoodieObjectTypeError = require('../lib/error/object_type');
var HoodieObjectIdError = require('../lib/error/object_id');
var generateId = require('../utils/generate_id');

var extend = require('extend');

var getDefer = require('../utils/promise/defer');
var rejectWith = require('../utils/promise/reject_with');
var resolveWith = require('../utils/promise/resolve_with');

var localStorageWrapper = require('../utils').localStorageWrapper;

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
      object.id = generateId();
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

    defer = getDefer();

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
        return rejectWith({
          name: 'HoodieNotFoundError',
          message: '"{{type}}" with id "{{id}}" could not be found'
        });
      }
      return resolveWith(object);
    } catch (_error) {
      error = _error;
      return rejectWith(error);
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

    defer = getDefer();

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
      localStorageWrapper.removeItem(key);
      objectWasMarkedAsDeleted = cachedObject[key] && isMarkedAsDeleted(cachedObject[key]);
      cachedObject[key] = false;
      clearChanged(type, id);
      if (objectWasMarkedAsDeleted && object) {
        return resolveWith(object);
      }
    }

    if (!object) {
      return rejectWith({
        name: 'HoodieNotFoundError',
        message: '"{{type}}" with id "{{id}}"" could not be found'
      });
    }

    if (object._syncedAt) {
      object._deleted = true;
      cache(type, id, object);
    } else {
      key = type + '/' + id;
      localStorageWrapper.removeItem(key);
      cachedObject[key] = false;
      clearChanged(type, id);
    }

    // https://github.com/hoodiehq/hoodie.js/issues/147
    if (options.update) {
      object = options.update;
      delete options.update;
    }
    triggerEvents('remove', object, options);
    return resolveWith(object);
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
    for (i = _i = 0, _ref = localStorageWrapper.length(); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      key = localStorageWrapper.key(i);
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
    defer = getDefer();
    try {
      keys = store.index();
      results = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          key = keys[_i];
          if (isSemanticKey(key)) {
            _results.push(localStorageWrapper.removeItem(key));
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

  //
  // Private methods
  // -----------------
  //


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

      localStorageWrapper.setObject(key, object);

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

      key = '' + type + '/' + id;

      // if object is not yet cached, load it from localStore
      object = localStorageWrapper.getObject(key);

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
    keys = localStorageWrapper.getItem('_dirty');

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
    hoodie.on('remote:bootstrap:error', abortBootstrappingMode);

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

  // store IDs of dirty objects
  function saveDirtyIds() {
    try {
      if ($.isEmptyObject(dirty)) {
        localStorageWrapper.removeItem('_dirty');
      } else {
        var ids = Object.keys(dirty);
        localStorageWrapper.setItem('_dirty', ids.join(','));
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
  function abortBootstrappingMode(error) {
    var methodCall, defer;

    bootstrapping = false;
    while(queue.length > 0) {
      methodCall = queue.shift();
      defer = methodCall[2];
      defer.reject(error);
    }

    store.trigger('bootstrap:error', error);
  }

  //
  function enqueue(method, args) {
    var defer = getDefer();
    queue.push([method, args, defer]);
    return defer.promise();
  }

  //
  // patchIfNotPersistant
  //
  localStorageWrapper.patchIfNotPersistant();

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
    localStorageWrapper.patchIfNotPersistant();
    delete store.patchIfNotPersistant;
  };
}

module.exports = hoodieStore;

},{"../lib/error/object_id":14,"../lib/error/object_type":15,"../lib/store/api":18,"../utils":26,"../utils/generate_id":24,"../utils/promise/defer":28,"../utils/promise/reject_with":32,"../utils/promise/resolve_with":34,"extend":1}],10:[function(require,module,exports){
// Tasks
// ============

// This class defines the hoodie.task API.
//
// The returned API provides the following methods:
//
// * start
// * abort
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
//     emailTasks.abort('id123');
//
var hoodieEvents = require('../lib/events');
var hoodieScopedTask = require('../lib/task/scoped');
var HoodieError = require('../lib/error/error');

var extend = require('extend');

var getDefer = require('../utils/promise/defer');

//
function hoodieTask(hoodie) {

  // public API
  var api = function api(type, id) {
      return hoodieScopedTask(hoodie, api, {
        type: type,
        id: id
      });
    };

  // add events API
  hoodieEvents(hoodie, {
    context: api,
    namespace: 'task'
  });


  // start
  // -------

  // start a new task. If the user has no account yet, hoodie tries to sign up
  // for an anonymous account in the background. If that fails, the returned
  // promise will be rejected.
  //
  api.start = function(type, properties) {
    if (hoodie.account.hasAccount()) {
      return hoodie.store.add('$' + type, properties).then(handleNewTask);
    }

    return hoodie.account.anonymousSignUp().then(function() {
      return api.start(type, properties);
    });
  };


  // abort
  // -------

  // abort a running task
  //
  api.abort = function(type, id) {
    return hoodie.store.update('$' + type, id, {
      abortedAt: now()
    }).then(handleAbortedTaskObject);
  };


  // restart
  // ---------

  // first, we try to abort a running task. If that succeeds, we start
  // a new one with the same properties as the original
  //
  api.restart = function(type, id, update) {
    var start = function(object) {
      extend(object, update);
      delete object.$error;
      delete object.$processedAt;
      delete object.abortedAt;
      return api.start(object.type, object);
    };
    return api.abort(type, id).then(start);
  };

  // abortAll
  // -----------

  //
  api.abortAll = function(type) {
    return findAll(type).then(abortTaskObjects);
  };

  // restartAll
  // -----------

  //
  api.restartAll = function(type, update) {

    if (typeof type === 'object') {
      update = type;
    }
    return findAll(type).then(function(taskObjects) {
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
    var defer = getDefer();
    var taskStore = hoodie.store(object.type, object.id);

    taskStore.on('remove', function(object) {

      // remove "$" from type
      object.type = object.type.substr(1);

      // task finished by worker.
      if (object.$processedAt) {
        return defer.resolve(object);
      }

      // manually removed / aborted.
      defer.reject(new HoodieError({
        message: 'Task has been aborted',
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
  function handleAbortedTaskObject(taskObject) {
    var defer;
    var type = taskObject.type; // no need to prefix with $, it's already prefixed.
    var id = taskObject.id;
    var removePromise = hoodie.store.remove(type, id);

    if (!taskObject._rev) {
      // task has not yet been synced.
      return removePromise;
    }

    defer = getDefer();
    hoodie.one('store:sync:' + type + ':' + id, defer.resolve);
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
  function findAll(type) {
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
  function abortTaskObjects(taskObjects) {
    return taskObjects.map(function(taskObject) {
      return api.abort(taskObject.type.substr(1), taskObject.id);
    });
  }

  //
  function restartTaskObjects(taskObjects, update) {
    return taskObjects.map(function(taskObject) {
      return api.restart(taskObject.type.substr(1), taskObject.id, update);
    });
  }

  // this is where all the task events get triggered,
  // like add:message, change:message:abc4567, remove, etc.
  function triggerEvents(eventName, task, options) {
    var error;

    // "new" tasks are trigger as "start" events
    if (eventName === 'add') {
      eventName = 'start';
    }

    if (eventName === 'remove' && task.abortedAt) {
      eventName = 'abort';
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
    if (eventName !== 'start' && eventName !== 'abort' && eventName !== 'success') {
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

},{"../lib/error/error":12,"../lib/events":16,"../lib/task/scoped":23,"../utils/promise/defer":28,"extend":1}],11:[function(require,module,exports){
// Hoodie Config API
// ===================

var localStorageWrapper = require('../utils').localStorageWrapperWrapper;

//
function hoodieConfig(hoodie) {

  var CONFIG_STORE_KEY = '_hoodie_config';
  var cache = {};

  // public API
  var config = {};


  // set
  // ----------

  // adds a configuration
  //
  config.set = function set(key, value) {
    cache[key] = value;
    localStorageWrapper.setObject(CONFIG_STORE_KEY, cache);
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

  // clears cache and removes object from localStorageWrapper
  //
  config.clear = function clear() {
    cache = {};
    return localStorageWrapper.removeItem(CONFIG_STORE_KEY);
  };

  // unset
  // ----------

  // unsets a configuration. If configuration is present, calls
  // config.set(key, undefined).
  //
  config.unset = function unset(key) {
    delete cache[key];
    localStorageWrapper.setObject(CONFIG_STORE_KEY, cache);
  };

  //
  // load current configuration from localStore.
  // The init method to be called on hoodie startup
  //
  function init() {
    cache = localStorageWrapper.getObject(CONFIG_STORE_KEY);
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

}

module.exports = hoodieConfig;


},{"../utils":26}],12:[function(require,module,exports){
// Hoodie Error
// -------------

// With the custom hoodie error function
// we normalize all errors the get returned
// when using hoodie's rejectWith
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

  properties.message = properties.message.replace(errorMessageReplacePattern, function(match) {
    var property = match.match(errorMessageFindPropertyPattern)[0];
    return properties[property];
  });
  extend(this, properties);
}
HoodieError.prototype = new Error();
HoodieError.prototype.constructor = HoodieError;

module.exports = HoodieError;


},{"extend":1}],13:[function(require,module,exports){
module.exports = {
  error: require('./error'),
  objectId: require('./object_id'),
  objectType: require('./object_type')
};

},{"./error":12,"./object_id":14,"./object_type":15}],14:[function(require,module,exports){
// Hoodie Invalid Type Or Id Error
// -------------------------------

// only lowercase letters, numbers and dashes
// are allowed for object IDs.
//
var HoodieError = require('./error');

//
function HoodieObjectIdError(properties) {
  properties.name = 'HoodieObjectIdError';
  properties.message = '"{{id}}" is invalid object id. {{rules}}.';

  return new HoodieError(properties);
}
var validIdPattern = /^[a-z0-9\-]+$/;
HoodieObjectIdError.isInvalid = function(id, customPattern) {
  return !(customPattern || validIdPattern).test(id || '');
};
HoodieObjectIdError.isValid = function(id, customPattern) {
  return (customPattern || validIdPattern).test(id || '');
};
HoodieObjectIdError.prototype.rules = 'Lowercase letters, numbers and dashes allowed only. Must start with a letter';

module.exports = HoodieObjectIdError;

},{"./error":12}],15:[function(require,module,exports){
// Hoodie Invalid Type Or Id Error
// -------------------------------

// only lowercase letters, numbers and dashes
// are allowed for object types, plus must start
// with a letter.
//
var HoodieError = require('./error');

// Hoodie Invalid Type Or Id Error
// -------------------------------

// only lowercase letters, numbers and dashes
// are allowed for object types, plus must start
// with a letter.
//
function HoodieObjectTypeError(properties) {
  properties.name = 'HoodieObjectTypeError';
  properties.message = '"{{type}}" is invalid object type. {{rules}}.';

  return new HoodieError(properties);
}
var validTypePattern = /^[a-z$][a-z0-9]+$/;
HoodieObjectTypeError.isInvalid = function(type, customPattern) {
  return !(customPattern || validTypePattern).test(type || '');
};
HoodieObjectTypeError.isValid = function(type, customPattern) {
  return (customPattern || validTypePattern).test(type || '');
};
HoodieObjectTypeError.prototype.rules = 'lowercase letters, numbers and dashes allowed only. Must start with a letter';

module.exports = HoodieObjectTypeError;

},{"./error":12}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
module.exports = {
  error: require('./error'),
  events: require('./events'),
  store: require('./store'),
  task: require('./task')
};

},{"./error":13,"./events":16,"./store":19,"./task":22}],18:[function(require,module,exports){
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
var hoodieScopedStoreApi = require('./scoped');
var hoodieEvents = require('../events');
var HoodieError = require('../error/error');
var HoodieObjectTypeError = require('../error/object_type');
var HoodieObjectIdError = require('../error/object_id');
var extend = require('extend');

var getDefer = require('../../utils/promise/defer');
var rejectWith = require('../../utils/promise/reject_with');
var resolveWith = require('../../utils/promise/resolve_with');
var isPromise = require('../../utils/promise/is_promise');

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
    var scopedOptions = extend(true, {
      type: type,
      id: id
    }, options);
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
    api.validate = function(object /*, options */ ) {

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
      return rejectWith(error);
    }

    return decoratePromise(backend.save(object, options || {}));
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

    return decoratePromise(backend.find(type, id));
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
    return decoratePromise(promise);
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
        return resolveWith(currentObject);
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
        return resolveWith(newObj);
      }

      //apply update
      return api.save(type, id, newObj, options);
    }

    // promise decorations get lost when piped through `then`,
    // that's why we need to decorate the find's promise again.
    var promise = api.find(type, id).then(handleFound);
    return decoratePromise(promise);
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

    return decoratePromise(promise);
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
    case isPromise(filterOrObjects):
      promise = filterOrObjects;
      break;
    case $.isArray(filterOrObjects):
      promise = getDefer().resolve(filterOrObjects).promise();
      break;
    default:
      // e.g. null, update all
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

    return decoratePromise(promise);
  };


  // Remove
  // ------------

  // Removes one object specified by `type` and `id`.
  //
  // when object has been synced before, mark it as deleted.
  // Otherwise remove it from Store.
  //
  api.remove = function remove(type, id, options) {
    return decoratePromise(backend.remove(type, id, options || {}));
  };


  // removeAll
  // -----------

  // Destroye all objects. Can be filtered by a type
  //
  api.removeAll = function removeAll(type, options) {
    return decoratePromise(backend.removeAll(type, options || {}));
  };


  // decorate promises
  // -------------------

  // extend promises returned by store.api
  api.decoratePromises = function decoratePromises(methods) {
    return extend(promiseApi, methods);
  };



  // required backend methods
  // -------------------------
  if (!options.backend) {
    throw new Error('options.backend must be passed');
  }

  var required = 'save find findAll remove removeAll'.split(' ');

  required.forEach(function(methodName) {

    if (!options.backend[methodName]) {
      throw new Error('options.backend.' + methodName + ' must be passed.');
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

},{"../../utils/promise/defer":28,"../../utils/promise/is_promise":30,"../../utils/promise/reject_with":32,"../../utils/promise/resolve_with":34,"../error/error":12,"../error/object_id":14,"../error/object_type":15,"../events":16,"./scoped":21,"extend":1}],19:[function(require,module,exports){
module.exports = {
  api: require('./api'),
  remote: require('./remote'),
  scoped: require('./scoped')
};

},{"./api":18,"./remote":20,"./scoped":21}],20:[function(require,module,exports){
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

var hoodieStoreApi = require('./api');
var extend = require('extend');
var generateId = require('../../utils/generate_id');
var resolveWith = require('../../utils/promise/resolve_with');

//
function hoodieRemoteStore(hoodie, options) {

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
      object.id = generateId();
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

  // wrapper for hoodie's request, with some store specific defaults
  // and a prefixed path
  //
  remote.request = function remoteRequest(type, path, options) {
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
    return remote.bootstrap().then(function() {
      remote.push();
    });
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
    return remote.pull().done(handleBootstrapSuccess).fail(handleBootstrapError);
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
      return resolveWith([]);
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
    _ref = id.match(/([^\/]+)\/(.*)/), ignore = _ref[0], object.type = _ref[1], object.id = _ref[2];

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
      _ref = attributes._rev.split(/-/), currentRevNr = _ref[0], currentRevId = _ref[1];
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
    return generateId(9);
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


  // ### handle initial bootstrapping from remote
  //
  function handleBootstrapSuccess() {
    isBootstrapping = false;
    remote.trigger('bootstrap:end');
  }

  // ### handle error of initial bootstrapping from remote
  //
  function handleBootstrapError(error) {
    isBootstrapping = false;
    remote.trigger('bootstrap:error', error);
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

},{"../../utils/generate_id":24,"../../utils/promise/resolve_with":34,"./api":18,"extend":1}],21:[function(require,module,exports){
// scoped Store
// ============

// same as store, but with type preset to an initially
// passed value.
//
var hoodieEvents = require('../events');

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

},{"../events":16}],22:[function(require,module,exports){
module.exports = {
  scoped: require('./scoped')
};

},{"./scoped":23}],23:[function(require,module,exports){
// scoped Store
// ============

// same as store, but with type preset to an initially
// passed value.
//
var hoodieEvents = require('../events');

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
    api.abort = function abort(id) {
      return taskApi.abort(type, id);
    };

    //
    api.restart = function restart(id, update) {
      return taskApi.restart(type, id, update);
    };

    //
    api.abortAll = function abortAll() {
      return taskApi.abortAll(type);
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
    api.abort = function abort() {
      return taskApi.abort(type, id);
    };

    //
    api.restart = function restart(update) {
      return taskApi.restart(type, id, update);
    };
  }

  return api;
}

module.exports = hoodieScopedTask;

},{"../events":16}],24:[function(require,module,exports){
var chars, i, radix;

// uuids consist of numbers and lowercase letters only.
// We stick to lowercase letters to prevent confusion
// and to prevent issues with CouchDB, e.g. database
// names do wonly allow for lowercase letters.
chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
radix = chars.length;

// helper to generate unique ids.
function generateId (length) {
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

module.exports = generateId;

},{}],25:[function(require,module,exports){
var findLettersToUpperCase = /(^\w|_\w)/g;

function hoodiefyRequestErrorName (name) {
  name = name.replace(findLettersToUpperCase, function (match) {
    return (match[1] || match[0]).toUpperCase();
  });

  return 'Hoodie' + name + 'Error';
}

module.exports = hoodiefyRequestErrorName;
},{}],26:[function(require,module,exports){
module.exports = {
  generateId: require('./generate_id'),
  promise: require('./promise'),
  localStorageWrapper: require('./localStorageWrapper')
};


},{"./generate_id":24,"./localStorageWrapper":27,"./promise":29}],27:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};var extend = require('extend');

// Is persistant?
// ----------------
//

exports.patchIfNotPersistant = function () {

  if (!exports.isPersistent()) {
    module.exports = {
      getItem: function() { return null; },
      setItem: function() { return null; },
      removeItem: function() { return null; },
      key: function() { return null; },
      length: function() { return 0; }
    };
  }

};

// returns `true` or `false` depending on whether localStorage is supported or not.
// Beware that some browsers like Safari do not support localStorage in private mode.
//
// inspired by this cappuccino commit
// https://github.com/cappuccino/cappuccino/commit/063b05d9643c35b303568a28809e4eb3224f71ec
//

exports.isPersistent = function () {
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

exports.setItem = function (name, item) {

  if (typeof item === 'object') {
    global.localStorage.setItem(name, window.JSON.stringify(item));
  } else {
    global.localStorage.setItem(name, item);
  }

};

exports.getItem = function (name) {
  var item = global.localStorage.getItem(name);

  if (typeof item !== 'undefined') {
    try {
      item = global.JSON.parse(item);
    } catch (e) {}
  }

  return item;
};

exports.removeItem = function (name) {
  return global.localStorage.removeItem(name);
};

exports.clear = function () {
  return global.localStorage.clear();
};

exports.key = function (nr) {
  return global.localStorage.key(nr);
};

exports.length = function () {
  return global.localStorage.length;
};

// more advanced localStorage wrappers to find/save objects
exports.setObject = function (key, object) {
  var store = extend({}, object);

  delete store.type;
  delete store.id;
  return exports.setItem(key, global.JSON.stringify(store));
};

exports.getObject = function (key) {
  return exports.getItem(key) ? exports.getItem(key) : false;
};


},{"extend":1}],28:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};module.exports = global.jQuery.Deferred;
},{}],29:[function(require,module,exports){
module.exports = {
  defer: require('./defer'),
  isPromise: require('./is_promise'),
  rejectWith: require('./reject_with'),
  reject: require('./reject'),
  resolveWith: require('./resolve_with'),
  resolve: require('./resolve'),
};

},{"./defer":28,"./is_promise":30,"./reject":31,"./reject_with":32,"./resolve":33,"./resolve_with":34}],30:[function(require,module,exports){
// returns true if passed object is a promise (but not a deferred),
// otherwise false.
function isPromise(object) {
  return !! (object &&
             typeof object.done === 'function' &&
             typeof object.resolve !== 'function');
}

module.exports = isPromise;
},{}],31:[function(require,module,exports){
var defer = require('./defer');
//
function reject() {
  return defer().reject().promise();
}

module.exports = reject;
},{"./defer":28}],32:[function(require,module,exports){
var getDefer = require('./defer');
var HoodieError = require('../../lib/error/error');

//
function rejectWith(errorProperties) {
  var error = new HoodieError(errorProperties);
  return getDefer().reject(error).promise();
}

module.exports = rejectWith;

},{"../../lib/error/error":12,"./defer":28}],33:[function(require,module,exports){
var defer = require('./defer');
//
function resolve() {
  return defer().resolve().promise();
}

module.exports = resolve;
},{"./defer":28}],34:[function(require,module,exports){
var getDefer = require('./defer');

//
function resolveWith() {
  var defer = getDefer();
  return defer.resolve.apply(defer, arguments).promise();
}

module.exports = resolveWith;

},{"./defer":28}]},{},[2])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc3ZlbmxpdG8vUHJvamVjdHMvaG9vZGllL2hvb2RpZS5qcy9ub2RlX21vZHVsZXMvZXh0ZW5kL2luZGV4LmpzIiwiL1VzZXJzL3N2ZW5saXRvL1Byb2plY3RzL2hvb2RpZS9ob29kaWUuanMvc3JjL2hvb2RpZS5qcyIsIi9Vc2Vycy9zdmVubGl0by9Qcm9qZWN0cy9ob29kaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvYWNjb3VudC5qcyIsIi9Vc2Vycy9zdmVubGl0by9Qcm9qZWN0cy9ob29kaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvY29ubmVjdGlvbi5qcyIsIi9Vc2Vycy9zdmVubGl0by9Qcm9qZWN0cy9ob29kaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvaWQuanMiLCIvVXNlcnMvc3ZlbmxpdG8vUHJvamVjdHMvaG9vZGllL2hvb2RpZS5qcy9zcmMvaG9vZGllL29wZW4uanMiLCIvVXNlcnMvc3ZlbmxpdG8vUHJvamVjdHMvaG9vZGllL2hvb2RpZS5qcy9zcmMvaG9vZGllL3JlbW90ZS5qcyIsIi9Vc2Vycy9zdmVubGl0by9Qcm9qZWN0cy9ob29kaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvcmVxdWVzdC5qcyIsIi9Vc2Vycy9zdmVubGl0by9Qcm9qZWN0cy9ob29kaWUvaG9vZGllLmpzL3NyYy9ob29kaWUvc3RvcmUuanMiLCIvVXNlcnMvc3ZlbmxpdG8vUHJvamVjdHMvaG9vZGllL2hvb2RpZS5qcy9zcmMvaG9vZGllL3Rhc2suanMiLCIvVXNlcnMvc3ZlbmxpdG8vUHJvamVjdHMvaG9vZGllL2hvb2RpZS5qcy9zcmMvbGliL2NvbmZpZy5qcyIsIi9Vc2Vycy9zdmVubGl0by9Qcm9qZWN0cy9ob29kaWUvaG9vZGllLmpzL3NyYy9saWIvZXJyb3IvZXJyb3IuanMiLCIvVXNlcnMvc3ZlbmxpdG8vUHJvamVjdHMvaG9vZGllL2hvb2RpZS5qcy9zcmMvbGliL2Vycm9yL2luZGV4LmpzIiwiL1VzZXJzL3N2ZW5saXRvL1Byb2plY3RzL2hvb2RpZS9ob29kaWUuanMvc3JjL2xpYi9lcnJvci9vYmplY3RfaWQuanMiLCIvVXNlcnMvc3ZlbmxpdG8vUHJvamVjdHMvaG9vZGllL2hvb2RpZS5qcy9zcmMvbGliL2Vycm9yL29iamVjdF90eXBlLmpzIiwiL1VzZXJzL3N2ZW5saXRvL1Byb2plY3RzL2hvb2RpZS9ob29kaWUuanMvc3JjL2xpYi9ldmVudHMuanMiLCIvVXNlcnMvc3ZlbmxpdG8vUHJvamVjdHMvaG9vZGllL2hvb2RpZS5qcy9zcmMvbGliL2luZGV4LmpzIiwiL1VzZXJzL3N2ZW5saXRvL1Byb2plY3RzL2hvb2RpZS9ob29kaWUuanMvc3JjL2xpYi9zdG9yZS9hcGkuanMiLCIvVXNlcnMvc3ZlbmxpdG8vUHJvamVjdHMvaG9vZGllL2hvb2RpZS5qcy9zcmMvbGliL3N0b3JlL2luZGV4LmpzIiwiL1VzZXJzL3N2ZW5saXRvL1Byb2plY3RzL2hvb2RpZS9ob29kaWUuanMvc3JjL2xpYi9zdG9yZS9yZW1vdGUuanMiLCIvVXNlcnMvc3ZlbmxpdG8vUHJvamVjdHMvaG9vZGllL2hvb2RpZS5qcy9zcmMvbGliL3N0b3JlL3Njb3BlZC5qcyIsIi9Vc2Vycy9zdmVubGl0by9Qcm9qZWN0cy9ob29kaWUvaG9vZGllLmpzL3NyYy9saWIvdGFzay9pbmRleC5qcyIsIi9Vc2Vycy9zdmVubGl0by9Qcm9qZWN0cy9ob29kaWUvaG9vZGllLmpzL3NyYy9saWIvdGFzay9zY29wZWQuanMiLCIvVXNlcnMvc3ZlbmxpdG8vUHJvamVjdHMvaG9vZGllL2hvb2RpZS5qcy9zcmMvdXRpbHMvZ2VuZXJhdGVfaWQuanMiLCIvVXNlcnMvc3ZlbmxpdG8vUHJvamVjdHMvaG9vZGllL2hvb2RpZS5qcy9zcmMvdXRpbHMvaG9vZGllZnlfcmVxdWVzdF9lcnJvcl9uYW1lLmpzIiwiL1VzZXJzL3N2ZW5saXRvL1Byb2plY3RzL2hvb2RpZS9ob29kaWUuanMvc3JjL3V0aWxzL2luZGV4LmpzIiwiL1VzZXJzL3N2ZW5saXRvL1Byb2plY3RzL2hvb2RpZS9ob29kaWUuanMvc3JjL3V0aWxzL2xvY2FsU3RvcmFnZVdyYXBwZXIuanMiLCIvVXNlcnMvc3ZlbmxpdG8vUHJvamVjdHMvaG9vZGllL2hvb2RpZS5qcy9zcmMvdXRpbHMvcHJvbWlzZS9kZWZlci5qcyIsIi9Vc2Vycy9zdmVubGl0by9Qcm9qZWN0cy9ob29kaWUvaG9vZGllLmpzL3NyYy91dGlscy9wcm9taXNlL2luZGV4LmpzIiwiL1VzZXJzL3N2ZW5saXRvL1Byb2plY3RzL2hvb2RpZS9ob29kaWUuanMvc3JjL3V0aWxzL3Byb21pc2UvaXNfcHJvbWlzZS5qcyIsIi9Vc2Vycy9zdmVubGl0by9Qcm9qZWN0cy9ob29kaWUvaG9vZGllLmpzL3NyYy91dGlscy9wcm9taXNlL3JlamVjdC5qcyIsIi9Vc2Vycy9zdmVubGl0by9Qcm9qZWN0cy9ob29kaWUvaG9vZGllLmpzL3NyYy91dGlscy9wcm9taXNlL3JlamVjdF93aXRoLmpzIiwiL1VzZXJzL3N2ZW5saXRvL1Byb2plY3RzL2hvb2RpZS9ob29kaWUuanMvc3JjL3V0aWxzL3Byb21pc2UvcmVzb2x2ZS5qcyIsIi9Vc2Vycy9zdmVubGl0by9Qcm9qZWN0cy9ob29kaWUvaG9vZGllLmpzL3NyYy91dGlscy9wcm9taXNlL3Jlc29sdmVfd2l0aC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbG9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyNEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbndCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iaikge1xuXHRpZiAoIW9iaiB8fCB0b1N0cmluZy5jYWxsKG9iaikgIT09ICdbb2JqZWN0IE9iamVjdF0nIHx8IG9iai5ub2RlVHlwZSB8fCBvYmouc2V0SW50ZXJ2YWwpXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdHZhciBoYXNfb3duX2NvbnN0cnVjdG9yID0gaGFzT3duLmNhbGwob2JqLCAnY29uc3RydWN0b3InKTtcblx0dmFyIGhhc19pc19wcm9wZXJ0eV9vZl9tZXRob2QgPSBoYXNPd24uY2FsbChvYmouY29uc3RydWN0b3IucHJvdG90eXBlLCAnaXNQcm90b3R5cGVPZicpO1xuXHQvLyBOb3Qgb3duIGNvbnN0cnVjdG9yIHByb3BlcnR5IG11c3QgYmUgT2JqZWN0XG5cdGlmIChvYmouY29uc3RydWN0b3IgJiYgIWhhc19vd25fY29uc3RydWN0b3IgJiYgIWhhc19pc19wcm9wZXJ0eV9vZl9tZXRob2QpXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdC8vIE93biBwcm9wZXJ0aWVzIGFyZSBlbnVtZXJhdGVkIGZpcnN0bHksIHNvIHRvIHNwZWVkIHVwLFxuXHQvLyBpZiBsYXN0IG9uZSBpcyBvd24sIHRoZW4gYWxsIHByb3BlcnRpZXMgYXJlIG93bi5cblx0dmFyIGtleTtcblx0Zm9yICgga2V5IGluIG9iaiApIHt9XG5cblx0cmV0dXJuIGtleSA9PT0gdW5kZWZpbmVkIHx8IGhhc093bi5jYWxsKCBvYmosIGtleSApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBleHRlbmQoKSB7XG5cdHZhciBvcHRpb25zLCBuYW1lLCBzcmMsIGNvcHksIGNvcHlJc0FycmF5LCBjbG9uZSxcblx0ICAgIHRhcmdldCA9IGFyZ3VtZW50c1swXSB8fCB7fSxcblx0ICAgIGkgPSAxLFxuXHQgICAgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCxcblx0ICAgIGRlZXAgPSBmYWxzZTtcblxuXHQvLyBIYW5kbGUgYSBkZWVwIGNvcHkgc2l0dWF0aW9uXG5cdGlmICggdHlwZW9mIHRhcmdldCA9PT0gXCJib29sZWFuXCIgKSB7XG5cdFx0ZGVlcCA9IHRhcmdldDtcblx0XHR0YXJnZXQgPSBhcmd1bWVudHNbMV0gfHwge307XG5cdFx0Ly8gc2tpcCB0aGUgYm9vbGVhbiBhbmQgdGhlIHRhcmdldFxuXHRcdGkgPSAyO1xuXHR9XG5cblx0Ly8gSGFuZGxlIGNhc2Ugd2hlbiB0YXJnZXQgaXMgYSBzdHJpbmcgb3Igc29tZXRoaW5nIChwb3NzaWJsZSBpbiBkZWVwIGNvcHkpXG5cdGlmICggdHlwZW9mIHRhcmdldCAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdGFyZ2V0ICE9PSBcImZ1bmN0aW9uXCIpIHtcblx0XHR0YXJnZXQgPSB7fTtcblx0fVxuXG5cdGZvciAoIDsgaSA8IGxlbmd0aDsgaSsrICkge1xuXHRcdC8vIE9ubHkgZGVhbCB3aXRoIG5vbi1udWxsL3VuZGVmaW5lZCB2YWx1ZXNcblx0XHRpZiAoIChvcHRpb25zID0gYXJndW1lbnRzWyBpIF0pICE9IG51bGwgKSB7XG5cdFx0XHQvLyBFeHRlbmQgdGhlIGJhc2Ugb2JqZWN0XG5cdFx0XHRmb3IgKCBuYW1lIGluIG9wdGlvbnMgKSB7XG5cdFx0XHRcdHNyYyA9IHRhcmdldFsgbmFtZSBdO1xuXHRcdFx0XHRjb3B5ID0gb3B0aW9uc1sgbmFtZSBdO1xuXG5cdFx0XHRcdC8vIFByZXZlbnQgbmV2ZXItZW5kaW5nIGxvb3Bcblx0XHRcdFx0aWYgKCB0YXJnZXQgPT09IGNvcHkgKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBSZWN1cnNlIGlmIHdlJ3JlIG1lcmdpbmcgcGxhaW4gb2JqZWN0cyBvciBhcnJheXNcblx0XHRcdFx0aWYgKCBkZWVwICYmIGNvcHkgJiYgKCBpc1BsYWluT2JqZWN0KGNvcHkpIHx8IChjb3B5SXNBcnJheSA9IEFycmF5LmlzQXJyYXkoY29weSkpICkgKSB7XG5cdFx0XHRcdFx0aWYgKCBjb3B5SXNBcnJheSApIHtcblx0XHRcdFx0XHRcdGNvcHlJc0FycmF5ID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRjbG9uZSA9IHNyYyAmJiBBcnJheS5pc0FycmF5KHNyYykgPyBzcmMgOiBbXTtcblxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjbG9uZSA9IHNyYyAmJiBpc1BsYWluT2JqZWN0KHNyYykgPyBzcmMgOiB7fTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBOZXZlciBtb3ZlIG9yaWdpbmFsIG9iamVjdHMsIGNsb25lIHRoZW1cblx0XHRcdFx0XHR0YXJnZXRbIG5hbWUgXSA9IGV4dGVuZCggZGVlcCwgY2xvbmUsIGNvcHkgKTtcblxuXHRcdFx0XHQvLyBEb24ndCBicmluZyBpbiB1bmRlZmluZWQgdmFsdWVzXG5cdFx0XHRcdH0gZWxzZSBpZiAoIGNvcHkgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0XHR0YXJnZXRbIG5hbWUgXSA9IGNvcHk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvLyBSZXR1cm4gdGhlIG1vZGlmaWVkIG9iamVjdFxuXHRyZXR1cm4gdGFyZ2V0O1xufTtcbiIsInZhciBnbG9iYWw9dHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9Oy8vIEhvb2RpZSBDb3JlXG4vLyAtLS0tLS0tLS0tLS0tXG4vL1xuLy8gdGhlIGRvb3IgdG8gd29ybGQgZG9taW5hdGlvbiAoYXBwcylcbi8vXG5cbnZhciBob29kaWVBY2NvdW50ID0gcmVxdWlyZSgnLi9ob29kaWUvYWNjb3VudCcpO1xudmFyIGhvb2RpZUFjY291bnRSZW1vdGUgPSByZXF1aXJlKCcuL2hvb2RpZS9yZW1vdGUnKTtcbnZhciBob29kaWVDb25uZWN0aW9uID0gcmVxdWlyZSgnLi9ob29kaWUvY29ubmVjdGlvbicpO1xudmFyIGhvb2RpZUlkID0gcmVxdWlyZSgnLi9ob29kaWUvaWQnKTtcbnZhciBob29kaWVMb2NhbFN0b3JlID0gcmVxdWlyZSgnLi9ob29kaWUvc3RvcmUnKTtcbnZhciBob29kaWVUYXNrID0gcmVxdWlyZSgnLi9ob29kaWUvdGFzaycpO1xudmFyIGhvb2RpZU9wZW4gPSByZXF1aXJlKCcuL2hvb2RpZS9vcGVuJyk7XG52YXIgaG9vZGllUmVxdWVzdCA9IHJlcXVpcmUoJy4vaG9vZGllL3JlcXVlc3QnKTtcbnZhciBob29kaWVDb25maWcgPSByZXF1aXJlKCcuL2xpYi9jb25maWcnKTtcbnZhciBob29kaWVFdmVudHMgPSByZXF1aXJlKCcuL2xpYi9ldmVudHMnKTtcblxuLy8gZm9yIHBsdWdpbnNcbnZhciBsaWIgPSByZXF1aXJlKCcuL2xpYicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbi8vIENvbnN0cnVjdG9yXG4vLyAtLS0tLS0tLS0tLS0tXG5cbi8vIFdoZW4gaW5pdGlhbGl6aW5nIGEgaG9vZGllIGluc3RhbmNlLCBhbiBvcHRpb25hbCBVUkxcbi8vIGNhbiBiZSBwYXNzZWQuIFRoYXQncyB0aGUgVVJMIG9mIHRoZSBob29kaWUgYmFja2VuZC5cbi8vIElmIG5vIFVSTCBwYXNzZWQgaXQgZGVmYXVsdHMgdG8gdGhlIGN1cnJlbnQgZG9tYWluLlxuLy9cbi8vICAgICAvLyBpbml0IGEgbmV3IGhvb2RpZSBpbnN0YW5jZVxuLy8gICAgIGhvb2RpZSA9IG5ldyBIb29kaWVcbi8vXG5mdW5jdGlvbiBIb29kaWUoYmFzZVVybCkge1xuICB2YXIgaG9vZGllID0gdGhpcztcblxuICAvLyBlbmZvcmNlIGluaXRpYWxpemF0aW9uIHdpdGggYG5ld2BcbiAgaWYgKCEoaG9vZGllIGluc3RhbmNlb2YgSG9vZGllKSkge1xuICAgIHRocm93IG5ldyBFcnJvcigndXNhZ2U6IG5ldyBIb29kaWUodXJsKTsnKTtcbiAgfVxuXG4gIC8vIHJlbW92ZSB0cmFpbGluZyBzbGFzaGVzXG4gIGhvb2RpZS5iYXNlVXJsID0gYmFzZVVybCA/IGJhc2VVcmwucmVwbGFjZSgvXFwvKyQvLCAnJykgOiAnJztcblxuXG4gIC8vIGhvb2RpZS5leHRlbmRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gZXh0ZW5kIGhvb2RpZSBpbnN0YW5jZTpcbiAgLy9cbiAgLy8gICAgIGhvb2RpZS5leHRlbmQoZnVuY3Rpb24oaG9vZGllKSB7fSApXG4gIC8vXG4gIGhvb2RpZS5leHRlbmQgPSBmdW5jdGlvbiBleHRlbmQoZXh0ZW5zaW9uKSB7XG4gICAgZXh0ZW5zaW9uKGhvb2RpZSk7XG4gIH07XG5cblxuICAvL1xuICAvLyBFeHRlbmRpbmcgaG9vZGllIGNvcmVcbiAgLy9cblxuICAvLyAqIGhvb2RpZS5iaW5kXG4gIC8vICogaG9vZGllLm9uXG4gIC8vICogaG9vZGllLm9uZVxuICAvLyAqIGhvb2RpZS50cmlnZ2VyXG4gIC8vICogaG9vZGllLnVuYmluZFxuICAvLyAqIGhvb2RpZS5vZmZcbiAgaG9vZGllLmV4dGVuZChob29kaWVFdmVudHMpO1xuXG4gIC8vICogaG9vZGllLmlzT25saW5lXG4gIC8vICogaG9vZGllLmNoZWNrQ29ubmVjdGlvblxuICBob29kaWUuZXh0ZW5kKGhvb2RpZUNvbm5lY3Rpb24pO1xuXG4gIC8vICogaG9vZGllLm9wZW5cbiAgaG9vZGllLmV4dGVuZChob29kaWVPcGVuKTtcblxuICAvLyAqIGhvb2RpZS5zdG9yZVxuICBob29kaWUuZXh0ZW5kKGhvb2RpZUxvY2FsU3RvcmUpO1xuXG4gIC8vIHdvcmthcm91bmQsIHVudGlsIHdlIHNoaXAgaHR0cHM6Ly9naXRodWIuY29tL2hvb2RpZWhxL2hvb2RpZS5qcy9pc3N1ZXMvMTk5XG4gIGhvb2RpZS5zdG9yZS5wYXRjaElmTm90UGVyc2lzdGFudCgpO1xuXG4gIC8vICogaG9vZGllLnRhc2tcbiAgaG9vZGllLmV4dGVuZChob29kaWVUYXNrKTtcblxuICAvLyAqIGhvb2RpZS5jb25maWdcbiAgaG9vZGllLmV4dGVuZChob29kaWVDb25maWcpO1xuXG4gIC8vICogaG9vZGllLmFjY291bnRcbiAgaG9vZGllLmV4dGVuZChob29kaWVBY2NvdW50KTtcblxuICAvLyAqIGhvb2RpZS5yZW1vdGVcbiAgaG9vZGllLmV4dGVuZChob29kaWVBY2NvdW50UmVtb3RlKTtcblxuICAvLyAqIGhvb2RpZS5pZFxuICBob29kaWUuZXh0ZW5kKGhvb2RpZUlkKTtcblxuICAvLyAqIGhvb2RpZS5yZXF1ZXN0XG4gIGhvb2RpZS5leHRlbmQoaG9vZGllUmVxdWVzdCk7XG5cblxuICAvL1xuICAvLyBJbml0aWFsaXphdGlvbnNcbiAgLy9cblxuICAvLyBpbml0IGNvbmZpZ1xuICBob29kaWUuY29uZmlnLmluaXQoKTtcblxuICAvLyBpbml0IGhvb2RpZUlkXG4gIGhvb2RpZS5pZC5pbml0KCk7XG5cbiAgLy8gc2V0IHVzZXJuYW1lIGZyb20gY29uZmlnIChsb2NhbCBzdG9yZSlcbiAgaG9vZGllLmFjY291bnQudXNlcm5hbWUgPSBob29kaWUuY29uZmlnLmdldCgnX2FjY291bnQudXNlcm5hbWUnKTtcblxuICAvLyBpbml0IGhvb2RpZS5yZW1vdGUgQVBJXG4gIGhvb2RpZS5yZW1vdGUuaW5pdCgpO1xuXG4gIC8vIGNoZWNrIGZvciBwZW5kaW5nIHBhc3N3b3JkIHJlc2V0XG4gIGhvb2RpZS5hY2NvdW50LmNoZWNrUGFzc3dvcmRSZXNldCgpO1xuXG4gIC8vIGhvb2RpZS5pZFxuICBob29kaWUuaWQuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG5cbiAgLy8gaG9vZGllLmNvbmZpZ1xuICBob29kaWUuY29uZmlnLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpO1xuXG4gIC8vIGhvb2RpZS5zdG9yZVxuICBob29kaWUuc3RvcmUuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG4gIGhvb2RpZS5zdG9yZS5ib290c3RyYXBEaXJ0eU9iamVjdHMoKTtcblxuICAvLyBob29kaWUucmVtb3RlXG4gIGhvb2RpZS5yZW1vdGUuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG5cbiAgLy8gaG9vZGllLnRhc2tcbiAgaG9vZGllLnRhc2suc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG5cbiAgLy8gYXV0aGVudGljYXRlXG4gIC8vIHdlIHVzZSBhIGNsb3N1cmUgdG8gbm90IHBhc3MgdGhlIHVzZXJuYW1lIHRvIGNvbm5lY3QsIGFzIGl0XG4gIC8vIHdvdWxkIHNldCB0aGUgbmFtZSBvZiB0aGUgcmVtb3RlIHN0b3JlLCB3aGljaCBpcyBub3QgdGhlIHVzZXJuYW1lLlxuICBob29kaWUuYWNjb3VudC5hdXRoZW50aWNhdGUoKS50aGVuKGZ1bmN0aW9uKCAvKiB1c2VybmFtZSAqLyApIHtcbiAgICBob29kaWUucmVtb3RlLmNvbm5lY3QoKTtcbiAgfSk7XG5cbiAgLy8gY2hlY2sgY29ubmVjdGlvbiB3aGVuIGJyb3dzZXIgZ29lcyBvbmxpbmUgLyBvZmZsaW5lXG4gIGdsb2JhbC5hZGRFdmVudExpc3RlbmVyKCdvbmxpbmUnLCBob29kaWUuY2hlY2tDb25uZWN0aW9uLCBmYWxzZSk7XG4gIGdsb2JhbC5hZGRFdmVudExpc3RlbmVyKCdvZmZsaW5lJywgaG9vZGllLmNoZWNrQ29ubmVjdGlvbiwgZmFsc2UpO1xuXG4gIC8vIHN0YXJ0IGNoZWNraW5nIGNvbm5lY3Rpb25cbiAgaG9vZGllLmNoZWNrQ29ubmVjdGlvbigpO1xuXG4gIC8vXG4gIC8vIGxvYWRpbmcgdXNlciBleHRlbnNpb25zXG4gIC8vXG4gIGFwcGx5RXh0ZW5zaW9ucyhob29kaWUpO1xufVxuXG4vLyBFeHRlbmRpbmcgaG9vZGllXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gWW91IGNhbiBleHRlbmQgdGhlIEhvb2RpZSBjbGFzcyBsaWtlIHNvOlxuLy9cbi8vIEhvb2RpZS5leHRlbmQoZnVuY2lvbihob29kaWUpIHsgaG9vZGllLm15TWFnaWMgPSBmdW5jdGlvbigpIHt9IH0pXG4vL1xudmFyIGV4dGVuc2lvbnMgPSBbXTtcblxuSG9vZGllLmV4dGVuZCA9IGZ1bmN0aW9uKGV4dGVuc2lvbikge1xuICBleHRlbnNpb25zLnB1c2goZXh0ZW5zaW9uKTtcbn07XG5cbi8vXG4vLyBkZXRlY3QgYXZhaWxhYmxlIGV4dGVuc2lvbnMgYW5kIGF0dGFjaCB0byBIb29kaWUgT2JqZWN0LlxuLy9cbmZ1bmN0aW9uIGFwcGx5RXh0ZW5zaW9ucyhob29kaWUpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBleHRlbnNpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgZXh0ZW5zaW9uc1tpXShob29kaWUsIGxpYiwgdXRpbCk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIb29kaWU7XG4iLCJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTsvLyBIb29kaWUuQWNjb3VudFxuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgaG9vZGllRXZlbnRzID0gcmVxdWlyZSgnLi4vbGliL2V2ZW50cycpO1xudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ2V4dGVuZCcpO1xudmFyIGdlbmVyYXRlSWQgPSByZXF1aXJlKCcuLi91dGlscy9nZW5lcmF0ZV9pZCcpO1xuXG52YXIgZ2V0RGVmZXIgPSByZXF1aXJlKCcuLi91dGlscy9wcm9taXNlL2RlZmVyJyk7XG52YXIgcmVqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbHMvcHJvbWlzZS9yZWplY3QnKTtcbnZhciByZXNvbHZlID0gcmVxdWlyZSgnLi4vdXRpbHMvcHJvbWlzZS9yZXNvbHZlJyk7XG52YXIgcmVqZWN0V2l0aCA9IHJlcXVpcmUoJy4uL3V0aWxzL3Byb21pc2UvcmVqZWN0X3dpdGgnKTtcbnZhciByZXNvbHZlV2l0aCA9IHJlcXVpcmUoJy4uL3V0aWxzL3Byb21pc2UvcmVzb2x2ZV93aXRoJyk7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVBY2NvdW50KGhvb2RpZSkge1xuICAvLyBwdWJsaWMgQVBJXG4gIHZhciBhY2NvdW50ID0ge307XG5cbiAgLy8gZmxhZyB3aGV0aGVyIHVzZXIgaXMgY3VycmVudGx5IGF1dGhlbnRpY2F0ZWQgb3Igbm90XG4gIHZhciBhdXRoZW50aWNhdGVkO1xuXG4gIC8vIGNhY2hlIGZvciBDb3VjaERCIF91c2VycyBkb2NcbiAgdmFyIHVzZXJEb2MgPSB7fTtcblxuICAvLyBtYXAgb2YgcmVxdWVzdFByb21pc2VzLiBXZSBtYWludGFpbiB0aGlzIGxpc3QgdG8gYXZvaWQgc2VuZGluZ1xuICAvLyB0aGUgc2FtZSByZXF1ZXN0cyBzZXZlcmFsIHRpbWVzLlxuICB2YXIgcmVxdWVzdHMgPSB7fTtcblxuICAvLyBkZWZhdWx0IGNvdWNoREIgdXNlciBkb2MgcHJlZml4XG4gIHZhciB1c2VyRG9jUHJlZml4ID0gJ29yZy5jb3VjaGRiLnVzZXInO1xuXG4gIC8vIGFkZCBldmVudHMgQVBJXG4gIGhvb2RpZUV2ZW50cyhob29kaWUsIHtcbiAgICBjb250ZXh0OiBhY2NvdW50LFxuICAgIG5hbWVzcGFjZTogJ2FjY291bnQnXG4gIH0pO1xuXG4gIC8vIEF1dGhlbnRpY2F0ZVxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFVzZSB0aGlzIG1ldGhvZCB0byBhc3N1cmUgdGhhdCB0aGUgdXNlciBpcyBhdXRoZW50aWNhdGVkOlxuICAvLyBgaG9vZGllLmFjY291bnQuYXV0aGVudGljYXRlKCkuZG9uZSggZG9Tb21ldGhpbmcgKS5mYWlsKCBoYW5kbGVFcnJvciApYFxuICAvL1xuICBhY2NvdW50LmF1dGhlbnRpY2F0ZSA9IGZ1bmN0aW9uIGF1dGhlbnRpY2F0ZSgpIHtcbiAgICB2YXIgc2VuZEFuZEhhbmRsZUF1dGhSZXF1ZXN0O1xuXG4gICAgLy8gYWxyZWFkeSB0cmllZCB0byBhdXRoZW50aWNhdGUsIGFuZCBmYWlsZWRcbiAgICBpZiAoYXV0aGVudGljYXRlZCA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiByZWplY3QoKTtcbiAgICB9XG5cbiAgICAvLyBhbHJlYWR5IHRyaWVkIHRvIGF1dGhlbnRpY2F0ZSwgYW5kIHN1Y2NlZWRlZFxuICAgIGlmIChhdXRoZW50aWNhdGVkID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gcmVzb2x2ZVdpdGgoYWNjb3VudC51c2VybmFtZSk7XG4gICAgfVxuXG4gICAgLy8gaWYgdGhlcmUgaXMgYSBwZW5kaW5nIHNpZ25PdXQgcmVxdWVzdCwgcmV0dXJuIGl0cyBwcm9taXNlLFxuICAgIC8vIGJ1dCBwaXBlIGl0IHNvIHRoYXQgaXQgYWx3YXlzIGVuZHMgdXAgcmVqZWN0ZWRcbiAgICAvL1xuICAgIGlmIChyZXF1ZXN0cy5zaWduT3V0ICYmIHJlcXVlc3RzLnNpZ25PdXQuc3RhdGUoKSA9PT0gJ3BlbmRpbmcnKSB7XG4gICAgICByZXR1cm4gcmVxdWVzdHMuc2lnbk91dC50aGVuKHJlamVjdCk7XG4gICAgfVxuXG4gICAgLy8gaWYgdGhlcmUgaXMgYSBwZW5kaW5nIHNpZ25JbiByZXF1ZXN0LCByZXR1cm4gaXRzIHByb21pc2VcbiAgICAvL1xuICAgIGlmIChyZXF1ZXN0cy5zaWduSW4gJiYgcmVxdWVzdHMuc2lnbkluLnN0YXRlKCkgPT09ICdwZW5kaW5nJykge1xuICAgICAgcmV0dXJuIHJlcXVlc3RzLnNpZ25JbjtcbiAgICB9XG5cbiAgICAvLyBpZiB1c2VyIGhhcyBubyBhY2NvdW50LCBtYWtlIHN1cmUgdG8gZW5kIHRoZSBzZXNzaW9uXG4gICAgaWYgKCFhY2NvdW50Lmhhc0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIHNlbmRTaWduT3V0UmVxdWVzdCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHJlamVjdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gc2VuZCByZXF1ZXN0IHRvIGNoZWNrIGZvciBzZXNzaW9uIHN0YXR1cy4gSWYgdGhlcmUgaXMgYVxuICAgIC8vIHBlbmRpbmcgcmVxdWVzdCBhbHJlYWR5LCByZXR1cm4gaXRzIHByb21pc2UuXG4gICAgLy9cbiAgICBzZW5kQW5kSGFuZGxlQXV0aFJlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhY2NvdW50LnJlcXVlc3QoJ0dFVCcsICcvX3Nlc3Npb24nKS50aGVuKFxuICAgICAgaGFuZGxlQXV0aGVudGljYXRlUmVxdWVzdFN1Y2Nlc3MpO1xuICAgIH07XG5cbiAgICByZXR1cm4gd2l0aFNpbmdsZVJlcXVlc3QoJ2F1dGhlbnRpY2F0ZScsIHNlbmRBbmRIYW5kbGVBdXRoUmVxdWVzdCk7XG4gIH07XG5cblxuICAvLyBoYXNWYWxpZFNlc3Npb25cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyByZXR1cm5zIHRydWUgaWYgdGhlIHVzZXIgaXMgc2lnbmVkIGluLCBhbmQgaGFzIGEgdmFsaWQgY29va2llLlxuICAvL1xuICBhY2NvdW50Lmhhc1ZhbGlkU2Vzc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghYWNjb3VudC5oYXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXV0aGVudGljYXRlZCA9PT0gdHJ1ZTtcbiAgfTtcblxuXG4gIC8vIGhhc0ludmFsaWRTZXNzaW9uXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmV0dXJucyB0cnVlIGlmIHRoZSB1c2VyIGlzIHNpZ25lZCBpbiwgYnV0IGRvZXMgbm90IGhhdmUgYSB2YWxpZCBjb29raWUgXG4gIC8vXG4gIGFjY291bnQuaGFzSW52YWxpZFNlc3Npb24gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIWFjY291bnQuaGFzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF1dGhlbnRpY2F0ZWQgPT09IGZhbHNlO1xuICB9O1xuXG5cbiAgLy8gc2lnbiB1cCB3aXRoIHVzZXJuYW1lICYgcGFzc3dvcmRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHVzZXMgc3RhbmRhcmQgQ291Y2hEQiBBUEkgdG8gY3JlYXRlIGEgbmV3IGRvY3VtZW50IGluIF91c2VycyBkYi5cbiAgLy8gVGhlIGJhY2tlbmQgd2lsbCBhdXRvbWF0aWNhbGx5IGNyZWF0ZSBhIHVzZXJEQiBiYXNlZCBvbiB0aGUgdXNlcm5hbWVcbiAgLy8gYWRkcmVzcyBhbmQgYXBwcm92ZSB0aGUgYWNjb3VudCBieSBhZGRpbmcgYSAnY29uZmlybWVkJyByb2xlIHRvIHRoZVxuICAvLyB1c2VyIGRvYy4gVGhlIGFjY291bnQgY29uZmlybWF0aW9uIG1pZ2h0IHRha2UgYSB3aGlsZSwgc28gd2Uga2VlcCB0cnlpbmdcbiAgLy8gdG8gc2lnbiBpbiB3aXRoIGEgMzAwbXMgdGltZW91dC5cbiAgLy9cbiAgYWNjb3VudC5zaWduVXAgPSBmdW5jdGlvbiBzaWduVXAodXNlcm5hbWUsIHBhc3N3b3JkKSB7XG5cbiAgICBpZiAocGFzc3dvcmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcGFzc3dvcmQgPSAnJztcbiAgICB9XG5cbiAgICBpZiAoIXVzZXJuYW1lKSB7XG4gICAgICByZXR1cm4gcmVqZWN0V2l0aCgnVXNlcm5hbWUgbXVzdCBiZSBzZXQuJyk7XG4gICAgfVxuXG4gICAgaWYgKGFjY291bnQuaGFzQW5vbnltb3VzQWNjb3VudCgpKSB7XG4gICAgICByZXR1cm4gdXBncmFkZUFub255bW91c0FjY291bnQodXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICB9XG5cbiAgICBpZiAoYWNjb3VudC5oYXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiByZWplY3RXaXRoKCdNdXN0IHNpZ24gb3V0IGZpcnN0LicpO1xuICAgIH1cblxuICAgIC8vIGRvd25jYXNlIHVzZXJuYW1lXG4gICAgdXNlcm5hbWUgPSB1c2VybmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIF9pZDogdXNlckRvY0tleSh1c2VybmFtZSksXG4gICAgICAgIG5hbWU6IHVzZXJUeXBlQW5kSWQodXNlcm5hbWUpLFxuICAgICAgICB0eXBlOiAndXNlcicsXG4gICAgICAgIHJvbGVzOiBbXSxcbiAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxuICAgICAgICBob29kaWVJZDogaG9vZGllLmlkKCksXG4gICAgICAgIGRhdGFiYXNlOiBhY2NvdW50LmRiKCksXG4gICAgICAgIHVwZGF0ZWRBdDogbm93KCksXG4gICAgICAgIGNyZWF0ZWRBdDogbm93KCksXG4gICAgICAgIHNpZ25lZFVwQXQ6IHVzZXJuYW1lICE9PSBob29kaWUuaWQoKSA/IG5vdygpIDogdm9pZCAwXG4gICAgICB9KSxcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9O1xuXG4gICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnUFVUJywgdXNlckRvY1VybCh1c2VybmFtZSksIG9wdGlvbnMpLnRoZW4oXG4gICAgaGFuZGxlU2lnblVwU3VjY2Vzcyh1c2VybmFtZSwgcGFzc3dvcmQpLCBoYW5kbGVTaWduVXBFcnJvcih1c2VybmFtZSkpO1xuICB9O1xuXG5cbiAgLy8gYW5vbnltb3VzIHNpZ24gdXBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIElmIHRoZSB1c2VyIGRpZCBub3Qgc2lnbiB1cCBoaW1zZWxmIHlldCwgYnV0IGRhdGEgbmVlZHMgdG8gYmUgdHJhbnNmZXJlZFxuICAvLyB0byB0aGUgY291Y2gsIGUuZy4gdG8gc2VuZCBhbiBlbWFpbCBvciB0byBzaGFyZSBkYXRhLCB0aGUgYW5vbnltb3VzU2lnblVwXG4gIC8vIG1ldGhvZCBjYW4gYmUgdXNlZC4gSXQgZ2VuZXJhdGVzIGEgcmFuZG9tIHBhc3N3b3JkIGFuZCBzdG9yZXMgaXQgbG9jYWxseVxuICAvLyBpbiB0aGUgYnJvd3Nlci5cbiAgLy9cbiAgLy8gSWYgdGhlIHVzZXIgc2lnbmVzIHVwIGZvciByZWFsIGxhdGVyLCB3ZSAndXBncmFkZScgaGlzIGFjY291bnQsIG1lYW5pbmcgd2VcbiAgLy8gY2hhbmdlIGhpcyB1c2VybmFtZSBhbmQgcGFzc3dvcmQgaW50ZXJuYWxseSBpbnN0ZWFkIG9mIGNyZWF0aW5nIGFub3RoZXIgdXNlci5cbiAgLy9cbiAgYWNjb3VudC5hbm9ueW1vdXNTaWduVXAgPSBmdW5jdGlvbiBhbm9ueW1vdXNTaWduVXAoKSB7XG4gICAgdmFyIHBhc3N3b3JkLCB1c2VybmFtZTtcblxuICAgIHBhc3N3b3JkID0gZ2VuZXJhdGVJZCgxMCk7XG4gICAgdXNlcm5hbWUgPSBob29kaWUuaWQoKTtcblxuICAgIHJldHVybiBhY2NvdW50LnNpZ25VcCh1c2VybmFtZSwgcGFzc3dvcmQpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICBzZXRBbm9ueW1vdXNQYXNzd29yZChwYXNzd29yZCk7XG4gICAgICByZXR1cm4gYWNjb3VudC50cmlnZ2VyKCdzaWdudXA6YW5vbnltb3VzJywgdXNlcm5hbWUpO1xuICAgIH0pO1xuICB9O1xuXG5cbiAgLy8gaGFzQWNjb3VudFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvL1xuICBhY2NvdW50Lmhhc0FjY291bnQgPSBmdW5jdGlvbiBoYXNBY2NvdW50KCkge1xuICAgIHJldHVybiAhIWFjY291bnQudXNlcm5hbWU7XG4gIH07XG5cblxuICAvLyBoYXNBbm9ueW1vdXNBY2NvdW50XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGFub255bW91cyBhY2NvdW50cyBnZXQgY3JlYXRlZCB3aGVuIGRhdGEgbmVlZHMgdG8gYmVcbiAgLy8gc3luY2VkIHdpdGhvdXQgdGhlIHVzZXIgaGF2aW5nIGFuIGFjY291bnQuIFRoYXQgaGFwcGVuc1xuICAvLyBhdXRvbWF0aWNhbGx5IHdoZW4gdGhlIHVzZXIgY3JlYXRlcyBhIHRhc2ssIGJ1dCBjYW4gYWxzb1xuICAvLyBiZSBkb25lIG1hbnVhbGx5IHVzaW5nIGhvb2RpZS5hY2NvdW50LmFub255bW91c1NpZ25VcCgpLFxuICAvLyBlLmcuIHRvIHByZXZlbnQgZGF0YSBsb3NzLlxuICAvL1xuICAvLyBUbyBkZXRlcm1pbmUgYmV0d2VlbiBhbm9ueW1vdXMgYW5kIFwicmVhbFwiIGFjY291bnRzLCB3ZVxuICAvLyBjYW4gY29tcGFyZSB0aGUgdXNlcm5hbWUgdG8gdGhlIGhvb2RpZS5pZCwgd2hpY2ggaXMgdGhlXG4gIC8vIHNhbWUgZm9yIGFub255bW91cyBhY2NvdW50cy5cbiAgYWNjb3VudC5oYXNBbm9ueW1vdXNBY2NvdW50ID0gZnVuY3Rpb24gaGFzQW5vbnltb3VzQWNjb3VudCgpIHtcbiAgICByZXR1cm4gYWNjb3VudC51c2VybmFtZSA9PT0gaG9vZGllLmlkKCk7XG4gIH07XG5cblxuICAvLyBzZXQgLyBnZXQgLyByZW1vdmUgYW5vbnltb3VzIHBhc3N3b3JkXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vXG4gIHZhciBhbm9ueW1vdXNQYXNzd29yZEtleSA9ICdfYWNjb3VudC5hbm9ueW1vdXNQYXNzd29yZCc7XG5cbiAgZnVuY3Rpb24gc2V0QW5vbnltb3VzUGFzc3dvcmQocGFzc3dvcmQpIHtcbiAgICByZXR1cm4gaG9vZGllLmNvbmZpZy5zZXQoYW5vbnltb3VzUGFzc3dvcmRLZXksIHBhc3N3b3JkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEFub255bW91c1Bhc3N3b3JkKCkge1xuICAgIHJldHVybiBob29kaWUuY29uZmlnLmdldChhbm9ueW1vdXNQYXNzd29yZEtleSk7XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVBbm9ueW1vdXNQYXNzd29yZCgpIHtcbiAgICByZXR1cm4gaG9vZGllLmNvbmZpZy51bnNldChhbm9ueW1vdXNQYXNzd29yZEtleSk7XG4gIH1cblxuXG4gIC8vIHNpZ24gaW4gd2l0aCB1c2VybmFtZSAmIHBhc3N3b3JkXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyB1c2VzIHN0YW5kYXJkIENvdWNoREIgQVBJIHRvIGNyZWF0ZSBhIG5ldyB1c2VyIHNlc3Npb24gKFBPU1QgL19zZXNzaW9uKS5cbiAgLy8gQmVzaWRlcyB0aGUgc3RhbmRhcmQgc2lnbiBpbiB3ZSBhbHNvIGNoZWNrIGlmIHRoZSBhY2NvdW50IGhhcyBiZWVuIGNvbmZpcm1lZFxuICAvLyAocm9sZXMgaW5jbHVkZSAnY29uZmlybWVkJyByb2xlKS5cbiAgLy9cbiAgLy8gV2hlbiBzaWduaW5nIGluLCBieSBkZWZhdWx0IGFsbCBsb2NhbCBkYXRhIGdldHMgY2xlYXJlZCBiZWZvcmVoYW5kICh3aXRoIGEgc2lnbk91dCkuXG4gIC8vIE90aGVyd2lzZSBkYXRhIHRoYXQgaGFzIGJlZW4gY3JlYXRlZCBiZWZvcmVoYW5kIChhdXRoZW50aWNhdGVkIHdpdGggYW5vdGhlciB1c2VyXG4gIC8vIGFjY291bnQgb3IgYW5vbnltb3VzbHkpIHdvdWxkIGJlIG1lcmdlZCBpbnRvIHRoZSB1c2VyIGFjY291bnQgdGhhdCBzaWducyBpbi5cbiAgLy8gVGhhdCBhcHBsaWVzIG9ubHkgaWYgdXNlcm5hbWUgaXNuJ3QgdGhlIHNhbWUgYXMgY3VycmVudCB1c2VybmFtZS5cbiAgLy9cbiAgLy8gVG8gcHJldmVudCBkYXRhIGxvc3MsIHNpZ25JbiBjYW4gYmUgY2FsbGVkIHdpdGggb3B0aW9ucy5tb3ZlRGF0YSA9IHRydWUsIHRoYXQgd2xsXG4gIC8vIG1vdmUgYWxsIGRhdGEgZnJvbSB0aGUgYW5vbnltb3VzIGFjY291bnQgdG8gdGhlIGFjY291bnQgdGhlIHVzZXIgc2lnbmVkIGludG8uXG4gIC8vXG4gIGFjY291bnQuc2lnbkluID0gZnVuY3Rpb24gc2lnbkluKHVzZXJuYW1lLCBwYXNzd29yZCwgb3B0aW9ucykge1xuICAgIHZhciBzaWduT3V0QW5kU2lnbkluID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBhY2NvdW50LnNpZ25PdXQoe1xuICAgICAgICAgIHNpbGVudDogdHJ1ZVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBzZW5kU2lnbkluUmVxdWVzdCh1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgdmFyIGN1cnJlbnREYXRhO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAodXNlcm5hbWUgPT09IG51bGwpIHtcbiAgICAgIHVzZXJuYW1lID0gJyc7XG4gICAgfVxuXG4gICAgaWYgKHBhc3N3b3JkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHBhc3N3b3JkID0gJyc7XG4gICAgfVxuXG4gICAgLy8gZG93bmNhc2VcbiAgICB1c2VybmFtZSA9IHVzZXJuYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICBpZiAodXNlcm5hbWUgIT09IGFjY291bnQudXNlcm5hbWUpIHtcbiAgICAgIGlmICghb3B0aW9ucy5tb3ZlRGF0YSkge1xuICAgICAgICByZXR1cm4gc2lnbk91dEFuZFNpZ25JbigpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaG9vZGllLnN0b3JlLmZpbmRBbGwoKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgY3VycmVudERhdGEgPSBkYXRhO1xuICAgICAgfSkudGhlbihzaWduT3V0QW5kU2lnbkluKS5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgICBjdXJyZW50RGF0YS5mb3JFYWNoKGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgICAgIHZhciB0eXBlID0gb2JqZWN0LnR5cGU7XG5cbiAgICAgICAgICAvLyBpZ25vcmUgdGhlIGFjY291bnQgc2V0dGluZ3NcbiAgICAgICAgICBpZiAodHlwZSA9PT0gJyRjb25maWcnICYmIG9iamVjdC5pZCA9PT0gJ2hvb2RpZScpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBkZWxldGUgb2JqZWN0LnR5cGU7XG4gICAgICAgICAgb2JqZWN0LmNyZWF0ZWRCeSA9IGhvb2RpZS5pZCgpO1xuICAgICAgICAgIGhvb2RpZS5zdG9yZS5hZGQodHlwZSwgb2JqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2VuZFNpZ25JblJlcXVlc3QodXNlcm5hbWUsIHBhc3N3b3JkLCB7XG4gICAgICAgIHJlYXV0aGVudGljYXRlZDogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gc2lnbiBvdXRcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gdXNlcyBzdGFuZGFyZCBDb3VjaERCIEFQSSB0byBpbnZhbGlkYXRlIGEgdXNlciBzZXNzaW9uIChERUxFVEUgL19zZXNzaW9uKVxuICAvL1xuICBhY2NvdW50LnNpZ25PdXQgPSBmdW5jdGlvbiBzaWduT3V0KG9wdGlvbnMpIHtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKCFhY2NvdW50Lmhhc0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIGNsZWFudXAoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB7XG4gICAgICAgICAgcmV0dXJuIGFjY291bnQudHJpZ2dlcignc2lnbm91dCcpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHVzaExvY2FsQ2hhbmdlcyhvcHRpb25zKS50aGVuKGhvb2RpZS5yZW1vdGUuZGlzY29ubmVjdCkudGhlbihzZW5kU2lnbk91dFJlcXVlc3QpLnRoZW4oY2xlYW51cEFuZFRyaWdnZXJTaWduT3V0KTtcbiAgfTtcblxuXG4gIC8vIFJlcXVlc3RcbiAgLy8gLS0tXG5cbiAgLy8gc2hvcnRjdXRcbiAgLy9cbiAgYWNjb3VudC5yZXF1ZXN0ID0gZnVuY3Rpb24gYWNjb3VudFJlcXVlc3QodHlwZSwgcGF0aCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHJldHVybiBob29kaWUucmVxdWVzdC5hcHBseShob29kaWUsIGFyZ3VtZW50cyk7XG4gIH07XG5cblxuICAvLyBkYlxuICAvLyAtLS0tXG5cbiAgLy8gcmV0dXJuIG5hbWUgb2YgZGJcbiAgLy9cbiAgYWNjb3VudC5kYiA9IGZ1bmN0aW9uIGRiKCkge1xuICAgIHJldHVybiAndXNlci8nICsgaG9vZGllLmlkKCk7XG4gIH07XG5cblxuICAvLyBmZXRjaFxuICAvLyAtLS0tLS0tXG5cbiAgLy8gZmV0Y2hlcyBfdXNlcnMgZG9jIGZyb20gQ291Y2hEQiBhbmQgY2FjaGVzIGl0IGluIF9kb2NcbiAgLy9cbiAgYWNjb3VudC5mZXRjaCA9IGZ1bmN0aW9uIGZldGNoKHVzZXJuYW1lKSB7XG5cbiAgICBpZiAodXNlcm5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdXNlcm5hbWUgPSBhY2NvdW50LnVzZXJuYW1lO1xuICAgIH1cblxuICAgIGlmICghdXNlcm5hbWUpIHtcbiAgICAgIHJldHVybiByZWplY3RXaXRoKHtcbiAgICAgICAgbmFtZTogJ0hvb2RpZVVuYXV0aG9yaXplZEVycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ05vdCBzaWduZWQgaW4nXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gd2l0aFNpbmdsZVJlcXVlc3QoJ2ZldGNoJywgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5yZXF1ZXN0KCdHRVQnLCB1c2VyRG9jVXJsKHVzZXJuYW1lKSkuZG9uZShmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB1c2VyRG9jID0gcmVzcG9uc2U7XG4gICAgICAgIHJldHVybiB1c2VyRG9jO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyBjaGFuZ2UgcGFzc3dvcmRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBOb3RlOiB0aGUgaG9vZGllIEFQSSByZXF1aXJlcyB0aGUgY3VycmVudFBhc3N3b3JkIGZvciBzZWN1cml0eSByZWFzb25zLFxuICAvLyBidXQgY291Y2hEYiBkb2Vzbid0IHJlcXVpcmUgaXQgZm9yIGEgcGFzc3dvcmQgY2hhbmdlLCBzbyBpdCdzIGlnbm9yZWRcbiAgLy8gaW4gdGhpcyBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgaG9vZGllIEFQSS5cbiAgLy9cbiAgYWNjb3VudC5jaGFuZ2VQYXNzd29yZCA9IGZ1bmN0aW9uIGNoYW5nZVBhc3N3b3JkKGN1cnJlbnRQYXNzd29yZCwgbmV3UGFzc3dvcmQpIHtcblxuICAgIGlmICghYWNjb3VudC51c2VybmFtZSkge1xuICAgICAgcmV0dXJuIHJlamVjdFdpdGgoe1xuICAgICAgICBuYW1lOiAnSG9vZGllVW5hdXRob3JpemVkRXJyb3InLFxuICAgICAgICBtZXNzYWdlOiAnTm90IHNpZ25lZCBpbidcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGhvb2RpZS5yZW1vdGUuZGlzY29ubmVjdCgpO1xuXG4gICAgcmV0dXJuIGFjY291bnQuZmV0Y2goKS50aGVuKFxuICAgIHNlbmRDaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkUmVxdWVzdChjdXJyZW50UGFzc3dvcmQsIG51bGwsIG5ld1Bhc3N3b3JkKSk7XG4gIH07XG5cblxuICAvLyByZXNldCBwYXNzd29yZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhpcyBpcyBraW5kIG9mIGEgaGFjay4gV2UgbmVlZCB0byBjcmVhdGUgYW4gb2JqZWN0IGFub255bW91c2x5XG4gIC8vIHRoYXQgaXMgbm90IGV4cG9zZWQgdG8gb3RoZXJzLiBUaGUgb25seSBDb3VjaERCIEFQSSBvdGhlcmluZyBzdWNoXG4gIC8vIGZ1bmN0aW9uYWxpdHkgaXMgdGhlIF91c2VycyBkYXRhYmFzZS5cbiAgLy9cbiAgLy8gU28gd2UgYWN0dWFseSBzaWduIHVwIGEgbmV3IGNvdWNoREIgdXNlciB3aXRoIHNvbWUgc3BlY2lhbCBhdHRyaWJ1dGVzLlxuICAvLyBJdCB3aWxsIGJlIHBpY2tlZCB1cCBieSB0aGUgcGFzc3dvcmQgcmVzZXQgd29ya2VyIGFuZCByZW1vdmVlZFxuICAvLyBvbmNlIHRoZSBwYXNzd29yZCB3YXMgcmVzZXR0ZWQuXG4gIC8vXG4gIGFjY291bnQucmVzZXRQYXNzd29yZCA9IGZ1bmN0aW9uIHJlc2V0UGFzc3dvcmQodXNlcm5hbWUpIHtcbiAgICB2YXIgZGF0YSwga2V5LCBvcHRpb25zLCByZXNldFBhc3N3b3JkSWQ7XG5cbiAgICByZXNldFBhc3N3b3JkSWQgPSBob29kaWUuY29uZmlnLmdldCgnX2FjY291bnQucmVzZXRQYXNzd29yZElkJyk7XG5cbiAgICBpZiAocmVzZXRQYXNzd29yZElkKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5jaGVja1Bhc3N3b3JkUmVzZXQoKTtcbiAgICB9XG5cbiAgICByZXNldFBhc3N3b3JkSWQgPSAnJyArIHVzZXJuYW1lICsgJy8nICsgKGdlbmVyYXRlSWQoKSk7XG5cbiAgICBob29kaWUuY29uZmlnLnNldCgnX2FjY291bnQucmVzZXRQYXNzd29yZElkJywgcmVzZXRQYXNzd29yZElkKTtcblxuICAgIGtleSA9ICcnICsgdXNlckRvY1ByZWZpeCArICc6JHBhc3N3b3JkUmVzZXQvJyArIHJlc2V0UGFzc3dvcmRJZDtcblxuICAgIGRhdGEgPSB7XG4gICAgICBfaWQ6IGtleSxcbiAgICAgIG5hbWU6ICckcGFzc3dvcmRSZXNldC8nICsgcmVzZXRQYXNzd29yZElkLFxuICAgICAgdHlwZTogJ3VzZXInLFxuICAgICAgcm9sZXM6IFtdLFxuICAgICAgcGFzc3dvcmQ6IHJlc2V0UGFzc3dvcmRJZCxcbiAgICAgIGNyZWF0ZWRBdDogbm93KCksXG4gICAgICB1cGRhdGVkQXQ6IG5vdygpXG4gICAgfTtcblxuICAgIG9wdGlvbnMgPSB7XG4gICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9O1xuXG4gICAgLy8gVE9ETzogc3BlYyB0aGF0IGNoZWNrUGFzc3dvcmRSZXNldCBnZXRzIGV4ZWN1dGVkXG4gICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgncmVzZXRQYXNzd29yZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnUFVUJywgJy9fdXNlcnMvJyArIChlbmNvZGVVUklDb21wb25lbnQoa2V5KSksIG9wdGlvbnMpLmRvbmUoYWNjb3VudC5jaGVja1Bhc3N3b3JkUmVzZXQpLnRoZW4oYXdhaXRQYXNzd29yZFJlc2V0UmVzdWx0KTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBjaGVja1Bhc3N3b3JkUmVzZXRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gY2hlY2sgZm9yIHRoZSBzdGF0dXMgb2YgYSBwYXNzd29yZCByZXNldC4gSXQgbWlnaHQgdGFrZVxuICAvLyBhIHdoaWxlIHVudGlsIHRoZSBwYXNzd29yZCByZXNldCB3b3JrZXIgcGlja3MgdXAgdGhlIGpvYlxuICAvLyBhbmQgdXBkYXRlcyBpdFxuICAvL1xuICAvLyBJZiBhIHBhc3N3b3JkIHJlc2V0IHJlcXVlc3Qgd2FzIHN1Y2Nlc3NmdWwsIHRoZSAkcGFzc3dvcmRSZXF1ZXN0XG4gIC8vIGRvYyBnZXRzIHJlbW92ZWQgZnJvbSBfdXNlcnMgYnkgdGhlIHdvcmtlciwgdGhlcmVmb3JlIGEgNDAxIGlzXG4gIC8vIHdoYXQgd2UgYXJlIHdhaXRpbmcgZm9yLlxuICAvL1xuICAvLyBPbmNlIGNhbGxlZCwgaXQgY29udGludWVzIHRvIHJlcXVlc3QgdGhlIHN0YXR1cyB1cGRhdGUgd2l0aCBhXG4gIC8vIG9uZSBzZWNvbmQgdGltZW91dC5cbiAgLy9cbiAgYWNjb3VudC5jaGVja1Bhc3N3b3JkUmVzZXQgPSBmdW5jdGlvbiBjaGVja1Bhc3N3b3JkUmVzZXQoKSB7XG4gICAgdmFyIGhhc2gsIG9wdGlvbnMsIHJlc2V0UGFzc3dvcmRJZCwgdXJsLCB1c2VybmFtZTtcblxuICAgIC8vIHJlamVjdCBpZiB0aGVyZSBpcyBubyBwZW5kaW5nIHBhc3N3b3JkIHJlc2V0IHJlcXVlc3RcbiAgICByZXNldFBhc3N3b3JkSWQgPSBob29kaWUuY29uZmlnLmdldCgnX2FjY291bnQucmVzZXRQYXNzd29yZElkJyk7XG5cbiAgICBpZiAoIXJlc2V0UGFzc3dvcmRJZCkge1xuICAgICAgcmV0dXJuIHJlamVjdFdpdGgoJ05vIHBlbmRpbmcgcGFzc3dvcmQgcmVzZXQuJyk7XG4gICAgfVxuXG4gICAgLy8gc2VuZCByZXF1ZXN0IHRvIGNoZWNrIHN0YXR1cyBvZiBwYXNzd29yZCByZXNldFxuICAgIHVzZXJuYW1lID0gJyRwYXNzd29yZFJlc2V0LycgKyByZXNldFBhc3N3b3JkSWQ7XG4gICAgdXJsID0gJy9fdXNlcnMvJyArIChlbmNvZGVVUklDb21wb25lbnQodXNlckRvY1ByZWZpeCArICc6JyArIHVzZXJuYW1lKSk7XG4gICAgaGFzaCA9IGJ0b2EodXNlcm5hbWUgKyAnOicgKyByZXNldFBhc3N3b3JkSWQpO1xuXG4gICAgb3B0aW9ucyA9IHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0Jhc2ljICcgKyBoYXNoXG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiB3aXRoU2luZ2xlUmVxdWVzdCgncGFzc3dvcmRSZXNldFN0YXR1cycsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnR0VUJywgdXJsLCBvcHRpb25zKS50aGVuKFxuICAgICAgaGFuZGxlUGFzc3dvcmRSZXNldFN0YXR1c1JlcXVlc3RTdWNjZXNzLCBoYW5kbGVQYXNzd29yZFJlc2V0U3RhdHVzUmVxdWVzdEVycm9yKS5mYWlsKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvci5uYW1lID09PSAnSG9vZGllUGVuZGluZ0Vycm9yJykge1xuICAgICAgICAgIGdsb2JhbC5zZXRUaW1lb3V0KGFjY291bnQuY2hlY2tQYXNzd29yZFJlc2V0LCAxMDAwKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjY291bnQudHJpZ2dlcignZXJyb3I6cGFzc3dvcmRyZXNldCcsIGVycm9yKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG5cbiAgLy8gY2hhbmdlIHVzZXJuYW1lXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gTm90ZTogdGhlIGhvb2RpZSBBUEkgcmVxdWlyZXMgdGhlIGN1cnJlbnQgcGFzc3dvcmQgZm9yIHNlY3VyaXR5IHJlYXNvbnMsXG4gIC8vIGJ1dCB0ZWNobmljYWxseSB3ZSBjYW5ub3QgKHlldCkgcHJldmVudCB0aGUgdXNlciB0byBjaGFuZ2UgdGhlIHVzZXJuYW1lXG4gIC8vIHdpdGhvdXQga25vd2luZyB0aGUgY3VycmVudCBwYXNzd29yZCwgc28gaXQncyBpZ25vcmVkIGluIHRoZSBjdXJyZW50XG4gIC8vIGltcGxlbWVudGF0aW9uLlxuICAvL1xuICAvLyBCdXQgdGhlIGN1cnJlbnQgcGFzc3dvcmQgaXMgbmVlZGVkIHRvIGxvZ2luIHdpdGggdGhlIG5ldyB1c2VybmFtZS5cbiAgLy9cbiAgYWNjb3VudC5jaGFuZ2VVc2VybmFtZSA9IGZ1bmN0aW9uIGNoYW5nZVVzZXJuYW1lKGN1cnJlbnRQYXNzd29yZCwgbmV3VXNlcm5hbWUpIHtcbiAgICBpZiAobmV3VXNlcm5hbWUgIT09IGFjY291bnQudXNlcm5hbWUpIHtcbiAgICAgIG5ld1VzZXJuYW1lID0gbmV3VXNlcm5hbWUgfHwgJyc7XG4gICAgICByZXR1cm4gY2hhbmdlVXNlcm5hbWVBbmRQYXNzd29yZChjdXJyZW50UGFzc3dvcmQsIG5ld1VzZXJuYW1lLnRvTG93ZXJDYXNlKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVqZWN0V2l0aCh7XG4gICAgICBuYW1lOiAnSG9vZGllQ29uZmxpY3RFcnJvcicsXG4gICAgICBtZXNzYWdlOiAnVXNlcm5hbWVzIGlkZW50aWNhbCdcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIGRlc3Ryb3lcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gZGVzdHJveXMgYSB1c2VyJ3MgYWNjb3VudFxuICAvL1xuICBhY2NvdW50LmRlc3Ryb3kgPSBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgIGlmICghYWNjb3VudC5oYXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiBjbGVhbnVwQW5kVHJpZ2dlclNpZ25PdXQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWNjb3VudC5mZXRjaCgpLnRoZW4oXG4gICAgaGFuZGxlRmV0Y2hCZWZvcmVEZXN0cm95U3VjY2VzcywgaGFuZGxlRmV0Y2hCZWZvcmVEZXN0cm95RXJyb3IpLnRoZW4oY2xlYW51cEFuZFRyaWdnZXJTaWduT3V0KTtcbiAgfTtcblxuXG4gIC8vXG4gIC8vIHN1YnNjcmliZSB0byBldmVudHMgY29taW5nIG91dHNpZGVcbiAgLy9cbiAgZnVuY3Rpb24gc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCkge1xuICAgIGhvb2RpZS5vbigncmVtb3RlOmVycm9yOnVuYXV0aGVudGljYXRlZCcsIHJlYXV0aGVudGljYXRlKTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9uY2UgZnJvbSBvdXRzaWRlXG4gIGFjY291bnQuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG4gICAgZGVsZXRlIGFjY291bnQuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzO1xuICB9O1xuXG5cbiAgLy8gUFJJVkFURVxuICAvLyAtLS0tLS0tLS1cblxuICAvLyByZWF1dGhlbnRpY2F0ZTogZm9yY2UgaG9vZGllIHRvIHJlYXV0aGVudGljYXRlXG4gIGZ1bmN0aW9uIHJlYXV0aGVudGljYXRlKCkge1xuICAgIGF1dGhlbnRpY2F0ZWQgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIGFjY291bnQuYXV0aGVudGljYXRlKCk7XG4gIH1cblxuICAvLyBzZXR0ZXJzXG4gIGZ1bmN0aW9uIHNldFVzZXJuYW1lKG5ld1VzZXJuYW1lKSB7XG4gICAgaWYgKGFjY291bnQudXNlcm5hbWUgPT09IG5ld1VzZXJuYW1lKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYWNjb3VudC51c2VybmFtZSA9IG5ld1VzZXJuYW1lO1xuXG4gICAgcmV0dXJuIGhvb2RpZS5jb25maWcuc2V0KCdfYWNjb3VudC51c2VybmFtZScsIG5ld1VzZXJuYW1lKTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gaGFuZGxlIGEgc3VjY2Vzc2Z1bCBhdXRoZW50aWNhdGlvbiByZXF1ZXN0LlxuICAvL1xuICAvLyBBcyBsb25nIGFzIHRoZXJlIGlzIG5vIHNlcnZlciBlcnJvciBvciBpbnRlcm5ldCBjb25uZWN0aW9uIGlzc3VlLFxuICAvLyB0aGUgYXV0aGVudGljYXRlIHJlcXVlc3QgKEdFVCAvX3Nlc3Npb24pIGRvZXMgYWx3YXlzIHJldHVyblxuICAvLyBhIDIwMCBzdGF0dXMuIFRvIGRpZmZlcmVudGlhdGUgd2hldGhlciB0aGUgdXNlciBpcyBzaWduZWQgaW4gb3JcbiAgLy8gbm90LCB3ZSBjaGVjayBgdXNlckN0eC5uYW1lYCBpbiB0aGUgcmVzcG9uc2UuIElmIHRoZSB1c2VyIGlzIG5vdFxuICAvLyBzaWduZWQgaW4sIGl0J3MgbnVsbCwgb3RoZXJ3aXNlIHRoZSBuYW1lIHRoZSB1c2VyIHNpZ25lZCBpbiB3aXRoXG4gIC8vXG4gIC8vIElmIHRoZSB1c2VyIGlzIG5vdCBzaWduZWQgaW4sIHdlIGRpZmVlcmVudGlhdGUgYmV0d2VlbiB1c2VycyB0aGF0XG4gIC8vIHNpZ25lZCBpbiB3aXRoIGEgdXNlcm5hbWUgLyBwYXNzd29yZCBvciBhbm9ueW1vdXNseS4gRm9yIGFub255bW91c1xuICAvLyB1c2VycywgdGhlIHBhc3N3b3JkIGlzIHN0b3JlZCBpbiBsb2NhbCBzdG9yZSwgc28gd2UgZG9uJ3QgbmVlZFxuICAvLyB0byB0cmlnZ2VyIGFuICd1bmF1dGhlbnRpY2F0ZWQnIGVycm9yLCBidXQgaW5zdGVhZCB0cnkgdG8gc2lnbiBpbi5cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQXV0aGVudGljYXRlUmVxdWVzdFN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICBpZiAocmVzcG9uc2UudXNlckN0eC5uYW1lKSB7XG4gICAgICBhdXRoZW50aWNhdGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiByZXNvbHZlV2l0aChhY2NvdW50LnVzZXJuYW1lKTtcbiAgICB9XG5cbiAgICBpZiAoYWNjb3VudC5oYXNBbm9ueW1vdXNBY2NvdW50KCkpIHtcbiAgICAgIHJldHVybiBhY2NvdW50LnNpZ25JbihhY2NvdW50LnVzZXJuYW1lLCBnZXRBbm9ueW1vdXNQYXNzd29yZCgpKTtcbiAgICB9XG5cbiAgICBhdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgYWNjb3VudC50cmlnZ2VyKCdlcnJvcjp1bmF1dGhlbnRpY2F0ZWQnKTtcbiAgICByZXR1cm4gcmVqZWN0KCk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIGhhbmRsZSByZXNwb25zZSBvZiBhIHN1Y2Nlc3NmdWwgc2lnblVwIHJlcXVlc3QuXG4gIC8vIFJlc3BvbnNlIGxvb2tzIGxpa2U6XG4gIC8vXG4gIC8vICAgICB7XG4gIC8vICAgICAgICAgJ29rJzogdHJ1ZSxcbiAgLy8gICAgICAgICAnaWQnOiAnb3JnLmNvdWNoZGIudXNlcjpqb2UnLFxuICAvLyAgICAgICAgICdyZXYnOiAnMS1lODc0N2Q5YWU5Nzc2NzA2ZGE5MjgxMGIxYmFhNDI0OCdcbiAgLy8gICAgIH1cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlU2lnblVwU3VjY2Vzcyh1c2VybmFtZSwgcGFzc3dvcmQpIHtcblxuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgYWNjb3VudC50cmlnZ2VyKCdzaWdudXAnLCB1c2VybmFtZSk7XG4gICAgICB1c2VyRG9jLl9yZXYgPSByZXNwb25zZS5yZXY7XG4gICAgICByZXR1cm4gZGVsYXllZFNpZ25Jbih1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgIH07XG4gIH1cblxuICAvL1xuICAvLyBoYW5kbGUgcmVzcG9uc2Ugb2YgYSBmYWlsZWQgc2lnblVwIHJlcXVlc3QuXG4gIC8vXG4gIC8vIEluIGNhc2Ugb2YgYSBjb25mbGljdCwgcmVqZWN0IHdpdGggXCJ1c2VybmFtZSBhbHJlYWR5IGV4aXN0c1wiIGVycm9yXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE3NFxuICAvLyBFcnJvciBwYXNzZWQgZm9yIHJlcXVlc3QgbG9va3MgbGlrZSB0aGlzXG4gIC8vXG4gIC8vICAgICB7XG4gIC8vICAgICAgICAgXCJuYW1lXCI6IFwiSG9vZGllQ29uZmxpY3RFcnJvclwiLFxuICAvLyAgICAgICAgIFwibWVzc2FnZVwiOiBcIk9iamVjdCBhbHJlYWR5IGV4aXN0cy5cIlxuICAvLyAgICAgfVxuICBmdW5jdGlvbiBoYW5kbGVTaWduVXBFcnJvcih1c2VybmFtZSkge1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0hvb2RpZUNvbmZsaWN0RXJyb3InKSB7XG4gICAgICAgIGVycm9yLm1lc3NhZ2UgPSAnVXNlcm5hbWUgJyArIHVzZXJuYW1lICsgJyBhbHJlYWR5IGV4aXN0cyc7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVqZWN0V2l0aChlcnJvcik7XG4gICAgfTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gYSBkZWxheWVkIHNpZ24gaW4gaXMgdXNlZCBhZnRlciBzaWduIHVwIGFuZCBhZnRlciBhXG4gIC8vIHVzZXJuYW1lIGNoYW5nZS5cbiAgLy9cbiAgZnVuY3Rpb24gZGVsYXllZFNpZ25Jbih1c2VybmFtZSwgcGFzc3dvcmQsIG9wdGlvbnMsIGRlZmVyKSB7XG5cbiAgICAvLyBkZWxheWVkU2lnbkluIG1pZ2h0IGNhbGwgaXRzZWxmLCB3aGVuIHRoZSB1c2VyIGFjY291bnRcbiAgICAvLyBpcyBwZW5kaW5nLiBJbiB0aGlzIGNhc2UgaXQgcGFzc2VzIHRoZSBvcmlnaW5hbCBkZWZlcixcbiAgICAvLyB0byBrZWVwIGEgcmVmZXJlbmNlIGFuZCBmaW5hbGx5IHJlc29sdmUgLyByZWplY3QgaXRcbiAgICAvLyBhdCBzb21lIHBvaW50XG4gICAgaWYgKCFkZWZlcikge1xuICAgICAgZGVmZXIgPSBnZXREZWZlcigpO1xuICAgIH1cblxuICAgIGdsb2JhbC5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHByb21pc2UgPSBzZW5kU2lnbkluUmVxdWVzdCh1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgICAgcHJvbWlzZS5kb25lKGRlZmVyLnJlc29sdmUpO1xuICAgICAgcHJvbWlzZS5mYWlsKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvci5uYW1lID09PSAnSG9vZGllQWNjb3VudFVuY29uZmlybWVkRXJyb3InKSB7XG5cbiAgICAgICAgICAvLyBJdCBtaWdodCB0YWtlIGEgYml0IHVudGlsIHRoZSBhY2NvdW50IGhhcyBiZWVuIGNvbmZpcm1lZFxuICAgICAgICAgIGRlbGF5ZWRTaWduSW4odXNlcm5hbWUsIHBhc3N3b3JkLCBvcHRpb25zLCBkZWZlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVmZXIucmVqZWN0LmFwcGx5KGRlZmVyLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH0sIDMwMCk7XG5cbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICB9XG5cblxuICAvL1xuICAvLyBwYXJzZSBhIHN1Y2Nlc3NmdWwgc2lnbiBpbiByZXNwb25zZSBmcm9tIGNvdWNoREIuXG4gIC8vIFJlc3BvbnNlIGxvb2tzIGxpa2U6XG4gIC8vXG4gIC8vICAgICB7XG4gIC8vICAgICAgICAgJ29rJzogdHJ1ZSxcbiAgLy8gICAgICAgICAnbmFtZSc6ICd0ZXN0MScsXG4gIC8vICAgICAgICAgJ3JvbGVzJzogW1xuICAvLyAgICAgICAgICAgICAnbXZ1ODVoeScsXG4gIC8vICAgICAgICAgICAgICdjb25maXJtZWQnXG4gIC8vICAgICAgICAgXVxuICAvLyAgICAgfVxuICAvL1xuICAvLyB3ZSB3YW50IHRvIHR1cm4gaXQgaW50byAndGVzdDEnLCAnbXZ1ODVoeScgb3IgcmVqZWN0IHRoZSBwcm9taXNlXG4gIC8vIGluIGNhc2UgYW4gZXJyb3Igb2NjdXJlZCAoJ3JvbGVzJyBhcnJheSBjb250YWlucyAnZXJyb3InKVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVTaWduSW5TdWNjZXNzKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgdmFyIGRlZmVyLCB1c2VybmFtZSwgaG9vZGllSWQ7XG5cbiAgICAgIGRlZmVyID0gZ2V0RGVmZXIoKTtcbiAgICAgIHVzZXJuYW1lID0gcmVzcG9uc2UubmFtZS5yZXBsYWNlKC9edXNlcihfYW5vbnltb3VzKT9cXC8vLCAnJyk7XG4gICAgICBob29kaWVJZCA9IHJlc3BvbnNlLnJvbGVzWzBdO1xuXG4gICAgICAvL1xuICAgICAgLy8gaWYgYW4gZXJyb3Igb2NjdXJlZCwgdGhlIHVzZXJEQiB3b3JrZXIgc3RvcmVzIGl0IHRvIHRoZSAkZXJyb3IgYXR0cmlidXRlXG4gICAgICAvLyBhbmQgYWRkcyB0aGUgJ2Vycm9yJyByb2xlIHRvIHRoZSB1c2VycyBkb2Mgb2JqZWN0LiBJZiB0aGUgdXNlciBoYXMgdGhlXG4gICAgICAvLyAnZXJyb3InIHJvbGUsIHdlIG5lZWQgdG8gZmV0Y2ggaGlzIF91c2VycyBkb2MgdG8gZmluZCBvdXQgd2hhdCB0aGUgZXJyb3JcbiAgICAgIC8vIGlzLCBiZWZvcmUgd2UgY2FuIHJlamVjdCB0aGUgcHJvbWlzZS5cbiAgICAgIC8vXG4gICAgICBpZiAocmVzcG9uc2Uucm9sZXMuaW5kZXhPZignZXJyb3InKSAhPT0gLTEpIHtcbiAgICAgICAgYWNjb3VudC5mZXRjaCh1c2VybmFtZSkuZmFpbChkZWZlci5yZWplY3QpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGRlZmVyLnJlamVjdCh1c2VyRG9jLiRlcnJvcik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICAgICAgfVxuXG4gICAgICAvL1xuICAgICAgLy8gV2hlbiB0aGUgdXNlckRCIHdvcmtlciBjcmVhdGVkIHRoZSBkYXRhYmFzZSBmb3IgdGhlIHVzZXIgYW5kIGV2ZXJ0aGluZ1xuICAgICAgLy8gd29ya2VkIG91dCwgaXQgYWRkcyB0aGUgcm9sZSAnY29uZmlybWVkJyB0byB0aGUgdXNlci4gSWYgdGhlIHJvbGUgaXNcbiAgICAgIC8vIG5vdCBwcmVzZW50IHlldCwgaXQgbWlnaHQgYmUgdGhhdCB0aGUgd29ya2VyIGRpZG4ndCBwaWNrIHVwIHRoZSB0aGVcbiAgICAgIC8vIHVzZXIgZG9jIHlldCwgb3IgdGhlcmUgd2FzIGFuIGVycm9yLiBJbiB0aGlzIGNhc2VzLCB3ZSByZWplY3QgdGhlIHByb21pc2VcbiAgICAgIC8vIHdpdGggYW4gJ3VuY29maXJtZWQgZXJyb3InXG4gICAgICAvL1xuICAgICAgaWYgKHJlc3BvbnNlLnJvbGVzLmluZGV4T2YoJ2NvbmZpcm1lZCcpID09PSAtMSkge1xuICAgICAgICByZXR1cm4gZGVmZXIucmVqZWN0KHtcbiAgICAgICAgICBuYW1lOiAnSG9vZGllQWNjb3VudFVuY29uZmlybWVkRXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6ICdBY2NvdW50IGhhcyBub3QgYmVlbiBjb25maXJtZWQgeWV0J1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgc2V0VXNlcm5hbWUodXNlcm5hbWUpO1xuICAgICAgYXV0aGVudGljYXRlZCA9IHRydWU7XG5cbiAgICAgIC8vXG4gICAgICAvLyBvcHRpb25zLnNpbGVudCBpcyB0cnVlIHdoZW4gd2UgbmVlZCB0byBzaWduIGluIHRoZVxuICAgICAgLy8gdGhlIHVzZXIgd2l0aG91dCBzaWduSW4gbWV0aG9kIGJlaW5nIGNhbGxlZC4gVGhhdCdzXG4gICAgICAvLyBjdXJyZW50bHkgdGhlIGNhc2UgZm9yIGNoYW5nZVVzZXJuYW1lLlxuICAgICAgLy8gQWxzbyBkb24ndCB0cmlnZ2VyICdzaWduaW4nIHdoZW4gcmVhdXRoZW50aWNhdGluZ1xuICAgICAgLy9cbiAgICAgIGlmICghKG9wdGlvbnMuc2lsZW50IHx8IG9wdGlvbnMucmVhdXRoZW50aWNhdGVkKSkge1xuICAgICAgICBpZiAoYWNjb3VudC5oYXNBbm9ueW1vdXNBY2NvdW50KCkpIHtcbiAgICAgICAgICBhY2NvdW50LnRyaWdnZXIoJ3NpZ25pbjphbm9ueW1vdXMnLCB1c2VybmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWNjb3VudC50cmlnZ2VyKCdzaWduaW4nLCB1c2VybmFtZSwgaG9vZGllSWQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHVzZXIgcmVhdXRoZW50aWNhdGVkLCBtZWFuaW5nXG4gICAgICBpZiAob3B0aW9ucy5yZWF1dGhlbnRpY2F0ZWQpIHtcbiAgICAgICAgYWNjb3VudC50cmlnZ2VyKCdyZWF1dGhlbnRpY2F0ZWQnLCB1c2VybmFtZSk7XG4gICAgICB9XG5cbiAgICAgIGFjY291bnQuZmV0Y2goKTtcbiAgICAgIHJldHVybiBkZWZlci5yZXNvbHZlKHVzZXJuYW1lLCByZXNwb25zZS5yb2xlc1swXSk7XG4gICAgfTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gSWYgdGhlIHJlcXVlc3Qgd2FzIHN1Y2Nlc3NmdWwgdGhlcmUgbWlnaHQgaGF2ZSBvY2N1cmVkIGFuXG4gIC8vIGVycm9yLCB3aGljaCB0aGUgd29ya2VyIHN0b3JlZCBpbiB0aGUgc3BlY2lhbCAkZXJyb3IgYXR0cmlidXRlLlxuICAvLyBJZiB0aGF0IGhhcHBlbnMsIHdlIHJldHVybiBhIHJlamVjdGVkIHByb21pc2Ugd2l0aCB0aGUgZXJyb3JcbiAgLy8gT3RoZXJ3aXNlIHJlamVjdCB0aGUgcHJvbWlzZSB3aXRoIGEgJ3BlbmRpbmcnIGVycm9yLFxuICAvLyBhcyB3ZSBhcmUgbm90IHdhaXRpbmcgZm9yIGEgc3VjY2VzcyBmdWxsIHJlc3BvbnNlLCBidXQgYSA0MDFcbiAgLy8gZXJyb3IsIGluZGljYXRpbmcgdGhhdCBvdXIgcGFzc3dvcmQgd2FzIGNoYW5nZWQgYW5kIG91clxuICAvLyBjdXJyZW50IHNlc3Npb24gaGFzIGJlZW4gaW52YWxpZGF0ZWRcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlUGFzc3dvcmRSZXNldFN0YXR1c1JlcXVlc3RTdWNjZXNzKHBhc3N3b3JkUmVzZXRPYmplY3QpIHtcbiAgICB2YXIgZXJyb3I7XG5cbiAgICBpZiAocGFzc3dvcmRSZXNldE9iamVjdC4kZXJyb3IpIHtcbiAgICAgIGVycm9yID0gcGFzc3dvcmRSZXNldE9iamVjdC4kZXJyb3I7XG4gICAgICBlcnJvci5vYmplY3QgPSBwYXNzd29yZFJlc2V0T2JqZWN0O1xuICAgICAgZGVsZXRlIGVycm9yLm9iamVjdC4kZXJyb3I7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9yID0ge1xuICAgICAgICBuYW1lOiAnSG9vZGllUGVuZGluZ0Vycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ1Bhc3N3b3JkIHJlc2V0IGlzIHN0aWxsIHBlbmRpbmcnXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gcmVqZWN0V2l0aChlcnJvcik7XG4gIH1cblxuXG4gIC8vXG4gIC8vIElmIHRoZSBlcnJvciBpcyBhIDQwMSwgaXQncyBleGFjdGx5IHdoYXQgd2UndmUgYmVlbiB3YWl0aW5nIGZvci5cbiAgLy8gSW4gdGhpcyBjYXNlIHdlIHJlc29sdmUgdGhlIHByb21pc2UuXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZVBhc3N3b3JkUmVzZXRTdGF0dXNSZXF1ZXN0RXJyb3IoZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0hvb2RpZVVuYXV0aG9yaXplZEVycm9yJykge1xuICAgICAgaG9vZGllLmNvbmZpZy51bnNldCgnX2FjY291bnQucmVzZXRQYXNzd29yZElkJyk7XG4gICAgICBhY2NvdW50LnRyaWdnZXIoJ3Bhc3N3b3JkcmVzZXQnKTtcblxuICAgICAgcmV0dXJuIHJlc29sdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHJlamVjdFdpdGgoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy9cbiAgLy8gd2FpdCB1bnRpbCBhIHBhc3N3b3JkIHJlc2V0IGdldHMgZWl0aGVyIGNvbXBsZXRlZCBvciBtYXJrZWQgYXMgZmFpbGVkXG4gIC8vIGFuZCByZXNvbHZlIC8gcmVqZWN0IHJlc3BlY3RpdmVseVxuICAvL1xuICBmdW5jdGlvbiBhd2FpdFBhc3N3b3JkUmVzZXRSZXN1bHQoKSB7XG4gICAgdmFyIGRlZmVyID0gZ2V0RGVmZXIoKTtcblxuICAgIGFjY291bnQub25lKCdwYXNzd29yZHJlc2V0JywgZGVmZXIucmVzb2x2ZSApO1xuICAgIGFjY291bnQub24oJ2Vycm9yOnBhc3N3b3JkcmVzZXQnLCByZW1vdmVQYXNzd29yZFJlc2V0T2JqZWN0ICk7XG4gICAgYWNjb3VudC5vbignZXJyb3I6cGFzc3dvcmRyZXNldCcsIGRlZmVyLnJlamVjdCApO1xuXG4gICAgLy8gY2xlYW4gdXAgY2FsbGJhY2tzIHdoZW4gZWl0aGVyIGdldHMgY2FsbGVkXG4gICAgZGVmZXIuYWx3YXlzKCBmdW5jdGlvbigpIHtcbiAgICAgIGFjY291bnQudW5iaW5kKCdwYXNzd29yZHJlc2V0JywgZGVmZXIucmVzb2x2ZSApO1xuICAgICAgYWNjb3VudC51bmJpbmQoJ2Vycm9yOnBhc3N3b3JkcmVzZXQnLCByZW1vdmVQYXNzd29yZFJlc2V0T2JqZWN0ICk7XG4gICAgICBhY2NvdW50LnVuYmluZCgnZXJyb3I6cGFzc3dvcmRyZXNldCcsIGRlZmVyLnJlamVjdCApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIC8vIHdoZW4gYSBwYXNzd29yZCByZXNldCBmYWlscywgcmVtb3ZlIGl0IGZyb20gL191c2Vyc1xuICAvL1xuICBmdW5jdGlvbiByZW1vdmVQYXNzd29yZFJlc2V0T2JqZWN0IChlcnJvcikge1xuICAgIHZhciBwYXNzd29yZFJlc2V0T2JqZWN0ID0gZXJyb3Iub2JqZWN0O1xuXG4gICAgLy8gZ2V0IHVzZXJuYW1lICYgcGFzc3dvcmQgZm9yIGF1dGhlbnRpY2F0aW9uXG4gICAgdmFyIHVzZXJuYW1lID0gcGFzc3dvcmRSZXNldE9iamVjdC5uYW1lOyAvLyAkcGFzc3dvcmRSZXNldC91c2VybmFtZS9yYW5kb21oYXNoXG4gICAgdmFyIHBhc3N3b3JkID0gdXNlcm5hbWUuc3Vic3RyKDE1KTsgLy8gPT4gLy8gdXNlcm5hbWUvcmFuZG9taGFzaFxuICAgIHZhciB1cmwgPSAnL191c2Vycy8nICsgKGVuY29kZVVSSUNvbXBvbmVudCh1c2VyRG9jUHJlZml4ICsgJzonICsgdXNlcm5hbWUpKTtcbiAgICB2YXIgaGFzaCA9IGJ0b2EodXNlcm5hbWUgKyAnOicgKyBwYXNzd29yZCk7XG5cbiAgICAvLyBtYXJrIGFzIGRlbGV0ZWRcbiAgICBwYXNzd29yZFJlc2V0T2JqZWN0Ll9kZWxldGVkID0gdHJ1ZTtcblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmFzaWMgJyArIGhhc2hcbiAgICAgIH0sXG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkocGFzc3dvcmRSZXNldE9iamVjdClcbiAgICB9O1xuXG4gICAgLy8gY2xlYW51cFxuICAgIGFjY291bnQucmVxdWVzdCgnUFVUJywgdXJsLCBvcHRpb25zKTtcbiAgICBob29kaWUuY29uZmlnLnVuc2V0KCdfYWNjb3VudC5yZXNldFBhc3N3b3JkSWQnKTtcbiAgfVxuXG4gIC8vXG4gIC8vIGNoYW5nZSB1c2VybmFtZSBhbmQgcGFzc3dvcmQgaW4gMyBzdGVwc1xuICAvL1xuICAvLyAxLiBhc3N1cmUgd2UgaGF2ZSBhIHZhbGlkIHNlc3Npb25cbiAgLy8gMi4gdXBkYXRlIF91c2VycyBkb2Mgd2l0aCBuZXcgdXNlcm5hbWUgYW5kIG5ldyBwYXNzd29yZCAoaWYgcHJvdmlkZWQpXG4gIC8vIDMuIHNpZ24gaW4gd2l0aCBuZXcgY3JlZGVudGlhbHMgdG8gY3JlYXRlIG5ldyBzZXNpb24uXG4gIC8vXG4gIGZ1bmN0aW9uIGNoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmQoY3VycmVudFBhc3N3b3JkLCBuZXdVc2VybmFtZSwgbmV3UGFzc3dvcmQpIHtcblxuICAgIHJldHVybiBzZW5kU2lnbkluUmVxdWVzdChhY2NvdW50LnVzZXJuYW1lLCBjdXJyZW50UGFzc3dvcmQsIHtcbiAgICAgIHNpbGVudDogdHJ1ZVxuICAgIH0pLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5mZXRjaCgpLnRoZW4oXG4gICAgICBzZW5kQ2hhbmdlVXNlcm5hbWVBbmRQYXNzd29yZFJlcXVlc3QoY3VycmVudFBhc3N3b3JkLCBuZXdVc2VybmFtZSwgbmV3UGFzc3dvcmQpKTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gdHVybiBhbiBhbm9ueW1vdXMgYWNjb3VudCBpbnRvIGEgcmVhbCBhY2NvdW50XG4gIC8vXG4gIGZ1bmN0aW9uIHVwZ3JhZGVBbm9ueW1vdXNBY2NvdW50KHVzZXJuYW1lLCBwYXNzd29yZCkge1xuICAgIHZhciBjdXJyZW50UGFzc3dvcmQgPSBnZXRBbm9ueW1vdXNQYXNzd29yZCgpO1xuXG4gICAgcmV0dXJuIGNoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmQoY3VycmVudFBhc3N3b3JkLCB1c2VybmFtZSwgcGFzc3dvcmQpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICBhY2NvdW50LnRyaWdnZXIoJ3NpZ251cCcsIHVzZXJuYW1lKTtcbiAgICAgIHJlbW92ZUFub255bW91c1Bhc3N3b3JkKCk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIHdlIG5vdyBjYW4gYmUgc3VyZSB0aGF0IHdlIGZldGNoZWQgdGhlIGxhdGVzdCBfdXNlcnMgZG9jLCBzbyB3ZSBjYW4gdXBkYXRlIGl0XG4gIC8vIHdpdGhvdXQgYSBwb3RlbnRpYWwgY29uZmxpY3QgZXJyb3IuXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZUZldGNoQmVmb3JlRGVzdHJveVN1Y2Nlc3MoKSB7XG5cbiAgICBob29kaWUucmVtb3RlLmRpc2Nvbm5lY3QoKTtcbiAgICB1c2VyRG9jLl9kZWxldGVkID0gdHJ1ZTtcblxuICAgIHJldHVybiB3aXRoUHJldmlvdXNSZXF1ZXN0c0Fib3J0ZWQoJ3VwZGF0ZVVzZXJzRG9jJywgZnVuY3Rpb24oKSB7XG4gICAgICBhY2NvdW50LnJlcXVlc3QoJ1BVVCcsIHVzZXJEb2NVcmwoKSwge1xuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh1c2VyRG9jKSxcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIGRlcGVuZGVuZCBvbiB3aGF0IGtpbmQgb2YgZXJyb3Igd2UgZ2V0LCB3ZSB3YW50IHRvIGlnbm9yZVxuICAvLyBpdCBvciBub3QuXG4gIC8vIFdoZW4gd2UgZ2V0IGEgJ0hvb2RpZU5vdEZvdW5kRXJyb3InIGl0IG1lYW5zIHRoYXQgdGhlIF91c2VycyBkb2MgaGFiZVxuICAvLyBiZWVuIHJlbW92ZWQgYWxyZWFkeSwgc28gd2UgZG9uJ3QgbmVlZCB0byBkbyBpdCBhbnltb3JlLCBidXRcbiAgLy8gc3RpbGwgd2FudCB0byBmaW5pc2ggdGhlIGRlc3Ryb3kgbG9jYWxseSwgc28gd2UgcmV0dXJuIGFcbiAgLy8gcmVzb2x2ZWQgcHJvbWlzZVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVGZXRjaEJlZm9yZURlc3Ryb3lFcnJvcihlcnJvcikge1xuICAgIGlmIChlcnJvci5uYW1lID09PSAnSG9vZGllTm90Rm91bmRFcnJvcicpIHtcbiAgICAgIHJldHVybiByZXNvbHZlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZWplY3RXaXRoKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICAvL1xuICAvLyByZW1vdmUgZXZlcnl0aGluZyBmb3JtIHRoZSBjdXJyZW50IGFjY291bnQsIHNvIGEgbmV3IGFjY291bnQgY2FuIGJlIGluaXRpYXRlZC5cbiAgLy9cbiAgZnVuY3Rpb24gY2xlYW51cCgpIHtcblxuICAgIC8vIGFsbG93IG90aGVyIG1vZHVsZXMgdG8gY2xlYW4gdXAgbG9jYWwgZGF0YSAmIGNhY2hlc1xuICAgIGFjY291bnQudHJpZ2dlcignY2xlYW51cCcpO1xuICAgIGF1dGhlbnRpY2F0ZWQgPSB1bmRlZmluZWQ7XG4gICAgc2V0VXNlcm5hbWUodW5kZWZpbmVkKTtcblxuICAgIHJldHVybiByZXNvbHZlKCk7XG4gIH1cblxuXG4gIC8vXG4gIGZ1bmN0aW9uIGNsZWFudXBBbmRUcmlnZ2VyU2lnbk91dCgpIHtcbiAgICByZXR1cm4gY2xlYW51cCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC50cmlnZ2VyKCdzaWdub3V0Jyk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIGRlcGVuZGluZyBvbiB3ZXRoZXIgdGhlIHVzZXIgc2lnbmVkVXAgbWFudWFsbHkgb3IgaGFzIGJlZW4gc2lnbmVkIHVwXG4gIC8vIGFub255bW91c2x5IHRoZSBwcmVmaXggaW4gdGhlIENvdWNoREIgX3VzZXJzIGRvYyBkaWZmZXJlbnRpYXRlcy5cbiAgLy8gQW4gYW5vbnltb3VzIHVzZXIgaXMgY2hhcmFjdGVyaXplZCBieSBpdHMgdXNlcm5hbWUsIHRoYXQgZXF1YWxzXG4gIC8vIGl0cyBob29kaWUuaWQgKHNlZSBgYW5vbnltb3VzU2lnblVwYClcbiAgLy9cbiAgLy8gV2UgZGlmZmVyZW50aWF0ZSB3aXRoIGBoYXNBbm9ueW1vdXNBY2NvdW50KClgLCBiZWNhdXNlIGB1c2VyVHlwZUFuZElkYFxuICAvLyBpcyB1c2VkIHdpdGhpbiBgc2lnblVwYCBtZXRob2QsIHNvIHdlIG5lZWQgdG8gYmUgYWJsZSB0byBkaWZmZXJlbnRpYXRlXG4gIC8vIGJldHdlZW4gYW5vbnltb3VzIGFuZCBub3JtYWwgdXNlcnMgYmVmb3JlIGFuIGFjY291bnQgaGFzIGJlZW4gY3JlYXRlZC5cbiAgLy9cbiAgZnVuY3Rpb24gdXNlclR5cGVBbmRJZCh1c2VybmFtZSkge1xuICAgIHZhciB0eXBlO1xuXG4gICAgaWYgKHVzZXJuYW1lID09PSBob29kaWUuaWQoKSkge1xuICAgICAgdHlwZSA9ICd1c2VyX2Fub255bW91cyc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHR5cGUgPSAndXNlcic7XG4gICAgfVxuICAgIHJldHVybiAnJyArIHR5cGUgKyAnLycgKyB1c2VybmFtZTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gdHVybiBhIHVzZXJuYW1lIGludG8gYSB2YWxpZCBfdXNlcnMgZG9jLl9pZFxuICAvL1xuICBmdW5jdGlvbiB1c2VyRG9jS2V5KHVzZXJuYW1lKSB7XG4gICAgdXNlcm5hbWUgPSB1c2VybmFtZSB8fCBhY2NvdW50LnVzZXJuYW1lO1xuICAgIHJldHVybiAnJyArIHVzZXJEb2NQcmVmaXggKyAnOicgKyAodXNlclR5cGVBbmRJZCh1c2VybmFtZSkpO1xuICB9XG5cbiAgLy9cbiAgLy8gZ2V0IFVSTCBvZiBteSBfdXNlcnMgZG9jXG4gIC8vXG4gIGZ1bmN0aW9uIHVzZXJEb2NVcmwodXNlcm5hbWUpIHtcbiAgICByZXR1cm4gJy9fdXNlcnMvJyArIChlbmNvZGVVUklDb21wb25lbnQodXNlckRvY0tleSh1c2VybmFtZSkpKTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gdXBkYXRlIG15IF91c2VycyBkb2MuXG4gIC8vXG4gIC8vIElmIGEgbmV3IHVzZXJuYW1lIGhhcyBiZWVuIHBhc3NlZCwgd2Ugc2V0IHRoZSBzcGVjaWFsIGF0dHJpYnV0ICRuZXdVc2VybmFtZS5cbiAgLy8gVGhpcyB3aWxsIGxldCB0aGUgdXNlcm5hbWUgY2hhbmdlIHdvcmtlciBjcmVhdGUgY3JlYXRlIGEgbmV3IF91c2VycyBkb2MgZm9yXG4gIC8vIHRoZSBuZXcgdXNlcm5hbWUgYW5kIHJlbW92ZSB0aGUgY3VycmVudCBvbmVcbiAgLy9cbiAgLy8gSWYgYSBuZXcgcGFzc3dvcmQgaGFzIGJlZW4gcGFzc2VkLCBzYWx0IGFuZCBwYXNzd29yZF9zaGEgZ2V0IHJlbW92ZWRcbiAgLy8gZnJvbSBfdXNlcnMgZG9jIGFuZCBhZGQgdGhlIHBhc3N3b3JkIGluIGNsZWFyIHRleHQuIENvdWNoREIgd2lsbCByZXBsYWNlIGl0IHdpdGhcbiAgLy8gYWNjb3JkaW5nIHBhc3N3b3JkX3NoYSBhbmQgYSBuZXcgc2FsdCBzZXJ2ZXIgc2lkZVxuICAvL1xuICBmdW5jdGlvbiBzZW5kQ2hhbmdlVXNlcm5hbWVBbmRQYXNzd29yZFJlcXVlc3QoY3VycmVudFBhc3N3b3JkLCBuZXdVc2VybmFtZSwgbmV3UGFzc3dvcmQpIHtcblxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIHByZXBhcmUgdXBkYXRlZCBfdXNlcnMgZG9jXG4gICAgICB2YXIgZGF0YSA9IGV4dGVuZCh7fSwgdXNlckRvYyk7XG5cbiAgICAgIGlmIChuZXdVc2VybmFtZSkge1xuICAgICAgICBkYXRhLiRuZXdVc2VybmFtZSA9IG5ld1VzZXJuYW1lO1xuICAgICAgfVxuXG4gICAgICBkYXRhLnVwZGF0ZWRBdCA9IG5vdygpO1xuICAgICAgZGF0YS5zaWduZWRVcEF0ID0gZGF0YS5zaWduZWRVcEF0IHx8IG5vdygpO1xuXG4gICAgICAvLyB0cmlnZ2VyIHBhc3N3b3JkIHVwZGF0ZSB3aGVuIG5ld1Bhc3N3b3JkIHNldFxuICAgICAgaWYgKG5ld1Bhc3N3b3JkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZGVsZXRlIGRhdGEuc2FsdDtcbiAgICAgICAgZGVsZXRlIGRhdGEucGFzc3dvcmRfc2hhO1xuICAgICAgICBkYXRhLnBhc3N3b3JkID0gbmV3UGFzc3dvcmQ7XG4gICAgICB9XG5cbiAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgndXBkYXRlVXNlcnNEb2MnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnUFVUJywgdXNlckRvY1VybCgpLCBvcHRpb25zKS50aGVuKFxuICAgICAgICAgIGhhbmRsZUNoYW5nZVVzZXJuYW1lQW5kUGFzc3dvcmRSZXNwb25zZShuZXdVc2VybmFtZSwgbmV3UGFzc3dvcmQgfHwgY3VycmVudFBhc3N3b3JkKVxuICAgICAgICApO1xuICAgICAgfSk7XG5cbiAgICB9O1xuICB9XG5cblxuICAvL1xuICAvLyBkZXBlbmRpbmcgb24gd2hldGhlciBhIG5ld1VzZXJuYW1lIGhhcyBiZWVuIHBhc3NlZCwgd2UgY2FuIHNpZ24gaW4gcmlnaHQgYXdheVxuICAvLyBvciBoYXZlIHRvIHdhaXQgdW50aWwgdGhlIHdvcmtlciByZW1vdmVkIHRoZSBvbGQgYWNjb3VudFxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVDaGFuZ2VVc2VybmFtZUFuZFBhc3N3b3JkUmVzcG9uc2UobmV3VXNlcm5hbWUsIG5ld1Bhc3N3b3JkKSB7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBob29kaWUucmVtb3RlLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgaWYgKG5ld1VzZXJuYW1lKSB7XG4gICAgICAgIC8vIG5vdGUgdGhhdCBpZiB1c2VybmFtZSBoYXMgYmVlbiBjaGFuZ2VkLCBuZXdQYXNzd29yZCBpcyB0aGUgY3VycmVudCBwYXNzd29yZC5cbiAgICAgICAgLy8gV2UgYWx3YXlzIGNoYW5nZSBlaXRoZXIgdGhlIG9uZSwgb3IgdGhlIG90aGVyLlxuICAgICAgICByZXR1cm4gYXdhaXRDdXJyZW50QWNjb3VudFJlbW92ZWQoYWNjb3VudC51c2VybmFtZSwgbmV3UGFzc3dvcmQpLnRoZW4oIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBhY2NvdW50LnNpZ25JbihuZXdVc2VybmFtZSwgbmV3UGFzc3dvcmQpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBhY2NvdW50LnNpZ25JbihhY2NvdW50LnVzZXJuYW1lLCBuZXdQYXNzd29yZCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vXG4gIC8vIGtlZXAgc2VuZGluZyBzaWduIGluIHJlcXVlc3RzIHVudGlsIHRoZSBzZXJ2ZXIgcmV0dXJucyBhIDQwMVxuICAvL1xuICBmdW5jdGlvbiBhd2FpdEN1cnJlbnRBY2NvdW50UmVtb3ZlZCh1c2VybmFtZSwgcGFzc3dvcmQsIGRlZmVyKSB7XG4gICAgaWYgKCFkZWZlcikge1xuICAgICAgZGVmZXIgPSBnZXREZWZlcigpO1xuICAgIH1cblxuICAgIHZhciByZXF1ZXN0T3B0aW9ucyA9IHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgbmFtZTogdXNlclR5cGVBbmRJZCh1c2VybmFtZSksXG4gICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZFxuICAgICAgfVxuICAgIH07XG5cbiAgICB3aXRoUHJldmlvdXNSZXF1ZXN0c0Fib3J0ZWQoJ3NpZ25JbicsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFjY291bnQucmVxdWVzdCgnUE9TVCcsICcvX3Nlc3Npb24nLCByZXF1ZXN0T3B0aW9ucyk7XG4gICAgfSkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgIGdsb2JhbC5zZXRUaW1lb3V0KGF3YWl0Q3VycmVudEFjY291bnRSZW1vdmVkLCAzMDAsIHVzZXJuYW1lLCBwYXNzd29yZCwgZGVmZXIpO1xuICAgIH0pLmZhaWwoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICByZXR1cm4gZGVmZXIucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICBkZWZlci5yZWplY3QoZXJyb3IpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfVxuXG5cbiAgLy9cbiAgLy8gbWFrZSBzdXJlIHRoYXQgdGhlIHNhbWUgcmVxdWVzdCBkb2Vzbid0IGdldCBzZW50IHR3aWNlXG4gIC8vIGJ5IGNhbmNlbGxpbmcgdGhlIHByZXZpb3VzIG9uZS5cbiAgLy9cbiAgZnVuY3Rpb24gd2l0aFByZXZpb3VzUmVxdWVzdHNBYm9ydGVkKG5hbWUsIHJlcXVlc3RGdW5jdGlvbikge1xuICAgIGlmIChyZXF1ZXN0c1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZW9mIHJlcXVlc3RzW25hbWVdLmFib3J0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJlcXVlc3RzW25hbWVdLmFib3J0KCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJlcXVlc3RzW25hbWVdID0gcmVxdWVzdEZ1bmN0aW9uKCk7XG4gICAgcmV0dXJuIHJlcXVlc3RzW25hbWVdO1xuICB9XG5cblxuICAvL1xuICAvLyBpZiB0aGVyZSBpcyBhIHBlbmRpbmcgcmVxdWVzdCwgcmV0dXJuIGl0cyBwcm9taXNlIGluc3RlYWRcbiAgLy8gb2Ygc2VuZGluZyBhbm90aGVyIHJlcXVlc3RcbiAgLy9cbiAgZnVuY3Rpb24gd2l0aFNpbmdsZVJlcXVlc3QobmFtZSwgcmVxdWVzdEZ1bmN0aW9uKSB7XG5cbiAgICBpZiAocmVxdWVzdHNbbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGVvZiByZXF1ZXN0c1tuYW1lXS5zdGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAocmVxdWVzdHNbbmFtZV0uc3RhdGUoKSA9PT0gJ3BlbmRpbmcnKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcXVlc3RzW25hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVxdWVzdHNbbmFtZV0gPSByZXF1ZXN0RnVuY3Rpb24oKTtcbiAgICByZXR1cm4gcmVxdWVzdHNbbmFtZV07XG4gIH1cblxuXG4gIC8vXG4gIC8vIHB1c2ggbG9jYWwgY2hhbmdlcyB3aGVuIHVzZXIgc2lnbnMgb3V0LCB1bmxlc3MgaGUgZW5mb3JjZXMgc2lnbiBvdXRcbiAgLy8gaW4gYW55IGNhc2Ugd2l0aCBge2lnbm9yZUxvY2FsQ2hhbmdlczogdHJ1ZX1gXG4gIC8vXG4gIGZ1bmN0aW9uIHB1c2hMb2NhbENoYW5nZXMob3B0aW9ucykge1xuICAgIGlmIChob29kaWUuc3RvcmUuaGFzTG9jYWxDaGFuZ2VzKCkgJiYgIW9wdGlvbnMuaWdub3JlTG9jYWxDaGFuZ2VzKSB7XG4gICAgICByZXR1cm4gaG9vZGllLnJlbW90ZS5wdXNoKCk7XG4gICAgfVxuICAgIHJldHVybiByZXNvbHZlKCk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBzZW5kU2lnbk91dFJlcXVlc3QoKSB7XG4gICAgcmV0dXJuIHdpdGhTaW5nbGVSZXF1ZXN0KCdzaWduT3V0JywgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYWNjb3VudC5yZXF1ZXN0KCdERUxFVEUnLCAnL19zZXNzaW9uJyk7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vXG4gIC8vIHRoZSBzaWduIGluIHJlcXVlc3QgdGhhdCBzdGFydHMgYSBDb3VjaERCIHNlc3Npb24gaWZcbiAgLy8gaXQgc3VjY2VlZHMuIFdlIHNlcGFyYXRlZCB0aGUgYWN0dWFsIHNpZ24gaW4gcmVxdWVzdCBmcm9tXG4gIC8vIHRoZSBzaWduSW4gbWV0aG9kLCBhcyB0aGUgbGF0dGVyIGFsc28gcnVucyBzaWduT3V0IGludGVucnRhbGx5XG4gIC8vIHRvIGNsZWFuIHVwIGxvY2FsIGRhdGEgYmVmb3JlIHN0YXJ0aW5nIGEgbmV3IHNlc3Npb24uIEJ1dCBhc1xuICAvLyBvdGhlciBtZXRob2RzIGxpa2Ugc2lnblVwIG9yIGNoYW5nZVBhc3N3b3JkIGRvIGFsc28gbmVlZCB0b1xuICAvLyBzaWduIGluIHRoZSB1c2VyIChhZ2FpbiksIHRoZXNlIG5lZWQgdG8gc2VuZCB0aGUgc2lnbiBpblxuICAvLyByZXF1ZXN0IGJ1dCB3aXRob3V0IGEgc2lnbk91dCBiZWZvcmVoYW5kLCBhcyB0aGUgdXNlciByZW1haW5zXG4gIC8vIHRoZSBzYW1lLlxuICAvL1xuICBmdW5jdGlvbiBzZW5kU2lnbkluUmVxdWVzdCh1c2VybmFtZSwgcGFzc3dvcmQsIG9wdGlvbnMpIHtcbiAgICB2YXIgcmVxdWVzdE9wdGlvbnMgPSB7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIG5hbWU6IHVzZXJUeXBlQW5kSWQodXNlcm5hbWUpLFxuICAgICAgICBwYXNzd29yZDogcGFzc3dvcmRcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHdpdGhQcmV2aW91c1JlcXVlc3RzQWJvcnRlZCgnc2lnbkluJywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IGFjY291bnQucmVxdWVzdCgnUE9TVCcsICcvX3Nlc3Npb24nLCByZXF1ZXN0T3B0aW9ucyk7XG5cbiAgICAgIHJldHVybiBwcm9taXNlLnRoZW4oXG4gICAgICBoYW5kbGVTaWduSW5TdWNjZXNzKG9wdGlvbnMpKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIG5vdygpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKTtcbiAgfVxuXG4gIC8vXG4gIC8vIGV4cG9zZSBwdWJsaWMgYWNjb3VudCBBUElcbiAgLy9cbiAgaG9vZGllLmFjY291bnQgPSBhY2NvdW50O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZUFjY291bnQ7XG4iLCJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTsvLyBob29kaWUuY2hlY2tDb25uZWN0aW9uKCkgJiBob29kaWUuaXNDb25uZWN0ZWQoKVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cbnZhciByZWplY3QgPSByZXF1aXJlKCcuLi91dGlscy9wcm9taXNlL3JlamVjdCcpO1xudmFyIHJlc29sdmUgPSByZXF1aXJlKCcuLi91dGlscy9wcm9taXNlL3Jlc29sdmUnKTtcblxuLy9cbmZ1bmN0aW9uIGhvb2RpZUNvbm5lY3Rpb24oaG9vZGllKSB7XG5cbiAgLy8gc3RhdGVcbiAgdmFyIG9ubGluZSA9IHRydWU7XG4gIHZhciBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCA9IDMwMDAwO1xuICB2YXIgY2hlY2tDb25uZWN0aW9uUmVxdWVzdCA9IG51bGw7XG4gIHZhciBjaGVja0Nvbm5lY3Rpb25UaW1lb3V0ID0gbnVsbDtcblxuICAvLyBDaGVjayBDb25uZWN0aW9uXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHRoZSBgY2hlY2tDb25uZWN0aW9uYCBtZXRob2QgaXMgdXNlZCwgd2VsbCwgdG8gY2hlY2sgaWZcbiAgLy8gdGhlIGhvb2RpZSBiYWNrZW5kIGlzIHJlYWNoYWJsZSBhdCBgYmFzZVVybGAgb3Igbm90LlxuICAvLyBDaGVjayBDb25uZWN0aW9uIGlzIGF1dG9tYXRpY2FsbHkgY2FsbGVkIG9uIHN0YXJ0dXBcbiAgLy8gYW5kIHRoZW4gZWFjaCAzMCBzZWNvbmRzLiBJZiBpdCBmYWlscywgaXRcbiAgLy9cbiAgLy8gLSBzZXRzIGBvbmxpbmUgPSBmYWxzZWBcbiAgLy8gLSB0cmlnZ2VycyBgb2ZmbGluZWAgZXZlbnRcbiAgLy8gLSBzZXRzIGBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCA9IDMwMDBgXG4gIC8vXG4gIC8vIHdoZW4gY29ubmVjdGlvbiBjYW4gYmUgcmVlc3RhYmxpc2hlZCwgaXRcbiAgLy9cbiAgLy8gLSBzZXRzIGBvbmxpbmUgPSB0cnVlYFxuICAvLyAtIHRyaWdnZXJzIGBvbmxpbmVgIGV2ZW50XG4gIC8vIC0gc2V0cyBgY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwgPSAzMDAwMGBcbiAgLy9cbiAgaG9vZGllLmNoZWNrQ29ubmVjdGlvbiA9IGZ1bmN0aW9uIGNoZWNrQ29ubmVjdGlvbigpIHtcbiAgICB2YXIgcmVxID0gY2hlY2tDb25uZWN0aW9uUmVxdWVzdDtcblxuICAgIGlmIChyZXEgJiYgcmVxLnN0YXRlKCkgPT09ICdwZW5kaW5nJykge1xuICAgICAgcmV0dXJuIHJlcTtcbiAgICB9XG5cbiAgICBnbG9iYWwuY2xlYXJUaW1lb3V0KGNoZWNrQ29ubmVjdGlvblRpbWVvdXQpO1xuXG4gICAgY2hlY2tDb25uZWN0aW9uUmVxdWVzdCA9IGhvb2RpZS5yZXF1ZXN0KCdHRVQnLCAnLycpLnRoZW4oXG4gICAgICBoYW5kbGVDaGVja0Nvbm5lY3Rpb25TdWNjZXNzLFxuICAgICAgaGFuZGxlQ2hlY2tDb25uZWN0aW9uRXJyb3JcbiAgICApO1xuXG4gICAgcmV0dXJuIGNoZWNrQ29ubmVjdGlvblJlcXVlc3Q7XG4gIH07XG5cblxuICAvLyBpc0Nvbm5lY3RlZFxuICAvLyAtLS0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgaG9vZGllLmlzQ29ubmVjdGVkID0gZnVuY3Rpb24gaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIG9ubGluZTtcbiAgfTtcblxuXG4gIC8vXG4gIC8vXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZUNoZWNrQ29ubmVjdGlvblN1Y2Nlc3MoKSB7XG4gICAgY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwgPSAzMDAwMDtcblxuICAgIGNoZWNrQ29ubmVjdGlvblRpbWVvdXQgPSBnbG9iYWwuc2V0VGltZW91dChob29kaWUuY2hlY2tDb25uZWN0aW9uLCBjaGVja0Nvbm5lY3Rpb25JbnRlcnZhbCk7XG5cbiAgICBpZiAoIWhvb2RpZS5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgICBob29kaWUudHJpZ2dlcigncmVjb25uZWN0ZWQnKTtcbiAgICAgIG9ubGluZSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc29sdmUoKTtcbiAgfVxuXG5cbiAgLy9cbiAgLy9cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQ2hlY2tDb25uZWN0aW9uRXJyb3IoKSB7XG4gICAgY2hlY2tDb25uZWN0aW9uSW50ZXJ2YWwgPSAzMDAwO1xuXG4gICAgY2hlY2tDb25uZWN0aW9uVGltZW91dCA9IGdsb2JhbC5zZXRUaW1lb3V0KGhvb2RpZS5jaGVja0Nvbm5lY3Rpb24sIGNoZWNrQ29ubmVjdGlvbkludGVydmFsKTtcblxuICAgIGlmIChob29kaWUuaXNDb25uZWN0ZWQoKSkge1xuICAgICAgaG9vZGllLnRyaWdnZXIoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgICAgb25saW5lID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlamVjdCgpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllQ29ubmVjdGlvbjtcbiIsIi8vIGhvb2RpZS5pZFxuLy8gPT09PT09PT09XG5cbnZhciBnZW5lcmF0ZUlkID0gcmVxdWlyZSgnLi4vdXRpbHMvZ2VuZXJhdGVfaWQnKTtcblxuLy8gZ2VuZXJhdGVzIGEgcmFuZG9tIGlkIGFuZCBwZXJzaXN0cyB1c2luZyBob29kaWUuY29uZmlnXG4vLyB1bnRpbCB0aGUgdXNlciBzaWducyBvdXQgb3IgZGVsZXRlcyBsb2NhbCBkYXRhXG5mdW5jdGlvbiBob29kaWVJZCAoaG9vZGllKSB7XG4gIHZhciBpZDtcblxuICBmdW5jdGlvbiBnZXRJZCgpIHtcbiAgICBpZiAoISBpZCkge1xuICAgICAgc2V0SWQoIGdlbmVyYXRlSWQoKSApO1xuICAgIH1cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRJZChuZXdJZCkge1xuICAgIGlkID0gbmV3SWQ7XG4gICAgXG4gICAgaG9vZGllLmNvbmZpZy5zZXQoJ19ob29kaWVJZCcsIG5ld0lkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVuc2V0SWQgKCkge1xuICAgIGlkID0gdW5kZWZpbmVkO1xuICAgIGhvb2RpZS5jb25maWcudW5zZXQoJ19ob29kaWVJZCcpO1xuICB9XG5cbiAgLy9cbiAgLy8gaW5pdGlhbGl6ZVxuICAvL1xuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIGlkID0gaG9vZGllLmNvbmZpZy5nZXQoJ19ob29kaWVJZCcpO1xuXG4gICAgLy8gREVQUkVDQVRFRCwgcmVtb3ZlIGJlZm9yZSAxLjBcbiAgICBpZiAoISBpZCkge1xuICAgICAgaG9vZGllLmNvbmZpZy5nZXQoJ19hY2NvdW50Lm93bmVySGFzaCcpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biBpbml0IG9ubHkgb25jZSBmcm9tIG91dHNpZGVcbiAgZ2V0SWQuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgIGluaXQoKTtcbiAgICBkZWxldGUgZ2V0SWQuaW5pdDtcbiAgfTtcblxuICAvL1xuICAvLyBzdWJzY3JpYmUgdG8gZXZlbnRzIGNvbWluZyBmcm9tIG90aGVyIG1vZHVsZXNcbiAgLy9cbiAgZnVuY3Rpb24gc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCkge1xuICAgIGhvb2RpZS5vbignYWNjb3VudDpjbGVhbnVwJywgdW5zZXRJZCk7XG4gICAgaG9vZGllLm9uKCdhY2NvdW50OnNpZ25pbicsIGZ1bmN0aW9uKHVzZXJuYW1lLCBob29kaWVJZCkge1xuICAgICAgc2V0SWQoaG9vZGllSWQpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gYWxsb3cgdG8gcnVuIHRoaXMgb25seSBvbmNlIGZyb20gb3V0c2lkZVxuICBnZXRJZC5zdWJzY3JpYmVUb091dHNpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKTtcbiAgICBkZWxldGUgZ2V0SWQuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzO1xuICB9O1xuXG4gIC8vXG4gIC8vIFB1YmxpYyBBUElcbiAgLy9cbiAgaG9vZGllLmlkID0gZ2V0SWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllSWQ7XG4iLCIvLyBPcGVuIHN0b3Jlc1xuLy8gLS0tLS0tLS0tLS0tLVxuXG52YXIgaG9vZGllUmVtb3RlU3RvcmUgPSByZXF1aXJlKCcuLi9saWIvc3RvcmUvcmVtb3RlJyk7XG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG5cbmZ1bmN0aW9uIGhvb2RpZU9wZW4oaG9vZGllKSB7XG5cbiAgLy8gZ2VuZXJpYyBtZXRob2QgdG8gb3BlbiBhIHN0b3JlLlxuICAvL1xuICAvLyAgICAgaG9vZGllLm9wZW4oXCJzb21lX3N0b3JlX25hbWVcIikuZmluZEFsbCgpXG4gIC8vXG4gIGZ1bmN0aW9uIG9wZW4oc3RvcmVOYW1lLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBleHRlbmQob3B0aW9ucywge1xuICAgICAgbmFtZTogc3RvcmVOYW1lXG4gICAgfSk7XG5cbiAgICByZXR1cm4gaG9vZGllUmVtb3RlU3RvcmUoaG9vZGllLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8vXG4gIC8vIFB1YmxpYyBBUElcbiAgLy9cbiAgaG9vZGllLm9wZW4gPSBvcGVuO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZU9wZW47XG4iLCIvLyBBY2NvdW50UmVtb3RlXG4vLyA9PT09PT09PT09PT09PT1cblxuLy8gQ29ubmVjdGlvbiAvIFNvY2tldCB0byBvdXIgY291Y2hcbi8vXG4vLyBBY2NvdW50UmVtb3RlIGlzIHVzaW5nIENvdWNoREIncyBgX2NoYW5nZXNgIGZlZWQgdG9cbi8vIGxpc3RlbiB0byBjaGFuZ2VzIGFuZCBgX2J1bGtfZG9jc2AgdG8gcHVzaCBsb2NhbCBjaGFuZ2VzXG4vL1xuLy8gV2hlbiBob29kaWUucmVtb3RlIGlzIGNvbnRpbnVvdXNseSBzeW5jaW5nIChkZWZhdWx0KSxcbi8vIGl0IHdpbGwgY29udGludW91c2x5ICBzeW5jaHJvbml6ZSB3aXRoIGxvY2FsIHN0b3JlLFxuLy8gb3RoZXJ3aXNlIHN5bmMsIHB1bGwgb3IgcHVzaCBjYW4gYmUgY2FsbGVkIG1hbnVhbGx5XG4vLyBcbi8vIE5vdGUgdGhhdCBob29kaWVSZW1vdGUgbXVzdCBiZSBpbml0aWFsaXplZCBiZWZvcmUgdGhlXG4vLyBBUEkgaXMgYXZhaWxhYmxlOlxuLy8gXG4vLyAgICAgaG9vZGllUmVtb3RlKGhvb2RpZSk7XG4vLyAgICAgaG9vZGllLnJlbW90ZS5pbml0KCk7XG4vL1xuXG52YXIgcmVqZWN0V2l0aCA9IHJlcXVpcmUoJy4uL3V0aWxzL3Byb21pc2UvcmVqZWN0X3dpdGgnKTtcblxuZnVuY3Rpb24gaG9vZGllUmVtb3RlIChob29kaWUpIHtcbiAgLy8gaW5oZXJpdCBmcm9tIEhvb2RpZXMgU3RvcmUgQVBJXG4gIHZhciByZW1vdGUgPSBob29kaWUub3Blbihob29kaWUuYWNjb3VudC5kYigpLCB7XG5cbiAgICAvLyB3ZSdyZSBhbHdheXMgY29ubmVjdGVkIHRvIG91ciBvd24gZGJcbiAgICBjb25uZWN0ZWQ6IHRydWUsXG5cbiAgICAvLyBkbyBub3QgcHJlZml4IGZpbGVzIGZvciBteSBvd24gcmVtb3RlXG4gICAgcHJlZml4OiAnJyxcblxuICAgIC8vXG4gICAgc2luY2U6IHNpbmNlTnJDYWxsYmFjayxcblxuICAgIC8vXG4gICAgZGVmYXVsdE9iamVjdHNUb1B1c2g6IGhvb2RpZS5zdG9yZS5jaGFuZ2VkT2JqZWN0cyxcblxuICAgIC8vXG4gICAga25vd25PYmplY3RzOiBob29kaWUuc3RvcmUuaW5kZXgoKS5tYXAoIGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyIHR5cGVBbmRJZCA9IGtleS5zcGxpdCgvXFwvLyk7XG4gICAgICByZXR1cm4geyB0eXBlOiB0eXBlQW5kSWRbMF0sIGlkOiB0eXBlQW5kSWRbMV19O1xuICAgIH0pXG4gIH0pO1xuXG4gIC8vIENvbm5lY3RcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gd2Ugc2xpZ2h0bHkgZXh0ZW5kIHRoZSBvcmlnaW5hbCByZW1vdGUuY29ubmVjdCBtZXRob2RcbiAgLy8gcHJvdmlkZWQgYnkgYGhvb2RpZVJlbW90ZVN0b3JlYCwgdG8gY2hlY2sgaWYgdGhlIHVzZXJcbiAgLy8gaGFzIGFuIGFjY291bnQgYmVmb3JlaGFuZC4gV2UgYWxzbyBoYXJkY29kZSB0aGUgcmlnaHRcbiAgLy8gbmFtZSBmb3IgcmVtb3RlIChjdXJyZW50IHVzZXIncyBkYXRhYmFzZSBuYW1lKVxuICAvL1xuICB2YXIgb3JpZ2luYWxDb25uZWN0TWV0aG9kID0gcmVtb3RlLmNvbm5lY3Q7XG4gIHJlbW90ZS5jb25uZWN0ID0gZnVuY3Rpb24gY29ubmVjdCgpIHtcbiAgICBpZiAoISBob29kaWUuYWNjb3VudC5oYXNBY2NvdW50KCkgKSB7XG4gICAgICByZXR1cm4gcmVqZWN0V2l0aCgnVXNlciBoYXMgbm8gZGF0YWJhc2UgdG8gY29ubmVjdCB0bycpO1xuICAgIH1cbiAgICByZXR1cm4gb3JpZ2luYWxDb25uZWN0TWV0aG9kKCBob29kaWUuYWNjb3VudC5kYigpICk7XG4gIH07XG5cbiAgLy8gdHJpZ2dlclxuICAvLyAtLS0tLS0tLS1cblxuICAvLyBwcm94aWVzIHRvIGhvb2RpZS50cmlnZ2VyXG4gIHJlbW90ZS50cmlnZ2VyID0gZnVuY3Rpb24gdHJpZ2dlcigpIHtcbiAgICB2YXIgZXZlbnROYW1lO1xuXG4gICAgZXZlbnROYW1lID0gYXJndW1lbnRzWzBdO1xuXG4gICAgdmFyIHBhcmFtZXRlcnMgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG5cbiAgICByZXR1cm4gaG9vZGllLnRyaWdnZXIuYXBwbHkoaG9vZGllLCBbJ3JlbW90ZTonICsgZXZlbnROYW1lXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwocGFyYW1ldGVycykpKTtcbiAgfTtcblxuXG4gIC8vIG9uXG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHByb3hpZXMgdG8gaG9vZGllLm9uXG4gIHJlbW90ZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50TmFtZSwgZGF0YSkge1xuICAgIGV2ZW50TmFtZSA9IGV2ZW50TmFtZS5yZXBsYWNlKC8oXnwgKShbXiBdKykvZywgJyQxJysncmVtb3RlOiQyJyk7XG4gICAgcmV0dXJuIGhvb2RpZS5vbihldmVudE5hbWUsIGRhdGEpO1xuICB9O1xuXG5cbiAgLy8gdW5iaW5kXG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHByb3hpZXMgdG8gaG9vZGllLnVuYmluZFxuICByZW1vdGUudW5iaW5kID0gZnVuY3Rpb24gdW5iaW5kKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgICBldmVudE5hbWUgPSBldmVudE5hbWUucmVwbGFjZSgvKF58ICkoW14gXSspL2csICckMScrJ3JlbW90ZTokMicpO1xuICAgIHJldHVybiBob29kaWUudW5iaW5kKGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuICB9O1xuXG5cbiAgLy8gUHJpdmF0ZVxuICAvLyAtLS0tLS0tLS1cblxuICAvLyBnZXR0ZXIgLyBzZXR0ZXIgZm9yIHNpbmNlIG51bWJlclxuICAvL1xuICBmdW5jdGlvbiBzaW5jZU5yQ2FsbGJhY2soc2luY2VOcikge1xuICAgIGlmIChzaW5jZU5yKSB7XG4gICAgICByZXR1cm4gaG9vZGllLmNvbmZpZy5zZXQoJ19yZW1vdGUuc2luY2UnLCBzaW5jZU5yKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaG9vZGllLmNvbmZpZy5nZXQoJ19yZW1vdGUuc2luY2UnKSB8fCAwO1xuICB9XG5cbiAgLy9cbiAgLy8gc3Vic2NyaWJlIHRvIGV2ZW50cyBjb21pbmcgZnJvbSBvdXRzaWRlXG4gIC8vXG4gIGZ1bmN0aW9uIHN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cygpIHtcblxuICAgIGhvb2RpZS5vbigncmVtb3RlOmNvbm5lY3QnLCBmdW5jdGlvbigpIHtcbiAgICAgIGhvb2RpZS5vbignc3RvcmU6aWRsZScsIHJlbW90ZS5wdXNoKTtcbiAgICAgIHJlbW90ZS5wdXNoKCk7XG4gICAgfSk7XG5cbiAgICBob29kaWUub24oJ3JlbW90ZTpkaXNjb25uZWN0JywgZnVuY3Rpb24oKSB7XG4gICAgICBob29kaWUudW5iaW5kKCdzdG9yZTppZGxlJywgcmVtb3RlLnB1c2gpO1xuICAgIH0pO1xuXG4gICAgaG9vZGllLm9uKCdkaXNjb25uZWN0ZWQnLCByZW1vdGUuZGlzY29ubmVjdCk7XG4gICAgaG9vZGllLm9uKCdyZWNvbm5lY3RlZCcsIHJlbW90ZS5jb25uZWN0KTtcblxuICAgIC8vIGFjY291bnQgZXZlbnRzXG4gICAgaG9vZGllLm9uKCdhY2NvdW50OnNpZ25pbicsIHJlbW90ZS5jb25uZWN0KTtcbiAgICBob29kaWUub24oJ2FjY291bnQ6c2lnbmluOmFub255bW91cycsIHJlbW90ZS5jb25uZWN0KTtcblxuICAgIGhvb2RpZS5vbignYWNjb3VudDpyZWF1dGhlbnRpY2F0ZWQnLCByZW1vdGUuY29ubmVjdCk7XG4gICAgaG9vZGllLm9uKCdhY2NvdW50OnNpZ25vdXQnLCByZW1vdGUuZGlzY29ubmVjdCk7XG4gIH1cblxuICAvLyBhbGxvdyB0byBydW4gdGhpcyBvbmNlIGZyb20gb3V0c2lkZVxuICByZW1vdGUuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCk7XG4gICAgZGVsZXRlIHJlbW90ZS5zdWJzY3JpYmVUb091dHNpZGVFdmVudHM7XG4gIH07XG5cbiAgLy9cbiAgLy8gZXhwb3NlIHJlbW90ZSBBUElcbiAgLy9cbiAgaG9vZGllLnJlbW90ZSA9IHJlbW90ZTtcbn1cblxuZnVuY3Rpb24gaG9vZGllUmVtb3RlRmFjdG9yeShob29kaWUpIHtcblxuICB2YXIgaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgIGhvb2RpZVJlbW90ZShob29kaWUpO1xuICB9O1xuXG4gIGhvb2RpZS5yZW1vdGUgPSB7XG4gICAgaW5pdDogaW5pdFxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVJlbW90ZUZhY3Rvcnk7XG4iLCIvL1xuLy8gaG9vZGllLnJlcXVlc3Rcbi8vID09PT09PT09PT09PT09PT1cblxuLy8gSG9vZGllJ3MgY2VudHJhbCBwbGFjZSB0byBzZW5kIHJlcXVlc3QgdG8gaXRzIGJhY2tlbmQuXG4vLyBBdCB0aGUgbW9tZW50LCBpdCdzIGEgd3JhcHBlciBhcm91bmQgalF1ZXJ5J3MgYWpheCBtZXRob2QsXG4vLyBidXQgd2UgbWlnaHQgZ2V0IHJpZCBvZiB0aGlzIGRlcGVuZGVuY3kgaW4gdGhlIGZ1dHVyZS5cbi8vXG4vLyBJdCBoYXMgYnVpbGQgaW4gc3VwcG9ydCBmb3IgQ09SUyBhbmQgYSBzdGFuZGFyZCBlcnJvclxuLy8gaGFuZGxpbmcgdGhhdCBub3JtYWxpemVzIGVycm9ycyByZXR1cm5lZCBieSBDb3VjaERCXG4vLyB0byBKYXZhU2NyaXB0J3MgbmF0aXZlIGNvbnZlbnRpb25zIG9mIGVycm9ycyBoYXZpbmdcbi8vIGEgbmFtZSAmIGEgbWVzc2FnZSBwcm9wZXJ0eS5cbi8vXG4vLyBDb21tb24gZXJyb3JzIHRvIGV4cGVjdDpcbi8vXG4vLyAqIEhvb2RpZVJlcXVlc3RFcnJvclxuLy8gKiBIb29kaWVVbmF1dGhvcml6ZWRFcnJvclxuLy8gKiBIb29kaWVDb25mbGljdEVycm9yXG4vLyAqIEhvb2RpZVNlcnZlckVycm9yXG5cbnZhciBob29kaWVmeVJlcXVlc3RFcnJvck5hbWUgPSByZXF1aXJlKCcuLi91dGlscy9ob29kaWVmeV9yZXF1ZXN0X2Vycm9yX25hbWUnKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKTtcbnZhciByZWplY3RXaXRoID0gcmVxdWlyZSgnLi4vdXRpbHMvcHJvbWlzZS9yZWplY3Rfd2l0aCcpO1xuXG5mdW5jdGlvbiBob29kaWVSZXF1ZXN0KGhvb2RpZSkge1xuICB2YXIgJGFqYXggPSAkLmFqYXg7XG5cbiAgLy8gSG9vZGllIGJhY2tlbmQgbGlzdGVudHMgdG8gcmVxdWVzdHMgcHJlZml4ZWQgYnkgL19hcGksXG4gIC8vIHNvIHdlIHByZWZpeCBhbGwgcmVxdWVzdHMgd2l0aCByZWxhdGl2ZSBVUkxzXG4gIHZhciBBUElfUEFUSCA9ICcvX2FwaSc7XG5cbiAgLy8gUmVxdWVzdHNcbiAgLy8gLS0tLS0tLS0tLVxuXG4gIC8vIHNlbmRzIHJlcXVlc3RzIHRvIHRoZSBob29kaWUgYmFja2VuZC5cbiAgLy9cbiAgLy8gICAgIHByb21pc2UgPSBob29kaWUucmVxdWVzdCgnR0VUJywgJy91c2VyX2RhdGFiYXNlL2RvY19pZCcpXG4gIC8vXG4gIGZ1bmN0aW9uIHJlcXVlc3QodHlwZSwgdXJsLCBvcHRpb25zKSB7XG4gICAgdmFyIGRlZmF1bHRzLCByZXF1ZXN0UHJvbWlzZSwgcGlwZWRQcm9taXNlO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBkZWZhdWx0cyA9IHtcbiAgICAgIHR5cGU6IHR5cGUsXG4gICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgfTtcblxuICAgIC8vIGlmIGFic29sdXRlIHBhdGggcGFzc2VkLCBzZXQgQ09SUyBoZWFkZXJzXG5cbiAgICAvLyBpZiByZWxhdGl2ZSBwYXRoIHBhc3NlZCwgcHJlZml4IHdpdGggYmFzZVVybFxuICAgIGlmICghL15odHRwLy50ZXN0KHVybCkpIHtcbiAgICAgIHVybCA9IChob29kaWUuYmFzZVVybCB8fCAnJykgKyBBUElfUEFUSCArIHVybDtcbiAgICB9XG5cbiAgICAvLyBpZiB1cmwgaXMgY3Jvc3MgZG9tYWluLCBzZXQgQ09SUyBoZWFkZXJzXG4gICAgaWYgKC9eaHR0cC8udGVzdCh1cmwpKSB7XG4gICAgICBkZWZhdWx0cy54aHJGaWVsZHMgPSB7XG4gICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZVxuICAgICAgfTtcbiAgICAgIGRlZmF1bHRzLmNyb3NzRG9tYWluID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBkZWZhdWx0cy51cmwgPSB1cmw7XG5cblxuICAgIC8vIHdlIGFyZSBwaXBpbmcgdGhlIHJlc3VsdCBvZiB0aGUgcmVxdWVzdCB0byByZXR1cm4gYSBuaWNlclxuICAgIC8vIGVycm9yIGlmIHRoZSByZXF1ZXN0IGNhbm5vdCByZWFjaCB0aGUgc2VydmVyIGF0IGFsbC5cbiAgICAvLyBXZSBjYW4ndCByZXR1cm4gdGhlIHByb21pc2Ugb2YgYWpheCBkaXJlY3RseSBiZWNhdXNlIG9mXG4gICAgLy8gdGhlIHBpcGluZywgYXMgZm9yIHdoYXRldmVyIHJlYXNvbiB0aGUgcmV0dXJuZWQgcHJvbWlzZVxuICAgIC8vIGRvZXMgbm90IGhhdmUgdGhlIGBhYm9ydGAgbWV0aG9kIGFueSBtb3JlLCBtYXliZSBvdGhlcnNcbiAgICAvLyBhcyB3ZWxsLiBTZWUgYWxzbyBodHRwOi8vYnVncy5qcXVlcnkuY29tL3RpY2tldC8xNDEwNFxuICAgIHJlcXVlc3RQcm9taXNlID0gJGFqYXgoZXh0ZW5kKGRlZmF1bHRzLCBvcHRpb25zKSk7XG4gICAgcGlwZWRQcm9taXNlID0gcmVxdWVzdFByb21pc2UudGhlbiggbnVsbCwgaGFuZGxlUmVxdWVzdEVycm9yKTtcbiAgICBwaXBlZFByb21pc2UuYWJvcnQgPSByZXF1ZXN0UHJvbWlzZS5hYm9ydDtcblxuICAgIHJldHVybiBwaXBlZFByb21pc2U7XG4gIH1cblxuICAvL1xuICAvL1xuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVSZXF1ZXN0RXJyb3IoeGhyKSB7XG4gICAgdmFyIGVycm9yO1xuXG4gICAgdHJ5IHtcbiAgICAgIGVycm9yID0gcGFyc2VFcnJvckZyb21SZXNwb25zZSh4aHIpO1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuXG4gICAgICBpZiAoeGhyLnJlc3BvbnNlVGV4dCkge1xuICAgICAgICBlcnJvciA9IHhoci5yZXNwb25zZVRleHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlcnJvciA9IHtcbiAgICAgICAgICBuYW1lOiAnSG9vZGllQ29ubmVjdGlvbkVycm9yJyxcbiAgICAgICAgICBtZXNzYWdlOiAnQ291bGQgbm90IGNvbm5lY3QgdG8gSG9vZGllIHNlcnZlciBhdCB7e3VybH19LicsXG4gICAgICAgICAgdXJsOiBob29kaWUuYmFzZVVybCB8fCAnLydcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVqZWN0V2l0aChlcnJvcikucHJvbWlzZSgpO1xuICB9XG5cbiAgLy9cbiAgLy8gQ291Y2hEQiByZXR1cm5zIGVycm9ycyBpbiBKU09OIGZvcm1hdCwgd2l0aCB0aGUgcHJvcGVydGllc1xuICAvLyBgZXJyb3JgIGFuZCBgcmVhc29uYC4gSG9vZGllIHVzZXMgSmF2YVNjcmlwdCdzIG5hdGl2ZSBFcnJvclxuICAvLyBwcm9wZXJ0aWVzIGBuYW1lYCBhbmQgYG1lc3NhZ2VgIGluc3RlYWQsIHNvIHdlIGFyZSBub3JtYWxpemluZ1xuICAvLyB0aGF0LlxuICAvL1xuICAvLyBCZXNpZGVzIHRoZSByZW5hbWluZyB3ZSBhbHNvIGRvIGEgbWF0Y2hpbmcgd2l0aCBhIG1hcCBvZiBrbm93blxuICAvLyBlcnJvcnMgdG8gbWFrZSB0aGVtIG1vcmUgY2xlYXIuIEZvciByZWZlcmVuY2UsIHNlZVxuICAvLyBodHRwczovL3dpa2kuYXBhY2hlLm9yZy9jb3VjaGRiL0RlZmF1bHRfaHR0cF9lcnJvcnMgJlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYXBhY2hlL2NvdWNoZGIvYmxvYi9tYXN0ZXIvc3JjL2NvdWNoZGIvY291Y2hfaHR0cGQuZXJsI0w4MDdcbiAgLy9cblxuICBmdW5jdGlvbiBwYXJzZUVycm9yRnJvbVJlc3BvbnNlKHhocikge1xuICAgIHZhciBlcnJvciA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG5cbiAgICAvLyBnZXQgZXJyb3IgbmFtZVxuICAgIGVycm9yLm5hbWUgPSBIVFRQX1NUQVRVU19FUlJPUl9NQVBbeGhyLnN0YXR1c107XG4gICAgaWYgKCEgZXJyb3IubmFtZSkge1xuICAgICAgZXJyb3IubmFtZSA9IGhvb2RpZWZ5UmVxdWVzdEVycm9yTmFtZShlcnJvci5lcnJvcik7XG4gICAgfVxuXG4gICAgLy8gc3RvcmUgc3RhdHVzICYgbWVzc2FnZVxuICAgIGVycm9yLnN0YXR1cyA9IHhoci5zdGF0dXM7XG4gICAgZXJyb3IubWVzc2FnZSA9IGVycm9yLnJlYXNvbiB8fCAnJztcbiAgICBlcnJvci5tZXNzYWdlID0gZXJyb3IubWVzc2FnZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGVycm9yLm1lc3NhZ2Uuc2xpY2UoMSk7XG5cbiAgICAvLyBjbGVhbnVwXG4gICAgZGVsZXRlIGVycm9yLmVycm9yO1xuICAgIGRlbGV0ZSBlcnJvci5yZWFzb247XG5cbiAgICByZXR1cm4gZXJyb3I7XG4gIH1cblxuICAvLyBtYXAgQ291Y2hEQiBIVFRQIHN0YXR1cyBjb2RlcyB0byBIb29kaWUgRXJyb3JzXG4gIHZhciBIVFRQX1NUQVRVU19FUlJPUl9NQVAgPSB7XG4gICAgNDAwOiAnSG9vZGllUmVxdWVzdEVycm9yJywgLy8gYmFkIHJlcXVlc3RcbiAgICA0MDE6ICdIb29kaWVVbmF1dGhvcml6ZWRFcnJvcicsXG4gICAgNDAzOiAnSG9vZGllUmVxdWVzdEVycm9yJywgLy8gZm9yYmlkZGVuXG4gICAgNDA0OiAnSG9vZGllTm90Rm91bmRFcnJvcicsIC8vIGZvcmJpZGRlblxuICAgIDQwOTogJ0hvb2RpZUNvbmZsaWN0RXJyb3InLFxuICAgIDQxMjogJ0hvb2RpZUNvbmZsaWN0RXJyb3InLCAvLyBmaWxlIGV4aXN0XG4gICAgNTAwOiAnSG9vZGllU2VydmVyRXJyb3InXG4gIH07XG5cbiAgLy9cbiAgLy8gcHVibGljIEFQSVxuICAvL1xuICBob29kaWUucmVxdWVzdCA9IHJlcXVlc3Q7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllUmVxdWVzdDtcbiIsInZhciBnbG9iYWw9dHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9Oy8vIExvY2FsU3RvcmVcbi8vID09PT09PT09PT09PVxuXG4vL1xudmFyIGhvb2RpZVN0b3JlQXBpID0gcmVxdWlyZSgnLi4vbGliL3N0b3JlL2FwaScpO1xudmFyIEhvb2RpZU9iamVjdFR5cGVFcnJvciA9IHJlcXVpcmUoJy4uL2xpYi9lcnJvci9vYmplY3RfdHlwZScpO1xudmFyIEhvb2RpZU9iamVjdElkRXJyb3IgPSByZXF1aXJlKCcuLi9saWIvZXJyb3Ivb2JqZWN0X2lkJyk7XG52YXIgZ2VuZXJhdGVJZCA9IHJlcXVpcmUoJy4uL3V0aWxzL2dlbmVyYXRlX2lkJyk7XG5cbnZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKTtcblxudmFyIGdldERlZmVyID0gcmVxdWlyZSgnLi4vdXRpbHMvcHJvbWlzZS9kZWZlcicpO1xudmFyIHJlamVjdFdpdGggPSByZXF1aXJlKCcuLi91dGlscy9wcm9taXNlL3JlamVjdF93aXRoJyk7XG52YXIgcmVzb2x2ZVdpdGggPSByZXF1aXJlKCcuLi91dGlscy9wcm9taXNlL3Jlc29sdmVfd2l0aCcpO1xuXG52YXIgbG9jYWxTdG9yYWdlV3JhcHBlciA9IHJlcXVpcmUoJy4uL3V0aWxzJykubG9jYWxTdG9yYWdlV3JhcHBlcjtcblxuLy9cbmZ1bmN0aW9uIGhvb2RpZVN0b3JlIChob29kaWUpIHtcblxuICB2YXIgbG9jYWxTdG9yZSA9IHt9O1xuXG4gIC8vXG4gIC8vIHN0YXRlXG4gIC8vIC0tLS0tLS1cbiAgLy9cblxuICAvLyBjYWNoZSBvZiBsb2NhbFN0b3JhZ2UgZm9yIHF1aWNrZXIgYWNjZXNzXG4gIHZhciBjYWNoZWRPYmplY3QgPSB7fTtcblxuICAvLyBtYXAgb2YgZGlydHkgb2JqZWN0cyBieSB0aGVpciBpZHNcbiAgdmFyIGRpcnR5ID0ge307XG5cbiAgLy8gcXVldWUgb2YgbWV0aG9kIGNhbGxzIGRvbmUgZHVyaW5nIGJvb3RzdHJhcHBpbmdcbiAgdmFyIHF1ZXVlID0gW107XG5cbiAgLy8gMiBzZWNvbmRzIHRpbW91dCBiZWZvcmUgdHJpZ2dlcmluZyB0aGUgYHN0b3JlOmlkbGVgIGV2ZW50XG4gIC8vXG4gIHZhciBpZGxlVGltZW91dCA9IDIwMDA7XG5cblxuXG5cbiAgLy8gLS0tLS0tXG4gIC8vXG4gIC8vIHNhdmVzIHRoZSBwYXNzZWQgb2JqZWN0IGludG8gdGhlIHN0b3JlIGFuZCByZXBsYWNlc1xuICAvLyBhbiBldmVudHVhbGx5IGV4aXN0aW5nIG9iamVjdCB3aXRoIHNhbWUgdHlwZSAmIGlkLlxuICAvL1xuICAvLyBXaGVuIGlkIGlzIHVuZGVmaW5lZCwgaXQgZ2V0cyBnZW5lcmF0ZWQgYW4gbmV3IG9iamVjdCBnZXRzIHNhdmVkXG4gIC8vXG4gIC8vIEl0IGFsc28gYWRkcyB0aW1lc3RhbXBzIGFsb25nIHRoZSB3YXk6XG4gIC8vXG4gIC8vICogYGNyZWF0ZWRBdGAgdW5sZXNzIGl0IGFscmVhZHkgZXhpc3RzXG4gIC8vICogYHVwZGF0ZWRBdGAgZXZlcnkgdGltZVxuICAvLyAqIGBfc3luY2VkQXRgICBpZiBjaGFuZ2VzIGNvbWVzIGZyb20gcmVtb3RlXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2U6XG4gIC8vXG4gIC8vICAgICBzdG9yZS5zYXZlKCdjYXInLCB1bmRlZmluZWQsIHtjb2xvcjogJ3JlZCd9KVxuICAvLyAgICAgc3RvcmUuc2F2ZSgnY2FyJywgJ2FiYzQ1NjcnLCB7Y29sb3I6ICdyZWQnfSlcbiAgLy9cbiAgbG9jYWxTdG9yZS5zYXZlID0gZnVuY3Rpb24gc2F2ZShvYmplY3QsIG9wdGlvbnMpIHtcbiAgICB2YXIgY3VycmVudE9iamVjdCwgZGVmZXIsIGVycm9yLCBldmVudCwgaXNOZXcsIGtleTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLy8gaWYgc3RvcmUgaXMgY3VycmVudGx5IGJvb3RzdHJhcHBpbmcgZGF0YSBmcm9tIHJlbW90ZSxcbiAgICAvLyB3ZSdyZSBxdWV1ZWluZyBsb2NhbCBzYXZlcyB1bnRpbCBpdCdzIGZpbmlzaGVkLlxuICAgIGlmIChzdG9yZS5pc0Jvb3RzdHJhcHBpbmcoKSAmJiAhb3B0aW9ucy5yZW1vdGUpIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKCdzYXZlJywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICAvLyBnZW5lcmF0ZSBhbiBpZCBpZiBuZWNlc3NhcnlcbiAgICBpZiAob2JqZWN0LmlkKSB7XG4gICAgICBjdXJyZW50T2JqZWN0ID0gY2FjaGUob2JqZWN0LnR5cGUsIG9iamVjdC5pZCk7XG4gICAgICBpc05ldyA9IHR5cGVvZiBjdXJyZW50T2JqZWN0ICE9PSAnb2JqZWN0JztcbiAgICB9IGVsc2Uge1xuICAgICAgaXNOZXcgPSB0cnVlO1xuICAgICAgb2JqZWN0LmlkID0gZ2VuZXJhdGVJZCgpO1xuICAgIH1cblxuICAgIGlmIChpc05ldykge1xuICAgICAgLy8gYWRkIGNyZWF0ZWRCeSBoYXNoXG4gICAgICBvYmplY3QuY3JlYXRlZEJ5ID0gb2JqZWN0LmNyZWF0ZWRCeSB8fCBob29kaWUuaWQoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBsZWF2ZSBjcmVhdGVkQnkgaGFzaFxuICAgICAgaWYgKGN1cnJlbnRPYmplY3QuY3JlYXRlZEJ5KSB7XG4gICAgICAgIG9iamVjdC5jcmVhdGVkQnkgPSBjdXJyZW50T2JqZWN0LmNyZWF0ZWRCeTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBoYW5kbGUgbG9jYWwgcHJvcGVydGllcyBhbmQgaGlkZGVuIHByb3BlcnRpZXMgd2l0aCAkIHByZWZpeFxuICAgIC8vIGtlZXAgbG9jYWwgcHJvcGVydGllcyBmb3IgcmVtb3RlIHVwZGF0ZXNcbiAgICBpZiAoIWlzTmV3KSB7XG5cbiAgICAgIC8vIGZvciByZW1vdGUgdXBkYXRlcywga2VlcCBsb2NhbCBwcm9wZXJ0aWVzIChzdGFydGluZyB3aXRoICdfJylcbiAgICAgIC8vIGZvciBsb2NhbCB1cGRhdGVzLCBrZWVwIGhpZGRlbiBwcm9wZXJ0aWVzIChzdGFydGluZyB3aXRoICckJylcbiAgICAgIGZvciAoa2V5IGluIGN1cnJlbnRPYmplY3QpIHtcbiAgICAgICAgaWYgKCFvYmplY3QuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgIHN3aXRjaCAoa2V5LmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgJ18nOlxuICAgICAgICAgICAgaWYgKG9wdGlvbnMucmVtb3RlKSB7XG4gICAgICAgICAgICAgIG9iamVjdFtrZXldID0gY3VycmVudE9iamVjdFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnJCc6XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMucmVtb3RlKSB7XG4gICAgICAgICAgICAgIG9iamVjdFtrZXldID0gY3VycmVudE9iamVjdFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGFkZCB0aW1lc3RhbXBzXG4gICAgaWYgKG9wdGlvbnMucmVtb3RlKSB7XG4gICAgICBvYmplY3QuX3N5bmNlZEF0ID0gbm93KCk7XG4gICAgfSBlbHNlIGlmICghb3B0aW9ucy5zaWxlbnQpIHtcbiAgICAgIG9iamVjdC51cGRhdGVkQXQgPSBub3coKTtcbiAgICAgIG9iamVjdC5jcmVhdGVkQXQgPSBvYmplY3QuY3JlYXRlZEF0IHx8IG9iamVjdC51cGRhdGVkQXQ7XG4gICAgfVxuXG4gICAgLy8gaGFuZGxlIGxvY2FsIGNoYW5nZXNcbiAgICAvL1xuICAgIC8vIEEgbG9jYWwgY2hhbmdlIGlzIG1lYW50IHRvIGJlIHJlcGxpY2F0ZWQgdG8gdGhlXG4gICAgLy8gdXNlcnMgZGF0YWJhc2UsIGJ1dCBub3QgYmV5b25kLiBGb3IgZXhhbXBsZSB3aGVuXG4gICAgLy8gSSBzdWJzY3JpYmVkIHRvIGEgc2hhcmUgYnV0IHRoZW4gZGVjaWRlIHRvIHVuc3Vic2NyaWJlLFxuICAgIC8vIGFsbCBvYmplY3RzIGdldCByZW1vdmVkIHdpdGggbG9jYWw6IHRydWUgZmxhZywgc28gdGhhdFxuICAgIC8vIHRoZXkgZ2V0IHJlbW92ZWQgZnJvbSBteSBkYXRhYmFzZSwgYnV0IHdvbid0IGFueXdoZXJlIGVsc2UuXG4gICAgaWYgKG9wdGlvbnMubG9jYWwpIHtcbiAgICAgIG9iamVjdC5fJGxvY2FsID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIG9iamVjdC5fJGxvY2FsO1xuICAgIH1cblxuICAgIGRlZmVyID0gZ2V0RGVmZXIoKTtcblxuICAgIHRyeSB7XG4gICAgICBvYmplY3QgPSBjYWNoZShvYmplY3QudHlwZSwgb2JqZWN0LmlkLCBvYmplY3QsIG9wdGlvbnMpO1xuICAgICAgZGVmZXIucmVzb2x2ZShvYmplY3QsIGlzTmV3KS5wcm9taXNlKCk7XG4gICAgICBldmVudCA9IGlzTmV3ID8gJ2FkZCcgOiAndXBkYXRlJztcbiAgICAgIHRyaWdnZXJFdmVudHMoZXZlbnQsIG9iamVjdCwgb3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICBlcnJvciA9IF9lcnJvcjtcbiAgICAgIGRlZmVyLnJlamVjdChlcnJvci50b1N0cmluZygpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICB9O1xuXG5cbiAgLy8gZmluZFxuICAvLyAtLS0tLS1cblxuICAvLyBsb2FkcyBvbmUgb2JqZWN0IGZyb20gU3RvcmUsIHNwZWNpZmllZCBieSBgdHlwZWAgYW5kIGBpZGBcbiAgLy9cbiAgLy8gZXhhbXBsZSB1c2FnZTpcbiAgLy9cbiAgLy8gICAgIHN0b3JlLmZpbmQoJ2NhcicsICdhYmM0NTY3JylcbiAgbG9jYWxTdG9yZS5maW5kID0gZnVuY3Rpb24odHlwZSwgaWQpIHtcbiAgICB2YXIgZXJyb3IsIG9iamVjdDtcblxuICAgIC8vIGlmIHN0b3JlIGlzIGN1cnJlbnRseSBib290c3RyYXBwaW5nIGRhdGEgZnJvbSByZW1vdGUsXG4gICAgLy8gd2UncmUgcXVldWVpbmcgdW50aWwgaXQncyBmaW5pc2hlZFxuICAgIGlmIChzdG9yZS5pc0Jvb3RzdHJhcHBpbmcoKSkge1xuICAgICAgcmV0dXJuIGVucXVldWUoJ2ZpbmQnLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBvYmplY3QgPSBjYWNoZSh0eXBlLCBpZCk7XG4gICAgICBpZiAoIW9iamVjdCkge1xuICAgICAgICByZXR1cm4gcmVqZWN0V2l0aCh7XG4gICAgICAgICAgbmFtZTogJ0hvb2RpZU5vdEZvdW5kRXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6ICdcInt7dHlwZX19XCIgd2l0aCBpZCBcInt7aWR9fVwiIGNvdWxkIG5vdCBiZSBmb3VuZCdcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzb2x2ZVdpdGgob2JqZWN0KTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGVycm9yID0gX2Vycm9yO1xuICAgICAgcmV0dXJuIHJlamVjdFdpdGgoZXJyb3IpO1xuICAgIH1cbiAgfTtcblxuXG4gIC8vIGZpbmRBbGxcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gcmV0dXJucyBhbGwgb2JqZWN0cyBmcm9tIHN0b3JlLlxuICAvLyBDYW4gYmUgb3B0aW9uYWxseSBmaWx0ZXJlZCBieSBhIHR5cGUgb3IgYSBmdW5jdGlvblxuICAvL1xuICAvLyBleGFtcGxlIHVzYWdlOlxuICAvL1xuICAvLyAgICAgc3RvcmUuZmluZEFsbCgpXG4gIC8vICAgICBzdG9yZS5maW5kQWxsKCdjYXInKVxuICAvLyAgICAgc3RvcmUuZmluZEFsbChmdW5jdGlvbihvYmopIHsgcmV0dXJuIG9iai5icmFuZCA9PSAnVGVzbGEnIH0pXG4gIC8vXG4gIGxvY2FsU3RvcmUuZmluZEFsbCA9IGZ1bmN0aW9uIGZpbmRBbGwoZmlsdGVyKSB7XG4gICAgdmFyIGN1cnJlbnRUeXBlLCBkZWZlciwgZXJyb3IsIGlkLCBrZXksIGtleXMsIG9iaiwgcmVzdWx0cywgdHlwZTtcblxuXG5cbiAgICBpZiAoZmlsdGVyID09IG51bGwpIHtcbiAgICAgIGZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gaWYgc3RvcmUgaXMgY3VycmVudGx5IGJvb3RzdHJhcHBpbmcgZGF0YSBmcm9tIHJlbW90ZSxcbiAgICAvLyB3ZSdyZSBxdWV1ZWluZyB1bnRpbCBpdCdzIGZpbmlzaGVkXG4gICAgaWYgKHN0b3JlLmlzQm9vdHN0cmFwcGluZygpKSB7XG4gICAgICByZXR1cm4gZW5xdWV1ZSgnZmluZEFsbCcsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAga2V5cyA9IHN0b3JlLmluZGV4KCk7XG5cbiAgICAvLyBub3JtYWxpemUgZmlsdGVyXG4gICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0eXBlID0gZmlsdGVyO1xuICAgICAgZmlsdGVyID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmoudHlwZSA9PT0gdHlwZTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZGVmZXIgPSBnZXREZWZlcigpO1xuXG4gICAgdHJ5IHtcblxuICAgICAgLy9cbiAgICAgIHJlc3VsdHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0ga2V5cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIGtleSA9IGtleXNbX2ldO1xuICAgICAgICAgIGlmICghKGlzU2VtYW50aWNLZXkoa2V5KSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfcmVmID0ga2V5LnNwbGl0KCcvJyksXG4gICAgICAgICAgY3VycmVudFR5cGUgPSBfcmVmWzBdLFxuICAgICAgICAgIGlkID0gX3JlZlsxXTtcblxuICAgICAgICAgIG9iaiA9IGNhY2hlKGN1cnJlbnRUeXBlLCBpZCk7XG4gICAgICAgICAgaWYgKG9iaiAmJiBmaWx0ZXIob2JqKSkge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChvYmopO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfSkuY2FsbCh0aGlzKTtcblxuICAgICAgLy8gc29ydCBmcm9tIG5ld2VzdCB0byBvbGRlc3RcbiAgICAgIHJlc3VsdHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIGlmIChhLmNyZWF0ZWRBdCA+IGIuY3JlYXRlZEF0KSB7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9IGVsc2UgaWYgKGEuY3JlYXRlZEF0IDwgYi5jcmVhdGVkQXQpIHtcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBkZWZlci5yZXNvbHZlKHJlc3VsdHMpLnByb21pc2UoKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGVycm9yID0gX2Vycm9yO1xuICAgICAgZGVmZXIucmVqZWN0KGVycm9yKS5wcm9taXNlKCk7XG4gICAgfVxuICAgIHJldHVybiBkZWZlci5wcm9taXNlKCk7XG4gIH07XG5cblxuICAvLyBSZW1vdmVcbiAgLy8gLS0tLS0tLS1cblxuICAvLyBSZW1vdmVzIG9uZSBvYmplY3Qgc3BlY2lmaWVkIGJ5IGB0eXBlYCBhbmQgYGlkYC5cbiAgLy9cbiAgLy8gd2hlbiBvYmplY3QgaGFzIGJlZW4gc3luY2VkIGJlZm9yZSwgbWFyayBpdCBhcyBkZWxldGVkLlxuICAvLyBPdGhlcndpc2UgcmVtb3ZlIGl0IGZyb20gU3RvcmUuXG4gIGxvY2FsU3RvcmUucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKHR5cGUsIGlkLCBvcHRpb25zKSB7XG4gICAgdmFyIGtleSwgb2JqZWN0LCBvYmplY3RXYXNNYXJrZWRBc0RlbGV0ZWQ7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIGlmIHN0b3JlIGlzIGN1cnJlbnRseSBib290c3RyYXBwaW5nIGRhdGEgZnJvbSByZW1vdGUsXG4gICAgLy8gd2UncmUgcXVldWVpbmcgbG9jYWwgcmVtb3ZlcyB1bnRpbCBpdCdzIGZpbmlzaGVkLlxuICAgIGlmIChzdG9yZS5pc0Jvb3RzdHJhcHBpbmcoKSAmJiAhb3B0aW9ucy5yZW1vdGUpIHtcbiAgICAgIHJldHVybiBlbnF1ZXVlKCdyZW1vdmUnLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIGtleSA9IHR5cGUgKyAnLycgKyBpZDtcblxuICAgIG9iamVjdCA9IGNhY2hlKHR5cGUsIGlkKTtcblxuICAgIC8vIGlmIGNoYW5nZSBjb21lcyBmcm9tIHJlbW90ZSwganVzdCBjbGVhbiB1cCBsb2NhbGx5XG4gICAgaWYgKG9wdGlvbnMucmVtb3RlKSB7XG4gICAgICBsb2NhbFN0b3JhZ2VXcmFwcGVyLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICAgIG9iamVjdFdhc01hcmtlZEFzRGVsZXRlZCA9IGNhY2hlZE9iamVjdFtrZXldICYmIGlzTWFya2VkQXNEZWxldGVkKGNhY2hlZE9iamVjdFtrZXldKTtcbiAgICAgIGNhY2hlZE9iamVjdFtrZXldID0gZmFsc2U7XG4gICAgICBjbGVhckNoYW5nZWQodHlwZSwgaWQpO1xuICAgICAgaWYgKG9iamVjdFdhc01hcmtlZEFzRGVsZXRlZCAmJiBvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVXaXRoKG9iamVjdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFvYmplY3QpIHtcbiAgICAgIHJldHVybiByZWplY3RXaXRoKHtcbiAgICAgICAgbmFtZTogJ0hvb2RpZU5vdEZvdW5kRXJyb3InLFxuICAgICAgICBtZXNzYWdlOiAnXCJ7e3R5cGV9fVwiIHdpdGggaWQgXCJ7e2lkfX1cIlwiIGNvdWxkIG5vdCBiZSBmb3VuZCdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChvYmplY3QuX3N5bmNlZEF0KSB7XG4gICAgICBvYmplY3QuX2RlbGV0ZWQgPSB0cnVlO1xuICAgICAgY2FjaGUodHlwZSwgaWQsIG9iamVjdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleSA9IHR5cGUgKyAnLycgKyBpZDtcbiAgICAgIGxvY2FsU3RvcmFnZVdyYXBwZXIucmVtb3ZlSXRlbShrZXkpO1xuICAgICAgY2FjaGVkT2JqZWN0W2tleV0gPSBmYWxzZTtcbiAgICAgIGNsZWFyQ2hhbmdlZCh0eXBlLCBpZCk7XG4gICAgfVxuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hvb2RpZWhxL2hvb2RpZS5qcy9pc3N1ZXMvMTQ3XG4gICAgaWYgKG9wdGlvbnMudXBkYXRlKSB7XG4gICAgICBvYmplY3QgPSBvcHRpb25zLnVwZGF0ZTtcbiAgICAgIGRlbGV0ZSBvcHRpb25zLnVwZGF0ZTtcbiAgICB9XG4gICAgdHJpZ2dlckV2ZW50cygncmVtb3ZlJywgb2JqZWN0LCBvcHRpb25zKTtcbiAgICByZXR1cm4gcmVzb2x2ZVdpdGgob2JqZWN0KTtcbiAgfTtcblxuXG4gIC8vIFJlbW92ZSBhbGxcbiAgLy8gLS0tLS0tLS0tLVxuXG4gIC8vIFJlbW92ZXMgb25lIG9iamVjdCBzcGVjaWZpZWQgYnkgYHR5cGVgIGFuZCBgaWRgLlxuICAvL1xuICAvLyB3aGVuIG9iamVjdCBoYXMgYmVlbiBzeW5jZWQgYmVmb3JlLCBtYXJrIGl0IGFzIGRlbGV0ZWQuXG4gIC8vIE90aGVyd2lzZSByZW1vdmUgaXQgZnJvbSBTdG9yZS5cbiAgbG9jYWxTdG9yZS5yZW1vdmVBbGwgPSBmdW5jdGlvbiByZW1vdmVBbGwodHlwZSwgb3B0aW9ucykge1xuICAgIHJldHVybiBzdG9yZS5maW5kQWxsKHR5cGUpLnRoZW4oZnVuY3Rpb24ob2JqZWN0cykge1xuICAgICAgdmFyIG9iamVjdCwgX2ksIF9sZW4sIHJlc3VsdHM7XG5cbiAgICAgIHJlc3VsdHMgPSBbXTtcblxuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBvYmplY3RzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIG9iamVjdCA9IG9iamVjdHNbX2ldO1xuICAgICAgICByZXN1bHRzLnB1c2goc3RvcmUucmVtb3ZlKG9iamVjdC50eXBlLCBvYmplY3QuaWQsIG9wdGlvbnMpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH0pO1xuICB9O1xuXG5cbiAgLy8gdmFsaWRhdGVcbiAgLy8gLS0tLS0tLS0tLVxuXG4gIC8vXG4gIGZ1bmN0aW9uIHZhbGlkYXRlIChvYmplY3QpIHtcblxuICAgIGlmIChIb29kaWVPYmplY3RUeXBlRXJyb3IuaXNJbnZhbGlkKG9iamVjdC50eXBlKSkge1xuICAgICAgcmV0dXJuIG5ldyBIb29kaWVPYmplY3RUeXBlRXJyb3Ioe1xuICAgICAgICB0eXBlOiBvYmplY3QudHlwZVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCFvYmplY3QuaWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoSG9vZGllT2JqZWN0SWRFcnJvci5pc0ludmFsaWQob2JqZWN0LmlkKSkge1xuICAgICAgcmV0dXJuIG5ldyBIb29kaWVPYmplY3RJZEVycm9yKHtcbiAgICAgICAgaWQ6IG9iamVjdC5pZFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIHN0b3JlID0gaG9vZGllU3RvcmVBcGkoaG9vZGllLCB7XG5cbiAgICAvLyB2YWxpZGF0ZVxuICAgIHZhbGlkYXRlOiB2YWxpZGF0ZSxcblxuICAgIGJhY2tlbmQ6IHtcbiAgICAgIHNhdmU6IGxvY2FsU3RvcmUuc2F2ZSxcbiAgICAgIGZpbmQ6IGxvY2FsU3RvcmUuZmluZCxcbiAgICAgIGZpbmRBbGw6IGxvY2FsU3RvcmUuZmluZEFsbCxcbiAgICAgIHJlbW92ZTogbG9jYWxTdG9yZS5yZW1vdmUsXG4gICAgICByZW1vdmVBbGw6IGxvY2FsU3RvcmUucmVtb3ZlQWxsLFxuICAgIH1cbiAgfSk7XG5cblxuXG4gIC8vIGV4dGVuZGVkIHB1YmxpYyBBUElcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuICAvLyBpbmRleFxuICAvLyAtLS0tLS0tXG5cbiAgLy8gb2JqZWN0IGtleSBpbmRleFxuICAvLyBUT0RPOiBtYWtlIHRoaXMgY2FjaHlcbiAgc3RvcmUuaW5kZXggPSBmdW5jdGlvbiBpbmRleCgpIHtcbiAgICB2YXIgaSwga2V5LCBrZXlzLCBfaSwgX3JlZjtcbiAgICBrZXlzID0gW107XG4gICAgZm9yIChpID0gX2kgPSAwLCBfcmVmID0gbG9jYWxTdG9yYWdlV3JhcHBlci5sZW5ndGgoKTsgMCA8PSBfcmVmID8gX2kgPCBfcmVmIDogX2kgPiBfcmVmOyBpID0gMCA8PSBfcmVmID8gKytfaSA6IC0tX2kpIHtcbiAgICAgIGtleSA9IGxvY2FsU3RvcmFnZVdyYXBwZXIua2V5KGkpO1xuICAgICAgaWYgKGlzU2VtYW50aWNLZXkoa2V5KSkge1xuICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cblxuICAvLyBjaGFuZ2VkIG9iamVjdHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyByZXR1cm5zIGFuIEFycmF5IG9mIGFsbCBkaXJ0eSBkb2N1bWVudHNcbiAgc3RvcmUuY2hhbmdlZE9iamVjdHMgPSBmdW5jdGlvbiBjaGFuZ2VkT2JqZWN0cygpIHtcbiAgICB2YXIgaWQsIGtleSwgb2JqZWN0LCB0eXBlLCBfcmVmLCBfcmVmMSwgX3Jlc3VsdHM7XG5cbiAgICBfcmVmID0gZGlydHk7XG4gICAgX3Jlc3VsdHMgPSBbXTtcblxuICAgIGZvciAoa2V5IGluIF9yZWYpIHtcbiAgICAgIGlmIChfcmVmLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgb2JqZWN0ID0gX3JlZltrZXldO1xuICAgICAgICBfcmVmMSA9IGtleS5zcGxpdCgnLycpLFxuICAgICAgICB0eXBlID0gX3JlZjFbMF0sXG4gICAgICAgIGlkID0gX3JlZjFbMV07XG4gICAgICAgIG9iamVjdC50eXBlID0gdHlwZTtcbiAgICAgICAgb2JqZWN0LmlkID0gaWQ7XG4gICAgICAgIF9yZXN1bHRzLnB1c2gob2JqZWN0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIF9yZXN1bHRzO1xuICB9O1xuXG5cbiAgLy8gSXMgZGlydHk/XG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyBXaGVuIG5vIGFyZ3VtZW50cyBwYXNzZWQsIHJldHVybnMgYHRydWVgIG9yIGBmYWxzZWAgZGVwZW5kaW5nIG9uIGlmIHRoZXJlIGFyZVxuICAvLyBkaXJ0eSBvYmplY3RzIGluIHRoZSBzdG9yZS5cbiAgLy9cbiAgLy8gT3RoZXJ3aXNlIGl0IHJldHVybnMgYHRydWVgIG9yIGBmYWxzZWAgZm9yIHRoZSBwYXNzZWQgb2JqZWN0LiBBbiBvYmplY3QgaXMgZGlydHlcbiAgLy8gaWYgaXQgaGFzIG5vIGBfc3luY2VkQXRgIGF0dHJpYnV0ZSBvciBpZiBgdXBkYXRlZEF0YCBpcyBtb3JlIHJlY2VudCB0aGFuIGBfc3luY2VkQXRgXG4gIHN0b3JlLmhhc0xvY2FsQ2hhbmdlcyA9IGZ1bmN0aW9uKHR5cGUsIGlkKSB7XG4gICAgaWYgKCF0eXBlKSB7XG4gICAgICByZXR1cm4gISQuaXNFbXB0eU9iamVjdChkaXJ0eSk7XG4gICAgfVxuICAgIHZhciBrZXkgPSBbdHlwZSxpZF0uam9pbignLycpO1xuICAgIGlmIChkaXJ0eVtrZXldKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGhhc0xvY2FsQ2hhbmdlcyhjYWNoZSh0eXBlLCBpZCkpO1xuICB9O1xuXG5cbiAgLy8gQ2xlYXJcbiAgLy8gLS0tLS0tXG5cbiAgLy8gY2xlYXJzIGxvY2FsU3RvcmFnZSBhbmQgY2FjaGVcbiAgLy8gVE9ETzogZG8gbm90IGNsZWFyIGVudGlyZSBsb2NhbFN0b3JhZ2UsIGNsZWFyIG9ubHkgdGhlIGl0ZW1zIHRoYXQgaGF2ZSBiZWVuIHN0b3JlZFxuICAvLyAgICAgICB1c2luZyBgaG9vZGllLnN0b3JlYCBiZWZvcmUuXG4gIHN0b3JlLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgdmFyIGRlZmVyLCBrZXksIGtleXMsIHJlc3VsdHM7XG4gICAgZGVmZXIgPSBnZXREZWZlcigpO1xuICAgIHRyeSB7XG4gICAgICBrZXlzID0gc3RvcmUuaW5kZXgoKTtcbiAgICAgIHJlc3VsdHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0ga2V5cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIGtleSA9IGtleXNbX2ldO1xuICAgICAgICAgIGlmIChpc1NlbWFudGljS2V5KGtleSkpIHtcbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2gobG9jYWxTdG9yYWdlV3JhcHBlci5yZW1vdmVJdGVtKGtleSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9KS5jYWxsKHRoaXMpO1xuICAgICAgY2FjaGVkT2JqZWN0ID0ge307XG4gICAgICBjbGVhckNoYW5nZWQoKTtcbiAgICAgIGRlZmVyLnJlc29sdmUoKTtcbiAgICAgIHN0b3JlLnRyaWdnZXIoJ2NsZWFyJyk7XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICBkZWZlci5yZWplY3QoX2Vycm9yKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfTtcblxuXG4gIC8vIGlzQm9vdHN0cmFwcGluZ1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHJldHVybnMgdHJ1ZSBpZiBzdG9yZSBpcyBjdXJyZW50bHkgYm9vdHN0cmFwcGluZyBkYXRhIGZyb20gcmVtb3RlLFxuICAvLyBvdGhlcndpc2UgZmFsc2UuXG4gIHZhciBib290c3RyYXBwaW5nID0gZmFsc2U7XG4gIHN0b3JlLmlzQm9vdHN0cmFwcGluZyA9IGZ1bmN0aW9uIGlzQm9vdHN0cmFwcGluZygpIHtcbiAgICByZXR1cm4gYm9vdHN0cmFwcGluZztcbiAgfTtcblxuICAvL1xuICAvLyBQcml2YXRlIG1ldGhvZHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy9cblxuXG4gIC8vIENhY2hlXG4gIC8vIC0tLS0tLS1cblxuICAvLyBsb2FkcyBhbiBvYmplY3Qgc3BlY2lmaWVkIGJ5IGB0eXBlYCBhbmQgYGlkYCBvbmx5IG9uY2UgZnJvbSBsb2NhbFN0b3JhZ2VcbiAgLy8gYW5kIGNhY2hlcyBpdCBmb3IgZmFzdGVyIGZ1dHVyZSBhY2Nlc3MuIFVwZGF0ZXMgY2FjaGUgd2hlbiBgdmFsdWVgIGlzIHBhc3NlZC5cbiAgLy9cbiAgLy8gQWxzbyBjaGVja3MgaWYgb2JqZWN0IG5lZWRzIHRvIGJlIHN5bmNoZWQgKGRpcnR5KSBvciBub3RcbiAgLy9cbiAgLy8gUGFzcyBgb3B0aW9ucy5yZW1vdGUgPSB0cnVlYCB3aGVuIG9iamVjdCBjb21lcyBmcm9tIHJlbW90ZVxuICAvLyBQYXNzICdvcHRpb25zLnNpbGVudCA9IHRydWUnIHRvIGF2b2lkIGV2ZW50cyBmcm9tIGJlaW5nIHRyaWdnZXJlZC5cbiAgZnVuY3Rpb24gY2FjaGUodHlwZSwgaWQsIG9iamVjdCwgb3B0aW9ucykge1xuICAgIHZhciBrZXk7XG5cbiAgICBpZiAob2JqZWN0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIG9iamVjdCA9IGZhbHNlO1xuICAgIH1cblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGtleSA9ICcnICsgdHlwZSArICcvJyArIGlkO1xuXG4gICAgaWYgKG9iamVjdCkge1xuICAgICAgZXh0ZW5kKG9iamVjdCwge1xuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBpZDogaWRcbiAgICAgIH0pO1xuXG4gICAgICBsb2NhbFN0b3JhZ2VXcmFwcGVyLnNldE9iamVjdChrZXksIG9iamVjdCk7XG5cbiAgICAgIGlmIChvcHRpb25zLnJlbW90ZSkge1xuICAgICAgICBjbGVhckNoYW5nZWQodHlwZSwgaWQpO1xuICAgICAgICBjYWNoZWRPYmplY3Rba2V5XSA9IGV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KTtcbiAgICAgICAgcmV0dXJuIGNhY2hlZE9iamVjdFtrZXldO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcblxuICAgICAgLy8gaWYgdGhlIGNhY2hlZCBrZXkgcmV0dXJucyBmYWxzZSwgaXQgbWVhbnNcbiAgICAgIC8vIHRoYXQgd2UgaGF2ZSByZW1vdmVkIHRoYXQga2V5LiBXZSBqdXN0XG4gICAgICAvLyBzZXQgaXQgdG8gZmFsc2UgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHNvXG4gICAgICAvLyB0aGF0IHdlIGRvbid0IG5lZWQgdG8gbG9vayBpdCB1cCBhZ2FpbiBpbiBsb2NhbFN0b3JhZ2VcbiAgICAgIGlmIChjYWNoZWRPYmplY3Rba2V5XSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiBrZXkgaXMgY2FjaGVkLCByZXR1cm4gaXQuIEJ1dCBtYWtlIHN1cmVcbiAgICAgIC8vIHRvIG1ha2UgYSBkZWVwIGNvcHkgYmVmb3JlaGFuZCAoPT4gdHJ1ZSlcbiAgICAgIGlmIChjYWNoZWRPYmplY3Rba2V5XSkge1xuICAgICAgICByZXR1cm4gZXh0ZW5kKHRydWUsIHt9LCBjYWNoZWRPYmplY3Rba2V5XSk7XG4gICAgICB9XG5cbiAgICAgIGtleSA9ICcnICsgdHlwZSArICcvJyArIGlkO1xuXG4gICAgICAvLyBpZiBvYmplY3QgaXMgbm90IHlldCBjYWNoZWQsIGxvYWQgaXQgZnJvbSBsb2NhbFN0b3JlXG4gICAgICBvYmplY3QgPSBsb2NhbFN0b3JhZ2VXcmFwcGVyLmdldE9iamVjdChrZXkpO1xuXG4gICAgICAvLyBzdG9wIGhlcmUgaWYgb2JqZWN0IGRpZCBub3QgZXhpc3QgaW4gbG9jYWxTdG9yZVxuICAgICAgLy8gYW5kIGNhY2hlIGl0IHNvIHdlIGRvbid0IG5lZWQgdG8gbG9vayBpdCB1cCBhZ2FpblxuICAgICAgaWYgKG9iamVjdCA9PT0gZmFsc2UpIHtcbiAgICAgICAgY2xlYXJDaGFuZ2VkKHR5cGUsIGlkKTtcbiAgICAgICAgY2FjaGVkT2JqZWN0W2tleV0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgaWYgKGlzTWFya2VkQXNEZWxldGVkKG9iamVjdCkpIHtcbiAgICAgIG1hcmtBc0NoYW5nZWQodHlwZSwgaWQsIG9iamVjdCwgb3B0aW9ucyk7XG4gICAgICBjYWNoZWRPYmplY3Rba2V5XSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGhlcmUgaXMgd2hlcmUgd2UgY2FjaGUgdGhlIG9iamVjdCBmb3JcbiAgICAvLyBmdXR1cmUgcXVpY2sgYWNjZXNzXG4gICAgY2FjaGVkT2JqZWN0W2tleV0gPSBleHRlbmQodHJ1ZSwge30sIG9iamVjdCk7XG5cbiAgICBpZiAoaGFzTG9jYWxDaGFuZ2VzKG9iamVjdCkpIHtcbiAgICAgIG1hcmtBc0NoYW5nZWQodHlwZSwgaWQsIGNhY2hlZE9iamVjdFtrZXldLCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2xlYXJDaGFuZ2VkKHR5cGUsIGlkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpO1xuICB9XG5cblxuICAvLyBib290c3RyYXBwaW5nIGRpcnR5IG9iamVjdHMsIHRvIG1ha2Ugc3VyZVxuICAvLyB0aGF0IHJlbW92ZWQgb2JqZWN0cyBnZXQgcHVzaGVkIGFmdGVyXG4gIC8vIHBhZ2UgcmVsb2FkLlxuICAvL1xuICBmdW5jdGlvbiBib290c3RyYXBEaXJ0eU9iamVjdHMoKSB7XG4gICAgdmFyIGlkLCBrZXlzLCBvYmosIHR5cGUsIF9pLCBfbGVuLCBfcmVmO1xuICAgIGtleXMgPSBsb2NhbFN0b3JhZ2VXcmFwcGVyLmdldEl0ZW0oJ19kaXJ0eScpO1xuXG4gICAgaWYgKCFrZXlzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAga2V5cyA9IGtleXMuc3BsaXQoJywnKTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGtleXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIF9yZWYgPSBrZXlzW19pXS5zcGxpdCgnLycpLFxuICAgICAgdHlwZSA9IF9yZWZbMF0sXG4gICAgICBpZCA9IF9yZWZbMV07XG4gICAgICBvYmogPSBjYWNoZSh0eXBlLCBpZCk7XG4gICAgfVxuICB9XG5cblxuICAvL1xuICAvLyBzdWJzY3JpYmUgdG8gZXZlbnRzIGNvbWluZyBmcm9tIGFjY291bnQgJiBvdXIgcmVtb3RlIHN0b3JlLlxuICAvL1xuICBmdW5jdGlvbiBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKSB7XG5cbiAgICAvLyBhY2NvdW50IGV2ZW50c1xuICAgIGhvb2RpZS5vbignYWNjb3VudDpjbGVhbnVwJywgc3RvcmUuY2xlYXIpO1xuICAgIGhvb2RpZS5vbignYWNjb3VudDpzaWdudXAnLCBtYXJrQWxsQXNDaGFuZ2VkKTtcbiAgICBob29kaWUub24oJ3JlbW90ZTpib290c3RyYXA6c3RhcnQnLCBzdGFydEJvb3RzdHJhcHBpbmdNb2RlKTtcbiAgICBob29kaWUub24oJ3JlbW90ZTpib290c3RyYXA6ZW5kJywgZW5kQm9vdHN0cmFwcGluZ01vZGUpO1xuICAgIGhvb2RpZS5vbigncmVtb3RlOmJvb3RzdHJhcDplcnJvcicsIGFib3J0Qm9vdHN0cmFwcGluZ01vZGUpO1xuXG4gICAgLy8gcmVtb3RlIGV2ZW50c1xuICAgIGhvb2RpZS5vbigncmVtb3RlOmNoYW5nZScsIGhhbmRsZVJlbW90ZUNoYW5nZSk7XG4gICAgaG9vZGllLm9uKCdyZW1vdGU6cHVzaCcsIGhhbmRsZVB1c2hlZE9iamVjdCk7XG4gIH1cblxuICAvLyBhbGxvdyB0byBydW4gdGhpcyBvbmNlIGZyb20gb3V0c2lkZVxuICBzdG9yZS5zdWJzY3JpYmVUb091dHNpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKTtcbiAgICBkZWxldGUgc3RvcmUuc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzO1xuICB9O1xuXG5cbiAgLy9cbiAgLy8gTWFya3Mgb2JqZWN0IGFzIGNoYW5nZWQgKGRpcnR5KS4gVHJpZ2dlcnMgYSBgc3RvcmU6ZGlydHlgIGV2ZW50IGltbWVkaWF0ZWx5IGFuZCBhXG4gIC8vIGBzdG9yZTppZGxlYCBldmVudCBvbmNlIHRoZXJlIGlzIG5vIGNoYW5nZSB3aXRoaW4gMiBzZWNvbmRzXG4gIC8vXG4gIGZ1bmN0aW9uIG1hcmtBc0NoYW5nZWQodHlwZSwgaWQsIG9iamVjdCwgb3B0aW9ucykge1xuICAgIHZhciBrZXk7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBrZXkgPSAnJyArIHR5cGUgKyAnLycgKyBpZDtcblxuICAgIGRpcnR5W2tleV0gPSBvYmplY3Q7XG4gICAgc2F2ZURpcnR5SWRzKCk7XG5cbiAgICBpZiAob3B0aW9ucy5zaWxlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cmlnZ2VyRGlydHlBbmRJZGxlRXZlbnRzKCk7XG4gIH1cblxuICAvLyBDbGVhciBjaGFuZ2VkXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHJlbW92ZXMgYW4gb2JqZWN0IGZyb20gdGhlIGxpc3Qgb2Ygb2JqZWN0cyB0aGF0IGFyZSBmbGFnZ2VkIHRvIGJ5IHN5bmNoZWQgKGRpcnR5KVxuICAvLyBhbmQgdHJpZ2dlcnMgYSBgc3RvcmU6ZGlydHlgIGV2ZW50XG4gIGZ1bmN0aW9uIGNsZWFyQ2hhbmdlZCh0eXBlLCBpZCkge1xuICAgIHZhciBrZXk7XG4gICAgaWYgKHR5cGUgJiYgaWQpIHtcbiAgICAgIGtleSA9ICcnICsgdHlwZSArICcvJyArIGlkO1xuICAgICAgZGVsZXRlIGRpcnR5W2tleV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRpcnR5ID0ge307XG4gICAgfVxuICAgIHNhdmVEaXJ0eUlkcygpO1xuICAgIHJldHVybiBnbG9iYWwuY2xlYXJUaW1lb3V0KGRpcnR5VGltZW91dCk7XG4gIH1cblxuXG4gIC8vIE1hcmsgYWxsIGFzIGNoYW5nZWRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gTWFya3MgYWxsIGxvY2FsIG9iamVjdCBhcyBjaGFuZ2VkIChkaXJ0eSkgdG8gbWFrZSB0aGVtIHN5bmNcbiAgLy8gd2l0aCByZW1vdGVcbiAgZnVuY3Rpb24gbWFya0FsbEFzQ2hhbmdlZCgpIHtcbiAgICByZXR1cm4gc3RvcmUuZmluZEFsbCgpLnBpcGUoZnVuY3Rpb24ob2JqZWN0cykge1xuICAgICAgdmFyIGtleSwgb2JqZWN0LCBfaSwgX2xlbjtcblxuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBvYmplY3RzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIG9iamVjdCA9IG9iamVjdHNbX2ldO1xuICAgICAgICBrZXkgPSAnJyArIG9iamVjdC50eXBlICsgJy8nICsgb2JqZWN0LmlkO1xuICAgICAgICBkaXJ0eVtrZXldID0gb2JqZWN0O1xuICAgICAgfVxuXG4gICAgICBzYXZlRGlydHlJZHMoKTtcbiAgICAgIHRyaWdnZXJEaXJ0eUFuZElkbGVFdmVudHMoKTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgLy8gd2hlbiBhIGNoYW5nZSBjb21lJ3MgZnJvbSBvdXIgcmVtb3RlIHN0b3JlLCB3ZSBkaWZmZXJlbnRpYXRlXG4gIC8vIHdoZXRoZXIgYW4gb2JqZWN0IGhhcyBiZWVuIHJlbW92ZWQgb3IgYWRkZWQgLyB1cGRhdGVkIGFuZFxuICAvLyByZWZsZWN0IHRoZSBjaGFuZ2UgaW4gb3VyIGxvY2FsIHN0b3JlLlxuICBmdW5jdGlvbiBoYW5kbGVSZW1vdGVDaGFuZ2UodHlwZU9mQ2hhbmdlLCBvYmplY3QpIHtcbiAgICBpZiAodHlwZU9mQ2hhbmdlID09PSAncmVtb3ZlJykge1xuICAgICAgc3RvcmUucmVtb3ZlKG9iamVjdC50eXBlLCBvYmplY3QuaWQsIHtcbiAgICAgICAgcmVtb3RlOiB0cnVlLFxuICAgICAgICB1cGRhdGU6IG9iamVjdFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0b3JlLnNhdmUob2JqZWN0LnR5cGUsIG9iamVjdC5pZCwgb2JqZWN0LCB7XG4gICAgICAgIHJlbW90ZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cblxuICAvL1xuICAvLyBhbGwgbG9jYWwgY2hhbmdlcyBnZXQgYnVsayBwdXNoZWQuIEZvciBlYWNoIG9iamVjdCB3aXRoIGxvY2FsXG4gIC8vIGNoYW5nZXMgdGhhdCBoYXMgYmVlbiBwdXNoZWQgd2UgdHJpZ2dlciBhIHN5bmMgZXZlbnRcbiAgZnVuY3Rpb24gaGFuZGxlUHVzaGVkT2JqZWN0KG9iamVjdCkge1xuICAgIHRyaWdnZXJFdmVudHMoJ3N5bmMnLCBvYmplY3QpO1xuICB9XG5cbiAgLy8gc3RvcmUgSURzIG9mIGRpcnR5IG9iamVjdHNcbiAgZnVuY3Rpb24gc2F2ZURpcnR5SWRzKCkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoJC5pc0VtcHR5T2JqZWN0KGRpcnR5KSkge1xuICAgICAgICBsb2NhbFN0b3JhZ2VXcmFwcGVyLnJlbW92ZUl0ZW0oJ19kaXJ0eScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGlkcyA9IE9iamVjdC5rZXlzKGRpcnR5KTtcbiAgICAgICAgbG9jYWxTdG9yYWdlV3JhcHBlci5zZXRJdGVtKCdfZGlydHknLCBpZHMuam9pbignLCcpKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoKGUpIHt9XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBub3coKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG5ldyBEYXRlKCkpLnJlcGxhY2UoL1snXCJdL2csICcnKTtcbiAgfVxuXG5cbiAgLy8gYSBzZW1hbnRpYyBrZXkgY29uc2lzdHMgb2YgYSB2YWxpZCB0eXBlICYgaWQsIHNlcGFyYXRlZCBieSBhIFwiL1wiXG4gIHZhciBzZW1hbnRpY0lkUGF0dGVybiA9IG5ldyBSZWdFeHAoL15bYS16JF1bYS16MC05XStcXC9bYS16MC05XSskLyk7XG4gIGZ1bmN0aW9uIGlzU2VtYW50aWNLZXkoa2V5KSB7XG4gICAgcmV0dXJuIHNlbWFudGljSWRQYXR0ZXJuLnRlc3Qoa2V5KTtcbiAgfVxuXG4gIC8vIGBoYXNMb2NhbENoYW5nZXNgIHJldHVybnMgdHJ1ZSBpZiB0aGVyZSBpcyBhIGxvY2FsIGNoYW5nZSB0aGF0XG4gIC8vIGhhcyBub3QgYmVlbiBzeW5jJ2QgeWV0LlxuICBmdW5jdGlvbiBoYXNMb2NhbENoYW5nZXMob2JqZWN0KSB7XG4gICAgaWYgKCFvYmplY3QudXBkYXRlZEF0KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghb2JqZWN0Ll9zeW5jZWRBdCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3QuX3N5bmNlZEF0IDwgb2JqZWN0LnVwZGF0ZWRBdDtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGlzTWFya2VkQXNEZWxldGVkKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QuX2RlbGV0ZWQgPT09IHRydWU7XG4gIH1cblxuICAvLyB0aGlzIGlzIHdoZXJlIGFsbCB0aGUgc3RvcmUgZXZlbnRzIGdldCB0cmlnZ2VyZWQsXG4gIC8vIGxpa2UgYWRkOnRhc2ssIGNoYW5nZTpub3RlOmFiYzQ1NjcsIHJlbW92ZSwgZXRjLlxuICBmdW5jdGlvbiB0cmlnZ2VyRXZlbnRzKGV2ZW50TmFtZSwgb2JqZWN0LCBvcHRpb25zKSB7XG4gICAgc3RvcmUudHJpZ2dlcihldmVudE5hbWUsIGV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG4gICAgc3RvcmUudHJpZ2dlcihvYmplY3QudHlwZSArICc6JyArIGV2ZW50TmFtZSwgZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcblxuICAgIC8vIERFUFJFQ0FURURcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vaG9vZGllaHEvaG9vZGllLmpzL2lzc3Vlcy8xNDZcbiAgICBzdG9yZS50cmlnZ2VyKGV2ZW50TmFtZSArICc6JyArIG9iamVjdC50eXBlLCBleHRlbmQodHJ1ZSwge30sIG9iamVjdCksIG9wdGlvbnMpO1xuXG4gICAgaWYgKGV2ZW50TmFtZSAhPT0gJ25ldycpIHtcbiAgICAgIHN0b3JlLnRyaWdnZXIoIG9iamVjdC50eXBlICsgJzonICsgb2JqZWN0LmlkKyAnOicgKyBldmVudE5hbWUsIGV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cbiAgICAgIC8vIERFUFJFQ0FURURcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ob29kaWVocS9ob29kaWUuanMvaXNzdWVzLzE0NlxuICAgICAgc3RvcmUudHJpZ2dlciggZXZlbnROYW1lICsgJzonICsgb2JqZWN0LnR5cGUgKyAnOicgKyBvYmplY3QuaWQsIGV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG4gICAgfVxuXG5cblxuICAgIC8vIHN5bmMgZXZlbnRzIGhhdmUgbm8gY2hhbmdlcywgc28gd2UgZG9uJ3QgdHJpZ2dlclxuICAgIC8vIFwiY2hhbmdlXCIgZXZlbnRzLlxuICAgIGlmIChldmVudE5hbWUgPT09ICdzeW5jJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN0b3JlLnRyaWdnZXIoJ2NoYW5nZScsIGV2ZW50TmFtZSwgZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcbiAgICBzdG9yZS50cmlnZ2VyKG9iamVjdC50eXBlICsgJzpjaGFuZ2UnLCBldmVudE5hbWUsIGV4dGVuZCh0cnVlLCB7fSwgb2JqZWN0KSwgb3B0aW9ucyk7XG5cbiAgICAvLyBERVBSRUNBVEVEXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hvb2RpZWhxL2hvb2RpZS5qcy9pc3N1ZXMvMTQ2XG4gICAgc3RvcmUudHJpZ2dlcignY2hhbmdlOicgKyBvYmplY3QudHlwZSwgZXZlbnROYW1lLCBleHRlbmQodHJ1ZSwge30sIG9iamVjdCksIG9wdGlvbnMpO1xuXG5cbiAgICBpZiAoZXZlbnROYW1lICE9PSAnbmV3Jykge1xuICAgICAgc3RvcmUudHJpZ2dlcihvYmplY3QudHlwZSArICc6JyArIG9iamVjdC5pZCArICc6Y2hhbmdlJywgZXZlbnROYW1lLCBleHRlbmQodHJ1ZSwge30sIG9iamVjdCksIG9wdGlvbnMpO1xuXG4gICAgICAvLyBERVBSRUNBVEVEXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vaG9vZGllaHEvaG9vZGllLmpzL2lzc3Vlcy8xNDZcbiAgICAgIHN0b3JlLnRyaWdnZXIoJ2NoYW5nZTonICsgb2JqZWN0LnR5cGUgKyAnOicgKyBvYmplY3QuaWQsIGV2ZW50TmFtZSwgZXh0ZW5kKHRydWUsIHt9LCBvYmplY3QpLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICAvLyB3aGVuIGFuIG9iamVjdCBnZXRzIGNoYW5nZWQsIHR3byBzcGVjaWFsIGV2ZW50cyBnZXQgdHJpZ2dlcmQ6XG4gIC8vXG4gIC8vIDEuIGRpcnR5IGV2ZW50XG4gIC8vICAgIHRoZSBgZGlydHlgIGV2ZW50IGdldHMgdHJpZ2dlcmVkIGltbWVkaWF0ZWx5LCBmb3IgZXZlcnlcbiAgLy8gICAgY2hhbmdlIHRoYXQgaGFwcGVucy5cbiAgLy8gMi4gaWRsZSBldmVudFxuICAvLyAgICB0aGUgYGlkbGVgIGV2ZW50IGdldHMgdHJpZ2dlcmVkIGFmdGVyIGEgc2hvcnQgdGltZW91dCBvZlxuICAvLyAgICBubyBjaGFuZ2VzLCBlLmcuIDIgc2Vjb25kcy5cbiAgdmFyIGRpcnR5VGltZW91dDtcbiAgZnVuY3Rpb24gdHJpZ2dlckRpcnR5QW5kSWRsZUV2ZW50cygpIHtcbiAgICBzdG9yZS50cmlnZ2VyKCdkaXJ0eScpO1xuICAgIGdsb2JhbC5jbGVhclRpbWVvdXQoZGlydHlUaW1lb3V0KTtcblxuICAgIGRpcnR5VGltZW91dCA9IGdsb2JhbC5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgc3RvcmUudHJpZ2dlcignaWRsZScsIHN0b3JlLmNoYW5nZWRPYmplY3RzKCkpO1xuICAgIH0sIGlkbGVUaW1lb3V0KTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIHN0YXJ0Qm9vdHN0cmFwcGluZ01vZGUoKSB7XG4gICAgYm9vdHN0cmFwcGluZyA9IHRydWU7XG4gICAgc3RvcmUudHJpZ2dlcignYm9vdHN0cmFwOnN0YXJ0Jyk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiBlbmRCb290c3RyYXBwaW5nTW9kZSgpIHtcbiAgICB2YXIgbWV0aG9kQ2FsbCwgbWV0aG9kLCBhcmdzLCBkZWZlcjtcblxuICAgIGJvb3RzdHJhcHBpbmcgPSBmYWxzZTtcbiAgICB3aGlsZShxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICBtZXRob2RDYWxsID0gcXVldWUuc2hpZnQoKTtcbiAgICAgIG1ldGhvZCA9IG1ldGhvZENhbGxbMF07XG4gICAgICBhcmdzID0gbWV0aG9kQ2FsbFsxXTtcbiAgICAgIGRlZmVyID0gbWV0aG9kQ2FsbFsyXTtcbiAgICAgIGxvY2FsU3RvcmVbbWV0aG9kXS5hcHBseShsb2NhbFN0b3JlLCBhcmdzKS50aGVuKGRlZmVyLnJlc29sdmUsIGRlZmVyLnJlamVjdCk7XG4gICAgfVxuXG4gICAgc3RvcmUudHJpZ2dlcignYm9vdHN0cmFwOmVuZCcpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gYWJvcnRCb290c3RyYXBwaW5nTW9kZShlcnJvcikge1xuICAgIHZhciBtZXRob2RDYWxsLCBkZWZlcjtcblxuICAgIGJvb3RzdHJhcHBpbmcgPSBmYWxzZTtcbiAgICB3aGlsZShxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICBtZXRob2RDYWxsID0gcXVldWUuc2hpZnQoKTtcbiAgICAgIGRlZmVyID0gbWV0aG9kQ2FsbFsyXTtcbiAgICAgIGRlZmVyLnJlamVjdChlcnJvcik7XG4gICAgfVxuXG4gICAgc3RvcmUudHJpZ2dlcignYm9vdHN0cmFwOmVycm9yJywgZXJyb3IpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gZW5xdWV1ZShtZXRob2QsIGFyZ3MpIHtcbiAgICB2YXIgZGVmZXIgPSBnZXREZWZlcigpO1xuICAgIHF1ZXVlLnB1c2goW21ldGhvZCwgYXJncywgZGVmZXJdKTtcbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICB9XG5cbiAgLy9cbiAgLy8gcGF0Y2hJZk5vdFBlcnNpc3RhbnRcbiAgLy9cbiAgbG9jYWxTdG9yYWdlV3JhcHBlci5wYXRjaElmTm90UGVyc2lzdGFudCgpO1xuXG4gIC8vXG4gIC8vIGluaXRpYWxpemF0aW9uXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cbiAgLy9cblxuICAvLyBpZiBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgbG9jYWwgc3RvcmFnZSBwZXJzaXN0ZW5jZSxcbiAgLy8gZS5nLiBTYWZhcmkgaW4gcHJpdmF0ZSBtb2RlLCBvdmVyaXRlIHRoZSByZXNwZWN0aXZlIG1ldGhvZHMuXG5cblxuXG4gIC8vXG4gIC8vIGV4cG9zZSBwdWJsaWMgQVBJXG4gIC8vXG4gIC8vIGluaGVyaXQgZnJvbSBIb29kaWVzIFN0b3JlIEFQSVxuICBob29kaWUuc3RvcmUgPSBzdG9yZTtcblxuICAvLyBhbGxvdyB0byBydW4gdGhpcyBvbmNlIGZyb20gb3V0c2lkZVxuICBzdG9yZS5ib290c3RyYXBEaXJ0eU9iamVjdHMgPSBmdW5jdGlvbigpIHtcbiAgICBib290c3RyYXBEaXJ0eU9iamVjdHMoKTtcbiAgICBkZWxldGUgc3RvcmUuYm9vdHN0cmFwRGlydHlPYmplY3RzO1xuICB9O1xuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9uY2UgZnJvbSBvdXRzaWRlXG4gIHN0b3JlLnBhdGNoSWZOb3RQZXJzaXN0YW50ID0gZnVuY3Rpb24oKSB7XG4gICAgbG9jYWxTdG9yYWdlV3JhcHBlci5wYXRjaElmTm90UGVyc2lzdGFudCgpO1xuICAgIGRlbGV0ZSBzdG9yZS5wYXRjaElmTm90UGVyc2lzdGFudDtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVTdG9yZTtcbiIsIi8vIFRhc2tzXG4vLyA9PT09PT09PT09PT1cblxuLy8gVGhpcyBjbGFzcyBkZWZpbmVzIHRoZSBob29kaWUudGFzayBBUEkuXG4vL1xuLy8gVGhlIHJldHVybmVkIEFQSSBwcm92aWRlcyB0aGUgZm9sbG93aW5nIG1ldGhvZHM6XG4vL1xuLy8gKiBzdGFydFxuLy8gKiBhYm9ydFxuLy8gKiByZXN0YXJ0XG4vLyAqIHJlbW92ZVxuLy8gKiBvblxuLy8gKiBvbmVcbi8vICogdW5iaW5kXG4vL1xuLy8gQXQgdGhlIHNhbWUgdGltZSwgdGhlIHJldHVybmVkIEFQSSBjYW4gYmUgY2FsbGVkIGFzIGZ1bmN0aW9uIHJldHVybmluZyBhXG4vLyBzdG9yZSBzY29wZWQgYnkgdGhlIHBhc3NlZCB0eXBlLCBmb3IgZXhhbXBsZVxuLy9cbi8vICAgICB2YXIgZW1haWxUYXNrcyA9IGhvb2RpZS50YXNrKCdlbWFpbCcpO1xuLy8gICAgIGVtYWlsVGFza3Muc3RhcnQoIHByb3BlcnRpZXMgKTtcbi8vICAgICBlbWFpbFRhc2tzLmFib3J0KCdpZDEyMycpO1xuLy9cbnZhciBob29kaWVFdmVudHMgPSByZXF1aXJlKCcuLi9saWIvZXZlbnRzJyk7XG52YXIgaG9vZGllU2NvcGVkVGFzayA9IHJlcXVpcmUoJy4uL2xpYi90YXNrL3Njb3BlZCcpO1xudmFyIEhvb2RpZUVycm9yID0gcmVxdWlyZSgnLi4vbGliL2Vycm9yL2Vycm9yJyk7XG5cbnZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKTtcblxudmFyIGdldERlZmVyID0gcmVxdWlyZSgnLi4vdXRpbHMvcHJvbWlzZS9kZWZlcicpO1xuXG4vL1xuZnVuY3Rpb24gaG9vZGllVGFzayhob29kaWUpIHtcblxuICAvLyBwdWJsaWMgQVBJXG4gIHZhciBhcGkgPSBmdW5jdGlvbiBhcGkodHlwZSwgaWQpIHtcbiAgICAgIHJldHVybiBob29kaWVTY29wZWRUYXNrKGhvb2RpZSwgYXBpLCB7XG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIGlkOiBpZFxuICAgICAgfSk7XG4gICAgfTtcblxuICAvLyBhZGQgZXZlbnRzIEFQSVxuICBob29kaWVFdmVudHMoaG9vZGllLCB7XG4gICAgY29udGV4dDogYXBpLFxuICAgIG5hbWVzcGFjZTogJ3Rhc2snXG4gIH0pO1xuXG5cbiAgLy8gc3RhcnRcbiAgLy8gLS0tLS0tLVxuXG4gIC8vIHN0YXJ0IGEgbmV3IHRhc2suIElmIHRoZSB1c2VyIGhhcyBubyBhY2NvdW50IHlldCwgaG9vZGllIHRyaWVzIHRvIHNpZ24gdXBcbiAgLy8gZm9yIGFuIGFub255bW91cyBhY2NvdW50IGluIHRoZSBiYWNrZ3JvdW5kLiBJZiB0aGF0IGZhaWxzLCB0aGUgcmV0dXJuZWRcbiAgLy8gcHJvbWlzZSB3aWxsIGJlIHJlamVjdGVkLlxuICAvL1xuICBhcGkuc3RhcnQgPSBmdW5jdGlvbih0eXBlLCBwcm9wZXJ0aWVzKSB7XG4gICAgaWYgKGhvb2RpZS5hY2NvdW50Lmhhc0FjY291bnQoKSkge1xuICAgICAgcmV0dXJuIGhvb2RpZS5zdG9yZS5hZGQoJyQnICsgdHlwZSwgcHJvcGVydGllcykudGhlbihoYW5kbGVOZXdUYXNrKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaG9vZGllLmFjY291bnQuYW5vbnltb3VzU2lnblVwKCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhcGkuc3RhcnQodHlwZSwgcHJvcGVydGllcyk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyBhYm9ydFxuICAvLyAtLS0tLS0tXG5cbiAgLy8gYWJvcnQgYSBydW5uaW5nIHRhc2tcbiAgLy9cbiAgYXBpLmFib3J0ID0gZnVuY3Rpb24odHlwZSwgaWQpIHtcbiAgICByZXR1cm4gaG9vZGllLnN0b3JlLnVwZGF0ZSgnJCcgKyB0eXBlLCBpZCwge1xuICAgICAgYWJvcnRlZEF0OiBub3coKVxuICAgIH0pLnRoZW4oaGFuZGxlQWJvcnRlZFRhc2tPYmplY3QpO1xuICB9O1xuXG5cbiAgLy8gcmVzdGFydFxuICAvLyAtLS0tLS0tLS1cblxuICAvLyBmaXJzdCwgd2UgdHJ5IHRvIGFib3J0IGEgcnVubmluZyB0YXNrLiBJZiB0aGF0IHN1Y2NlZWRzLCB3ZSBzdGFydFxuICAvLyBhIG5ldyBvbmUgd2l0aCB0aGUgc2FtZSBwcm9wZXJ0aWVzIGFzIHRoZSBvcmlnaW5hbFxuICAvL1xuICBhcGkucmVzdGFydCA9IGZ1bmN0aW9uKHR5cGUsIGlkLCB1cGRhdGUpIHtcbiAgICB2YXIgc3RhcnQgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgIGV4dGVuZChvYmplY3QsIHVwZGF0ZSk7XG4gICAgICBkZWxldGUgb2JqZWN0LiRlcnJvcjtcbiAgICAgIGRlbGV0ZSBvYmplY3QuJHByb2Nlc3NlZEF0O1xuICAgICAgZGVsZXRlIG9iamVjdC5hYm9ydGVkQXQ7XG4gICAgICByZXR1cm4gYXBpLnN0YXJ0KG9iamVjdC50eXBlLCBvYmplY3QpO1xuICAgIH07XG4gICAgcmV0dXJuIGFwaS5hYm9ydCh0eXBlLCBpZCkudGhlbihzdGFydCk7XG4gIH07XG5cbiAgLy8gYWJvcnRBbGxcbiAgLy8gLS0tLS0tLS0tLS1cblxuICAvL1xuICBhcGkuYWJvcnRBbGwgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgcmV0dXJuIGZpbmRBbGwodHlwZSkudGhlbihhYm9ydFRhc2tPYmplY3RzKTtcbiAgfTtcblxuICAvLyByZXN0YXJ0QWxsXG4gIC8vIC0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgYXBpLnJlc3RhcnRBbGwgPSBmdW5jdGlvbih0eXBlLCB1cGRhdGUpIHtcblxuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHVwZGF0ZSA9IHR5cGU7XG4gICAgfVxuICAgIHJldHVybiBmaW5kQWxsKHR5cGUpLnRoZW4oZnVuY3Rpb24odGFza09iamVjdHMpIHtcbiAgICAgIHJlc3RhcnRUYXNrT2JqZWN0cyh0YXNrT2JqZWN0cywgdXBkYXRlKTtcbiAgICB9KTtcblxuICB9O1xuXG5cbiAgLy9cbiAgLy8gc3Vic2NyaWJlIHRvIHN0b3JlIGV2ZW50c1xuICAvLyB3ZSBzdWJzY3JpYmUgdG8gYWxsIHN0b3JlIGNoYW5nZXMsIHBpcGUgdGhyb3VnaCB0aGUgdGFzayBvbmVzLFxuICAvLyBtYWtpbmcgYSBmZXcgY2hhbmdlcyBhbG9uZyB0aGUgd2F5LlxuICAvL1xuICBmdW5jdGlvbiBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKSB7XG4gICAgLy8gYWNjb3VudCBldmVudHNcbiAgICBob29kaWUub24oJ3N0b3JlOmNoYW5nZScsIGhhbmRsZVN0b3JlQ2hhbmdlKTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9ubHkgb25jZSBmcm9tIG91dHNpZGUgKGR1cmluZyBIb29kaWUgaW5pdGlhbGl6YXRpb24pXG4gIGFwaS5zdWJzY3JpYmVUb091dHNpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKTtcbiAgICBkZWxldGUgYXBpLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cztcbiAgfTtcblxuXG4gIC8vIFByaXZhdGVcbiAgLy8gLS0tLS0tLVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZU5ld1Rhc2sob2JqZWN0KSB7XG4gICAgdmFyIGRlZmVyID0gZ2V0RGVmZXIoKTtcbiAgICB2YXIgdGFza1N0b3JlID0gaG9vZGllLnN0b3JlKG9iamVjdC50eXBlLCBvYmplY3QuaWQpO1xuXG4gICAgdGFza1N0b3JlLm9uKCdyZW1vdmUnLCBmdW5jdGlvbihvYmplY3QpIHtcblxuICAgICAgLy8gcmVtb3ZlIFwiJFwiIGZyb20gdHlwZVxuICAgICAgb2JqZWN0LnR5cGUgPSBvYmplY3QudHlwZS5zdWJzdHIoMSk7XG5cbiAgICAgIC8vIHRhc2sgZmluaXNoZWQgYnkgd29ya2VyLlxuICAgICAgaWYgKG9iamVjdC4kcHJvY2Vzc2VkQXQpIHtcbiAgICAgICAgcmV0dXJuIGRlZmVyLnJlc29sdmUob2JqZWN0KTtcbiAgICAgIH1cblxuICAgICAgLy8gbWFudWFsbHkgcmVtb3ZlZCAvIGFib3J0ZWQuXG4gICAgICBkZWZlci5yZWplY3QobmV3IEhvb2RpZUVycm9yKHtcbiAgICAgICAgbWVzc2FnZTogJ1Rhc2sgaGFzIGJlZW4gYWJvcnRlZCcsXG4gICAgICAgIHRhc2s6IG9iamVjdFxuICAgICAgfSkpO1xuICAgIH0pO1xuICAgIHRhc2tTdG9yZS5vbigndXBkYXRlJywgZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICB2YXIgZXJyb3IgPSBvYmplY3QuJGVycm9yO1xuXG4gICAgICBpZiAoISBvYmplY3QuJGVycm9yKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gcmVtb3ZlIFwiJFwiIGZyb20gdHlwZVxuICAgICAgb2JqZWN0LnR5cGUgPSBvYmplY3QudHlwZS5zdWJzdHIoMSk7XG5cbiAgICAgIGRlbGV0ZSBvYmplY3QuJGVycm9yO1xuICAgICAgZXJyb3Iub2JqZWN0ID0gb2JqZWN0O1xuICAgICAgZXJyb3IubWVzc2FnZSA9IGVycm9yLm1lc3NhZ2UgfHwgJ1NvbWV0aGluZyB3ZW50IHdyb25nJztcblxuICAgICAgZGVmZXIucmVqZWN0KG5ldyBIb29kaWVFcnJvcihlcnJvcikpO1xuXG4gICAgICAvLyByZW1vdmUgZXJyb3JlZCB0YXNrXG4gICAgICBob29kaWUuc3RvcmUucmVtb3ZlKCckJyArIG9iamVjdC50eXBlLCBvYmplY3QuaWQpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlZmVyLnByb21pc2UoKTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZUFib3J0ZWRUYXNrT2JqZWN0KHRhc2tPYmplY3QpIHtcbiAgICB2YXIgZGVmZXI7XG4gICAgdmFyIHR5cGUgPSB0YXNrT2JqZWN0LnR5cGU7IC8vIG5vIG5lZWQgdG8gcHJlZml4IHdpdGggJCwgaXQncyBhbHJlYWR5IHByZWZpeGVkLlxuICAgIHZhciBpZCA9IHRhc2tPYmplY3QuaWQ7XG4gICAgdmFyIHJlbW92ZVByb21pc2UgPSBob29kaWUuc3RvcmUucmVtb3ZlKHR5cGUsIGlkKTtcblxuICAgIGlmICghdGFza09iamVjdC5fcmV2KSB7XG4gICAgICAvLyB0YXNrIGhhcyBub3QgeWV0IGJlZW4gc3luY2VkLlxuICAgICAgcmV0dXJuIHJlbW92ZVByb21pc2U7XG4gICAgfVxuXG4gICAgZGVmZXIgPSBnZXREZWZlcigpO1xuICAgIGhvb2RpZS5vbmUoJ3N0b3JlOnN5bmM6JyArIHR5cGUgKyAnOicgKyBpZCwgZGVmZXIucmVzb2x2ZSk7XG4gICAgcmVtb3ZlUHJvbWlzZS5mYWlsKGRlZmVyLnJlamVjdCk7XG5cbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZSgpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlU3RvcmVDaGFuZ2UoZXZlbnROYW1lLCBvYmplY3QsIG9wdGlvbnMpIHtcbiAgICBpZiAob2JqZWN0LnR5cGVbMF0gIT09ICckJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG9iamVjdC50eXBlID0gb2JqZWN0LnR5cGUuc3Vic3RyKDEpO1xuICAgIHRyaWdnZXJFdmVudHMoZXZlbnROYW1lLCBvYmplY3QsIG9wdGlvbnMpO1xuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gZmluZEFsbCh0eXBlKSB7XG4gICAgdmFyIHN0YXJ0c1dpdGggPSAnJCc7XG4gICAgdmFyIGZpbHRlcjtcbiAgICBpZiAodHlwZSkge1xuICAgICAgc3RhcnRzV2l0aCArPSB0eXBlO1xuICAgIH1cblxuICAgIGZpbHRlciA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgcmV0dXJuIG9iamVjdC50eXBlLmluZGV4T2Yoc3RhcnRzV2l0aCkgPT09IDA7XG4gICAgfTtcbiAgICByZXR1cm4gaG9vZGllLnN0b3JlLmZpbmRBbGwoZmlsdGVyKTtcbiAgfVxuXG4gIC8vXG4gIGZ1bmN0aW9uIGFib3J0VGFza09iamVjdHModGFza09iamVjdHMpIHtcbiAgICByZXR1cm4gdGFza09iamVjdHMubWFwKGZ1bmN0aW9uKHRhc2tPYmplY3QpIHtcbiAgICAgIHJldHVybiBhcGkuYWJvcnQodGFza09iamVjdC50eXBlLnN1YnN0cigxKSwgdGFza09iamVjdC5pZCk7XG4gICAgfSk7XG4gIH1cblxuICAvL1xuICBmdW5jdGlvbiByZXN0YXJ0VGFza09iamVjdHModGFza09iamVjdHMsIHVwZGF0ZSkge1xuICAgIHJldHVybiB0YXNrT2JqZWN0cy5tYXAoZnVuY3Rpb24odGFza09iamVjdCkge1xuICAgICAgcmV0dXJuIGFwaS5yZXN0YXJ0KHRhc2tPYmplY3QudHlwZS5zdWJzdHIoMSksIHRhc2tPYmplY3QuaWQsIHVwZGF0ZSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyB0aGlzIGlzIHdoZXJlIGFsbCB0aGUgdGFzayBldmVudHMgZ2V0IHRyaWdnZXJlZCxcbiAgLy8gbGlrZSBhZGQ6bWVzc2FnZSwgY2hhbmdlOm1lc3NhZ2U6YWJjNDU2NywgcmVtb3ZlLCBldGMuXG4gIGZ1bmN0aW9uIHRyaWdnZXJFdmVudHMoZXZlbnROYW1lLCB0YXNrLCBvcHRpb25zKSB7XG4gICAgdmFyIGVycm9yO1xuXG4gICAgLy8gXCJuZXdcIiB0YXNrcyBhcmUgdHJpZ2dlciBhcyBcInN0YXJ0XCIgZXZlbnRzXG4gICAgaWYgKGV2ZW50TmFtZSA9PT0gJ2FkZCcpIHtcbiAgICAgIGV2ZW50TmFtZSA9ICdzdGFydCc7XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50TmFtZSA9PT0gJ3JlbW92ZScgJiYgdGFzay5hYm9ydGVkQXQpIHtcbiAgICAgIGV2ZW50TmFtZSA9ICdhYm9ydCc7XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50TmFtZSA9PT0gJ3JlbW92ZScgJiYgdGFzay4kcHJvY2Vzc2VkQXQpIHtcbiAgICAgIGV2ZW50TmFtZSA9ICdzdWNjZXNzJztcbiAgICB9XG5cbiAgICBpZiAoZXZlbnROYW1lID09PSAndXBkYXRlJyAmJiB0YXNrLiRlcnJvcikge1xuICAgICAgZXZlbnROYW1lID0gJ2Vycm9yJztcbiAgICAgIGVycm9yID0gdGFzay4kZXJyb3I7XG4gICAgICBkZWxldGUgdGFzay4kZXJyb3I7XG5cbiAgICAgIGFwaS50cmlnZ2VyKCdlcnJvcicsIGVycm9yLCB0YXNrLCBvcHRpb25zKTtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6ZXJyb3InLCBlcnJvciwgdGFzaywgb3B0aW9ucyk7XG4gICAgICBhcGkudHJpZ2dlcih0YXNrLnR5cGUgKyAnOicgKyB0YXNrLmlkICsgJzplcnJvcicsIGVycm9yLCB0YXNrLCBvcHRpb25zKTtcblxuICAgICAgb3B0aW9ucyA9IGV4dGVuZCh7fSwgb3B0aW9ucywge1xuICAgICAgICBlcnJvcjogZXJyb3JcbiAgICAgIH0pO1xuXG4gICAgICBhcGkudHJpZ2dlcignY2hhbmdlJywgJ2Vycm9yJywgdGFzaywgb3B0aW9ucyk7XG4gICAgICBhcGkudHJpZ2dlcih0YXNrLnR5cGUgKyAnOmNoYW5nZScsICdlcnJvcicsIHRhc2ssIG9wdGlvbnMpO1xuICAgICAgYXBpLnRyaWdnZXIodGFzay50eXBlICsgJzonICsgdGFzay5pZCArICc6Y2hhbmdlJywgJ2Vycm9yJywgdGFzaywgb3B0aW9ucyk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBpZ25vcmUgYWxsIHRoZSBvdGhlciBldmVudHNcbiAgICBpZiAoZXZlbnROYW1lICE9PSAnc3RhcnQnICYmIGV2ZW50TmFtZSAhPT0gJ2Fib3J0JyAmJiBldmVudE5hbWUgIT09ICdzdWNjZXNzJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGFwaS50cmlnZ2VyKGV2ZW50TmFtZSwgdGFzaywgb3B0aW9ucyk7XG4gICAgYXBpLnRyaWdnZXIodGFzay50eXBlICsgJzonICsgZXZlbnROYW1lLCB0YXNrLCBvcHRpb25zKTtcblxuICAgIGlmIChldmVudE5hbWUgIT09ICdzdGFydCcpIHtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6JyArIHRhc2suaWQgKyAnOicgKyBldmVudE5hbWUsIHRhc2ssIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGFwaS50cmlnZ2VyKCdjaGFuZ2UnLCBldmVudE5hbWUsIHRhc2ssIG9wdGlvbnMpO1xuICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6Y2hhbmdlJywgZXZlbnROYW1lLCB0YXNrLCBvcHRpb25zKTtcblxuICAgIGlmIChldmVudE5hbWUgIT09ICdzdGFydCcpIHtcbiAgICAgIGFwaS50cmlnZ2VyKHRhc2sudHlwZSArICc6JyArIHRhc2suaWQgKyAnOmNoYW5nZScsIGV2ZW50TmFtZSwgdGFzaywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLy9cbiAgZnVuY3Rpb24gbm93KCkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShuZXcgRGF0ZSgpKS5yZXBsYWNlKC9bJ1wiXS9nLCAnJyk7XG4gIH1cblxuICAvLyBleHRlbmQgaG9vZGllXG4gIGhvb2RpZS50YXNrID0gYXBpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVRhc2s7XG4iLCIvLyBIb29kaWUgQ29uZmlnIEFQSVxuLy8gPT09PT09PT09PT09PT09PT09PVxuXG52YXIgbG9jYWxTdG9yYWdlV3JhcHBlciA9IHJlcXVpcmUoJy4uL3V0aWxzJykubG9jYWxTdG9yYWdlV3JhcHBlcldyYXBwZXI7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVDb25maWcoaG9vZGllKSB7XG5cbiAgdmFyIENPTkZJR19TVE9SRV9LRVkgPSAnX2hvb2RpZV9jb25maWcnO1xuICB2YXIgY2FjaGUgPSB7fTtcblxuICAvLyBwdWJsaWMgQVBJXG4gIHZhciBjb25maWcgPSB7fTtcblxuXG4gIC8vIHNldFxuICAvLyAtLS0tLS0tLS0tXG5cbiAgLy8gYWRkcyBhIGNvbmZpZ3VyYXRpb25cbiAgLy9cbiAgY29uZmlnLnNldCA9IGZ1bmN0aW9uIHNldChrZXksIHZhbHVlKSB7XG4gICAgY2FjaGVba2V5XSA9IHZhbHVlO1xuICAgIGxvY2FsU3RvcmFnZVdyYXBwZXIuc2V0T2JqZWN0KENPTkZJR19TVE9SRV9LRVksIGNhY2hlKTtcbiAgfTtcblxuICAvLyBnZXRcbiAgLy8gLS0tLS0tLS0tLVxuXG4gIC8vIHJlY2VpdmVzIGEgY29uZmlndXJhdGlvblxuICAvL1xuICBjb25maWcuZ2V0ID0gZnVuY3Rpb24gZ2V0KGtleSkge1xuICAgIHJldHVybiBjYWNoZVtrZXldO1xuICB9O1xuXG4gIC8vIGNsZWFyXG4gIC8vIC0tLS0tLS0tLS1cblxuICAvLyBjbGVhcnMgY2FjaGUgYW5kIHJlbW92ZXMgb2JqZWN0IGZyb20gbG9jYWxTdG9yYWdlV3JhcHBlclxuICAvL1xuICBjb25maWcuY2xlYXIgPSBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICBjYWNoZSA9IHt9O1xuICAgIHJldHVybiBsb2NhbFN0b3JhZ2VXcmFwcGVyLnJlbW92ZUl0ZW0oQ09ORklHX1NUT1JFX0tFWSk7XG4gIH07XG5cbiAgLy8gdW5zZXRcbiAgLy8gLS0tLS0tLS0tLVxuXG4gIC8vIHVuc2V0cyBhIGNvbmZpZ3VyYXRpb24uIElmIGNvbmZpZ3VyYXRpb24gaXMgcHJlc2VudCwgY2FsbHNcbiAgLy8gY29uZmlnLnNldChrZXksIHVuZGVmaW5lZCkuXG4gIC8vXG4gIGNvbmZpZy51bnNldCA9IGZ1bmN0aW9uIHVuc2V0KGtleSkge1xuICAgIGRlbGV0ZSBjYWNoZVtrZXldO1xuICAgIGxvY2FsU3RvcmFnZVdyYXBwZXIuc2V0T2JqZWN0KENPTkZJR19TVE9SRV9LRVksIGNhY2hlKTtcbiAgfTtcblxuICAvL1xuICAvLyBsb2FkIGN1cnJlbnQgY29uZmlndXJhdGlvbiBmcm9tIGxvY2FsU3RvcmUuXG4gIC8vIFRoZSBpbml0IG1ldGhvZCB0byBiZSBjYWxsZWQgb24gaG9vZGllIHN0YXJ0dXBcbiAgLy9cbiAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBjYWNoZSA9IGxvY2FsU3RvcmFnZVdyYXBwZXIuZ2V0T2JqZWN0KENPTkZJR19TVE9SRV9LRVkpO1xuICB9XG5cbiAgLy8gYWxsb3cgdG8gcnVuIGluaXQgb25seSBvbmNlXG4gIGNvbmZpZy5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgaW5pdCgpO1xuICAgIGRlbGV0ZSBjb25maWcuaW5pdDtcbiAgfTtcblxuICAvL1xuICAvLyBzdWJzY3JpYmUgdG8gZXZlbnRzIGNvbWluZyBmcm9tIG90aGVyIG1vZHVsZXNcbiAgLy9cbiAgZnVuY3Rpb24gc3Vic2NyaWJlVG9PdXRzaWRlRXZlbnRzKCkge1xuICAgIGhvb2RpZS5vbignYWNjb3VudDpjbGVhbnVwJywgY29uZmlnLmNsZWFyKTtcbiAgfVxuXG4gIC8vIGFsbG93IHRvIHJ1biB0aGlzIG9uY2UgZnJvbSBvdXRzaWRlXG4gIGNvbmZpZy5zdWJzY3JpYmVUb091dHNpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBzdWJzY3JpYmVUb091dHNpZGVFdmVudHMoKTtcbiAgICBkZWxldGUgY29uZmlnLnN1YnNjcmliZVRvT3V0c2lkZUV2ZW50cztcbiAgfTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZUNvbmZpZztcblxuIiwiLy8gSG9vZGllIEVycm9yXG4vLyAtLS0tLS0tLS0tLS0tXG5cbi8vIFdpdGggdGhlIGN1c3RvbSBob29kaWUgZXJyb3IgZnVuY3Rpb25cbi8vIHdlIG5vcm1hbGl6ZSBhbGwgZXJyb3JzIHRoZSBnZXQgcmV0dXJuZWRcbi8vIHdoZW4gdXNpbmcgaG9vZGllJ3MgcmVqZWN0V2l0aFxuLy9cbi8vIFRoZSBuYXRpdmUgSmF2YVNjcmlwdCBlcnJvciBtZXRob2QgaGFzXG4vLyBhIG5hbWUgJiBhIG1lc3NhZ2UgcHJvcGVydHkuIEhvb2RpZUVycm9yXG4vLyByZXF1aXJlcyB0aGVzZSwgYnV0IG9uIHRvcCBhbGxvd3MgZm9yXG4vLyB1bmxpbWl0ZWQgY3VzdG9tIHByb3BlcnRpZXMuXG4vL1xuLy8gSW5zdGVhZCBvZiBiZWluZyBpbml0aWFsaXplZCB3aXRoIGp1c3Rcbi8vIHRoZSBtZXNzYWdlLCBIb29kaWVFcnJvciBleHBlY3RzIGFuXG4vLyBvYmplY3Qgd2l0aCBwcm9wZXJpdGVzLiBUaGUgYG1lc3NhZ2VgXG4vLyBwcm9wZXJ0eSBpcyByZXF1aXJlZC4gVGhlIG5hbWUgd2lsbFxuLy8gZmFsbGJhY2sgdG8gYGVycm9yYC5cbi8vXG4vLyBgbWVzc2FnZWAgY2FuIGFsc28gY29udGFpbiBwbGFjZWhvbGRlcnNcbi8vIGluIHRoZSBmb3JtIG9mIGB7e3Byb3BlcnR5TmFtZX19YGAgd2hpY2hcbi8vIHdpbGwgZ2V0IHJlcGxhY2VkIGF1dG9tYXRpY2FsbHkgd2l0aCBwYXNzZWRcbi8vIGV4dHJhIHByb3BlcnRpZXMuXG4vL1xuLy8gIyMjIEVycm9yIENvbnZlbnRpb25zXG4vL1xuLy8gV2UgZm9sbG93IEphdmFTY3JpcHQncyBuYXRpdmUgZXJyb3IgY29udmVudGlvbnMsXG4vLyBtZWFuaW5nIHRoYXQgZXJyb3IgbmFtZXMgYXJlIGNhbWVsQ2FzZSB3aXRoIHRoZVxuLy8gZmlyc3QgbGV0dGVyIHVwcGVyY2FzZSBhcyB3ZWxsLCBhbmQgdGhlIG1lc3NhZ2Vcbi8vIHN0YXJ0aW5nIHdpdGggYW4gdXBwZXJjYXNlIGxldHRlci5cbi8vXG52YXIgZXJyb3JNZXNzYWdlUmVwbGFjZVBhdHRlcm4gPSAvXFx7XFx7XFxzKlxcdytcXHMqXFx9XFx9L2c7XG52YXIgZXJyb3JNZXNzYWdlRmluZFByb3BlcnR5UGF0dGVybiA9IC9cXHcrLztcblxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ2V4dGVuZCcpO1xuXG5mdW5jdGlvbiBIb29kaWVFcnJvcihwcm9wZXJ0aWVzKSB7XG5cbiAgLy8gbm9ybWFsaXplIGFyZ3VtZW50c1xuICBpZiAodHlwZW9mIHByb3BlcnRpZXMgPT09ICdzdHJpbmcnKSB7XG4gICAgcHJvcGVydGllcyA9IHtcbiAgICAgIG1lc3NhZ2U6IHByb3BlcnRpZXNcbiAgICB9O1xuICB9XG5cbiAgaWYgKCEgcHJvcGVydGllcy5tZXNzYWdlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdGQVRBTDogZXJyb3IubWVzc2FnZSBtdXN0IGJlIHNldCcpO1xuICB9XG5cbiAgLy8gbXVzdCBjaGVjayBmb3IgcHJvcGVydGllcywgYXMgdGhpcy5uYW1lIGlzIGFsd2F5cyBzZXQuXG4gIGlmICghIHByb3BlcnRpZXMubmFtZSkge1xuICAgIHByb3BlcnRpZXMubmFtZSA9ICdIb29kaWVFcnJvcic7XG4gIH1cblxuICBwcm9wZXJ0aWVzLm1lc3NhZ2UgPSBwcm9wZXJ0aWVzLm1lc3NhZ2UucmVwbGFjZShlcnJvck1lc3NhZ2VSZXBsYWNlUGF0dGVybiwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICB2YXIgcHJvcGVydHkgPSBtYXRjaC5tYXRjaChlcnJvck1lc3NhZ2VGaW5kUHJvcGVydHlQYXR0ZXJuKVswXTtcbiAgICByZXR1cm4gcHJvcGVydGllc1twcm9wZXJ0eV07XG4gIH0pO1xuICBleHRlbmQodGhpcywgcHJvcGVydGllcyk7XG59XG5Ib29kaWVFcnJvci5wcm90b3R5cGUgPSBuZXcgRXJyb3IoKTtcbkhvb2RpZUVycm9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEhvb2RpZUVycm9yO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhvb2RpZUVycm9yO1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgZXJyb3I6IHJlcXVpcmUoJy4vZXJyb3InKSxcbiAgb2JqZWN0SWQ6IHJlcXVpcmUoJy4vb2JqZWN0X2lkJyksXG4gIG9iamVjdFR5cGU6IHJlcXVpcmUoJy4vb2JqZWN0X3R5cGUnKVxufTtcbiIsIi8vIEhvb2RpZSBJbnZhbGlkIFR5cGUgT3IgSWQgRXJyb3Jcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gb25seSBsb3dlcmNhc2UgbGV0dGVycywgbnVtYmVycyBhbmQgZGFzaGVzXG4vLyBhcmUgYWxsb3dlZCBmb3Igb2JqZWN0IElEcy5cbi8vXG52YXIgSG9vZGllRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yJyk7XG5cbi8vXG5mdW5jdGlvbiBIb29kaWVPYmplY3RJZEVycm9yKHByb3BlcnRpZXMpIHtcbiAgcHJvcGVydGllcy5uYW1lID0gJ0hvb2RpZU9iamVjdElkRXJyb3InO1xuICBwcm9wZXJ0aWVzLm1lc3NhZ2UgPSAnXCJ7e2lkfX1cIiBpcyBpbnZhbGlkIG9iamVjdCBpZC4ge3tydWxlc319Lic7XG5cbiAgcmV0dXJuIG5ldyBIb29kaWVFcnJvcihwcm9wZXJ0aWVzKTtcbn1cbnZhciB2YWxpZElkUGF0dGVybiA9IC9eW2EtejAtOVxcLV0rJC87XG5Ib29kaWVPYmplY3RJZEVycm9yLmlzSW52YWxpZCA9IGZ1bmN0aW9uKGlkLCBjdXN0b21QYXR0ZXJuKSB7XG4gIHJldHVybiAhKGN1c3RvbVBhdHRlcm4gfHwgdmFsaWRJZFBhdHRlcm4pLnRlc3QoaWQgfHwgJycpO1xufTtcbkhvb2RpZU9iamVjdElkRXJyb3IuaXNWYWxpZCA9IGZ1bmN0aW9uKGlkLCBjdXN0b21QYXR0ZXJuKSB7XG4gIHJldHVybiAoY3VzdG9tUGF0dGVybiB8fCB2YWxpZElkUGF0dGVybikudGVzdChpZCB8fCAnJyk7XG59O1xuSG9vZGllT2JqZWN0SWRFcnJvci5wcm90b3R5cGUucnVsZXMgPSAnTG93ZXJjYXNlIGxldHRlcnMsIG51bWJlcnMgYW5kIGRhc2hlcyBhbGxvd2VkIG9ubHkuIE11c3Qgc3RhcnQgd2l0aCBhIGxldHRlcic7XG5cbm1vZHVsZS5leHBvcnRzID0gSG9vZGllT2JqZWN0SWRFcnJvcjtcbiIsIi8vIEhvb2RpZSBJbnZhbGlkIFR5cGUgT3IgSWQgRXJyb3Jcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gb25seSBsb3dlcmNhc2UgbGV0dGVycywgbnVtYmVycyBhbmQgZGFzaGVzXG4vLyBhcmUgYWxsb3dlZCBmb3Igb2JqZWN0IHR5cGVzLCBwbHVzIG11c3Qgc3RhcnRcbi8vIHdpdGggYSBsZXR0ZXIuXG4vL1xudmFyIEhvb2RpZUVycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpO1xuXG4vLyBIb29kaWUgSW52YWxpZCBUeXBlIE9yIElkIEVycm9yXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIG9ubHkgbG93ZXJjYXNlIGxldHRlcnMsIG51bWJlcnMgYW5kIGRhc2hlc1xuLy8gYXJlIGFsbG93ZWQgZm9yIG9iamVjdCB0eXBlcywgcGx1cyBtdXN0IHN0YXJ0XG4vLyB3aXRoIGEgbGV0dGVyLlxuLy9cbmZ1bmN0aW9uIEhvb2RpZU9iamVjdFR5cGVFcnJvcihwcm9wZXJ0aWVzKSB7XG4gIHByb3BlcnRpZXMubmFtZSA9ICdIb29kaWVPYmplY3RUeXBlRXJyb3InO1xuICBwcm9wZXJ0aWVzLm1lc3NhZ2UgPSAnXCJ7e3R5cGV9fVwiIGlzIGludmFsaWQgb2JqZWN0IHR5cGUuIHt7cnVsZXN9fS4nO1xuXG4gIHJldHVybiBuZXcgSG9vZGllRXJyb3IocHJvcGVydGllcyk7XG59XG52YXIgdmFsaWRUeXBlUGF0dGVybiA9IC9eW2EteiRdW2EtejAtOV0rJC87XG5Ib29kaWVPYmplY3RUeXBlRXJyb3IuaXNJbnZhbGlkID0gZnVuY3Rpb24odHlwZSwgY3VzdG9tUGF0dGVybikge1xuICByZXR1cm4gIShjdXN0b21QYXR0ZXJuIHx8IHZhbGlkVHlwZVBhdHRlcm4pLnRlc3QodHlwZSB8fCAnJyk7XG59O1xuSG9vZGllT2JqZWN0VHlwZUVycm9yLmlzVmFsaWQgPSBmdW5jdGlvbih0eXBlLCBjdXN0b21QYXR0ZXJuKSB7XG4gIHJldHVybiAoY3VzdG9tUGF0dGVybiB8fCB2YWxpZFR5cGVQYXR0ZXJuKS50ZXN0KHR5cGUgfHwgJycpO1xufTtcbkhvb2RpZU9iamVjdFR5cGVFcnJvci5wcm90b3R5cGUucnVsZXMgPSAnbG93ZXJjYXNlIGxldHRlcnMsIG51bWJlcnMgYW5kIGRhc2hlcyBhbGxvd2VkIG9ubHkuIE11c3Qgc3RhcnQgd2l0aCBhIGxldHRlcic7XG5cbm1vZHVsZS5leHBvcnRzID0gSG9vZGllT2JqZWN0VHlwZUVycm9yO1xuIiwiLy8gRXZlbnRzXG4vLyA9PT09PT09PVxuLy9cbi8vIGV4dGVuZCBhbnkgQ2xhc3Mgd2l0aCBzdXBwb3J0IGZvclxuLy9cbi8vICogYG9iamVjdC5iaW5kKCdldmVudCcsIGNiKWBcbi8vICogYG9iamVjdC51bmJpbmQoJ2V2ZW50JywgY2IpYFxuLy8gKiBgb2JqZWN0LnRyaWdnZXIoJ2V2ZW50JywgYXJncy4uLilgXG4vLyAqIGBvYmplY3Qub25lKCdldicsIGNiKWBcbi8vXG4vLyBiYXNlZCBvbiBbRXZlbnRzIGltcGxlbWVudGF0aW9ucyBmcm9tIFNwaW5lXShodHRwczovL2dpdGh1Yi5jb20vbWFjY21hbi9zcGluZS9ibG9iL21hc3Rlci9zcmMvc3BpbmUuY29mZmVlI0wxKVxuLy9cblxuLy8gY2FsbGJhY2tzIGFyZSBnbG9iYWwsIHdoaWxlIHRoZSBldmVudHMgQVBJIGlzIHVzZWQgYXQgc2V2ZXJhbCBwbGFjZXMsXG4vLyBsaWtlIGhvb2RpZS5vbiAvIGhvb2RpZS5zdG9yZS5vbiAvIGhvb2RpZS50YXNrLm9uIGV0Yy5cbi8vXG5mdW5jdGlvbiBob29kaWVFdmVudHMoaG9vZGllLCBvcHRpb25zKSB7XG4gIHZhciBjb250ZXh0ID0gaG9vZGllO1xuICB2YXIgbmFtZXNwYWNlID0gJyc7XG5cbiAgLy8gbm9ybWFsaXplIG9wdGlvbnMgaGFzaFxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAvLyBtYWtlIHN1cmUgY2FsbGJhY2tzIGhhc2ggZXhpc3RzXG4gIGlmICghaG9vZGllLmV2ZW50c0NhbGxiYWNrcykge1xuICAgIGhvb2RpZS5ldmVudHNDYWxsYmFja3MgPSB7fTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmNvbnRleHQpIHtcbiAgICBjb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0O1xuICAgIG5hbWVzcGFjZSA9IG9wdGlvbnMubmFtZXNwYWNlICsgJzonO1xuICB9XG5cbiAgLy8gQmluZFxuICAvLyAtLS0tLS1cbiAgLy9cbiAgLy8gYmluZCBhIGNhbGxiYWNrIHRvIGFuIGV2ZW50IHRyaWdnZXJkIGJ5IHRoZSBvYmplY3RcbiAgLy9cbiAgLy8gICAgIG9iamVjdC5iaW5kICdjaGVhdCcsIGJsYW1lXG4gIC8vXG4gIGZ1bmN0aW9uIGJpbmQoZXYsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGV2cywgbmFtZSwgX2ksIF9sZW47XG5cbiAgICBldnMgPSBldi5zcGxpdCgnICcpO1xuXG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBldnMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIG5hbWUgPSBuYW1lc3BhY2UgKyBldnNbX2ldO1xuICAgICAgaG9vZGllLmV2ZW50c0NhbGxiYWNrc1tuYW1lXSA9IGhvb2RpZS5ldmVudHNDYWxsYmFja3NbbmFtZV0gfHwgW107XG4gICAgICBob29kaWUuZXZlbnRzQ2FsbGJhY2tzW25hbWVdLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbiAgfVxuXG4gIC8vIG9uZVxuICAvLyAtLS0tLVxuICAvL1xuICAvLyBzYW1lIGFzIGBiaW5kYCwgYnV0IGRvZXMgZ2V0IGV4ZWN1dGVkIG9ubHkgb25jZVxuICAvL1xuICAvLyAgICAgb2JqZWN0Lm9uZSAnZ3JvdW5kVG91Y2gnLCBnYW1lT3ZlclxuICAvL1xuICBmdW5jdGlvbiBvbmUoZXYsIGNhbGxiYWNrKSB7XG4gICAgZXYgPSBuYW1lc3BhY2UgKyBldjtcbiAgICB2YXIgd3JhcHBlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBob29kaWUudW5iaW5kKGV2LCB3cmFwcGVyKTtcbiAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgaG9vZGllLmJpbmQoZXYsIHdyYXBwZXIpO1xuICB9XG5cbiAgLy8gdHJpZ2dlclxuICAvLyAtLS0tLS0tLS1cbiAgLy9cbiAgLy8gdHJpZ2dlciBhbiBldmVudCBhbmQgcGFzcyBvcHRpb25hbCBwYXJhbWV0ZXJzIGZvciBiaW5kaW5nLlxuICAvLyAgICAgb2JqZWN0LnRyaWdnZXIgJ3dpbicsIHNjb3JlOiAxMjMwXG4gIC8vXG4gIGZ1bmN0aW9uIHRyaWdnZXIoKSB7XG4gICAgdmFyIGFyZ3MsIGNhbGxiYWNrLCBldiwgbGlzdCwgX2ksIF9sZW47XG5cbiAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgIGV2ID0gYXJncy5zaGlmdCgpO1xuICAgIGV2ID0gbmFtZXNwYWNlICsgZXY7XG4gICAgbGlzdCA9IGhvb2RpZS5ldmVudHNDYWxsYmFja3NbZXZdO1xuXG4gICAgaWYgKCFsaXN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBsaXN0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBjYWxsYmFjayA9IGxpc3RbX2ldO1xuICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyB1bmJpbmRcbiAgLy8gLS0tLS0tLS1cbiAgLy9cbiAgLy8gdW5iaW5kIHRvIGZyb20gYWxsIGJpbmRpbmdzLCBmcm9tIGFsbCBiaW5kaW5ncyBvZiBhIHNwZWNpZmljIGV2ZW50XG4gIC8vIG9yIGZyb20gYSBzcGVjaWZpYyBiaW5kaW5nLlxuICAvL1xuICAvLyAgICAgb2JqZWN0LnVuYmluZCgpXG4gIC8vICAgICBvYmplY3QudW5iaW5kICdtb3ZlJ1xuICAvLyAgICAgb2JqZWN0LnVuYmluZCAnbW92ZScsIGZvbGxvd1xuICAvL1xuICBmdW5jdGlvbiB1bmJpbmQoZXYsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGNiLCBpLCBsaXN0LCBfaSwgX2xlbiwgZXZOYW1lcztcblxuICAgIGlmICghZXYpIHtcbiAgICAgIGlmICghbmFtZXNwYWNlKSB7XG4gICAgICAgIGhvb2RpZS5ldmVudHNDYWxsYmFja3MgPSB7fTtcbiAgICAgIH1cblxuICAgICAgZXZOYW1lcyA9IE9iamVjdC5rZXlzKGhvb2RpZS5ldmVudHNDYWxsYmFja3MpO1xuICAgICAgZXZOYW1lcyA9IGV2TmFtZXMuZmlsdGVyKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4ga2V5LmluZGV4T2YobmFtZXNwYWNlKSA9PT0gMDtcbiAgICAgIH0pO1xuICAgICAgZXZOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBkZWxldGUgaG9vZGllLmV2ZW50c0NhbGxiYWNrc1trZXldO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldiA9IG5hbWVzcGFjZSArIGV2O1xuXG4gICAgbGlzdCA9IGhvb2RpZS5ldmVudHNDYWxsYmFja3NbZXZdO1xuXG4gICAgaWYgKCFsaXN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgZGVsZXRlIGhvb2RpZS5ldmVudHNDYWxsYmFja3NbZXZdO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoaSA9IF9pID0gMCwgX2xlbiA9IGxpc3QubGVuZ3RoOyBfaSA8IF9sZW47IGkgPSArK19pKSB7XG4gICAgICBjYiA9IGxpc3RbaV07XG5cblxuICAgICAgaWYgKGNiICE9PSBjYWxsYmFjaykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgbGlzdCA9IGxpc3Quc2xpY2UoKTtcbiAgICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgICAgaG9vZGllLmV2ZW50c0NhbGxiYWNrc1tldl0gPSBsaXN0O1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29udGV4dC5iaW5kID0gYmluZDtcbiAgY29udGV4dC5vbiA9IGJpbmQ7XG4gIGNvbnRleHQub25lID0gb25lO1xuICBjb250ZXh0LnRyaWdnZXIgPSB0cmlnZ2VyO1xuICBjb250ZXh0LnVuYmluZCA9IHVuYmluZDtcbiAgY29udGV4dC5vZmYgPSB1bmJpbmQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllRXZlbnRzO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGVycm9yOiByZXF1aXJlKCcuL2Vycm9yJyksXG4gIGV2ZW50czogcmVxdWlyZSgnLi9ldmVudHMnKSxcbiAgc3RvcmU6IHJlcXVpcmUoJy4vc3RvcmUnKSxcbiAgdGFzazogcmVxdWlyZSgnLi90YXNrJylcbn07XG4iLCIvLyBTdG9yZVxuLy8gPT09PT09PT09PT09XG5cbi8vIFRoaXMgY2xhc3MgZGVmaW5lcyB0aGUgQVBJIHRoYXQgaG9vZGllLnN0b3JlIChsb2NhbCBzdG9yZSkgYW5kIGhvb2RpZS5vcGVuXG4vLyAocmVtb3RlIHN0b3JlKSBpbXBsZW1lbnQgdG8gYXNzdXJlIGEgY29oZXJlbnQgQVBJLiBJdCBhbHNvIGltcGxlbWVudHMgc29tZVxuLy8gYmFzaWMgdmFsaWRhdGlvbnMuXG4vL1xuLy8gVGhlIHJldHVybmVkIEFQSSBwcm92aWRlcyB0aGUgZm9sbG93aW5nIG1ldGhvZHM6XG4vL1xuLy8gKiB2YWxpZGF0ZVxuLy8gKiBzYXZlXG4vLyAqIGFkZFxuLy8gKiBmaW5kXG4vLyAqIGZpbmRPckFkZFxuLy8gKiBmaW5kQWxsXG4vLyAqIHVwZGF0ZVxuLy8gKiB1cGRhdGVBbGxcbi8vICogcmVtb3ZlXG4vLyAqIHJlbW92ZUFsbFxuLy8gKiBkZWNvcmF0ZVByb21pc2VzXG4vLyAqIHRyaWdnZXJcbi8vICogb25cbi8vICogdW5iaW5kXG4vL1xuLy8gQXQgdGhlIHNhbWUgdGltZSwgdGhlIHJldHVybmVkIEFQSSBjYW4gYmUgY2FsbGVkIGFzIGZ1bmN0aW9uIHJldHVybmluZyBhXG4vLyBzdG9yZSBzY29wZWQgYnkgdGhlIHBhc3NlZCB0eXBlLCBmb3IgZXhhbXBsZVxuLy9cbi8vICAgICB2YXIgdGFza1N0b3JlID0gaG9vZGllLnN0b3JlKCd0YXNrJyk7XG4vLyAgICAgdGFza1N0b3JlLmZpbmRBbGwoKS50aGVuKCBzaG93QWxsVGFza3MgKTtcbi8vICAgICB0YXNrU3RvcmUudXBkYXRlKCdpZDEyMycsIHtkb25lOiB0cnVlfSk7XG4vL1xuXG4vL1xudmFyIGhvb2RpZVNjb3BlZFN0b3JlQXBpID0gcmVxdWlyZSgnLi9zY29wZWQnKTtcbnZhciBob29kaWVFdmVudHMgPSByZXF1aXJlKCcuLi9ldmVudHMnKTtcbnZhciBIb29kaWVFcnJvciA9IHJlcXVpcmUoJy4uL2Vycm9yL2Vycm9yJyk7XG52YXIgSG9vZGllT2JqZWN0VHlwZUVycm9yID0gcmVxdWlyZSgnLi4vZXJyb3Ivb2JqZWN0X3R5cGUnKTtcbnZhciBIb29kaWVPYmplY3RJZEVycm9yID0gcmVxdWlyZSgnLi4vZXJyb3Ivb2JqZWN0X2lkJyk7XG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG5cbnZhciBnZXREZWZlciA9IHJlcXVpcmUoJy4uLy4uL3V0aWxzL3Byb21pc2UvZGVmZXInKTtcbnZhciByZWplY3RXaXRoID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMvcHJvbWlzZS9yZWplY3Rfd2l0aCcpO1xudmFyIHJlc29sdmVXaXRoID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMvcHJvbWlzZS9yZXNvbHZlX3dpdGgnKTtcbnZhciBpc1Byb21pc2UgPSByZXF1aXJlKCcuLi8uLi91dGlscy9wcm9taXNlL2lzX3Byb21pc2UnKTtcblxuLy9cbmZ1bmN0aW9uIGhvb2RpZVN0b3JlQXBpKGhvb2RpZSwgb3B0aW9ucykge1xuXG4gIC8vIHBlcnNpc3RhbmNlIGxvZ2ljXG4gIHZhciBiYWNrZW5kID0ge307XG5cbiAgLy8gZXh0ZW5kIHRoaXMgcHJvcGVydHkgd2l0aCBleHRyYSBmdW5jdGlvbnMgdGhhdCB3aWxsIGJlIGF2YWlsYWJsZVxuICAvLyBvbiBhbGwgcHJvbWlzZXMgcmV0dXJuZWQgYnkgaG9vZGllLnN0b3JlIEFQSS4gSXQgaGFzIGEgcmVmZXJlbmNlXG4gIC8vIHRvIGN1cnJlbnQgaG9vZGllIGluc3RhbmNlIGJ5IGRlZmF1bHRcbiAgdmFyIHByb21pc2VBcGkgPSB7XG4gICAgaG9vZGllOiBob29kaWVcbiAgfTtcblxuICAvLyBuYW1lXG4gIHZhciBzdG9yZU5hbWUgPSBvcHRpb25zLm5hbWUgfHwgJ3N0b3JlJztcblxuICAvLyBwdWJsaWMgQVBJXG4gIHZhciBhcGkgPSBmdW5jdGlvbiBhcGkodHlwZSwgaWQpIHtcbiAgICB2YXIgc2NvcGVkT3B0aW9ucyA9IGV4dGVuZCh0cnVlLCB7XG4gICAgICB0eXBlOiB0eXBlLFxuICAgICAgaWQ6IGlkXG4gICAgfSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIGhvb2RpZVNjb3BlZFN0b3JlQXBpKGhvb2RpZSwgYXBpLCBzY29wZWRPcHRpb25zKTtcbiAgfTtcblxuICAvLyBhZGQgZXZlbnQgQVBJXG4gIGhvb2RpZUV2ZW50cyhob29kaWUsIHtcbiAgICBjb250ZXh0OiBhcGksXG4gICAgbmFtZXNwYWNlOiBzdG9yZU5hbWVcbiAgfSk7XG5cblxuICAvLyBWYWxpZGF0ZVxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGJ5IGRlZmF1bHQsIHdlIG9ubHkgY2hlY2sgZm9yIGEgdmFsaWQgdHlwZSAmIGlkLlxuICAvLyB0aGUgdmFsaWRhdGUgbWV0aG9kIGNhbiBiZSBvdmVyd3JpdGVuIGJ5IHBhc3NpbmdcbiAgLy8gb3B0aW9ucy52YWxpZGF0ZVxuICAvL1xuICAvLyBpZiBgdmFsaWRhdGVgIHJldHVybnMgbm90aGluZywgdGhlIHBhc3NlZCBvYmplY3QgaXNcbiAgLy8gdmFsaWQuIE90aGVyd2lzZSBpdCByZXR1cm5zIGFuIGVycm9yXG4gIC8vXG4gIGFwaS52YWxpZGF0ZSA9IG9wdGlvbnMudmFsaWRhdGU7XG5cbiAgaWYgKCFvcHRpb25zLnZhbGlkYXRlKSB7XG4gICAgYXBpLnZhbGlkYXRlID0gZnVuY3Rpb24ob2JqZWN0IC8qLCBvcHRpb25zICovICkge1xuXG4gICAgICBpZiAoIW9iamVjdCkge1xuICAgICAgICByZXR1cm4gbmV3IEhvb2RpZUVycm9yKHtcbiAgICAgICAgICBuYW1lOiAnSW52YWxpZE9iamVjdEVycm9yJyxcbiAgICAgICAgICBtZXNzYWdlOiAnTm8gb2JqZWN0IHBhc3NlZC4nXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoSG9vZGllT2JqZWN0VHlwZUVycm9yLmlzSW52YWxpZChvYmplY3QudHlwZSwgdmFsaWRJZE9yVHlwZVBhdHRlcm4pKSB7XG4gICAgICAgIHJldHVybiBuZXcgSG9vZGllT2JqZWN0VHlwZUVycm9yKHtcbiAgICAgICAgICB0eXBlOiBvYmplY3QudHlwZSxcbiAgICAgICAgICBydWxlczogdmFsaWRJZE9yVHlwZVJ1bGVzXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9iamVjdC5pZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChIb29kaWVPYmplY3RJZEVycm9yLmlzSW52YWxpZChvYmplY3QuaWQsIHZhbGlkSWRPclR5cGVQYXR0ZXJuKSkge1xuICAgICAgICByZXR1cm4gbmV3IEhvb2RpZU9iamVjdElkRXJyb3Ioe1xuICAgICAgICAgIGlkOiBvYmplY3QuaWQsXG4gICAgICAgICAgcnVsZXM6IHZhbGlkSWRPclR5cGVSdWxlc1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgIH07XG5cbiAgfVxuXG4gIC8vIFNhdmVcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBjcmVhdGVzIG9yIHJlcGxhY2VzIGFuIGFuIGV2ZW50dWFsbHkgZXhpc3Rpbmcgb2JqZWN0IGluIHRoZSBzdG9yZVxuICAvLyB3aXRoIHNhbWUgdHlwZSAmIGlkLlxuICAvL1xuICAvLyBXaGVuIGlkIGlzIHVuZGVmaW5lZCwgaXQgZ2V0cyBnZW5lcmF0ZWQgYW5kIGEgbmV3IG9iamVjdCBnZXRzIHNhdmVkXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2U6XG4gIC8vXG4gIC8vICAgICBzdG9yZS5zYXZlKCdjYXInLCB1bmRlZmluZWQsIHtjb2xvcjogJ3JlZCd9KVxuICAvLyAgICAgc3RvcmUuc2F2ZSgnY2FyJywgJ2FiYzQ1NjcnLCB7Y29sb3I6ICdyZWQnfSlcbiAgLy9cbiAgYXBpLnNhdmUgPSBmdW5jdGlvbiBzYXZlKHR5cGUsIGlkLCBwcm9wZXJ0aWVzLCBvcHRpb25zKSB7XG5cbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IGV4dGVuZCh0cnVlLCB7fSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICAvLyBkb24ndCBtZXNzIHdpdGggcGFzc2VkIG9iamVjdFxuICAgIHZhciBvYmplY3QgPSBleHRlbmQodHJ1ZSwge30sIHByb3BlcnRpZXMsIHtcbiAgICAgIHR5cGU6IHR5cGUsXG4gICAgICBpZDogaWRcbiAgICB9KTtcblxuICAgIC8vIHZhbGlkYXRpb25zXG4gICAgdmFyIGVycm9yID0gYXBpLnZhbGlkYXRlKG9iamVjdCwgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHJldHVybiByZWplY3RXaXRoKGVycm9yKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVjb3JhdGVQcm9taXNlKGJhY2tlbmQuc2F2ZShvYmplY3QsIG9wdGlvbnMgfHwge30pKTtcbiAgfTtcblxuXG4gIC8vIEFkZFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gYC5hZGRgIGlzIGFuIGFsaWFzIGZvciBgLnNhdmVgLCB3aXRoIHRoZSBkaWZmZXJlbmNlIHRoYXQgdGhlcmUgaXMgbm8gaWQgYXJndW1lbnQuXG4gIC8vIEludGVybmFsbHkgaXQgc2ltcGx5IGNhbGxzIGAuc2F2ZSh0eXBlLCB1bmRlZmluZWQsIG9iamVjdCkuXG4gIC8vXG4gIGFwaS5hZGQgPSBmdW5jdGlvbiBhZGQodHlwZSwgcHJvcGVydGllcywgb3B0aW9ucykge1xuXG4gICAgaWYgKHByb3BlcnRpZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcHJvcGVydGllcyA9IHt9O1xuICAgIH1cblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgcmV0dXJuIGFwaS5zYXZlKHR5cGUsIHByb3BlcnRpZXMuaWQsIHByb3BlcnRpZXMsIG9wdGlvbnMpO1xuICB9O1xuXG5cbiAgLy8gZmluZFxuICAvLyAtLS0tLS1cblxuICAvL1xuICBhcGkuZmluZCA9IGZ1bmN0aW9uIGZpbmQodHlwZSwgaWQpIHtcblxuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoYmFja2VuZC5maW5kKHR5cGUsIGlkKSk7XG4gIH07XG5cblxuICAvLyBmaW5kIG9yIGFkZFxuICAvLyAtLS0tLS0tLS0tLS0tXG5cbiAgLy8gMS4gVHJ5IHRvIGZpbmQgYSBzaGFyZSBieSBnaXZlbiBpZFxuICAvLyAyLiBJZiBzaGFyZSBjb3VsZCBiZSBmb3VuZCwgcmV0dXJuIGl0XG4gIC8vIDMuIElmIG5vdCwgYWRkIG9uZSBhbmQgcmV0dXJuIGl0LlxuICAvL1xuICBhcGkuZmluZE9yQWRkID0gZnVuY3Rpb24gZmluZE9yQWRkKHR5cGUsIGlkLCBwcm9wZXJ0aWVzKSB7XG5cbiAgICBpZiAocHJvcGVydGllcyA9PT0gbnVsbCkge1xuICAgICAgcHJvcGVydGllcyA9IHt9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhbmRsZU5vdEZvdW5kKCkge1xuICAgICAgdmFyIG5ld1Byb3BlcnRpZXM7XG4gICAgICBuZXdQcm9wZXJ0aWVzID0gZXh0ZW5kKHRydWUsIHtcbiAgICAgICAgaWQ6IGlkXG4gICAgICB9LCBwcm9wZXJ0aWVzKTtcbiAgICAgIHJldHVybiBhcGkuYWRkKHR5cGUsIG5ld1Byb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIC8vIHByb21pc2UgZGVjb3JhdGlvbnMgZ2V0IGxvc3Qgd2hlbiBwaXBlZCB0aHJvdWdoIGB0aGVuYCxcbiAgICAvLyB0aGF0J3Mgd2h5IHdlIG5lZWQgdG8gZGVjb3JhdGUgdGhlIGZpbmQncyBwcm9taXNlIGFnYWluLlxuICAgIHZhciBwcm9taXNlID0gYXBpLmZpbmQodHlwZSwgaWQpLnRoZW4obnVsbCwgaGFuZGxlTm90Rm91bmQpO1xuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UocHJvbWlzZSk7XG4gIH07XG5cblxuICAvLyBmaW5kQWxsXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIHJldHVybnMgYWxsIG9iamVjdHMgZnJvbSBzdG9yZS5cbiAgLy8gQ2FuIGJlIG9wdGlvbmFsbHkgZmlsdGVyZWQgYnkgYSB0eXBlIG9yIGEgZnVuY3Rpb25cbiAgLy9cbiAgYXBpLmZpbmRBbGwgPSBmdW5jdGlvbiBmaW5kQWxsKHR5cGUsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gZGVjb3JhdGVQcm9taXNlKCBiYWNrZW5kLmZpbmRBbGwodHlwZSwgb3B0aW9ucykgKTtcbiAgfTtcblxuXG4gIC8vIFVwZGF0ZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gSW4gY29udHJhc3QgdG8gYC5zYXZlYCwgdGhlIGAudXBkYXRlYCBtZXRob2QgZG9lcyBub3QgcmVwbGFjZSB0aGUgc3RvcmVkIG9iamVjdCxcbiAgLy8gYnV0IG9ubHkgY2hhbmdlcyB0aGUgcGFzc2VkIGF0dHJpYnV0ZXMgb2YgYW4gZXhzdGluZyBvYmplY3QsIGlmIGl0IGV4aXN0c1xuICAvL1xuICAvLyBib3RoIGEgaGFzaCBvZiBrZXkvdmFsdWVzIG9yIGEgZnVuY3Rpb24gdGhhdCBhcHBsaWVzIHRoZSB1cGRhdGUgdG8gdGhlIHBhc3NlZFxuICAvLyBvYmplY3QgY2FuIGJlIHBhc3NlZC5cbiAgLy9cbiAgLy8gZXhhbXBsZSB1c2FnZVxuICAvL1xuICAvLyBob29kaWUuc3RvcmUudXBkYXRlKCdjYXInLCAnYWJjNDU2NycsIHtzb2xkOiB0cnVlfSlcbiAgLy8gaG9vZGllLnN0b3JlLnVwZGF0ZSgnY2FyJywgJ2FiYzQ1NjcnLCBmdW5jdGlvbihvYmopIHsgb2JqLnNvbGQgPSB0cnVlIH0pXG4gIC8vXG4gIGFwaS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUodHlwZSwgaWQsIG9iamVjdFVwZGF0ZSwgb3B0aW9ucykge1xuXG4gICAgZnVuY3Rpb24gaGFuZGxlRm91bmQoY3VycmVudE9iamVjdCkge1xuICAgICAgdmFyIGNoYW5nZWRQcm9wZXJ0aWVzLCBuZXdPYmosIHZhbHVlO1xuXG4gICAgICAvLyBub3JtYWxpemUgaW5wdXRcbiAgICAgIG5ld09iaiA9IGV4dGVuZCh0cnVlLCB7fSwgY3VycmVudE9iamVjdCk7XG5cbiAgICAgIGlmICh0eXBlb2Ygb2JqZWN0VXBkYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9iamVjdFVwZGF0ZSA9IG9iamVjdFVwZGF0ZShuZXdPYmopO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9iamVjdFVwZGF0ZSkge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZVdpdGgoY3VycmVudE9iamVjdCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGNoZWNrIGlmIHNvbWV0aGluZyBjaGFuZ2VkXG4gICAgICBjaGFuZ2VkUHJvcGVydGllcyA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIF9yZXN1bHRzID0gW107XG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iamVjdFVwZGF0ZSkge1xuICAgICAgICAgIGlmIChvYmplY3RVcGRhdGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgdmFsdWUgPSBvYmplY3RVcGRhdGVba2V5XTtcbiAgICAgICAgICAgIGlmICgoY3VycmVudE9iamVjdFtrZXldICE9PSB2YWx1ZSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gd29ya2Fyb3VuZCBmb3IgdW5kZWZpbmVkIHZhbHVlcywgYXMgZXh0ZW5kIGlnbm9yZXMgdGhlc2VcbiAgICAgICAgICAgIG5ld09ialtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKGtleSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH0pKCk7XG5cbiAgICAgIGlmICghKGNoYW5nZWRQcm9wZXJ0aWVzLmxlbmd0aCB8fCBvcHRpb25zKSkge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZVdpdGgobmV3T2JqKTtcbiAgICAgIH1cblxuICAgICAgLy9hcHBseSB1cGRhdGVcbiAgICAgIHJldHVybiBhcGkuc2F2ZSh0eXBlLCBpZCwgbmV3T2JqLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBwcm9taXNlIGRlY29yYXRpb25zIGdldCBsb3N0IHdoZW4gcGlwZWQgdGhyb3VnaCBgdGhlbmAsXG4gICAgLy8gdGhhdCdzIHdoeSB3ZSBuZWVkIHRvIGRlY29yYXRlIHRoZSBmaW5kJ3MgcHJvbWlzZSBhZ2Fpbi5cbiAgICB2YXIgcHJvbWlzZSA9IGFwaS5maW5kKHR5cGUsIGlkKS50aGVuKGhhbmRsZUZvdW5kKTtcbiAgICByZXR1cm4gZGVjb3JhdGVQcm9taXNlKHByb21pc2UpO1xuICB9O1xuXG5cbiAgLy8gdXBkYXRlT3JBZGRcbiAgLy8gLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHNhbWUgYXMgYC51cGRhdGUoKWAsIGJ1dCBpbiBjYXNlIHRoZSBvYmplY3QgY2Fubm90IGJlIGZvdW5kLFxuICAvLyBpdCBnZXRzIGNyZWF0ZWRcbiAgLy9cbiAgYXBpLnVwZGF0ZU9yQWRkID0gZnVuY3Rpb24gdXBkYXRlT3JBZGQodHlwZSwgaWQsIG9iamVjdFVwZGF0ZSwgb3B0aW9ucykge1xuICAgIGZ1bmN0aW9uIGhhbmRsZU5vdEZvdW5kKCkge1xuICAgICAgdmFyIHByb3BlcnRpZXMgPSBleHRlbmQodHJ1ZSwge30sIG9iamVjdFVwZGF0ZSwge1xuICAgICAgICBpZDogaWRcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gYXBpLmFkZCh0eXBlLCBwcm9wZXJ0aWVzLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICB2YXIgcHJvbWlzZSA9IGFwaS51cGRhdGUodHlwZSwgaWQsIG9iamVjdFVwZGF0ZSwgb3B0aW9ucykudGhlbihudWxsLCBoYW5kbGVOb3RGb3VuZCk7XG5cbiAgICByZXR1cm4gZGVjb3JhdGVQcm9taXNlKHByb21pc2UpO1xuICB9O1xuXG5cbiAgLy8gdXBkYXRlQWxsXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gdXBkYXRlIGFsbCBvYmplY3RzIGluIHRoZSBzdG9yZSwgY2FuIGJlIG9wdGlvbmFsbHkgZmlsdGVyZWQgYnkgYSBmdW5jdGlvblxuICAvLyBBcyBhbiBhbHRlcm5hdGl2ZSwgYW4gYXJyYXkgb2Ygb2JqZWN0cyBjYW4gYmUgcGFzc2VkXG4gIC8vXG4gIC8vIGV4YW1wbGUgdXNhZ2VcbiAgLy9cbiAgLy8gaG9vZGllLnN0b3JlLnVwZGF0ZUFsbCgpXG4gIC8vXG4gIGFwaS51cGRhdGVBbGwgPSBmdW5jdGlvbiB1cGRhdGVBbGwoZmlsdGVyT3JPYmplY3RzLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgcHJvbWlzZTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLy8gbm9ybWFsaXplIHRoZSBpbnB1dDogbWFrZSBzdXJlIHdlIGhhdmUgYWxsIG9iamVjdHNcbiAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICBjYXNlIHR5cGVvZiBmaWx0ZXJPck9iamVjdHMgPT09ICdzdHJpbmcnOlxuICAgICAgcHJvbWlzZSA9IGFwaS5maW5kQWxsKGZpbHRlck9yT2JqZWN0cyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGlzUHJvbWlzZShmaWx0ZXJPck9iamVjdHMpOlxuICAgICAgcHJvbWlzZSA9IGZpbHRlck9yT2JqZWN0cztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJC5pc0FycmF5KGZpbHRlck9yT2JqZWN0cyk6XG4gICAgICBwcm9taXNlID0gZ2V0RGVmZXIoKS5yZXNvbHZlKGZpbHRlck9yT2JqZWN0cykucHJvbWlzZSgpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIGUuZy4gbnVsbCwgdXBkYXRlIGFsbFxuICAgICAgcHJvbWlzZSA9IGFwaS5maW5kQWxsKCk7XG4gICAgfVxuXG4gICAgcHJvbWlzZSA9IHByb21pc2UudGhlbihmdW5jdGlvbihvYmplY3RzKSB7XG4gICAgICAvLyBub3cgd2UgdXBkYXRlIGFsbCBvYmplY3RzIG9uZSBieSBvbmUgYW5kIHJldHVybiBhIHByb21pc2VcbiAgICAgIC8vIHRoYXQgd2lsbCBiZSByZXNvbHZlZCBvbmNlIGFsbCB1cGRhdGVzIGhhdmUgYmVlbiBmaW5pc2hlZFxuICAgICAgdmFyIG9iamVjdCwgX3VwZGF0ZVByb21pc2VzO1xuXG4gICAgICBpZiAoISQuaXNBcnJheShvYmplY3RzKSkge1xuICAgICAgICBvYmplY3RzID0gW29iamVjdHNdO1xuICAgICAgfVxuXG4gICAgICBfdXBkYXRlUHJvbWlzZXMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gb2JqZWN0cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIG9iamVjdCA9IG9iamVjdHNbX2ldO1xuICAgICAgICAgIF9yZXN1bHRzLnB1c2goYXBpLnVwZGF0ZShvYmplY3QudHlwZSwgb2JqZWN0LmlkLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9KSgpO1xuXG4gICAgICByZXR1cm4gJC53aGVuLmFwcGx5KG51bGwsIF91cGRhdGVQcm9taXNlcyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGVjb3JhdGVQcm9taXNlKHByb21pc2UpO1xuICB9O1xuXG5cbiAgLy8gUmVtb3ZlXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIFJlbW92ZXMgb25lIG9iamVjdCBzcGVjaWZpZWQgYnkgYHR5cGVgIGFuZCBgaWRgLlxuICAvL1xuICAvLyB3aGVuIG9iamVjdCBoYXMgYmVlbiBzeW5jZWQgYmVmb3JlLCBtYXJrIGl0IGFzIGRlbGV0ZWQuXG4gIC8vIE90aGVyd2lzZSByZW1vdmUgaXQgZnJvbSBTdG9yZS5cbiAgLy9cbiAgYXBpLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZSh0eXBlLCBpZCwgb3B0aW9ucykge1xuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoYmFja2VuZC5yZW1vdmUodHlwZSwgaWQsIG9wdGlvbnMgfHwge30pKTtcbiAgfTtcblxuXG4gIC8vIHJlbW92ZUFsbFxuICAvLyAtLS0tLS0tLS0tLVxuXG4gIC8vIERlc3Ryb3llIGFsbCBvYmplY3RzLiBDYW4gYmUgZmlsdGVyZWQgYnkgYSB0eXBlXG4gIC8vXG4gIGFwaS5yZW1vdmVBbGwgPSBmdW5jdGlvbiByZW1vdmVBbGwodHlwZSwgb3B0aW9ucykge1xuICAgIHJldHVybiBkZWNvcmF0ZVByb21pc2UoYmFja2VuZC5yZW1vdmVBbGwodHlwZSwgb3B0aW9ucyB8fCB7fSkpO1xuICB9O1xuXG5cbiAgLy8gZGVjb3JhdGUgcHJvbWlzZXNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGV4dGVuZCBwcm9taXNlcyByZXR1cm5lZCBieSBzdG9yZS5hcGlcbiAgYXBpLmRlY29yYXRlUHJvbWlzZXMgPSBmdW5jdGlvbiBkZWNvcmF0ZVByb21pc2VzKG1ldGhvZHMpIHtcbiAgICByZXR1cm4gZXh0ZW5kKHByb21pc2VBcGksIG1ldGhvZHMpO1xuICB9O1xuXG5cblxuICAvLyByZXF1aXJlZCBiYWNrZW5kIG1ldGhvZHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpZiAoIW9wdGlvbnMuYmFja2VuZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignb3B0aW9ucy5iYWNrZW5kIG11c3QgYmUgcGFzc2VkJyk7XG4gIH1cblxuICB2YXIgcmVxdWlyZWQgPSAnc2F2ZSBmaW5kIGZpbmRBbGwgcmVtb3ZlIHJlbW92ZUFsbCcuc3BsaXQoJyAnKTtcblxuICByZXF1aXJlZC5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZE5hbWUpIHtcblxuICAgIGlmICghb3B0aW9ucy5iYWNrZW5kW21ldGhvZE5hbWVdKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ29wdGlvbnMuYmFja2VuZC4nICsgbWV0aG9kTmFtZSArICcgbXVzdCBiZSBwYXNzZWQuJyk7XG4gICAgfVxuXG4gICAgYmFja2VuZFttZXRob2ROYW1lXSA9IG9wdGlvbnMuYmFja2VuZFttZXRob2ROYW1lXTtcbiAgfSk7XG5cblxuICAvLyBQcml2YXRlXG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIC8gbm90IGFsbG93ZWQgZm9yIGlkXG4gIHZhciB2YWxpZElkT3JUeXBlUGF0dGVybiA9IC9eW15cXC9dKyQvO1xuICB2YXIgdmFsaWRJZE9yVHlwZVJ1bGVzID0gJy8gbm90IGFsbG93ZWQnO1xuXG4gIC8vXG4gIGZ1bmN0aW9uIGRlY29yYXRlUHJvbWlzZShwcm9taXNlKSB7XG4gICAgcmV0dXJuIGV4dGVuZChwcm9taXNlLCBwcm9taXNlQXBpKTtcbiAgfVxuXG4gIHJldHVybiBhcGk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllU3RvcmVBcGk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgYXBpOiByZXF1aXJlKCcuL2FwaScpLFxuICByZW1vdGU6IHJlcXVpcmUoJy4vcmVtb3RlJyksXG4gIHNjb3BlZDogcmVxdWlyZSgnLi9zY29wZWQnKVxufTtcbiIsInZhciBnbG9iYWw9dHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9Oy8vIFJlbW90ZVxuLy8gPT09PT09PT1cblxuLy8gQ29ubmVjdGlvbiB0byBhIHJlbW90ZSBDb3VjaCBEYXRhYmFzZS5cbi8vXG4vLyBzdG9yZSBBUElcbi8vIC0tLS0tLS0tLS0tLS0tLS1cbi8vXG4vLyBvYmplY3QgbG9hZGluZyAvIHVwZGF0aW5nIC8gZGVsZXRpbmdcbi8vXG4vLyAqIGZpbmQodHlwZSwgaWQpXG4vLyAqIGZpbmRBbGwodHlwZSApXG4vLyAqIGFkZCh0eXBlLCBvYmplY3QpXG4vLyAqIHNhdmUodHlwZSwgaWQsIG9iamVjdClcbi8vICogdXBkYXRlKHR5cGUsIGlkLCBuZXdfcHJvcGVydGllcyApXG4vLyAqIHVwZGF0ZUFsbCggdHlwZSwgbmV3X3Byb3BlcnRpZXMpXG4vLyAqIHJlbW92ZSh0eXBlLCBpZClcbi8vICogcmVtb3ZlQWxsKHR5cGUpXG4vL1xuLy8gY3VzdG9tIHJlcXVlc3RzXG4vL1xuLy8gKiByZXF1ZXN0KHZpZXcsIHBhcmFtcylcbi8vICogZ2V0KHZpZXcsIHBhcmFtcylcbi8vICogcG9zdCh2aWV3LCBwYXJhbXMpXG4vL1xuLy8gc3luY2hyb25pemF0aW9uXG4vL1xuLy8gKiBjb25uZWN0KClcbi8vICogZGlzY29ubmVjdCgpXG4vLyAqIHB1bGwoKVxuLy8gKiBwdXNoKClcbi8vICogc3luYygpXG4vL1xuLy8gZXZlbnQgYmluZGluZ1xuLy9cbi8vICogb24oZXZlbnQsIGNhbGxiYWNrKVxuLy9cblxudmFyIGhvb2RpZVN0b3JlQXBpID0gcmVxdWlyZSgnLi9hcGknKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQnKTtcbnZhciBnZW5lcmF0ZUlkID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMvZ2VuZXJhdGVfaWQnKTtcbnZhciByZXNvbHZlV2l0aCA9IHJlcXVpcmUoJy4uLy4uL3V0aWxzL3Byb21pc2UvcmVzb2x2ZV93aXRoJyk7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVSZW1vdGVTdG9yZShob29kaWUsIG9wdGlvbnMpIHtcblxuICB2YXIgcmVtb3RlU3RvcmUgPSB7fTtcblxuXG4gIC8vIFJlbW90ZSBTdG9yZSBQZXJzaXN0YW5jZSBtZXRob2RzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBmaW5kXG4gIC8vIC0tLS0tLVxuXG4gIC8vIGZpbmQgb25lIG9iamVjdFxuICAvL1xuICByZW1vdGVTdG9yZS5maW5kID0gZnVuY3Rpb24gZmluZCh0eXBlLCBpZCkge1xuICAgIHZhciBwYXRoO1xuXG4gICAgcGF0aCA9IHR5cGUgKyAnLycgKyBpZDtcblxuICAgIGlmIChyZW1vdGUucHJlZml4KSB7XG4gICAgICBwYXRoID0gcmVtb3RlLnByZWZpeCArIHBhdGg7XG4gICAgfVxuXG4gICAgcGF0aCA9ICcvJyArIGVuY29kZVVSSUNvbXBvbmVudChwYXRoKTtcblxuICAgIHJldHVybiByZW1vdGUucmVxdWVzdCgnR0VUJywgcGF0aCkudGhlbihwYXJzZUZyb21SZW1vdGUpO1xuICB9O1xuXG5cbiAgLy8gZmluZEFsbFxuICAvLyAtLS0tLS0tLS1cblxuICAvLyBmaW5kIGFsbCBvYmplY3RzLCBjYW4gYmUgZmlsZXRlcmVkIGJ5IGEgdHlwZVxuICAvL1xuICByZW1vdGVTdG9yZS5maW5kQWxsID0gZnVuY3Rpb24gZmluZEFsbCh0eXBlKSB7XG4gICAgdmFyIGVuZGtleSwgcGF0aCwgc3RhcnRrZXk7XG5cbiAgICBwYXRoID0gJy9fYWxsX2RvY3M/aW5jbHVkZV9kb2NzPXRydWUnO1xuXG4gICAgc3dpdGNoICh0cnVlKSB7XG4gICAgY2FzZSAodHlwZSAhPT0gdW5kZWZpbmVkKSAmJiByZW1vdGUucHJlZml4ICE9PSAnJzpcbiAgICAgIHN0YXJ0a2V5ID0gcmVtb3RlLnByZWZpeCArIHR5cGUgKyAnLyc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIHR5cGUgIT09IHVuZGVmaW5lZDpcbiAgICAgIHN0YXJ0a2V5ID0gdHlwZSArICcvJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgcmVtb3RlLnByZWZpeCAhPT0gJyc6XG4gICAgICBzdGFydGtleSA9IHJlbW90ZS5wcmVmaXg7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgc3RhcnRrZXkgPSAnJztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnRrZXkpIHtcblxuICAgICAgLy8gbWFrZSBzdXJlIHRoYXQgb25seSBvYmplY3RzIHN0YXJ0aW5nIHdpdGhcbiAgICAgIC8vIGBzdGFydGtleWAgd2lsbCBiZSByZXR1cm5lZFxuICAgICAgZW5ka2V5ID0gc3RhcnRrZXkucmVwbGFjZSgvLiQvLCBmdW5jdGlvbihjaGFycykge1xuICAgICAgICB2YXIgY2hhckNvZGU7XG4gICAgICAgIGNoYXJDb2RlID0gY2hhcnMuY2hhckNvZGVBdCgwKTtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY2hhckNvZGUgKyAxKTtcbiAgICAgIH0pO1xuICAgICAgcGF0aCA9ICcnICsgcGF0aCArICcmc3RhcnRrZXk9XCInICsgKGVuY29kZVVSSUNvbXBvbmVudChzdGFydGtleSkpICsgJ1wiJmVuZGtleT1cIicgKyAoZW5jb2RlVVJJQ29tcG9uZW50KGVuZGtleSkpICsgJ1wiJztcbiAgICB9XG5cbiAgICByZXR1cm4gcmVtb3RlLnJlcXVlc3QoJ0dFVCcsIHBhdGgpLnRoZW4obWFwRG9jc0Zyb21GaW5kQWxsKS50aGVuKHBhcnNlQWxsRnJvbVJlbW90ZSk7XG4gIH07XG5cblxuICAvLyBzYXZlXG4gIC8vIC0tLS0tLVxuXG4gIC8vIHNhdmUgYSBuZXcgb2JqZWN0LiBJZiBpdCBleGlzdGVkIGJlZm9yZSwgYWxsIHByb3BlcnRpZXNcbiAgLy8gd2lsbCBiZSBvdmVyd3JpdHRlblxuICAvL1xuICByZW1vdGVTdG9yZS5zYXZlID0gZnVuY3Rpb24gc2F2ZShvYmplY3QpIHtcbiAgICB2YXIgcGF0aDtcblxuICAgIGlmICghb2JqZWN0LmlkKSB7XG4gICAgICBvYmplY3QuaWQgPSBnZW5lcmF0ZUlkKCk7XG4gICAgfVxuXG4gICAgb2JqZWN0ID0gcGFyc2VGb3JSZW1vdGUob2JqZWN0KTtcbiAgICBwYXRoID0gJy8nICsgZW5jb2RlVVJJQ29tcG9uZW50KG9iamVjdC5faWQpO1xuICAgIHJldHVybiByZW1vdGUucmVxdWVzdCgnUFVUJywgcGF0aCwge1xuICAgICAgZGF0YTogb2JqZWN0XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyByZW1vdmVcbiAgLy8gLS0tLS0tLS0tXG5cbiAgLy8gcmVtb3ZlIG9uZSBvYmplY3RcbiAgLy9cbiAgcmVtb3RlU3RvcmUucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKHR5cGUsIGlkKSB7XG4gICAgcmV0dXJuIHJlbW90ZS51cGRhdGUodHlwZSwgaWQsIHtcbiAgICAgIF9kZWxldGVkOiB0cnVlXG4gICAgfSk7XG4gIH07XG5cblxuICAvLyByZW1vdmVBbGxcbiAgLy8gLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmVtb3ZlIGFsbCBvYmplY3RzLCBjYW4gYmUgZmlsdGVyZWQgYnkgdHlwZVxuICAvL1xuICByZW1vdGVTdG9yZS5yZW1vdmVBbGwgPSBmdW5jdGlvbiByZW1vdmVBbGwodHlwZSkge1xuICAgIHJldHVybiByZW1vdGUudXBkYXRlQWxsKHR5cGUsIHtcbiAgICAgIF9kZWxldGVkOiB0cnVlXG4gICAgfSk7XG4gIH07XG5cblxuICB2YXIgcmVtb3RlID0gaG9vZGllU3RvcmVBcGkoaG9vZGllLCB7XG5cbiAgICBuYW1lOiBvcHRpb25zLm5hbWUsXG5cbiAgICBiYWNrZW5kOiB7XG4gICAgICBzYXZlOiByZW1vdGVTdG9yZS5zYXZlLFxuICAgICAgZmluZDogcmVtb3RlU3RvcmUuZmluZCxcbiAgICAgIGZpbmRBbGw6IHJlbW90ZVN0b3JlLmZpbmRBbGwsXG4gICAgICByZW1vdmU6IHJlbW90ZVN0b3JlLnJlbW92ZSxcbiAgICAgIHJlbW92ZUFsbDogcmVtb3RlU3RvcmUucmVtb3ZlQWxsXG4gICAgfVxuICB9KTtcblxuXG5cblxuXG4gIC8vIHByb3BlcnRpZXNcbiAgLy8gLS0tLS0tLS0tLS0tXG5cbiAgLy8gbmFtZVxuXG4gIC8vIHRoZSBuYW1lIG9mIHRoZSBSZW1vdGUgaXMgdGhlIG5hbWUgb2YgdGhlXG4gIC8vIENvdWNoREIgZGF0YWJhc2UgYW5kIGlzIGFsc28gdXNlZCB0byBwcmVmaXhcbiAgLy8gdHJpZ2dlcmVkIGV2ZW50c1xuICAvL1xuICB2YXIgcmVtb3RlTmFtZSA9IG51bGw7XG5cblxuICAvLyBzeW5jXG5cbiAgLy8gaWYgc2V0IHRvIHRydWUsIHVwZGF0ZXMgd2lsbCBiZSBjb250aW51b3VzbHkgcHVsbGVkXG4gIC8vIGFuZCBwdXNoZWQuIEFsdGVybmF0aXZlbHksIGBzeW5jYCBjYW4gYmUgc2V0IHRvXG4gIC8vIGBwdWxsOiB0cnVlYCBvciBgcHVzaDogdHJ1ZWAuXG4gIC8vXG4gIHJlbW90ZS5jb25uZWN0ZWQgPSBmYWxzZTtcblxuXG4gIC8vIHByZWZpeFxuXG4gIC8vIHByZWZpeCBmb3IgZG9jcyBpbiBhIENvdWNoREIgZGF0YWJhc2UsIGUuZy4gYWxsIGRvY3NcbiAgLy8gaW4gcHVibGljIHVzZXIgc3RvcmVzIGFyZSBwcmVmaXhlZCBieSAnJHB1YmxpYy8nXG4gIC8vXG4gIHJlbW90ZS5wcmVmaXggPSAnJztcbiAgdmFyIHJlbW90ZVByZWZpeFBhdHRlcm4gPSBuZXcgUmVnRXhwKCdeJyk7XG5cblxuICAvLyBkZWZhdWx0c1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy9cbiAgaWYgKG9wdGlvbnMubmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmVtb3RlTmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnByZWZpeCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmVtb3RlLnByZWZpeCA9IG9wdGlvbnMucHJlZml4O1xuICAgIHJlbW90ZVByZWZpeFBhdHRlcm4gPSBuZXcgUmVnRXhwKCdeJyArIHJlbW90ZS5wcmVmaXgpO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuYmFzZVVybCAhPT0gbnVsbCkge1xuICAgIHJlbW90ZS5iYXNlVXJsID0gb3B0aW9ucy5iYXNlVXJsO1xuICB9XG5cblxuICAvLyByZXF1ZXN0XG4gIC8vIC0tLS0tLS0tLVxuXG4gIC8vIHdyYXBwZXIgZm9yIGhvb2RpZSdzIHJlcXVlc3QsIHdpdGggc29tZSBzdG9yZSBzcGVjaWZpYyBkZWZhdWx0c1xuICAvLyBhbmQgYSBwcmVmaXhlZCBwYXRoXG4gIC8vXG4gIHJlbW90ZS5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVtb3RlUmVxdWVzdCh0eXBlLCBwYXRoLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAocmVtb3RlTmFtZSkge1xuICAgICAgcGF0aCA9ICcvJyArIChlbmNvZGVVUklDb21wb25lbnQocmVtb3RlTmFtZSkpICsgcGF0aDtcbiAgICB9XG5cbiAgICBpZiAocmVtb3RlLmJhc2VVcmwpIHtcbiAgICAgIHBhdGggPSAnJyArIHJlbW90ZS5iYXNlVXJsICsgcGF0aDtcbiAgICB9XG5cbiAgICBvcHRpb25zLmNvbnRlbnRUeXBlID0gb3B0aW9ucy5jb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24vanNvbic7XG5cbiAgICBpZiAodHlwZSA9PT0gJ1BPU1QnIHx8IHR5cGUgPT09ICdQVVQnKSB7XG4gICAgICBvcHRpb25zLmRhdGFUeXBlID0gb3B0aW9ucy5kYXRhVHlwZSB8fCAnanNvbic7XG4gICAgICBvcHRpb25zLnByb2Nlc3NEYXRhID0gb3B0aW9ucy5wcm9jZXNzRGF0YSB8fCBmYWxzZTtcbiAgICAgIG9wdGlvbnMuZGF0YSA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiBob29kaWUucmVxdWVzdCh0eXBlLCBwYXRoLCBvcHRpb25zKTtcbiAgfTtcblxuXG4gIC8vIGlzS25vd25PYmplY3RcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gZGV0ZXJtaW5lIGJldHdlZW4gYSBrbm93biBhbmQgYSBuZXcgb2JqZWN0XG4gIC8vXG4gIHJlbW90ZS5pc0tub3duT2JqZWN0ID0gZnVuY3Rpb24gaXNLbm93bk9iamVjdChvYmplY3QpIHtcbiAgICB2YXIga2V5ID0gJycgKyBvYmplY3QudHlwZSArICcvJyArIG9iamVjdC5pZDtcblxuICAgIGlmIChrbm93bk9iamVjdHNba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4ga25vd25PYmplY3RzW2tleV07XG4gICAgfVxuICB9O1xuXG5cbiAgLy8gbWFya0FzS25vd25PYmplY3RcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIGRldGVybWluZSBiZXR3ZWVuIGEga25vd24gYW5kIGEgbmV3IG9iamVjdFxuICAvL1xuICByZW1vdGUubWFya0FzS25vd25PYmplY3QgPSBmdW5jdGlvbiBtYXJrQXNLbm93bk9iamVjdChvYmplY3QpIHtcbiAgICB2YXIga2V5ID0gJycgKyBvYmplY3QudHlwZSArICcvJyArIG9iamVjdC5pZDtcbiAgICBrbm93bk9iamVjdHNba2V5XSA9IDE7XG4gICAgcmV0dXJuIGtub3duT2JqZWN0c1trZXldO1xuICB9O1xuXG5cbiAgLy8gc3luY2hyb25pemF0aW9uXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gQ29ubmVjdFxuICAvLyAtLS0tLS0tLS1cblxuICAvLyBzdGFydCBzeW5jaW5nLiBgcmVtb3RlLmJvb3RzdHJhcCgpYCB3aWxsIGF1dG9tYXRpY2FsbHkgc3RhcnRcbiAgLy8gcHVsbGluZyB3aGVuIGByZW1vdGUuY29ubmVjdGVkYCByZW1haW5zIHRydWUuXG4gIC8vXG4gIHJlbW90ZS5jb25uZWN0ID0gZnVuY3Rpb24gY29ubmVjdChuYW1lKSB7XG4gICAgaWYgKG5hbWUpIHtcbiAgICAgIHJlbW90ZU5hbWUgPSBuYW1lO1xuICAgIH1cbiAgICByZW1vdGUuY29ubmVjdGVkID0gdHJ1ZTtcbiAgICByZW1vdGUudHJpZ2dlcignY29ubmVjdCcpO1xuICAgIHJldHVybiByZW1vdGUuYm9vdHN0cmFwKCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgIHJlbW90ZS5wdXNoKCk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvLyBEaXNjb25uZWN0XG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIHN0b3Agc3luY2luZyBjaGFuZ2VzIGZyb20gcmVtb3RlIHN0b3JlXG4gIC8vXG4gIHJlbW90ZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24gZGlzY29ubmVjdCgpIHtcbiAgICByZW1vdGUuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgcmVtb3RlLnRyaWdnZXIoJ2Rpc2Nvbm5lY3QnKTsgLy8gVE9ETzogc3BlYyB0aGF0XG4gICAgaWYgKHB1bGxSZXF1ZXN0KSB7XG4gICAgICBwdWxsUmVxdWVzdC5hYm9ydCgpO1xuICAgIH1cblxuICAgIGlmIChwdXNoUmVxdWVzdCkge1xuICAgICAgcHVzaFJlcXVlc3QuYWJvcnQoKTtcbiAgICB9XG5cbiAgfTtcblxuXG4gIC8vIGlzQ29ubmVjdGVkXG4gIC8vIC0tLS0tLS0tLS0tLS1cblxuICAvL1xuICByZW1vdGUuaXNDb25uZWN0ZWQgPSBmdW5jdGlvbiBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gcmVtb3RlLmNvbm5lY3RlZDtcbiAgfTtcblxuXG4gIC8vIGdldFNpbmNlTnJcbiAgLy8gLS0tLS0tLS0tLS0tXG5cbiAgLy8gcmV0dXJucyB0aGUgc2VxdWVuY2UgbnVtYmVyIGZyb20gd2ljaCB0byBzdGFydCB0byBmaW5kIGNoYW5nZXMgaW4gcHVsbFxuICAvL1xuICB2YXIgc2luY2UgPSBvcHRpb25zLnNpbmNlIHx8IDA7IC8vIFRPRE86IHNwZWMgdGhhdCFcbiAgcmVtb3RlLmdldFNpbmNlTnIgPSBmdW5jdGlvbiBnZXRTaW5jZU5yKCkge1xuICAgIGlmICh0eXBlb2Ygc2luY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBzaW5jZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBzaW5jZTtcbiAgfTtcblxuXG4gIC8vIGJvb3RzdHJhcFxuICAvLyAtLS0tLS0tLS0tLVxuXG4gIC8vIGluaXRhbCBwdWxsIG9mIGRhdGEgb2YgdGhlIHJlbW90ZSBzdG9yZS4gQnkgZGVmYXVsdCwgd2UgcHVsbCBhbGxcbiAgLy8gY2hhbmdlcyBzaW5jZSB0aGUgYmVnaW5uaW5nLCBidXQgdGhpcyBiZWhhdmlvciBtaWdodCBiZSBhZGp1c3RlZCxcbiAgLy8gZS5nIGZvciBhIGZpbHRlcmVkIGJvb3RzdHJhcC5cbiAgLy9cbiAgdmFyIGlzQm9vdHN0cmFwcGluZyA9IGZhbHNlO1xuICByZW1vdGUuYm9vdHN0cmFwID0gZnVuY3Rpb24gYm9vdHN0cmFwKCkge1xuICAgIGlzQm9vdHN0cmFwcGluZyA9IHRydWU7XG4gICAgcmVtb3RlLnRyaWdnZXIoJ2Jvb3RzdHJhcDpzdGFydCcpO1xuICAgIHJldHVybiByZW1vdGUucHVsbCgpLmRvbmUoaGFuZGxlQm9vdHN0cmFwU3VjY2VzcykuZmFpbChoYW5kbGVCb290c3RyYXBFcnJvcik7XG4gIH07XG5cblxuICAvLyBwdWxsIGNoYW5nZXNcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBhLmsuYS4gbWFrZSBhIEdFVCByZXF1ZXN0IHRvIENvdWNoREIncyBgX2NoYW5nZXNgIGZlZWQuXG4gIC8vIFdlIGN1cnJlbnRseSBtYWtlIGxvbmcgcG9sbCByZXF1ZXN0cywgdGhhdCB3ZSBtYW51YWxseSBhYm9ydFxuICAvLyBhbmQgcmVzdGFydCBlYWNoIDI1IHNlY29uZHMuXG4gIC8vXG4gIHZhciBwdWxsUmVxdWVzdCwgcHVsbFJlcXVlc3RUaW1lb3V0O1xuICByZW1vdGUucHVsbCA9IGZ1bmN0aW9uIHB1bGwoKSB7XG4gICAgcHVsbFJlcXVlc3QgPSByZW1vdGUucmVxdWVzdCgnR0VUJywgcHVsbFVybCgpKTtcblxuICAgIGlmIChyZW1vdGUuaXNDb25uZWN0ZWQoKSkge1xuICAgICAgZ2xvYmFsLmNsZWFyVGltZW91dChwdWxsUmVxdWVzdFRpbWVvdXQpO1xuICAgICAgcHVsbFJlcXVlc3RUaW1lb3V0ID0gZ2xvYmFsLnNldFRpbWVvdXQocmVzdGFydFB1bGxSZXF1ZXN0LCAyNTAwMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHB1bGxSZXF1ZXN0LmRvbmUoaGFuZGxlUHVsbFN1Y2Nlc3MpLmZhaWwoaGFuZGxlUHVsbEVycm9yKTtcbiAgfTtcblxuXG4gIC8vIHB1c2ggY2hhbmdlc1xuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFB1c2ggb2JqZWN0cyB0byByZW1vdGUgc3RvcmUgdXNpbmcgdGhlIGBfYnVsa19kb2NzYCBBUEkuXG4gIC8vXG4gIHZhciBwdXNoUmVxdWVzdDtcbiAgcmVtb3RlLnB1c2ggPSBmdW5jdGlvbiBwdXNoKG9iamVjdHMpIHtcbiAgICB2YXIgb2JqZWN0LCBvYmplY3RzRm9yUmVtb3RlLCBfaSwgX2xlbjtcblxuICAgIGlmICghJC5pc0FycmF5KG9iamVjdHMpKSB7XG4gICAgICBvYmplY3RzID0gZGVmYXVsdE9iamVjdHNUb1B1c2goKTtcbiAgICB9XG5cbiAgICBpZiAob2JqZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiByZXNvbHZlV2l0aChbXSk7XG4gICAgfVxuXG4gICAgb2JqZWN0c0ZvclJlbW90ZSA9IFtdO1xuXG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBvYmplY3RzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG5cbiAgICAgIC8vIGRvbid0IG1lc3Mgd2l0aCBvcmlnaW5hbCBvYmplY3RzXG4gICAgICBvYmplY3QgPSBleHRlbmQodHJ1ZSwge30sIG9iamVjdHNbX2ldKTtcbiAgICAgIGFkZFJldmlzaW9uVG8ob2JqZWN0KTtcbiAgICAgIG9iamVjdCA9IHBhcnNlRm9yUmVtb3RlKG9iamVjdCk7XG4gICAgICBvYmplY3RzRm9yUmVtb3RlLnB1c2gob2JqZWN0KTtcbiAgICB9XG4gICAgcHVzaFJlcXVlc3QgPSByZW1vdGUucmVxdWVzdCgnUE9TVCcsICcvX2J1bGtfZG9jcycsIHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgZG9jczogb2JqZWN0c0ZvclJlbW90ZSxcbiAgICAgICAgbmV3X2VkaXRzOiBmYWxzZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcHVzaFJlcXVlc3QuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICByZW1vdGUudHJpZ2dlcigncHVzaCcsIG9iamVjdHNbaV0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBwdXNoUmVxdWVzdDtcbiAgfTtcblxuICAvLyBzeW5jIGNoYW5nZXNcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBwdXNoIG9iamVjdHMsIHRoZW4gcHVsbCB1cGRhdGVzLlxuICAvL1xuICByZW1vdGUuc3luYyA9IGZ1bmN0aW9uIHN5bmMob2JqZWN0cykge1xuICAgIHJldHVybiByZW1vdGUucHVzaChvYmplY3RzKS50aGVuKHJlbW90ZS5wdWxsKTtcbiAgfTtcblxuICAvL1xuICAvLyBQcml2YXRlXG4gIC8vIC0tLS0tLS0tLVxuICAvL1xuXG4gIC8vIGluIG9yZGVyIHRvIGRpZmZlcmVudGlhdGUgd2hldGhlciBhbiBvYmplY3QgZnJvbSByZW1vdGUgc2hvdWxkIHRyaWdnZXIgYSAnbmV3J1xuICAvLyBvciBhbiAndXBkYXRlJyBldmVudCwgd2Ugc3RvcmUgYSBoYXNoIG9mIGtub3duIG9iamVjdHNcbiAgdmFyIGtub3duT2JqZWN0cyA9IHt9O1xuXG5cbiAgLy8gdmFsaWQgQ291Y2hEQiBkb2MgYXR0cmlidXRlcyBzdGFydGluZyB3aXRoIGFuIHVuZGVyc2NvcmVcbiAgLy9cbiAgdmFyIHZhbGlkU3BlY2lhbEF0dHJpYnV0ZXMgPSBbJ19pZCcsICdfcmV2JywgJ19kZWxldGVkJywgJ19yZXZpc2lvbnMnLCAnX2F0dGFjaG1lbnRzJ107XG5cblxuICAvLyBkZWZhdWx0IG9iamVjdHMgdG8gcHVzaFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIHdoZW4gcHVzaGVkIHdpdGhvdXQgcGFzc2luZyBhbnkgb2JqZWN0cywgdGhlIG9iamVjdHMgcmV0dXJuZWQgZnJvbVxuICAvLyB0aGlzIG1ldGhvZCB3aWxsIGJlIHBhc3NlZC4gSXQgY2FuIGJlIG92ZXJ3cml0dGVuIGJ5IHBhc3NpbmcgYW5cbiAgLy8gYXJyYXkgb2Ygb2JqZWN0cyBvciBhIGZ1bmN0aW9uIGFzIGBvcHRpb25zLm9iamVjdHNgXG4gIC8vXG4gIHZhciBkZWZhdWx0T2JqZWN0c1RvUHVzaCA9IGZ1bmN0aW9uIGRlZmF1bHRPYmplY3RzVG9QdXNoKCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH07XG4gIGlmIChvcHRpb25zLmRlZmF1bHRPYmplY3RzVG9QdXNoKSB7XG4gICAgaWYgKCQuaXNBcnJheShvcHRpb25zLmRlZmF1bHRPYmplY3RzVG9QdXNoKSkge1xuICAgICAgZGVmYXVsdE9iamVjdHNUb1B1c2ggPSBmdW5jdGlvbiBkZWZhdWx0T2JqZWN0c1RvUHVzaCgpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuZGVmYXVsdE9iamVjdHNUb1B1c2g7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZhdWx0T2JqZWN0c1RvUHVzaCA9IG9wdGlvbnMuZGVmYXVsdE9iamVjdHNUb1B1c2g7XG4gICAgfVxuICB9XG5cblxuICAvLyBzZXRTaW5jZU5yXG4gIC8vIC0tLS0tLS0tLS0tLVxuXG4gIC8vIHNldHMgdGhlIHNlcXVlbmNlIG51bWJlciBmcm9tIHdpY2ggdG8gc3RhcnQgdG8gZmluZCBjaGFuZ2VzIGluIHB1bGwuXG4gIC8vIElmIHJlbW90ZSBzdG9yZSB3YXMgaW5pdGlhbGl6ZWQgd2l0aCBzaW5jZSA6IGZ1bmN0aW9uKG5yKSB7IC4uLiB9LFxuICAvLyBjYWxsIHRoZSBmdW5jdGlvbiB3aXRoIHRoZSBzZXEgcGFzc2VkLiBPdGhlcndpc2Ugc2ltcGx5IHNldCB0aGUgc2VxXG4gIC8vIG51bWJlciBhbmQgcmV0dXJuIGl0LlxuICAvL1xuICBmdW5jdGlvbiBzZXRTaW5jZU5yKHNlcSkge1xuICAgIGlmICh0eXBlb2Ygc2luY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBzaW5jZShzZXEpO1xuICAgIH1cblxuICAgIHNpbmNlID0gc2VxO1xuICAgIHJldHVybiBzaW5jZTtcbiAgfVxuXG5cbiAgLy8gUGFyc2UgZm9yIHJlbW90ZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBwYXJzZSBvYmplY3QgZm9yIHJlbW90ZSBzdG9yYWdlLiBBbGwgcHJvcGVydGllcyBzdGFydGluZyB3aXRoIGFuXG4gIC8vIGB1bmRlcnNjb3JlYCBkbyBub3QgZ2V0IHN5bmNocm9uaXplZCBkZXNwaXRlIHRoZSBzcGVjaWFsIHByb3BlcnRpZXNcbiAgLy8gYF9pZGAsIGBfcmV2YCBhbmQgYF9kZWxldGVkYCAoc2VlIGFib3ZlKVxuICAvL1xuICAvLyBBbHNvIGBpZGAgZ2V0cyByZXBsYWNlZCB3aXRoIGBfaWRgIHdoaWNoIGNvbnNpc3RzIG9mIHR5cGUgJiBpZFxuICAvL1xuICBmdW5jdGlvbiBwYXJzZUZvclJlbW90ZShvYmplY3QpIHtcbiAgICB2YXIgYXR0ciwgcHJvcGVydGllcztcbiAgICBwcm9wZXJ0aWVzID0gZXh0ZW5kKHt9LCBvYmplY3QpO1xuXG4gICAgZm9yIChhdHRyIGluIHByb3BlcnRpZXMpIHtcbiAgICAgIGlmIChwcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KGF0dHIpKSB7XG4gICAgICAgIGlmICh2YWxpZFNwZWNpYWxBdHRyaWJ1dGVzLmluZGV4T2YoYXR0cikgIT09IC0xKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEvXl8vLnRlc3QoYXR0cikpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgcHJvcGVydGllc1thdHRyXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBwcmVwYXJlIENvdWNoREIgaWRcbiAgICBwcm9wZXJ0aWVzLl9pZCA9ICcnICsgcHJvcGVydGllcy50eXBlICsgJy8nICsgcHJvcGVydGllcy5pZDtcbiAgICBpZiAocmVtb3RlLnByZWZpeCkge1xuICAgICAgcHJvcGVydGllcy5faWQgPSAnJyArIHJlbW90ZS5wcmVmaXggKyBwcm9wZXJ0aWVzLl9pZDtcbiAgICB9XG4gICAgZGVsZXRlIHByb3BlcnRpZXMuaWQ7XG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG4gIH1cblxuXG4gIC8vICMjIyBfcGFyc2VGcm9tUmVtb3RlXG5cbiAgLy8gbm9ybWFsaXplIG9iamVjdHMgY29taW5nIGZyb20gcmVtb3RlXG4gIC8vXG4gIC8vIHJlbmFtZXMgYF9pZGAgYXR0cmlidXRlIHRvIGBpZGAgYW5kIHJlbW92ZXMgdGhlIHR5cGUgZnJvbSB0aGUgaWQsXG4gIC8vIGUuZy4gYHR5cGUvMTIzYCAtPiBgMTIzYFxuICAvL1xuICBmdW5jdGlvbiBwYXJzZUZyb21SZW1vdGUob2JqZWN0KSB7XG4gICAgdmFyIGlkLCBpZ25vcmUsIF9yZWY7XG5cbiAgICAvLyBoYW5kbGUgaWQgYW5kIHR5cGVcbiAgICBpZCA9IG9iamVjdC5faWQgfHwgb2JqZWN0LmlkO1xuICAgIGRlbGV0ZSBvYmplY3QuX2lkO1xuXG4gICAgaWYgKHJlbW90ZS5wcmVmaXgpIHtcbiAgICAgIGlkID0gaWQucmVwbGFjZShyZW1vdGVQcmVmaXhQYXR0ZXJuLCAnJyk7XG4gICAgICAvLyBpZCA9IGlkLnJlcGxhY2UobmV3IFJlZ0V4cCgnXicgKyByZW1vdGUucHJlZml4KSwgJycpO1xuICAgIH1cblxuICAgIC8vIHR1cm4gZG9jLzEyMyBpbnRvIHR5cGUgPSBkb2MgJiBpZCA9IDEyM1xuICAgIC8vIE5PVEU6IHdlIGRvbid0IHVzZSBhIHNpbXBsZSBpZC5zcGxpdCgvXFwvLykgaGVyZSxcbiAgICAvLyBhcyBpbiBzb21lIGNhc2VzIElEcyBtaWdodCBjb250YWluICcvJywgdG9vXG4gICAgLy9cbiAgICBfcmVmID0gaWQubWF0Y2goLyhbXlxcL10rKVxcLyguKikvKSwgaWdub3JlID0gX3JlZlswXSwgb2JqZWN0LnR5cGUgPSBfcmVmWzFdLCBvYmplY3QuaWQgPSBfcmVmWzJdO1xuXG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlQWxsRnJvbVJlbW90ZShvYmplY3RzKSB7XG4gICAgdmFyIG9iamVjdCwgX2ksIF9sZW4sIF9yZXN1bHRzO1xuICAgIF9yZXN1bHRzID0gW107XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBvYmplY3RzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBvYmplY3QgPSBvYmplY3RzW19pXTtcbiAgICAgIF9yZXN1bHRzLnB1c2gocGFyc2VGcm9tUmVtb3RlKG9iamVjdCkpO1xuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH1cblxuXG4gIC8vICMjIyBfYWRkUmV2aXNpb25Ub1xuXG4gIC8vIGV4dGVuZHMgcGFzc2VkIG9iamVjdCB3aXRoIGEgX3JldiBwcm9wZXJ0eVxuICAvL1xuICBmdW5jdGlvbiBhZGRSZXZpc2lvblRvKGF0dHJpYnV0ZXMpIHtcbiAgICB2YXIgY3VycmVudFJldklkLCBjdXJyZW50UmV2TnIsIG5ld1JldmlzaW9uSWQsIF9yZWY7XG4gICAgdHJ5IHtcbiAgICAgIF9yZWYgPSBhdHRyaWJ1dGVzLl9yZXYuc3BsaXQoLy0vKSwgY3VycmVudFJldk5yID0gX3JlZlswXSwgY3VycmVudFJldklkID0gX3JlZlsxXTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHt9XG4gICAgY3VycmVudFJldk5yID0gcGFyc2VJbnQoY3VycmVudFJldk5yLCAxMCkgfHwgMDtcbiAgICBuZXdSZXZpc2lvbklkID0gZ2VuZXJhdGVOZXdSZXZpc2lvbklkKCk7XG5cbiAgICAvLyBsb2NhbCBjaGFuZ2VzIGFyZSBub3QgbWVhbnQgdG8gYmUgcmVwbGljYXRlZCBvdXRzaWRlIG9mIHRoZVxuICAgIC8vIHVzZXJzIGRhdGFiYXNlLCB0aGVyZWZvcmUgdGhlIGAtbG9jYWxgIHN1ZmZpeC5cbiAgICBpZiAoYXR0cmlidXRlcy5fJGxvY2FsKSB7XG4gICAgICBuZXdSZXZpc2lvbklkICs9ICctbG9jYWwnO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZXMuX3JldiA9ICcnICsgKGN1cnJlbnRSZXZOciArIDEpICsgJy0nICsgbmV3UmV2aXNpb25JZDtcbiAgICBhdHRyaWJ1dGVzLl9yZXZpc2lvbnMgPSB7XG4gICAgICBzdGFydDogMSxcbiAgICAgIGlkczogW25ld1JldmlzaW9uSWRdXG4gICAgfTtcblxuICAgIGlmIChjdXJyZW50UmV2SWQpIHtcbiAgICAgIGF0dHJpYnV0ZXMuX3JldmlzaW9ucy5zdGFydCArPSBjdXJyZW50UmV2TnI7XG4gICAgICByZXR1cm4gYXR0cmlidXRlcy5fcmV2aXNpb25zLmlkcy5wdXNoKGN1cnJlbnRSZXZJZCk7XG4gICAgfVxuICB9XG5cblxuICAvLyAjIyMgZ2VuZXJhdGUgbmV3IHJldmlzaW9uIGlkXG5cbiAgLy9cbiAgZnVuY3Rpb24gZ2VuZXJhdGVOZXdSZXZpc2lvbklkKCkge1xuICAgIHJldHVybiBnZW5lcmF0ZUlkKDkpO1xuICB9XG5cblxuICAvLyAjIyMgbWFwIGRvY3MgZnJvbSBmaW5kQWxsXG5cbiAgLy9cbiAgZnVuY3Rpb24gbWFwRG9jc0Zyb21GaW5kQWxsKHJlc3BvbnNlKSB7XG4gICAgcmV0dXJuIHJlc3BvbnNlLnJvd3MubWFwKGZ1bmN0aW9uKHJvdykge1xuICAgICAgcmV0dXJuIHJvdy5kb2M7XG4gICAgfSk7XG4gIH1cblxuXG4gIC8vICMjIyBwdWxsIHVybFxuXG4gIC8vIERlcGVuZGluZyBvbiB3aGV0aGVyIHJlbW90ZSBpcyBjb25uZWN0ZWQgKD0gcHVsbGluZyBjaGFuZ2VzIGNvbnRpbnVvdXNseSlcbiAgLy8gcmV0dXJuIGEgbG9uZ3BvbGwgVVJMIG9yIG5vdC4gSWYgaXQgaXMgYSBiZWdpbm5pbmcgYm9vdHN0cmFwIHJlcXVlc3QsIGRvXG4gIC8vIG5vdCByZXR1cm4gYSBsb25ncG9sbCBVUkwsIGFzIHdlIHdhbnQgaXQgdG8gZmluaXNoIHJpZ2h0IGF3YXksIGV2ZW4gaWYgdGhlcmVcbiAgLy8gYXJlIG5vIGNoYW5nZXMgb24gcmVtb3RlLlxuICAvL1xuICBmdW5jdGlvbiBwdWxsVXJsKCkge1xuICAgIHZhciBzaW5jZTtcbiAgICBzaW5jZSA9IHJlbW90ZS5nZXRTaW5jZU5yKCk7XG4gICAgaWYgKHJlbW90ZS5pc0Nvbm5lY3RlZCgpICYmICFpc0Jvb3RzdHJhcHBpbmcpIHtcbiAgICAgIHJldHVybiAnL19jaGFuZ2VzP2luY2x1ZGVfZG9jcz10cnVlJnNpbmNlPScgKyBzaW5jZSArICcmaGVhcnRiZWF0PTEwMDAwJmZlZWQ9bG9uZ3BvbGwnO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJy9fY2hhbmdlcz9pbmNsdWRlX2RvY3M9dHJ1ZSZzaW5jZT0nICsgc2luY2U7XG4gICAgfVxuICB9XG5cblxuICAvLyAjIyMgcmVzdGFydCBwdWxsIHJlcXVlc3RcblxuICAvLyByZXF1ZXN0IGdldHMgcmVzdGFydGVkIGF1dG9tYXRpY2NhbGx5XG4gIC8vIHdoZW4gYWJvcnRlZCAoc2VlIGhhbmRsZVB1bGxFcnJvcilcbiAgZnVuY3Rpb24gcmVzdGFydFB1bGxSZXF1ZXN0KCkge1xuICAgIGlmIChwdWxsUmVxdWVzdCkge1xuICAgICAgcHVsbFJlcXVlc3QuYWJvcnQoKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vICMjIyBwdWxsIHN1Y2Nlc3MgaGFuZGxlclxuXG4gIC8vIHJlcXVlc3QgZ2V0cyByZXN0YXJ0ZWQgYXV0b21hdGljY2FsbHlcbiAgLy8gd2hlbiBhYm9ydGVkIChzZWUgaGFuZGxlUHVsbEVycm9yKVxuICAvL1xuICBmdW5jdGlvbiBoYW5kbGVQdWxsU3VjY2VzcyhyZXNwb25zZSkge1xuICAgIHNldFNpbmNlTnIocmVzcG9uc2UubGFzdF9zZXEpO1xuICAgIGhhbmRsZVB1bGxSZXN1bHRzKHJlc3BvbnNlLnJlc3VsdHMpO1xuICAgIGlmIChyZW1vdGUuaXNDb25uZWN0ZWQoKSkge1xuICAgICAgcmV0dXJuIHJlbW90ZS5wdWxsKCk7XG4gICAgfVxuICB9XG5cblxuICAvLyAjIyMgcHVsbCBlcnJvciBoYW5kbGVyXG5cbiAgLy8gd2hlbiB0aGVyZSBpcyBhIGNoYW5nZSwgdHJpZ2dlciBldmVudCxcbiAgLy8gdGhlbiBjaGVjayBmb3IgYW5vdGhlciBjaGFuZ2VcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlUHVsbEVycm9yKHhociwgZXJyb3IpIHtcbiAgICBpZiAoIXJlbW90ZS5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3dpdGNoICh4aHIuc3RhdHVzKSB7XG4gICAgICAvLyBTZXNzaW9uIGlzIGludmFsaWQuIFVzZXIgaXMgc3RpbGwgbG9naW4sIGJ1dCBuZWVkcyB0byByZWF1dGhlbnRpY2F0ZVxuICAgICAgLy8gYmVmb3JlIHN5bmMgY2FuIGJlIGNvbnRpbnVlZFxuICAgIGNhc2UgNDAxOlxuICAgICAgcmVtb3RlLnRyaWdnZXIoJ2Vycm9yOnVuYXV0aGVudGljYXRlZCcsIGVycm9yKTtcbiAgICAgIHJldHVybiByZW1vdGUuZGlzY29ubmVjdCgpO1xuXG4gICAgICAvLyB0aGUgNDA0IGNvbWVzLCB3aGVuIHRoZSByZXF1ZXN0ZWQgREIgaGFzIGJlZW4gcmVtb3ZlZFxuICAgICAgLy8gb3IgZG9lcyBub3QgZXhpc3QgeWV0LlxuICAgICAgLy9cbiAgICAgIC8vIEJVVDogaXQgbWlnaHQgYWxzbyBoYXBwZW4gdGhhdCB0aGUgYmFja2dyb3VuZCB3b3JrZXJzIGRpZFxuICAgICAgLy8gICAgICBub3QgY3JlYXRlIGEgcGVuZGluZyBkYXRhYmFzZSB5ZXQuIFRoZXJlZm9yZSxcbiAgICAgIC8vICAgICAgd2UgdHJ5IGl0IGFnYWluIGluIDMgc2Vjb25kc1xuICAgICAgLy9cbiAgICAgIC8vIFRPRE86IHJldmlldyAvIHJldGhpbmsgdGhhdC5cbiAgICAgIC8vXG4gICAgY2FzZSA0MDQ6XG4gICAgICByZXR1cm4gZ2xvYmFsLnNldFRpbWVvdXQocmVtb3RlLnB1bGwsIDMwMDApO1xuXG4gICAgY2FzZSA1MDA6XG4gICAgICAvL1xuICAgICAgLy8gUGxlYXNlIHNlcnZlciwgZG9uJ3QgZ2l2ZSB1cyB0aGVzZS4gQXQgbGVhc3Qgbm90IHBlcnNpc3RlbnRseVxuICAgICAgLy9cbiAgICAgIHJlbW90ZS50cmlnZ2VyKCdlcnJvcjpzZXJ2ZXInLCBlcnJvcik7XG4gICAgICBnbG9iYWwuc2V0VGltZW91dChyZW1vdGUucHVsbCwgMzAwMCk7XG4gICAgICByZXR1cm4gaG9vZGllLmNoZWNrQ29ubmVjdGlvbigpO1xuICAgIGRlZmF1bHQ6XG4gICAgICAvLyB1c3VhbGx5IGEgMCwgd2hpY2ggc3RhbmRzIGZvciB0aW1lb3V0IG9yIHNlcnZlciBub3QgcmVhY2hhYmxlLlxuICAgICAgaWYgKHhoci5zdGF0dXNUZXh0ID09PSAnYWJvcnQnKSB7XG4gICAgICAgIC8vIG1hbnVhbCBhYm9ydCBhZnRlciAyNXNlYy4gcmVzdGFydCBwdWxsaW5nIGNoYW5nZXMgZGlyZWN0bHkgd2hlbiBjb25uZWN0ZWRcbiAgICAgICAgcmV0dXJuIHJlbW90ZS5wdWxsKCk7XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIG9vcHMuIFRoaXMgbWlnaHQgYmUgY2F1c2VkIGJ5IGFuIHVucmVhY2hhYmxlIHNlcnZlci5cbiAgICAgICAgLy8gT3IgdGhlIHNlcnZlciBjYW5jZWxsZWQgaXQgZm9yIHdoYXQgZXZlciByZWFzb24sIGUuZy5cbiAgICAgICAgLy8gaGVyb2t1IGtpbGxzIHRoZSByZXF1ZXN0IGFmdGVyIH4zMHMuXG4gICAgICAgIC8vIHdlJ2xsIHRyeSBhZ2FpbiBhZnRlciBhIDNzIHRpbWVvdXRcbiAgICAgICAgLy9cbiAgICAgICAgZ2xvYmFsLnNldFRpbWVvdXQocmVtb3RlLnB1bGwsIDMwMDApO1xuICAgICAgICByZXR1cm4gaG9vZGllLmNoZWNrQ29ubmVjdGlvbigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgLy8gIyMjIGhhbmRsZSBpbml0aWFsIGJvb3RzdHJhcHBpbmcgZnJvbSByZW1vdGVcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQm9vdHN0cmFwU3VjY2VzcygpIHtcbiAgICBpc0Jvb3RzdHJhcHBpbmcgPSBmYWxzZTtcbiAgICByZW1vdGUudHJpZ2dlcignYm9vdHN0cmFwOmVuZCcpO1xuICB9XG5cbiAgLy8gIyMjIGhhbmRsZSBlcnJvciBvZiBpbml0aWFsIGJvb3RzdHJhcHBpbmcgZnJvbSByZW1vdGVcbiAgLy9cbiAgZnVuY3Rpb24gaGFuZGxlQm9vdHN0cmFwRXJyb3IoZXJyb3IpIHtcbiAgICBpc0Jvb3RzdHJhcHBpbmcgPSBmYWxzZTtcbiAgICByZW1vdGUudHJpZ2dlcignYm9vdHN0cmFwOmVycm9yJywgZXJyb3IpO1xuICB9XG5cbiAgLy8gIyMjIGhhbmRsZSBjaGFuZ2VzIGZyb20gcmVtb3RlXG4gIC8vXG4gIGZ1bmN0aW9uIGhhbmRsZVB1bGxSZXN1bHRzKGNoYW5nZXMpIHtcbiAgICB2YXIgZG9jLCBldmVudCwgb2JqZWN0LCBfaSwgX2xlbjtcblxuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gY2hhbmdlcy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgZG9jID0gY2hhbmdlc1tfaV0uZG9jO1xuXG4gICAgICBpZiAocmVtb3RlLnByZWZpeCAmJiBkb2MuX2lkLmluZGV4T2YocmVtb3RlLnByZWZpeCkgIT09IDApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIG9iamVjdCA9IHBhcnNlRnJvbVJlbW90ZShkb2MpO1xuXG4gICAgICBpZiAob2JqZWN0Ll9kZWxldGVkKSB7XG4gICAgICAgIGlmICghcmVtb3RlLmlzS25vd25PYmplY3Qob2JqZWN0KSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50ID0gJ3JlbW92ZSc7XG4gICAgICAgIHJlbW90ZS5pc0tub3duT2JqZWN0KG9iamVjdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocmVtb3RlLmlzS25vd25PYmplY3Qob2JqZWN0KSkge1xuICAgICAgICAgIGV2ZW50ID0gJ3VwZGF0ZSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXZlbnQgPSAnYWRkJztcbiAgICAgICAgICByZW1vdGUubWFya0FzS25vd25PYmplY3Qob2JqZWN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZW1vdGUudHJpZ2dlcihldmVudCwgb2JqZWN0KTtcbiAgICAgIHJlbW90ZS50cmlnZ2VyKGV2ZW50ICsgJzonICsgb2JqZWN0LnR5cGUsIG9iamVjdCk7XG4gICAgICByZW1vdGUudHJpZ2dlcihldmVudCArICc6JyArIG9iamVjdC50eXBlICsgJzonICsgb2JqZWN0LmlkLCBvYmplY3QpO1xuICAgICAgcmVtb3RlLnRyaWdnZXIoJ2NoYW5nZScsIGV2ZW50LCBvYmplY3QpO1xuICAgICAgcmVtb3RlLnRyaWdnZXIoJ2NoYW5nZTonICsgb2JqZWN0LnR5cGUsIGV2ZW50LCBvYmplY3QpO1xuICAgICAgcmVtb3RlLnRyaWdnZXIoJ2NoYW5nZTonICsgb2JqZWN0LnR5cGUgKyAnOicgKyBvYmplY3QuaWQsIGV2ZW50LCBvYmplY3QpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gYm9vdHN0cmFwIGtub3duIG9iamVjdHNcbiAgLy9cbiAgaWYgKG9wdGlvbnMua25vd25PYmplY3RzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLmtub3duT2JqZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVtb3RlLm1hcmtBc0tub3duT2JqZWN0KHtcbiAgICAgICAgdHlwZTogb3B0aW9ucy5rbm93bk9iamVjdHNbaV0udHlwZSxcbiAgICAgICAgaWQ6IG9wdGlvbnMua25vd25PYmplY3RzW2ldLmlkXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuXG4gIC8vIGV4cG9zZSBwdWJsaWMgQVBJXG4gIHJldHVybiByZW1vdGU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaG9vZGllUmVtb3RlU3RvcmU7XG4iLCIvLyBzY29wZWQgU3RvcmVcbi8vID09PT09PT09PT09PVxuXG4vLyBzYW1lIGFzIHN0b3JlLCBidXQgd2l0aCB0eXBlIHByZXNldCB0byBhbiBpbml0aWFsbHlcbi8vIHBhc3NlZCB2YWx1ZS5cbi8vXG52YXIgaG9vZGllRXZlbnRzID0gcmVxdWlyZSgnLi4vZXZlbnRzJyk7XG5cbi8vXG5mdW5jdGlvbiBob29kaWVTY29wZWRTdG9yZUFwaShob29kaWUsIHN0b3JlQXBpLCBvcHRpb25zKSB7XG5cbiAgLy8gbmFtZVxuICB2YXIgc3RvcmVOYW1lID0gb3B0aW9ucy5uYW1lIHx8ICdzdG9yZSc7XG4gIHZhciB0eXBlID0gb3B0aW9ucy50eXBlO1xuICB2YXIgaWQgPSBvcHRpb25zLmlkO1xuXG4gIHZhciBhcGkgPSB7fTtcblxuICAvLyBzY29wZWQgYnkgdHlwZSBvbmx5XG4gIGlmICghaWQpIHtcblxuICAgIC8vIGFkZCBldmVudHNcbiAgICBob29kaWVFdmVudHMoaG9vZGllLCB7XG4gICAgICBjb250ZXh0OiBhcGksXG4gICAgICBuYW1lc3BhY2U6IHN0b3JlTmFtZSArICc6JyArIHR5cGVcbiAgICB9KTtcblxuICAgIC8vXG4gICAgYXBpLnNhdmUgPSBmdW5jdGlvbiBzYXZlKGlkLCBwcm9wZXJ0aWVzLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkuc2F2ZSh0eXBlLCBpZCwgcHJvcGVydGllcywgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLmFkZCA9IGZ1bmN0aW9uIGFkZChwcm9wZXJ0aWVzLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkuYWRkKHR5cGUsIHByb3BlcnRpZXMsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5maW5kID0gZnVuY3Rpb24gZmluZChpZCkge1xuICAgICAgcmV0dXJuIHN0b3JlQXBpLmZpbmQodHlwZSwgaWQpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5maW5kT3JBZGQgPSBmdW5jdGlvbiBmaW5kT3JBZGQoaWQsIHByb3BlcnRpZXMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS5maW5kT3JBZGQodHlwZSwgaWQsIHByb3BlcnRpZXMpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5maW5kQWxsID0gZnVuY3Rpb24gZmluZEFsbChvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkuZmluZEFsbCh0eXBlLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKGlkLCBvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS51cGRhdGUodHlwZSwgaWQsIG9iamVjdFVwZGF0ZSwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnVwZGF0ZUFsbCA9IGZ1bmN0aW9uIHVwZGF0ZUFsbChvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS51cGRhdGVBbGwodHlwZSwgb2JqZWN0VXBkYXRlLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKGlkLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkucmVtb3ZlKHR5cGUsIGlkLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkucmVtb3ZlQWxsID0gZnVuY3Rpb24gcmVtb3ZlQWxsKG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS5yZW1vdmVBbGwodHlwZSwgb3B0aW9ucyk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHNjb3BlZCBieSBib3RoOiB0eXBlICYgaWRcbiAgaWYgKGlkKSB7XG5cbiAgICAvLyBhZGQgZXZlbnRzXG4gICAgaG9vZGllRXZlbnRzKGhvb2RpZSwge1xuICAgICAgY29udGV4dDogYXBpLFxuICAgICAgbmFtZXNwYWNlOiBzdG9yZU5hbWUgKyAnOicgKyB0eXBlICsgJzonICsgaWRcbiAgICB9KTtcblxuICAgIC8vXG4gICAgYXBpLnNhdmUgPSBmdW5jdGlvbiBzYXZlKHByb3BlcnRpZXMsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS5zYXZlKHR5cGUsIGlkLCBwcm9wZXJ0aWVzLCBvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkuZmluZCA9IGZ1bmN0aW9uIGZpbmQoKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkuZmluZCh0eXBlLCBpZCk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZShvYmplY3RVcGRhdGUsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBzdG9yZUFwaS51cGRhdGUodHlwZSwgaWQsIG9iamVjdFVwZGF0ZSwgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZShvcHRpb25zKSB7XG4gICAgICByZXR1cm4gc3RvcmVBcGkucmVtb3ZlKHR5cGUsIGlkLCBvcHRpb25zKTtcbiAgICB9O1xuICB9XG5cbiAgLy9cbiAgYXBpLmRlY29yYXRlUHJvbWlzZXMgPSBzdG9yZUFwaS5kZWNvcmF0ZVByb21pc2VzO1xuICBhcGkudmFsaWRhdGUgPSBzdG9yZUFwaS52YWxpZGF0ZTtcblxuICByZXR1cm4gYXBpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2RpZVNjb3BlZFN0b3JlQXBpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIHNjb3BlZDogcmVxdWlyZSgnLi9zY29wZWQnKVxufTtcbiIsIi8vIHNjb3BlZCBTdG9yZVxuLy8gPT09PT09PT09PT09XG5cbi8vIHNhbWUgYXMgc3RvcmUsIGJ1dCB3aXRoIHR5cGUgcHJlc2V0IHRvIGFuIGluaXRpYWxseVxuLy8gcGFzc2VkIHZhbHVlLlxuLy9cbnZhciBob29kaWVFdmVudHMgPSByZXF1aXJlKCcuLi9ldmVudHMnKTtcblxuLy9cbmZ1bmN0aW9uIGhvb2RpZVNjb3BlZFRhc2soaG9vZGllLCB0YXNrQXBpLCBvcHRpb25zKSB7XG5cbiAgdmFyIHR5cGUgPSBvcHRpb25zLnR5cGU7XG4gIHZhciBpZCA9IG9wdGlvbnMuaWQ7XG5cbiAgdmFyIGFwaSA9IHt9O1xuXG4gIC8vIHNjb3BlZCBieSB0eXBlIG9ubHlcbiAgaWYgKCFpZCkge1xuXG4gICAgLy8gYWRkIGV2ZW50c1xuICAgIGhvb2RpZUV2ZW50cyhob29kaWUsIHtcbiAgICAgIGNvbnRleHQ6IGFwaSxcbiAgICAgIG5hbWVzcGFjZTogJ3Rhc2s6JyArIHR5cGVcbiAgICB9KTtcblxuICAgIC8vXG4gICAgYXBpLnN0YXJ0ID0gZnVuY3Rpb24gc3RhcnQocHJvcGVydGllcykge1xuICAgICAgcmV0dXJuIHRhc2tBcGkuc3RhcnQodHlwZSwgcHJvcGVydGllcyk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLmFib3J0ID0gZnVuY3Rpb24gYWJvcnQoaWQpIHtcbiAgICAgIHJldHVybiB0YXNrQXBpLmFib3J0KHR5cGUsIGlkKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkucmVzdGFydCA9IGZ1bmN0aW9uIHJlc3RhcnQoaWQsIHVwZGF0ZSkge1xuICAgICAgcmV0dXJuIHRhc2tBcGkucmVzdGFydCh0eXBlLCBpZCwgdXBkYXRlKTtcbiAgICB9O1xuXG4gICAgLy9cbiAgICBhcGkuYWJvcnRBbGwgPSBmdW5jdGlvbiBhYm9ydEFsbCgpIHtcbiAgICAgIHJldHVybiB0YXNrQXBpLmFib3J0QWxsKHR5cGUpO1xuICAgIH07XG5cbiAgICAvL1xuICAgIGFwaS5yZXN0YXJ0QWxsID0gZnVuY3Rpb24gcmVzdGFydEFsbCh1cGRhdGUpIHtcbiAgICAgIHJldHVybiB0YXNrQXBpLnJlc3RhcnRBbGwodHlwZSwgdXBkYXRlKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gc2NvcGVkIGJ5IGJvdGg6IHR5cGUgJiBpZFxuICBpZiAoaWQpIHtcblxuICAgIC8vIGFkZCBldmVudHNcbiAgICBob29kaWVFdmVudHMoaG9vZGllLCB7XG4gICAgICBjb250ZXh0OiBhcGksXG4gICAgICBuYW1lc3BhY2U6ICd0YXNrOicgKyB0eXBlICsgJzonICsgaWRcbiAgICB9KTtcblxuICAgIC8vXG4gICAgYXBpLmFib3J0ID0gZnVuY3Rpb24gYWJvcnQoKSB7XG4gICAgICByZXR1cm4gdGFza0FwaS5hYm9ydCh0eXBlLCBpZCk7XG4gICAgfTtcblxuICAgIC8vXG4gICAgYXBpLnJlc3RhcnQgPSBmdW5jdGlvbiByZXN0YXJ0KHVwZGF0ZSkge1xuICAgICAgcmV0dXJuIHRhc2tBcGkucmVzdGFydCh0eXBlLCBpZCwgdXBkYXRlKTtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGFwaTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVTY29wZWRUYXNrO1xuIiwidmFyIGNoYXJzLCBpLCByYWRpeDtcblxuLy8gdXVpZHMgY29uc2lzdCBvZiBudW1iZXJzIGFuZCBsb3dlcmNhc2UgbGV0dGVycyBvbmx5LlxuLy8gV2Ugc3RpY2sgdG8gbG93ZXJjYXNlIGxldHRlcnMgdG8gcHJldmVudCBjb25mdXNpb25cbi8vIGFuZCB0byBwcmV2ZW50IGlzc3VlcyB3aXRoIENvdWNoREIsIGUuZy4gZGF0YWJhc2Vcbi8vIG5hbWVzIGRvIHdvbmx5IGFsbG93IGZvciBsb3dlcmNhc2UgbGV0dGVycy5cbmNoYXJzID0gJzAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eicuc3BsaXQoJycpO1xucmFkaXggPSBjaGFycy5sZW5ndGg7XG5cbi8vIGhlbHBlciB0byBnZW5lcmF0ZSB1bmlxdWUgaWRzLlxuZnVuY3Rpb24gZ2VuZXJhdGVJZCAobGVuZ3RoKSB7XG4gIHZhciBpZCA9ICcnO1xuXG4gIC8vIGRlZmF1bHQgdXVpZCBsZW5ndGggdG8gN1xuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSA3O1xuICB9XG5cbiAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHJhbmQgPSBNYXRoLnJhbmRvbSgpICogcmFkaXg7XG4gICAgdmFyIGNoYXIgPSBjaGFyc1tNYXRoLmZsb29yKHJhbmQpXTtcbiAgICBpZCArPSBTdHJpbmcoY2hhcikuY2hhckF0KDApO1xuICB9XG5cbiAgcmV0dXJuIGlkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVyYXRlSWQ7XG4iLCJ2YXIgZmluZExldHRlcnNUb1VwcGVyQ2FzZSA9IC8oXlxcd3xfXFx3KS9nO1xuXG5mdW5jdGlvbiBob29kaWVmeVJlcXVlc3RFcnJvck5hbWUgKG5hbWUpIHtcbiAgbmFtZSA9IG5hbWUucmVwbGFjZShmaW5kTGV0dGVyc1RvVXBwZXJDYXNlLCBmdW5jdGlvbiAobWF0Y2gpIHtcbiAgICByZXR1cm4gKG1hdGNoWzFdIHx8IG1hdGNoWzBdKS50b1VwcGVyQ2FzZSgpO1xuICB9KTtcblxuICByZXR1cm4gJ0hvb2RpZScgKyBuYW1lICsgJ0Vycm9yJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBob29kaWVmeVJlcXVlc3RFcnJvck5hbWU7IiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdlbmVyYXRlSWQ6IHJlcXVpcmUoJy4vZ2VuZXJhdGVfaWQnKSxcbiAgcHJvbWlzZTogcmVxdWlyZSgnLi9wcm9taXNlJyksXG4gIGxvY2FsU3RvcmFnZVdyYXBwZXI6IHJlcXVpcmUoJy4vbG9jYWxTdG9yYWdlV3JhcHBlcicpXG59O1xuXG4iLCJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTt2YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG5cbi8vIElzIHBlcnNpc3RhbnQ/XG4vLyAtLS0tLS0tLS0tLS0tLS0tXG4vL1xuXG5leHBvcnRzLnBhdGNoSWZOb3RQZXJzaXN0YW50ID0gZnVuY3Rpb24gKCkge1xuXG4gIGlmICghZXhwb3J0cy5pc1BlcnNpc3RlbnQoKSkge1xuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgZ2V0SXRlbTogZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9LFxuICAgICAgc2V0SXRlbTogZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9LFxuICAgICAgcmVtb3ZlSXRlbTogZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9LFxuICAgICAga2V5OiBmdW5jdGlvbigpIHsgcmV0dXJuIG51bGw7IH0sXG4gICAgICBsZW5ndGg6IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfVxuICAgIH07XG4gIH1cblxufTtcblxuLy8gcmV0dXJucyBgdHJ1ZWAgb3IgYGZhbHNlYCBkZXBlbmRpbmcgb24gd2hldGhlciBsb2NhbFN0b3JhZ2UgaXMgc3VwcG9ydGVkIG9yIG5vdC5cbi8vIEJld2FyZSB0aGF0IHNvbWUgYnJvd3NlcnMgbGlrZSBTYWZhcmkgZG8gbm90IHN1cHBvcnQgbG9jYWxTdG9yYWdlIGluIHByaXZhdGUgbW9kZS5cbi8vXG4vLyBpbnNwaXJlZCBieSB0aGlzIGNhcHB1Y2Npbm8gY29tbWl0XG4vLyBodHRwczovL2dpdGh1Yi5jb20vY2FwcHVjY2luby9jYXBwdWNjaW5vL2NvbW1pdC8wNjNiMDVkOTY0M2MzNWIzMDM1NjhhMjg4MDllNGViMzIyNGY3MWVjXG4vL1xuXG5leHBvcnRzLmlzUGVyc2lzdGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcblxuICAgIC8vIHdlJ3ZlIHRvIHB1dCB0aGlzIGluIGhlcmUuIEkndmUgc2VlbiBGaXJlZm94IHRocm93aW5nIGBTZWN1cml0eSBlcnJvcjogMTAwMGBcbiAgICAvLyB3aGVuIGNvb2tpZXMgaGF2ZSBiZWVuIGRpc2FibGVkXG4gICAgaWYgKCFnbG9iYWwubG9jYWxTdG9yYWdlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSnVzdCBiZWNhdXNlIGxvY2FsU3RvcmFnZSBleGlzdHMgZG9lcyBub3QgbWVhbiBpdCB3b3Jrcy4gSW4gcGFydGljdWxhciBpdCBtaWdodCBiZSBkaXNhYmxlZFxuICAgIC8vIGFzIGl0IGlzIHdoZW4gU2FmYXJpJ3MgcHJpdmF0ZSBicm93c2luZyBtb2RlIGlzIGFjdGl2ZS5cbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnU3RvcmFnZS1UZXN0JywgJzEnKTtcblxuICAgIC8vIHRoYXQgc2hvdWxkIG5vdCBoYXBwZW4gLi4uXG4gICAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdTdG9yYWdlLVRlc3QnKSAhPT0gJzEnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gb2theSwgbGV0J3MgY2xlYW4gdXAgaWYgd2UgZ290IGhlcmUuXG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ1N0b3JhZ2UtVGVzdCcpO1xuICB9IGNhdGNoIChfZXJyb3IpIHtcblxuICAgIC8vIGluIGNhc2Ugb2YgYW4gZXJyb3IsIGxpa2UgU2FmYXJpJ3MgUHJpdmF0ZSBNb2RlLCByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyB3ZSdyZSBnb29kLlxuICByZXR1cm4gdHJ1ZTtcblxufTtcblxuZXhwb3J0cy5zZXRJdGVtID0gZnVuY3Rpb24gKG5hbWUsIGl0ZW0pIHtcblxuICBpZiAodHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgZ2xvYmFsLmxvY2FsU3RvcmFnZS5zZXRJdGVtKG5hbWUsIHdpbmRvdy5KU09OLnN0cmluZ2lmeShpdGVtKSk7XG4gIH0gZWxzZSB7XG4gICAgZ2xvYmFsLmxvY2FsU3RvcmFnZS5zZXRJdGVtKG5hbWUsIGl0ZW0pO1xuICB9XG5cbn07XG5cbmV4cG9ydHMuZ2V0SXRlbSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIHZhciBpdGVtID0gZ2xvYmFsLmxvY2FsU3RvcmFnZS5nZXRJdGVtKG5hbWUpO1xuXG4gIGlmICh0eXBlb2YgaXRlbSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0cnkge1xuICAgICAgaXRlbSA9IGdsb2JhbC5KU09OLnBhcnNlKGl0ZW0pO1xuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH1cblxuICByZXR1cm4gaXRlbTtcbn07XG5cbmV4cG9ydHMucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIHJldHVybiBnbG9iYWwubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0obmFtZSk7XG59O1xuXG5leHBvcnRzLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZ2xvYmFsLmxvY2FsU3RvcmFnZS5jbGVhcigpO1xufTtcblxuZXhwb3J0cy5rZXkgPSBmdW5jdGlvbiAobnIpIHtcbiAgcmV0dXJuIGdsb2JhbC5sb2NhbFN0b3JhZ2Uua2V5KG5yKTtcbn07XG5cbmV4cG9ydHMubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZ2xvYmFsLmxvY2FsU3RvcmFnZS5sZW5ndGg7XG59O1xuXG4vLyBtb3JlIGFkdmFuY2VkIGxvY2FsU3RvcmFnZSB3cmFwcGVycyB0byBmaW5kL3NhdmUgb2JqZWN0c1xuZXhwb3J0cy5zZXRPYmplY3QgPSBmdW5jdGlvbiAoa2V5LCBvYmplY3QpIHtcbiAgdmFyIHN0b3JlID0gZXh0ZW5kKHt9LCBvYmplY3QpO1xuXG4gIGRlbGV0ZSBzdG9yZS50eXBlO1xuICBkZWxldGUgc3RvcmUuaWQ7XG4gIHJldHVybiBleHBvcnRzLnNldEl0ZW0oa2V5LCBnbG9iYWwuSlNPTi5zdHJpbmdpZnkoc3RvcmUpKTtcbn07XG5cbmV4cG9ydHMuZ2V0T2JqZWN0ID0gZnVuY3Rpb24gKGtleSkge1xuICByZXR1cm4gZXhwb3J0cy5nZXRJdGVtKGtleSkgPyBleHBvcnRzLmdldEl0ZW0oa2V5KSA6IGZhbHNlO1xufTtcblxuIiwidmFyIGdsb2JhbD10eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge307bW9kdWxlLmV4cG9ydHMgPSBnbG9iYWwualF1ZXJ5LkRlZmVycmVkOyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZlcjogcmVxdWlyZSgnLi9kZWZlcicpLFxuICBpc1Byb21pc2U6IHJlcXVpcmUoJy4vaXNfcHJvbWlzZScpLFxuICByZWplY3RXaXRoOiByZXF1aXJlKCcuL3JlamVjdF93aXRoJyksXG4gIHJlamVjdDogcmVxdWlyZSgnLi9yZWplY3QnKSxcbiAgcmVzb2x2ZVdpdGg6IHJlcXVpcmUoJy4vcmVzb2x2ZV93aXRoJyksXG4gIHJlc29sdmU6IHJlcXVpcmUoJy4vcmVzb2x2ZScpLFxufTtcbiIsIi8vIHJldHVybnMgdHJ1ZSBpZiBwYXNzZWQgb2JqZWN0IGlzIGEgcHJvbWlzZSAoYnV0IG5vdCBhIGRlZmVycmVkKSxcbi8vIG90aGVyd2lzZSBmYWxzZS5cbmZ1bmN0aW9uIGlzUHJvbWlzZShvYmplY3QpIHtcbiAgcmV0dXJuICEhIChvYmplY3QgJiZcbiAgICAgICAgICAgICB0eXBlb2Ygb2JqZWN0LmRvbmUgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgICAgICB0eXBlb2Ygb2JqZWN0LnJlc29sdmUgIT09ICdmdW5jdGlvbicpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzUHJvbWlzZTsiLCJ2YXIgZGVmZXIgPSByZXF1aXJlKCcuL2RlZmVyJyk7XG4vL1xuZnVuY3Rpb24gcmVqZWN0KCkge1xuICByZXR1cm4gZGVmZXIoKS5yZWplY3QoKS5wcm9taXNlKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVqZWN0OyIsInZhciBnZXREZWZlciA9IHJlcXVpcmUoJy4vZGVmZXInKTtcbnZhciBIb29kaWVFcnJvciA9IHJlcXVpcmUoJy4uLy4uL2xpYi9lcnJvci9lcnJvcicpO1xuXG4vL1xuZnVuY3Rpb24gcmVqZWN0V2l0aChlcnJvclByb3BlcnRpZXMpIHtcbiAgdmFyIGVycm9yID0gbmV3IEhvb2RpZUVycm9yKGVycm9yUHJvcGVydGllcyk7XG4gIHJldHVybiBnZXREZWZlcigpLnJlamVjdChlcnJvcikucHJvbWlzZSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlamVjdFdpdGg7XG4iLCJ2YXIgZGVmZXIgPSByZXF1aXJlKCcuL2RlZmVyJyk7XG4vL1xuZnVuY3Rpb24gcmVzb2x2ZSgpIHtcbiAgcmV0dXJuIGRlZmVyKCkucmVzb2x2ZSgpLnByb21pc2UoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXNvbHZlOyIsInZhciBnZXREZWZlciA9IHJlcXVpcmUoJy4vZGVmZXInKTtcblxuLy9cbmZ1bmN0aW9uIHJlc29sdmVXaXRoKCkge1xuICB2YXIgZGVmZXIgPSBnZXREZWZlcigpO1xuICByZXR1cm4gZGVmZXIucmVzb2x2ZS5hcHBseShkZWZlciwgYXJndW1lbnRzKS5wcm9taXNlKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVzb2x2ZVdpdGg7XG4iXX0=
(2)
});
;