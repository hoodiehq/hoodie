require('../../lib/setup');

var utils = require('../../../src/utils');
var promise = utils.promise;
var hoodieConnection = require('../../../src/hoodie/connection');

describe('checkConnection()', function() {
  it('should return pending request', function() {
    var pendingPromise = promise.defer().promise;
    var checkConnectionPromise;
    var state = {
      hoodie: {
        id: this.sandbox.stub().returns('foo'),
        request: this.sandbox.stub().returns(pendingPromise)
      }
    };
    checkConnectionPromise = hoodieConnection.checkConnection(state);
    expect(state.checkConnectionRequest).to.be(checkConnectionPromise);
  });

  it('should create and handle new request', function() {
    var defer = promise.defer();
    this.sandbox.spy(defer.promise, 'then');

    var state = {
      hoodie: {
        id: this.sandbox.stub().returns('foo'),
        request: this.sandbox.stub().returns(defer.promise)
      }
    };

    hoodieConnection.checkConnection(state);

    expect(state.hoodie.id).to.be.called();
    expect(state.hoodie.request).to.be.calledWith('GET', '/?hoodieId=foo');

    var handlers = defer.promise.then.args[0];
    expect(handlers[0]).to.be.a(Function);
    expect(handlers[1]).to.be.a(Function);
  });
});

describe('isConnected()', function() {
  it('should return connection status', function() {
    expect(hoodieConnection.isConnected({online: true})).to.be(true);
    expect(hoodieConnection.isConnected({online: false})).to.be(false);
  });
});

describe('handleConnection()', function() {
  it('should schedule connection check', function() {
    var state = {
      online: true
    };
    hoodieConnection.handleConnection(state, 1e3, 'a', true);
    expect(state.checkConnectionTimeout).to.be.a('number');
    global.clearTimeout(state.checkConnectionTimeout);
  });

  it('should update connection status', function() {
    var state = {
      hoodie: {
        trigger: this.sandbox.stub(),
      },
      online: true
    };
    hoodieConnection.handleConnection(state, 1e3, 'a', false);
    global.clearTimeout(state.checkConnectionTimeout);
    expect(state.online).not.to.be.ok();
    hoodieConnection.handleConnection(state, 1e3, 'b', true);
    global.clearTimeout(state.checkConnectionTimeout);
    expect(state.online).to.be.ok();

    expect(state.hoodie.trigger).to.be.calledTwice();
    var events = state.hoodie.trigger.args;
    expect(events[0][0]).to.be('a');
    expect(events[1][0]).to.be('b');
  });

  it('should reject promise', function() {
    var state = {
      online: false
    };
    var result = hoodieConnection.handleConnection(state, 1e3, 'a', false);
    global.clearTimeout(state.checkConnectionTimeout);
    expect(result).to.be.promise();
    expect(result).to.be.rejected();
  });

  it('should resolve promise', function() {
    var state = {
      online: true
    };
    var result = hoodieConnection.handleConnection(state, 1e3, 'a', true);
    global.clearTimeout(state.checkConnectionTimeout);
    expect(result).to.be.promise();
    expect(result).to.be.resolved();
  });
});
