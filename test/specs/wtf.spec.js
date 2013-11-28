describe('WTF', function() {

  before(function () {
    this.MOCKS = require('../mocks/');
  });

  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();
    this.sandbox.useFakeServer();

    this.sandbox.server.respondWith(
      'GET', '/_api', [
        200,
        {'Content-Type': 'application-json'},
        JSON.stringify({})
      ]
    );

    this.hoodie = this.MOCKS.hoodie.apply(this);
    var hoodieConfig = require('../../src/hoodie/config');

    // this.updateOrAddSpy = this.hoodie.store.updateOrAdd.returns('promise');
    // this.hoodie.store.findDefer.resolve({
    //   funky: 'fresh'
    // });

    hoodieConfig( this.hoodie );
    this.config = this.hoodie.config;
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  after(function () {
  });

  it('', function() {

  });

  it('should save a $config with key: value', function() {
    this.config.set('funky', 'fresh!');

    expect(this.hoodie.store.updateOrAdd).to.be.calledWith('$config', 'hoodie', {
      funky: 'fresh!'
    }, {
      silent: false
    });
  });
});

