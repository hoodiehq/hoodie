// Hoodie.Account
// ================

var extend = require('extend');

var utils = require('../../utils');
var generateId = utils.generateId;
var config = utils.config;
var promise = utils.promise;
var getDefer = promise.defer;
var reject = promise.reject;
var resolve = promise.resolve;
var rejectWith = promise.rejectWith;
var resolveWith = promise.resolveWith;

// Authenticate
// --------------

// Use this method to assure that the user is authenticated:
// `hoodie.account.authenticate().done( doSomething ).fail( handleError )`
//
exports.authenticate = function(state) {
  var requests = state.requests;
  // already tried to authenticate, and failed
  if (state.authenticated === false) {
    return reject();
  }

  // already tried to authenticate, and succeeded
  if (state.authenticated === true) {
    return resolveWith(exports.username);
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
    return state.requests.signIn;
  }

  // if user has no account, make sure to end the session
  if (!exports.hasAccount(state)) {
    return exports.sendSignOutRequest(state).then(function() {
      state.authenticated = false;
      return reject();
    });
  }

  // send request to check for session status. If there is a
  // pending request already, return its promise.
  //
  return exports.withSingleRequest(state, 'authenticate', function() {
    return exports.request('GET', '/_session')
      .then(exports.handleAuthenticateRequestSuccess.bind(state));
  });
};


// hasValidSession
// -----------------

// returns true if the user is signed in, and has a valid cookie.
//
exports.hasValidSession = function(state) {
  if (!exports.hasAccount(state)) {
    return false;
  }

  return state.authenticated === true;
};


// hasInvalidSession
// -----------------

// returns true if the user is signed in, but does not have a valid cookie
//
exports.hasInvalidSession = function(state) {
  if (!exports.hasAccount(state)) {
    return false;
  }

  return state.authenticated === false;
};


// sign up with username & password
// ----------------------------------

// uses standard CouchDB API to create a new document in _users db.
// The backend will automatically create a userDB based on the username
// address and approve the account by adding a 'confirmed' role to the
// user doc. The account confirmation might take a while, so we keep trying
// to sign in with a 300ms timeout.
//
exports.signUp = function(state, username, password) {
  if (password === undefined) {
    password = '';
  }

  if (!username) {
    return rejectWith('Username must be set.');
  }

  if (exports.hasAnonymousAccount(state)) {
    return exports.upgradeAnonymousAccount(state, username, password);
  }

  if (exports.hasAccount(state)) {
    return rejectWith('Must sign out first.');
  }

  return exports.sendSignUpRequest(state, username, password)
    .done(function() {
      exports.setUsername(state, username);
      state.events.emit('signup', username);
    });
};


// anonymous sign up
// -------------------

// If the user did not sign up yet, but data needs to be transferred
// to the couch, e.g. to send an email or to share data, the anonymousSignUp
// method can be used. It generates a random password and stores it locally
// in the browser.
//
// If the user signs up for real later, we 'upgrade' the account, meaning we
// change the username and password internally instead of creating another user.
//
exports.anonymousSignUp = function(state) {
  var password, username;

  password = generateId(10);
  username = state.hoodie.id();

  return exports.sendSignUpRequest(state, username, password)
  .progress( function() {
    exports.setAnonymousPassword(state, password);
  })
  .done(function() {
    state.events.emit('signup:anonymous');
  });
};


// hasAccount
// ---------------------

