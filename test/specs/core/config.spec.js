require('../../lib/setup');
var hoodieConfig = require('../../../src/core/config');

describe('Hoodie.Config', function() {

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);
    this.hoodie.store.find.defer.resolve({
      funky: 'fresh'
    });

    hoodieConfig( this.hoodie );
    this.config = this.hoodie.config;
  });

  describe('#set(key, value)', function() {

    it('should save a $config with key: value', function() {
      this.config.set('funky', 'fresh!');

      expect(this.hoodie.store.updateOrAdd).to.be.calledWith('$config', 'hoodie', {
        funky: 'fresh!'
      }, {
        silent: false
      });
    });

    it('should make the save silent for local settings starting with _', function() {
      this.config.set('_local', 'fresh');

      expect(this.hoodie.store.updateOrAdd).to.be.calledWith('$config', 'hoodie', {
        _local: 'fresh'
      }, {
        silent: true
      });
    });

  });

  describe('#get(key)', function() {

    it('should get the config using store', function() {
      var value = this.config.get('funky');
      expect(this.hoodie.store.find).to.be.called();
      expect(value).to.eql('fresh');
    });

  });

  describe('#unset(key)', function() {

    it('should unset the config using store', function() {
      this.config.set('funky', 'fresh');
      this.config.unset('funky');

      expect(this.hoodie.store.updateOrAdd).to.be.calledWith('$config', 'hoodie', {
        funky: void 0
      }, {
        silent: false
      });
    });

  });

});
