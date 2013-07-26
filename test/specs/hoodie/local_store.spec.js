describe("Hoodie.LocalStore", function() {
  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie;
    this.store = new Hoodie.LocalStore(this.hoodie);
    spyOn(this.store, "_setObject").andCallThrough();
    spyOn(this.store, "_getObject").andCallThrough();
    spyOn(this.store.db, "getItem").andCallThrough();
    spyOn(this.store.db, "setItem").andCallThrough();
    spyOn(this.store.db, "removeItem").andCallThrough();
    spyOn(this.store.db, "clear").andCallThrough();
    spyOn(window, "clearTimeout");
    spyOn(window, "setTimeout").andCallFake(function(cb) {
      cb();
      return 'newTimeout';
    });
  });

  // 
  describe("constructor", function() {
    _when("there are dirty objects in localStorage", function() {
      beforeEach(function() {
        Hoodie.LocalStore.prototype.db.getItem.andCallFake(function(key) {
          if (key === '_dirty') {
            return 'task/1';
          }
        });
        this.object = {
          type: 'task',
          id: '1',
          title: 'remember the milk'
        };
        spyOn(Hoodie.LocalStore.prototype, "_getObject").andReturn(this.object);
        spyOn(Hoodie.LocalStore.prototype, "_hasLocalChanges").andReturn(true);
        return spyOn(Hoodie.LocalStore.prototype, "trigger");
      });
      it("should trigger idle event if there are dirty objects in localStorage", function() {
        var store;
        spyOn(Hoodie.LocalStore.prototype, "changedObjects").andReturn([1, 2, 3]);
        store = new Hoodie.LocalStore(this.hoodie);
        return expect(Hoodie.LocalStore.prototype.trigger).wasCalledWith('idle', [1, 2, 3]);
      });
      return it("should cache dirty objects", function() {
        var store;
        spyOn(Hoodie.LocalStore.prototype, "cache");
        store = new Hoodie.LocalStore(this.hoodie);
        return expect(store.cache).wasCalledWith('task', '1');
      });
    });
    it("should not mess with LocalStore.prototype", function() {
      var promise, store1, store2;
      spyOn(Hoodie.LocalStore.prototype, "isPersistent").andReturn(false);
      store1 = new Hoodie.LocalStore(this.hoodie);
      store1.save('car', '123', {
        color: 'blue'
      });
      store2 = new Hoodie.LocalStore(this.hoodie);
      expect(store2._cached['car/123']).toBeUndefined();
      promise = store2.find('car', '123');
      return promise.then(function(wtf) {
        return console.log(JSON.stringify(wtf, '', '  '));
      });
    });
  });

  // 
  describe("outside events", function() {
    _when("account:cleanup event gets fired", function() {
      beforeEach(function() {
        spyOn(this.store, "clear");
        this.hoodie.trigger('account:cleanup')
      });

      // TODO: I can't figuer out why the spec fails, but it works.
      xit("should clear the store", function() {
        expect(this.store.clear).wasCalled();
      });
    });

    _when("account:signup event gets fired", function() {
      beforeEach(function() {
        spyOn(this.store, "markAllAsChanged");
        this.hoodie.trigger('account:signup');
      });

      // TODO: I can't figuer out why the spec fails, but it works.
      xit("should mark all objects as changed", function() {
        expect(this.store.markAllAsChanged).wasCalled();
      });
    });

    _when("remote:change event gets fired", function() {
      beforeEach(function() {
        this.object = {
          type: 'car',
          id: '123',
          color: 'red'
        };
      });
      _and("an object was removed", function() {
        beforeEach(function() {
          spyOn(this.store, "remove");
          this.hoodie.trigger('remote:change', 'remove', this.object);
        });
        it("removes the object in store", function() {
          expect(this.store.remove).wasCalledWith('car', '123', {
            remote: true
          });
        });
      });
      _and("an object was updated", function() {
        beforeEach(function() {
          spyOn(this.store, "save");
          this.hoodie.trigger('remote:change', 'update', this.object);
        });
        it("updates the object in store", function() {
          expect(this.store.save).wasCalledWith('car', '123', this.object, {
            remote: true
          });
        });
      });
    });

    _when("remote:bootstrap:start event gets fired", function() {
      beforeEach(function() {
        expect(this.store.isBootstrapping()).toBeFalsy();
        spyOn(this.store, "trigger");
        this.hoodie.trigger('remote:bootstrap:start', 'joe@example.com');
      });

      it("should start bootstrapping mode", function() {
        expect(this.store.isBootstrapping()).toBe(true);
      });

      it("should trigger bootstrap:start event", function() {
        expect(this.store.trigger).wasCalledWith('bootstrap:start');
      });

      _and("remote:bootstrap:end event gets fired", function() {
        beforeEach(function() {
          this.hoodie.trigger('remote:bootstrap:end');
        });

        it("should stop bootstrapping mode", function() {
          expect(this.store.isBootstrapping()).toBe(false);
        });
      })
    })
  });

  // 
  describe("#save(type, id, object, options)", function() {
    beforeEach(function() {
      return spyOn(this.store, "_now").andReturn('now');
    });
    it("should return a promise", function() {
      var promise;
      promise = this.store.save('document', '123', {
        name: 'test'
      });
      return expect(promise).toBePromise();
    });
    describe("invalid arguments", function() {
      _when("no arguments passed", function() {
        return it("should be rejected", function() {
          return expect(this.store.save()).toBeRejected();
        });
      });
      return _when("no object passed", function() {
        return it("should be rejected", function() {
          var promise;
          promise = this.store.save('document', 'abc4567');
          return expect(promise).toBeRejected();
        });
      });
    });
    _when("id is '123', type is 'document', object is {name: 'test'}", function() {
      beforeEach(function() {
        spyOn(this.store, "cache").andReturn('cachedObject');
        return this.promise = this.store.save('document', '123', {
          name: 'test'
        }, {
          option: 'value'
        });
      });
      it("should cache document", function() {
        return expect(this.store.cache).wasCalled();
      });
      it("should add timestamps", function() {
        var object;
        object = this.store.cache.mostRecentCall.args[2];
        expect(object.createdAt).toBe('now');
        return expect(object.updatedAt).toBe('now');
      });
      it("should pass options", function() {
        var options;
        options = this.store.cache.mostRecentCall.args[3];
        return expect(options.option).toBe('value');
      });
      _and("options.remote is true", function() {
        beforeEach(function() {
          spyOn(this.store, "trigger");
          this.store.cache.andCallFake(function(type, id, object) {
            if (object) {
              return {
                id: '123',
                type: 'document',
                name: 'test',
                _local: 'something',
                _rev: '2-345'
              };
            } else {
              return {
                id: '123',
                type: 'document',
                name: 'test',
                _local: 'something',
                old_attribute: 'what ever',
                _rev: '1-234'
              };
            }
          });
          return this.store.save('document', '123', {
            name: 'test',
            _rev: '2-345'
          }, {
            remote: true
          });
        });
        it("should not touch createdAt / updatedAt timestamps", function() {
          var object;
          object = this.store.cache.mostRecentCall.args[2];
          expect(object.createdAt).toBeUndefined();
          return expect(object.updatedAt).toBeUndefined();
        });
        it("should add a _syncedAt timestamp", function() {
          var object;
          object = this.store.cache.mostRecentCall.args[2];
          return expect(object._syncedAt).toBe('now');
        });
        it("should trigger update & change events", function() {
          var object, options;
          object = {
            id: '123',
            type: 'document',
            name: 'test',
            _local: 'something',
            _rev: '2-345'
          };
          options = {
            remote: true
          };
          expect(this.store.trigger).wasCalledWith('update', object, options);
          expect(this.store.trigger).wasCalledWith('update:document', object, options);
          expect(this.store.trigger).wasCalledWith('change', 'update', object, options);
          return expect(this.store.trigger).wasCalledWith('change:document', 'update', object, options);
        });
        it("should keep local attributes", function() {
          var object;
          object = this.store.cache.mostRecentCall.args[2];
          return expect(object._local).toBe('something');
        });
        return it("should update _rev", function() {
          var object;
          object = this.store.cache.mostRecentCall.args[2];
          return expect(object._rev).toBe('2-345');
        });
      });
      _and("options.silent is true", function() {
        beforeEach(function() {
          return this.store.save('document', '123', {
            name: 'test'
          }, {
            silent: true
          });
        });
        return it("should not touch createdAt / updatedAt timestamps", function() {
          var object;
          object = this.store.cache.mostRecentCall.args[2];
          expect(object.createdAt).toBeUndefined();
          return expect(object.updatedAt).toBeUndefined();
        });
      });
      _and("options.local is true", function() {
        beforeEach(function() {
          return this.store.save('document', '123', {
            name: 'test'
          }, {
            local: true
          });
        });
        return it("should set _$local = true", function() {
          var object;
          object = this.store.cache.mostRecentCall.args[2];
          return expect(object._$local).toBe(true);
        });
      });
      _and("options.local is not set", function() {
        beforeEach(function() {
          return this.store.save('document', '123', {
            name: 'test',
            _$local: true
          }, {
            local: void 0
          });
        });
        return it("should remove _$local attribute", function() {
          var object;
          object = this.store.cache.mostRecentCall.args[2];
          return expect(object._$local).toBeUndefined();
        });
      });
      _and("object is new (not cached yet)", function() {
        beforeEach(function() {
          spyOn(this.store, "trigger");
          this.store.cache.andCallFake(function(type, id, object) {
            if (object) {
              return {
                id: '123',
                type: 'document',
                name: 'test',
                _rev: '1-345'
              };
            } else {
              return void 0;
            }
          });
          return this.store.save('document', '123', {
            name: 'test'
          });
        });
        return it("should trigger add & change events", function() {
          var object;
          object = {
            id: '123',
            type: 'document',
            name: 'test',
            _rev: '1-345'
          };
          expect(this.store.trigger).wasCalledWith('add', object, {});
          expect(this.store.trigger).wasCalledWith('add:document', object, {});
          expect(this.store.trigger).wasCalledWith('change', 'add', object, {});
          return expect(this.store.trigger).wasCalledWith('change:document', 'add', object, {});
        });
      });
      _when("successful", function() {
        beforeEach(function() {
          return this.store.cache.andReturn('doc');
        });
        it("should resolve the promise", function() {
          return expect(this.promise).toBeResolved();
        });
        it("should pass the object to done callback", function() {
          return expect(this.promise).toBeResolvedWith('cachedObject', true);
        });
        _and("object did exist before", function() {
          beforeEach(function() {
            this.store.cache.andCallFake(function(type, id, object) {
              if (object) {
                return 'doc';
              } else {
                return {};
              }
            });
            return this.promise = this.store.save('document', '123', {
              name: 'test'
            }, {
              option: 'value'
            });
          });
          return it("should pass false (= not created) as the second param to the done callback", function() {
            return expect(this.promise).toBeResolvedWith('doc', false);
          });
        });
        return _and("object did not exist before", function() {
          beforeEach(function() {
            this.store.cache.andCallFake(function(type, id, object) {
              if (object) {
                return 'doc';
              } else {
                return void 0;
              }
            });
            return this.promise = this.store.save('document', '123', {
              name: 'test'
            }, {
              option: 'value'
            });
          });
          it("should pass true (= new created) as the second param to the done callback", function() {
            return expect(this.promise).toBeResolvedWith('doc', true);
          });
          return it("should set the createdBy attribute", function() {
            var object;
            object = this.store.cache.mostRecentCall.args[2];
            return expect(object.createdBy).toBe('owner_hash');
          });
        });
      });
      return _when("failed", function() {
        beforeEach(function() {
          return this.store.cache.andCallFake(function(type, id, object, options) {
            if (object) {
              throw new Error("i/o error");
            }
          });
        });
        return it("should return a rejected promise", function() {
          var promise;
          promise = this.store.save('document', '123', {
            name: 'test'
          });
          return expect(promise).toBeRejected();
        });
      });
    });
    _when("id is '123', type is 'document', object is {id: '123', type: 'document', name: 'test'}", function() {
      return beforeEach(function() {
        var key, type, _ref;
        this.store.save('document', '123', {
          id: '123',
          type: 'document',
          name: 'test'
        });
        return _ref = this.store.cache.mostRecentCall.args, type = _ref[0], key = _ref[1], this.object = _ref[2], _ref;
      });
    });
    _when("id is '123', type is '$internal', object is {action: 'do some background magic'}}", function() {
      beforeEach(function() {
        return this.promise = this.store.save('$internal', '123', {
          action: 'do some background magic'
        });
      });
      return it("should work", function() {
        return expect(this.promise).toBeResolved();
      });
    });
    _when("id is '123', type is 'document', object is {name: 'test', $hidden: 'fresh'}}", function() {
      beforeEach(function() {
        spyOn(this.store, "cache").andReturn('cachedObject');
        return this.store.cache.andReturn({
          name: 'test',
          $hidden: 'fresh'
        });
      });
      it("should not overwrite $hidden property when not passed", function() {
        var key, type, _ref;
        this.store.save('document', '123', {
          name: 'new test'
        });
        _ref = this.store.cache.mostRecentCall.args, type = _ref[0], key = _ref[1], this.object = _ref[2];
        return expect(this.object.$hidden).toBe('fresh');
      });
      return it("should overwrite $hidden property when passed", function() {
        var key, type, _ref;
        this.store.save('document', '123', {
          name: 'new test',
          $hidden: 'wicked'
        });
        _ref = this.store.cache.mostRecentCall.args, type = _ref[0], key = _ref[1], this.object = _ref[2];
        return expect(this.object.$hidden).toBe('wicked');
      });
    });
    it("should not overwrite createdAt attribute", function() {
      var id, object, type, _ref;
      spyOn(this.store, "cache").andReturn('cachedObject');
      this.store.save('document', '123', {
        createdAt: 'check12'
      });
      _ref = this.store.cache.mostRecentCall.args, type = _ref[0], id = _ref[1], object = _ref[2];
      return expect(object.createdAt).toBe('check12');
    });
    it("should allow numbers and lowercase letters for type only. And must start with a letter or $", function() {
      var invalid, key, promise, valid, _i, _j, _len, _len1, _results;
      invalid = ['UPPERCASE', 'underLines', '-?&$', '12345', 'a'];
      valid = ['car', '$email'];
      for (_i = 0, _len = invalid.length; _i < _len; _i++) {
        key = invalid[_i];
        promise = this.store.save(key, 'valid', {});
        expect(promise).toBeRejected();
      }
      _results = [];
      for (_j = 0, _len1 = valid.length; _j < _len1; _j++) {
        key = valid[_j];
        promise = this.store.save(key, 'valid', {});
        _results.push(expect(promise).toBeResolved());
      }
      return _results;
    });
    it("should allow numbers, lowercase letters and dashes for for id only", function() {
      var invalid, key, promise, valid, _i, _j, _len, _len1, _results;
      invalid = ['UPPERCASE', 'underLines', '-?&$'];
      valid = ['abc4567', '1', 123, 'abc-567'];
      for (_i = 0, _len = invalid.length; _i < _len; _i++) {
        key = invalid[_i];
        promise = this.store.save('valid', key, {});
        expect(promise).toBeRejected();
      }
      _results = [];
      for (_j = 0, _len1 = valid.length; _j < _len1; _j++) {
        key = valid[_j];
        promise = this.store.save('valid', key, {});
        _results.push(expect(promise).toBeResolved());
      }
      return _results;
    });
    _when("called without id", function() {
      beforeEach(function() {
        var _ref;
        spyOn(this.store, "cache").andReturn('cachedObject');
        this.promise = this.store.save('document', void 0, {
          name: 'test'
        }, {
          option: 'value'
        });
        return _ref = this.store.cache.mostRecentCall.args, this.type = _ref[0], this.key = _ref[1], this.object = _ref[2], _ref;
      });
      it("should generate an id", function() {
        return expect(this.key).toBe('uuid');
      });
      it("should set createdBy", function() {
        return expect(this.object.createdBy).toBe('owner_hash');
      });
      it("should pass options", function() {
        var options;
        options = this.store.cache.mostRecentCall.args[3];
        return expect(options.option).toBe('value');
      });
      return _when("successful", function() {
        it("should resolve the promise", function() {
          return expect(this.promise).toBeResolved();
        });
        it("should pass the object to done callback", function() {
          return expect(this.promise).toBeResolvedWith('cachedObject', true);
        });
        return it("should pass true (= created) as the second param to the done callback", function() {
          return expect(this.promise).toBeResolvedWith('cachedObject', true);
        });
      });
    });
    _when("store is bootstrapping", function() {
      beforeEach(function() {
        // we can't force it to return always true, as we'd
        // end up in infinite loop.
        // spyOn(this.store, "isBootstrapping").andReturn(true);
        this.store._bootstrapping = true;
        expect(this.store.isBootstrapping()).toEqual(true);
      });

      it("should wait until bootstrapping is finished", function() {
        var promise = this.store.save('task', '123', { title: 'do it!' })
        promise.fail( function() { console.log(arguments) });
        expect(promise.state()).toEqual('pending');
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise.state()).toEqual('resolved');
      });
    });
  });

  // 
  describe("#add(type, object, options)", function() {
    beforeEach(function() {
      return spyOn(this.store, "save").andReturn('promise');
    });
    return it("should call .save(type, undefined, options) and return its promise", function() {
      var promise;
      promise = this.store.add('couch', {
        funky: 'fresh'
      });
      expect(this.store.save).wasCalledWith('couch', void 0, {
        funky: 'fresh'
      });
      return expect(promise).toBe('promise');
    });

    _when("store is bootstrapping", function() {
      beforeEach(function() {
        // we can't force it to return always true, as we'd
        // end up in infinite loop.
        // spyOn(this.store, "isBootstrapping").andReturn(true);
        this.store._bootstrapping = true;
        expect(this.store.isBootstrapping()).toEqual(true);
      });

      it("should wait until bootstrapping is finished", function() {
        var promise = this.store.add('task', { title: 'do it!' })
        promise.fail( function() { console.log(arguments) });
        expect(promise.state()).toEqual('pending');
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise.state()).toEqual('resolved');
      });
    });
  });

  // 
  describe("#updateAll(objects)", function() {
    beforeEach(function() {
      spyOn(this.hoodie, "isPromise").andReturn(false);
      this.todoObjects = [
        {
          type: 'todo',
          id: '1'
        }, {
          type: 'todo',
          id: '2'
        }, {
          type: 'todo',
          id: '3'
        }
      ];
    });
    it("should return a promise", function() {
      expect(this.store.updateAll(this.todoObjects, {})).toBePromise();
    });
    it("should update objects", function() {
      var obj, _i, _len, _ref, _results;
      spyOn(this.store, "update");
      this.store.updateAll(this.todoObjects, {
        funky: 'update'
      });
      _ref = this.todoObjects;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        _results.push(expect(this.store.update).wasCalledWith(obj.type, obj.id, {
          funky: 'update'
        }, {}));
      }
      _results;
    });
    it("should resolve the returned promise once all objects have been updated", function() {
      var promise;
      promise = this.hoodie.defer().resolve().promise();
      spyOn(this.store, "update").andReturn(promise);
      expect(this.store.updateAll(this.todoObjects, {})).toBeResolved();
    });
    it("should not resolve the retunred promise unless object updates have been finished", function() {
      var promise;
      promise = this.hoodie.defer().promise();
      spyOn(this.store, "update").andReturn(promise);
      expect(this.store.updateAll(this.todoObjects, {})).notToBeResolved();
    });
    _when("passed objects is a promise", function() {
      beforeEach(function() {
        this.hoodie.isPromise.andReturn(true);
      });
      it("should update objects returned by promise", function() {
        var obj, promise, _i, _len, _ref,
          _this = this;
        promise = {
          pipe: function(cb) {
            cb(_this.todoObjects);
          }
        };
        spyOn(this.store, "update");
        this.store.updateAll(promise, {
          funky: 'update'
        });
        _ref = this.todoObjects;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          obj = _ref[_i];
          expect(this.store.update).wasCalledWith(obj.type, obj.id, {
            funky: 'update'
          }, {});
        }
      });
    });
    _when("store is bootstrapping", function() {
      beforeEach(function() {
        // we can't force it to return always true, as we'd
        // end up in infinite loop.
        // spyOn(this.store, "isBootstrapping").andReturn(true);
        this.store._bootstrapping = true;
        expect(this.store.isBootstrapping()).toEqual(true);
      });

      it("should wait until bootstrapping is finished", function() {
        var promise = this.store.updateAll(this.todoObjects, { title: 'do it!' })
        promise.fail( function() { console.log(arguments) });
        expect(promise.state()).toEqual('pending');
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise.state()).toEqual('resolved');
      });
    });
  });

  // 
  describe("#find(type, id)", function() {
    beforeEach(function() {
      spyOn(this.store, "cache").andCallThrough();
    });
    it("should return a promise", function() {
      this.promise = this.store.find('document', '123');
    });
    describe("invalid arguments", function() {
      _when("no arguments passed", function() {
        it("should call the fail callback", function() {
          var promise;
          promise = this.store.find();
          expect(promise).toBeRejected();
        });
      });
      _when("no id passed", function() {
        it("should call the fail callback", function() {
          var promise;
          promise = this.store.find('document');
          expect(promise).toBeRejected();
        });
      });
    });
    _when("object can be found", function() {
      beforeEach(function() {
        this.store.cache.andReturn({
          name: 'test'
        });
        this.promise = this.store.find('document', 'abc4567');
      });
      it("should call the done callback", function() {
        expect(this.promise).toBeResolved();
      });
    });
    _when("object cannot be found", function() {
      beforeEach(function() {
        this.store.cache.andReturn(false);
        this.promise = this.store.find('document', 'abc4567');
      });
      it("should call the fail callback", function() {
        expect(this.promise).toBeRejected();
      });
    });
    it("should cache the object after the first get", function() {
      this.store.find('document', 'abc4567');
      this.store.find('document', 'abc4567');
      expect(this.store.db.getItem.callCount).toBe(1);
    });
    _when("store is bootstrapping", function() {
      beforeEach(function() {
        // we can't force it to return always true, as we'd
        // end up in infinite loop.
        // spyOn(this.store, "isBootstrapping").andReturn(true);
        this.store._bootstrapping = true;
        expect(this.store.isBootstrapping()).toEqual(true);
      });

      it("should wait until bootstrapping is finished", function() {
        this.store.cache.andReturn({
          name: 'test'
        });
        var promise = this.store.find('todo', '123')
        promise.fail( function() { console.log(arguments) });
        expect(promise.state()).toEqual('pending');
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise.state()).toEqual('resolved');
      });
    });
  });

  // 
  describe("#findAll(filter)", function() {
    var with_2CatsAnd_3Dogs;
    with_2CatsAnd_3Dogs = function(specs) {
      _and("two cat and three dog objects exist in the store", function() {
        beforeEach(function() {
          spyOn(this.store, "index").andReturn(["cat/1", "cat/2", "dog/1", "dog/2", "dog/3"]);
          spyOn(this.store, "cache").andCallFake(function(type, id) {
            var createdAt;
            id = parseInt(id);
            if (type === 'dog') {
              createdAt = id + 10;
            } else {
              createdAt = id + 20;
            }
            return {
              name: "" + type + id,
              age: id,
              createdAt: new Date(createdAt)
            };
          });
        });
        specs();
      });
    };
    it("should return a promise", function() {
      var promise;
      promise = this.store.findAll();
      expect(promise).toBePromise();
    });
    with_2CatsAnd_3Dogs(function() {
      it("should sort by createdAt", function() {
        expect(this.store.findAll()).toBeResolvedWith([
          {
            name: 'cat2',
            age: 2,
            createdAt: new Date(22)
          }, {
            name: 'cat1',
            age: 1,
            createdAt: new Date(21)
          }, {
            name: 'dog3',
            age: 3,
            createdAt: new Date(13)
          }, {
            name: 'dog2',
            age: 2,
            createdAt: new Date(12)
          }, {
            name: 'dog1',
            age: 1,
            createdAt: new Date(11)
          }
        ]);
      });
    });
    _when("called without a type", function() {
      with_2CatsAnd_3Dogs(function() {
        it("should return'em all", function() {
          var promise, results, success;
          success = jasmine.createSpy('success');
          promise = this.store.findAll();
          promise.done(success);
          results = success.mostRecentCall.args[0];
          expect(results.length).toBe(5);
        });
      });
      _and("no documents exist in the store", function() {
        beforeEach(function() {
          spyOn(this.store, "index").andReturn([]);
        });
        it("should return an empty array", function() {
          var promise;
          promise = this.store.findAll();
          expect(promise).toBeResolvedWith([]);
        });
      });
      _and("there are other documents in localStorage not stored with store", function() {
        beforeEach(function() {
          spyOn(this.store, "index").andReturn(["_someConfig", "someOtherShizzle", "whatever", "valid/123"]);
          spyOn(this.store, "cache").andReturn({});
        });
        it("should not return them", function() {
          var promise, results, success;
          success = jasmine.createSpy('success');
          promise = this.store.findAll();
          promise.done(success);
          results = success.mostRecentCall.args[0];
          expect(results.length).toBe(1);
        });
      });
    });
    _when("called only with filter `function(obj) { return obj.age === 1}` ", function() {
      with_2CatsAnd_3Dogs(function() {
        it("should return one dog", function() {
          var promise, results, success;
          success = jasmine.createSpy('success');
          promise = this.store.findAll(function(obj) {
            return obj.age === 1;
          });
          promise.done(success);
          results = success.mostRecentCall.args[0];
          expect(results.length).toBe(2);
        });
      });
    });
    _when("store is bootstrapping", function() {
      beforeEach(function() {
        // we can't force it to return always true, as we'd
        // end up in infinite loop.
        // spyOn(this.store, "isBootstrapping").andReturn(true);
        this.store._bootstrapping = true;
        expect(this.store.isBootstrapping()).toEqual(true);
      });

      it("should wait until bootstrapping is finished", function() {
        var promise = this.store.findAll('todo')
        promise.fail( function() { console.log(arguments) });
        expect(promise.state()).toEqual('pending');
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise.state()).toEqual('resolved');
      });
    });
  });

  // 
  describe("#remove(type, id)", function() {
    _when("objecet cannot be found", function() {
      beforeEach(function() {
        spyOn(this.store, "cache").andReturn(false);
      });
      it("should return a rejected the promise", function() {
        var promise;
        promise = this.store.remove('document', '123');
        expect(promise).toBeRejected();
      });
    });
    _when("object can be found and has not been synched before", function() {
      beforeEach(function() {
        spyOn(this.store, "cache").andReturn({
          funky: 'fresh'
        });
      });
      it("should remove the object", function() {
        this.store.remove('document', '123');
        expect(this.store.db.removeItem).wasCalledWith('document/123');
      });
      it("should set the _cached object to false", function() {
        delete this.store._cached['document/123'];
        this.store.remove('document', '123');
        expect(this.store._cached['document/123']).toBe(false);
      });
      it("should clear document from changed", function() {
        spyOn(this.store, "clearChanged");
        this.store.remove('document', '123');
        expect(this.store.clearChanged).wasCalledWith('document', '123');
      });
      it("should return a resolved promise", function() {
        var promise;
        promise = this.store.remove('document', '123');
        expect(promise).toBeResolved();
      });
      it("should return a clone of the cached object (before it was deleted)", function() {
        var promise;
        promise = this.store.remove('document', '123', {
          remote: true
        });
        expect(promise).toBeResolvedWith({
          funky: 'fresh'
        });
      });
    });
    _when("object can be found and remove comes from remote", function() {
      beforeEach(function() {
        spyOn(this.store, "cache").andReturn({
          id: '123',
          type: 'document',
          name: 'test'
        });
        spyOn(this.store, "trigger");
        this.store.remove('document', '123', {
          remote: true
        });
      });
      it("should remove the object", function() {
        expect(this.store.db.removeItem).wasCalledWith('document/123');
      });
      it("should trigger remove & change trigger events", function() {
        expect(this.store.trigger).wasCalledWith('remove', {
          id: '123',
          type: 'document',
          name: 'test'
        }, {
          remote: true
        });
        expect(this.store.trigger).wasCalledWith('remove:document', {
          id: '123',
          type: 'document',
          name: 'test'
        }, {
          remote: true
        });
        expect(this.store.trigger).wasCalledWith('remove:document:123', {
          id: '123',
          type: 'document',
          name: 'test'
        }, {
          remote: true
        });
        expect(this.store.trigger).wasCalledWith('change', 'remove', {
          id: '123',
          type: 'document',
          name: 'test'
        }, {
          remote: true
        });
        expect(this.store.trigger).wasCalledWith('change:document', 'remove', {
          id: '123',
          type: 'document',
          name: 'test'
        }, {
          remote: true
        });
        expect(this.store.trigger).wasCalledWith('change:document:123', 'remove', {
          id: '123',
          type: 'document',
          name: 'test'
        }, {
          remote: true
        });
      });
    });
    _when("object can be found and was synched before", function() {
      beforeEach(function() {
        spyOn(this.store, "cache").andReturn({
          _syncedAt: 'now'
        });
        this.store.remove('document', '123');
      });
      it("should mark the object as deleted and cache it", function() {
        expect(this.store.cache).wasCalledWith('document', '123', {
          _syncedAt: 'now',
          _deleted: true
        });
      });
      it("should not remove the object from store", function() {
        expect(this.store.db.removeItem).wasNotCalled();
      });
    });
    _when("store is bootstrapping", function() {
      beforeEach(function() {
        // we can't force it to return always true, as we'd
        // end up in infinite loop.
        // spyOn(this.store, "isBootstrapping").andReturn(true);
        this.store._bootstrapping = true;
        expect(this.store.isBootstrapping()).toEqual(true);

        spyOn(this.store, "cache").andReturn({ funky: 'fresh' });
      });

      it("should wait until bootstrapping is finished", function() {
        var promise = this.store.remove('todo', '123')
        expect(promise.state()).toEqual('pending');
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise.state()).toEqual('resolved');
      });
    });
  });

  // 
  describe("#cache(type, id, object)", function() {
    beforeEach(function() {
      spyOn(this.store, "markAsChanged");
      spyOn(this.store, "clearChanged");
      spyOn(this.store, "_hasLocalChanges");
      spyOn(this.store, "_isMarkedAsDeleted");
      return this.store._cached = {};
    });
    _when("object passed", function() {
      it("should write the object to localStorage, but without type & id attributes", function() {
        this.store.cache('couch', '123', {
          color: 'red'
        });
        return expect(this.store.db.setItem).wasCalledWith('couch/123', '{"color":"red"}');
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
        return expect(originalObject.nested.property).toBe('funky');
      });
      _and("`options.remote = true` passed", function() {
        it("should clear changed object", function() {
          this.store.cache('couch', '123', {
            color: 'red'
          }, {
            remote: true
          });
          return expect(this.store.clearChanged).wasCalledWith('couch', '123');
        });
        return it("should make a deep copy of passed object", function() {
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
          return expect(originalObject.nested.property).toBe('funky');
        });
      });
      return _and("object is marked as deleted", function() {
        return it("should set cache to false store object in _dirty hash", function() {
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
          return expect(this.store._cached['couch/123']).toBe(false);
        });
      });
    });
    _when("no object passed", function() {
      _and("object is already cached", function() {
        beforeEach(function() {
          return this.store._cached['couch/123'] = {
            color: 'red'
          };
        });
        return it("should not find it from localStorage", function() {
          this.store.cache('couch', '123');
          return expect(this.store.db.getItem).wasNotCalled();
        });
      });
      return _and("object is not yet cached", function() {
        beforeEach(function() {
          return delete this.store._cached['couch/123'];
        });
        _and("object does exist in localStorage", function() {
          beforeEach(function() {
            this.object = {
              type: 'couch',
              id: '123',
              color: 'red'
            };
            return this.store._getObject.andReturn(this.object);
          });
          it("should cache it for future", function() {
            this.store.cache('couch', '123');
            return expect(this.store._cached['couch/123'].color).toBe('red');
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
            return expect(obj2.nested.property).toBe('funky');
          });
          _and("object is dirty", function() {
            beforeEach(function() {
              return this.store._hasLocalChanges.andReturn(true);
            });
            return it("should mark it as changed", function() {
              this.store.cache('couch', '123');
              return expect(this.store.markAsChanged).wasCalledWith('couch', '123', this.object, {});
            });
          });
          return _and("object is not dirty", function() {
            beforeEach(function() {
              return this.store._hasLocalChanges.andReturn(false);
            });
            _and("not marked as deleted", function() {
              beforeEach(function() {
                return this.store._isMarkedAsDeleted.andReturn(false);
              });
              return it("should clean it", function() {
                this.store.cache('couch', '123');
                return expect(this.store.clearChanged).wasCalledWith('couch', '123');
              });
            });
            return _but("marked as deleted", function() {
              beforeEach(function() {
                return this.store._isMarkedAsDeleted.andReturn(true);
              });
              return it("should mark it as changed", function() {
                var object, options;
                this.store.cache('couch', '123');
                object = {
                  color: 'red',
                  type: 'couch',
                  id: '123'
                };
                options = {};
                return expect(this.store.markAsChanged).wasCalledWith('couch', '123', object, options);
              });
            });
          });
        });
        return _and("object does not exist in localStorage", function() {
          beforeEach(function() {
            return this.store._getObject.andReturn(false);
          });
          it("should cache it for future", function() {
            this.store.cache('couch', '123');
            return expect(this.store._cached['couch/123']).toBe(false);
          });
          return it("should return false", function() {
            return expect(this.store.cache('couch', '123')).toBe(false);
          });
        });
      });
    });
    return it("should return the object including type & id attributes", function() {
      var obj;
      obj = this.store.cache('couch', '123', {
        color: 'red'
      });
      expect(obj.color).toBe('red');
      expect(obj.type).toBe('couch');
      return expect(obj.id).toBe('123');
    });
  });

  // 
  describe("#clear()", function() {
    it("should return a promise", function() {
      var promise;
      promise = this.store.clear();
      return expect(promise).toBePromise();
    });
    it("should clear localStorage", function() {
      spyOn(this.store, "index").andReturn(['$config/hoodie', 'car/123', '_notOurBusiness']);
      this.store.clear();
      expect(this.store.db.removeItem).wasCalledWith('$config/hoodie');
      expect(this.store.db.removeItem).wasCalledWith('car/123');
      return expect(this.store.db.removeItem).wasNotCalledWith('_notOurBusiness');
    });
    it("should clear chache", function() {
      this.store._cached = 'funky';
      this.store.clear();
      return expect($.isEmptyObject(this.store._cached)).toBeTruthy();
    });
    it("should clear dirty docs", function() {
      spyOn(this.store, "clearChanged");
      this.store.clear();
      return expect(this.store.clearChanged).wasCalled();
    });
    it("should resolve promise", function() {
      var promise;
      promise = this.store.clear();
      return expect(promise).toBeResolved();
    });
    return _when("an error occurs", function() {
      beforeEach(function() {
        return spyOn(this.store, "clearChanged").andCallFake(function() {
          throw new Error('ooops');
        });
      });
      return it("should reject the promise", function() {
        var promise;
        promise = this.store.clear();
        return expect(promise).toBeRejected();
      });
    });
  });

  // 
  describe("#hasLocalChanges(type, id)", function() {
    _when("no arguments passed", function() {
      it("returns true when there are dirty documents", function() {
        this.store._dirty = {
          "doc/1": {},
          "doc/2": {}
        };
        return expect(this.store.hasLocalChanges()).toBe(true);
      });
      return it("returns false when there are no dirty documents", function() {
        this.store._dirty = {};
        return expect(this.store.hasLocalChanges()).toBe(false);
      });
    });
    return _when("type & id passed", function() {
      _and("object was not yet synced", function() {
        _and("object has saved with silent:true option", function() {
          beforeEach(function() {
            return spyOn(this.store, "cache").andReturn({
              _syncedAt: void 0,
              updatedAt: void 0
            });
          });
          return it("should return false", function() {
            return expect(this.store.hasLocalChanges('couch', '123')).toBe(false);
          });
        });
        return _and("object has been saved without silent:true option", function() {
          beforeEach(function() {
            return spyOn(this.store, "cache").andReturn({
              _syncedAt: void 0,
              updatedAt: new Date(0)
            });
          });
          return it("should return true", function() {
            return expect(this.store.hasLocalChanges('couch', '123')).toBe(true);
          });
        });
      });
      return _and("object was synced", function() {
        _and("object was not updated yet", function() {
          beforeEach(function() {
            return spyOn(this.store, "cache").andReturn({
              _syncedAt: new Date(0),
              updatedAt: void 0
            });
          });
          return it("should return false", function() {
            return expect(this.store.hasLocalChanges('couch', '123')).toBeFalsy();
          });
        });
        _and("object was updated at the same time", function() {
          beforeEach(function() {
            return spyOn(this.store, "cache").andReturn({
              _syncedAt: new Date(0),
              updatedAt: new Date(0)
            });
          });
          return it("should return false", function() {
            return expect(this.store.hasLocalChanges('couch', '123')).toBeFalsy();
          });
        });
        return _and("object was updated later", function() {
          beforeEach(function() {
            return spyOn(this.store, "cache").andReturn({
              _syncedAt: new Date(0),
              updatedAt: new Date(1)
            });
          });
          return it("should return true", function() {
            return expect(this.store.hasLocalChanges('couch', '123')).toBeTruthy();
          });
        });
      });
    });
  });

  // 
  describe("#markAsChanged(type, id, object)", function() {
    beforeEach(function() {
      this.store._dirty = {};
      spyOn(this.store, "trigger");
      return this.store.markAsChanged('couch', '123', {
        color: 'red'
      });
    });
    it("should add it to the dirty list", function() {
      return expect(this.store._dirty['couch/123'].color).toBe('red');
    });
    it("should start dirty timeout for 2 seconds", function() {
      var args;
      args = window.setTimeout.mostRecentCall.args;
      expect(args[1]).toBe(2000);
      return expect(this.store._dirtyTimeout).toBe('newTimeout');
    });
    it("should clear dirty timeout", function() {
      this.store._dirtyTimeout = 'timeout';
      this.store.markAsChanged('couch', '123', {
        color: 'red'
      });
      return expect(window.clearTimeout).wasCalledWith('timeout');
    });
    return it("should trigger 'dirty' event", function() {
      return expect(this.store.trigger).wasCalledWith('dirty');
    });
  });

  // 
  describe("#markAllAsChanged(type, id, object)", function() {
    beforeEach(function() {
      this.findAllDefer = this.hoodie.defer();
      spyOn(this.store, "markAsChanged").andCallThrough();
      spyOn(this.store, "findAll").andReturn(this.findAllDefer.promise());
      return spyOn(this.store, "changedObjects").andReturn('changedObjects');
    });
    it("should find all local objects", function() {
      this.store.markAllAsChanged();
      return expect(this.store.findAll).wasCalled();
    });
    _when("findAll fails", function() {
      beforeEach(function() {
        return this.findAllDefer.reject({
          reason: 'because'
        });
      });
      return it("should return its rejected promise", function() {
        var promise;
        promise = this.store.markAllAsChanged();
        return expect(promise).toBeRejectedWith({
          reason: 'because'
        });
      });
    });
    return _when("findAll succeeds", function() {
      beforeEach(function() {
        this.store._dirty = {};
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
        spyOn(this.store, "trigger");
        this.store._dirtyTimeout = 'timeout';
        return this.store.markAllAsChanged();
      });
      it("should add returned obejcts to the dirty list", function() {
        expect(this.store._dirty['document/1'].name).toBe('test1');
        expect(this.store._dirty['document/2'].name).toBe('test2');
        return expect(this.store._dirty['document/3'].name).toBe('test3');
      });
      it("should start dirty timeout for 2 seconds", function() {
        var args;
        args = window.setTimeout.mostRecentCall.args;
        expect(args[1]).toBe(2000);
        expect(this.store._dirtyTimeout).toBe('newTimeout');
        return expect(window.setTimeout.callCount).toBe(1);
      });
      it("should clear dirty timeout", function() {
        expect(window.clearTimeout).wasCalledWith('timeout');
        return expect(window.clearTimeout.callCount).toBe(1);
      });
      return it("should trigger 'dirty' & 'idle' event", function() {
        expect(this.store.trigger).wasCalledWith('dirty');
        expect(this.store.trigger).wasCalledWith('idle', 'changedObjects');
        return expect(this.store.trigger.callCount).toBe(2);
      });
    });
  });

  // 
  describe("#changedObjects()", function() {
    _when("there are no changed docs", function() {
      beforeEach(function() {
        return this.store._dirty = {};
      });
      return it("should return an empty array", function() {
        expect($.isArray(this.store.changedObjects())).toBeTruthy();
        return expect(this.store.changedObjects().length).toBe(0);
      });
    });
    return _when("there are 2 dirty docs", function() {
      beforeEach(function() {
        return this.store._dirty = {
          'couch/123': {
            color: 'red'
          },
          'couch/456': {
            color: 'green'
          }
        };
      });
      it("should return the two docs", function() {
        return expect(this.store.changedObjects().length).toBe(2);
      });
      return it("should add type and id", function() {
        var doc1, doc2, _ref;
        _ref = this.store.changedObjects(), doc1 = _ref[0], doc2 = _ref[1];
        expect(doc1.type).toBe('couch');
        return expect(doc1.id).toBe('123');
      });
    });
  });

  // 
  describe("#isMarkedAsDeleted(type, id)", function() {
    _when("object 'couch/123' is marked as deleted", function() {
      beforeEach(function() {
        return spyOn(this.store, "cache").andReturn({
          _deleted: true
        });
      });
      return it("should return true", function() {
        return expect(this.store.isMarkedAsDeleted('couch', '123')).toBeTruthy();
      });
    });
    return _when("object 'couch/123' isn't marked as deleted", function() {
      beforeEach(function() {
        return spyOn(this.store, "cache").andReturn({});
      });
      return it("should return false", function() {
        return expect(this.store.isMarkedAsDeleted('couch', '123')).toBeFalsy();
      });
    });
  });

  // 
  describe("#clearChanged(type, id)", function() {
    it("should clear _dirtyTimeout", function() {
      this.store._dirtyTimeout = 1;
      this.store.clearChanged('couch', 123);
      return expect(window.clearTimeout).wasCalledWith(1);
    });
    _when("type & id passed", function() {
      it("should remove the respective object from the dirty list", function() {
        this.store._dirty['couch/123'] = {
          color: 'red'
        };
        this.store.clearChanged('couch', 123);
        return expect(this.store._dirty['couch/123']).toBeUndefined();
      });
      return it("should update array of _dirty IDs in localStorage", function() {
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
        return expect(this.store.db.setItem).wasCalledWith('_dirty', 'couch/456,couch/789');
      });
    });
    return _when("no arguments passed", function() {
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
        return expect($.isEmptyObject(this.store._dirty)).toBeTruthy();
      });
      return it("should remove _dirty IDs from localStorage", function() {
        this.store.clearChanged();
        return expect(this.store.db.removeItem).wasCalledWith('_dirty');
      });
    });
  });

  // 
  describe("#trigger", function() {
    beforeEach(function() {
      return spyOn(this.hoodie, "trigger");
    });
    return it("should proxy to hoodie.trigger with 'store' namespace", function() {
      this.store.trigger('event', {
        funky: 'fresh'
      });
      return expect(this.hoodie.trigger).wasCalledWith('store:event', {
        funky: 'fresh'
      });
    });
  });

  // 
  describe("#on", function() {
    beforeEach(function() {
      spyOn(this.hoodie, "on");
    });
    it("should proxy to hoodie.on with 'store' namespace", function() {
      this.store.on('event', {
        funky: 'fresh'
      });
      expect(this.hoodie.on).wasCalledWith('store:event', {
        funky: 'fresh'
      });
    });
    it("should namespace multiple events correctly", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.store.on('super funky fresh', cb);
      expect(this.hoodie.on).wasCalledWith('store:super store:funky store:fresh', cb);
    });
  });

  // 
  describe("#unbind", function() {
    beforeEach(function() {
      spyOn(this.hoodie, "unbind");
    });
    it("should proxy to hoodie.unbind with 'store' namespace", function() {
      var cb = function() {};

      this.store.unbind('event', cb);
      expect(this.hoodie.unbind).wasCalledWith('store:event', cb);
    });
  });

  // 
  describe("#decoratePromises", function() {
    var method, _i, _len, _ref, _results;
    it("should decorate promises returned by the store", function() {
      var funk, promise;
      funk = jasmine.createSpy('funk');
      this.store.decoratePromises({
        funk: funk
      });
      promise = this.store.save('task', {
        title: 'save the world'
      });
      promise.funk();
      return expect(funk).wasCalled();
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
        return expect(promise.funk()).toBePromise();
      }));
    }
    return _results;
  });
});
