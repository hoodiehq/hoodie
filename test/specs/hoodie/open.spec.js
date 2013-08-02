/* global hoodieOpen:true */

describe('#open(store, options)', function() {

  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();

    this.hoodie = new Mocks.Hoodie();

    this.requestDefer = this.hoodie.defer();

    this.sandbox.spy(window, 'hoodieRemoteBase');

    hoodieOpen(this.hoodie);
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  it('should instantiate a Remote instance', function() {

    this.hoodie.open('store_name', {
      option: 'value'
    });

    expect(window.hoodieRemoteBase.withArgs(this.hoodie, {
      name: 'store_name',
      option: 'value'
    })).to.be.ok();

  });

});
