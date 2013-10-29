var expect = require('expect.js');
var workers = require('../../lib/workers');

describe('workers', function () {

  it('should have a startAll property', function () {
    expect(workers).to.have.property('startAll');
  });

  it('should have a startWorker property', function () {
    expect(workers).to.have.property('startWorker');
  });

  it('should have a getWorkerNames property', function () {
    expect(workers).to.have.property('getWorkerNames');
  });

});
