require('../../lib/setup');
var hoodieOpen = require('../../../src/hoodie/open');

describe('#open(store, options)', function() {

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);
    this.requestDefer = this.hoodie.defer();

    // HERE: spy on require('./remote_store') somehow ...
    // this.sandbox.spy(window, 'hoodieRemoteStore');

    hoodieOpen(this.hoodie);
  });

  it('should instantiate a Remote instance', function() {

    this.hoodie.open('store_name', {
      option: 'value'
    });

    expect(window.hoodieRemoteStore).to.be.calledWith(this.hoodie, {
      name: 'store_name',
      option: 'value'
    });
  });

});
