// hoodieAccount
module.exports = function(hoodie) {
  var api = {
    checkPasswordReset : sinon.spy(),
    authenticate : sinon.stub(),
    on : sinon.spy()
  };

  api.authenticateDefer = $.Deferred();
  api.authenticate.returns(api.authenticateDefer.promise());

  hoodie.account = api;
};
