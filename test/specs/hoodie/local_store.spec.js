'use strict';

describe("hoodie.store", function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();

    this.sandbox.stub(window.localStorage, "getItem");
    this.sandbox.stub(window.localStorage, "setItem");
    this.sandbox.stub(window.localStorage, "removeItem");
    this.sandbox.stub(window.localStorage, "key");
    this.sandbox.stub(window.localStorage, "length");

    this.clock = this.sandbox.useFakeTimers(0) // '1970-01-01 00:00:00'

    hoodieStore(this.hoodie);
    this.store = this.hoodie.store;
  });

  //
  xdescribe("#patchIfNotPersistant", function() {
    it("can only be run once", function() {
      this.store.patchIfNotPersistant();
      expect( this.store.patchIfNotPersistant ).to.eql(undefined)
    });

    _when("store is persistant", function() {
      beforeEach(function() {
        this.sandbox.stub(this.store, 'isPersistent').returns(true)
        this.store.patchIfNotPersistant();
      });

      it("should call methods on localStorage", function() {
        this.store.find('task', '123');
        expect(window.localStorage.getItem).to.be.called()
      });
    }); // store is not persistant

    _when("store is not persistant", function() {
      beforeEach(function() {
        this.sandbox.stub(this.store, 'isPersistent').returns(false)
        this.store.patchIfNotPersistant();
      });

      it("should not call methods on localStorage", function() {
        this.store.find('task', '123');
        expect(window.localStorage.getItem).to.not.be.called()
      });
    }); // store is not persistant
  }); // patchIfNotPersistant

  //
  xdescribe("#subscribeToOutsideEvents", function() {
    it("can only be run once", function() {
      this.store.subscribeToOutsideEvents();
      expect( this.store.subscribeToOutsideEvents ).to.eql(undefined)
    });

    it("should cleanup on account:cleanup", function() {
      this.sandbox.spy(this.store, "clear");
      this.store.subscribeToOutsideEvents()
      this.hoodie.trigger('account:cleanup');
      expect( this.store.clear ).to.be.called();
    });

    it("should mark all objects as changed on account:signup", function() {
      this.sandbox.spy(this.store, "markAllAsChanged");
      this.store.subscribeToOutsideEvents();
      this.hoodie.trigger('account:signup');
      expect( this.store.markAllAsChanged ).to.be.called();
    });

    _when("remote:change event gets fired", function() {

      beforeEach(function() {
        this.store.subscribeToOutsideEvents();
        this.object = {
          type: 'car',
          id: '123',
          color: 'red'
        };
      });

      _and("an object was removed", function() {
        beforeEach(function() {
          this.sandbox.spy(this.store, "remove");
          this.hoodie.trigger('remote:change', 'remove', this.object);
        });

        it("removes the object in store", function() {
          expect(this.store.remove).to.be.calledWith('car', '123', {
            remote: true
          });
        });
      }); //an object was removed

      _and("an object was updated", function() {
        beforeEach(function() {
          this.sandbox.spy(this.store, "save");
          this.hoodie.trigger('remote:change', 'update', this.object);
        });

        it("updates the object in store", function() {
          expect(this.store.save).to.be.calledWith('car', '123', this.object, {
            remote: true
          });
        });
      }); // an object was updated
    }); // remote:change

    _when("remote:bootstrap:start event gets fired", function() {
      beforeEach(function() {
        this.store.subscribeToOutsideEvents();
        expect(this.store.isBootstrapping()).to.eql(false)
        this.sandbox.spy(this.store, "trigger");
        this.hoodie.trigger('remote:bootstrap:start', 'joe@example.com');
      });

      it("should start bootstrapping mode", function() {
        expect(this.store.isBootstrapping()).to.eql(true)
      });

      it("should trigger bootstrap:start event", function() {
        expect(this.store.trigger).to.be.calledWith('bootstrap:start');
      });

      _and("remote:bootstrap:end event gets fired", function() {
        beforeEach(function() {
          this.hoodie.trigger('remote:bootstrap:end');
        });

        it("should stop bootstrapping mode", function() {
          expect(this.store.isBootstrapping()).to.eql(false);
        });
      });
    }); // remote:bootstrap
  }); // subscribeToOutsideEvents

  //
  xdescribe("#save(type, id, object, options)", function() {
    it("should return a promise", function() {
      var promise = this.store.save('document', '123', {
        name: 'test'
      });
      expect(promise).to.be.promise();
    });

    it("should allow numbers and lowercase letters for type only. And must start with a letter or $", function() {
      var invalid, key, promise, valid, _i, _len;
      invalid = ['UPPERCASE', 'underLines', '-?&$', '12345', 'a'];
      valid = ['car', '$email'];
      for (_i = 0, _len = invalid.length; _i < _len; _i++) {
        key = invalid[_i];
        promise = this.store.save(key, 'valid', {});
        expect(promise).to.be.rejected();
      }
      for (_i = 0, _len = valid.length; _i < _len; _i++) {
        key = valid[_i];
        promise = this.store.save(key, 'valid', {});
        expect(promise).to.be.resolved();
      };
    });

    it("should allow numbers, lowercase letters and dashes for for id only", function() {
      var invalid, key, promise, valid, _i, _len;
      invalid = ['UPPERCASE', 'underLines', '-?&$'];
      valid = ['abc4567', '1', 123, 'abc-567'];

      for (_i = 0, _len = invalid.length; _i < _len; _i++) {
        key = invalid[_i];
        promise = this.store.save('valid', key, {});
        expect(promise.state()).to.eql('rejected');
      }
      for (_i = 0, _len = valid.length; _i < _len; _i++) {
        key = valid[_i];
        promise = this.store.save('valid', key, {});
        expect(promise.state()).to.eql('resolved');
      }
    });

    describe("invalid arguments", function() {
      _when("no arguments passed", function() {
        it("should be rejected", function() {
          expect(this.store.save()).to.be.rejected();
        });
      }); // no arguments passed

      _when("no object passed", function() {
        it("should be rejected", function() {
          var promise = this.store.save('document', 'abc4567');
          expect(promise).to.be.rejected();
        });
      }); //no object passed
    }); // invalid arguments

    _when("id is '123', type is 'document', object is {name: 'test'}", function() {
      beforeEach(function() {
        this.properties = {name: 'test'};
        window.localStorage.getItem.returns(JSON.stringify(this.properties));

        this.promise = this.store.save('document', '123', this.properties, {
          option: 'value'
        });
      });

      it("should cache document", function() {
        // which means we don't call localStorage.getItem again
        localStorage.getItem.reset()
        this.promise = this.store.save('document', '123', this.properties)
        expect(localStorage.getItem).to.not.be.called();
      });

      it("should add timestamps", function() {
        var object = getLastSavedObject();
        expect(object.createdAt).to.eql( now() );
        expect(object.updatedAt).to.eql( now() );
      });

      _and("options.remote is true", function() {

        beforeEach(function() {
          this.sandbox.spy(this.store, "trigger");

          this.store.save('document', '123', {
            name: 'test',
            _rev: '2-345'
          }, {
            remote: true
          });
        });

        it("should not touch createdAt / updatedAt timestamps", function() {
          var object = getLastSavedObject();
          expect(object.createdAt).to.be(undefined);
          expect(object.updatedAt).to.be(undefined);
        });

        it("should add a _syncedAt timestamp", function() {
          var object = getLastSavedObject();
          expect(object._syncedAt).to.eql( now() );
        });

        it("should trigger update & change events", function() {
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
          expect(this.store.trigger).to.be.calledWith('update:document', object, options);
          expect(this.store.trigger).to.be.calledWith('change', 'update', object, options);
          expect(this.store.trigger).to.be.calledWith('change:document', 'update', object, options);
        });

        it("should keep local attributes", function() {
          stubFindItem('document', '1234', {
            name: 'test',
            _local: 'something'
          });

          this.store.save('document', '1234', {
            name: 'test',
            _rev: '2-345'
          }, {
            remote: true
          });

          var object = getLastSavedObject();
          expect(object._local).to.eql('something');
        });

        it("should update _rev", function() {
          var object = getLastSavedObject();
          expect(object._rev).to.eql('2-345');
        });
      }); // options.remote is true

      _and("options.silent is true", function() {
        beforeEach(function() {

          this.store.save('document', '123', {
            name: 'test'
          }, {
            silent: true
          });

        });

        it("should not touch createdAt / updatedAt timestamps", function() {
          var object = getLastSavedObject();
          expect(object.createdAt).to.be(undefined);
          expect(object.updatedAt).to.be(undefined);
        });
      }); // options.silent is true

      _and("options.local is true", function() {
        beforeEach(function() {
          this.store.save('document', '123', {
            name: 'test'
          }, {
            local: true
          });
        });

        it("should set _$local = true", function() {
          var object = getLastSavedObject();
          expect(object._$local).to.be.ok();
        });
      }); // options.local is true

      _and("options.local is not set", function() {
        beforeEach(function() {
          this.store.save('document', '123', {
            name: 'test',
            _$local: true
          });
        });

        it("should remove _$local attribute", function() {
          var object = getLastSavedObject();
          expect(object._$local).to.be(undefined);
        });
      }); // options.local is not set

      _and("object is new (not cached yet)", function() {
        beforeEach(function() {
          this.sandbox.spy(this.store, "trigger");
          stubFindItem('document', '1235', null);
          this.store.save('document', '1235', {
            name: 'test'
          });
        });

        it("should trigger add & change events", function() {
          var object = {
            id: '1235',
            type: 'document',
            name: 'test',
            createdAt: now(),
            updatedAt: now(),
            createdBy: 'owner_hash'
          };
          expect(this.store.trigger).to.be.calledWith('add', object, {});
          expect(this.store.trigger).to.be.calledWith('add:document', object, {});
          expect(this.store.trigger).to.be.calledWith('change', 'add', object, {});
          expect(this.store.trigger).to.be.calledWith('change:document', 'add', object, {});
        });
      }); // object is new (not cached yet)

      _when("successful", function() {
        it("should resolve the promise", function() {
          expect(this.promise).to.be.resolved();
        });

        _and("object did exist before", function() {
          beforeEach(function() {
            this.properties = {
              name: 'success',
              createdAt: now(),
              updatedAt: 'yesterday',
              createdBy: 'owner_hash'
            }

            stubFindItem('document', '123successful', this.properties )
            this.promise = this.store.save('document', '123successful', this.properties);
          });

          it("should pass the object & false (= not created) to done callback", function() {
            var object = $.extend({}, this.properties);
            object.updatedAt = now();
            object.type = 'document';
            object.id = '123successful';
            expect(this.promise).to.be.resolvedWith( object, false )
          });
        }); // object did exist before

        _and("object did not exist before", function() {
          beforeEach(function() {
            this.properties = {
              name: 'this is new'
            }

            stubFindItem('document', '123new', null )
            this.promise = this.store.save('document', '123new', this.properties);
          });

          it("should pass true (= new created) as the second param to the done callback", function() {
            var object = $.extend({}, this.properties);
            object.createdAt = now();
            object.updatedAt = now();
            object.createdBy = 'owner_hash';
            object.type = 'document';
            object.id = '123new';

            expect(this.promise).to.be.resolvedWith(object, true)
          });
        }); // object did not exist before
      }); // successful

      _when("failed", function() {
        beforeEach(function() {
          window.localStorage.setItem.throws(new Error('funk'));
          this.promise = this.store.save('document', '123ohoh', {
            name: 'test'
          });
        });

        it("should return a rejected promise", function() {
          expect(this.promise).to.be.rejectedWith('Error: funk');
        });
      }); // failed
    });

    _when("id is '123', type is 'document', object is {id: '123', type: 'document', name: 'test'}", function() {
      beforeEach(function() {
        this.store.save('document', '123', {
          id: '123',
          type: 'document',
          name: 'test with id & type'
        });
      });

      it("should not save type & id", function() {
        var object = getLastSavedObject();
        expect(object.name).to.be('test with id & type');
        expect(object.type).to.be(undefined);
        expect(object.id).to.be(undefined);
      });
    });

    _when("id is '123', type is '$internal', object is {action: 'do some background magic'}}", function() {
      beforeEach(function() {
        this.promise = this.store.save('$internal', '123', {
          action: 'do some background magic'
        });
      });

      it("should work", function() {
        expect(this.promise.state()).to.eql('resolved');
      });
    }); // id is '123', type is '$internal', object is {action: 'do some background magic'}}

    _when("id is '123hidden', type is 'document', existing object is {name: 'test', $hidden: 'fresh'}}", function() {
      beforeEach(function() {
        stubFindItem('document', '123hidden', {name: 'test', $hidden: 'fresh'})
      });

      it("should not overwrite $hidden property when not passed", function() {
        this.store.save('document', '123hidden', {
          name: 'new test'
        });
        var object = getLastSavedObject()
        expect(object.$hidden).to.eql('fresh');
      });

      it("should overwrite $hidden property when passed", function() {
        this.store.save('document', '123hidden', {
          name: 'new test',
          $hidden: 'wicked'
        });

        var object = getLastSavedObject()
        expect(object.$hidden).to.eql('wicked');
      });
    }); // id is '123hidden', type is 'document', object is {name: 'test', $hidden: 'fresh'}}

    _when("called without id", function() {
      beforeEach(function() {
        this.promise = this.store.save('document', undefined, {
          name: 'this is new'
        });
      });

      it("should generate an id", function() {
        var key = getLastSavedKey();
        expect(key).to.eql('document/uuid');
      });
    }); // called without id

    _when("store is bootstrapping", function() {

      beforeEach(function() {
        var called = false;
        this.sandbox.stub(this.store, 'isBootstrapping', function() {
          if (called) return false;
          called = true;
          return true;
        })
      });

      it("should wait until bootstrapping is finished", function() {
        var promise = this.store.save('task', '123', { title: 'do it!' });
        promise.fail( function() { console.log(arguments); });
        expect(promise).to.be.pending();
        this.store.subscribeToOutsideEvents();
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise).to.be.resolved();
      });
    }); // store is bootstrapping
  }); // #save

  //
  xdescribe("#add(type, object, options)", function() {
    it.skip("should return a decorated promise")
  });

  //
  xdescribe("#updateAll(objects)", function() {
    it.skip("should return a decorated promise")
  });

  //
  xdescribe("#find(type, id)", function() {

    beforeEach(function() {
    });

    it("should return a promise", function() {
      var promise = this.store.find('document', '123');
      expect(promise).to.be.promise()
    });

    describe("invalid arguments", function() {

      _when("no arguments passed", function() {

        it("should call the fail callback", function() {
          var promise = this.store.find();
          expect(promise).to.be.rejected();
        });

      });

      _when("no id passed", function() {
        it("should call the fail callback", function() {
          var promise = this.store.find('document');
          expect(promise).to.be.rejected();
        });
      });

    });

    _when("object can be found", function() {

      beforeEach(function() {
        stubFindItem('document', '123lessie', {
          name: 'woof'
        })
        this.promise = this.store.find('document', '123lessie');
      });

      it("should call the done callback", function() {
        expect(this.promise).to.be.resolvedWith({
          "name": "woof",
          "type": "document",
          "id": "123lessie"
        });
      });

    });

    _when("object cannot be found", function() {

      beforeEach(function() {
        stubFindItem('document', 'truelie', null)
        this.promise = this.store.find('document', 'abc4567');
      });

      it("should call the fail callback", function() {
        expect(this.promise).to.be.rejected();
      });
    });

    it("should cache the object after the first get", function() {
      this.store.find('document', 'abc4567cached');
      this.store.find('document', 'abc4567cached');
      expect(localStorage.getItem.callCount).to.eql(1);
    });

    _when("store is bootstrapping", function() {
      beforeEach(function() {
        var called = false;
        this.sandbox.stub(this.store, 'isBootstrapping', function() {
          if (called) return false;
          called = true;
          return true;
        })
      });

      it("should wait until bootstrapping is finished", function() {
        stubFindItem('document', '123boot', {
          name: 'me up'
        })
        var promise = this.store.find('document', '123boot');
        promise.fail( function() { console.log(arguments); });
        expect(promise).to.be.pending();
        this.store.subscribeToOutsideEvents();
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise).to.be.resolved();
      });
    });
  }); // #find

  //
  xdescribe("#findAll(filter)", function() {

    it("should return a promise", function() {
      var promise = this.store.findAll();
      expect(promise).to.be.promise();
    });

    with_2CatsAnd_3Dogs(function() {
      it("should sort by createdAt", function() {
        var promise = this.store.findAll()

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

    _when("called without a type", function() {

      with_2CatsAnd_3Dogs(function() {

        it("should return'em all", function() {
          var promise, results, success;
          success = this.sandbox.spy();
          promise = this.store.findAll();
          promise.done(success);
          results = success.args[0][0];
          expect(results.length).to.eql(5);
        });
      });

      _and("no documents exist in the store", function() {
        beforeEach(function() {
          this.sandbox.stub(this.store, "index").returns([]);
        });

        it("should return an empty array", function() {
          var promise = this.store.findAll();
          promise.then(function (res) {
            expect(res).to.eql([]);
          });
        });
      }); // no documents exist in the store

      _and("there are other documents in localStorage not stored with store", function() {
        beforeEach(function() {
          this.sandbox.stub(this.store, "index").returns(["_someConfig", "someOtherShizzle", "whatever", "valid/123"]);
          stubFindItem('valid', '123', {
            am: 'I'
          })
        });

        it("should not return them", function() {
          var promise, results, success;
          success = this.sandbox.spy();
          promise = this.store.findAll();
          promise.done(success);
          results = success.args[0][0];
          expect(results.length).to.eql(1);
        });
      }); // there are other documents in localStorage not stored with store
    }); // called without a type

    _when("called only with filter `function(obj) { return obj.age === 3}`", function() {
      with_2CatsAnd_3Dogs(function() {
        it("should only return the dog aged 3", function() {
          var promise, results, success;
          success = this.sandbox.spy();
          promise = this.store.findAll(function(obj) {
            return obj.age === 3;
          });
          promise.done(success);
          results = success.args[0][0];
          expect(results.length).to.eql(1);
        });
      });
    }); // called only with filter `function(obj) { return obj.age === 3}`

    _when("store is bootstrapping", function() {
      beforeEach(function() {
        var called = false;
        this.sandbox.stub(this.store, 'isBootstrapping', function() {
          if (called) return false;
          called = true;
          return true;
        })
      });

      it("should wait until bootstrapping is finished", function() {
        var promise = this.store.findAll('todo');
        promise.fail( function() { console.log(arguments); });

        expect(promise.state()).to.eql('pending');

        this.store.subscribeToOutsideEvents()
        this.hoodie.trigger('remote:bootstrap:end');

        expect(promise.state()).to.eql('resolved');
      });
    }); // store is bootstrapping
  }); // #findAll

  //
  xdescribe("#remove(type, id)", function() {
    _when("objecet cannot be found", function() {
      beforeEach(function() {
        stubFindItem('document', '123', null)
      });

      it("should return a rejected the promise", function() {
        var promise = this.store.remove('document', '123');
        expect(promise.state()).to.eql('rejected');
      });
    }); // objecet cannot be found

    _when("object can be found and has not been synched before", function() {

      beforeEach(function() {
        stubFindItem('document', '123', {
          funky: 'fresh'
        });
      });

      it("should remove the object", function() {
        this.store.remove('document', '123');
        expect(localStorage.removeItem.calledWith('document/123')).to.be.ok();
      });

      it("should cache that object has been removed", function() {
        this.store.remove('document', '123');
        expect(localStorage.getItem.callCount).to.be(1)
        this.store.find('document', '123');
        expect(localStorage.getItem.callCount).to.be(1)
      });

      it("should clear document from changed", function() {
        this.sandbox.spy(this.store, "clearChanged");
        this.store.remove('document', '123');
        expect(this.store.clearChanged).to.be.calledWith('document', '123');
      });

      it("should return a resolved promise", function() {
        var promise = this.store.remove('document', '123');
        expect(promise).to.be.resolved();
      });

      it("should return a clone of the cached object (before it was deleted)", function() {
        var promise = this.store.remove('document', '123');
        expect(promise).to.be.resolvedWith({
          type: 'document',
          id: '123',
          funky: 'fresh',
        })
      });
    });

    _when("object can be found and remove comes from remote", function() {
      beforeEach(function() {
        stubFindItem('document', '123', {
          name: 'test'
        });
        this.sandbox.spy(this.store, "trigger");
        debugger
        this.store.remove('document', '123', {
          remote: true
        });
      });

      it("should remove the object", function() {
        expect(localStorage.removeItem).to.be.calledWith('document/123');
      });

      it("should trigger remove & change trigger events", function() {

        expect(this.store.trigger).to.be.calledWith('remove', {
          id: '123',
          type: 'document',
          name: 'test'
        }, {
          remote: true
        })

        expect(this.store.trigger.calledWith('remove:document', {
          id: '123',
          type: 'document',
          name: 'test'
        }, {
          remote: true
        })).to.be.ok();

        expect(this.store.trigger.calledWith('remove:document:123', {
          id: '123',
          type: 'document',
          name: 'test'
        }, {
          remote: true
        })).to.be.ok();

        expect(this.store.trigger.calledWith('change', 'remove', {
          id: '123',
          type: 'document',
          name: 'test'
        }, {
          remote: true
        })).to.be.ok();

        expect(this.store.trigger.calledWith('change:document', 'remove', {
          id: '123',
          type: 'document',
          name: 'test'
        }, {
          remote: true
        })).to.be.ok();

        expect(this.store.trigger.calledWith('change:document:123', 'remove', {
          id: '123',
          type: 'document',
          name: 'test'
        }, {
          remote: true
        })).to.be.ok();

      });

    });

    _when("object can be found and was synched before", function() {

      beforeEach(function() {

        stubFindItem('document', '123', {
          _syncedAt: 'now'
        });
        this.store.remove('document', '123');
      });

      it("should mark the object as deleted and cache it", function() {
        var object = getLastSavedObject()
        expect(object._syncedAt).to.be('now')
        expect(object._deleted).to.be(true)
      });

      it("should not remove the object from store", function() {
        expect(localStorage.removeItem).to.not.be.calledWith('document/123');
      });
    });

    _when("store is bootstrapping", function() {

      beforeEach(function() {
        var called = false;
        this.sandbox.stub(this.store, 'isBootstrapping', function() {
          if (called) return false;
          called = true;
          return true;
        })
      });


      it("should wait until bootstrapping is finished", function() {
        stubFindItem('document', '123', {
          something: 'here'
        });
        var promise = this.store.remove('document', '123');
        expect(promise.state()).to.eql('pending');

        this.store.subscribeToOutsideEvents()
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise.state()).to.eql('resolved');
      });

    });
  }); // #remove

  //
  // TODO: remove store.cache method from being accessible from outside.
  //
  describe.skip("#cache(type, id, object)", function() {

    beforeEach(function() {
      this.sandbox.spy(this.store, "markAsChanged");
      this.sandbox.spy(this.store, "clearChanged");
      this.sandbox.spy(this.store, "_hasLocalChanges");
      this.sandbox.spy(this.store, "_isMarkedAsDeleted");
      this.store._cached = {};
    });

    _when("object passed", function() {

      it("should write the object to localStorage, but without type & id attributes", function() {
        this.store.cache('couch', '123', {
          color: 'red'
        });
        expect(this.store.db.setItem.calledWith('couch/123', '{"color":"red"}')).to.be.ok();
      });

      it("should make a deep copy of passed object", function() {
        var newObject, originalObject;
        originalObject = {
          nested: {
            property: 'funky'
          }
        };
        this.store.cache('couch', '123', originalObject);
        newObject = this.store.cache('couch', '123');
        newObject.nested.property = 'fresh';
        expect(originalObject.nested.property).to.eql('funky');
      });

      _and("`options.remote = true` passed", function() {

        it("should clear changed object", function() {
          this.store.cache('couch', '123', {
            color: 'red'
          }, {
            remote: true
          });
          expect(this.store.clearChanged.calledWith('couch', '123')).to.be.ok();
        });

        it("should make a deep copy of passed object", function() {
          var newObject, originalObject;
          originalObject = {
            nested: {
              property: 'funky'
            }
          };
          newObject = this.store.cache('couch', '123', originalObject, {
            remote: true
          });
          newObject.nested.property = 'fresh';
          expect(originalObject.nested.property).to.eql('funky');
        });

      });

      _and("object is marked as deleted", function() {

        it("should set cache to false store object in _dirty hash", function() {
          this.store._isMarkedAsDeleted.andReturn(true);
          this.store._cached = {};
          this.store._dirty = {};
          this.store._cached['couch/123'] = {
            color: 'red'
          };
          this.store.cache('couch', '123', {
            color: 'red',
            _deleted: true
          });
          expect(this.store._cached['couch/123']).to.eql(false);
        });

      });

    });

    _when("no object passed", function() {

      _and("object is already cached", function() {

        beforeEach(function() {
          this.store._cached['couch/123'] = {
            color: 'red'
          };
        });

        it("should not find it from localStorage", function() {
          this.store.cache('couch', '123');
          expect(this.store.db.getItem.called).to.not.be.ok();
        });

      });

      _and("object is not yet cached", function() {

        beforeEach(function() {
          delete this.store._cached['couch/123'];
        });

        _and("object does exist in localStorage", function() {

          beforeEach(function() {
            this.object = {
              type: 'couch',
              id: '123',
              color: 'red'
            };
            this.store._getObject.andReturn(this.object);
          });

          it("should cache it for future", function() {
            this.store.cache('couch', '123');
            expect(this.store._cached['couch/123'].color).to.eql('red');
          });

          it("should make a deep copy", function() {
            var obj1, obj2, originalObject;
            originalObject = {
              nested: {
                property: 'funky'
              }
            };
            this.store._getObject.andReturn(originalObject);
            obj1 = this.store.cache('couch', '123');
            obj1.nested.property = 'fresh';
            obj2 = this.store.cache('couch', '123');
            expect(obj2.nested.property).to.eql('funky');
          });

          _and("object is dirty", function() {

            beforeEach(function() {
              this.store._hasLocalChanges.returns(true);
            });

            it("should mark it as changed", function() {
              this.store.cache('couch', '123');
              expect(this.store.markAsChanged.calledWith('couch', '123', this.object, {})).to.be.ok();
            });

          });

          _and("object is not dirty", function() {

            beforeEach(function() {
              this.store._hasLocalChanges.returns(false);
            });

            _and("not marked as deleted", function() {

              beforeEach(function() {
                this.store._isMarkedAsDeleted.returns(false);
              });

              it("should clean it", function() {
                this.store.cache('couch', '123');
                expect(this.store.clearChanged.calledWith('couch', '123')).to.be.ok();
              });

            });

            _but("marked as deleted", function() {

              beforeEach(function() {
                this.store._isMarkedAsDeleted.returns(true);
              });

              it("should mark it as changed", function() {
                var object, options;
                this.store.cache('couch', '123');
                object = {
                  color: 'red',
                  type: 'couch',
                  id: '123'
                };
                options = {};
                expect(this.store.markAsChanged.calledWith('couch', '123', object, options)).to.be.ok();
              });

            });

          });

        });

        _and("object does not exist in localStorage", function() {

          beforeEach(function() {
            this.store._getObject.returns(false);
          });

          it("should cache it for future", function() {
            this.store.cache('couch', '123');
            expect(this.store._cached['couch/123']).to.eql(false);
          });

          it("should return false", function() {
            expect(this.store.cache('couch', '123')).to.eql(false);
          });

        });

      });

    });

    it("should return the object including type & id attributes", function() {
      var obj;
      obj = this.store.cache('couch', '123', {
        color: 'red'
      });
      expect(obj.color).to.eql('red');
      expect(obj.type).to.eql('couch');
      expect(obj.id).to.eql('123');
    });
  });

  //
  xdescribe("#clear()", function() {

    it("should return a promise", function() {
      var promise = this.store.clear();
      expect(promise).to.be.promise();
    });

    it("should clear localStorage", function() {
      this.sandbox.stub(this.store, "index").returns(['$config/hoodie', 'car/123', '_notOurBusiness']);
      this.store.clear();

      expect(localStorage.removeItem).to.be.calledWith('$config/hoodie');
      expect(localStorage.removeItem).to.be.calledWith('car/123');
      expect(localStorage.removeItem).to.not.be.calledWith('_notOurBusiness');
    });

    it("should clear chache", function() {
      this.store.find('document', '123')
      this.store.find('document', '123')
      expect(localStorage.getItem.callCount).to.be(1)
      this.store.clear();
      this.store.find('document', '123')
      expect(localStorage.getItem.callCount).to.be(2)
    });

    it("should clear dirty docs", function() {
      this.sandbox.spy(this.store, "clearChanged");
      this.store.clear();
      expect(this.store.clearChanged).to.be.called();
    });

    it("should resolve promise", function() {
      var promise = this.store.clear();
      expect(promise).to.be.resolved();
    });

    _when("an error occurs", function() {

      beforeEach(function() {
        this.sandbox.stub(this.store, "clearChanged", function() {
          throw new Error('ooops');
        });
      });

      it("should reject the promise", function() {
        var promise = this.store.clear();
        expect(promise.state()).to.eql('rejected');
      });
    }); // an error occurs
  }); // #clear

  //
  xdescribe("#hasLocalChanges(type, id)", function() {
    _when("no arguments passed", function() {
      it("returns false when there are no local changes", function() {
        expect(this.store.hasLocalChanges()).to.eql(false);
      });

      it("returns true when there are local changes", function() {
        this.store.add('song', { title: "Urlaub in Polen"});
        expect(this.store.hasLocalChanges()).to.eql(true);
      });
    }); // no arguments passed

    _when("type & id passed", function() {

      _and("object was not yet synced", function() {
        _and("object has saved with silent:true option", function() {

          beforeEach(function() {
            stubFindItem('couch', '123', {
              _syncedAt: void 0,
              updatedAt: void 0
            });
          });

          it("should return false", function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.be(false);
          });
        }); // object has saved with silent:true option

        _and("object has been saved without silent:true option", function() {

          beforeEach(function() {
            stubFindItem('couch', '123', {
              _syncedAt: void 0,
              updatedAt: now()
            });
          });

          it("should return true", function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.be(true);
          });
        }); // object has been saved without silent:true option
      }); // object was not yet synced

      _and("object was synced", function() {
        _and("object was updated before", function() {
          beforeEach(function() {
            stubFindItem('couch', '123', {
              _syncedAt: new Date(1),
              updatedAt: new Date(0)
            });
          });

          it("should return false", function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.not.be.ok();
          });
        }); // object was not updated yet

        _and("object was updated at the same time", function() {
          beforeEach(function() {
            stubFindItem('couch', '123', {
              _syncedAt: new Date(0),
              updatedAt: new Date(0)
            });
          });

          it("should return false", function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.be(false);
          });
        }); // object was updated at the same time

        _and("object was updated later", function() {
          beforeEach(function() {
            stubFindItem('couch', '123', {
              _syncedAt: new Date(0),
              updatedAt: new Date(1)
            });
          });

          it("should return true", function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.be(true);
          });
        }); // object was updated later
      }); // object was synced
    }); // type & id passed
  }); // #hasLocalChanges

  //
  describe("#markAllAsChanged(type, id, object)", function() {
    beforeEach(function() {
      this.findAllDefer = this.hoodie.defer();
      this.sandbox.stub(this.store, "findAll").returns(this.findAllDefer.promise());
      this.sandbox.spy(this.store, "trigger");
    });

    it("should find all local objects", function() {
      this.store.markAllAsChanged();
      expect(this.store.findAll.called).to.be.ok();
    });

    _when("findAll fails", function() {
      beforeEach(function() {
        this.findAllDefer.reject({
          reason: 'because'
        });
      });

      it("should return its rejected promise", function() {
        var promise = this.store.markAllAsChanged();
        expect(promise).to.be.rejectedWith({reason: 'because'});
      });
    }); // findAll fails

    _when("findAll succeeds", function() {
      beforeEach(function() {
        this.objects = [
          {
            id: '1',
            type: 'document',
            name: 'test1'
          }, {
            id: '2',
            type: 'document',
            name: 'test2'
          }, {
            id: '3',
            type: 'document',
            name: 'test3'
          }
        ];
        this.findAllDefer.resolve(this.objects);
        this.store.markAllAsChanged();
      });

      it("should add returned obejcts to the dirty list", function() {
        expect(this.store.changedObjects()).to.eql(this.objects)
      });

      it("should trigger 'dirty' & 'idle' event", function() {
        expect(this.store.trigger).to.be.calledWith('dirty');
        expect(this.store.trigger).to.not.be.calledWith('idle');
        this.clock.tick(2000);
        expect(this.store.trigger).to.be.calledWith('idle', this.objects);
      });
    }); // findAll succeeds
  }); // #markAllAsChanged

  //
  xdescribe("#changedObjects()", function() {

    _when("there are no changed docs", function() {

      beforeEach(function() {
        this.store._dirty = {};
      });

      it("should return an empty array", function() {
        expect($.isArray(this.store.changedObjects())).to.be.ok();
        expect(this.store.changedObjects().length).to.eql(0);
      });

    });

    _when("there are 2 dirty docs", function() {

      beforeEach(function() {
        this.store._dirty = {
          'couch/123': {
            color: 'red'
          },
          'couch/456': {
            color: 'green'
          }
        };
      });

      it("should return the two docs", function() {
        expect(this.store.changedObjects().length).to.eql(2);
      });

      it("should add type and id", function() {
        var doc1, doc2, _ref;
        _ref = this.store.changedObjects(), doc1 = _ref[0], doc2 = _ref[1];
        expect(doc1.type).to.eql('couch');
        expect(doc1.id).to.eql('123');
      });

    });
  });

  //
  xdescribe("#isMarkedAsDeleted(type, id)", function() {

    _when("object 'couch/123' is marked as deleted", function() {

      beforeEach(function() {
        this.sandbox.stub(this.store, "cache").returns({
          _deleted: true
        });
      });

      it("should return true", function() {
        expect(this.store.isMarkedAsDeleted('couch', '123')).to.be.ok();
      });
    });

    _when("object 'couch/123' isn't marked as deleted", function() {
      beforeEach(function() {
        this.sandbox.stub(this.store, "cache").returns({});
      });

      it("should return false", function() {
        expect(this.store.isMarkedAsDeleted('couch', '123')).to.not.be.ok();
      });
    });
  });

  //
  xdescribe("#clearChanged(type, id)", function() {

    it("should clear _dirtyTimeout", function() {
      this.store._dirtyTimeout = 1;
      this.store.clearChanged('couch', 123);
      expect(window.clearTimeout.calledWith(1)).to.be.ok();
    });

    _when("type & id passed", function() {

      it("should remove the respective object from the dirty list", function() {
        this.store._dirty['couch/123'] = {
          color: 'red'
        };
        this.store.clearChanged('couch', 123);

        expect(this.store._dirty['couch/123']).to.be(undefined);
      });

      it("should update array of _dirty IDs in localStorage", function() {
        this.store._dirty = {};
        this.store._dirty['couch/123'] = {
          color: 'red'
        };
        this.store._dirty['couch/456'] = {
          color: 'green'
        };
        this.store._dirty['couch/789'] = {
          color: 'black'
        };
        this.store.clearChanged('couch', 123);
        expect(this.store.db.setItem.calledWith('_dirty', 'couch/456,couch/789')).to.be.ok();
      });

    });

    _when("no arguments passed", function() {

      it("should remove all objects from the dirty list", function() {
        this.store._dirty = {
          'couch/123': {
            color: 'red'
          },
          'couch/456': {
            color: 'green'
          }
        };

        this.store.clearChanged();

        expect($.isEmptyObject(this.store._dirty)).to.be.ok();
      });

      it("should remove _dirty IDs from localStorage", function() {
        this.store.clearChanged();
        expect(this.store.db.removeItem.calledWith('_dirty')).to.be.ok();
      });
    });
  });

  //
  xdescribe("#trigger", function() {

    beforeEach(function() {
      this.sandbox.spy(this.hoodie, "trigger");
    });

    it("should proxy to hoodie.trigger with 'store' namespace", function() {
      this.store.trigger('event', {
        funky: 'fresh'
      });

      expect(this.hoodie.trigger.calledWith('store:event', {
        funky: 'fresh'
      })).to.be.ok();
    });
  });

  //
  xdescribe("#on", function() {

    beforeEach(function() {
      this.sandbox.spy(this.hoodie, "on");
    });

    it("should proxy to hoodie.on with 'store' namespace", function() {
      this.store.on('event', {
        funky: 'fresh'
      });
      expect(this.hoodie.on.calledWith('store:event', {
        funky: 'fresh'
      })).to.be.ok();
    });

    it("should namespace multiple events correctly", function() {
      var cb = this.sandbox.spy();
      this.store.on('super funky fresh', cb);
      expect(this.hoodie.on.calledWith('store:super store:funky store:fresh', cb)).to.be.ok();
    });
  });

  //
  xdescribe("#unbind", function() {

    beforeEach(function() {
      this.sandbox.spy(this.hoodie, "unbind");
    });

    it("should proxy to hoodie.unbind with 'store' namespace", function() {
      var cb = function() {};

      this.store.unbind('event', cb);
      expect(this.hoodie.unbind.calledWith('store:event', cb)).to.be.ok();
    });
  });

  //
  xdescribe("#decoratePromises", function() {
    var method, _i, _len, _ref, _results;

    it("should decorate promises returned by the store", function() {
      var funk = sinon.spy();

      this.store.decoratePromises({
        funk: funk
      });
      var promise = this.store.save('task', {
        title: 'save the world'
      });

      promise.funk();
      expect(funk.called).to.be.ok();
    });

    _ref = "add find findAll findOrAdd update updateAll remove removeAll".split(" ");
    _results = [];

    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      method = _ref[_i];

      _results.push(it("should scope passed methods to returned promise by " + method, function() {
        var promise;
        this.store.decoratePromises({
          funk: function() {
            return this;
          }
        });
        promise = this.store[method]('task', '12');
        expect(promise.funk()).to.have.property('done');
        expect(promise.funk()).to.not.have.property('resolved');
      }));
    }

    _results;
  });

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
  var key = [key, id].join('/');
  if (object) {
    delete object.id
    delete object.type
    object = JSON.stringify(object)
  }
  window.localStorage.getItem.withArgs(key).returns(object)
}

