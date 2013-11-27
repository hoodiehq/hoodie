module.exports = (function() {

  mocha.setup({globals: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']});

  before(function () {
  });

  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();
    this.MOCKS = require('../mocks/');
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  after(function () {
  });

}());

