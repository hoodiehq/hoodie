// hoodieRequest
module.exports = function() {
  var requestDefer = $.Deferred();
  var request = this.sandbox.stub().returns(requestDefer.promise());
  request.defer = requestDefer;

  return request;
};
