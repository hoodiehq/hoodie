require('../../../lib/setup');

var scopedStore = require('../../../../src/lib/store/scoped');
describe('scopedStore setup', function() {
  beforeEach(function() {
    this.hoodie = {};
    this.storeApi = {};
    this.options = {
      name: 'remoteMock'
    };
    this.scopedStore = scopedStore(this.hoodie, this.storeApi, this.options);
  });

  it('returns a scopedStore instance', function() {
    expect(this.scopedStore).to.be.an(Object);
  });
});
