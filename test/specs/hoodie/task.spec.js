require('../../lib/setup');

var hoodieTask = require('../../../src/hoodie/task');

describe('hoodie.task setup', function() {

  beforeEach(function () {
    var hoodieEventBindings = this.hoodieEventBindings = {};

    this.hoodie = {
      on: function(event, handler) {
        hoodieEventBindings[event] = handler;
      },
    };

    hoodieTask(this.hoodie);
  });


  it('sets hoodie.task', function() {
    expect(this.hoodie.task).to.be.a(Function);
  });
});

// TODO: write tests for hoodie.task and scope hoodie.task API
