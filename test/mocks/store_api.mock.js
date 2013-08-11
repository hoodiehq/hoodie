var Mocks = window.Mocks || {};
Mocks.StoreApi = function () {
  var api = {
    trigger: sinon.stub(),
    on: sinon.stub(),
    one: sinon.stub(),
    unbind: sinon.stub()
  };

  api.saveDefer = $.Deferred();
  api.addDefer = $.Deferred();
  api.findOrAddDefer = $.Deferred();
  api.findDefer = $.Deferred();
  api.findAllDefer = $.Deferred();
  api.updateDefer = $.Deferred();
  api.updateAllDefer = $.Deferred();
  api.removeDefer = $.Deferred();
  api.removeAllDefer = $.Deferred();

  api.save = sinon.stub().returns(api.saveDefer.promise());
  api.add = sinon.stub().returns(api.addDefer.promise());
  api.findOrAdd = sinon.stub().returns(api.findOrAddDefer.promise());
  api.find = sinon.stub().returns(api.findDefer.promise());
  api.findAll = sinon.stub().returns(api.findAllDefer.promise());
  api.update = sinon.stub().returns(api.updateDefer.promise());
  api.updateAll = sinon.stub().returns(api.updateAllDefer.promise());
  api.remove = sinon.stub().returns(api.removeDefer.promise());
  api.removeAll = sinon.stub().returns(api.removeAllDefer.promise());

  return api;
};
