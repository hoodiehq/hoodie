module.exports = function(name) {

  var options = {};

  options.name = name || 'mystore';

  // backdoor control of store API methods
  var saveDefer = $.Deferred();
  var findDefer = $.Deferred();
  var findAllDefer = $.Deferred();
  var removeDefer = $.Deferred();
  var removeAllDefer   = $.Deferred();

  options.backend = {
    save : sinon.stub().returns( saveDefer.promise() ),
    find : sinon.stub().returns( findDefer.promise() ),
    findAll : sinon.stub().returns( findAllDefer.promise() ),
    remove : sinon.stub().returns( removeDefer.promise() ),
    removeAll : sinon.stub().returns( removeAllDefer.promise() )
  };

  options.backend.save.defer = saveDefer;
  options.backend.find.defer = findDefer;
  options.backend.findAll.defer = findAllDefer;
  options.backend.remove.defer = removeDefer;
  options.backend.removeAll.defer = removeAllDefer;

  return options;
};
