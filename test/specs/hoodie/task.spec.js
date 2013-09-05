/* global hoodieTask */

describe('hoodie.task', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    this.sandbox.spy(window, 'hoodieEvents');

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

  describe('#cancel()', function() {
    beforeEach(function() {

    });

    it('should be funky', function() {
      expect(this.hoodie.task.cancel).to.be('funky');
    });
  });
  describe('#restart()', function() {
    beforeEach(function() {

    });

    it('should be funky', function() {
      expect(this.hoodie.task.restart).to.be('funky');
    });
  });
  describe('#cancelAll()', function() {
    beforeEach(function() {

    });

    it('should be funky', function() {
      expect(this.hoodie.task.cancelAll).to.be('funky');
    });
  });
  describe('#restartAll()', function() {
    beforeEach(function() {

    });

    it('should be funky', function() {
      expect(this.hoodie.task.restartAll).to.be('funky');
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
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change:message', 'start', { type: 'message', text: 'funk!'}, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'start', { type: 'message', text: 'funk!'}, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'start:message', { type: 'message', text: 'funk!'}, {option: 'value'} );
      expect( this.hoodie.task.trigger.callCount ).to.eql(4);
    });

    it('ignores tasks on non-task objects', function() {
      this.hoodie.trigger('store:change', 'new', { type: 'message', text: 'funk!'}, {option: 'value'});
      expect( this.hoodie.task.trigger ).to.not.be.called();
    });

    it('triggers "error" events if tasks are marked so', function() {
      this.hoodie.trigger('store:change', 'update', { type: '$message', id: '123', $error: 'not funky!'}, {option: 'value'});
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change', 'error', { type: 'message', id: '123' }, {error: 'not funky!', option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change:message', 'error', { type: 'message', id: '123' }, {error: 'not funky!', option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change:message:123', 'error', { type: 'message', id: '123' }, {error: 'not funky!', option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'error', 'not funky!', { type: 'message', id: '123' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'error:message', 'not funky!', { type: 'message', id: '123' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'error:message:123', 'not funky!', { type: 'message', id: '123' }, {option: 'value'} );
      expect( this.hoodie.task.trigger.callCount ).to.eql(6);
    });

    it('triggers "cancel" events when a task has been removed with a canceledAt timestamp', function() {
      this.hoodie.trigger('store:change', 'remove', { type: '$message', id: '123', canceledAt: '2013-09-05'}, {option: 'value'});

      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change', 'cancel', { type: 'message', id: '123', canceledAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change:message', 'cancel', { type: 'message', id: '123', canceledAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change:message:123', 'cancel', { type: 'message', id: '123', canceledAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'cancel', { type: 'message', id: '123', canceledAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'cancel:message', { type: 'message', id: '123', canceledAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'cancel:message:123', { type: 'message', id: '123', canceledAt: '2013-09-05' }, {option: 'value'} );
    });

    it('triggers "success" events when a task has been removed with a completedAt timestamp', function() {
      this.hoodie.trigger('store:change', 'remove', { type: '$message', id: '123', completedAt: '2013-09-05'}, {option: 'value'});

      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change', 'success', { type: 'message', id: '123', completedAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change:message', 'success', { type: 'message', id: '123', completedAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'change:message:123', 'success', { type: 'message', id: '123', completedAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'success', { type: 'message', id: '123', completedAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'success:message', { type: 'message', id: '123', completedAt: '2013-09-05' }, {option: 'value'} );
      expect( this.hoodie.task.trigger ).to.be.calledWith( 'success:message:123', { type: 'message', id: '123', completedAt: '2013-09-05' }, {option: 'value'} );
    });
  }); // subscribeToStoreEvents
});
