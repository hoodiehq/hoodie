module.exports = function() {

  return {
    on : this.sandbox.spy(),
    one : this.sandbox.spy(),
    trigger : this.sandbox.spy(),
    unbind : this.sandbox.spy()
  };

};
