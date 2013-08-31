var Mocks = window.Mocks || {};

Mocks.storeOptions = function(name) {

  var options = {};

  options.name = name || 'mystore';

  // backdoor control of store API methods
  options.saveDefer = $.Deferred();
  options.findDefer = $.Deferred();
  options.findAllDefer = $.Deferred();
  options.removeDefer = $.Deferred();
  options.removeAllDefer   = $.Deferred();

  options.backend = {
    save : sinon.stub().returns( options.saveDefer.promise() ),
    find : sinon.stub().returns( options.findDefer.promise() ),
    findAll : sinon.stub().returns( options.findAllDefer.promise() ),
    remove : sinon.stub().returns( options.removeDefer.promise() ),
    removeAll : sinon.stub().returns( options.removeAllDefer.promise() )
  };

  return options;
};