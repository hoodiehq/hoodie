module.exports = function (hoodie) {

  if (!hoodie) {
    hoodie = {};
  }

  hoodie.task = function() {};

  hoodie.task.startDefer = $.Deferred();
  hoodie.task.cancelDefer = $.Deferred();
  hoodie.task.cancelAllDefer = $.Deferred();
  hoodie.task.restartDefer = $.Deferred();
  hoodie.task.restartAllDefer = $.Deferred();

  hoodie.task.start = sinon.stub().returns(hoodie.task.startDefer.promise());
  hoodie.task.cancel = sinon.stub().returns(hoodie.task.cancelDefer.promise());
  hoodie.task.cancelAll = sinon.stub().returns(hoodie.task.cancelAllDefer.promise());
  hoodie.task.restart = sinon.stub().returns(hoodie.task.restartDefer.promise());
  hoodie.task.restartAll = sinon.stub().returns(hoodie.task.restartAllDefer.promise());

  hoodie.task.subscribeToOutsideEvents = sinon.spy();

  sinon.stub(hoodie, 'task', function() {
    return hoodie.task;
  });
};
