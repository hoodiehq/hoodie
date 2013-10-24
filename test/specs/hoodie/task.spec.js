/* global hoodieTask */
describe('hoodie.task', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    this.sandbox.spy(window, 'hoodieEvents');
    this.clock = this.sandbox.useFakeTimers(0); // '1970-01-01 00:00:00'
    hoodieTask(this.hoodie);
    this.task = this.hoodie.task;
  });

  it('should add events API', function() {
    expect(window.hoodieEvents).to.be.calledWith(this.hoodie, {
      context: this.hoodie.task,
      namespace: 'task'
    });
  });

  describe('#start()', function() {
    beforeEach(function() {
      this.signUpDefer = this.hoodie.defer();
      this.sandbox.stub(this.hoodie.account, 'anonymousSignUp').returns( this.signUpDefer.promise() );
      this.sandbox.stub(this.hoodie.account, 'hasAccount').returns(true);
    });

    _when('user has account', function() {
      beforeEach(function() {
        this.promise = this.task.start('message', { to: 'joe', text: 'hi'});
      });

      it('should add a new $task object using hoodie.store.add', function() {
        expect(this.hoodie.store.add).to.be.calledWith('$message', { to: 'joe', text: 'hi'});
      });

      it('should reject when hoodie.store.add rejects', function() {
        this.hoodie.store.addDefer.reject('error');
        expect(this.promise).to.be.rejectedWith('error');
      });

      _when('hoodie.store.add succeeds', function() {
        beforeEach(function() {
          this.hoodie.store.addDefer.resolve({type: 'message', id: '123'});
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
            this.removeCallback( { type: '$message', id: '123', finishedAt: 'now' } );
          });

          it('should resolve', function() {
            expect(this.promise).to.be.resolvedWith( { type: 'message', id: '123', finishedAt: 'now' } );
          });
        });

        _but('it was removed before it was finished', function() {

          // meaning that the task could not be finished, the reason gets stored in `$error`
          beforeEach(function() {
            var args = this.hoodie.store.on.args[0];
            expect(args[0]).to.eql('remove');
            this.removeCallback = args[1];
            this.removeCallback( { type: '$message', id: '123' } );
          });

          it('should reject', function() {
            expect(this.promise).to.be.rejectedWith( { type: 'message', id: '123' } );
          });
        });

        _but('there is an error', function() {
          // meaning that the task could not be finished, the reason gets stored in `$error`
          beforeEach(function() {
            var args = this.hoodie.store.on.args[1];
            expect(args[0]).to.eql('error');
            this.errorCallback = args[1];
            this.errorCallback('error', { type: '$message', id: '123' } );
          });

          it('should reject', function() {
            expect(this.promise).to.be.rejectedWith('error', { type: 'message', id: '123' });
          });
        });
      });
    });

    _when('user has no account', function() {
      beforeEach(function() {
        this.hoodie.account.hasAccount.returns(false);
        this.promise = this.task.start('message', { to: 'joe', text: 'hi'});
      });

      it('should sign up for an anonymous account', function() {
        expect(this.hoodie.account.anonymousSignUp).to.be.called();
      });

      it('rejects if signup fails', function() {
        this.signUpDefer.reject('nope.');
        expect(this.promise).to.be.rejectedWith('nope.');
      });

      it('should call task.start again if signup suceeded', function() {
        this.sandbox.stub(this.task, 'start').returns('funk');
        this.signUpDefer.resolve();
        expect(this.task.start).to.be.calledWith('message', { to: 'joe', text: 'hi'});
        expect(this.promise).to.be.resolvedWith('funk');
      });
    });
  });

  describe('#cancel()', function() {
    beforeEach(function() {
      this.promise = this.task.cancel('message', '123');
    });

    it('should add a new $task object using hoodie.store.add', function() {
      expect(this.hoodie.store.update).to.be.calledWith('$message', '123', { cancelledAt: now()});
    });

    it('should reject when hoodie.store.add rejects', function() {
      this.hoodie.store.updateDefer.reject('error');
      expect(this.promise).to.be.rejectedWith('error');
    });

    _when('hoodie.store.update succeeds (task has not been synced yet)', function() {
      beforeEach(function() {
        this.hoodie.store.updateDefer.resolve({type: 'message', id: '123'});
      });

      it('should remove the task from store', function() {
        // instead, it should wait until the worker completes the task
        expect(this.hoodie.store.remove).to.be.calledWith('$message', '123');
      });

      _when('removing task from store fails', function() {
        beforeEach(function() {
          this.hoodie.store.removeDefer.reject('removeError');
        });

        it('should reject', function() {
          expect(this.promise).to.be.rejectedWith('removeError');
        });
      });

      _when('removing task from store succeeds', function() {
        beforeEach(function() {
          this.hoodie.store.removeDefer.resolve('removeSucces');
        });

        it('should resolve', function() {
          expect(this.promise).to.be.resolvedWith('removeSucces');
        });
      });
    });

    _when('hoodie.store.update succeeds (task has been synced already)', function() {
      beforeEach(function() {
        this.hoodie.store.updateDefer.resolve({type: 'message', id: '123', _rev: '1-234'});
      });

      it('should remove the task from store', function() {
        // instead, it should wait until the worker completes the task
        expect(this.hoodie.store.remove).to.be.calledWith('$message', '123');
      });

      _when('removing task from store fails', function() {
        beforeEach(function() {
          this.hoodie.store.removeDefer.reject('removeError');
        });

        it('should reject', function() {
          expect(this.promise).to.be.rejectedWith('removeError');
        });
      });

      _when('removing task from store succeeds', function() {
        beforeEach(function() {
          this.hoodie.store.removeDefer.resolve('removeSucces');
        });

        it('should not resolve yet', function() {
          expect(this.promise).to.be.pending();
        });

        it('should resolve when on store:sync:message:123 event', function() {
          this.hoodie.trigger('store:sync:$message:123', 'done!');
          expect(this.promise).to.be.resolvedWith('done!');
        });
      });
    });
  });

  describe('#restart(type, id, update)', function() {
    beforeEach(function() {
      this.cancelDefer = this.hoodie.defer();
      this.sandbox.stub(this.hoodie.task, 'cancel').returns(this.cancelDefer.promise());
      this.sandbox.stub(this.hoodie.task, 'start');
      this.promise = this.hoodie.task.restart('message', '123', { extra: 'creme'});
    });

    it('should cancel a running task', function() {
      expect(this.hoodie.task.cancel).to.be.calledWith('message', '123');
    });

    it('rejects with cancel fails', function() {
      this.cancelDefer.reject('nope.');
      expect(this.promise).to.be.rejectedWith('nope.');
    });

    _when('cancelling task succeeds', function() {
      beforeEach(function() {
        this.cancelDefer.resolve({
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

  describe('#cancelAll(type)', function() {
    beforeEach(function() {
      this.sandbox.spy(this.hoodie.task, 'cancel');
      this.promise = this.hoodie.task.cancelAll();
    });

    it('should findAll task objects in store', function() {
      var filter;
      expect(this.hoodie.store.findAll).to.be.called();
      filter = this.hoodie.store.findAll.args[0][0];
      expect(filter).to.be.a(Function);

      expect(filter({type: '$task'})).to.eql(true);
      expect(filter({type: '$message'})).to.eql(true);
      expect(filter({type: 'doc'})).to.eql(false);
    });

    it('should filter by passed type', function() {
      var filter;
      this.hoodie.task.cancelAll('task');
      filter = this.hoodie.store.findAll.args[1][0];
      expect(filter).to.be.a(Function);

      expect(filter({type: '$task'})).to.eql(true);
      expect(filter({type: '$message'})).to.eql(false);
      expect(filter({type: 'doc'})).to.eql(false);
    });

    it('rejects if findAll fails', function() {
      this.hoodie.store.findAllDefer.reject('damn!');
      expect(this.promise).to.be.rejectedWith('damn!');
    });

    _when('findAll succeeds', function() {
      beforeEach(function() {
        this.hoodie.store.findAllDefer.resolve([
          {type: '$task', id: '123'},
          {type: '$message', id: '124'}
        ]);
      });

      it('cancels each task', function() {
        expect(this.hoodie.task.cancel).to.be.calledWith('task', '123');
        expect(this.hoodie.task.cancel).to.be.calledWith('message', '124');
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

      expect(filter({type: '$task'})).to.eql(true);
      expect(filter({type: '$message'})).to.eql(true);
      expect(filter({type: 'doc'})).to.eql(false);
    });

    it('should filter by passed type', function() {
      var filter;
      this.hoodie.task.restartAll('task');
      filter = this.hoodie.store.findAll.args[1][0];
      expect(filter).to.be.a(Function);

      expect(filter({type: '$task'})).to.eql(true);
      expect(filter({type: '$message'})).to.eql(false);
      expect(filter({type: 'doc'})).to.eql(false);
    });

    it('rejects if findAll fails', function() {
      this.hoodie.store.findAllDefer.reject('damn!');
      expect(this.promise).to.be.rejectedWith('damn!');
    });

    _when('findAll succeeds', function() {
      beforeEach(function() {
        this.hoodie.store.findAllDefer.resolve([
          {type: '$task', id: '123'},
          {type: '$message', id: '124'}
        ]);
      });

      it('restarts each task', function() {
        expect(this.hoodie.task.restart).to.be.calledWith('task', '123', undefined);
        expect(this.hoodie.task.restart).to.be.calledWith('message', '124', undefined);
      });

      it('passes update', function() {
        this.hoodie.task.restartAll({extra: 'love'});
        expect(this.hoodie.task.restart).to.be.calledWith('task', '123', {extra: 'love'});
        expect(this.hoodie.task.restart).to.be.calledWith('message', '124', {extra: 'love'});

        this.hoodie.task.restartAll('task', {extra: 'creme'});
        expect(this.hoodie.task.restart).to.be.calledWith('task', '123', {extra: 'creme'});
      });
    });
  });

  describe('hoodie.task called as function', function() {
    beforeEach( function() {
      this.sandbox.stub(window, 'hoodieScopedTask').returns('scoped api');
    });

    it('returns scoped API by type when only type set', function() {
      this.taskStore = this.hoodie.task('task');
      expect(window.hoodieScopedTask).to.be.called();
      var args = window.hoodieScopedTask.args[0];
      expect(args[0]).to.eql(this.hoodie);
      expect(args[1]).to.eql(this.hoodie.task);
      expect(args[2].type).to.be('task');
      expect(args[2].id).to.be(undefined);
      expect(this.taskStore).to.eql('scoped api');
    });

    it('returns scoped API by type & id when both set', function() {
      this.taskStore = this.hoodie.task('task', '123');
      var args = window.hoodieScopedTask.args[0];
      expect(args[0]).to.eql(this.hoodie);
      expect(args[1]).to.eql(this.hoodie.task);
      expect(args[2].type).to.be('task');
      expect(args[2].id).to.be('123');
    });
  });

  //
  describe('#subscribeToStoreEvents', function() {
    beforeEach(function() {
      this.sandbox.spy(this.hoodie.task, 'trigger');
      this.hoodie.task.subscribeToStoreEvents();
    });

    it('can only be run once', function() {
      expect( this.hoodie.task.subscribeToStoreEvents ).to.eql(undefined);
    });

    it('turns "new" store events into "start" task events', function() {
      this.hoodie.trigger('store:change', 'new', { type: '$message', text: 'funk!'}, {option: 'value'});
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change', 'start', { type: 'message', text: 'funk!'}, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:change', 'start', { type: 'message', text: 'funk!'}, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'start', { type: 'message', text: 'funk!'}, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:start', { type: 'message', text: 'funk!'}, {option: 'value'} );
      expect( this.hoodie.task.trigger.callCount ).to.eql(4);
    });

    it('ignores tasks on non-task objects', function() {
      this.hoodie.trigger('store:change', 'new', { type: 'message', text: 'funk!'}, {option: 'value'});
      expect( this.hoodie.task.trigger ).to.not.be.called();
    });

    it('triggers "error" events if tasks are marked so', function() {
      this.hoodie.trigger('store:change', 'update', { type: '$message', id: '123', $error: 'not funky!'}, {option: 'value'});
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change', 'error', { type: 'message', id: '123' }, {error: 'not funky!', option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:change', 'error', { type: 'message', id: '123' }, {error: 'not funky!', option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:123:change', 'error', { type: 'message', id: '123' }, {error: 'not funky!', option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'error', 'not funky!', { type: 'message', id: '123' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:error', 'not funky!', { type: 'message', id: '123' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:123:error', 'not funky!', { type: 'message', id: '123' }, {option: 'value'} );
      expect( this.hoodie.task.trigger.callCount ).to.eql(6);
    });

    it('triggers "cancel" events when a task has been removed with a cancelledAt timestamp', function() {
      this.hoodie.trigger('store:change', 'remove', { type: '$message', id: '123', cancelledAt: '2013-09-05'}, {option: 'value'});

      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change', 'cancel', { type: 'message', id: '123', cancelledAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:change', 'cancel', { type: 'message', id: '123', cancelledAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:123:change', 'cancel', { type: 'message', id: '123', cancelledAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'cancel', { type: 'message', id: '123', cancelledAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:cancel', { type: 'message', id: '123', cancelledAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:123:cancel', { type: 'message', id: '123', cancelledAt: '2013-09-05' }, {option: 'value'} );
    });

    it('triggers "success" events when a task has been removed with a $processedAt timestamp', function() {
      this.hoodie.trigger('store:change', 'remove', { type: '$message', id: '123', $processedAt: '2013-09-05'}, {option: 'value'});

      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change', 'success', { type: 'message', id: '123', $processedAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:change', 'success', { type: 'message', id: '123', $processedAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:123:change', 'success', { type: 'message', id: '123', $processedAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'success', { type: 'message', id: '123', $processedAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:success', { type: 'message', id: '123', $processedAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'message:123:success', { type: 'message', id: '123', $processedAt: '2013-09-05' }, {option: 'value'} );
    });
  }); // subscribeToStoreEvents

  function now() {
    return '1970-01-01T00:00:00.000Z';
  }
});
