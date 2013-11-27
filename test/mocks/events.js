module.exports = function() {
  return {
    on : sinon.spy(),
    one : sinon.spy(),
    trigger : sinon.spy(),
    unbind : sinon.spy()
  };
};
