/* global hoodieTask */

describe('hoodie.task', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    this.sandbox.spy(window, 'hoodieEvents');
    hoodieTask(this.hoodie);
  });

  it('should add events API', function() {
    expect(window.hoodieEvents).to.be.calledWith(this.hoodie, {
      context: this.hoodie.task,
      namespace: 'task'
    });
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
});
