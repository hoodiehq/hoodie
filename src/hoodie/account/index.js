var hoodieEvents = require('../../lib/events');
var api = require('./api');

module.exports = function(hoodie) {
  var state = {
    // flag whether user is currently authenticated or not
    authenticated: null,
    hoodie: hoodie,
    // map of requestPromises. We maintain this list to avoid sending
    // the same requests several times.
    requests: {},
    // cache for CouchDB _users doc
    userDoc: {},
    // default couchDB user doc prefix
    userDocPrefix: 'org.couchdb.user'
  };

  // public API
  var account = {};
  [
    'authenticate',
    'hasValidSession',
    'hasInvalidSession',
    'signUp',
    'anonymousSignUp',
    'hasAccount',
    'hasAnonymousAccount',
    'signIn',
    'signOut',
    'request',
    'db',
    'fetch',
    'changePassword',
    'resetPassword',
    'checkPasswordReset',
    'changeUsername',
    'destroy'
  ].forEach(function(method) {
    account[method] = api[method].bind(null, state);
  });

  // add events API
  hoodieEvents(hoodie, {
    context: account,
    namespace: 'account'
  });

  hoodie.on('remote:error:unauthenticated', api.reauthenticate.bind(null, state));

  hoodie.account = account;
};
