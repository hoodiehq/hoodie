var events = require('./events');

module.exports = function () {

  var o = { api: function() {} };

  var eventsMixin = events.apply(this);
  $.extend(o.api, eventsMixin);

  o.api.validate = this.sandbox.stub();
  o.api.decoratePromises = this.sandbox.stub();

  var saveDefer = $.Deferred();
  var addDefer = $.Deferred();
  var findDefer = $.Deferred();
  var findOrAddDefer = $.Deferred();
  var findAllDefer = $.Deferred();
  var updateDefer = $.Deferred();
  var updateOrAddDefer = $.Deferred();
  var updateAllDefer = $.Deferred();
  var removeDefer = $.Deferred();
  var removeAllDefer = $.Deferred();

  o.api.save = this.sandbox.stub().returns(saveDefer.promise());
  o.api.add = this.sandbox.stub().returns(addDefer.promise());
  o.api.find = this.sandbox.stub().returns(findDefer.promise());
  o.api.findOrAdd = this.sandbox.stub().returns(findOrAddDefer.promise());
  o.api.findAll = this.sandbox.stub().returns(findAllDefer.promise());
  o.api.update = this.sandbox.stub().returns(updateDefer.promise());
  o.api.updateOrAdd = this.sandbox.stub().returns(updateOrAddDefer.promise());
  o.api.updateAll = this.sandbox.stub().returns(updateAllDefer.promise());
  o.api.remove = this.sandbox.stub().returns(removeDefer.promise());
  o.api.removeAll = this.sandbox.stub().returns(removeAllDefer.promise());

  o.api.save.defer = saveDefer;
  o.api.add.defer = addDefer;
  o.api.find.defer = findDefer;
  o.api.findOrAdd.defer = findOrAddDefer;
  o.api.findAll.defer = findAllDefer;
  o.api.update.defer = updateDefer;
  o.api.updateOrAdd.defer = updateOrAddDefer;
  o.api.updateAll.defer = updateAllDefer;
  o.api.remove.defer = removeDefer;
  o.api.removeAll.defer = removeAllDefer;

  this.sandbox.stub(o, 'api', function() {
    return o.api;
  });

  return o.api;
};
