module.exports = function() {

  var checkConnectionDefer = $.Deferred();
  var checkConnectionPromise = checkConnectionDefer.promise();
  checkConnectionPromise.defer = checkConnectionDefer;

  return {
    isConnected: this.sandbox.stub(),
    checkConnection: this.sandbox.stub().returns(checkConnectionPromise)
  };

};
