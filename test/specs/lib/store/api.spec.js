require('../../../lib/setup');

var hoodieStoreApi = require('../../../../src/lib/store/api');
describe('storeApi setup', function() {
  beforeEach(function() {
    this.hoodie = {};
    this.options = {
      name: 'storeMock',
      backend: {
        save: this.sandbox.stub(),
        find: this.sandbox.stub(),
        findAll: this.sandbox.stub(),
        remove: this.sandbox.stub(),
        removeAll: this.sandbox.stub()
      }
    };
    this.store = hoodieStoreApi(this.hoodie, this.options);
  });

  it('returns a store instance', function() {
    expect(this.store).to.be.an(Object);
  });
});

describe('storeApi.save', function() {
  // TODO: add tests
});
describe('storeApi.add', function() {
  // TODO: add tests
});
describe('storeApi.find', function() {
  // TODO: add tests
});
describe('storeApi.findOrAdd', function() {
  // TODO: add tests
});
describe('storeApi.findAll', function() {
  // TODO: add tests
});
describe('storeApi.update', function() {
  // TODO: add tests
});
describe('storeApi.updateOrAdd', function() {
  // TODO: add tests
});
describe('storeApi.updateAll', function() {
  // TODO: add tests
});
describe('storeApi.remove', function() {
  // TODO: add tests
});
describe('storeApi.removeAll', function() {
  // TODO: add tests
});
describe('storeApi.decoratePromises', function() {
  // TODO: add tests
});
