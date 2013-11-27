module.exports = function() {
  var api = {
    checkPasswordReset : sinon.spy(),
    authenticate : sinon.stub(),
    on : sinon.spy()
  };

  api.authenticateDefer = $.Deferred();
  api.authenticate.returns(api.authenticateDefer.promise());

  return api;
};
