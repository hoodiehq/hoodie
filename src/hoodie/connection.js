// hoodie.checkConnection() & hoodie.isConnected()
// =================================================


var utils = require('../utils/');

module.exports = function hoodieConnection(hoodie) {

  // state
  var online = true;
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
    var path = '/?hoodieId=' + hoodie.id();

    if (req && req.state() === 'pending') {
      return req;
    }

    global.clearTimeout(checkConnectionTimeout);

    checkConnectionRequest = hoodie.request('GET', path).then(
      exports.handleCheckConnectionSuccess,
      exports.handleCheckConnectionError
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
  exports.handleCheckConnectionSuccess = utils.toPromise(function (callback) {

    hoodie.checkConnectionInterval = 30000;

    checkConnectionTimeout = global.setTimeout(hoodie.checkConnection, hoodie.checkConnectionInterval);

    if (!hoodie.isConnected()) {
      hoodie.trigger('reconnected');
      online = true;
    }

    return callback();
  });


  //
  //
  //
  exports.handleCheckConnectionError = utils.toPromise(function (callback) {

    hoodie.checkConnectionInterval = 3000;

    checkConnectionTimeout = global.setTimeout(hoodie.checkConnection, hoodie.checkConnectionInterval);

    if (hoodie.isConnected()) {
      hoodie.trigger('disconnected');
      online = false;
    }

    return callback();
  });

};
