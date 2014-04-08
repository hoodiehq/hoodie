require('../../lib/setup');

global.unstubRequire('src/utils/local_storage_wrapper');
var localStorageWrapper = require('../../../src/utils/local_storage_wrapper');

describe('localStorageWrapper', function() {

  beforeEach(function() {

    // see https://github.com/pivotal/jasmine/issues/299
    Object.defineProperty(localStorage, 'setItem', { writable: true });
    Object.defineProperty(localStorage, 'getItem', { writable: true });
    Object.defineProperty(localStorage, 'removeItem', { writable: true });
    Object.defineProperty(localStorage, 'key', { writable: true });
    localStorage.setItem = function() {};
    localStorage.getItem = function() {};
    localStorage.removeItem = function() {};
    localStorage.key = function() {};
    this.sandbox.stub(localStorage, 'getItem');
    this.sandbox.stub(localStorage, 'setItem');
    this.sandbox.stub(localStorage, 'removeItem');
    this.sandbox.stub(localStorage, 'key');
  });

  // 
  describe('#setObject(key, object)', function() {
    it('should write an object to localStorage', function() {
      localStorageWrapper.setObject('key', {funky: 'fresh'});
      expect(localStorage.setItem).to.be.calledWith('key', '{"funky":"fresh"}');
    });
  });

  // 
  describe('#getObject(key, object)', function() {
    _when('key exists in localStorage and has valid JSON', function() {
      beforeEach(function() {
        localStorage.getItem.returns('{"funky":"freshness"}');
      });
      it('should return the object', function() {
        var object = localStorageWrapper.getObject('key');
        expect(object).to.eql({funky:'freshness'});
      });
    });
    _when('key does not exist in localStorage', function() {
      beforeEach(function() {
        localStorage.getItem.returns(null);
      });
      it('should return null', function() {
        var object = localStorageWrapper.getObject('key');
        expect(object).to.be(null);
      });
    });
    
  });
});
