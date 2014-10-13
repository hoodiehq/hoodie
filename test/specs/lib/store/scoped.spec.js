require('../../../lib/setup');

var scopedStore = require('../../../../src/lib/store/scope');
describe('scopedStore setup', function() {
  beforeEach(function() {
    this.hoodie = {};
    this.options = {
      name: 'remoteMock'
    };
    this.scopedStore = scopedStore(this.hoodie, this.options);
  });

  it('returns a scopedStore instance', function() {
    expect(this.scopedStore).to.be.an(Object);
  });
});
