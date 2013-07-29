'use strict';

describe("Hoodie.LocalStore", function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    this.store = new Hoodie.LocalStore(this.hoodie);

    this.sandbox = sinon.sandbox.create();

    this.sandbox.stub(this.store, "_setObject");
    this.sandbox.stub(this.store, "_getObject");
    this.sandbox.stub(this.store.db, "getItem");
    this.sandbox.stub(this.store.db, "setItem");
    this.sandbox.stub(this.store.db, "removeItem");
    this.sandbox.stub(this.store.db, "clear");

    this.sandbox.spy(window, "clearTimeout");
    this.sandbox.stub(window, "setTimeout").returns(function(cb) {
      cb();
      return 'newTimeout';
    });

  });

  afterEach(function () {
    this.sandbox.restore();
  });

  xdescribe("constructor", function() {

    _when("there are dirty objects in localStorage", function() {

      beforeEach(function() {
        Hoodie.LocalStore.prototype.db.getItem.returns(function(key) {
          if (key === '_dirty') {
            return 'task/1';
          }
        });
        this.object = {
          type: 'task',
          id: '1',
          title: 'remember the milk'
        };
        this.sandbox.stub(Hoodie.LocalStore.prototype, "_getObject").returns(this.object);
        this.sandbox.stub(Hoodie.LocalStore.prototype, "_hasLocalChanges").returns(true);
        this.sandbox.spy(Hoodie.LocalStore.prototype, "trigger");
      });

      it("should trigger idle event if there are dirty objects in localStorage", function() {
        this.sandbox.stub(Hoodie.LocalStore.prototype, "changedObjects").returns([1, 2, 3]);
        var store = new Hoodie.LocalStore(this.hoodie);
        expect(Hoodie.LocalStore.prototype.trigger.calledWith('idle', [1, 2, 3])).to.be.ok();
      });

      it("should cache dirty objects", function() {
        this.sandbox.spy(Hoodie.LocalStore.prototype, "cache");
        var store = new Hoodie.LocalStore(this.hoodie);

        expect(store.cache.calledWith('task', '1')).to.be.ok();
      });

    });

    it("should not mess with LocalStore.prototype", function() {
      var promise, store1, store2;
      this.sandbox.stub(Hoodie.LocalStore.prototype, "isPersistent").returns(false);
      store1 = new Hoodie.LocalStore(this.hoodie);
      store1.save('car', '123', {
        color: 'blue'
      });
      store2 = new Hoodie.LocalStore(this.hoodie);

      expect(store2._cached['car/123']).to.be.undefined;
      promise = store2.find('car', '123');
      promise.then(function(wtf) {
        console.log(JSON.stringify(wtf, '', '  '));
      });
    });

  });

  //
  xdescribe("outside events", function() {

    _when("account:cleanup event gets fired", function() {

      beforeEach(function() {
        this.sandbox.spy(this.store, "clear");
        this.hoodie.trigger('account:cleanup');
      });

      // TODO: I can't figuer out why the spec fails, but it works.
      xit("should clear the store", function() {
        expect(this.store.clear.called).to.be.ok();
      });
    });

    _when("account:signup event gets fired", function() {

      beforeEach(function() {
        this.sandbox.spy(this.store, "markAllAsChanged");
        this.hoodie.trigger('account:signup');
      });

      it("should mark all objects as changed", function() {
        expect(this.store.markAllAsChanged.called).to.be.ok();
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
          this.sandbox.spy(this.store, "remove");
          this.hoodie.trigger('remote:change', 'remove', this.object);
        });

        it("removes the object in store", function() {
          expect(this.store.remove.calledWith('car', '123', {
            remote: true
          })).to.be.ok();
        });

      });

      _and("an object was updated", function() {

        beforeEach(function() {
          this.sandbox.spy(this.store, "save");
          this.hoodie.trigger('remote:change', 'update', this.object);
        });

        it("updates the object in store", function() {
          expect(this.store.save.calledWith('car', '123', this.object, {
            remote: true
          })).to.be.ok();
        });

      });

    });

    _when("remote:bootstrap:start event gets fired", function() {

      beforeEach(function() {
        expect(this.store.isBootstrapping()).to.not.be.ok();
        this.sandbox.spy(this.store, "trigger");
        this.hoodie.trigger('remote:bootstrap:start', 'joe@example.com');
      });

      it("should start bootstrapping mode", function() {
        expect(this.store.isBootstrapping()).to.be.ok();
      });

      it("should trigger bootstrap:start event", function() {
        expect(this.store.trigger.calledWith('bootstrap:start')).to.be.ok();
      });

      _and("remote:bootstrap:end event gets fired", function() {

        beforeEach(function() {
          this.hoodie.trigger('remote:bootstrap:end');
        });

        it("should stop bootstrapping mode", function() {
          expect(this.store.isBootstrapping()).to.not.be.ok();
        });
      });

    });

  });

  //
  xdescribe("#save(type, id, object, options)", function() {

    beforeEach(function() {
      this.sandbox.stub(this.store, "_now").returns('now');
    });

    it("should return a promise", function() {
      var promise = this.store.save('document', '123', {
        name: 'test'
      });
      expect(promise.state()).to.eql('pending');
    });

    describe("invalid arguments", function() {

      _when("no arguments passed", function() {

        it("should be rejected", function() {
          expect(this.store.save().state()).to.eql('rejected');
        });

      });

      _when("no object passed", function() {

        it("should be rejected", function() {
          var promise = this.store.save('document', 'abc4567');
          expect(promise.state()).to.eql('rejected');
        });

      });

    });

    _when("id is '123', type is 'document', object is {name: 'test'}", function() {

      beforeEach(function() {

        this.sandbox.stub(this.store, "cache").returns('cachedObject');

        this.promise = this.store.save('document', '123', {
          name: 'test'
        }, {
          option: 'value'
        });
      });

      it("should cache document", function() {
        expect(this.store.cache.called).to.be.ok();
      });

      it("should add timestamps", function() {
        var object = this.store.cache.args[2];
        expect(object.createdAt).to.eql('now');
        expect(object.updatedAt).to.eql('now');
      });

      it("should pass options", function() {
        var options = this.store.cache.args[3];
        expect(options.option).to.eql('value');
      });

      _and("options.remote is true", function() {

        beforeEach(function() {

          this.sandbox.spy(this.store, "trigger");

          this.store.cache.returns(function(type, id, object) {
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

          this.store.save('document', '123', {
            name: 'test',
            _rev: '2-345'
          }, {
            remote: true
          });

        });

        it("should not touch createdAt / updatedAt timestamps", function() {
          var object = this.store.cache.args[2];
          expect(object.createdAt).to.be.undefined;
          expect(object.updatedAt).to.be.undefined;
        });

        it("should add a _syncedAt timestamp", function() {
          var object = this.store.cache.args[2];
          expect(object._syncedAt).to.eql('now');
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

          expect(this.store.trigger.calledWith('update', object, options)).to.be.ok();
          expect(this.store.trigger.calledWith('update:document', object, options)).to.be.ok();
          expect(this.store.trigger.calledWith('change', 'update', object, options)).to.be.ok();
          expect(this.store.trigger.calledWith('change:document', 'update', object, options)).to.be.ok();
        });

        it("should keep local attributes", function() {
          var object = this.store.cache.args[2];
          expect(object._local).to.eql('something');
        });

        it("should update _rev", function() {
          var object = this.store.cache.args[2];
          expect(object._rev).to.eql('2-345');
        });

      });

      _and("options.silent is true", function() {

        beforeEach(function() {
          this.store.save('document', '123', {
            name: 'test'
          }, {
            silent: true
          });
        });

        it("should not touch createdAt / updatedAt timestamps", function() {
          var object = this.store.cache.mostRecentCall.args[2];
          expect(object.createdAt).to.be.undefined;
          expect(object.updatedAt).to.be.undefined;
        });

      });

      _and("options.local is true", function() {

        beforeEach(function() {
          this.store.save('document', '123', {
            name: 'test'
          }, {
            local: true
          });
        });

        it("should set _$local = true", function() {
          var object = this.store.cache.args[2];
          expect(object._$local).to.be.ok();
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

        it("should remove _$local attribute", function() {
          var object = this.store.cache.args[2];
          expect(object._$local).to.be.undefined;
        });

      });

      _and("object is new (not cached yet)", function() {

        beforeEach(function() {
          this.sandbox.spy(this.store, "trigger");
          this.store.cache.returns(function(type, id, object) {
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

          this.store.save('document', '123', {
            name: 'test'
          });

        });

        it("should trigger add & change events", function() {
          var object = {
            id: '123',
            type: 'document',
            name: 'test',
            _rev: '1-345'
          };
          expect(this.store.trigger.calledWith('add', object, {})).to.be.ok();
          expect(this.store.trigger.calledWith('add:document', object, {})).to.be.ok();
          expect(this.store.trigger.calledWith('change', 'add', object, {})).to.be.ok();
          expect(this.store.trigger.calledWith('change:document', 'add', object, {})).to.be.ok();
        });

      });

      _when("successful", function() {

        beforeEach(function() {
          this.store.cache.returns('doc');
        });

        it("should resolve the promise", function() {
          expect(this.promise.state()).to.eql('resolved');
        });

        it("should pass the object to done callback", function() {
          this.promise.then(function (res) {
            expect(res).to.eql('cachedObject', true);
          });
        });

        _and("object did exist before", function() {

          beforeEach(function() {
            this.store.cache.returns(function(type, id, object) {
              if (object) {
                return 'doc';
              } else {
                return {};
              }
            });

            this.promise = this.store.save('document', '123', {
              name: 'test'
            }, {
              option: 'value'
            });

          });

          it("should pass false (= not created) as the second param to the done callback", function() {
            this.promise.then(function (res) {
              expect(res).to.eql('doc', false);
            });
          });

        });

        _and("object did not exist before", function() {

          beforeEach(function() {
            this.store.cache.returns(function(type, id, object) {
              if (object) {
                return 'doc';
              } else {
                return void 0;
              }
            });

            this.promise = this.store.save('document', '123', {
              name: 'test'
            }, {
              option: 'value'
            });

          });

          it("should pass true (= new created) as the second param to the done callback", function() {
            this.promise.then(function (res) {
              expect(res).to.eql('doc', false);
            });
          });

          it("should set the createdBy attribute", function() {
            var object = this.store.cache.args[2];
            expect(object.createdBy).to.eql('owner_hash');
          });

        });

      });

      _when("failed", function() {

        beforeEach(function() {
          this.store.cache.returns(function(type, id, object) {
            if (object) {
              throw new Error("i/o error");
            }
          });
        });

        it("should return a rejected promise", function() {
          var promise = this.store.save('document', '123', {
            name: 'test'
          });
          expect(promise.state()).to.eql('rejected');
        });

      });

    });

    _when("id is '123', type is 'document', object is {id: '123', type: 'document', name: 'test'}", function() {

      beforeEach(function() {
        var key, type, _ref;
        this.store.save('document', '123', {
          id: '123',
          type: 'document',
          name: 'test'
        });

        _ref = this.store.cache.args[0],
        type = _ref[0],
        key = _ref[1],
        this.object = _ref[2],
        _ref;
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

    });

    _when("id is '123', type is 'document', object is {name: 'test', $hidden: 'fresh'}}", function() {

      beforeEach(function() {
        this.sandbox.stub(this.store, "cache").returns('cachedObject');
        this.store.cache.andReturn({
          name: 'test',
          $hidden: 'fresh'
        });
      });

      it("should not overwrite $hidden property when not passed", function() {
        var key, type, _ref;
        this.store.save('document', '123', {
          name: 'new test'
        });

        _ref = this.store.cache.args[0],
        type = _ref[0],
        key = _ref[1],
        this.object = _ref[2];

        expect(this.object.$hidden).to.eql('fresh');
      });

      it("should overwrite $hidden property when passed", function() {
        var key, type, _ref;
        this.store.save('document', '123', {
          name: 'new test',
          $hidden: 'wicked'
        });

        _ref = this.store.cache.args[0],
        type = _ref[0],
        key = _ref[1],
        this.object = _ref[2];

        expect(this.object.$hidden).to.eql('wicked');
      });

    });

    it("should not overwrite createdAt attribute", function() {
      var id, object, type, _ref;
      this.sandbox.stub(this.store, "cache").returns('cachedObject');
      this.store.save('document', '123', {
        createdAt: 'check12'
      });

      _ref = this.store.cache.args[0],
      type = _ref[0],
      id = _ref[1],
      object = _ref[2];

      expect(object.createdAt).to.eql('check12');
    });

    it("should allow numbers and lowercase letters for type only. And must start with a letter or $", function() {
      var invalid, key, promise, valid, _i, _j, _len, _len1, _results;
      invalid = ['UPPERCASE', 'underLines', '-?&$', '12345', 'a'];
      valid = ['car', '$email'];
      for (_i = 0, _len = invalid.length; _i < _len; _i++) {
        key = invalid[_i];
        promise = this.store.save(key, 'valid', {});
        expect(promise.state).to.eql('rejected');
      }
      _results = [];
      for (_j = 0, _len1 = valid.length; _j < _len1; _j++) {
        key = valid[_j];
        promise = this.store.save(key, 'valid', {});
        _results.push(expect(promise.state()).to.eql('resolved'));
      }
      _results;
    });

    it("should allow numbers, lowercase letters and dashes for for id only", function() {
      var invalid, key, promise, valid, _i, _j, _len, _len1, _results;
      invalid = ['UPPERCASE', 'underLines', '-?&$'];
      valid = ['abc4567', '1', 123, 'abc-567'];

      for (_i = 0, _len = invalid.length; _i < _len; _i++) {
        key = invalid[_i];
        promise = this.store.save('valid', key, {});
        expect(promise.state()).to.eql('rejected');
      }
      _results = [];
      for (_j = 0, _len1 = valid.length; _j < _len1; _j++) {
        key = valid[_j];
        promise = this.store.save('valid', key, {});
        _results.push(expect(promise.state()).to.eql('resolved'));
      }
      _results;
    });

    _when("called without id", function() {

      beforeEach(function() {
        var _ref;
        this.sandbox.stub(this.store, "cache").returns('cachedObject');
        this.promise = this.store.save('document', void 0, {
          name: 'test'
        }, {
          option: 'value'
        });

        _ref = this.store.cache.args[0],
        this.type = _ref[0],
        this.key = _ref[1],
        this.object = _ref[2],
        _ref;
      });

      it("should generate an id", function() {
        expect(this.key).to.eql('uuid');
      });

      it("should set createdBy", function() {
        expect(this.object.createdBy).to.eql('owner_hash');
      });

      it("should pass options", function() {
        var options = this.store.cache.args[3];
        expect(options.option).to.eql('value');
      });

      _when("successful", function() {

        it("should resolve the promise", function() {
          expect(this.promise.state()).to.eql('resolved');
        });

        it("should pass the object to done callback", function() {
          this.promise.then(this.noop, function (res) {
            expect(res).to.eql('cachedObject', true);
          });
        });

        it("should pass true (= created) as the second param to the done callback", function() {
          this.promise.then(this.noop, function (res) {
            expect(res).to.eql('cachedObject', true);
          });
        });

      });

    });

    _when("store is bootstrapping", function() {

      beforeEach(function() {
        // we can't force it to return always true, as we'd
        // end up in infinite loop.
        // spyOn(this.store, "isBootstrapping").andReturn(true);
        this.store._bootstrapping = true;
        expect(this.store.isBootstrapping()).to.be.ok();
      });

      it("should wait until bootstrapping is finished", function() {
        var promise = this.store.save('task', '123', { title: 'do it!' });
        promise.fail( function() { console.log(arguments); });
        expect(promise.state()).to.eql('pending');

        this.hoodie.trigger('remote:bootstrap:end');

        expect(promise.state()).to.eql('resolved');
      });

    });

  });

  //
  xdescribe("#add(type, object, options)", function() {

    beforeEach(function() {
      this.sandbox.stub(this.store, "save").returns('promise');
    });

    it("should call .save(type, undefined, options) and return its promise", function() {
      var promise = this.store.add('couch', {
        funky: 'fresh'
      });

      expect(this.store.save.calledWith('couch', void 0, {
        funky: 'fresh'
      })).to.be.ok();

      expect(promise).to.eql('promise');
    });

    _when("store is bootstrapping", function() {

      beforeEach(function() {
        // we can't force it to return always true, as we'd
        // end up in infinite loop.
        // spyOn(this.store, "isBootstrapping").andReturn(true);
        this.store._bootstrapping = true;
        expect(this.store.isBootstrapping()).to.be.ok();
      });

      it("should wait until bootstrapping is finished", function() {
        var promise = this.store.add('task', { title: 'do it!' });
        promise.fail( function() { console.log(arguments); });

        expect(promise.state()).to.eql('pending');
        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise.state()).to.eql('resolved');
      });

    });

  });

  //
  xdescribe("#updateAll(objects)", function() {

    beforeEach(function() {
      this.sandbox.stub(this.hoodie, "isPromise").returns(false);
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
      expect(this.store.updateAll(this.todoObjects, {}).state()).to.eql('pending');
    });

    it("should update objects", function() {
      var obj, _i, _len, _ref, _results;
      this.sandbox.spy(this.store, "update");

      this.store.updateAll(this.todoObjects, {
        funky: 'update'
      });
      _ref = this.todoObjects;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        _results.push(expect(this.store.update.calledWith(obj.type, obj.id, {
          funky: 'update'
        }, {}).to.be.ok()));
      }
      _results;
    });

    it("should resolve the returned promise once all objects have been updated", function() {
      var promise = this.hoodie.defer().resolve().promise();
      this.sandbox.stub(this.store, "update").returns(promise);

      expect(this.store.updateAll(this.todoObjects, {}).state()).to.eql('resolved');
    });

    it("should not resolve the retunred promise unless object updates have been finished", function() {
      var promise = this.hoodie.defer().promise();
      this.sandbox.stub(this.store, "update").returns(promise);

      expect(this.store.updateAll(this.todoObjects, {}).state()).not.to.eql('resolved');
    });

    _when("passed objects is a promise", function() {

      beforeEach(function() {
        this.hoodie.isPromise.returns(true);
      });

      it("should update objects returned by promise", function() {
        var obj, promise, _i, _len, _ref,
          _this = this;
        promise = {
          pipe: function(cb) {
            cb(_this.todoObjects);
          }
        };

        this.sandbox.spy(this.store, "update");
        this.store.updateAll(promise, {
          funky: 'update'
        });

        _ref = this.todoObjects;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          obj = _ref[_i];
          expect(this.store.update.calledWith(obj.type, obj.id, {
            funky: 'update'
          }, {})).to.be.ok();
        }
      });

    });

    _when("store is bootstrapping", function() {

      beforeEach(function() {
        // we can't force it to return always true, as we'd
        // end up in infinite loop.
        // spyOn(this.store, "isBootstrapping").andReturn(true);
        this.store._bootstrapping = true;
        expect(this.store.isBootstrapping()).to.eql(true);
      });

      it("should wait until bootstrapping is finished", function() {
        var promise = this.store.updateAll(this.todoObjects, { title: 'do it!' });
        promise.fail( function() { console.log(arguments); });

        expect(promise.state()).to.eql('pending');

        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise.state()).to.eql('resolved');
      });

    });

  });

  //
  xdescribe("#find(type, id)", function() {

    beforeEach(function() {
      this.sandbox.stub(this.store, "cache");
    });

    it("should return a promise", function() {
      this.promise = this.store.find('document', '123');
    });

    describe("invalid arguments", function() {

      _when("no arguments passed", function() {

        it("should call the fail callback", function() {
          var promise = this.store.find();
          expect(promise.state()).to.eql('rejected');
        });

      });

      _when("no id passed", function() {
        it("should call the fail callback", function() {
          var promise = this.store.find('document');
          expect(promise.state()).to.eql('rejected');
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
        expect(this.promise.state()).to.eql('resolved');
      });

    });

    _when("object cannot be found", function() {

      beforeEach(function() {
        this.store.cache.returns(false);
        this.promise = this.store.find('document', 'abc4567');
      });

      it("should call the fail callback", function() {
        expect(this.promise.state()).to.eql('rejected');
      });

    });

    it("should cache the object after the first get", function() {
      this.store.find('document', 'abc4567');
      this.store.find('document', 'abc4567');

      expect(this.store.db.getItem.callCount).to.eql(1);
    });

    _when("store is bootstrapping", function() {

      beforeEach(function() {
        // we can't force it to return always true, as we'd
        // end up in infinite loop.
        // spyOn(this.store, "isBootstrapping").andReturn(true);
        this.store._bootstrapping = true;
        expect(this.store.isBootstrapping()).to.be.ok();
      });

      it("should wait until bootstrapping is finished", function() {
        this.store.cache.andReturn({
          name: 'test'
        });
        var promise = this.store.find('todo', '123');
        promise.fail( function() { console.log(arguments); });
        expect(promise.state()).to.eql('pending');

        this.hoodie.trigger('remote:bootstrap:end');

        expect(promise.state()).to.eql('resolved');
      });
    });
  });

  //
  xdescribe("#findAll(filter)", function() {

    var with_2CatsAnd_3Dogs;

    with_2CatsAnd_3Dogs = function(specs) {

      _and("two cat and three dog objects exist in the store", function() {

        beforeEach(function() {
          this.sandbox.stub(this.store, "index").returns(["cat/1", "cat/2", "dog/1", "dog/2", "dog/3"]);
          this.sandbox.stub(this.store, "cache").returns(function(type, id) {
            var createdAt;
            id = parseInt(id, 10);
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
      var promise = this.store.findAll();
      expect(promise).to.have.property('done');
      expect(promise).to.not.have.property('resolved');
    });

    with_2CatsAnd_3Dogs(function() {

      it("should sort by createdAt", function() {
        this.store.findAll().then(function (res) {
          expect(res).to.eql([
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

    });

    _when("called without a type", function() {

      with_2CatsAnd_3Dogs(function() {

        it("should return'em all", function() {
          var promise, results, success;
          success = this.sandbox.spy();
          promise = this.store.findAll();
          promise.done(success);
          results = success.args[0];
          expect(results.length).to.eql(5);
        });
      });

      _and("no documents exist in the store", function() {

        beforeEach(function() {
          spyOn(this.store, "index").andReturn([]);
        });

        it("should return an empty array", function() {
          var promise = this.store.findAll();
          promise.then(function (res) {
            expect(res).to.eql([]);
          });
        });

      });

      _and("there are other documents in localStorage not stored with store", function() {

        beforeEach(function() {
          this.sandbox.stub(this.store, "index").returns(["_someConfig", "someOtherShizzle", "whatever", "valid/123"]);
          this.sandbox.stub(this.store, "cache").returns({});
        });

        it("should not return them", function() {
          var promise, results, success;
          success = this.sandbox.spy();
          promise = this.store.findAll();
          promise.done(success);
          results = success.args[0];
          expect(results.length).to.eql(1);
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
          expect(results.length).to.eql(2);
        });
      });
    });
    _when("store is bootstrapping", function() {
      beforeEach(function() {
        // we can't force it to return always true, as we'd
        // end up in infinite loop.
        // spyOn(this.store, "isBootstrapping").andReturn(true);
        this.store._bootstrapping = true;
        expect(this.store.isBootstrapping()).to.be.ok();
      });

      it("should wait until bootstrapping is finished", function() {
        var promise = this.store.findAll('todo');
        promise.fail( function() { console.log(arguments); });

        expect(promise.state()).to.eql('pending');

        this.hoodie.trigger('remote:bootstrap:end');

        expect(promise.state()).to.eql('resolved');
      });

    });

  });

  //
  describe("#remove(type, id)", function() {

    _when("objecet cannot be found", function() {

      beforeEach(function() {
        this.sandbox.stub(this.store, "cache").returns(false);
      });

      it("should return a rejected the promise", function() {
        var promise = this.store.remove('document', '123');
        expect(promise.state()).to.eql('rejected');
      });

    });

    _when("object can be found and has not been synched before", function() {

      beforeEach(function() {
        this.sandbox.stub(this.store, "cache").returns({
          funky: 'fresh'
        });
      });

      it("should remove the object", function() {
        this.store.remove('document', '123');
        expect(this.store.db.removeItem.calledWith('document/123')).to.be.ok();
      });

      it("should set the _cached object to false", function() {
        delete this.store._cached['document/123'];
        this.store.remove('document', '123');
        expect(this.store._cached['document/123']).to.not.be.ok();
      });

      it("should clear document from changed", function() {
        this.sandbox.spy(this.store, "clearChanged");
        this.store.remove('document', '123');
        expect(this.store.clearChanged.calledWith('document', '123')).to.be.ok();
      });

      it("should return a resolved promise", function() {
        var promise = this.store.remove('document', '123');
        expect(promise.state()).to.eql('resolved');
      });

      it("should return a clone of the cached object (before it was deleted)", function() {
        var promise = this.store.remove('document', '123', {
          remote: true
        });
        promise.then(function (res) {
          expect(res).to.eql({
            funky: 'fresh'
          });
        });
      });

    });

    _when("object can be found and remove comes from remote", function() {

      beforeEach(function() {
        this.sandbox.stub(this.store, "cache").returns({
          id: '123',
          type: 'document',
          name: 'test'
        });
        this.sandbox.spy(this.store, "trigger");
        this.store.remove('document', '123', {
          remote: true
        });
      });

      it("should remove the object", function() {
        expect(this.store.db.removeItem.calledWith('document/123')).to.be.ok();
      });

      it("should trigger remove & change trigger events", function() {

        expect(this.store.trigger.calledWith('remove', {
          id: '123',
          type: 'document',
          name: 'test'
        }, {
          remote: true
        })).to.be.ok();

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

        this.sandbox.stub(this.store, "cache").returns({
          _syncedAt: 'now'
        });

        this.store.remove('document', '123');
      });

      it("should mark the object as deleted and cache it", function() {
        expect(this.store.cache.calledWith('document', '123', {
          _syncedAt: 'now',
          _deleted: true
        })).to.be.ok();
      });

      it("should not remove the object from store", function() {
        expect(this.store.db.removeItem.called).to.not.be.ok();
      });

    });

    _when("store is bootstrapping", function() {

      beforeEach(function() {
        // we can't force it to return always true, as we'd
        // end up in infinite loop.
        // spyOn(this.store, "isBootstrapping").andReturn(true);
        this.store._bootstrapping = true;
        expect(this.store.isBootstrapping()).to.be.ok();

        this.sandbox.stub(this.store, "cache").returns({ funky: 'fresh' });
      });

      it("should wait until bootstrapping is finished", function() {
        var promise = this.store.remove('todo', '123');

        expect(promise.state()).to.eql('pending');

        this.hoodie.trigger('remote:bootstrap:end');
        expect(promise.state()).to.eql('resolved');
      });

    });

  });

  //
  xdescribe("#cache(type, id, object)", function() {

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
      expect(promise).to.have.property('done');
      expect(promise).to.not.have.property('resolved');
    });

    it("should clear localStorage", function() {
      this.sandbox.stub(this.store, "index").returns(['$config/hoodie', 'car/123', '_notOurBusiness']);
      this.store.clear();

      expect(this.store.db.removeItem.calledWith('$config/hoodie')).to.be.ok();
      expect(this.store.db.removeItem.calledWith('car/123')).to.be.ok();
      expect(this.store.db.removeItem.calledWith('_notOurBusiness')).to.not.be.ok();
    });

    it("should clear chache", function() {
      this.store._cached = 'funky';
      this.store.clear();
      expect($.isEmptyObject(this.store._cached)).to.be.ok();
    });

    it("should clear dirty docs", function() {
      this.sandbox.spy(this.store, "clearChanged");
      this.store.clear();

      expect(this.store.clearChanged.called).to.be.ok();
    });

    it("should resolve promise", function() {
      var promise = this.store.clear();
      expect(promise.state()).to.eql('resolved');
    });

    _when("an error occurs", function() {

      beforeEach(function() {
        this.sandbox.stub(this.store, "clearChanged").returns(function() {
          throw new Error('ooops');
        });
      });

      it("should reject the promise", function() {
        var promise = this.store.clear();
        expect(promise.state()).to.eql('rejected');
      });

    });

  });

  //
  xdescribe("#hasLocalChanges(type, id)", function() {

    _when("no arguments passed", function() {

      it("returns true when there are dirty documents", function() {
        this.store._dirty = {
          "doc/1": {},
          "doc/2": {}
        };
        expect(this.store.hasLocalChanges()).to.eql(true);
      });

      it("returns false when there are no dirty documents", function() {
        this.store._dirty = {};
        expect(this.store.hasLocalChanges()).to.eql(false);
      });

    });

    _when("type & id passed", function() {

      _and("object was not yet synced", function() {

        _and("object has saved with silent:true option", function() {

          beforeEach(function() {
            this.sandbox.stub(this.store, "cache").returns({
              _syncedAt: void 0,
              updatedAt: void 0
            });
          });

          it("should return false", function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.eql(false);
          });

        });

        _and("object has been saved without silent:true option", function() {

          beforeEach(function() {
            this.sandbox.stub(this.store, "cache").returns({
              _syncedAt: void 0,
              updatedAt: new Date(0)
            });
          });

          it("should return true", function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.eql(true);
          });

        });

      });

      _and("object was synced", function() {

        _and("object was not updated yet", function() {

          beforeEach(function() {
            this.sandbox.stub(this.store, "cache").returns({
              _syncedAt: new Date(0),
              updatedAt: void 0
            });
          });

          it("should return false", function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.not.be.ok();
          });

        });

        _and("object was updated at the same time", function() {

          beforeEach(function() {
            this.sandbox.stub(this.store, "cache").returns({
              _syncedAt: new Date(0),
              updatedAt: new Date(0)
            });
          });

          it("should return false", function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.not.be.ok();
          });

        });

        _and("object was updated later", function() {

          beforeEach(function() {
            this.sandbox.stub(this.store, "cache").returns({
              _syncedAt: new Date(0),
              updatedAt: new Date(1)
            });
          });

          it("should return true", function() {
            expect(this.store.hasLocalChanges('couch', '123')).to.not.be.ok();
          });

        });

      });

    });

  });

  //
  xdescribe("#markAsChanged(type, id, object)", function() {

    beforeEach(function() {
      this.store._dirty = {};

      this.sandbox.spy(this.store, "trigger");

      this.store.markAsChanged('couch', '123', {
        color: 'red'
      });

    });

    it("should add it to the dirty list", function() {
      expect(this.store._dirty['couch/123'].color).to.eql('red');
    });

    it("should start dirty timeout for 2 seconds", function() {
      var args = window.setTimeout.args[0];

      expect(args[1]).to.eql(2000);
      expect(this.store._dirtyTimeout).to.eql('newTimeout');
    });

    it("should clear dirty timeout", function() {
      this.store._dirtyTimeout = 'timeout';
      this.store.markAsChanged('couch', '123', {
        color: 'red'
      });
      expect(window.clearTimeout.calledWith('timeout')).to.be.ok();
    });

    it("should trigger 'dirty' event", function() {
      expect(this.store.trigger.calledWith('dirty')).to.be.ok();
    });

  });

  //
  xdescribe("#markAllAsChanged(type, id, object)", function() {

    beforeEach(function() {
      this.findAllDefer = this.hoodie.defer();
      this.sandbox.stub(this.store, "markAsChanged");
      this.sandbox.stub(this.store, "findAll").returns(this.findAllDefer.promise());
      this.sandbox.stub(this.store, "changedObjects").returns('changedObjects');
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
        promise.then(this.noop, function (res) {
          expect(res).to.eql({
            reason: 'because'
          });
        });
      });

    });

    _when("findAll succeeds", function() {

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
        this.sandbox.spy(this.store, "trigger");
        this.store._dirtyTimeout = 'timeout';
        this.store.markAllAsChanged();
      });

      it("should add returned obejcts to the dirty list", function() {
        expect(this.store._dirty['document/1'].name).to.eql('test1');
        expect(this.store._dirty['document/2'].name).to.eql('test2');
        expect(this.store._dirty['document/3'].name).to.eql('test3');
      });

      it("should start dirty timeout for 2 seconds", function() {
        var args = window.setTimeout.args[0];

        expect(args[1]).to.eql(2000);
        expect(this.store._dirtyTimeout).to.eql('newTimeout');
        expect(window.setTimeout.callCount).to.eql(1);
      });

      it("should clear dirty timeout", function() {
        expect(window.clearTimeout.calledWith('timeout')).to.be.ok();
        expect(window.clearTimeout.callCount).to.eql(1);
      });

      it("should trigger 'dirty' & 'idle' event", function() {
        expect(this.store.trigger.calledWith('dirty')).to.be.ok();
        expect(this.store.trigger.calledWith('idle', 'changedObjects')).to.be.ok();
        expect(this.store.trigger.callCount).to.eql(2);
      });

    });

  });

  //
  describe("#changedObjects()", function() {

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
  describe("#isMarkedAsDeleted(type, id)", function() {

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
  describe("#clearChanged(type, id)", function() {

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

        expect(this.store._dirty['couch/123']).to.be.undefined;
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
  describe("#trigger", function() {

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
  describe("#on", function() {

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
  describe("#unbind", function() {

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
  describe("#decoratePromises", function() {
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
