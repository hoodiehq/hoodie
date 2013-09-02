/* global hoodieOpen:true */

describe('hoodie.task', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    hoodieOpen(this.hoodie);
  });

  describe('#start()', function() {
    beforeEach(function() {

    });

    it('should be funky', function() {
      expect(this.hoodie.task.start).to.be('funky');
    });
  });
  describe('#cancel()', function() {
    beforeEach(function() {

    });

    it('should be funky', function() {
      expect(this.hoodie.task.cancel).to.be('funky');
    });
  });
  describe('#restart()', function() {
    beforeEach(function() {

    });

    it('should be funky', function() {
      expect(this.hoodie.task.restart).to.be('funky');
    });
  });
  describe('#remove()', function() {
    beforeEach(function() {

    });

    it('should be funky', function() {
      expect(this.hoodie.task.remove).to.be('funky');
    });
  });
  describe('#on()', function() {
    beforeEach(function() {

    });

    it('should be funky', function() {
      expect(this.hoodie.task.on).to.be('funky');
    });
  });
  describe('#unbind()', function() {
    beforeEach(function() {

    });

    it('should be funky', function() {
      expect(this.hoodie.task.unbind).to.be('funky');
    });
  });
});
