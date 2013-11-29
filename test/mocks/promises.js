module.exports = function() {
  var defer = $.Deferred;
  var api = {
    defer : function() {},
    isPromise : function() {},
    resolve : function() {},
    reject : function() {},
    resolveWith : function() {},
    rejectWith : function() {}
  };

  this.sandbox.stub(api, 'defer', defer);
  this.sandbox.stub(api, 'resolve', function() {
    return defer().resolve().promise();
  });
  this.sandbox.stub(api, 'resolveWith', function () {
    var dfd = defer();
    return dfd.resolve.apply(dfd, arguments).promise();
  });
  this.sandbox.stub(api, 'reject', function() {
    return defer().reject().promise();
  });
  this.sandbox.stub(api, 'rejectWith', function () {
    var dfd = defer();
    return dfd.reject.apply(dfd, arguments).promise();
  });

  return api;
};
