// hoodieEvents
module.exports = function(hoodie) {
  var api = {
    on : sinon.spy(),
    one : sinon.spy(),
    trigger : sinon.spy(),
    unbind : sinon.spy()
  };

  hoodie.on = api.on;
  hoodie.one = api.one;
  hoodie.trigger = api.trigger;
  hoodie.unbind = api.unbind;
};
