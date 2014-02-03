require('../../lib/setup');
var hoodieGenerateId = require('../../../src/utils/generate_id');

describe('hoodie.generateId()', function() {

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);
    hoodieGenerateId(this.hoodie);
  });

  it('should default to a length of 7', function() {
    expect(this.hoodie.generateId().length).to.eql(7);
  });

  _when('called with num = 5', function() {
    it('should generate an id with length = 5', function() {
      expect(this.hoodie.generateId(5).length).to.eql(5);
    });
  });
});
