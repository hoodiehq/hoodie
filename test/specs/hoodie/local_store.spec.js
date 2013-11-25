/* global hoodieStore:true, hoodieStoreApi:true */

describe('hoodie.store', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();

    this.sandbox.stub(window.localStorage, 'getItem');
    this.sandbox.stub(window.localStorage, 'setItem');
    this.sandbox.stub(window.localStorage, 'removeItem');
    this.sandbox.stub(window.localStorage, 'key');
    this.sandbox.stub(window.localStorage, 'length');

    this.clock = this.sandbox.useFakeTimers(0); // '1970-01-01 00:00:00'

    this.storeApi = Mocks.StoreApi(this.hoodie);
    this.sandbox.stub(window, 'hoodieStoreApi').returns(this.storeApi);
    hoodieStore(this.hoodie);
    this.storeBackend = hoodieStoreApi.args[0][1].backend;
    this.store = this.hoodie.store;
  });

  //
  describe('#patchIfNotPersistant', function() {
    it('can only be run once', function() {
      this.store.patchIfNotPersistant();
      expect( this.store.patchIfNotPersistant ).to.eql(undefined);
    });

    _when('store is persistant', function() {
      beforeEach(function() {
        this.sandbox.stub(this.store, 'isPersistent').returns(true);
        this.store.patchIfNotPersistant();
      });

      it('should call methods on localStorage', function() {
        this.storeBackend.find('task', '123');
        expect(window.localStorage.getItem).to.be.called();
      });
    }); // store is not persistant

    _when('store is not persistant', function() {
      beforeEach(function() {
        this.sandbox.stub(this.store, 'isPersistent').returns(false);
        this.store.patchIfNotPersistant();
      });

      it('should not call methods on localStorage', function() {
        this.storeBackend.find('task', '123');
        expect(window.localStorage.getItem).to.not.be.called();
      });
    }); // store is not persistant
  }); // patchIfNotPersistant

  //
  describe('#subscribeToOutsideEvents', function() {
    it('can only be run once', function() {
      this.store.subscribeToOutsideEvents();
      expect( this.store.subscribeToOutsideEvents ).to.eql(undefined);
    });

    it('should cleanup on account:cleanup', function() {
      this.sandbox.spy(this.store, 'clear');
      this.store.subscribeToOutsideEvents();
      this.hoodie.trigger('account:cleanup');
      expect( this.store.clear ).to.be.called();
    });

    it('should mark all objects as changed on account:signup', function() {
      this.storeApi.findAllDefer.resolve([
        { type: 'doc', id: 'funky' },
        { type: 'doc', id: 'fresh' }
      ]);
      this.sandbox.stub(this.store, 'changedObjects').returns('changedObjects');
      this.store.subscribeToOutsideEvents();
      this.hoodie.trigger('account:signup');
      expect(localStorage.setItem).to.be.calledWith('_dirty', 'doc/funky,doc/fresh');
      expect(this.store.trigger).to.be.calledWith('dirty');
      this.clock.tick(2000);
      expect(this.store.trigger).to.be.calledWith('idle', 'changedObjects');
    });

    it('should trigger "sync" events on objects that got pushed', function() {
      this.store.subscribeToOutsideEvents();
      this.hoodie.trigger('remote:push', { type: 'doc', id: 'funky' });
      expect(this.store.trigger).to.be.calledWith('sync', { type: 'doc', id: 'funky' }, undefined);
      expect(this.store.trigger).to.be.calledWith('doc:sync', { type: 'doc', id: 'funky' }, undefined);
      expect(this.store.trigger).to.be.calledWith('doc:funky:sync', { type: 'doc', id: 'funky' }, undefined);

      expect(this.store.trigger).to.not.be.calledWith('change', 'sync', { type: 'doc', id: 'funky' }, undefined);
      expect(this.store.trigger).to.not.be.calledWith('doc:change', 'sync', { type: 'doc', id: 'funky' }, undefined);
      expect(this.store.trigger).to.not.be.calledWith('doc:funky:change', 'sync', { type: 'doc', id: 'funky' }, undefined);
    });

    _when('remote:change event gets fired', function() {

      beforeEach(function() {
        this.store.subscribeToOutsideEvents();
        this.object = {
          type: 'car',
          id: '123',
          _ref: '2-456',
          color: 'red',
          _deleted: true
        };
      });

      _and('an object was removed', function() {
        beforeEach(function() {
          this.hoodie.trigger('remote:change', 'remove', this.object);
        });

        it('removes the object in store', function() {
          expect(this.store.remove).to.be.calledWith('car', '123', {
            remote: true,
            update: {
              type: 'car',
              id: '123',
              _ref: '2-456',
              color: 'red',
              _deleted: true
            }
          });
        });
      }); //an object was removed

      _and('an object was updated', function() {
        beforeEach(function() {
          this.hoodie.trigger('remote:change', 'update', this.object);
        });

        it('updates the object in store', function() {
          expect(this.store.save).to.be.calledWith('car', '123', this.object, {
            remote: true
          });
        });
      }); // an object was updated
    }); // remote:change

    _when('remote:bootstrap:start event gets fired', function() {
      beforeEach(function() {
        this.store.subscribeToOutsideEvents();
        expect(this.store.isBootstrapping()).to.eql(false);
        this.hoodie.trigger('remote:bootstrap:start', 'joe@example.com');
      });

      it('should start bootstrapping mode', function() {
        expect(this.store.isBootstrapping()).to.eql(true);
      });

      it('should trigger bootstrap:start event', function() {
        expect(this.store.trigger).to.be.calledWith('bootstrap:start');
      });

      _and('remote:bootstrap:end event gets fired', function() {
        beforeEach(function() {
          this.hoodie.trigger('remote:bootstrap:end');
        });

        it('should stop bootstrapping mode', function() {
          expect(this.store.isBootstrapping()).to.eql(false);
        });
      });
    }); // remote:bootstrap
  }); // subscribeToOutsideEvents

  //
  describe('#save(type, id, object, options)', function() {
    _when('id is \'123\', type is \'document\', object is {name: \'test\'}', function() {
      beforeEach(function() {
        window.localStorage.getItem.returns(JSON.stringify({name: 'test'}));

        this.promise = this.storeBackend.save({
          name: 'test',
          type: 'document',
          id: '123'
        });
      });

      it('should cache document', function() {
        // which means we don't call localStorage.getItem again
        localStorage.getItem.reset();
        this.storeBackend.save({
          type: 'document',
          id: '123',
          name: 'text'
        });
        expect(localStorage.getItem).to.not.be.called();
      });

      it('should write the object to localStorage, but without type & id attributes', function() {
        var object = getLastSavedObject();
        expect(object.name).to.be('test');
        expect(object.type).to.be(undefined);
        expect(object.id).to.be(undefined);
      });

      it('should add timestamps', function() {
        var object = getLastSavedObject();
        expect(object.createdAt).to.eql( now() );
        expect(object.updatedAt).to.eql( now() );
      });

      _and('options.remote is true', function() {
        beforeEach(function() {

          this.promise = this.storeBackend.save({
            type: 'document',
            id: '123',
            name: 'test',
            _rev: '2-345'
          }, {
            remote: true
          });
        });

        it('should not touch createdAt / updatedAt timestamps', function() {
          var object = getLastSavedObject();
          expect(object.createdAt).to.be(undefined);
          expect(object.updatedAt).to.be(undefined);
        });

        it('should add a _syncedAt timestamp', function() {
          var object = getLastSavedObject();
          expect(object._syncedAt).to.eql( now() );
        });

        it('should trigger update & change events', function() {
          var object, options;
          object = {
            id: '123',
            type: 'document',
            name: 'test',
            _syncedAt: now(),
            _rev: '2-345'
          };
          options = {
            remote: true
          };

          expect(this.store.trigger).to.be.calledWith('update', object, options);
          expect(this.store.trigger).to.be.calledWith('document:update', object, options);
          expect(this.store.trigger).to.be.calledWith('change', 'update', object, options);
          expect(this.store.trigger).to.be.calledWith('document:change', 'update', object, options);
        });

        it('should not change the original object', function() {
          var origObject = {
            type: '$test',
            id: '123',
            name: 'test task'
          };

          this.storeBackend.save(origObject);
          var passedObject1 = this.store.trigger.args.pop()[2];
          var passedObject2 = this.store.trigger.args.pop()[2];
          passedObject1.funky = 'fresh';
          expect(passedObject2.funky).to.not.be('fresh');
        });

        it('should keep local attributes', function() {
          stubFindItem('document', '1234', {
            name: 'test',
            _local: 'something'
          });

          this.storeBackend.save({
            type: 'document',
            id: '1234',
            name: 'test',
            _rev: '2-345'
          }, {
            remote: true
          });

          var object = getLastSavedObject();
          expect(object._local).to.eql('something');
        });

        it('should update _rev', function() {
          var object = getLastSavedObject();
          expect(object._rev).to.eql('2-345');
        });

        it('should clear it from local changes', function() {
          localStorage.setItem.reset();
          this.storeBackend.save({
            type: 'document',
            id: 'check1',
            name: 'test',
            _rev: '1-234'
          });
          this.storeBackend.save({
            type: 'document',
            id: 'check2',
            name: 'test',
            _rev: '1-234'
          });
          expect(localStorage.setItem).to.be.calledWith('_dirty', 'document/check1,document/check2');
          localStorage.setItem.reset();
          this.storeBackend.save({
            type: 'document',
            id: 'check1',
            name: 'test',
            _rev: '2-234'
          }, { remote: true });
          expect(localStorage.setItem).to.be.calledWith('_dirty', 'document/check2');
        });
      }); // options.remote is true

      _and('options.silent is true', function() {
        beforeEach(function() {

          this.storeBackend.save({
            type: 'document',
            id: '123',
            name: 'test'
          }, {
            silent: true
          });

        });

        it('should not touch createdAt / updatedAt timestamps', function() {
          var object = getLastSavedObject();
          expect(object.createdAt).to.be(undefined);
          expect(object.updatedAt).to.be(undefined);
        });
      }); // options.silent is true

      _and('options.local is true', function() {
        beforeEach(function() {
          this.storeBackend.save({
            type: 'document',
            id: '123',
            name: 'test'
          }, {
            local: true
          });
        });

        it('should set _$local = true', function() {
          var object = getLastSavedObject();
          expect(object._$local).to.be.ok();
        });
      }); // options.local is true

      _and('options.local is not set', function() {
        beforeEach(function() {
          this.storeBackend.save({
            type: 'document',
            id: '123',
            name: 'test',
            _$local: true
          });
        });

        it('should remove _$local attribute', function() {
          var object = getLastSavedObject();
          expect(object._$local).to.be(undefined);
        });
      }); // options.local is not set

      _and('object is new (not cached yet)', function() {
        _and('object does exist in localStorage', function() {
          beforeEach(function() {
            stubFindItem('document', '1235', {
              name: 'test',
              createdBy: 'myself'
            });

            this.store.trigger.reset();
            localStorage.setItem.reset();
            this.storeBackend.save({
              type: 'document',
              id: '1235',
              name: 'test'
            });
          });

          it('should not look it up again', function() {
            localStorage.getItem.reset();
            this.storeBackend.save({
              type: 'document',
              id: '1235',
              name: 'test'
            });
            expect(localStorage.getItem).to.not.be.called();
          });
          it('should mark it as change', function() {
            expect(localStorage.setItem).to.be.calledWith('_dirty', 'document/123,document/1235');
          });
          it('should trigger update & change events', function() {
            var object = {
              id: '1235',
              type: 'document',
              name: 'test',
              createdAt: now(),
              updatedAt: now(),
              createdBy: 'myself'
            };
            expect(this.store.trigger).to.be.calledWith('update', object, {});
            expect(this.store.trigger).to.be.calledWith('document:update', object, {});
            expect(this.store.trigger).to.be.calledWith('change', 'update', object, {});
            expect(this.store.trigger).to.be.calledWith('document:change', 'update', object, {});
          });
        });

        _and('object does not exist in localStorage', function() {
          beforeEach(function() {
            stubFindItem('document', '1998', null);
            this.storeBackend.save({
              type: 'document',
              id: '1998',
              name: 'test'
            });
          });

          it('should trigger add & change events', function() {
            var object = {
              id: '1998',
              type: 'document',
              name: 'test',
              createdAt: now(),
              updatedAt: now(),
              createdBy: 'owner_hash'
            };
            expect(this.store.trigger).to.be.calledWith('add', object, {});
            expect(this.store.trigger).to.be.calledWith('document:add', object, {});
            expect(this.store.trigger).to.be.calledWith('change', 'add', object, {});
            expect(this.store.trigger).to.be.calledWith('document:change', 'add', object, {});
          });

          it('should mark it as change', function() {
            expect(localStorage.setItem).to.be.calledWith('_dirty', 'document/123,document/1998');
          });
        });
      }); // object is new (not cached yet)

      _and('object is not new (and therefore chached)', function() {
        beforeEach(function() {
          this.object = {
            type: 'document',
            id: '123560',
            name: 'old new'
          };
          this.storeBackend.save(this.object);
          localStorage.getItem.reset();
          this.store.trigger.reset();
          this.storeBackend.save(this.object);
        });

        it('should not look it up again', function() {
          expect(localStorage.getItem).to.not.be.called();
        });

        it('should trigger update & change events', function() {
          expect(this.store.trigger).to.be.calledWith('update', this.object, {});
          expect(this.store.trigger).to.be.calledWith('document:update', this.object, {});
          expect(this.store.trigger).to.be.calledWith('change', 'update', this.object, {});
          expect(this.store.trigger).to.be.calledWith('document:change', 'update', this.object, {});
        });
      }); // object is not new (and therefore chached)

      _when('successful', function() {
        it('should resolve the promise', function() {
          expect(this.promise).to.be.resolved();
        });

        _and('object did exist before', function() {
          beforeEach(function() {
            this.properties = {
              name: 'success',
              createdAt: now(),
              updatedAt: 'yesterday',
              createdBy: 'owner_hash'
            };
            stubFindItem('document', '123successful', this.properties);
            this.promise = this.storeBackend.save({
              type: 'document',
              id: '123successful',
              name: 'success',
              createdAt: now(),
              updatedAt: 'yesterday',
              createdBy: 'owner_hash'
            });
          });

          it('should pass the object & false (= not created) to done callback', function() {
            var object = $.extend({}, this.properties);
            object.updatedAt = now();
            object.type = 'document';
            object.id = '123successful';
            expect(this.promise).to.be.resolvedWith( object, false );
          });
        }); // object did exist before

        _and('object did not exist before', function() {
          beforeEach(function() {
            this.object = {
              type: 'document',
              id: '123new',
              name: 'this is new'
            };
            stubFindItem('document', '123new', null );
            this.promise = this.storeBackend.save(this.object);
          });

          it('should pass true (= new created) as the second param to the done callback', function() {
            var object = $.extend({}, this.object);
            object.createdAt = now();
            object.updatedAt = now();
            object.createdBy = 'owner_hash';
            object.type = 'document';
            object.id = '123new';

            expect(this.promise).to.be.resolvedWith(object, true);
          });
        }); // object did not exist before
      }); // successful

      _when('failed', function() {
        beforeEach(function() {
          window.localStorage.setItem.throws(new Error('funk'));
          this.promise = this.storeBackend.save({
            type: 'document',
            id: '123ohoh',
            name: 'test'
          });
        });

        it('should return a rejected promise', function() {
          expect(this.promise).to.be.rejectedWith('Error: funk');
        });
      }); // failed
    });

    _when('id is \'123\', type is \'document\', object is {id: \'123\', type: \'document\', name: \'test\'}', function() {
      beforeEach(function() {
        this.storeBackend.save({
          id: '123',
          type: 'document',
          name: 'test with id & type'
        });
      });

      it('should not save type & id', function() {
        var object = getLastSavedObject();
        expect(object.name).to.be('test with id & type');
        expect(object.type).to.be(undefined);
        expect(object.id).to.be(undefined);
      });
    });

    _when('id is \'123\', type is \'$internal\', object is {action: \'do some background magic\'}}', function() {
      beforeEach(function() {
        this.promise = this.storeBackend.save({
          type: '$internal',
          id: '123',
          action: 'do some background magic'
        });
      });

      it('should work', function() {
        expect(this.promise.state()).to.eql('resolved');
      });
    }); // id is '123', type is '$internal', object is {action: 'do some background magic'}}

    _when('id is \'123hidden\', type is \'document\', existing object is {name: \'test\', $hidden: \'fresh\'}}', function() {
      beforeEach(function() {
        stubFindItem('document', '123hidden', {name: 'test', $hidden: 'fresh'});
      });

      it('should not overwrite $hidden property when not passed', function() {
        this.storeBackend.save({
          type: 'document',
          id: '123hidden',
          name: 'new test'
        });
        var object = getLastSavedObject();
        expect(object.$hidden).to.eql('fresh');
      });

      it('should overwrite $hidden property when passed', function() {
        this.storeBackend.save({
          type: 'document',
          id: '123hidden',
          name: 'new test',
          $hidden: 'wicked'
        });

        var object = getLastSavedObject();
        expect(object.$hidden).to.eql('wicked');
      });
    }); // id is '123hidden', type is 'document', object is {name: 'test', $hidden: 'fresh'}}

    _when('called without id', function() {
      beforeEach(function() {
        this.promise = this.storeBackend.save({
          type: 'document',
          name: 'this is new'
        });
      });

      it('should generate an id', function() {
        var key = getLastSavedKey();
        expect(key).to.eql('document/uuid');
      });
    }); // called without id

    _when('store is bootstrapping', function() {
      beforeEach(function() {
        var called = false;
        this.sandbox.stub(this.store, 'isBootstrapping', function() {
          if (called) {
            return false;
          }
          called = true;
          return true;
        });
      });

      it('should wait until bootstrapping is finished', function() {
        var promise = this.storeBackend.save({
          type: 'task',
          id: '1234',
          title: 'do it!'
        });
        expect(promise).to.be.pending();
        this.store.subscribeToOutsideEvents();
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise).to.be.resolved();
      });

      _but('change comes from remote', function() {
        it('should not wait until bootstrapping is finished', function() {
          var promise = this.storeBackend.save({
            type: 'task',
            id: '1234',
            title: 'do it!'
          }, {remote: true});
          expect(promise).to.be.resolved();
        });
      });
    }); // store is bootstrapping
  }); // #save

  //
  describe('#find(type, id)', function() {
    beforeEach(function() {
    });

    _when('object can be found', function() {
      beforeEach(function() {
        stubFindItem('document', '123lessie', {
          name: 'woof'
        });
        this.promise = this.storeBackend.find('document', '123lessie');
      });

      it('should call the done callback', function() {
        expect(this.promise).to.be.resolvedWith({
          'name': 'woof',
          'type': 'document',
          'id': '123lessie'
        });
      });
    }); // object can be found

    _when('object cannot be found', function() {

      beforeEach(function() {
        stubFindItem('document', 'truelie', null);
        this.promise = this.storeBackend.find('document', 'abc4567');
      });

      it('should call the fail callback', function() {
        expect(this.promise).to.be.rejected();
      });
    });

    it('should cache the object after the first get', function() {
      this.storeBackend.find('document', 'abc4567cached');
      this.storeBackend.find('document', 'abc4567cached');
      expect(localStorage.getItem.callCount).to.eql(1);
    });

    _when('store is bootstrapping', function() {
      beforeEach(function() {
        var called = false;
        this.sandbox.stub(this.store, 'isBootstrapping', function() {
          if (called) {
            return false;
          }
          called = true;
          return true;
        });
      });

      it('should wait until bootstrapping is finished', function() {
        stubFindItem('document', '123boot', {
          name: 'me up'
        });
        var promise = this.storeBackend.find('document', '123boot');
        expect(promise).to.be.pending();
        this.store.subscribeToOutsideEvents();
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise).to.be.resolved();
      });
    });
  }); // #find

  //
  describe('#findAll(filter)', function() {

    it('should return a promise', function() {
      var promise = this.storeBackend.findAll();
      expect(promise).to.be.promise();
    });

    with_2CatsAnd_3Dogs(function() {
      it('should sort by createdAt', function() {
        var promise = this.storeBackend.findAll();

        expect(promise).to.be.resolvedWith([
          {
            type: 'cat',
            id: '2',
            name: 'cat2',
            age: 2,
            createdAt: '1970-01-01T00:00:00.022Z',
            updatedAt: '1970-01-01T00:00:00.022Z'
          }, {
            type: 'cat',
            id: '1',
            name: 'cat1',
            age: 1,
            createdAt: '1970-01-01T00:00:00.021Z',
            updatedAt: '1970-01-01T00:00:00.021Z'
          }, {
            type: 'dog',
            id: '3',
            name: 'dog3',
            age: 3,
            createdAt: '1970-01-01T00:00:00.013Z',
            updatedAt: '1970-01-01T00:00:00.013Z'
          }, {
            type: 'dog',
            id: '2',
            name: 'dog2',
            age: 2,
            createdAt: '1970-01-01T00:00:00.012Z',
            updatedAt: '1970-01-01T00:00:00.012Z'
          }, {
            type: 'dog',
            id: '1',
            name: 'dog1',
            age: 1,
            createdAt: '1970-01-01T00:00:00.011Z',
            updatedAt: '1970-01-01T00:00:00.011Z'
          }
        ]);
      });

    });

    _when('called without a type', function() {

      with_2CatsAnd_3Dogs(function() {

        it('should return \'em all', function() {
          var promise, results, success;
          success = this.sandbox.spy();
          promise = this.storeBackend.findAll();
          promise.done(success);
          results = success.args[0][0];
          expect(results.length).to.eql(5);
        });
      });

      _and('no documents exist in the store', function() {
        beforeEach(function() {
          this.sandbox.stub(this.store, 'index').returns([]);
        });

        it('should return an empty array', function() {
          var promise = this.storeBackend.findAll();
          promise.then(function (res) {
            expect(res).to.eql([]);
          });
        });
      }); // no documents exist in the store

      _and('there are other documents in localStorage not stored with store', function() {
        beforeEach(function() {
          this.sandbox.stub(this.store, 'index').returns(['_someConfig', 'someOtherShizzle', 'whatever', 'valid/123']);
          stubFindItem('valid', '123', {
            am: 'I'
          });
        });

        it('should not return them', function() {
          var promise, results, success;
          success = this.sandbox.spy();
          promise = this.storeBackend.findAll();
          promise.done(success);
          results = success.args[0][0];
          expect(results.length).to.eql(1);
        });
      }); // there are other documents in localStorage not stored with store
    }); // called without a type

    _when('called only with filter `function(obj) { return obj.age === 3}`', function() {
      with_2CatsAnd_3Dogs(function() {
        it('should only return the dog aged 3', function() {
          var promise, results, success;
          success = this.sandbox.spy();
          promise = this.storeBackend.findAll(function(obj) {
            return obj.age === 3;
          });
          promise.done(success);
          results = success.args[0][0];
          expect(results.length).to.eql(1);
        });
      });
    }); // called only with filter `function(obj) { return obj.age === 3}`

    _when('store is bootstrapping', function() {
      beforeEach(function() {
        var called = false;
        this.sandbox.stub(this.store, 'isBootstrapping', function() {
          if (called) {
            return false;
          }
          called = true;
          return true;
        });
      });

      it('should wait until bootstrapping is finished', function() {
        var promise = this.storeBackend.findAll('todo');
        expect(promise).to.be.pending();
        this.store.subscribeToOutsideEvents();
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise).to.be.resolved();
      });
    }); // store is bootstrapping
  }); // #findAll

  //
  describe('#remove(type, id, options)', function() {
    _when('objecet cannot be found', function() {
      beforeEach(function() {
        stubFindItem('document', '123', null);
      });

      it('should return a rejected the promise', function() {
        var promise = this.storeBackend.remove('document', '123');
        expect(promise.state()).to.eql('rejected');
      });
    }); // objecet cannot be found

    _when('object can be found and has not been synched before', function() {

      beforeEach(function() {
        stubFindItem('document', '123', {
          funky: 'fresh'
        });
      });

      it('should remove the object', function() {
        this.storeBackend.remove('document', '123');
        expect(localStorage.removeItem.calledWith('document/123')).to.be.ok();
      });

      it('should cache that object has been removed', function() {
        this.storeBackend.remove('document', '123');
        expect(localStorage.getItem.callCount).to.be(1);
        this.storeBackend.find('document', '123');
        expect(localStorage.getItem.callCount).to.be(1);
      });

      it('should clear document from changed', function() {

        // when no dirty objects remaining, remove _dirty
        this.storeBackend.save({ type: 'document', id:'123', tilte: 'funk'});
        expect(localStorage.setItem).to.be.calledWith('_dirty', 'document/123');
        this.storeBackend.remove('document', '123');
        expect(localStorage.removeItem).to.be.calledWith('_dirty');

        // when dirty objects remaining, remove the specific key for `_dirty`
        this.storeBackend.save({ type: 'document', id:'123', tilte: 'funk'});
        this.storeBackend.save({ type: 'document', id:'1234', tilte: 'funk'});
        localStorage.setItem.reset();
        this.storeBackend.remove('document', '123');
        expect(localStorage.setItem).to.be.calledWith('_dirty', 'document/1234');
      });

      it('should return a resolved promise', function() {
        var promise = this.storeBackend.remove('document', '123');
        expect(promise).to.be.resolved();
      });

      it('should return a clone of the cached object (before it was deleted)', function() {
        var promise = this.storeBackend.remove('document', '123');
        expect(promise).to.be.resolvedWith({
          type: 'document',
          id: '123',
          funky: 'fresh',
        });
      });
    });

    _when('object can be found and remove comes from remote', function() {
      beforeEach(function() {
        stubFindItem('document', '123', {
          name: 'test'
        });
        this.remoteObject = {
          type: 'document',
          id: '123',
          name: 'test',
          funky: 'fresh'
        };
        this.storeBackend.remove('document', '123', {
          remote: true,
          update: this.remoteObject
        });
      });

      it('should remove the object', function() {
        expect(localStorage.removeItem).to.be.calledWith('document/123');
      });

      it('should trigger remove & change trigger events', function() {

        expect(this.store.trigger).to.be.calledWith('remove', this.remoteObject, {
          remote: true
        });

        expect(this.store.trigger.calledWith('document:remove', this.remoteObject, {
          remote: true
        })).to.be.ok();

        expect(this.store.trigger.calledWith('document:123:remove', this.remoteObject, {
          remote: true
        })).to.be.ok();

        expect(this.store.trigger.calledWith('change', 'remove', this.remoteObject, {
          remote: true
        })).to.be.ok();

        expect(this.store.trigger.calledWith('document:change', 'remove', this.remoteObject, {
          remote: true
        })).to.be.ok();

        expect(this.store.trigger.calledWith('document:123:change', 'remove', this.remoteObject, {
          remote: true
        })).to.be.ok();

      });

    });

    _when('object can be found and was synched before', function() {

      beforeEach(function() {

        stubFindItem('document', '123', {
          _syncedAt: 'now'
        });
        this.storeBackend.remove('document', '123');
      });

      it('should mark the object as deleted and cache it', function() {
        var object = getLastSavedObject();
        expect(object._syncedAt).to.be('now');
        expect(object._deleted).to.be(true);
      });

      it('should not remove the object from store', function() {
        expect(localStorage.removeItem).to.not.be.calledWith('document/123');
      });
    });

    _when('object is removed', function() {

      _but('has been synced before', function() {
        beforeEach(function() {
          this.storeBackend.save({
            type: 'document',
            id: 'nomore',
            name: 'test',
            _rev: '2-234',
            _deleted: true
          });
        });

        it('should cache it as not found for future look ups', function() {
          localStorage.getItem.reset();
          var promise = this.storeBackend.find('document', 'nomore');
          expect(localStorage.getItem).to.not.be.called();
          expect(promise).to.be.rejected();
        });

        it('should mark as changed', function() {
          expect(localStorage.setItem).to.be.calledWith('_dirty', 'document/nomore');
        });
      });
    });

    _when('store is bootstrapping', function() {

      beforeEach(function() {
        var called = false;
        this.sandbox.stub(this.store, 'isBootstrapping', function() {
          if (called) {
            return false;
          }
          called = true;
          return true;
        });
      });


      it('should wait until bootstrapping is finished', function() {
        stubFindItem('document', '123', {
          something: 'here'
        });
        var promise = this.storeBackend.remove('document', '123');
        expect(promise).to.be.pending();
        this.store.subscribeToOutsideEvents();
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise).to.be.resolved();
      });

      _but('change comes from remote', function() {
        it('should not wait until bootstrapping is finished', function() {
          stubFindItem('document', '123', {
            something: 'here'
          });
          var promise = this.storeBackend.remove('document', '123', {remote: true});
          expect(promise).to.be.resolved();
        });
      });
    });
  }); // #remove

  //
  describe('#removeAll(filter)', function() {

    it('should return a promise', function() {
      var promise = this.storeBackend.removeAll();
      expect(promise).to.be.promise();
    });

    _when('there are two cats, Binding & lager', function() {
      beforeEach(function() {
        var findAllDefer = this.hoodie.defer();
        this.removeDefer = this.hoodie.defer();
        this.store.findAll.returns(findAllDefer.promise());
        this.store.remove.returns(this.removeDefer.promise());
        this.promise = this.storeBackend.removeAll();

        findAllDefer.resolve([
          {type: 'cat', id: '1', name: 'Binding'},
          {type: 'cat', id: '2', name: 'Lager'}
        ]);
      });

      it('should remove all objects returned by findAll and call remove on them', function() {
        expect(this.store.findAll).to.be.called();
        expect(this.store.remove).to.be.calledWith('cat', '1', undefined);
        expect(this.store.remove).to.be.calledWith('cat', '2', undefined);
      });

      _and('both remove calls succedd', function() {
        beforeEach(function() {
          this.removeDefer.resolve({some: 'cat'});
        });

        it('resolves with the results of the store.remove calls', function() {
          expect(this.promise).to.be.resolvedWith([{some: 'cat'}, {some: 'cat'}]);
        });
      });

      _but('the remove calls fail', function() {
        beforeEach(function() {
          this.removeDefer.reject('ooops');
        });

        it('resolves with the results of the store.remove calls', function() {
          expect(this.promise).to.be.rejectedWith('ooops');
        });
      });
    });
  }); // #removeAll

  //
  describe('#clear()', function() {

    it('should return a promise', function() {
      var promise = this.store.clear();
      expect(promise).to.be.promise();
    });

    it('should clear localStorage', function() {
      this.sandbox.stub(this.store, 'index').returns(['$config/hoodie', 'car/123', '_notOurBusiness']);
      this.store.clear();

      expect(localStorage.removeItem).to.be.calledWith('$config/hoodie');
      expect(localStorage.removeItem).to.be.calledWith('car/123');
      expect(localStorage.removeItem).to.not.be.calledWith('_notOurBusiness');
    });

    it('should clear chache', function() {
      this.storeBackend.find('document', '123');
      this.storeBackend.find('document', '123');
      expect(localStorage.getItem.callCount).to.be(1);
      this.store.clear();
      this.storeBackend.find('document', '123');
      expect(localStorage.getItem.callCount).to.be(2);
    });

    it('should clear dirty docs', function() {
      localStorage.removeItem.reset();
      this.store.clear();
      expect(localStorage.removeItem).to.be.calledWith('_dirty');
    });

    it('should resolve promise', function() {
      var promise = this.store.clear();
      expect(promise).to.be.resolved();
    });

    _when('an error occurs', function() {

      beforeEach(function() {
        this.sandbox.stub(this.store, 'index').throws('ooops');
      });

      it('should reject the promise', function() {
        var promise = this.store.clear();
        expect(promise.state()).to.eql('rejected');
      });
    }); // an error occurs
  }); // #clear

  //
  describe('#hasLocalChanges(type, id)', function() {
    _when('no arguments passed', function() {
      it('returns false when there are no local changes', function() {
        expect(this.store.hasLocalChanges()).to.eql(false);
      });

      it('returns true when there are local changes', function() {
        this.storeBackend.save({ type: 'song', title: 'Urlaub in Polen'});
        expect(this.store.hasLocalChanges()).to.eql(true);
      });
    }); // no arguments passed

    _when('type & id passed', function() {

      _and('object was not yet synced', function() {
        _and('object has saved with silent:true option', function() {

          beforeEach(function() {
            stubFindItem('couch', '123', {
              _syncedAt: void 0,
              updatedAt: void 0
            });
          });

          it('should return false', function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.be(false);
          });
        }); // object has saved with silent:true option

        _and('object has been saved without silent:true option', function() {

          beforeEach(function() {
            stubFindItem('couch', '123', {
              _syncedAt: void 0,
              updatedAt: now()
            });
          });

          it('should return true', function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.be(true);
          });
        }); // object has been saved without silent:true option
      }); // object was not yet synced

      _and('object was synced', function() {
        _and('object was updated before', function() {
          beforeEach(function() {
            stubFindItem('couch', '123', {
              _syncedAt: new Date(1),
              updatedAt: new Date(0)
            });
          });

          it('should return false', function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.not.be.ok();
          });
        }); // object was not updated yet

        _and('object was updated at the same time', function() {
          beforeEach(function() {
            stubFindItem('couch', '123', {
              _syncedAt: new Date(0),
              updatedAt: new Date(0)
            });
          });

          it('should return false', function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.be(false);
          });
        }); // object was updated at the same time

        _and('object was updated later', function() {
          beforeEach(function() {
            stubFindItem('couch', '123', {
              _syncedAt: new Date(0),
              updatedAt: new Date(1)
            });
          });

          it('should return true', function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.be(true);
          });
        }); // object was updated later
      }); // object was synced
    }); // type & id passed
  }); // #hasLocalChanges

  //
  describe('#changedObjects()', function() {

    _when('there are no changed docs', function() {
      it('should return an empty array', function() {
        expect(this.store.changedObjects()).to.eql([]);
      });
    });

    _when('there are 2 dirty docs', function() {
      beforeEach(function() {
        this.storeBackend.save({
          type: 'couch',
          id: '123',
          color: 'red'
        });
        this.storeBackend.save({
          type: 'couch',
          id: '456',
          color: 'blue'
        });
      });

      it('should return the two docs', function() {
        expect(this.store.changedObjects().length).to.eql(2);
      });

      it('should add type and id', function() {
        var objects = this.store.changedObjects();
        expect(objects[0].type).to.eql('couch');
        expect(objects[0].id).to.eql('123');
      });
    });
  }); // #changedObjects
});

