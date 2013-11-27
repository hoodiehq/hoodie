// hoodieConnection
module.exports = function(hoodie) {
  hoodie.isConnected = sinon.spy();
  hoodie.checkConnection = sinon.spy();
};
