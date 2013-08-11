'use strict';

describe('hoodie.remote', function() {
  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    this.sandbox.stub(this.hoodie, 'open').returns({});
    this.sandbox.stub(this.hoodie.account, 'db').returns('userdb')
    this.sandbox.stub(this.hoodie.config, 'get').withArgs('_remote.since').returns(10)
    this.sandbox.stub(this.hoodie.store, 'index').returns(['funk/1', '$task/2'])

    this.clock = this.sandbox.useFakeTimers(0) // '1970-01-01 00:00:00'
    hoodieRemote(this.hoodie);
    this.remote = this.hoodie.remote;
  });

  it("should open the users store with some options", function() {
    expect(this.hoodie.open).to.be.calledWith('userdb', {
      connected: true,
      prefix: '',
      since: 10,
      defaultObjectsToPush: this.hoodie.store.changedObjects,
      knownObjects: [{ type: 'funk', id: '1'}, { type: '$task', id: '2'}]
    })
  });

  describe("#subscribeToOutsideEvents", function() {
    it.skip('should have some specs')
  });
});
