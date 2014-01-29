var sinon = require('sinon');
var app = require('../../lib/index');

module.exports = {
  before: (function () {

    before(function () { });

  }()),
  beforeEach: (function () {

    beforeEach(function () {
      this.app = app;
      this.sandbox = sinon.sandbox.create();
    });

  }()),
  afterEach: (function () {

    afterEach(function () {
      this.sandbox.restore();
    });

  }()),
  after: (function () {

    after(function () {});

  }())
};
