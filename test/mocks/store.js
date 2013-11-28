var events = require('./events');

module.exports = function () {

  var o = { api: function() {} };

  var eventsMixin = events.apply(this);
  $.extend(o.api, eventsMixin);

  o.api.validate = this.sandbox.stub();
  o.api.decoratePromises = this.sandbox.stub();

  o.api.saveDefer = $.Deferred();
  o.api.addDefer = $.Deferred();
  o.api.findDefer = $.Deferred();
  o.api.findOrAddDefer = $.Deferred();
  o.api.findAllDefer = $.Deferred();
  o.api.updateDefer = $.Deferred();
  o.api.updateOrAddDefer = $.Deferred();
  o.api.updateAllDefer = $.Deferred();
  o.api.removeDefer = $.Deferred();
  o.api.removeAllDefer = $.Deferred();

  o.api.save = this.sandbox.stub().returns(o.api.saveDefer.promise());
  o.api.add = this.sandbox.stub().returns(o.api.addDefer.promise());
  o.api.find = this.sandbox.stub().returns(o.api.findDefer.promise());
  o.api.findOrAdd = this.sandbox.stub().returns(o.api.findOrAddDefer.promise());
  o.api.findAll = this.sandbox.stub().returns(o.api.findAllDefer.promise());
  o.api.update = this.sandbox.stub().returns(o.api.updateDefer.promise());
  o.api.updateOrAdd = this.sandbox.stub().returns(o.api.updateOrAddDefer.promise());
  o.api.updateAll = this.sandbox.stub().returns(o.api.updateAllDefer.promise());
  o.api.remove = this.sandbox.stub().returns(o.api.removeDefer.promise());
  o.api.removeAll = this.sandbox.stub().returns(o.api.removeAllDefer.promise());

  this.sandbox.stub(o, 'api', function() {
    return o.api;
  });

  return o.api;
};
