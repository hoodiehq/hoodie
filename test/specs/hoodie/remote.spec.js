require('../../lib/setup');

var configMock = require('../../mocks/utils/config');
global.stubRequire('src/utils/config', configMock);

var hoodieAccountRemote = require('../../../src/hoodie/remote');

describe('hoodie.remote', function() {
  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);

    this.openConnectSpy = sinon.spy();
    this.hoodie.open.returns({
      connect: this.openConnectSpy,
      disconnect: sinon.spy(),
      push: sinon.spy()
    });
    configMock.get.withArgs('_remote.since').returns(10);
    this.hoodie.store.index.returns(['funk/1', '$task/2']);

    this.clock = this.sandbox.useFakeTimers(0); // '1970-01-01 00:00:00'
    hoodieAccountRemote(this.hoodie);
    this.hoodie.remote.init();
    this.remote = this.hoodie.remote;
    this.openArgs = this.hoodie.open.args[0];
  });

  it('should not allow to re-initialize', function() {
    expect(this.remote.init).to.be(undefined);
  });

  it('should open the users store', function() {
    var name = this.openArgs[0];
    expect(name).to.eql('userdb');
  });

  it('should open the users store with connected = true', function() {
    var options = this.openArgs[1];
    expect(options.connected).to.eql( true );
  });

  it('should open the users store with prefix = ""', function() {
    var options = this.openArgs[1];
    expect(options.prefix).to.eql( '' );
  });

  it('should pass function that returns current since sequence number', function() {
    var args = this.openArgs[1];
    expect(args.since()).to.eql(10);
  });


  it('should open the users store with defaultObjectsToPush', function() {
    var options = this.openArgs[1];
    expect(options.defaultObjectsToPush).to.eql( this.hoodie.store.changedObjects );
  });

  it('should open the users store with knownObjects', function() {
    var options = this.openArgs[1];
    expect(options.knownObjects).to.eql( [{ type: 'funk', id: '1'}, { type: '$task', id: '2'}] );
  });

  describe('#connect', function() {
    _when('user has account', function() {
      beforeEach(function() {
        this.hoodie.account.hasAccount.returns(true);
      });

      it('should connect to user\'s database (ignoring passed argument)', function() {
        this.remote.connect('whatever');
        expect(this.openConnectSpy).to.be.calledWith('userdb');
      });
    });

    _when('user has no account', function() {
      beforeEach(function() {
        this.hoodie.account.hasAccount.returns(false);
      });

      it('should connect to user\'s database (ignoring passed argument)', function() {
        var promise = this.remote.connect();
        expect(this.openConnectSpy).to.not.be.called();
        expect(promise).to.be.rejectedWith('User has no database to connect to');
      });
    });
  });

  describe('#trigger', function() {
    it('should prefix events with "remote"', function() {
      expect(this.remote.name).to.be(undefined);
      this.remote.trigger('funky', 'fresh');
      expect(this.hoodie.trigger).to.be.calledWith('remote:funky', 'fresh');
    });
  });

  describe('#on', function() {
    it('should prefix events with "remote"', function() {
      expect(this.remote.name).to.be(undefined);
      var cb = function() {};
      this.remote.on('funky fresh', cb);
      expect(this.hoodie.on).to.be.calledWith('remote:funky remote:fresh', cb);
    });
  });

  describe('#unbind', function() {
    it('should prefix events with "remote"', function() {
      expect(this.remote.name).to.be(undefined);
      var cb = function() {};
      this.remote.unbind('funky fresh', cb);
      expect(this.hoodie.unbind).to.be.calledWith('remote:funky remote:fresh', cb);
    });
  });

  describe('#subscribeToOutsideEvents', function() {
    beforeEach(function() {
      var events = {};

      this.hoodie.on = function() {};
      this.sandbox.stub(this.hoodie, 'on', function(eventName, cb) {
        events[eventName] = cb;
      });
      this.remote.subscribeToOutsideEvents();
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

    it('subscribes to reconnected', function() {
      expect(this.events.reconnected).to.be.a(Function);
    });
    it('connects on reconnected when user has account', function() {
      this.hoodie.account.hasAccount.returns(true);
      this.hoodie.account.db.returns('dbnamehere');
      this.events.reconnected();
      expect(this.openConnectSpy).to.be.calledWith('dbnamehere');
    });
    it('does not connect on reconnected when user has no account', function() {
      this.hoodie.account.hasAccount.returns(false);
      this.hoodie.account.db.returns('dbnamehere');
      this.events.reconnected();
      expect(this.openConnectSpy).to.not.be.called();
    });
    it('disconnects on disconnected', function() {
      this.events.disconnected();
      expect(this.remote.disconnect).to.be.called();
    });

    it('subscribes to account:signin', function() {
      expect(this.events['account:signin']).to.be.a(Function);
    });
    it('connects to db on account:signin', function() {
      this.hoodie.account.hasAccount.returns(true);
      this.hoodie.account.db.returns('dbName');
      this.events['account:signin'](123);
      expect(this.openConnectSpy).to.be.calledWith('dbName');
    });
    it('subscribes to account:signin:anonymous', function() {
      expect(this.events['account:signin:anonymous']).to.be.a(Function);
    });
    it('connects to db on account:signin:anonymous', function() {
      this.hoodie.account.hasAccount.returns(true);
      this.hoodie.account.db.returns('dbName');
      this.events['account:signin:anonymous'](123);
      expect(this.openConnectSpy).to.be.calledWith('dbName');
    });

    it('subscribes to account:reauthenticated', function() {
      expect(this.events['account:reauthenticated']).to.be.a(Function);
    });
    it('connects on account:reauthenticated', function() {
      this.hoodie.account.hasAccount.returns(true);
      this.hoodie.account.db.returns('dbName');
      this.events['account:reauthenticated'](123);
      expect(this.openConnectSpy).to.be.calledWith('dbName');
    });

    it('subscribes to account:signout', function() {
      expect(this.events['account:signout']).to.be.a(Function);
    });
    it('disconnects on account:signout', function() {
      this.events['account:signout']('joe@example.com');
      expect(this.remote.disconnect).to.be.called();
    });

    it('subscribes to account:changeusername', function() {
      expect(this.events['account:changeusername']).to.be.a(Function);
    });

    it('connects on account:changeusername', function() {
      this.hoodie.account.hasAccount.returns(true);
      this.hoodie.account.db.returns('dbName');
      this.events['account:changeusername'](123);
      expect(this.openConnectSpy).to.be.calledWith('dbName');
    });
  });
});
