require('../../../lib/setup');

// stub the requires before loading the actual module
var eventsMixin = sinon.spy();
global.stubRequire('src/lib/events', eventsMixin);

global.unstubRequire('src/lib/task/scoped');
var hoodieScopedTaskFactory = require('../../../../src/lib/task/scoped');

describe('hoodieScopedTaskFactory', function() {

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);
    this.task = this.MOCKS.task.apply(this);
  });

  _when('scoped with type = "message"', function() {
    beforeEach(function() {
      var options = { type: 'message' };
      this.scopedTask = hoodieScopedTaskFactory(this.hoodie, this.task, options );
    });

    it('scopes start method to type "message"', function() {
      this.scopedTask.start({title: 'milk!'});
      expect(this.task.start).to.be.calledWith('message', { title: 'milk!'});
    });

    it('scopes cancel method to type "message"', function() {
      this.scopedTask.cancel('abc');
      expect(this.task.cancel).to.be.calledWith('message', 'abc');
    });

    it('scopes cancelAll method to type "message"', function() {
      this.scopedTask.cancelAll();
      expect(this.task.cancelAll).to.be.calledWith('message');
    });

    it('scopes restart method to type "message"', function() {
      this.scopedTask.restart('abc', { title: 'Nutella' });
      expect(this.task.restart).to.be.calledWith('message', 'abc', { title: 'Nutella' });
    });

    it('scopes restartAll method to type "message"', function() {
      this.scopedTask.restartAll({ title: '2 × Nutella' });
      expect(this.task.restartAll).to.be.calledWith('message', { title: '2 × Nutella' });
    });

    it('adds event API', function() {
      expect(eventsMixin).to.be.calledWith(this.hoodie, { context : this.scopedTask, namespace: 'task:message' });
    });
  }); // 'when scoped by type only'

  _when('scoped with type = "message" & id = "abc"', function() {
    beforeEach(function() {
      var options = {
        type : 'message',
        id : 'abc'
      };
      this.scopedTask = hoodieScopedTaskFactory(this.hoodie, this.task, options );
    });

    it('does not have an start method', function() {
      expect(this.scopedTask.start).to.be(undefined);
    });

    it('scopes cancel method to type "message" & id "abc"', function() {
      this.scopedTask.cancel();
      expect(this.task.cancel).to.be.calledWith('message', 'abc');
    });

    it('does not have an cancelAll method', function() {
      expect(this.scopedTask.cancelAll).to.be(undefined);
    });

    it('scopes restart method to type "message" & id "abc"', function() {
      this.scopedTask.restart({ title: 'Nutella' });
      expect(this.task.restart).to.be.calledWith('message', 'abc', { title: 'Nutella' });
    });

    it('does not have an restartAll method', function() {
      expect(this.scopedTask.restartAll).to.be(undefined);
    });

    it('adds event API', function() {
      expect(eventsMixin).to.be.calledWith(this.hoodie, { context : this.scopedTask, namespace: 'task:message:abc' });
    });
  }); // 'when scoped by type only'
});

