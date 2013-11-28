require('../lib/setup');
describe('WTF', function() {

  beforeEach(function () {
    this.hoodie = this.MOCKS.hoodie.apply(this);
    var hoodieConfig = require('../../src/hoodie/config');

    // this.updateOrAddSpy = this.hoodie.store.updateOrAdd.returns('promise');
    // this.hoodie.store.findDefer.resolve({
    //   funky: 'fresh'
    // });

    hoodieConfig( this.hoodie );
    this.config = this.hoodie.config;
  });

  _when('I am funky', function() {
    it('should save a $config with key: value', function() {
      this.config.set('funky', 'fresh!');

      expect(this.hoodie.store.updateOrAdd).to.be.calledWith('$config', 'hoodie', {
        funky: 'fresh!'
      }, {
        silent: false
      });
    });
  });
});

