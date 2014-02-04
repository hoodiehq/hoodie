require('../../lib/setup');

var generateIdMock = require('../../mocks/utils/generate_id');
global.stubRequire('src/utils/generate_id', generateIdMock);
var hoodieId = require('../../../src/hoodie/id');

describe('hoodie.id()', function() {

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);
    hoodieId(this.hoodie);
    this.id = this.hoodie.id;
    generateIdMock.returns('randomid');
  });
  it('returns a random id when called the first time', function() {
    var id = this.id();
    expect( id ).to.eql('randomid');
  });

  it('generates a new id only once', function() {
    generateIdMock.reset();
    var id1 = this.id();
    var id2 = this.id();
    expect(generateIdMock.calledOnce).to.be.ok();
    expect(id1).to.eql(id2);
  });

  it('stores the new id in config', function() {
    this.hoodie.config.set.reset();
    this.hoodie.config.clear.reset();
    this.id();
    expect(this.hoodie.config.set).to.be.calledWith('_hoodieId', 'randomid');
  });
  describe('hoodie.id.init()', function() {
    it('loads the last hoodieId from config on initialization', function() {
      this.hoodie.config.get.resetBehavior();
      this.hoodie.config.get.returns('lastHoodieId');
      this.id.init();
      var id = this.id();
      expect(id).to.be('lastHoodieId');
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
      generateIdMock.returns('currentId');
      var currentId = this.id();
      expect(currentId).to.be('currentId');

      this.events['account:cleanup']();
      this.hoodie.config.set.reset();
      generateIdMock.returns('newId');
      var newId = this.id();
      
      expect(newId).to.be('newId');
      expect(this.hoodie.config.set).to.be.calledWith('_hoodieId', 'newId');
    });

    it('subscribes to account:signin', function() {
      expect(this.events['account:signin']).to.be.a(Function);
    });

    it('sets hoodieId on account:signin', function() {
      this.hoodie.config.set.reset();
      this.events['account:signin']('joe@example.com', 'funkyId');
      expect(this.hoodie.config.set).to.be.calledWith('_hoodieId', 'funkyId');
      expect( this.id() ).to.be('funkyId');
    });

    it('can\'t be run twice', function() {
      expect(this.id.subscribeToOutsideEvents).to.be(undefined);
    });
  });

});
