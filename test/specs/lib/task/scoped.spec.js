require('../../../lib/setup');

var scopedTaskApi = require('../../../../src/lib/task/scoped');
describe('scopedTaskApi setup', function() {
  beforeEach(function() {
    this.hoodie = {};
    this.taskApi = {};
    this.options = {};
    this.scopedTaskApi = scopedTaskApi(this.hoodie, this.taskApi, this.options);
  });

  it('returns a scopedTaskApi instance', function() {
    expect(this.scopedTaskApi).to.be.an(Object);
  });
});
