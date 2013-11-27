// hoodieRemoteStore
module.exports = function(hoodie) {
  var api = {
    loadListOfKnownObjectsFromLocalStore : sinon.spy(),
    subscribeToOutsideEvents : sinon.spy(),
    connect : sinon.spy()
  };

  hoodie.remote = api;
};
