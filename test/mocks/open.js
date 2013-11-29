// hoodieOpen
module.exports = function() {

  var openDefer = $.Deferred();
  var openPromise = openDefer.promise();

  var openMethod = this.sandbox.stub().returns(openPromise);
  openMethod.defer = openDefer;

  return openMethod;
};
