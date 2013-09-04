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

  describe.only('#start()', function() {
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
  describe('#remove()', function() {
    beforeEach(function() {

    });

    it('should be funky', function() {
      expect(this.hoodie.task.remove).to.be('funky');
    });
  });
});
