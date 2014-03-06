require('../../lib/setup');

var localStorageWrapperMock = require('../../mocks/utils/local_storage_wrapper');
global.stubRequire('src/utils/local_storage_wrapper', localStorageWrapperMock);

global.unstubRequire('src/utils/config');
var config = require('../../../src/utils/config');

describe('config', function() {

  beforeEach(function() {
    localStorageWrapperMock.setObject.reset();
    localStorageWrapperMock.removeItem.reset();
  });

  describe('#set(key, value)', function() {
    it('should save a $config with key: value', function() {
      config.set('funky', 'fresh!');
      expect(localStorageWrapperMock.setObject).to.be.calledWith('_hoodie_config', {funky: 'fresh!'});
    });
  });

  describe('#get(key)', function() {
    it('should get the config from memory cache', function() {
      var value = config.get('funkyget');
      expect(value).to.be(undefined);

      config.set('funkyget', 'freshget');
      value = config.get('funkyget');
      expect(value).to.be('freshget');
    });
  });

  describe('#unset(key)', function() {

    it('should unset the config', function() {
      config.clear();
      config.set('funky', 'fresh');
      config.set('foo', 'bar');
      expect(localStorageWrapperMock.setObject).to.be.calledWith('_hoodie_config', {funky: 'fresh', foo: 'bar'});
      config.unset('funky');
      expect(localStorageWrapperMock.setObject).to.be.calledWith('_hoodie_config', {foo: 'bar'});
    });
  });

  describe('#clear(key)', function() {

    it('should unset the config', function() {
      config.clear();
      expect(localStorageWrapperMock.removeItem).to.be.calledWith('_hoodie_config');
    });
  });
});
