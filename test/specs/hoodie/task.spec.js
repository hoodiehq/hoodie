require('../../lib/setup');

// stub the requires before loading the actual module
var eventsMixin = sinon.spy();
var hoodieScopedTaskFactory = sinon.stub();
global.stubRequire('src/lib/events', eventsMixin);

global.stubRequire('src/lib/task/scoped', hoodieScopedTaskFactory);
global.unstubRequire('src/hoodie/task');
var hoodieTask = require('../../../src/hoodie/task');

var extend = require('extend');

describe('hoodie.task', function() {

  beforeEach(function() {
    var eventsMixin = this.MOCKS.events.apply(this);

    this.hoodie = this.MOCKS.hoodie.apply(this);
    this.clock = this.sandbox.useFakeTimers(0); // '1970-01-01 00:00:00'
    hoodieTask(this.hoodie);
    this.task = this.hoodie.task;
    extend(this.task, eventsMixin);
  });

  it('should add events API', function() {
    expect(eventsMixin).to.be.calledWith(this.hoodie, {
      context: this.hoodie.task,
      namespace: 'task'
    });
  });

  describe('#start()', function() {
    beforeEach(function() {
      this.hoodie.account.hasAccount.returns(true);
    });

    _when('user has account', function() {
      beforeEach(function() {
        this.promise = this.task.start('message', {
          to: 'joe',
          text: 'hi'
        });
      });

      it('should add a new $task object using hoodie.store.add', function() {
        expect(this.hoodie.store.add).to.be.calledWith('$message', {
          to: 'joe',
          text: 'hi'
        });
      });

      it('should reject when hoodie.store.add rejects', function() {
        this.hoodie.store.add.defer.reject('error');
        expect(this.promise).to.be.rejectedWith('error');
      });

      _when('hoodie.store.add succeeds', function() {
        beforeEach(function() {
          this.hoodie.store.add.defer.resolve({
            type: 'message',
            id: '123'
          });
        });

        it('should not resolve directly', function() {
          // instead, it should wait until the worker completes the task
          expect(this.promise).to.be.pending();
        });

        _and('it was finished', function() {

          // meaning that the task could not be finished, the reason gets stored in `$error`
          beforeEach(function() {
            var args = this.hoodie.store.on.args[0];
            expect(args[0]).to.eql('remove');
            this.removeCallback = args[1];
            this.removeCallback({
              type: '$message',
              id: '123',
              $processedAt: 'now'
            });
          });

          it('should resolve', function() {
            expect(this.promise).to.be.resolvedWith({
              type: 'message',
              id: '123',
              $processedAt: 'now'
            });
          });
        });

        _but('it was removed before it was finished', function() {

          // meaning that the task could not be finished, the reason gets stored in `$error`
          beforeEach(function() {
            var args = this.hoodie.store.on.args[0];
            expect(args[0]).to.eql('remove');
            this.removeCallback = args[1];
            this.removeCallback({
              type: '$message',
              id: '123'
            });
          });

          it('should reject', function() {
            expect(this.promise).to.be.rejectedWith({
              'message': 'Task has been aborted',
              'task': {
                'type': 'message',
                'id': '123'
              },
              'name': 'HoodieError'
            });
          });
        });

        _but('there is an error', function() {
          // meaning that the task could not be finished, the reason gets stored in `$error`
          beforeEach(function() {
            var args = this.hoodie.store.on.args[1];
            expect(args[0]).to.eql('update');
            this.errorCallback = args[1];
            this.errorCallback({
              type: '$message',
              id: '123',
              $error: 'oops'
            });
          });

          it('should reject', function() {
            expect(this.promise).to.be.rejectedWith({
              message: 'oops',
              name: 'HoodieError'
            });
          });
        });
      });
    });

    _when('user has no account', function() {
      beforeEach(function() {
        this.hoodie.account.hasAccount.returns(false);
        this.promise = this.task.start('message', {
          to: 'joe',
          text: 'hi'
        });
      });

      it('should sign up for an anonymous account', function() {
        expect(this.hoodie.account.anonymousSignUp).to.be.called();
      });

      it('rejects if signup fails', function() {
        this.hoodie.account.anonymousSignUp.defer.reject('nope.');
        expect(this.promise).to.be.rejectedWith('nope.');
      });

      it('should call task.start again if signup succeeded', function() {
        this.sandbox.stub(this.task, 'start').returns('funk');
        this.hoodie.account.anonymousSignUp.defer.resolve();
        expect(this.task.start).to.be.calledWith('message', {
          to: 'joe',
          text: 'hi'
        });
        expect(this.promise).to.be.resolvedWith('funk');
      });
    });
  });

  describe('#abort()', function() {
    beforeEach(function() {
      this.promise = this.task.abort('message', '123');
    });

    it('should add a new $task object using hoodie.store.add', function() {
      expect(this.hoodie.store.update).to.be.calledWith('$message', '123', {
        abortedAt: now()
      });
    });

    it('should reject when hoodie.store.add rejects', function() {
      this.hoodie.store.update.defer.reject('error');
      expect(this.promise).to.be.rejectedWith('error');
    });

    _when('hoodie.store.update succeeds (task has not been synced yet)', function() {
      beforeEach(function() {
        this.hoodie.store.update.defer.resolve({
          type: '$message',
          id: '123'
        });
      });

      it('should remove the task from store', function() {
        // instead, it should wait until the worker completes the task
        expect(this.hoodie.store.remove).to.be.calledWith('$message', '123');
      });

      _when('removing task from store fails', function() {
        beforeEach(function() {
          this.hoodie.store.remove.defer.reject('removeError');
        });

        it('should reject', function() {
          expect(this.promise).to.be.rejectedWith('removeError');
        });
      });

      _when('removing task from store succeeds', function() {
        beforeEach(function() {
          this.hoodie.store.remove.defer.resolve('removeSuccess');
        });

        it('should resolve', function() {
          expect(this.promise).to.be.resolvedWith('removeSuccess');
        });
      });
    });

    _when('hoodie.store.update succeeds (task has been synced already)', function() {
      beforeEach(function() {
        this.hoodie.store.update.defer.resolve({
          type: '$message',
          id: '123',
          _rev: '1-234'
        });
      });

      it('should remove the task from store', function() {
        // instead, it should wait until the worker completes the task
        expect(this.hoodie.store.remove).to.be.calledWith('$message', '123');
      });

      _when('removing task from store fails', function() {
        beforeEach(function() {
          this.hoodie.store.remove.defer.reject('removeError');
        });

        it('should reject', function() {
          expect(this.promise).to.be.rejectedWith('removeError');
        });
      });

      _when('removing task from store succeeds', function() {
        beforeEach(function() {
          this.hoodie.store.remove.defer.resolve('removeSuccess');
          this.syncEventCallback = this.hoodie.one.lastCall.args[1];
        });

        it('should not resolve yet', function() {
          expect(this.promise).to.be.pending();
        });

        it('should resolve when on store:sync:message:123 event', function() {
          this.syncEventCallback('done!');
          expect(this.promise).to.be.resolvedWith('done!');
        });
      });
    });
  });

  describe('#restart(type, id, update)', function() {
    beforeEach(function() {
      this.abortDefer = this.hoodie.defer();
      this.sandbox.stub(this.hoodie.task, 'abort').returns(this.abortDefer.promise());
      this.sandbox.stub(this.hoodie.task, 'start');
      this.promise = this.hoodie.task.restart('message', '123', {
        extra: 'creme'
      });
    });

    it('should abort a running task', function() {
      expect(this.hoodie.task.abort).to.be.calledWith('message', '123');
    });

    it('rejects with abort fails', function() {
      this.abortDefer.reject('nope.');
      expect(this.promise).to.be.rejectedWith('nope.');
    });

    _when('aborting task succeeds', function() {
      beforeEach(function() {
        this.abortDefer.resolve({
          type: 'message',
          id: '123',
          text: 'funk!',
          $error: 'this did not work out',
          $processedAt: 'now'
        });
      });

      it('should start the task again, while removing $error & $processed at and adding passed update', function() {
        expect(this.hoodie.task.start).to.be.calledWith('message', {
          type: 'message',
          id: '123',
          text: 'funk!',
          extra: 'creme'
        });
      });
    });
  });

  describe('#abortAll(type)', function() {
    beforeEach(function() {
      this.sandbox.spy(this.hoodie.task, 'abort');
      this.promise = this.hoodie.task.abortAll();
    });

    it('should findAll task objects in store', function() {
      var filter;
      expect(this.hoodie.store.findAll).to.be.called();
      filter = this.hoodie.store.findAll.args[0][0];
      expect(filter).to.be.a(Function);

      expect(filter({
        type: '$task'
      })).to.eql(true);
      expect(filter({
        type: '$message'
      })).to.eql(true);
      expect(filter({
        type: 'doc'
      })).to.eql(false);
    });

    it('should filter by passed type', function() {
      var filter;
      this.hoodie.task.abortAll('task');
      filter = this.hoodie.store.findAll.args[1][0];
      expect(filter).to.be.a(Function);

      expect(filter({
        type: '$task'
      })).to.eql(true);
      expect(filter({
        type: '$message'
      })).to.eql(false);
      expect(filter({
        type: 'doc'
      })).to.eql(false);
    });

    it('rejects if findAll fails', function() {
      this.hoodie.store.findAll.defer.reject('damn!');
      expect(this.promise).to.be.rejectedWith('damn!');
    });

    _when('findAll succeeds', function() {
      beforeEach(function() {
        this.hoodie.store.findAll.defer.resolve([{
          type: '$task',
          id: '123'
        }, {
          type: '$message',
          id: '124'
        }]);
      });

      it('aborts each task', function() {
        expect(this.hoodie.task.abort).to.be.calledWith('task', '123');
        expect(this.hoodie.task.abort).to.be.calledWith('message', '124');
      });
    });
  });

  describe('#restartAll()', function() {
    beforeEach(function() {
      this.sandbox.spy(this.hoodie.task, 'restart');
      this.promise = this.hoodie.task.restartAll();
    });

    it('should findAll task objects in store', function() {
      var filter;
      expect(this.hoodie.store.findAll).to.be.called();
      filter = this.hoodie.store.findAll.args[0][0];
      expect(filter).to.be.a(Function);

      expect(filter({
        type: '$task'
      })).to.eql(true);
      expect(filter({
        type: '$message'
      })).to.eql(true);
      expect(filter({
        type: 'doc'
      })).to.eql(false);
    });

    it('should filter by passed type', function() {
      var filter;
      this.hoodie.task.restartAll('task');
      filter = this.hoodie.store.findAll.args[1][0];
      expect(filter).to.be.a(Function);

      expect(filter({
        type: '$task'
      })).to.eql(true);
      expect(filter({
        type: '$message'
      })).to.eql(false);
      expect(filter({
        type: 'doc'
      })).to.eql(false);
    });

    it('rejects if findAll fails', function() {
      this.hoodie.store.findAll.defer.reject('damn!');
      expect(this.promise).to.be.rejectedWith('damn!');
    });

    _when('findAll succeeds', function() {
      beforeEach(function() {
        this.hoodie.store.findAll.defer.resolve([{
          type: '$task',
          id: '123'
        }, {
          type: '$message',
          id: '124'
        }]);
      });

      it('restarts each task', function() {
        expect(this.hoodie.task.restart).to.be.calledWith('task', '123', undefined);
        expect(this.hoodie.task.restart).to.be.calledWith('message', '124', undefined);
      });

      it('passes update', function() {
        this.hoodie.task.restartAll({
          extra: 'love'
        });
        expect(this.hoodie.task.restart).to.be.calledWith('task', '123', {
          extra: 'love'
        });
        expect(this.hoodie.task.restart).to.be.calledWith('message', '124', {
          extra: 'love'
        });

        this.hoodie.task.restartAll('task', {
          extra: 'creme'
        });
        expect(this.hoodie.task.restart).to.be.calledWith('task', '123', {
          extra: 'creme'
        });
      });
    });
  });

  describe('hoodie.task called as function', function() {
    beforeEach(function() {
      hoodieScopedTaskFactory.reset();
      hoodieScopedTaskFactory.returns('scoped api');
    });

    it('returns scoped API by type when only type set', function() {
      this.taskStore = this.hoodie.task('task');
      expect(hoodieScopedTaskFactory).to.be.called();
      var args = hoodieScopedTaskFactory.args[0];
      expect(args[0]).to.eql(this.hoodie);
      expect(args[1]).to.eql(this.hoodie.task);
      expect(args[2].type).to.be('task');
      expect(args[2].id).to.be(undefined);
      expect(this.taskStore).to.eql('scoped api');
    });

    it('returns scoped API by type & id when both set', function() {
      this.taskStore = this.hoodie.task('task', '123');
      var args = hoodieScopedTaskFactory.args[0];
      expect(args[0]).to.eql(this.hoodie);
      expect(args[1]).to.eql(this.task);
      expect(args[2].type).to.be('task');
      expect(args[2].id).to.be('123');
    });
  });

  //
  describe('#subscribeToOutsideEvents', function() {
    beforeEach(function() {
      this.events = gatherEventCallbackMapForOutsideEvents(this);
    });

    it('can only be run once', function() {
      expect(this.task.subscribeToOutsideEvents).to.eql(undefined);
    });

    it('turns "new" store events into "start" task events', function() {
      this.events['store:change']('add', {
        type: '$message',
        text: 'funk!'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('change', 'start', {
        type: 'message',
        text: 'funk!'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:change', 'start', {
        type: 'message',
        text: 'funk!'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('start', {
        type: 'message',
        text: 'funk!'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:start', {
        type: 'message',
        text: 'funk!'
      }, {
        option: 'value'
      });
      expect(this.task.trigger.callCount).to.eql(4);
    });

    it('ignores tasks on non-task objects', function() {
      this.events['store:change']('add', {
        type: 'message',
        text: 'funk!'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.not.be.called();
    });

    it('triggers "error" events if tasks are marked so', function() {
      this.events['store:change']('update', {
        type: '$message',
        id: '123',
        $error: 'not funky!'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('change', 'error', {
        type: 'message',
        id: '123'
      }, {
        error: 'not funky!',
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:change', 'error', {
        type: 'message',
        id: '123'
      }, {
        error: 'not funky!',
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:123:change', 'error', {
        type: 'message',
        id: '123'
      }, {
        error: 'not funky!',
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('error', 'not funky!', {
        type: 'message',
        id: '123'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:error', 'not funky!', {
        type: 'message',
        id: '123'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:123:error', 'not funky!', {
        type: 'message',
        id: '123'
      }, {
        option: 'value'
      });
      expect(this.task.trigger.callCount).to.eql(6);
    });

    it('triggers "abort" events when a task has been removed with a abortedAt timestamp', function() {
      this.events['store:change']('remove', {
        type: '$message',
        id: '123',
        abortedAt: '2013-09-05'
      }, {
        option: 'value'
      });

      expect(this.task.trigger).to.be.calledWith('change', 'abort', {
        type: 'message',
        id: '123',
        abortedAt: '2013-09-05'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:change', 'abort', {
        type: 'message',
        id: '123',
        abortedAt: '2013-09-05'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:123:change', 'abort', {
        type: 'message',
        id: '123',
        abortedAt: '2013-09-05'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('abort', {
        type: 'message',
        id: '123',
        abortedAt: '2013-09-05'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:abort', {
        type: 'message',
        id: '123',
        abortedAt: '2013-09-05'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:123:abort', {
        type: 'message',
        id: '123',
        abortedAt: '2013-09-05'
      }, {
        option: 'value'
      });
    });

    it('triggers "success" events when a task has been removed with a $processedAt timestamp', function() {
      this.events['store:change']('remove', {
        type: '$message',
        id: '123',
        $processedAt: '2013-09-05'
      }, {
        option: 'value'
      });

      expect(this.task.trigger).to.be.calledWith('change', 'success', {
        type: 'message',
        id: '123',
        $processedAt: '2013-09-05'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:change', 'success', {
        type: 'message',
        id: '123',
        $processedAt: '2013-09-05'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:123:change', 'success', {
        type: 'message',
        id: '123',
        $processedAt: '2013-09-05'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('success', {
        type: 'message',
        id: '123',
        $processedAt: '2013-09-05'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:success', {
        type: 'message',
        id: '123',
        $processedAt: '2013-09-05'
      }, {
        option: 'value'
      });
      expect(this.task.trigger).to.be.calledWith('message:123:success', {
        type: 'message',
        id: '123',
        $processedAt: '2013-09-05'
      }, {
        option: 'value'
      });
    });

    it('doesn\'t triggers "success" event when a task has been removed with a $error', function() {
      this.events['store:change']('remove', {
        type: '$message',
        id: '123',
        $processedAt: '2013-09-05',
        $error: { name: 'FunkyError' }
      }, {
        option: 'value'
      });

      expect(this.task.trigger).to.not.be.calledWith('success', {
        type: 'message',
        id: '123',
        $processedAt: '2013-09-05',
        $error: { name: 'FunkyError' }
      }, {
        option: 'value'
      });
    });
  }); // subscribeToOutsideEvents
  function now() {
    return '1970-01-01T00:00:00.000Z';
  }
});


function gatherEventCallbackMapForOutsideEvents(context) {
  var events = {};
  var oldOn = context.hoodie.on;
  context.hoodie.on = function() {};
  context.sandbox.stub(context.hoodie, 'on', function(eventName, cb) {
    events[eventName] = cb;
  });

  context.task.subscribeToOutsideEvents();
  context.hoodie.on = oldOn;
  return events;
}
