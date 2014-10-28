require('../../lib/setup');

var hoodieAccountRemote = require('../../../src/hoodie/remote');

describe('hoodie.remote setup', function() {

  beforeEach(function () {
    var hoodieEventBindings = this.hoodieEventBindings = {};

    this.openMock = {
      connect: this.sandbox.stub(),
      disconnect: this.sandbox.stub(),
      push: this.sandbox.stub()
    };
    this.hoodie = {
      on: function(event, handler) {
        hoodieEventBindings[event] = handler;
      },
      unbind: this.sandbox.stub(),
      open: this.sandbox.stub().returns(this.openMock),
      account: {
        db: this.sandbox.stub().returns('db_name')
      },
      store: {
        changedObjects: [],
        index: this.sandbox.stub().returns([])
      }
    };
    this.sandbox.spy(this.hoodie, 'on');

    hoodieAccountRemote(this.hoodie);
  });


  it('sets hoodie.remote', function() {
    expect(this.hoodie.remote).to.be.an(Object);
  });

  it ('binds to store:idle event on remote:connect event', function() {
    expect(this.hoodieEventBindings['remote:connect']).to.be.a(Function);
    this.hoodieEventBindings['remote:connect']();
    expect(this.hoodie.on).to.be.calledWith('store:idle', this.openMock.push);
  });
  it ('unbinds from store:idle event on remote:disconnect event', function() {
    expect(this.hoodieEventBindings['remote:disconnect']).to.be.a(Function);
    this.hoodieEventBindings['remote:disconnect']();
    expect(this.hoodie.unbind).to.be.calledWith('store:idle', this.openMock.push);
  });
  it ('disconnects on disconnected event', function() {
    expect(this.hoodieEventBindings.disconnected).to.be(this.openMock.disconnect);
  });
  it ('connects on reconnected event', function() {
    expect(this.hoodieEventBindings.reconnected).to.be(this.openMock.connect);
  });
  it ('connects on account:signup event', function() {
    expect(this.hoodieEventBindings['account:signup']).to.be(this.openMock.connect);
  });
  it ('connects on account:signup:anonymous event', function() {
    expect(this.hoodieEventBindings['account:signup:anonymous']).to.be(this.openMock.connect);
  });
  it ('connects on account:signin event', function() {
    expect(this.hoodieEventBindings['account:signin']).to.be(this.openMock.connect);
  });
  it ('connects on account:signin:anonymous event', function() {
    expect(this.hoodieEventBindings['account:signin:anonymous']).to.be(this.openMock.connect);
  });
  it ('connects on account:changeusername event', function() {
    expect(this.hoodieEventBindings['account:changeusername']).to.be(this.openMock.connect);
  });
  it ('connects on account:reauthenticated event', function() {
    expect(this.hoodieEventBindings['account:reauthenticated']).to.be(this.openMock.connect);
  });
  it ('disconnects to account:signout event', function() {
    expect(this.hoodieEventBindings['account:signout']).to.be(this.openMock.disconnect);
  });
});
