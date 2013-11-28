module.exports = function() {

  var self = this;

  var api = {
    checkPasswordReset : self.sandbox.spy(),
    authenticate : self.sandbox.stub().returns($.Deferred().promise()),
    on : self.sandbox.spy(),
    authenticateDefer: $.Deferred()
  };

  return api;
};
