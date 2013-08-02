/* global hoodieDispose:true */

describe('hoodie.dispose()', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();

    hoodieDispose(this.hoodie);

    this.sandbox.spy(this.hoodie, 'trigger');
  });

  it('should trigger `dispose` event', function() {
    this.hoodie.dispose();
    expect(this.hoodie.trigger.calledWith('dispose')).to.be.ok();
  });

});