function now() {
  return '1970-01-01T00:00:00.000Z';
}

function getLastSavedObject() {
  var calls = window.localStorage.setItem.args;
  var object;

  // ignore update of _dirty keys
  if (calls[calls.length - 1][0] === '_dirty') {
    object = calls[calls.length - 2][1];
  } else {
    object = calls[calls.length - 1][1];
  }
  return JSON.parse(object);
}
function getLastSavedKey() {
  var calls = window.localStorage.setItem.args;
  var key;

  // ignore update of _dirty keys
  if (calls[calls.length - 1][0] === '_dirty') {
    key = calls[calls.length - 2][0];
  } else {
    key = calls[calls.length - 1][0];
  }
  return key;
}
function stubFindItem(key, id, object) {
  key = [key, id].join('/');
  if (object) {
    delete object.id;
    delete object.type;
    object = JSON.stringify(object);
  }
  window.localStorage.getItem.withArgs(key).returns(object);
}

function with_2CatsAnd_3Dogs(specs) {

  _and('two cat and three dog objects exist in the store', function() {

    beforeEach(function() {
      this.sandbox.stub(this.store, 'index').returns([
        'cat/1',
        'cat/2',
        'dog/1',
        'dog/2',
        'dog/3'
      ]);
      stubFindItem('cat', '1', {
        name: 'cat1',
        age: 1,
        createdAt: '1970-01-01T00:00:00.021Z',
        updatedAt: '1970-01-01T00:00:00.021Z'
      });
      stubFindItem('cat', '2', {
        name: 'cat2',
        age: 2,
        createdAt: '1970-01-01T00:00:00.022Z',
        updatedAt: '1970-01-01T00:00:00.022Z'
      });
      stubFindItem('dog', '1', {
        name: 'dog1',
        age: 1,
        createdAt: '1970-01-01T00:00:00.011Z',
        updatedAt: '1970-01-01T00:00:00.011Z'
      });
      stubFindItem('dog', '2', {
        name: 'dog2',
        age: 2,
        createdAt: '1970-01-01T00:00:00.012Z',
        updatedAt: '1970-01-01T00:00:00.012Z'
      });
      stubFindItem('dog', '3', {
        name: 'dog3',
        age: 3,
        createdAt: '1970-01-01T00:00:00.013Z',
        updatedAt: '1970-01-01T00:00:00.013Z'
      });
    });

    specs();
  });
}
