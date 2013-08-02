describe('hoodie.dispose()', function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
    this.hoodie = new Mocks.Hoodie();
    debugger
    hoodieDispose(this.hoodie)
    this.sandbox.spy(this.hoodie, 'trigger');
  });
  afterEach(function() {
    this.sandbox.restore()
  });

  it('should trigger `dispose` event', function() {
    this.hoodie.dispose();
    expect(this.hoodie.trigger.calledWith('dispose')).to.be.ok();
  });
});