//
exports.hasAccount = function(state) {
  var hasUsername = !!account.username;
  return hasUsername || exports.hasAnonymousAccount(state);
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
exports.hasAnonymousAccount = function(state) {
  return !!exports.getAnonymousPassword(state);
};

// sign in with username & password
// ----------------------------------

// uses standard CouchDB API to create a new user session (POST /_session).
// Besides the standard sign in we also check if the account has been confirmed
// (roles include 'confirmed' role).
//
// When signing in, by default all local data gets cleared beforehand.
// Otherwise data that has been created beforehand (authenticated with another user
// account or anonymously) would be merged into the user account that signs in.
// That only applies if username isn't the same as current username.
//
// To prevent data loss, signIn can be called with options.moveData = true, that wll
// move all data from the anonymous account to the account the user signed into.
//
exports.signIn = function(state, username, password, options) {
  var isReauthenticating = (username === account.username);
  var isSilent;
  var promise;

  if (!username) { username = ''; }
  if (!password) { password = ''; }
  username = username.toLowerCase();

  options = options || {};
  isSilent = options.silent;

  if (exports.hasAccount(state) && !isReauthenticating && !options.moveData) {
    promise = exports.pushLocalChanges(state, options).then(function() {
      return exports.sendSignInRequest(state, username, password, options);
    });
  } else {
    promise = exports.sendSignInRequest(state, username, password, options);
  }

  if (!isReauthenticating) {
    promise.done(exports.disconnect.bind(null, state));
  }

  return promise.done( function(newUsername, newHoodieId) {
    if (options.moveData) {
      state.events.emit('movedata');
    }
    if (!isReauthenticating && !options.moveData) {
      exports.cleanup(state);
    }
    if (isReauthenticating) {
      if (!isSilent) {
        state.events.emit('reauthenticated', newUsername);
      }
    } else {
      exports.setUsername(state, newUsername);
    }
    if (!isSilent) {
      state.events.emit('signin', newUsername, newHoodieId, options);
    }
  });
};

// sign out
// ---------

// uses standard CouchDB API to invalidate a user session (DELETE /_session)
//
exports.signOut = function(state, options) {
  var cleanupMethod;
  options = options || {};
  cleanupMethod = options.silent ? exports.cleanup : exports.cleanupAndTriggerSignOut;

  if (!exports.hasAccount(state)) {
    return cleanupMethod(state);
  }

  if (options.moveData) {
    return exports.sendSignOutRequest(state);
  }

  return exports.pushLocalChanges(state, options)
    .then(exports.disconnect.bind(null, state))
    .then(exports.sendSignOutRequest.bind(null, state))
    .then(cleanupMethod.bind(null, state));
};


// Request
// ---

// shortcut
//
exports.request = function(state, type, path, options) {
  options = options || {};
  return state.hoodie.request.apply(state.hoodie, arguments);
};


// db
// ----

// return name of db
//
exports.db = function(state) {
  return 'user/' + state.hoodie.id();
};


// fetch
// -------

// fetches _users doc from CouchDB and caches it in _doc
//
exports.fetch = function(state, username) {
  var currentUsername = exports.hasAnonymousAccount(state) ? state.hoodie.id() : account.username;

  if (username === undefined) {
    username = currentUsername;
  }

  if (!username) {
    return rejectWith({
      name: 'HoodieUnauthorizedError',
      message: 'Not signed in'
    });
  }

  return exports.withSingleRequest(state, 'fetch', function() {
    return exports.request(state, 'GET', exports.userDocUrl(state, username)).done(function(response) {
      state.userDoc = response;
      return state.userDoc;
    });
  });
};


// change password
// -----------------

// Note: the hoodie API requires the currentPassword for security reasons,
// but couchDb doesn't require it for a password change, so it's ignored
// in this implementation of the hoodie API.
//
exports.changePassword = function(state, currentPassword, newPassword) {

  if (!account.username) {
    return rejectWith({
      name: 'HoodieUnauthorizedError',
      message: 'Not signed in'
    });
  }

  exports.disconnect(state);

  return exports.fetch(state)
    .then(exports.sendChangeUsernameAndPasswordRequest(state, currentPassword, null, newPassword))
    .done( function() {
      state.events.emit('changepassword');
    });
};


// reset password
// ----------------

// This is kind of a hack. We need to create an object anonymously
// that is not exposed to others. The only CouchDB API offering such
// functionality is the _users database.
//
// So we actually sign up a new couchDB user with some special attributes.
// It will be picked up by the password reset worker and removed
// once the password was reset.
//
exports.resetPassword = function(state, username) {
  var data, key, options, resetPasswordId;

  resetPasswordId = config.get('_account.resetPasswordId');

  if (resetPasswordId) {
    return exports.checkPasswordReset(state);
  }

  resetPasswordId = '' + username + '/' + (generateId());

  config.set('_account.resetPasswordId', resetPasswordId);

  key = '' + state.userDocPrefix + ':$passwordReset/' + resetPasswordId;

  data = {
    _id: key,
    name: '$passwordReset/' + resetPasswordId,
    type: 'user',
    roles: [],
    password: resetPasswordId,
    createdAt: exports.now(state),
    updatedAt: exports.now(state)
  };

  options = {
    data: JSON.stringify(data),
    contentType: 'application/json'
  };

  // TODO: spec that checkPasswordReset gets executed
  return exports.withPreviousRequestsAborted(state, 'resetPassword', function() {
    return exports.request(state, 'PUT', '/_users/' + (encodeURIComponent(key)), options)
      .done(exports.checkPasswordReset.bind(null, state))
      .then(exports.awaitPasswordResetResult.bind(null, state))
      .done(function() {
        state.events.emit('resetpassword');
      });
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
exports.checkPasswordReset = function(state) {
  var hash, options, resetPasswordId, url, username, couchUsername;

  // reject if there is no pending password reset request
  resetPasswordId = config.get('_account.resetPasswordId');

  if (!resetPasswordId) {
    return rejectWith('No pending password reset.');
  }

  // username is part of resetPasswordId, see account.resetPassword
  username = resetPasswordId.split('/')[0];

  // send request to check status of password reset
  couchUsername = '$passwordReset/' + resetPasswordId;
  url = '/_users/' + (encodeURIComponent(state.userDocPrefix + ':' + couchUsername));
  hash = btoa(couchUsername + ':' + resetPasswordId);

  options = {
    headers: {
      Authorization: 'Basic ' + hash
    }
  };

  return exports.withSingleRequest(state, 'passwordResetStatus', function() {
    return exports.request(state, 'GET', url, options)
      .then(exports.handlePasswordResetStatusRequestSuccess.bind(null, state), exports.handlePasswordResetStatusRequestError(state, username))
      .fail(function(error) {
        if (error.name === 'HoodiePendingError') {
          global.setTimeout(exports.checkPasswordReset.bind(null, state), 1000);
          return;
        }
        return state.events.emit('error:passwordreset', error, username);
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
exports.changeUsername = function(state, currentPassword, newUsername) {
  var currentUsername = exports.hasAnonymousAccount(state) ? state.hoodie.id() : account.username;

  if (newUsername !== currentUsername) {
    newUsername = newUsername || '';
    return exports.changeUsernameAndPassword(state, currentPassword, newUsername.toLowerCase())
    .done( function() {
      exports.setUsername(state, newUsername);
      state.events.emit('changeusername', newUsername);
    });
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
exports.destroy = function(state) {
  if (!exports.hasAccount(state)) {
    return exports.cleanupAndTriggerSignOut(state);
  }

  return exports.fetch(state)
    .then(exports.handleFetchBeforeDestroySuccess.bind(null, state), exports.handleFetchBeforeDestroyError.bind(null, state))
    .then(exports.cleanupAndTriggerSignOut.bind(null, state));
};


var ANONYMOUS_PASSWORD_KEY = '_account.anonymousPassword';
// PRIVATE
// ---------

// set / get / remove anonymous password
// ---------------------------------------

exports.setAnonymousPassword = function(state, password) {
  return config.set(ANONYMOUS_PASSWORD_KEY, password);
};

exports.getAnonymousPassword = function() {
  return config.get(ANONYMOUS_PASSWORD_KEY);
};

exports.removeAnonymousPassword = function() {
  return config.unset(ANONYMOUS_PASSWORD_KEY);
};

exports.anonymousSignIn = function(state) {
  var username = state.hoodie.id();
  var password = exports.getAnonymousPassword(state);
  return exports.signIn(username, password)
    .done(function() {
      state.events.emit('signin:anonymous', username);
    });
};


// reauthenticate: force hoodie to reauthenticate
exports.reauthenticate = function(state) {
  state.authenticated = undefined;
  return exports.authenticate();
};

// setters
exports.setUsername = function(state, newUsername) {
  if (account.username === newUsername) {
    return;
  }

  account.username = newUsername;
  return config.set('_account.username', newUsername);
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
// If the user is not signed in, we differentiate between users that
// signed in with a username / password or anonymously. For anonymous
// users, the password is stored in local store, so we don't need
// to trigger an 'unauthenticated' error, but instead try to sign in.
//
exports.handleAuthenticateRequestSuccess = function(state, response) {
  if (response.userCtx.name) {
    state.authenticated = true;
    return resolveWith(account.username);
  }

  if (exports.hasAnonymousAccount(state)) {
    return exports.anonymousSignIn(state);
  }

  state.authenticated = false;
  state.events.emit('error:unauthenticated');
  return reject();
};


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
exports.handleSignUpSuccess = function(state, username, password) {

  return function(response) {
    state.userDoc._rev = response.rev;
    return exports.delayedSignIn(username, password);
  };
};

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
exports.handleSignUpError = function(state, username) {

  return function(error) {
    if (error.name === 'HoodieConflictError') {
      error.message = 'Username ' + username + ' already exists';
    }
    return rejectWith(error);
  };
};


//
// a delayed sign in is used after sign up and after a
// username change.
//
exports.delayedSignIn = function(state, username, password, options, defer) {

  // delayedSignIn might call itself, when the user account
  // is pending. In this case it passes the original defer,
  // to keep a reference and finally resolve / reject it
  // at some point
  if (!defer) {
    defer = getDefer();
  }

  global.setTimeout(function() {
    var promise = exports.sendSignInRequest(state, username, password, options);
    promise.done(defer.resolve);
    promise.fail(function(error) {
      if (error.name === 'HoodieAccountUnconfirmedError') {

        // It might take a bit until the account has been confirmed
        exports.delayedSignIn(state, username, password, options, defer);
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
//         'ok': true,
//         'name': 'test1',
//         'roles': [
//             'mvu85hy',
//             'confirmed'
//         ]
//     }
//
// we want to turn it into 'test1', 'mvu85hy' or reject the promise
// in case an error occurred ('roles' array contains 'error' or is empty)
//
exports.handleSignInSuccess = function(state, options) {
  options = options || {};

  return function(response) {
    var newUsername;
    var newHoodieId;

    newUsername = response.name.replace(/^user(_anonymous)?\//, '');
    newHoodieId = response.roles[0];

    //
    // if an error occurred, the userDB worker stores it to the $error attribute
    // and adds the 'error' role to the users doc object. If the user has the
    // 'error' role, we need to fetch his _users doc to find out what the error
    // is, before we can reject the promise.
    //
    // TODO:
    // In that case we reject the sign in, but towards the backend we still get
    // a new session, and the old one gets removed. That leads to a state like
    // a session timeout: I'm still signed in with the old username, but not
    // authorized anymore. A better approach might be to send an extra
    // GET /_users/<user-doc-id> with HTTP basic auth to see if the user account
    // is valid and only if it is, we'd send the POST /_session request.
    //
    if (response.roles.indexOf('error') !== -1) {
      return exports.fetch(state, newUsername).then(function() {
        return rejectWith(state.userDoc.$error);
      });
    }

    //
    // When the userDB worker created the database for the user and everything
    // worked out, it adds the role 'confirmed' to the user. If the role is
    // not present yet, it might be that the worker didn't pick up the the
    // user doc yet, or there was an error. In this cases, we reject the promise
    // with an 'unconfirmed error'
    //
    if (response.roles.indexOf('confirmed') === -1) {
      return rejectWith({
        name: 'HoodieAccountUnconfirmedError',
        message: 'Account has not been confirmed yet'
      });
    }
    state.authenticated = true;

    exports.fetch(state);
    return resolveWith(newUsername, newHoodieId, options);
  };
};


//
// If the request was successful there might have occurred an
// error, which the worker stored in the special $error attribute.
// If that happens, we return a rejected promise with the error
// Otherwise reject the promise with a 'pending' error,
// as we are not waiting for a success full response, but a 401
// error, indicating that our password was changed and our
// current session has been invalidated
//
exports.handlePasswordResetStatusRequestSuccess = function(state, passwordResetObject) {
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
};


//
// If the error is a 401, it's exactly what we've been waiting for.
// In this case we resolve the promise.
//
exports.handlePasswordResetStatusRequestError = function(state, username) {
  return function(error) {
    if (error.name === 'HoodieUnauthorizedError') {
      config.unset('_account.resetPasswordId');
      state.events.emit('passwordreset', username);

      return resolve();
    } else {
      return rejectWith(error);
    }
  };
};


//
// wait until a password reset gets either completed or marked as failed
// and resolve / reject respectively
//
exports.awaitPasswordResetResult = function(state) {
  var defer = getDefer();

  state.events.once('passwordreset', defer.resolve );
  state.events.on('error:passwordreset', exports.removePasswordResetObject.bind(null, state));
  state.events.on('error:passwordreset', defer.reject );

  // clean up callbacks when either gets called
  defer.always( function() {
    state.events.removeListener('passwordreset', defer.resolve );
    state.events.removeListener('error:passwordreset', exports.removePasswordResetObject.bind(null, state));
    state.events.removeListener('error:passwordreset', defer.reject );
  });

  return defer.promise();
};

//
// when a password reset fails, remove it from /_users
//
exports.removePasswordResetObject = function(state, error) {
  var passwordResetObject = error.object;

  // get username & password for authentication
  var username = passwordResetObject.name; // $passwordReset/username/randomhash
  var password = username.substr(15); // => // username/randomhash
  var url = '/_users/' + (encodeURIComponent(state.userDocPrefix + ':' + username));
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
  exports.request(state, 'PUT', url, options);
  config.unset('_account.resetPasswordId');
};

//
// change username and password in 3 steps
//
// 1. assure we have a valid session
// 2. update _users doc with new username and new password (if provided)
// 3. if username changed, wait until current _users doc got removed
// 3. sign in with new credentials to create new session.
//
exports.changeUsernameAndPassword = function(state, currentPassword, newUsername, newPassword) {
  var currentUsername = exports.hasAnonymousAccount(state) ? state.hoodie.id() : account.username;

  return exports.sendSignInRequest(state, currentUsername, currentPassword).then(function() {
    return exports.fetch(state)
    .then(exports.sendChangeUsernameAndPasswordRequest(state, currentPassword, newUsername, newPassword));
  });
};


//
// turn an anonymous account into a real account. Internally, this is what happens:
//
// 1. rename the username from `<hoodieId>` to `username`
// 2. Set password to `password`
// 3.
//
exports.upgradeAnonymousAccount = function(state, username, password) {
  var currentPassword = exports.getAnonymousPassword(state);

  return exports.changeUsernameAndPassword(state, currentPassword, username, password)
    .done(function() {
      state.events.emit('signup', username);
      exports.removeAnonymousPassword(state);
    });
};


//
// we now can be sure that we fetched the latest _users doc, so we can update it
// without a potential conflict error.
//
exports.handleFetchBeforeDestroySuccess = function(state) {

  exports.disconnect();
  state.userDoc._deleted = true;

  return exports.withPreviousRequestsAborted(state, 'updateUsersDoc', function() {
    exports.request(state, 'PUT', exports.userDocUrl(), {
      data: JSON.stringify(state.userDoc),
      contentType: 'application/json'
    });
  });
};

//
// dependant on what kind of error we get, we want to ignore
// it or not.
// When we get a 'HoodieNotFoundError' it means that the _users doc have
// been removed already, so we don't need to do it anymore, but
// still want to finish the destroy locally, so we return a
// resolved promise
//
exports.handleFetchBeforeDestroyError = function(state, error) {
  if (error.name === 'HoodieNotFoundError') {
    return resolve();
  } else {
    return rejectWith(error);
  }
};

//
// remove everything form the current account, so a new account can be initiated.
// make sure to remove a promise.
//
exports.cleanup = function(state) {

  // allow other modules to clean up local data & caches
  state.events.emit('cleanup');
  state.authenticated = undefined;
  exports.setUsername(undefined);

  return resolve();
};

//
// make sure to remove a promise
//
exports.disconnect = function(state) {
  return state.hoodie.remote.disconnect();
};


//
exports.cleanupAndTriggerSignOut = function(state) {
  var username = account.username;
  return exports.cleanup(state).then(function() {
    return state.events.emit('signout', username);
  });
};


//
// depending on whether the user signedUp manually or has been signed up
// anonymously the prefix in the CouchDB _users doc differentiates.
// An anonymous user is characterized by its username, that equals
// its hoodie.id (see `anonymousSignUp`)
//
// We differentiate with `hasAnonymousAccount()`, because `userTypeAndId`
// is used within `signUp` method, so we need to be able to differentiate
// between anonymous and normal users before an account has been created.
//
exports.userTypeAndId = function(state, username) {
  var type;

  if (username === state.hoodie.id()) {
    type = 'user_anonymous';
  } else {
    type = 'user';
  }
  return '' + type + '/' + username;
};


//
// turn a username into a valid _users doc._id
//
exports.userDocKey = function(state, username) {
  var currentUsername = exports.hasAnonymousAccount(state) ? state.hoodie.id() : account.username;

  username = username || currentUsername;
  return '' + state.userDocPrefix + ':' + exports.userTypeAndId(username);
};

//
// get URL of my _users doc
//
exports.userDocUrl = function(state, username) {
  return '/_users/' + (encodeURIComponent(exports.userDocKey(username)));
};


//
// update my _users doc.
//
// If a new username has been passed, we set the special attribute $newUsername.
// This will let the username change worker create create a new _users doc for
// the new username and remove the current one
//
// If a new password has been passed, salt and password_sha get removed
// from _users doc and add the password in clear text. CouchDB will replace it with
// according password_sha and a new salt server side
//
exports.sendChangeUsernameAndPasswordRequest = function(state, currentPassword, newUsername, newPassword) {

  return function() {
    // prepare updated _users doc
    var data = extend({}, state.userDoc);

    if (newUsername) {
      data.$newUsername = newUsername;
    }

    data.updatedAt = exports.now(state);
    data.signedUpAt = data.signedUpAt || exports.now(state);

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

    return exports.withPreviousRequestsAborted(state, 'updateUsersDoc', function() {
      return exports.request(state, 'PUT', exports.userDocUrl(state), options)
      .then(exports.handleChangeUsernameAndPasswordResponse(newUsername, newPassword || currentPassword));
    });

  };
};


//
// depending on whether a newUsername has been passed, we can sign in right away
// or have to wait until the worker removed the old account
//
exports.handleChangeUsernameAndPasswordResponse = function(state, newUsername, newPassword) {
  var currentUsername = state.hasAnonymousAccount(state) ? state.hoodie.id() : account.username;

  return function() {
    exports.disconnect(state);

    if (newUsername) {
      // note that if username has been changed, newPassword is the current password.
      // We always change either the one, or the other.
      return exports.awaitCurrentAccountRemoved(state, currentUsername, newPassword).then( function() {

        // we do signOut explicitly although signOut is build into hoodie.signIn to
        // work around trouble in case of local changes. See
        // https://github.com/hoodiehq/hoodie.js/issues/256
        return exports.signOut(state, {silent:true, moveData: true}).then(function() {
          return exports.signIn(state, newUsername, newPassword, {moveData: true, silent: true});
        });
      });
    } else {
      return exports.signIn(state, currentUsername, newPassword, {silent: true});
    }
  };
};

//
// keep sending sign in requests until the server returns a 401
//
exports.awaitCurrentAccountRemoved = function(state, username, password, defer) {
  if (!defer) {
    defer = getDefer();
  }

  var requestOptions = {
    data: {
      name: exports.userTypeAndId(state, username),
      password: password
    }
  };

  exports.withPreviousRequestsAborted(state, 'signIn', function() {
    return exports.request(state, 'POST', '/_session', requestOptions);
  }).done(function() {
    global.setTimeout(exports.awaitCurrentAccountRemoved.bind(null, state), 300, username, password, defer);
  }).fail(function(error) {
    if (error.status === 401) {
      return defer.resolve();
    }

    defer.reject(error);
  });

  return defer.promise();
};


//
// make sure that the same request doesn't get sent twice
// by cancelling the previous one.
//
exports.withPreviousRequestsAborted = function(state, name, requestFunction) {
  if (state.requests[name] !== undefined) {
    if (typeof state.requests[name].abort === 'function') {
      state.requests[name].abort();
    }
  }
  state.requests[name] = requestFunction();
  return state.requests[name];
};


//
// if there is a pending request, return its promise instead
// of sending another request
//
exports.withSingleRequest = function(state, name, requestFunction) {

  if (state.requests[name] !== undefined) {
    if (typeof state.requests[name].state === 'function') {
      if (state.requests[name].state() === 'pending') {
        return state.requests[name];
      }
    }
  }

  state.requests[name] = requestFunction();
  return state.requests[name];
};


//
// push local changes when user signs out, unless he enforces sign out
// in any case with `{ignoreLocalChanges: true}`
//
exports.pushLocalChanges = function(state, options) {
  if (state.hoodie.store.hasLocalChanges() && !options.ignoreLocalChanges) {
    return state.hoodie.remote.push();
  }
  return resolve();
};

//
exports.sendSignOutRequest = function(state) {
  return exports.withSingleRequest(state, 'signOut', function() {
    return exports.request(state, 'DELETE', '/_session');
  });
};


//
// the sign in request that starts a CouchDB session if
// it succeeds. We separated the actual sign in request from
// the signIn method, as the latter also runs signOut internally
// to clean up local data before starting a new session. But as
// other methods like signUp or changePassword do also need to
// sign in the user (again), these need to send the sign in
// request but without a signOut beforehand, as the user remains
// the same.
//
exports.sendSignInRequest = function(state, username, password, options) {
  var requestOptions = {
    data: {
      name: exports.userTypeAndId(state, username),
      password: password
    }
  };

  return exports.withPreviousRequestsAborted(state, 'signIn', function() {
    var promise = exports.request(state, 'POST', '/_session', requestOptions);

    return promise.then(exports.handleSignInSuccess(state, options));
  });
};

//
// Creates a /_users document that will techincally allow
// to authenticate with passed username / password. But in
// Hoodie there is also an "unconfirmed" state that is the
// default state until the Hoodie Server creates the user
// database and sets a confirmed flag + user roles.
//
// sendSignUpRequest calls the progress callbacks when the
// user doc got created, but does not resolve before the
// user account got confirmed.
//
exports.sendSignUpRequest = function(state, username, password) {
  var defer = getDefer();
  var options;

  username = username.toLowerCase();
  options = {
    data: JSON.stringify({
      _id: exports.userDocKey(state, username),
      name: exports.userTypeAndId(state, username),
      type: 'user',
      roles: [],
      password: password,
      hoodieId: state.hoodie.id(),
      database: exports.db(state),
      updatedAt: exports.now(state),
      createdAt: exports.now(state),
      signedUpAt: username !== state.hoodie.id() ? exports.now(state) : void 0
    }),
    contentType: 'application/json'
  };
  exports.request(state, 'PUT', exports.userDocUrl(state, username), options)
  .done(defer.notify)
  .then(exports.handleSignUpSuccess(state, username, password), exports.handleSignUpError(state, username))
  .then(defer.resolve, defer.reject);

  return defer.promise();
};


//
exports.now = function() {
  return new Date();
};
