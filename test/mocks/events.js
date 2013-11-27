module.exports = function() {

  var self = this;

  return {
    on : self.sandbox.spy(),
    one : self.sandbox.spy(),
    trigger : self.sandbox.spy(),
    unbind : self.sandbox.spy()
  };

};
