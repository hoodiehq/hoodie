module.exports = function() {

  return {
    get : this.sandbox.stub().returnsArg(0),
    set : this.sandbox.stub(),
    unset: this.sandbox.stub(),
    clear : this.sandbox.stub()
  };

};
