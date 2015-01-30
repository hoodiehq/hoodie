var utils = require('../../utils');
var api = require('./api');
var helpers = require('./helpers');

module.exports = function(hoodie) {
  var account = {};
  // set username from config (local store)
  var _username = utils.config.get('_account.username');
  var state = {
    // flag whether user is currently authenticated or not
    authenticated: null,
    // add events API
    events: utils.events(
      hoodie,
      account,
      'account'
    ),
    hoodie: hoodie,
    // map of requestPromises. We maintain this list to avoid sending
    // the same requests several times.
    requests: {},
    // cache for CouchDB _users doc
    userDoc: {},
    // default couchDB user doc prefix
    userDocPrefix: 'org.couchdb.user',
    get username() {
      return _username;
    },
    set username(input) {
      _username = input;
      account.username = input;
    }
  };

  // public API
  Object.keys(api).forEach(function(method) {
    if (typeof api[method] === 'function') {
      account[method] = api[method].bind(null, state);
    }
  });

  hoodie.on('remote:error:unauthenticated', helpers.reauthenticate.bind(null, state));

  // cleanup config on signout
  account.on('cleanup', utils.config.clear);

  // check for pending password reset
  account.checkPasswordReset().catch(function() {
    // silent "Unhandled promise rejection" in case of error
  });

  // init username
  account.username = _username;

  // init bearer token
  account.bearerToken = utils.config.get('_account.bearerToken');

  hoodie.account = account;
};
