require('../../lib/setup');

var hoodieOpen = require('../../../src/hoodie/open');

describe('hoodie.open(store, options)', function() {

  beforeEach(function() {
    this.sandbox.stub(hoodieOpen, 'hoodieRemoteStore');
    this.hoodie = {};
    hoodieOpen(this.hoodie);
  });

  it('should instantiate a Remote instance', function() {

    this.hoodie.open('store_name', {
      option: 'value'
    });

    expect(hoodieOpen.hoodieRemoteStore).to.be.calledWith(this.hoodie, {
      name: 'store_name',
      option: 'value'
    });
  });

});
