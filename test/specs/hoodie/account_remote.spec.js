'use strict';

describe('hoodie.remote', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    this.sandbox.spy(window, 'hoodieRemoteStore')
    this.sandbox.stub(this.hoodie.account, 'db').returns('userdb')
    this.sandbox.stub(this.hoodie.config, 'get').withArgs('_remote.since').returns(10)

    this.clock = this.sandbox.useFakeTimers(0) // '1970-01-01 00:00:00'
    hoodieRemote(this.hoodie);
    this.remote = this.hoodie.remote;
  });

  it("should open the users store with some options", function() {
    expect(window.hoodieRemoteStore).to.be.calledWith(this.hoodie, {
      name: 'userdb',
      connected: true,
      prefix: '',
      since: 10,
      defaultObjectsToPush: this.hoodie.store.changedObjects
    })
  });

  describe("#loadListOfKnownObjectsFromLocalStore", function() {
    it.skip('should have some specs')
  });
  describe("#subscribeToOutsideEvents", function() {
    it.skip('should have some specs')
  });
});
