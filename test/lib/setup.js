module.exports = (function() {

  window.mocha.setup({globals: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']});

  before(function () {
  });

  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();
    this.MOCKS = require('../mocks/');
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

