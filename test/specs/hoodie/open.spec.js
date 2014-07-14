require('../../lib/setup');

var remoteStoreStub = sinon.stub();
var hoodieOpen = require('../../../src/hoodie/open');

describe('#open(store, options)', function() {

  before(function () {
    global.stubRequire('src/lib/store/remote', remoteStoreStub);
  });

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);
    this.requestDefer = this.hoodie.defer();

    hoodieOpen(this.hoodie);
  });

  after(function() {
    global.unstubRequire('src/lib/store/remote');
  });

  it('should instantiate a Remote instance', function() {

    this.hoodie.open('store_name', {
      option: 'value'
    });

    expect(remoteStoreStub).to.be.calledWith(this.hoodie, {
      name: 'store_name',
      option: 'value'
    });
  });

});
