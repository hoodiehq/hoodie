'use strict';

describe("hoodieStoreApi", function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    this.options = Mocks.storeOptions('funkstore');
    this.validate = sinon.stub();
    this.optionsWithValidate = $.extend({}, this.options, {validate: this.validate});
    this.store = hoodieStoreApi(this.hoodie, this.options );
    this.storeWithCustomValidate = hoodieStoreApi(this.hoodie, this.optionsWithValidate );
  });

  it("sets store.validate from options.validate", function() {
    expect(this.storeWithCustomValidate.validate).to.be(this.validate)
  });

  it("has a default store.validate function", function() {
    expect(this.store.validate).to.be.a(Function)
  });

  describe("#validate(object, options)", function() {
    beforeEach(function() {
      this.object = {
        type: 'document',
        id: '123',
        name: 'bazinga!'
      }
    });
    it("returns nothing when valid data passed", function() {
      expect(this.store.validate(this.object)).to.be(undefined);
    });

    it("returns nothing when id is undefined", function() {
      delete this.object.id
      expect(this.store.validate(this.object)).to.be(undefined);
    });

    it("returns an error when type is undefined", function() {
      delete this.object.type
      expect(this.store.validate(this.object)).to.be.an(Error);
    });

    it("returns an error when no object passed", function() {
      var error = this.store.validate();
      expect(error).to.be.an(Error);
    });

    it("returns an error when invalid type passed", function() {
      this.object.type = 'inva/id';
      var error = this.store.validate(this.object);
      expect(error).to.be.an(Error);
    });

    it("returns an error when invalid id passed", function() {
      this.object.id = 'inva/id';
      var error = this.store.validate(this.object);
      expect(error).to.be.an(Error);
    });

    it('passes object & options', function() {
      this.sandbox.stub(this.store, 'validate')
      this.store.save('document', '123', {name: 'test'}, {option: 'value'})
      expect(this.store.validate).to.be.calledWith({
        type: 'document',
        id: '123',
        name: 'test'
      }, {option: 'value'})
    });
  });

  describe("#save(type, id, object, options)", function() {
    it("should return a promise", function() {
      var promise = this.store.save('document', '123', {
        name: 'test'
      });
      expect(promise).to.be.pending();
    });

    it("should validate", function() {
      this.sandbox.spy(this.store, 'validate');
      this.store.save('type', 'id', {property: 'value'}, {option: 'value'});
      expect(this.store.validate).to.be.calledWith({
        "property": "value",
        "type": "type",
        "id": "id"
      }, {option: 'value'});
    })

    it("should call backend.save", function() {
      this.store.save('type', 'id', {property: 'value'}, { option: 'value'})
      expect(this.options.backend.save).to.be.calledWith({type: 'type', id: 'id', property: 'value'}, { option: 'value'});
    });
  }); // #save

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

  describe("#update(type, id, update, options)", function() {
    beforeEach(function() {
      this.findDefer = this.hoodie.defer();
      this.saveDefer = this.hoodie.defer();
      this.sandbox.stub(this.store, "find").returns(this.findDefer);
      this.sandbox.stub(this.store, "save").returns(this.saveDefer);
    });

    _when("object cannot be found", function() {
      beforeEach(function() {
        this.findDefer.reject();
        this.promise = this.store.update('couch', '123', {
          funky: 'fresh'
        });
      });

      it("should add it", function() {
        expect(this.store.save).to.be.calledWith('couch', '123', {
          funky: 'fresh'
        }, undefined);
      });
    }); // object cannot be found

    _when("object can be found", function() {

      beforeEach(function() {
        this.findDefer.resolve({ style: 'baws' });
      });

      _and("update is an object", function() {

        beforeEach(function() {
          this.promise = this.store.update('couch', '123', {
            funky: 'fresh'
          });
        });

        it("should save the updated object", function() {
          expect(this.store.save).to.be.calledWith('couch', '123', {
            style: 'baws',
            funky: 'fresh'
          }, void 0);
        });

        it("should return a resolved promise", function() {
          this.saveDefer.resolve( 'resolved by save' );
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
          expect(this.store.save).to.be.calledWith('couch', '123', {
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
          expect(originalObject.config.funky).to.be(undefined);
          expect(this.store.save).to.be.called();
        });

      });

      _and("update wouldn't make a change", function() {

        beforeEach(function() {
          this.saveDefer.resolve({
            type: 'couch',
            id: '123',
            style: 'baws'
          })
          this.promise = this.store.update('couch', '123', function() {
            return {
              style: 'baws'
            };
          });
        });

        it("should not save the object", function() {
          expect(this.store.save).to.not.be.called();
        });

        it("should return a resolved promise", function() {
          expect(this.promise).to.be.resolvedWith({style: 'baws'})
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
      }); // update wouldn't make a change, but options have been passed
    }); // object can be found
  }); // #update

  describe("#updateAll(objects)", function() {
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
      expect(this.store.updateAll(this.todoObjects, {})).to.be.promise();
    });

    it("should update objects", function() {
      var obj, _i, _len, _ref;
      this.sandbox.spy(this.store, "update");

      this.store.updateAll(this.todoObjects, {
        funky: 'update'
      });
      _ref = this.todoObjects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        expect(this.store.update).to.be.calledWith(obj.type, obj.id, {
          funky: 'update'
        }, {})
      }
    });

    it("should resolve the returned promise once all objects have been updated", function() {
      var promise = this.hoodie.defer().resolve().promise();
      this.sandbox.stub(this.store, "update").returns(promise);
      expect(this.store.updateAll(this.todoObjects, {})).to.be.resolved();
    });

    it("should not resolve the returned promise unless object updates have been finished", function() {
      var promise = this.hoodie.defer().promise();
      this.sandbox.stub(this.store, "update").returns(promise);
      expect(this.store.updateAll(this.todoObjects, {})).to.be.pending();
    });

    _when("passed objects is a promise", function() {

      beforeEach(function() {
        this.hoodie.isPromise.returns(true);
      });

      it("should update objects returned by promise", function() {
        var obj, promise, _i, _len, _ref;

        promise = this.hoodie.defer().resolve(this.todoObjects).promise();

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
    }); // passed objects is a promise

    _when("passed objects is a type (string)", function() {
      beforeEach(function() {
        this.findAllDefer = this.hoodie.defer();
        this.sandbox.stub(this.store, "findAll").returns(this.findAllDefer.promise());
      });

      it("should update objects return by findAll(type)", function() {
        this.store.updateAll("car", {
          funky: 'update'
        });
        expect(this.store.findAll).to.be.calledWith("car");
      });
    }); // passed objects is a type (string)

    _when("no objects passed", function() {
      beforeEach(function() {
        this.findAllDefer = this.hoodie.defer();
        this.sandbox.stub(this.store, "findAll").returns(this.findAllDefer.promise());
      });

      it("should update all objects", function() {
        this.store.updateAll(null, {
          funky: 'update'
        });
        expect(this.store.findAll).to.be.called();
        expect(this.store.findAll.args[0].length).to.eql(0);
      });
    }); // no objects passed
  }); // #updateAll

  describe("#find(type, id)", function() {
    it("should return a promise", function() {
      var promise = this.store.find('document', '123');
      expect(promise).to.be.promise();
    });
  }); // #find

  describe("#findAll(type)", function() {
    it("should return a promise", function() {
      expect(this.store.findAll()).to.be.promise();
    });

    it("should call backend.save", function() {
      this.store.findAll('type', {option: 'value'});
      expect(this.options.backend.findAll).to.be.calledWith('type', {option: 'value'});
    });
  }); // #findAll

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

        expect(promise).to.be.rejected();
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
  }); // #findOrAdd

  describe("#remove(type, id)", function() {
    it("should return a promise", function() {
      var defer = this.store.remove('document', '123');
      expect(defer).to.be.promise();
    });

    it("should call backend.save", function() {
      this.store.remove('document', '123', {option: 'value'});
      expect(this.options.backend.remove).to.be.calledWith('document', '123', {option: 'value'});
    });
  }); // #remove

  describe("#removeAll(type)", function() {
    beforeEach(function() {
      this.findAllDefer = this.hoodie.defer();
      this.sandbox.stub(this.store, 'findAll').returns(this.findAllDefer.promise());
    });

    it("should return a promise", function() {
      expect(this.store.removeAll()).to.be.pending();
    });

    it("should call backend.removeAll", function() {
      this.store.removeAll('type', { option: 'value'})
      expect(this.options.backend.removeAll).to.be.calledWith('type', { option: 'value'});
    });
  }); // #removeAll

  //
  describe("#trigger", function() {
    beforeEach(function() {
      this.sandbox.spy(this.hoodie, "trigger");
    });

    it("should proxy to hoodie.trigger with 'store' namespace", function() {
      this.store.trigger('event', {
        funky: 'fresh'
      });

      expect(this.hoodie.trigger).to.be.calledWith('funkstore:event', {
        funky: 'fresh'
      });
    });
  }); // #trigger

  //
  describe("#on", function() {
    beforeEach(function() {
      this.sandbox.spy(this.hoodie, "on");
    });

    it("should proxy to hoodie.on with 'store' namespace", function() {
      this.store.on('event', {
        funky: 'fresh'
      });
      expect(this.hoodie.on).to.be.calledWith('funkstore:event', {
        funky: 'fresh'
      });
    });

    it("should namespace multiple events correctly", function() {
      var cb = this.sandbox.spy();
      this.store.on('super funky fresh', cb);
      expect(this.hoodie.on.calledWith('funkstore:super funkstore:funky funkstore:fresh', cb)).to.be.ok();
    });
  }); // #on

  //
  describe("#unbind", function() {
    beforeEach(function() {
      this.sandbox.spy(this.hoodie, "unbind");
    });

    it("should proxy to hoodie.unbind with 'store' namespace", function() {
      var cb = function() {};

      this.store.unbind('event', cb);
      expect(this.hoodie.unbind).to.be.calledWith('funkstore:event', cb);
    });
  }); // #unbind

  //
  describe("#decoratePromises", function() {
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

    var methods = "add find findAll findOrAdd update updateAll remove removeAll".split(/\s+/);
    methods.forEach( function(method) {
      it("should scope passed methods to returned promise by " + method, function() {
        var promise;
        this.store.decoratePromises({
          funk: function() {
            return this;
          }
        });
        promise = this.store[method]('task', '12');
        expect(promise.funk()).to.be.promise();
      });
    });
  }); // #decoratePromises
});

