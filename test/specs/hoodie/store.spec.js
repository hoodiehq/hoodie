require('../../lib/setup');

var hoodieStore = require('../../../src/hoodie/store');

describe('hoodie.store setup', function() {

  beforeEach(function () {
    var hoodieEventBindings = this.hoodieEventBindings = {};

    this.hoodie = {
      on: function(event, handler) {
        hoodieEventBindings[event] = handler;
      }
    };
    this.sandbox.spy(this.hoodie, 'on');

    this.sandbox.stub(hoodieStore, 'bootstrapChangedObjects');
    this.sandbox.stub(hoodieStore, 'hoodieStoreApi').returns({foo: 'bar'});
    this.sandbox.stub(hoodieStore.localStore, 'save');
    this.sandbox.stub(hoodieStore.localStore, 'find');
    this.sandbox.stub(hoodieStore.localStore, 'findAll');
    this.sandbox.stub(hoodieStore.localStore, 'remove');
    this.sandbox.stub(hoodieStore.localStore, 'removeAll');

    hoodieStore(this.hoodie);
  });

  it('sets hoodie.store to hoodieStoreApi instance', function() {
    expect(this.hoodie.store).to.be.an(Object);
    expect(this.hoodie.store.foo).to.be('bar');
  });

  it('sets hoodieStoreApi backend to localStore methods', function() {
    var args = hoodieStore.hoodieStoreApi.getCall(0).args;
    expect(args[0]).to.be(this.hoodie);
    expect(args[1].validate).to.be(hoodieStore.validate);
    expect(Object.keys(args[1].backend).sort().join(',')).to.be('find,findAll,remove,removeAll,save');
  });

  it('bootstraps changed objects', function() {
    expect(hoodieStore.bootstrapChangedObjects).to.be.called();
  });

  it ('subscribes to "account:signup" event', function() {
    expect(this.hoodieEventBindings['account:signup']).to.be.a(Function);
  });
  it ('subscribes to "account:movedata" event', function() {
    expect(this.hoodieEventBindings['account:movedata']).to.be.a(Function);
  });
  it ('subscribes to "account:cleanup" event', function() {
    expect(this.hoodieEventBindings['account:cleanup']).to.be.a(Function);
  });
  it ('subscribes to "remote:bootstrap:start" event', function() {
    expect(this.hoodieEventBindings['remote:bootstrap:start']).to.be.a(Function);
  });
  it ('subscribes to "remote:bootstrap:end" event', function() {
    expect(this.hoodieEventBindings['remote:bootstrap:end']).to.be.a(Function);
  });
  it ('subscribes to "remote:bootstrap:error" event', function() {
    expect(this.hoodieEventBindings['remote:bootstrap:error']).to.be.a(Function);
  });
  it ('subscribes to "remote:change" event', function() {
    expect(this.hoodieEventBindings['remote:change']).to.be.a(Function);
  });
  it ('subscribes to "remote:push" event', function() {
    expect(this.hoodieEventBindings['remote:push']).to.be.a(Function);
  });

});

describe('hoodie.store.findAll', function() {
  it('accepts filter function', function(done) {
    var state = {
      cachedObject: {
        'note/123': { type: 'note', id: '123', isPublic: true },
        'note/456': { type: 'note', id: '456', isPublic: false }
      },
      dirty: {},
      hoodie: {
        store: {
          isBootstrapping: function () { return false; },
          trigger: function() {},
          index: function() { return ['note/123', 'note/456']; }
        },
        id: function() { return 'hoodieid'; }
      }
    };
    var findPublic = function(object) {
      return object.isPublic;
    };

    hoodieStore.localStore.findAll(state, findPublic)
    .done(function(objects) {
      expect(objects.length).to.be(1);
      expect(objects[0].id).to.be('123');
      done();
    }).catch(done);
  });
});
