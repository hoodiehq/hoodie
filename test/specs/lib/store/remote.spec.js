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
  // TODO: add tests
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
