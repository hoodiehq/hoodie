describe("Hoodie.Store", function() {
  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie;
    this.store = new Hoodie.Store(this.hoodie);
  });
  describe("#save(type, id, object, options)", function() {
    beforeEach(function() {
      spyOn(this.store, "_now").andReturn('now');
    });
    it("should return a defer", function() {
      var promise;
      promise = this.store.save('document', '123', {
        name: 'test'
      });
      expect(promise).toBeDefer();
    });
    describe("invalid arguments", function() {
      _when("no arguments passed", function() {
        it("should be rejected", function() {
          expect(this.store.save()).toBeRejected();
        });
      });
      _when("no object passed", function() {
        it("should be rejected", function() {
          var promise;
          promise = this.store.save('document', 'abc4567');
          expect(promise).toBeRejected();
        });
      });
      _when("array passed", function() {
        it("should be rejected", function() {
          var promise;
          promise = this.store.save('document', 'abc4567', [1,2,3]);
          expect(promise.state()).toBe('rejected');
          // debugger
          expect(promise).toBeRejected();
        });
      });
    });
    it("should not allow type containing /", function() {
      var invalid, key, promise, valid, _i, _j, _len, _len1, _results;
      invalid = ['a/b'];
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
        _results.push(expect(promise).toBeDefer());
      }
      _results;
    });
    it("should not allow id containing /", function() {
      var invalid, key, promise, valid, _i, _j, _len, _len1, _results;
      invalid = ['/'];
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
        _results.push(expect(promise).toBeDefer());
      }
      _results;
    });
  });
  describe("add(type, object)", function() {
    beforeEach(function() {
      spyOn(this.store, "save").andReturn("save_promise");
    });
    it("should proxy to save method", function() {
      this.store.add("test", {
        funky: "value"
      });
      expect(this.store.save).wasCalledWith("test", undefined, {
        funky: "value"
      });
    });
    it("should return promise of save method", function() {
      expect(this.store.add()).toBe('save_promise');
    });
  });
  describe("#update(type, id, update, options)", function() {
    beforeEach(function() {
      spyOn(this.store, "find");
      spyOn(this.store, "save").andReturn({
        then: function() {}
      });
    });
    _when("object cannot be found", function() {
      beforeEach(function() {
        this.store.find.andReturn($.Deferred().reject());
        this.promise = this.store.update('couch', '123', {
          funky: 'fresh'
        });
      });
      it("should add it", function() {
        expect(this.store.save).wasCalledWith('couch', '123', {
          funky: 'fresh'
        }, void 0);
      });
    });
    _when("object can be found", function() {
      beforeEach(function() {
        this.store.find.andReturn(this.hoodie.defer().resolve({
          style: 'baws'
        }));
        this.store.save.andReturn(this.hoodie.defer().resolve('resolved by save'));
      });
      _and("update is an object", function() {
        beforeEach(function() {
          this.promise = this.store.update('couch', '123', {
            funky: 'fresh'
          });
        });
        it("should save the updated object", function() {
          expect(this.store.save).wasCalledWith('couch', '123', {
            style: 'baws',
            funky: 'fresh'
          }, void 0);
        });
        it("should return a resolved promise", function() {
          expect(this.promise).toBeResolvedWith('resolved by save');
        });
      });
      _and("update is an object and options passed", function() {
        beforeEach(function() {
          this.promise = this.store.update('couch', '123', {
            funky: 'fresh'
          }, {
            silent: true
          });
        });
        it("should not save the object", function() {
          expect(this.store.save).wasCalledWith('couch', '123', {
            style: 'baws',
            funky: 'fresh'
          }, {
            silent: true
          });
        });
      });
      _and("update is a function", function() {
        beforeEach(function() {
          this.promise = this.store.update('couch', '123', function() {
            return {
              funky: 'fresh'
            };
          });
        });
        it("should save the updated object", function() {
          expect(this.store.save).wasCalledWith('couch', '123', {
            style: 'baws',
            funky: 'fresh'
          }, void 0);
        });
        it("should return a resolved promise", function() {
          expect(this.promise).toBeResolvedWith('resolved by save');
        });
        it("should make a deep copy and save", function() {
          var originalObject;
          this.store.save.reset();
          originalObject = {
            config: {}
          };
          this.store.find.andReturn(this.hoodie.defer().resolve(originalObject));
          this.store.update('couch', '123', function(obj) {
            obj.config.funky = 'fresh';
            return obj;
          });
          expect(originalObject.config.funky).toBeUndefined();
          expect(this.store.save).wasCalled();
        });
      });
      _and("update wouldn't make a change", function() {
        beforeEach(function() {
          this.promise = this.store.update('couch', '123', function() {
            {
              style: 'baws'
            };
          });
        });
        it("should not save the object", function() {
          expect(this.store.save).wasNotCalled();
        });
        it("should return a resolved promise", function() {
          expect(this.promise).toBeResolvedWith({
            style: 'baws'
          });
        });
      });
      _but("update wouldn't make a change, but options have been passed", function() {
        beforeEach(function() {
          this.promise = this.store.update('couch', '123', {}, {
            "public": true
          });
        });
        it("should not save the object", function() {
          expect(this.store.save).wasCalledWith('couch', '123', {
            style: 'baws'
          }, {
            "public": true
          });
        });
      });
    });
  });
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
        var obj, promise, _i, _len, _ref, _results;
        promise = this.hoodie.defer().resolve(this.todoObjects).promise();
        spyOn(this.store, "update");
        this.store.updateAll(promise, {
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
      it("should update object single object returned by promise", function() {
        var obj, promise;
        obj = this.todoObjects[0];
        promise = this.hoodie.defer().resolve(obj).promise();
        spyOn(this.store, "update");
        this.store.updateAll(promise, {
          funky: 'update'
        });
        expect(this.store.update).wasCalledWith(obj.type, obj.id, {
          funky: 'update'
        }, {});
      });
    });
    _when("passed objects is a type (string)", function() {
      beforeEach(function() {
        var findAll_promise;
        findAll_promise = jasmine.createSpy("findAll_promise");
        spyOn(this.store, "findAll").andReturn({
          pipe: findAll_promise
        });
      });
      it("should update objects return by findAll(type)", function() {
        this.store.updateAll("car", {
          funky: 'update'
        });
        expect(this.store.findAll).wasCalledWith("car");
      });
    });
    _when("no objects passed", function() {
      beforeEach(function() {
        var findAll_promise;
        findAll_promise = jasmine.createSpy("findAll_promise");
        spyOn(this.store, "findAll").andReturn({
          pipe: findAll_promise
        });
      });
      it("should update all objects", function() {
        this.store.updateAll(null, {
          funky: 'update'
        });
        expect(this.store.findAll).wasCalled();
        expect(this.store.findAll.mostRecentCall.args.length).toBe(0);
      });
    });
  });
  describe("#find(type, id)", function() {
    it("should return a defer", function() {
      var defer;
      defer = this.store.find('document', '123');
      expect(defer).toBeDefer();
    });
    describe("invalid arguments", function() {
      _when("no arguments passed", function() {
        it("should be rejected", function() {
          var promise;
          promise = this.store.find();
          expect(promise).toBeRejected();
        });
      });
      _when("no id passed", function() {
        it("should be rejected", function() {
          var promise;
          promise = this.store.find('document');
          expect(promise).toBeRejected();
        });
      });
    });
    describe("aliases", function() {
      beforeEach(function() {
        spyOn(this.store, "find");
      });
      it("should allow to use .find", function() {
        this.store.find('test', '123');
        expect(this.store.find).wasCalledWith('test', '123');
      });
    });
  });
  describe("#findAll(type)", function() {
    it("should return a defer", function() {
      expect(this.store.findAll()).toBeDefer();
    });
    describe("aliases", function() {
      beforeEach(function() {
        spyOn(this.store, "findAll");
      });
    });
  });
  describe("#findOrAdd(type, id, attributes)", function() {
    _when("object exists", function() {
      beforeEach(function() {
        var promise;
        promise = this.hoodie.defer().resolve('existing_object').promise();
        spyOn(this.store, "find").andReturn(promise);
      });
      it("should resolve with existing object", function() {
        var promise;
        promise = this.store.findOrAdd('type', '123', {
          attribute: 'value'
        });
        expect(promise).toBeResolvedWith('existing_object');
      });
    });
    _when("object does not exist", function() {
      beforeEach(function() {
        spyOn(this.store, "find").andReturn(this.hoodie.defer().reject().promise());
      });
      it("should call `.add` with passed attributes", function() {
        var promise;
        spyOn(this.store, "add").andReturn(this.hoodie.defer().promise());
        promise = this.store.findOrAdd('type', 'id123', {
          attribute: 'value'
        });
        expect(this.store.add).wasCalledWith('type', {
          id: 'id123',
          attribute: 'value'
        });
      });
      it("should reject when `.add` was rejected", function() {
        var promise;
        spyOn(this.store, "add").andReturn(this.hoodie.defer().reject().promise());
        promise = this.store.findOrAdd({
          id: '123',
          attribute: 'value'
        });
        expect(promise).toBeRejected();
      });
      it("should resolve when `.add` was resolved", function() {
        var promise;
        promise = this.hoodie.defer().resolve('new_object').promise();
        spyOn(this.store, "add").andReturn(promise);
        promise = this.store.findOrAdd({
          id: '123',
          attribute: 'value'
        });
        expect(promise).toBeResolvedWith('new_object');
      });
    });
  });
  describe("#remove(type, id)", function() {
    it("should return a defer", function() {
      var defer;
      defer = this.store.remove('document', '123');
      expect(defer).toBeDefer();
    });
    describe("invalid arguments", function() {
      _when("no arguments passed", function() {
        it("should be rejected", function() {
          var promise;
          promise = this.store.remove();
          expect(promise).toBeRejected();
        });
      });
      _when("no id passed", function() {
        it("should be rejected", function() {
          var promise;
          promise = this.store.remove('document');
          expect(promise).toBeRejected();
        });
      });
    });
  });
  describe("#removeAll(type)", function() {
    beforeEach(function() {
      this.findAllDefer = this.hoodie.defer();
      spyOn(this.store, "findAll").andReturn(this.findAllDefer.promise());
    });
    it("should return a promise", function() {
      expect(this.store.removeAll()).toBePromise();
    });
    it("should call store.findAll", function() {
      this.store.removeAll('filter');
      expect(this.store.findAll).wasCalledWith('filter');
    });
    _when("store.findAll fails", function() {
      beforeEach(function() {
        this.findAllDefer.reject({
          error: 'because'
        });
      });
      it("should return a rejected promise", function() {
        var promise;
        promise = this.store.removeAll();
        expect(promise).toBeRejectedWith({
          error: 'because'
        });
      });
    });
    _when("store.findAll returns 3 objects", function() {
      beforeEach(function() {
        spyOn(this.store, "remove");
        this.object1 = {
          type: 'task',
          id: '1',
          title: 'some'
        };
        this.object2 = {
          type: 'task',
          id: '2',
          title: 'thing'
        };
        this.object3 = {
          type: 'task',
          id: '3',
          title: 'funny'
        };
        this.findAllDefer.resolve([this.object1, this.object2, this.object3]);
      });
      it("should call remove for each object", function() {
        this.store.removeAll();
        expect(this.store.remove).wasCalledWith('task', '1', {});
        expect(this.store.remove).wasCalledWith('task', '2', {});
        expect(this.store.remove).wasCalledWith('task', '3', {});
      });
      it("should pass options", function() {
        this.store.removeAll(null, {
          something: 'optional'
        });
        expect(this.store.remove).wasCalledWith('task', '1', {
          something: 'optional'
        });
        expect(this.store.remove).wasCalledWith('task', '2', {
          something: 'optional'
        });
        expect(this.store.remove).wasCalledWith('task', '3', {
          something: 'optional'
        });
      });
    });
  });
});
