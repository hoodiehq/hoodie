module.exports = function() {

  return {
    get : this.sandbox.stub().returnsArg(0),
    set : this.sandbox.spy(),
    unset: this.sandbox.spy(),
    clear : this.sandbox.spy()
  };

};
