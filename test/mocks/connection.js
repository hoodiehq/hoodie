// hoodieConnection
module.exports = function() {

  return {
    isConnected: sinon.spy(),
    checkConnection: sinon.spy()
  };

};
