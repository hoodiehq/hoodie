/* global hoodieConfig:true */
describe('Hoodie.Config', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    this.updateSpy = this.hoodie.store.update.returns('promise');
    this.hoodie.store.findDefer.resolve({
      funky: 'fresh'
    });

    hoodieConfig( this.hoodie );
    this.config = this.hoodie.config;
  });

  describe('#set(key, value)', function() {

    it('should save a $config with key: value', function() {
      this.config.set('funky', 'fresh!');

      expect(this.updateSpy).to.be.calledWith('$config', 'hoodie', {
        funky: 'fresh!'
      }, {
        silent: false
      });
    });

    it('should make the save silent for local settings starting with _', function() {
      this.config.set('_local', 'fresh');

      expect(this.updateSpy.calledWith('$config', 'hoodie', {
        _local: 'fresh'
      }, {
        silent: true
      })).to.be.ok();
    });

  });

  describe('#get(key)', function() {

    it('should get the config using store', function() {
      expect(this.config.get('funky')).to.eql('fresh');
      expect(this.hoodie.store.find.called).to.be.ok();
    });

  });

  describe('#unset(key)', function() {

    it('should unset the config using store', function() {
      this.config.set('funky', 'fresh');
      this.config.unset('funky');

      expect(this.updateSpy.calledWith('$config', 'hoodie', {
        funky: void 0
      }, {
        silent: false
      })).to.be.ok();
    });

  });

});
