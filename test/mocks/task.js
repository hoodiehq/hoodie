var eventsMixin = require('./events');

module.exports = function () {
  var api = {};

  var startDefer = $.Deferred();
  var cancelDefer = $.Deferred();
  var cancelAllDefer = $.Deferred();
  var restartDefer = $.Deferred();
  var restartAllDefer = $.Deferred();

  api.start = sinon.stub().returns(startDefer.promise());
  api.cancel = sinon.stub().returns(cancelDefer.promise());
  api.cancelAll = sinon.stub().returns(cancelAllDefer.promise());
  api.restart = sinon.stub().returns(restartDefer.promise());
  api.restartAll = sinon.stub().returns(restartAllDefer.promise());
  api.subscribeToOutsideEvents = sinon.spy();

  // mixin event api
  $.extend(api, eventsMixin.apply(this));

  // backdoor access to deferreds
  api.start.defer = startDefer;
  api.cancel.defer = cancelDefer;
  api.cancelAll.defer = cancelAllDefer;
  api.restart.defer = restartDefer;
  api.restartAll.defer = restartAllDefer;

  return api;
};
