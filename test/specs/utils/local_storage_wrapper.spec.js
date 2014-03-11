require('../../lib/setup');

global.unstubRequire('src/utils/local_storage_wrapper');
var localStorageWrapper = require('../../../src/utils/local_storage_wrapper');

describe('localStorageWrapper', function() {

  beforeEach(function() {
  });

  it('should be funky!', function() {
    expect(localStorageWrapper).to.be('funky');
  });

  //
  describe('#patchIfNotPersistant', function() {
    it('can only be run once', function() {
      localStorageWrapper.patchIfNotPersistant();
      expect( localStorageWrapper.patchIfNotPersistant ).to.eql(undefined);
    });
  }); // patchIfNotPersistant

  // 
  describe('#setObject(key, object)', function() {
    it('should write the object to localStorage, but without type & id attributes', function() {
      expect('setObject').to.be('tested');
      // var object = getLastSavedObject();
      // expect(object.name).to.be('test');
      // expect(object.type).to.be(undefined);
      // expect(object.id).to.be(undefined);
    });
  });
});
