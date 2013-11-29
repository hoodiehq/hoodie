var eventsMixin = require('./events');

module.exports = function () {

  var o = { api: function() {} };

  o.api.validate = this.sandbox.stub();
  o.api.hasLocalChanges = this.sandbox.stub();
  o.api.changedObjects = this.sandbox.stub();
  o.api.clear = this.sandbox.stub();
  o.api.isBootstrapping = this.sandbox.stub();
  o.api.isPersistent = this.sandbox.stub();
  o.api.decoratePromises = this.sandbox.stub();
  o.api.subscribeToOutsideEvents = this.sandbox.stub();
  o.api.bootstrapDirtyObjects = this.sandbox.stub();
  o.api.patchIfNotPersistant = this.sandbox.stub();

  var saveDefer = $.Deferred();
  var addDefer = $.Deferred();
  var findOrAddDefer = $.Deferred();
  var findDefer = $.Deferred();
  var findAllDefer = $.Deferred();
  var updateDefer = $.Deferred();
  var updateOrAddDefer = $.Deferred();
  var updateAllDefer = $.Deferred();
  var removeDefer = $.Deferred();
  var removeAllDefer = $.Deferred();

  o.api.save = this.sandbox.stub().returns(saveDefer.promise());
  o.api.add = this.sandbox.stub().returns(addDefer.promise());
  o.api.findOrAdd = this.sandbox.stub().returns(findOrAddDefer.promise());
  o.api.find = this.sandbox.stub().returns(findDefer.promise());
  o.api.findAll = this.sandbox.stub().returns(findAllDefer.promise());
  o.api.update = this.sandbox.stub().returns(updateDefer.promise());
  o.api.updateOrAdd = this.sandbox.stub().returns(updateOrAddDefer.promise());
  o.api.updateAll = this.sandbox.stub().returns(updateAllDefer.promise());
  o.api.remove = this.sandbox.stub().returns(removeDefer.promise());
  o.api.removeAll = this.sandbox.stub().returns(removeAllDefer.promise());

  o.api.index = this.sandbox.stub().returns([]);
  o.api.changedObjects = this.sandbox.stub().returns([]);

  // mixin event API
  $.extend(o.api, eventsMixin.apply(this));

  // backdoor access to deferreds
  o.api.save.defer = saveDefer;
  o.api.add.defer = addDefer;
  o.api.findOrAdd.defer = findOrAddDefer;
  o.api.find.defer = findDefer;
  o.api.findAll.defer = findAllDefer;
  o.api.update.defer = updateDefer;
  o.api.updateOrAdd.defer = updateOrAddDefer;
  o.api.updateAll.defer = updateAllDefer;
  o.api.remove.defer = removeDefer;
  o.api.removeAll.defer = removeAllDefer;

  // make sure that hoodie.store is callable as function
  this.sandbox.stub(o, 'api', function() {
    return o.api;
  });

  return o.api;
};
