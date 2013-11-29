module.exports = function() {

  return {
    on : this.sandbox.stub(),
    one : this.sandbox.stub(),
    trigger : this.sandbox.stub(),
    unbind : this.sandbox.stub()
  };

};
