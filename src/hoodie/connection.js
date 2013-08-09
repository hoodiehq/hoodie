/* exported hoodieConnection */

//
// hoodie.checkConnection() & hoodie.isOnline()
// ============================================

//
function hoodieConnection(hoodie) {

  'use strict';

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
  var online = true;
  var checkConnectionInterval = 30000;
  var checkConnectionRequest = null;
  function checkConnection() {

    var req = checkConnectionRequest;

    if (req && req.state() === 'pending') {
      return req;
    }

    checkConnectionRequest = hoodie.request('GET', '/').then(
      handleCheckConnectionSuccess,
      handleCheckConnectionError
    );

    return checkConnectionRequest;
  }


  // isOnline
  // ----------

  //
  function isOnline() {
    return online;
  }


  //
  //
  //
  function handleCheckConnectionSuccess() {
    checkConnectionInterval = 30000;

    window.setTimeout(checkConnection, checkConnectionInterval);

    if (! hoodie.isOnline()) {
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

    window.setTimeout(checkConnection, checkConnectionInterval);

    if (hoodie.isOnline()) {
      hoodie.trigger('disconnected');
      online = false;
    }

    return hoodie.reject();
  }


  //
  // public API
  //
  hoodie.isOnline = isOnline;
  hoodie.checkConnection = checkConnection;
}
