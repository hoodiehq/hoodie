var Mocks = window.Mocks || {};
Mocks.hoodieTask = function (hoodie) {

  if (!hoodie) {
    hoodie = {};
  }

  hoodie.task = function() {};

  hoodie.task.subscribeToStoreEvents = sinon.spy();

  sinon.stub(hoodie, 'task', function() {
    return hoodie.task;
  });
};
