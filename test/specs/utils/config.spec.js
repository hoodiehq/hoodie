require('../../lib/setup');

var config = require('../../../src/utils').config;

describe('config', function() {

  describe('#set(key, value)', function() {

    it('should save a $config with key: value', function() {
      config.set('funky', 'fresh!');
      expect(config.get('funky')).to.eql('fresh!');
    });

  });

  describe('#get(key)', function() {
    it('should get the config from memory cache', function() {
      expect(config.get('funkyget')).to.eql(undefined);

      config.set('funkyget', 'freshget');

      expect(config.get('funkyget')).to.be('freshget');
    });
  });

  describe('#unset(key)', function() {

    it('should unset the config', function() {
      config.clear();
      config.set('funky', 'fresh');
      config.unset('funky');

      expect(config.get('funky')).to.eql(undefined);
    });

  });

  describe('#clear(key)', function() {

    it('should unset the config', function() {
      config.set('funky', 'fresh');
      config.clear();

      expect(config.get('funky')).to.eql(undefined);
    });

  });

});

