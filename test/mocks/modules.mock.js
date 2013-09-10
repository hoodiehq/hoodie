var Mocks = window.Mocks || {};

Mocks.hoodieEvents = function(hoodie) {
  var api = {
    on : sinon.spy(),
    one : sinon.spy(),
    trigger : sinon.spy(),
    unbind : sinon.spy()
  };

  hoodie.on = api.on;
  hoodie.one = api.one;
  hoodie.trigger = api.trigger;
  hoodie.unbind = api.unbind;
};

Mocks.hoodiePromises = function(hoodie) {

};

Mocks.hoodieRequest = function(hoodie) {

};

Mocks.hoodieConnection = function(hoodie) {
  hoodie.isConnected = sinon.spy();
  hoodie.checkConnection = sinon.spy();
};

Mocks.hoodieUUID = function(hoodie) {

};

Mocks.hoodieDispose = function(hoodie) {

};

Mocks.hoodieOpen = function(hoodie) {

};

Mocks.hoodieStore = function(hoodie) {
  var api = {
    patchIfNotPersistant : sinon.spy(),
    subscribeToOutsideEvents : sinon.spy(),
    bootstrapDirtyObjects : sinon.spy()
  };

  hoodie.store = api;
};

Mocks.hoodieConfig = function(hoodie) {
  var api = {
    get : sinon.stub().returnsArg(0),
    set : sinon.spy(),
    remove : sinon.spy(),
    clear : sinon.spy()
  };

  hoodie.config = api;
};

Mocks.hoodieAccount = function(hoodie) {
  var api = {
    checkPasswordReset : sinon.spy(),
    authenticate : sinon.stub(),
    on : sinon.spy()
  };

  api.authenticateDefer = $.Deferred();
  api.authenticate.returns(api.authenticateDefer.promise());

  hoodie.account = api;
};

Mocks.hoodieRemote = function(hoodie) {
  var api = {
    loadListOfKnownObjectsFromLocalStore : sinon.spy(),
    subscribeToEvents : sinon.spy(),
    connect : sinon.spy()
  };

  hoodie.remote = api;
};
