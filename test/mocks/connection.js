// hoodieConnection
module.exports = function() {

  var self = this;

  return {
    isConnected: self.sandbox.spy(),
    checkConnection: self.sandbox.spy()
  };

};
