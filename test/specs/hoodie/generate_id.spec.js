/* global hoodieGenerateId:true */

describe('hoodie.generateId()', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
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
