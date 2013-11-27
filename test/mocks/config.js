module.exports = function() {
  var api = {
    get : sinon.stub().returnsArg(0),
    set : sinon.spy(),
    remove : sinon.spy(),
    clear : sinon.spy()
  };

  return api;
};
