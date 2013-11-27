module.exports = function () {

  var task = {};

  task.startDefer = $.Deferred();
  task.cancelDefer = $.Deferred();
  task.cancelAllDefer = $.Deferred();
  task.restartDefer = $.Deferred();
  task.restartAllDefer = $.Deferred();

  task.start = sinon.stub().returns(task.startDefer.promise());
  task.cancel = sinon.stub().returns(task.cancelDefer.promise());
  task.cancelAll = sinon.stub().returns(task.cancelAllDefer.promise());
  task.restart = sinon.stub().returns(task.restartDefer.promise());
  task.restartAll = sinon.stub().returns(task.restartAllDefer.promise());
  task.subscribeToOutsideEvents = sinon.spy();

  return task;
};
