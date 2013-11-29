var eventsMixin = require('./events');

module.exports = function() {

  var anonymousSignUpDefer = $.Deferred();
  var authenticateDefer = $.Deferred();
  var changePasswordDefer = $.Deferred();
  var changeUsernameDefer = $.Deferred();
  var checkPasswordResetDefer = $.Deferred();
  var destroyDefer = $.Deferred();
  var fetchDefer = $.Deferred();
  var requestDefer = $.Deferred();
  var resetPasswordDefer = $.Deferred();
  var signInDefer = $.Deferred();
  var signOutDefer = $.Deferred();
  var signUpDefer = $.Deferred();

  var api = {
    username : 'joe@example.com',
    ownerHash : 'hash123',

    anonymousSignUp : this.sandbox.stub().returns(anonymousSignUpDefer.promise()),
    authenticate : this.sandbox.stub().returns(authenticateDefer.promise()),
    changePassword : this.sandbox.stub().returns(changePasswordDefer.promise()),
    changeUsername : this.sandbox.stub().returns(changeUsernameDefer.promise()),
    checkPasswordReset : this.sandbox.stub().returns(checkPasswordResetDefer.promise()),
    db : this.sandbox.stub().returns('userdb'),
    destroy : this.sandbox.stub().returns(destroyDefer.promise()),
    fetch : this.sandbox.stub().returns(fetchDefer.promise()),
    hasAccount : this.sandbox.stub(),
    hasAnonymousAccount : this.sandbox.stub(),
    hasInvalidSession : this.sandbox.stub(),
    hasValidSession : this.sandbox.stub(),
    request : this.sandbox.stub().returns(requestDefer.promise()),
    resetPassword : this.sandbox.stub().returns(resetPasswordDefer.promise()),
    signIn : this.sandbox.stub().returns(signInDefer.promise()),
    signOut : this.sandbox.stub().returns(signOutDefer.promise()),
    signUp : this.sandbox.stub().returns(signUpDefer.promise()),
    subscribeToOutsideEvents : this.sandbox.stub()
  };

  // mixin event api
  $.extend(api, eventsMixin.apply(this));

  // backdoor access to deferreds
  api.anonymousSignUp.defer = anonymousSignUpDefer;
  api.authenticate.defer = authenticateDefer;
  api.changePassword.defer = changePasswordDefer;
  api.changeUsername.defer = changeUsernameDefer;
  api.checkPasswordReset.defer = checkPasswordResetDefer;
  api.destroy.defer = destroyDefer;
  api.fetch.defer = fetchDefer;
  api.request.defer = requestDefer;
  api.resetPassword.defer = resetPasswordDefer;
  api.signIn.defer = signInDefer;
  api.signOut.defer = signOutDefer;
  api.signUp.defer = signUpDefer;

  return api;
};
