require('../../lib/setup');

global.unstubRequire('src/utils/generate_id');
var generateId = require('../../../src/utils/generate_id');

describe('generateId()', function() {

  beforeEach(function() {
  });

  it('should default to a length of 7', function() {
    expect(generateId().length).to.eql(7);
  });

  _when('called with num = 5', function() {
    it('should generate an id with length = 5', function() {
      expect(generateId(5).length).to.eql(5);
    });
  });
});
