window.mocha.setup({globals: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']});

module.exports = function(wahtTheFuck, specs) {
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

  });

  afterEach(function () {
    this.sandbox.restore();
  });

  after(function () {
  });

  describe(wahtTheFuck, specs);
};
