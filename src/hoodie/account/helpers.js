var extend = require('extend');

var utils = require('../../utils');
var config = utils.config;
var promise = utils.promise;
var getDefer = promise.defer;
var reject = promise.reject;
var rejectWith = promise.rejectWith;
var resolveWith = promise.resolveWith;
var resolve = promise.resolve;

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
  return state.hoodie.account.signIn(username, password)
    .done(function() {
      state.events.trigger('signin:anonymous', username);
    });
};


// reauthenticate: force hoodie to reauthenticate
exports.reauthenticate = function(state) {
  state.authenticated = undefined;
  return state.hoodie.account.authenticate();
};

// setters
exports.setUsername = function(state, newUsername) {
  if (state.username === newUsername) {
    return;
  }

  state.username = newUsername;
  return config.set('_account.username', newUsername);
};

exports.setBearerToken = function(state, newBearerToken) {
  if (state.hoodie.account.bearerToken === newBearerToken) {
    return;
  }

  state.hoodie.account.bearerToken = newBearerToken;
  return config.set('_account.bearerToken', newBearerToken);
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
    return resolveWith(state.username);
  }

  if (state.hoodie.account.hasAnonymousAccount()) {
    return exports.anonymousSignIn(state);
  }

  state.authenticated = false;
  state.events.trigger('error:unauthenticated');
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
    return exports.delayedSignIn(state, username, password);
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

  return defer.promise;
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
    var newBearerToken;

    newUsername = response.name.replace(/^user(_anonymous)?\//, '');
    newHoodieId = response.roles[0];
    newBearerToken = response.bearerToken;

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
      return state.hoodie.account.fetch(newUsername).then(function() {
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

    state.newHoodieId = newHoodieId;
    state.newBearerToken = newBearerToken;

    // TODO: remove setBearerToken & account.fetch here.
    //       Find a better way to get user account properties
    //       after sign in / sign up.
    exports.setBearerToken(state, newBearerToken);
    state.hoodie.account.fetch(newUsername);

    return resolveWith(newUsername);
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
      state.events.trigger('passwordreset', username);

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

  state.events.one('passwordreset', defer.resolve );
  state.events.on('error:passwordreset', exports.removePasswordResetObject.bind(null, state));
  state.events.on('error:passwordreset', defer.reject );

  // clean up callbacks when either gets called
  defer.promise.always( function() {
    state.events.removeListener('passwordreset', defer.resolve );
    state.events.removeListener('error:passwordreset', exports.removePasswordResetObject.bind(null, state));
    state.events.removeListener('error:passwordreset', defer.reject );
  });

  return defer.promise;
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
  state.hoodie.account.request('PUT', url, options);
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
  var currentUsername = state.hoodie.account.hasAnonymousAccount() ? state.hoodie.id() : state.username;

  return exports.sendSignInRequest(state, currentUsername, currentPassword).then(function() {
    return state.hoodie.account.fetch()
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
      state.events.trigger('signup', username);
      exports.removeAnonymousPassword(state);
    });
};


//
// we now can be sure that we fetched the latest _users doc, so we can update it
// without a potential conflict error.
//
exports.handleFetchBeforeDestroySuccess = function(state) {

  exports.disconnect(state);
  state.userDoc._deleted = true;

  return exports.withPreviousRequestsAborted(state, 'updateUsersDoc', function() {
    state.hoodie.account.request('PUT', exports.userDocUrl(state), {
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
  state.events.trigger('cleanup');
  state.authenticated = undefined;
  exports.setUsername(state, undefined);
  exports.setBearerToken(state, undefined);

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
  var username = state.username;
  return exports.cleanup(state).then(function() {
    return state.events.trigger('signout', username);
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
  var currentUsername = state.hoodie.account.hasAnonymousAccount() ? state.hoodie.id() : state.username;

  username = username || currentUsername;
  return '' + state.userDocPrefix + ':' + exports.userTypeAndId(state, username);
};

//
// get URL of my _users doc
//
exports.userDocUrl = function(state, username) {
  return '/_users/' + (encodeURIComponent(exports.userDocKey(state, username)));
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
      return state.hoodie.account.request('PUT', exports.userDocUrl(state), options)
      .then(exports.handleChangeUsernameAndPasswordResponse(state, newUsername, newPassword || currentPassword));
    });

  };
};


//
// depending on whether a newUsername has been passed, we can sign in right away
// or have to wait until the worker removed the old account
//
exports.handleChangeUsernameAndPasswordResponse = function(state, newUsername, newPassword) {
  var currentUsername = state.hoodie.account.hasAnonymousAccount() ? state.hoodie.id() : state.username;

  return function() {
    exports.disconnect(state);

    if (newUsername) {
      // note that if username has been changed, newPassword is the current password.
      // We always change either the one, or the other.
      return exports.awaitCurrentAccountRemoved(state, currentUsername, newPassword).then( function() {

        // we do signOut explicitly although signOut is build into hoodie.signIn to
        // work around trouble in case of local changes. See
        // https://github.com/hoodiehq/hoodie.js/issues/256
        return state.hoodie.account.signOut({silent:true, moveData: true}).then(function() {
          return state.hoodie.account.signIn(newUsername, newPassword, {moveData: true, silent: true});
        });
      });
    } else {
      return state.hoodie.account.signIn(currentUsername, newPassword, {silent: true});
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
    return state.hoodie.account.request('POST', '/_session', requestOptions);
  }).done(function() {
    global.setTimeout(exports.awaitCurrentAccountRemoved.bind(null, state), 300, username, password, defer);
  }).fail(function(error) {
    if (error.status === 401) {
      return defer.resolve();
    }

    defer.reject(error);
  });

  return defer.promise;
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

  if (state.requests[name] && state.requests[name].state === 'pending') {
    return state.requests[name];
  }

  state.requests[name] = requestFunction();
  state.requests[name].state = 'pending';
  state.requests[name].then(function() {
    state.requests[name].state = 'fullfiled';
  },function() {
    state.requests[name].state = 'rejected';
  });
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
    return state.hoodie.account.request('DELETE', '/_session');
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
    var promise = state.hoodie.account.request('POST', '/_session', requestOptions);

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
      database: state.hoodie.account.db(),
      updatedAt: exports.now(state),
      createdAt: exports.now(state),
      signedUpAt: username !== state.hoodie.id() ? exports.now(state) : void 0
    }),
    contentType: 'application/json'
  };
  state.hoodie.account.request('PUT', exports.userDocUrl(state, username), options)
  .done(defer.notify)
  .then(exports.handleSignUpSuccess(state, username, password), exports.handleSignUpError(state, username))
  .then(defer.resolve, defer.reject);

  return defer.promise;
};


//
exports.now = function() {
  return new Date();
};
