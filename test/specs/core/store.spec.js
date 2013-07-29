'use strict';

describe("Hoodie.Store", function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    this.store = new Hoodie.Store(this.hoodie);
  });

  describe("#save(type, id, object, options)", function() {

    beforeEach(function() {

      this.sandbox = sinon.sandbox.create();
      this._nowStub = this.sandbox.stub(this.store, "_now").returns('now');
    });

    it("should return a defer", function() {
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

      _when("array passed", function() {

        it("should be rejected", function() {
          var promise = this.store.save('document', 'abc4567', [1,2,3]);
          expect(promise.state()).to.eql('rejected');
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
        expect(promise.state()).to.eql('rejected');
      }
      _results = [];
      for (_j = 0, _len1 = valid.length; _j < _len1; _j++) {
        key = valid[_j];
        promise = this.store.save(key, 'valid', {});
        _results.push(expect(promise.state()).to.eql('pending'));
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
        expect(promise.state()).to.eql('rejected');
      }
      _results = [];
      for (_j = 0, _len1 = valid.length; _j < _len1; _j++) {
        key = valid[_j];
        promise = this.store.save('valid', key, {});
        _results.push(expect(promise.state()).to.eql('pending'));
      }
      _results;
    });

  });

  describe("add(type, object)", function() {

    beforeEach(function () {
      this.sandbox.stub(this.store, "save").returns("save_promise");
    });

    it("should proxy to save method", function() {
      this.store.add("test", {
        funky: "value"
      });

      expect(this.store.save.calledWith("test", undefined, {
        funky: "value"
      })).to.be.ok();
    });

    it("should return promise of save method", function() {
      expect(this.store.add()).to.eql('save_promise');
    });

  });

  xdescribe("#update(type, id, update, options)", function() {

    beforeEach(function() {
      this.sandbox.spy(this.store, "find");
      this.sandbox.stub(this.store, "save").returns({
        then: function() {}
      });
    });

    _when("object cannot be found", function() {

      beforeEach(function() {
        //this.sandbox.stub(this.store.find).returns($.Deferred().reject());

        this.promise = this.store.update('couch', '123', {
          funky: 'fresh'
        });
      });

      it("should add it", function() {
        expect(this.store.save.calledWith('couch', '123', {
          funky: 'fresh'
        }, void 0)).to.be.ok;
      });

    });

    _when("object can be found", function() {

      //beforeEach(function() {
        //this.sandbox.stub(this.store.find).returns(this.hoodie.defer().resolve({ style: 'baws' }));
        //this.sandbox.stub(this.store.save).returns(this.hoodie.defer().resolve('resolved by save'));
      //});

      _and("update is an object", function() {

        beforeEach(function() {
          this.promise = this.store.update('couch', '123', {
            funky: 'fresh'
          });
        });

        it("should save the updated object", function() {
          expect(this.store.save.calledWith('couch', '123', {
            style: 'baws',
            funky: 'fresh'
          }, void 0)).to.be.ok();
        });

        it("should return a resolved promise", function() {
          this.promise.then(this.noop, function (res) {
            expect(res).to.eql('resolved by save');
          });
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

          expect(this.store.save.calledWith('couch', '123', {
            style: 'baws',
            funky: 'fresh'
          }, {
            silent: true
          })).to.be.ok();
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
          expect(this.store.save.calledWith('couch', '123', {
            style: 'baws',
            funky: 'fresh'
          }, void 0)).to.be.ok();
        });

        it("should return a resolved promise", function() {
          this.promise.then(function (res) {
            expect(res).to.eql('resolved by save');
          });
        });

        it("should make a deep copy and save", function() {
          var originalObject;

          this.store.save.reset();
          originalObject = {
            config: {}
          };
          this.store.find.returns(this.hoodie.defer().resolve(originalObject));
          this.store.update('couch', '123', function(obj) {
            obj.config.funky = 'fresh';
            return obj;
          });
          expect(originalObject.config.funky).to.be.undefined;
          expect(this.store.save.called).to.be.ok();
        });

      });

      _and("update wouldn't make a change", function() {

        beforeEach(function() {
          this.promise = this.store.update('couch', '123', function() {
            return {
              style: 'baws'
            };
          });
        });

        it("should not save the object", function() {
          expect(this.store.save.called).to.not.be.ok();
        });

        it("should return a resolved promise", function() {
          this.promise.then(function (res) {
            expect(res).to.eql({style: 'baws'});
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
          expect(this.store.save.calledWith('couch', '123', {
            style: 'baws'
          }, {
            "public": true
          })).to.be.ok();
        });

      });

    });

  });

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
      expect(this.store.updateAll(this.todoObjects, {})).to.have.property('done');
      expect(this.store.updateAll(this.todoObjects, {})).to.not.have.property('resolved');
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
        }, {})).to.be.ok());
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
      expect(this.store.updateAll(this.todoObjects, {}).state()).to.not.eql('rejected');
    });

    _when("passed objects is a promise", function() {

      beforeEach(function() {
        this.hoodie.isPromise.returns(true);
      });

      it("should update objects returned by promise", function() {
        var obj, promise, _i, _len, _ref, _results;

        promise = this.hoodie.defer().resolve(this.todoObjects).promise();

        this.sanbox.spy(this.store, "update");
        this.store.updateAll(promise, {
          funky: 'update'
        });

        _ref = this.todoObjects;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          obj = _ref[_i];
          _results.push(expect(this.store.update.calledWith(obj.type, obj.id, {
            funky: 'update'
          }, {})).to.be.ok());
        }
        _results;
      });

      it("should update object single object returned by promise", function() {
        var obj, promise;
        obj = this.todoObjects[0];
        promise = this.hoodie.defer().resolve(obj).promise();
        this.sandbox.spy(this.store, "update");
        this.store.updateAll(promise, {
          funky: 'update'
        });
        expect(this.store.update.calledWith(obj.type, obj.id, {
          funky: 'update'
        }, {})).to.be.ok();
      });

    });

    _when("passed objects is a type (string)", function() {

      beforeEach(function() {
        var findAll_promise = this.sandbox.spy();
        this.sandbox.stub(this.store, "findAll").returns({
          pipe: findAll_promise
        });
      });

      it("should update objects return by findAll(type)", function() {
        this.store.updateAll("car", {
          funky: 'update'
        });
        expect(this.store.findAll.calledWith("car")).to.be.ok();
      });

    });

    _when("no objects passed", function() {

      beforeEach(function() {
        var findAll_promise = this.sandbox.spy();
        this.sandbox.stub(this.store, "findAll").returns({
          pipe: findAll_promise
        });
      });

      it("should update all objects", function() {
        this.store.updateAll(null, {
          funky: 'update'
        });
        expect(this.store.findAll.called).to.be.ok();
        expect(this.store.findAll.args[0].length).to.eql(0);
      });

    });

  });

  describe("#find(type, id)", function() {

    it("should return a defer", function() {
      var defer = this.store.find('document', '123');
      expect(defer.state()).to.eql('pending');
    });

    describe("invalid arguments", function() {

      _when("no arguments passed", function() {

        it("should be rejected", function() {
          var promise = this.store.find();
          expect(promise.state()).to.eql('rejected');
        });

      });

      _when("no id passed", function() {

        it("should be rejected", function() {
          var promise = this.store.find('document');
          expect(promise.state()).to.eql('rejected');
        });

      });

    });

    describe("aliases", function() {

      beforeEach(function() {
        this.sandbox.spy(this.store, "find");
      });

      it("should allow to use .find", function() {
        this.store.find('test', '123');
        expect(this.store.find.calledWith('test', '123')).to.be.ok();
      });

    });

  });

  describe("#findAll(type)", function() {

    it("should return a defer", function() {
      expect(this.store.findAll().state()).to.eql('pending');
    });

    describe("aliases", function() {
      beforeEach(function() {
        this.sandbox.spy(this.store, "findAll");
      });
    });

  });

  describe("#findOrAdd(type, id, attributes)", function() {

    _when("object exists", function() {

      beforeEach(function() {
        var promise = this.hoodie.defer().resolve('existing_object').promise();
        this.sandbox.stub(this.store, "find").returns(promise);
      });

      it("should resolve with existing object", function() {
        var promise = this.store.findOrAdd('type', '123', {
          attribute: 'value'
        });

        promise.then(function (res) {
          expect(res).to.eql('existing_object');
        });
      });

    });

    _when("object does not exist", function() {

      beforeEach(function() {
        this.sandbox.stub(this.store, "find").returns(this.hoodie.defer().reject().promise());
      });

      it("should call `.add` with passed attributes", function() {
        this.sandbox.stub(this.store, "add").returns(this.hoodie.defer().promise());

        this.store.findOrAdd('type', 'id123', {
          attribute: 'value'
        });

        expect(this.store.add.calledWith('type', {
          id: 'id123',
          attribute: 'value'
        })).to.be.ok();
      });

      it("should reject when `.add` was rejected", function() {
        this.sandbox.stub(this.store, "add").returns(this.hoodie.defer().reject().promise());

        var promise = this.store.findOrAdd({
          id: '123',
          attribute: 'value'
        });

        expect(promise.state()).to.eql('rejected');
      });

      it("should resolve when `.add` was resolved", function() {
        var promise = this.hoodie.defer().resolve('new_object').promise();

        this.sandbox.stub(this.store, "add").returns(promise);

        promise = this.store.findOrAdd({
          id: '123',
          attribute: 'value'
        });
        promise.then(function (res) {
          expect(res).to.eql('new_object');
        });
      });

    });

  });

  describe("#remove(type, id)", function() {

    it("should return a defer", function() {
      var defer = this.store.remove('document', '123');
      expect(defer.state()).to.eql('pending');
    });

    describe("invalid arguments", function() {

      _when("no arguments passed", function() {

        it("should be rejected", function() {
          var promise = this.store.remove();
          expect(promise.state()).to.eql('rejected');
        });

      });

      _when("no id passed", function() {

        it("should be rejected", function() {
          var promise= this.store.remove('document');
          expect(promise.state()).to.eql('rejected');
        });

      });

    });

  });

  describe("#removeAll(type)", function() {

    beforeEach(function() {
      this.findAllDefer = this.hoodie.defer();
      this.sandbox.stub(this.store, 'findAll').returns(this.findAllDefer.promise());
    });

    it("should return a promise", function() {
      expect(this.store.removeAll().state()).to.eql('pending');
    });

    it("should call store.findAll", function() {
      this.store.removeAll('filter');
      expect(this.store.findAll.calledWith('filter')).to.be.ok();
    });

    _when("store.findAll fails", function() {

      beforeEach(function() {
        this.findAllDefer.reject({
          error: 'because'
        });
      });

      it("should return a rejected promise", function() {
        var promise = this.store.removeAll();

        promise.then(this.noop, function (res) {
          expect(res).to.eql({error: 'because'});
        });
      });

    });

    _when("store.findAll returns 3 objects", function() {

      beforeEach(function() {
        this.sandbox.spy(this.store, 'remove');

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
        expect(this.store.remove.calledWith('task', '1', {})).to.be.ok();
        expect(this.store.remove.calledWith('task', '2', {})).to.be.ok();
        expect(this.store.remove.calledWith('task', '3', {})).to.be.ok();
      });

      it("should pass options", function() {
        this.store.removeAll(null, {
          something: 'optional'
        });
        expect(this.store.remove.calledWith('task', '1', {
          something: 'optional'
        })).to.be.ok();
        expect(this.store.remove.calledWith('task', '2', {
          something: 'optional'
        })).to.be.ok();
        expect(this.store.remove.calledWith('task', '3', {
          something: 'optional'
        })).to.be.ok();
      });

    });

  });

});
