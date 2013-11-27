// hoodieConfig
module.exports = function(hoodie) {
  var api = {
    get : sinon.stub().returnsArg(0),
    set : sinon.spy(),
    remove : sinon.spy(),
    clear : sinon.spy()
  };

  hoodie.config = api;
};
