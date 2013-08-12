/* global hoodieRemote:true */

describe('hoodie.remote', function() {
  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    this.sandbox.stub(this.hoodie, 'open').returns({
      connect: sinon.spy(),
      disconnect: sinon.spy()
    });
    this.sandbox.stub(this.hoodie.account, 'db').returns('userdb');
    this.sandbox.stub(this.hoodie.config, 'get').withArgs('_remote.since').returns(10);
    this.sandbox.stub(this.hoodie.store, 'index').returns(['funk/1', '$task/2']);

    this.clock = this.sandbox.useFakeTimers(0); // '1970-01-01 00:00:00'
    hoodieRemote(this.hoodie);
    this.remote = this.hoodie.remote;
  });

  it('should open the users store with some options', function() {
    expect(this.hoodie.open).to.be.calledWith('userdb', {
      connected: true,
      prefix: '',
      since: 10,
      defaultObjectsToPush: this.hoodie.store.changedObjects,
      knownObjects: [{ type: 'funk', id: '1'}, { type: '$task', id: '2'}]
    });
  });

  describe('#subscribeToEvents', function() {
    beforeEach(function() {
      var events = {};

      this.sandbox.stub(this.hoodie, 'on', function(eventName, cb) {
        events[eventName] = cb;
      });
      this.sandbox.spy(this.hoodie, 'unbind');
      this.sandbox.spy(this.hoodie.config, 'set');
      this.remote.subscribeToEvents();
      this.hoodie.on.reset();
      this.events = events;
    });

    it('subscribes to remote:connect', function() {
      expect(this.events['remote:connect']).to.be.a(Function);
    });
    it('subscribes to store:idle on remote:connect', function() {
      this.events['remote:connect']();
      expect(this.hoodie.on).to.be.calledWith('store:idle', this.remote.push);
    });

    it('subscribes to remote:disconnect', function() {
      expect(this.events['remote:disconnect']).to.be.a(Function);
    });
    it('unbinds from store:idle on remote:disconnect', function() {
      this.events['remote:disconnect']();
      expect(this.hoodie.unbind).to.be.calledWith('store:idle', this.remote.push);
    });

    it('subscribes to remote:pull', function() {
      expect(this.events['remote:pull']).to.be.a(Function);
    });
    it('updates _remote.since on remote:pull', function() {
      this.events['remote:pull'](123);
      expect(this.hoodie.config.set).to.be.calledWith('_remote.since', 123);
    });

    it('subscribes to reconnected', function() {
      expect(this.events.reconnected).to.be.a(Function);
    });
    it('connects on reconnected', function() {
      this.events.reconnected(123);
      expect(this.remote.connect).to.be.called();
    });

    it('subscribes to account:signin', function() {
      expect(this.events['account:signin']).to.be.a(Function);
    });
    it('connects to db on account:signin', function() {
      expect(this.remote.name).to.be(undefined);
      this.hoodie.account.db.returns('dbName');
      this.events['account:signin'](123);
      expect(this.remote.name).to.be('dbName');
      expect(this.remote.connect).to.be.called();
    });

    it('subscribes to account:reauthenticated', function() {
      expect(this.events['account:reauthenticated']).to.be.a(Function);
    });
    it('connects on account:reauthenticated', function() {
      this.events['account:reauthenticated'](123);
      expect(this.remote.connect).to.be.called();
    });

    it('subscribes to account:signout', function() {
      expect(this.events['account:signout']).to.be.a(Function);
    });
    it('disconnects on account:signout', function() {
      this.events['account:signout'](123);
      expect(this.remote.disconnect).to.be.called();
    });
  });
});
