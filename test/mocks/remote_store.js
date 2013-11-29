module.exports = function() {

  var api = {
    loadListOfKnownObjectsFromLocalStore : sinon.spy(),
    subscribeToOutsideEvents : sinon.spy(),
    connect : sinon.spy()
  };

  return api;
};
