require('../../lib/setup');

var hoodieConfig = require('../../../src/hoodie/config');

describe('Hoodie.Config', function() {

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);

    hoodieConfig(this.hoodie);

    this.config = this.hoodie.config;
  });

  describe('#set(key, value)', function() {

    it('should save a $config with key: value', function() {
      this.config.set('funky', 'fresh!');

      expect(this.config.get('funky')).to.eql('fresh!');
    });

    it('should clear if _hoodieId gets set', function() {
      global.localStorage.clear();
      this.config.set('_hoodieId', 'funky');
      expect(this.config.get('_hoodieId')).to.eql('funky');
    });
  });

  describe('#get(key)', function() {
    it('should get the config from memory cache', function() {
      var value = this.config.get('whatever');
      expect(value).to.be(undefined);

      this.config.set('funky', 'fresh');
      value = this.config.get('funky');
      expect(value).to.be('fresh');
    });
  });

  describe('#unset(key)', function() {

    it('should unset the config using store', function() {
      this.config.set('funky', 'fresh');
      this.config.unset('funky');

      expect(this.config.get('funky')).to.eql(undefined);
    });

  });

});
