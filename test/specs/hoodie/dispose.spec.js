require('../../lib/setup');
var hoodieDispose = require('../../../src/hoodie/dispose');

describe('hoodie.dispose()', function() {

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);

    hoodieDispose(this.hoodie);
  });

  it('should trigger `dispose` event', function() {
    this.hoodie.dispose();
    expect(this.hoodie.trigger).to.be.calledWith('dispose');
  });

});
