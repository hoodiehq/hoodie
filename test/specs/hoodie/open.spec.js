/* global hoodieOpen:true */

describe('#open(store, options)', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    this.requestDefer = this.hoodie.defer();
    this.sandbox.spy(window, 'hoodieRemoteStore');
    hoodieOpen(this.hoodie);
  });

  it('should instantiate a Remote instance', function() {

    this.hoodie.open('store_name', {
      option: 'value'
    });

    expect(window.hoodieRemoteStore.withArgs(this.hoodie, {
      name: 'store_name',
      option: 'value'
    })).to.be.ok();
  });

});
