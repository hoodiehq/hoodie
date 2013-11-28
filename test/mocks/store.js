module.exports = function () {

  var o = { api: function() {} };

  o.api.trigger = sinon.stub();
  o.api.on = sinon.stub();
  o.api.one = sinon.stub();
  o.api.unbind = sinon.stub();

  o.api.hasLocalChanges = sinon.stub();
  o.api.changedObjects = sinon.stub();

  o.api.saveDefer = $.Deferred();
  o.api.addDefer = $.Deferred();
  o.api.findOrAddDefer = $.Deferred();
  o.api.findDefer = $.Deferred();
  o.api.findAllDefer = $.Deferred();
  o.api.updateDefer = $.Deferred();
  o.api.updateOrAddDefer = $.Deferred();
  o.api.updateAllDefer = $.Deferred();
  o.api.removeDefer = $.Deferred();
  o.api.removeAllDefer = $.Deferred();

  o.api.save = sinon.stub().returns(o.api.saveDefer.promise());
  o.api.add = sinon.stub().returns(o.api.addDefer.promise());
  o.api.findOrAdd = sinon.stub().returns(o.api.findOrAddDefer.promise());
  o.api.find = sinon.stub().returns(o.api.findDefer.promise());
  o.api.findAll = sinon.stub().returns(o.api.findAllDefer.promise());
  o.api.update = sinon.stub().returns(o.api.updateDefer.promise());
  o.api.updateOrAdd = sinon.stub().returns(o.api.updateOrAddDefer.promise());
  o.api.updateAll = sinon.stub().returns(o.api.updateAllDefer.promise());
  o.api.remove = sinon.stub().returns(o.api.removeDefer.promise());
  o.api.removeAll = sinon.stub().returns(o.api.removeAllDefer.promise());

  o.api.index = sinon.stub().returns([]);

  sinon.stub(o, 'api', function() {
    return o.api;
  });

  return o.api;
};
