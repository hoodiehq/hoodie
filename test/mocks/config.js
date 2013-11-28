module.exports = function() {

  var self = this;

  return {
    get : self.sandbox.stub().returnsArg(0),
    set : self.sandbox.spy(),
    unset: self.sandbox.spy(),
    clear : self.sandbox.spy()
  };

};
