module.exports = function() {

  var self = this;

  var api = {
    patchIfNotPersistant : self.sandbox.spy(),
    subscribeToOutsideEvents : self.sandbox.spy(),
    bootstrapDirtyObjects : self.sandbox.spy()
  };

  return api;
};
