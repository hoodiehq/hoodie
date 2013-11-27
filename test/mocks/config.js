module.exports = function() {

  var self = this;

  var api = {
    get : self.sandbox.stub().returnsArg(0),
    set : self.sandbox.spy(),
    remove : self.sandbox.spy(),
    clear : self.sandbox.spy()
  };

  return api;
};
