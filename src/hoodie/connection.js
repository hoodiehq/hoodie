// hoodie.checkConnection() & hoodie.isConnected()
// =================================================

var promise = require('../utils/promise');

//
var exports = module.exports = function(hoodie) {
  // state
  var state = {
    online: true,
    checkConnectionRequest: null,
    checkConnectionTimeout: null,
    hoodie: hoodie
  };

  hoodie.checkConnection = exports.checkConnection.bind(null, state);
  hoodie.isConnected = exports.isConnected.bind(null, state);

  // check connection when browser goes online / offline
  global.addEventListener('online', checkConnectionSilently.bind(null, state), false);
  global.addEventListener('offline', checkConnectionSilently.bind(null, state), false);

  // start checking connection
  setTimeout(checkConnectionSilently.bind(null, state));
};

// Check Connection
// ------------------

// the `checkConnection` method is used, well, to check if
// the hoodie backend is reachable at `baseUrl` or not.
// Check Connection is automatically called on startup
// and then each 30 seconds. If it fails, it
//
// - sets `online = false`
// - triggers `disconnected` event
// - checks again in 3 seconds
//
// when connection can be reestablished, it
//
// - sets `online = true`
// - triggers `reconnected` event
//
exports.checkConnection = function(state) {

  if (state.checkConnectionRequest) {
    return state.checkConnectionRequest;
  }

  var path = '/?hoodieId=' + state.hoodie.id();

  global.clearTimeout(state.checkConnectionTimeout);

  state.checkConnectionRequest = state.hoodie.request('GET', path)
    .done(exports.handleConnection.bind(null, state, 30000, 'reconnected', true))
    .fail(exports.handleConnection.bind(null, state, 3000, 'disconnected', false));

  return state.checkConnectionRequest.then(function(/* response */) {
    return; // resolve with undefined. Some day we might return the hoodie-server version here.
  });
};

// isConnected
// -------------

//
exports.isConnected = function(state) {
  return state && state.online;
};

//
//
//
exports.handleConnection = function(state, interval, event, online) {
  state.checkConnectionRequest = undefined;
  state.checkConnectionTimeout = global.setTimeout(
    checkConnectionSilently.bind(null, state),
    interval
  );

  if (exports.isConnected(state) !== online) {
    state.hoodie.trigger(event);
    state.online = online;
  }

  return promise[online ? 'resolve' : 'reject']();
};

function checkConnectionSilently(state) {
  exports.checkConnection(state).catch(function() {}); // silent expected errors when checking connection
}
