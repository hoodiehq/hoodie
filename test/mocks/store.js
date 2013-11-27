module.exports = function() {

  var api = {
    patchIfNotPersistant : sinon.spy(),
    subscribeToOutsideEvents : sinon.spy(),
    bootstrapDirtyObjects : sinon.spy()
  };

  return api;
};
