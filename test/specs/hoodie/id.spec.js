require('../../lib/setup');

var hoodieId = require('../../../src/hoodie/id');
var config = require('../../../src/utils/config');

describe('hoodie.id()', function() {

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);
    hoodieId(this.hoodie);
    this.id = this.hoodie.id;
  });

  it('returns a random id when called the first time', function() {
    expect(typeof this.id()).to.eql('string');
    expect((this.id()).length).to.eql(7);
  });

  it.only('generates a new id only once', function() {
    config.clear();
    var id1 = this.id();
    var id2 = this.id();
    expect(id1).to.eql(id2);
  });

  it('stores the new id in config', function() {
    this.id();
    expect(this.id()).to.eql(config.get('_hoodieId'));
  });

  describe('hoodie.id.init()', function() {

    it('loads the last _hoodieId from config on initialization', function() {
      this.id.init();
      var id = this.id();
      expect(id).to.eql(config.get('_hoodieId'));
    });

    it('can\'t be initialized twice', function() {
      this.id.init();
      expect(this.id.init).to.be(undefined);
    });
  });

  describe('hoodie.id.subscribeToOutsideEvents()', function() {

    beforeEach(function() {
      var events = {};

      this.hoodie.on = function() {};

      this.sandbox.stub(this.hoodie, 'on', function(eventName, cb) {
        events[eventName] = cb;
      });

      this.id.subscribeToOutsideEvents();
      this.events = events;
    });

    it('subscribes to account:cleanup', function() {
      expect(this.events['account:cleanup']).to.be.a(Function);
    });

    it('unsets hoodieId on account:cleanup', function() {
      expect(this.id()).to.be(config.get('_hoodieId'));

      this.events['account:cleanup']();

      expect(config.get('_hoodieId')).to.be.undefined;
    });

    it('subscribes to account:signin', function() {
      expect(this.events['account:signin']).to.be.a(Function);
    });

    it('sets hoodieId on account:signin', function() {
      config.clear();
      this.events['account:signin']('joe@example.com', 'funkyId');
      expect(config.get('_hoodieId')).to.eql('funkyId');
    });

    it('can\'t be run twice', function() {
      expect(this.id.subscribeToOutsideEvents).to.be(undefined);
    });
  });

});

