'use strict';


describe('Hoodie.User', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    this.sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe('constructor', function() {

    beforeEach(function() {
      this.sandbox.stub(this.hoodie, 'open').returns('storeApi');
    });

    it('should return a shortcut for hoodie.open', function() {
      var user = new Hoodie.User(this.hoodie);

      expect(user('uuid123')).to.eql('storeApi');

      expect(this.hoodie.open.calledWith('user/uuid123/public', {
        prefix: '$public'
      })).to.be.ok();

    });

    it('should pass options', function() {
      var user = new Hoodie.User(this.hoodie);

      user('uuid123', {
        sync: true
      });

      expect(this.hoodie.open.calledWith('user/uuid123/public', {
        prefix: '$public',
        sync: true
      })).to.be.ok();

    });

    it('should extend hoodie.store API with publish / unpublish methods', function() {
      var publish, unpublish, _ref;

      this.sandbox.spy(this.hoodie.store, 'decoratePromises');

      new Hoodie.User(this.hoodie);

      expect(this.hoodie.store.decoratePromises.called).to.be.ok();

      _ref = this.hoodie.store.decoratePromises.args[0][0],
      publish = _ref.publish,
      unpublish = _ref.unpublish;

      expect(typeof publish).to.eql('function');
      expect(typeof unpublish).to.eql('function');
    });

  });

  describe('hoodie.store promise decorations', function() {

    beforeEach(function() {
      this.storeDefer = this.hoodie.defer();
      this.sandbox.spy(this.hoodie.store, 'update');
    });

    describe('#publish(properties)', function() {

      _when('promise returns one object', function() {

        beforeEach(function() {
          this.promise = this.storeDefer.resolve({
            type: 'task',
            id: '123',
            title: 'milk'
          });
          this.promise.hoodie = this.hoodie;
        });

        _and('no properties passed', function() {

          it('should update object returned by promise with $public: true', function() {
            Hoodie.User.prototype._storePublish.apply(this.promise, []);

            expect(this.hoodie.store.update.calledWith('task', '123', {
              $public: true
            })).to.be.ok();
          });

        });

        _and('properties passed as array', function() {

          it('should update object returned by promise with $public: [\'title\', \'owner\']', function() {
            var properties = ['title', 'owner'];
            Hoodie.User.prototype._storePublish.apply(this.promise, [properties]);

            expect(this.hoodie.store.update.calledWith('task', '123', {
              $public: ['title', 'owner']
            })).to.be.ok();
          });

        });

      });

      _when('promise returns multiple objects', function() {

        beforeEach(function() {
          this.promise = this.storeDefer.resolve([
            {
              type: 'task',
              id: '123',
              title: 'milk'
            }, {
              type: 'task',
              id: '456',
              title: 'milk'
            }
          ]);
          this.promise.hoodie = this.hoodie;
        });

        _and('no properties passed', function() {

          it('should update object returned by promise with $public: true', function() {
            Hoodie.User.prototype._storePublish.apply(this.promise, []);

            expect(this.hoodie.store.update.calledWith('task', '123', {
              $public: true
            })).to.be.ok();

            expect(this.hoodie.store.update.calledWith('task', '456', {
              $public: true
            })).to.be.ok();

          });

        });

        _and('properties passed as array', function() {

          it('should update object returned by promise with $public: [\'title\', \'owner\']', function() {
            var properties = ['title', 'owner'];

            Hoodie.User.prototype._storePublish.apply(this.promise, [properties]);

            expect(this.hoodie.store.update.calledWith('task', '123', {
              $public: ['title', 'owner']
            })).to.be.ok();

            expect(this.hoodie.store.update.calledWith('task', '456', {
              $public: ['title', 'owner']
            })).to.be.ok();

          });

        });

      });

    });

    describe('#unpublish()', function() {

      _when('promise returns one object that is public', function() {

        beforeEach(function() {
          this.promise = this.storeDefer.resolve({
            type: 'task',
            id: '123',
            title: 'milk',
            $public: true
          });

          this.promise.hoodie = this.hoodie;
        });

        it('should update object returned by promise with $public: false', function() {
          Hoodie.User.prototype._storeUnpublish.apply(this.promise, []);

          expect(this.hoodie.store.update.calledWith('task', '123', {
            $public: false
          })).to.be.ok();
        });

      });

      _when('promise returns one object that is not public', function() {

        beforeEach(function() {
          this.promise = this.storeDefer.resolve({
            type: 'task',
            id: '123',
            title: 'milk'
          });

          this.promise.hoodie = this.hoodie;
        });

        it('should not update object returned by promise', function() {
          Hoodie.User.prototype._storeUnpublish.apply(this.promise, []);

          expect(this.hoodie.store.update.called).to.not.be.ok();
        });

      });

      _when('promise returns multiple objects, of which some are public', function() {

        beforeEach(function() {
          this.promise = this.storeDefer.resolve([
            {
              type: 'task',
              id: '123',
              title: 'milk'
            }, {
              type: 'task',
              id: '456',
              title: 'milk',
              $public: true
            }, {
              type: 'task',
              id: '789',
              title: 'milk',
              $public: ['title', 'owner']
            }
          ]);
          this.promise.hoodie = this.hoodie;
        });

        it('should update object returned by promise with $public: true', function() {

          Hoodie.User.prototype._storeUnpublish.apply(this.promise, []);

          expect(this.hoodie.store.update.calledWith('task', '123', {
            $public: false
          })).to.not.be.ok();

          expect(this.hoodie.store.update.calledWith('task', '456', {
            $public: false
          })).to.be.ok();

          expect(this.hoodie.store.update.calledWith('task', '789', {
            $public: false
          })).to.be.ok();

        });

      });

    });

  });

});
