// hoodieStore
module.exports = function(hoodie) {
  var api = {
    patchIfNotPersistant : sinon.spy(),
    subscribeToOutsideEvents : sinon.spy(),
    bootstrapDirtyObjects : sinon.spy()
  };

  hoodie.store = api;
};
