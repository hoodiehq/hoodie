require('../../../lib/setup');

var remoteStore = require('../../../../src/lib/store/remote');
describe('remoteStore setup', function() {
  beforeEach(function() {
    this.hoodie = {};
    this.options = {
      name: 'remoteMock'
    };
    this.remote = remoteStore(this.hoodie, this.options);
  });

  it('returns a remote remote instance', function() {
    expect(this.remote).to.be.an(Object);
  });
});


describe('remote bootstrapping', function() {
  beforeEach(function() {
    this.hoodie = {
      trigger: function() {}
    };
    this.options = {
      name: 'remoteMock'
    };
    this.remote = remoteStore(this.hoodie, this.options);
  });

  it('should bootstrap only once', function() {
    var promise1, promise2;
    var bootstrapPromise = {
      then: function() { return bootstrapPromise; }
    };

    // sanity check
    this.sandbox.stub(this.remote, 'bootstrap').returns(bootstrapPromise);
    expect(this.remote.isConnected()).to.be(false);

    // this.remote.bootstrap.reset();
    promise1 = this.remote.connect();
    promise2 = this.remote.connect();
    expect(this.remote.bootstrap.callCount).to.be(1);

    // sanity checks
    expect(promise1).to.be.pending();
    expect(promise2).to.be.pending();
  });
});

describe('remoteApi.request', function() {
  // TODO: add tests
});
describe('remoteApi.isKnownObject', function() {
  // TODO: add tests
});
describe('remoteApi.markAsKnownObject', function() {
  // TODO: add tests
});
describe('remoteApi.connect', function() {
  // TODO: add tests
});
describe('remoteApi.disconnect', function() {
  beforeEach(function() {
    this.hoodie = {
      trigger: function() {}
    };
    this.options = {
      name: 'remoteMock'
    };
    this.remote = remoteStore(this.hoodie, this.options);
  });

  it('should return a promise', function() {
    var promise = this.remote.disconnect();
    expect(promise.then).to.be.a(Function);
  });
});
describe('remoteApi.isConnected', function() {
  // TODO: add tests
});
describe('remoteApi.getSinceNr', function() {
  // TODO: add tests
});
describe('remoteApi.bootstrap', function() {
  // TODO: add tests
});
describe('remoteApi.pull', function() {
  // TODO: add tests
});
describe('remoteApi.push', function() {
  // TODO: add tests
});
describe('remoteApi.sync', function() {
  // TODO: add tests
});