function with_2CatsAnd_3Dogs(specs) {

  _and("two cat and three dog objects exist in the store", function() {

    beforeEach(function() {
      this.sandbox.stub(this.store, "index").returns([
        "cat/1",
        "cat/2",
        "dog/1",
        "dog/2",
        "dog/3"
      ]);
      stubFindItem('cat', '1', {
        name: 'cat1',
        age: 1,
        createdAt: '1970-01-01T00:00:00.021Z',
        updatedAt: '1970-01-01T00:00:00.021Z'
      })
      stubFindItem('cat', '2', {
        name: 'cat2',
        age: 2,
        createdAt: '1970-01-01T00:00:00.022Z',
        updatedAt: '1970-01-01T00:00:00.022Z'
      })
      stubFindItem('dog', '1', {
        name: 'dog1',
        age: 1,
        createdAt: '1970-01-01T00:00:00.011Z',
        updatedAt: '1970-01-01T00:00:00.011Z'
      })
      stubFindItem('dog', '2', {
        name: 'dog2',
        age: 2,
        createdAt: '1970-01-01T00:00:00.012Z',
        updatedAt: '1970-01-01T00:00:00.012Z'
      })
      stubFindItem('dog', '3', {
        name: 'dog3',
        age: 3,
        createdAt: '1970-01-01T00:00:00.013Z',
        updatedAt: '1970-01-01T00:00:00.013Z'
      })
    });

    specs();
  });
};
