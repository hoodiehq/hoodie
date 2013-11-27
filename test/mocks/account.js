module.exports = function() {

  var self = this;

  var api = {
    checkPasswordReset : self.sandbox.spy(),
    authenticate : self.sandbox.sinon.stub().returns(api.authenticateDefer.promise()),
    on : self.sandbox.spy(),
    authenticateDefer: $.Deferred()
  };

  return api;
};
