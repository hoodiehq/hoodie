// Hoodie.Account
// ================

var helpers = require('./helpers');

var utils = require('../../utils');
var generateId = utils.generateId;
var config = utils.config;
var promise = utils.promise;
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
    return resolveWith(state.username);
  }

  // if there is a pending signOut request, return its promise,
  // but pipe it so that it always ends up rejected
  //
  if (requests.signOut && requests.signOut.state === 'pending') {
    return requests.signOut.then(reject);
  }

  // if there is a pending signIn request, return its promise
  //
  if (requests.signIn && requests.signIn.state === 'pending') {
    return state.requests.signIn;
  }

  // if user has no account, make sure to end the session
  if (!exports.hasAccount(state)) {
    return helpers.sendSignOutRequest(state).then(function() {
      state.authenticated = false;
      return reject();
    });
  }

  // send request to check for session status. If there is a
  // pending request already, return its promise.
  //
  return helpers.withSingleRequest(state, 'authenticate', function() {
    return exports.request(state, 'GET', '/_session')
      .then(helpers.handleAuthenticateRequestSuccess.bind(null, state));
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
    return helpers.upgradeAnonymousAccount(state, username, password)
    .catch(function(error) {
      if (error.name !== 'HoodieUnauthorizedError') {
        throw error;
      }

      // if error is a 401, it means that the anonymous account has been
      // deleted in CouchDB. In that case, just sign up the normal way
      // https://github.com/hoodiehq/hoodie.js/issues/413
      helpers.removeAnonymousPassword(state);
      return helpers.sendSignUpRequest(state, username, password)
      .done(function() {
        helpers.setUsername(state, username);
        state.events.trigger('signup', username);
      });
    });
  }

  if (exports.hasAccount(state)) {
    return rejectWith('Must sign out first.');
  }

  return helpers.sendSignUpRequest(state, username, password)
    .done(function() {
      helpers.setUsername(state, username);
      state.events.trigger('signup', username);
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

  return helpers.sendSignUpRequest(state, username, password)
  .progress( function() {
    helpers.setAnonymousPassword(state, password);
  })
  .done(function() {
    state.events.trigger('signup:anonymous');
  }).then(function() {
    // resolve with null, do not pass anonymous username
    return resolve();
  });
};


// hasAccount
// ---------------------

//
exports.hasAccount = function(state) {
  var hasUsername = !!state.username;
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
  return !!helpers.getAnonymousPassword(state);
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
  var isReauthenticating = (username === state.username);
  var isSilent;
  var promise;

  if (!username) { username = ''; }
  if (!password) { password = ''; }
  username = username.toLowerCase();

  options = options || {};
  isSilent = options.silent;

  if (exports.hasAccount(state) && !isReauthenticating && !options.moveData) {
    promise = helpers.pushLocalChanges(state, options).then(function() {
      return helpers.sendSignInRequest(state, username, password, options);
    });
  } else {
    promise = helpers.sendSignInRequest(state, username, password, options);
  }

  if (!isReauthenticating) {
    promise.done(helpers.disconnect.bind(null, state));
  }

  promise.done( function(newUsername) {
    if (options.moveData) {
      state.events.trigger('movedata');
    }
    if (!isReauthenticating && !options.moveData) {
      helpers.cleanup(state);
      helpers.setBearerToken(state, state.newBearerToken);
    }
    if (isReauthenticating) {
      if (!isSilent) {
        state.events.trigger('reauthenticated', newUsername);
      }
    } else {
      helpers.setUsername(state, newUsername);

      if (!isSilent) {
        state.events.trigger('signin', newUsername, state.newHoodieId, options);
      }
    }
  });

  return promise;
};

// sign out
// ---------

// uses standard CouchDB API to invalidate a user session (DELETE /_session)
//
exports.signOut = function(state, options) {
  var cleanupMethod, promise, currentUsername;
  options = options || {};
  cleanupMethod = options.silent ? helpers.cleanup : helpers.cleanupAndTriggerSignOut;
  currentUsername = state.username;

  if (!exports.hasAccount(state)) {
    promise = cleanupMethod(state);
  } else if (options.moveData) {
    promise = helpers.sendSignOutRequest(state);
  } else {
    promise = helpers.pushLocalChanges(state, options)
      .then(helpers.disconnect.bind(null, state))
      .then(helpers.sendSignOutRequest.bind(null, state))
      .then(cleanupMethod.bind(null, state));
  }

  return promise.then(function() {
    return resolveWith(currentUsername);
  });
};


// Request
// ---

// shortcut
//
exports.request = function(state, type, url, options) {
  return state.hoodie.request.apply(state.hoodie, [
    type,
    url,
    options || {}
  ]);
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
  var currentUsername = exports.hasAnonymousAccount(state) ? state.hoodie.id() : state.username;

  if (username === undefined) {
    username = currentUsername;
  }

  if (!username) {
    return rejectWith({
      name: 'HoodieUnauthorizedError',
      message: 'Not signed in'
    });
  }

  return helpers.withSingleRequest(state, 'fetch', function() {
    return exports.request(state, 'GET', helpers.userDocUrl(state, username)).done(function(response) {
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

  if (!state.username) {
    return rejectWith({
      name: 'HoodieUnauthorizedError',
      message: 'Not signed in'
    });
  }

  helpers.disconnect(state);

  return exports.fetch(state)
    .then(function () {
      return state.hoodie.request('POST', '/_session', {
        data: {
          name: state.userDoc.name,
          password: currentPassword
        }
      });
    })
    .then(helpers.sendChangeUsernameAndPasswordRequest(state, currentPassword, null, newPassword))
    .then(function() {
      // resolve with null instead of current username
      return resolve();
    })
    .done( function() {
      state.events.trigger('changepassword');
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
    createdAt: helpers.now(state),
    updatedAt: helpers.now(state)
  };

  options = {
    data: JSON.stringify(data),
    contentType: 'application/json'
  };

  // TODO: spec that checkPasswordReset gets executed
  return helpers.withPreviousRequestsAborted(state, 'resetPassword', function() {
    return exports.request(state, 'PUT', '/_users/' + (encodeURIComponent(key)), options)
      .done(exports.checkPasswordReset.bind(null, state))
      .then(helpers.awaitPasswordResetResult.bind(null, state))
      .done(function() {
        state.events.trigger('resetpassword');
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

  return helpers.withSingleRequest(state, 'passwordResetStatus', function() {
    return exports.request(state, 'GET', url, options)
      .then(helpers.handlePasswordResetStatusRequestSuccess.bind(null, state), helpers.handlePasswordResetStatusRequestError(state, username))
      .fail(function(error) {
        if (error.name === 'HoodiePendingError') {
          global.setTimeout(exports.checkPasswordReset.bind(null, state), 1000);
          return;
        }
        return state.events.trigger('error:passwordreset', error, username);
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
  var currentUsername = exports.hasAnonymousAccount(state) ? state.hoodie.id() : state.username;

  if (newUsername !== currentUsername) {
    newUsername = newUsername || '';
    return helpers.changeUsernameAndPassword(state, currentPassword, newUsername.toLowerCase())
    .done( function() {
      helpers.setUsername(state, newUsername);
      state.events.trigger('changeusername', newUsername);
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
  var currentUsername = state.username;
  var promise;

  if (!exports.hasAccount(state)) {
    promise = helpers.cleanupAndTriggerSignOut(state);
  } else {
    promise = exports.fetch(state)
      .then(helpers.handleFetchBeforeDestroySuccess.bind(null, state), helpers.handleFetchBeforeDestroyError.bind(null, state))
      .then(helpers.cleanupAndTriggerSignOut.bind(null, state))
      .then(function() {
        return currentUsername;
      });
  }

  return promise.then(function() {
    state.events.trigger('destroy', currentUsername);
    return resolveWith(currentUsername);
  });
};
