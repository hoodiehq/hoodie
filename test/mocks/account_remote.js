var eventsMixin = require('./events');

module.exports = function() {

  var bootstrapDefer = $.Deferred();
  var connectDefer = $.Deferred();
  var disconnectDefer = $.Deferred();
  var pullDefer = $.Deferred();
  var pushDefer = $.Deferred();
  var requestDefer = $.Deferred();
  var syncDefer = $.Deferred();

  var api = {
    prefix : '',

    bootstrap : this.sandbox.stub().returns(bootstrapDefer.promise()),
    connect : this.sandbox.stub().returns(connectDefer.promise()),
    disconnect : this.sandbox.stub().returns(disconnectDefer.promise()),
    getSinceNr : this.sandbox.stub(),
    isConnected : this.sandbox.stub(),
    isKnownObject : this.sandbox.stub(),
    markAsKnownObject : this.sandbox.stub(),
    pull : this.sandbox.stub().returns(pullDefer.promise()),
    push : this.sandbox.stub().returns(pushDefer.promise()),
    request : this.sandbox.stub().returns(requestDefer.promise()),
    subscribeToOutsideEvents : this.sandbox.stub(),
    sync : this.sandbox.stub().returns(syncDefer.promise())
  };

  $.extend(api, eventsMixin.apply(this));

  api.bootstrap.defer = bootstrapDefer;
  api.connect.defer = connectDefer;
  api.disconnect.defer = disconnectDefer;
  api.pull.defer = pullDefer;
  api.push.defer = pushDefer;
  api.request.defer = requestDefer;
  api.sync.defer = syncDefer;

  return api;
};
