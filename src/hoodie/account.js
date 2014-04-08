// Hoodie.Account
// ================

var hoodieEvents = require('../lib/events');
var extend = require('extend');
var generateId = require('../utils/generate_id');
var config = require('../utils/config');

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
      return account.request('GET', '/_session').then(handleAuthenticateRequestSuccess);
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
    var options;


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

    options = {
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

    return account.request('PUT', userDocUrl(username), options)
    .then(handleSignUpSuccess(username, password), handleSignUpError(username));
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
    return config.set(anonymousPasswordKey, password);
  }

  function getAnonymousPassword() {
    return config.get(anonymousPasswordKey);
  }

  function removeAnonymousPassword() {
    return config.unset(anonymousPasswordKey);
  }


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
  account.signIn = function signIn(username, password, options) {
    var isNotReauthenticating = username !== account.username;

    if (! username) { username = ''; }
    if (! password) { password = ''; }
    username = username.toLowerCase();

    options = options || {};

    if (account.hasAccount() && isNotReauthenticating && !options.moveData) {
      return pushLocalChanges().then(function() {
        return sendSignInRequest(username, password, options);
      });
    }

    return sendSignInRequest(username, password, options);
  };


  // sign out
  // ---------

  // uses standard CouchDB API to invalidate a user session (DELETE /_session)
  //
  account.signOut = function signOut(options) {
    var cleanupMethod;
    options = options || {};
    cleanupMethod = options.silent ? cleanup : cleanupAndTriggerSignOut;

    if (!account.hasAccount()) {
      return cleanupMethod();
    }

    return pushLocalChanges(options).then(hoodie.remote.disconnect).then(sendSignOutRequest).then(cleanupMethod);
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

    resetPasswordId = config.get('_account.resetPasswordId');

    if (resetPasswordId) {
      return account.checkPasswordReset();
    }

    resetPasswordId = '' + username + '/' + (generateId());

    config.set('_account.resetPasswordId', resetPasswordId);

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
    resetPasswordId = config.get('_account.resetPasswordId');

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
    return config.set('_account.username', newUsername);
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
      return delayedSignIn(username, password, {moveData: true});
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
      var promise = sendSignInRequest(username, password, options);
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
      var newUsername;
      var newHoodieId;
      var oldUsername;
      var isReauthenticating;
      var currentData;

      function setNewUsernameAndTriggerEvents() {
        setUsername(newUsername);
        authenticated = true;

        //
        // options.silent is true when we need to sign in the
        // the user without signIn method being called. That's
        // currently the case for changeUsername.
        // Also don't trigger 'signin' when reauthenticating
        //
        if (!options.silent && !isReauthenticating) {
          if (account.hasAnonymousAccount()) {
            account.trigger('signin:anonymous', newUsername);
          } else {
            account.trigger('signin', newUsername, newHoodieId);
          }
        }

        // user reauthenticated, meaning
        if (isReauthenticating) {
          account.trigger('reauthenticated', newUsername);
        }

        account.fetch();
        return resolveWith(newUsername);
      }

      newUsername = response.name.replace(/^user(_anonymous)?\//, '');
      oldUsername = account.username;
      isReauthenticating = (newUsername === oldUsername);
      newHoodieId = response.roles[0];

      //
      // if an error occured, the userDB worker stores it to the $error attribute
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
        return account.fetch(newUsername).then(function() {
          return rejectWith(userDoc.$error);
        });
      }

      //
      // When the userDB worker created the database for the user and everthing
      // worked out, it adds the role 'confirmed' to the user. If the role is
      // not present yet, it might be that the worker didn't pick up the the
      // user doc yet, or there was an error. In this cases, we reject the promise
      // with an 'uncofirmed error'
      //
      if (response.roles.indexOf('confirmed') === -1) {
        return rejectWith({
          name: 'HoodieAccountUnconfirmedError',
          message: 'Account has not been confirmed yet'
        });
      }
      if (! isReauthenticating) {
        if (!options.moveData) {
          return cleanupAndDisconnect().then(setNewUsernameAndTriggerEvents);
        }

        // 
        // TODO
        // move the code below into `hoodie.store`. We should trigger something like 
        // an `account:movedata` like so
        // 
        // ```
        // account.trigger('movedata');
        // ```
        // 
        // That would set a flag in hoodie.store so that the next time store.clear
        // gets called, it would not remove all data, but only update the hoodie.id()
        // in `createdBy` of all the objects.
        // 
        return hoodie.store.findAll().then(function(data) {
          currentData = data;
        }).then(cleanupAndDisconnect).then(setNewUsernameAndTriggerEvents).done(function() {
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
      }

      return setNewUsernameAndTriggerEvents();
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
      config.unset('_account.resetPasswordId');
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
    config.unset('_account.resetPasswordId');
  }

  //
  // change username and password in 3 steps
  //
  // 1. assure we have a valid session
  // 2. update _users doc with new username and new password (if provided)
  // 3. if username changed, wait until current _users doc got removed
  // 3. sign in with new credentials to create new sesion.
  //
  function changeUsernameAndPassword(currentPassword, newUsername, newPassword) {

    return sendSignInRequest(account.username, currentPassword, {
      silent: true
    }).then(function() {
      return account.fetch().then(sendChangeUsernameAndPasswordRequest(currentPassword, newUsername, newPassword));
    });
  }


  //
  // turn an anonymous account into a real account. Internally, this is what happens:
  // 
  // 1. rename the username from `<hoodieId>` to `username`
  // 2. Set password to `password`
  // 3. 
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
  // make sure to remove a promise.
  //
  function cleanup() {

    // allow other modules to clean up local data & caches
    account.trigger('cleanup');
    authenticated = undefined;
    setUsername(undefined);

    return resolve();
  }

  // 
  // make sure to remove a promise
  // 
  function cleanupAndDisconnect() {
    hoodie.remote.disconnect();
    return cleanup();
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

          // we do signOut explicitely although signOut is build into hoodie.signIn to
          // work around trouble in case of local changes. See 
          // https://github.com/hoodiehq/hoodie.js/issues/256
          return account.signOut({silent:true, ignoreLocalChanges: true}).then(function() {
            return account.signIn(newUsername, newPassword, {moveData: true});
          });
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

      return promise.then(handleSignInSuccess(options));
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
