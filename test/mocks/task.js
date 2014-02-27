var eventsMixin = require('./events');

module.exports = function () {
  var api = {};

  var startDefer = $.Deferred();
  var abortDefer = $.Deferred();
  var abortAllDefer = $.Deferred();
  var restartDefer = $.Deferred();
  var restartAllDefer = $.Deferred();

  api.start = sinon.stub().returns(startDefer.promise());
  api.abort = sinon.stub().returns(abortDefer.promise());
  api.abortAll = sinon.stub().returns(abortAllDefer.promise());
  api.restart = sinon.stub().returns(restartDefer.promise());
  api.restartAll = sinon.stub().returns(restartAllDefer.promise());
  api.subscribeToOutsideEvents = sinon.spy();

  // mixin event api
  $.extend(api, eventsMixin.apply(this));

  // backdoor access to deferreds
  api.start.defer = startDefer;
  api.abort.defer = abortDefer;
  api.abortAll.defer = abortAllDefer;
  api.restart.defer = restartDefer;
  api.restartAll.defer = restartAllDefer;

  return api;
};
