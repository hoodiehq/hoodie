window.mocha.setup({
  globals: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']
});

module.exports = (function() {

  before(function () {
    this.MOCKS = require('../mocks/');
    this.FIXTURES = require('../fixtures/');
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
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  after(function () {
  });

}());

