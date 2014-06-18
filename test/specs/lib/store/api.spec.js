require('../../../lib/setup');

// stub the requires before loading the actual module
var eventsMixin = sinon.spy();
var scopedStoreFactory = sinon.stub();

global.stubRequire('src/lib/events', eventsMixin);
global.stubRequire('src/lib/store/scoped', scopedStoreFactory);

global.unstubRequire('src/lib/store/api');
var hoodieStoreFactory = require('../../../../src/lib/store/api');

var extend = require('extend');

describe('hoodieStoreFactory', function() {

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);

    this.options = this.MOCKS.storeOptions('funkstore');
    this.validate = sinon.spy();
    this.optionsWithValidate = extend({}, this.options, {validate: this.validate});

    scopedStoreFactory.reset();
    scopedStoreFactory.returns('scoped api');

    this.store = hoodieStoreFactory(this.hoodie, this.options );
    this.storeWithCustomValidate = hoodieStoreFactory(this.hoodie, this.optionsWithValidate );
  });


  after(function() {
    global.unstubRequire('src/lib/events');
    global.unstubRequire('src/lib/store/scoped');
  });

  it('sets store.validate from options.validate', function() {
    expect(this.storeWithCustomValidate.validate).to.be(this.validate);
  });

  it('has a default store.validate function', function() {
    expect(this.store.validate).to.be.a(Function);
  });

  it('returns a function', function() {
    expect(this.store).to.be.a(Function);
  });

  it('adds event API', function() {
    expect(eventsMixin).to.be.calledWith(this.hoodie, { context : this.store, namespace: 'funkstore' });
  });

  describe('store("task", "id")', function() {
    it('returns scoped API by type when only type set', function() {
      this.taskStore = this.store('task');
      expect(scopedStoreFactory).to.be.called();
      var args = scopedStoreFactory.args[0];
      expect(args[0]).to.eql(this.hoodie);
      expect(args[1]).to.eql(this.store);
      expect(args[2].type).to.be('task');
      expect(args[2].id).to.be(undefined);
      expect(this.taskStore).to.eql('scoped api');
    });

    it('returns scoped API by type & id when both set', function() {
      this.taskStore = this.store('task', '123');
      var args = scopedStoreFactory.args[0];
      expect(args[0]).to.eql(this.hoodie);
      expect(args[1]).to.eql(this.store);
      expect(args[2].type).to.be('task');
      expect(args[2].id).to.be('123');
    });
  });

  describe('#validate(object, options)', function() {
    beforeEach(function() {
      this.object = {
        type: 'document',
        id: '123',
        name: 'bazinga!'
      };
    });
    it('returns nothing when valid data passed', function() {
      expect(this.store.validate(this.object)).to.be(undefined);
    });

    it('returns nothing when id is undefined', function() {
      delete this.object.id;
      expect(this.store.validate(this.object)).to.be(undefined);
    });

    it('returns an error when type is undefined', function() {
      delete this.object.type;
      expect(this.store.validate(this.object)).to.be.an(Error);
    });

    it('returns an error when no object passed', function() {
      var error = this.store.validate();
      expect(error).to.be.an(Error);
    });

    it('returns an error when invalid type passed', function() {
      this.object.type = 'inva/id';
      var error = this.store.validate(this.object);
      expect(error).to.be.an(Error);
    });

    it('returns an error when invalid id passed', function() {
      this.object.id = 'inva/id';
      var error = this.store.validate(this.object);
      expect(error).to.be.an(Error);
    });

    it('passes object & options', function() {
      this.sandbox.stub(this.store, 'validate');
      this.store.save('document', '123', {name: 'test'}, {option: 'value'});
      expect(this.store.validate).to.be.calledWith({
        type: 'document',
        id: '123',
        name: 'test'
      }, {option: 'value'});
    });
  });

  describe('#save(type, id, object, options)', function() {
    it('should return a promise', function() {
      var promise = this.store.save('document', '123', {
        name: 'test'
      });
      expect(promise).to.be.pending();
    });

    it('should the object including type & id', function() {
      this.store.save('type', 'id', {property: 'value'}, { option: 'value'});
      expect(this.options.backend.save).to.be.calledWith({type: 'type', id: 'id', property: 'value'}, { option: 'value'});
    });

    it('should validate', function() {
      this.sandbox.spy(this.store, 'validate');
      this.store.save('type', 'id', {property: 'value'}, {option: 'value'});
      expect(this.store.validate).to.be.calledWith({
        'property': 'value',
        'type': 'type',
        'id': 'id'
      }, {option: 'value'});
    });

    it('should make a deep copy of passed object', function() {
      var originalObject = {
        name: 'don\'t mess with me',
        nested: {
          property: 'funky'
        },
        type: 'document',
        id: '123'
      };
      this.store.save('document', '123', originalObject);
      var passedObject = this.options.backend.save.args[0][0];
      passedObject.nested.property = 'fresh';
      expect(passedObject.nested.property).to.be('fresh');
      expect(originalObject.nested.property).to.be('funky');
    });

    it('should make a deep copy of passed options', function() {
      var originalOptions = {
        nested: {
          property: 'funky'
        }
      };
      this.store.save('document', '123', { title: 'yo'}, originalOptions);
      var passedOptions = this.options.backend.save.args[0][1];
      passedOptions.nested.property = 'fresh';
      expect(passedOptions.nested.property).to.be('fresh');
      expect(originalOptions.nested.property).to.be('funky');
    });
  }); // #save

  describe('add(type, object)', function() {
    beforeEach(function () {
      this.sandbox.stub(this.store, 'save').returns('save_promise');
    });

    it('should proxy to save method', function() {
      this.store.add('test', {
        funky: 'value'
      });

      expect(this.store.save.calledWith('test', undefined, {
        funky: 'value'
      })).to.be.ok();
    });

    it('should return promise of save method', function() {
      expect(this.store.add()).to.eql('save_promise');
    });
  });

  describe('#update(type, id, update, options)', function() {
    beforeEach(function() {
      this.findDefer = this.hoodie.defer();
      this.saveDefer = this.hoodie.defer();
      this.sandbox.stub(this.store, 'find').returns(this.findDefer);
      this.sandbox.stub(this.store, 'save').returns(this.saveDefer);
    });

    _when('object cannot be found', function() {
      beforeEach(function() {
        this.findDefer.reject('not_found');
        this.promise = this.store.update('couch', '123', {
          funky: 'fresh'
        });
      });

      it('should reject', function() {
        expect(this.promise).to.be.rejectedWith('not_found');
      });
    }); // object cannot be found

    _when('object can be found', function() {

      beforeEach(function() {
        this.findDefer.resolve({ style: 'baws' });
      });

      _and('update is an object', function() {

        beforeEach(function() {
          this.promise = this.store.update('couch', '123', {
            funky: 'fresh'
          });
        });

        it('should save the updated object', function() {
          expect(this.store.save).to.be.calledWith('couch', '123', {
            style: 'baws',
            funky: 'fresh'
          }, void 0);
        });

        it('should return a resolved promise', function() {
          this.saveDefer.resolve( 'resolved by save' );
          this.promise.then(this.noop, function (res) {
            expect(res).to.eql('resolved by save');
          });
        });
      });

      _and('update is an object and options passed', function() {

        beforeEach(function() {
          this.promise = this.store.update('couch', '123', {
            funky: 'fresh'
          }, {
            silent: true
          });
        });

        it('should not save the object', function() {
          expect(this.store.save).to.be.calledWith('couch', '123', {
            style: 'baws',
            funky: 'fresh'
          }, {
            silent: true
          });
        });

      });

      _and('update is a function', function() {
        beforeEach(function() {
          this.promise = this.store.update('couch', '123', function() {
            return {
              funky: 'fresh'
            };
          });
        });

        it('should save the updated object', function() {
          expect(this.store.save.calledWith('couch', '123', {
            style: 'baws',
            funky: 'fresh'
          }, void 0)).to.be.ok();
        });

        it('should return a resolved promise', function() {
          this.promise.then(function (res) {
            expect(res).to.eql('resolved by save');
          });
        });

        it('should make a deep copy and save', function() {
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

      _and('update wouldn\'t make a change', function() {

        beforeEach(function() {
          this.saveDefer.resolve({
            type: 'couch',
            id: '123',
            style: 'baws'
          });
          this.promise = this.store.update('couch', '123', function() {
            return {
              style: 'baws'
            };
          });
        });

        it('should not save the object', function() {
          expect(this.store.save).to.not.be.called();
        });

        it('should return a resolved promise', function() {
          expect(this.promise).to.be.resolvedWith({style: 'baws'});
        });
      });

      _but('update wouldn\'t make a change, but options have been passed', function() {
        beforeEach(function() {
          this.promise = this.store.update('couch', '123', {}, {
            'public': true
          });
        });

        it('should not save the object', function() {
          expect(this.store.save.calledWith('couch', '123', {
            style: 'baws'
          }, {
            'public': true
          })).to.be.ok();
        });
      }); // update wouldn't make a change, but options have been passed
    }); // object can be found
  }); // #update

  describe('#updateOrAdd(type, id, update, options)', function() {
    beforeEach(function() {
      this.updateDefer = this.hoodie.defer();
      this.addDefer = this.hoodie.defer();
      this.sandbox.stub(this.store, 'update').returns(this.updateDefer);
      this.sandbox.stub(this.store, 'add').returns(this.addDefer);

      this.promise = this.store.updateOrAdd('couch', '123', {
        funky: 'fresh'
      }, {option: 'value'});
    });

    it('updates object', function() {
      expect(this.store.update).to.be.calledWith('couch', '123', {funky: 'fresh'}, {option: 'value'});
    });

    _when('object update succeeds', function() {
      beforeEach(function() {
        this.updateDefer.resolve('jup');
      });

      it('should resolve', function() {
        expect(this.promise).to.be.resolvedWith('jup');
      });
    }); // object cannot be found

    _when('object update fails', function() {
      beforeEach(function() {
        this.updateDefer.reject('nope');
      });

      it('should add the object to the store', function() {
        expect(this.store.add).to.be.calledWith('couch', {
          id: '123',
          funky: 'fresh',
        }, {option: 'value'});
      });

      it('rejects when adding object fails', function() {
        this.addDefer.reject('nope');
        expect(this.promise).to.be.rejectedWith('nope');
      });

      it('resolves when adding object succeeds', function() {
        this.addDefer.resolve('yay');
        expect(this.promise).to.be.resolvedWith('yay');
      });
    }); // object cannot be found
  }); // #updateOrAdd

  describe('#updateAll(objects)', function() {
    beforeEach(function() {
      this.sandbox.stub(this.hoodie, 'isPromise').returns(false);
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

    it('should return a promise', function() {
      expect(this.store.updateAll(this.todoObjects, {})).to.be.promise();
    });

    it('should update objects', function() {
      var obj, _i, _len, _ref;
      this.sandbox.spy(this.store, 'update');

      this.store.updateAll(this.todoObjects, {
        funky: 'update'
      });
      _ref = this.todoObjects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        expect(this.store.update).to.be.calledWith(obj.type, obj.id, {
          funky: 'update'
        }, {});
      }
    });

    it('should resolve the returned promise once all objects have been updated', function() {
      var promise = this.hoodie.defer().resolve('obj').promise();
      this.sandbox.stub(this.store, 'update').returns(promise);
      expect(this.store.updateAll(this.todoObjects, {})).to.be.resolvedWith(['obj', 'obj', 'obj']);
    });

    it('should not resolve the returned promise unless object updates have been finished', function() {
      var promise = this.hoodie.defer().promise();
      this.sandbox.stub(this.store, 'update').returns(promise);
      expect(this.store.updateAll(this.todoObjects, {})).to.be.pending();
    });

    _when('passed objects is a promise', function() {

      beforeEach(function() {
        this.hoodie.isPromise.returns(true);
      });

      it('should update objects returned by promise', function() {
        var obj, promise, _i, _len, _ref;

        promise = this.hoodie.defer().resolve(this.todoObjects).promise();

        this.sandbox.spy(this.store, 'update');
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

      it('should update object single object returned by promise', function() {
        var obj, promise;
        obj = this.todoObjects[0];
        promise = this.hoodie.defer().resolve(obj).promise();
        this.sandbox.spy(this.store, 'update');
        this.store.updateAll(promise, {
          funky: 'update'
        });
        expect(this.store.update.calledWith(obj.type, obj.id, {
          funky: 'update'
        }, {})).to.be.ok();
      });
    }); // passed objects is a promise

    _when('passed objects is a type (string)', function() {
      beforeEach(function() {
        this.findAllDefer = this.hoodie.defer();
        this.sandbox.stub(this.store, 'findAll').returns(this.findAllDefer.promise());
      });

      it('should update objects return by findAll(type)', function() {
        this.store.updateAll('car', {
          funky: 'update'
        });
        expect(this.store.findAll).to.be.calledWith('car');
      });
    }); // passed objects is a type (string)

    _when('no objects passed', function() {
      beforeEach(function() {
        this.findAllDefer = this.hoodie.defer();
        this.sandbox.stub(this.store, 'findAll').returns(this.findAllDefer.promise());
      });

      it('should update all objects', function() {
        this.store.updateAll(null, {
          funky: 'update'
        });
        expect(this.store.findAll).to.be.called();
        expect(this.store.findAll.args[0].length).to.eql(0);
      });
    }); // no objects passed
  }); // #updateAll

  describe('#find(type, id)', function() {
    it('should return a promise', function() {
      var promise = this.store.find('document', '123');
      expect(promise).to.be.promise();
    });
  }); // #find

  describe('#findAll(type)', function() {
    it('should return a promise', function() {
      expect(this.store.findAll()).to.be.promise();
    });

    it('should call backend.save', function() {
      this.store.findAll('type', {option: 'value'});
      expect(this.options.backend.findAll).to.be.calledWith('type', {option: 'value'});
    });
  }); // #findAll

  describe('#findOrAdd(type, id, attributes)', function() {
    _when('object exists', function() {
      beforeEach(function() {
        var promise = this.hoodie.defer().resolve('existing_object').promise();
        this.sandbox.stub(this.store, 'find').returns(promise);
      });

      it('should resolve with existing object', function() {
        var promise = this.store.findOrAdd('type', '123', {
          attribute: 'value'
        });

        promise.then(function (res) {
          expect(res).to.eql('existing_object');
        });
      });
    });

    _when('object does not exist', function() {
      beforeEach(function() {
        this.sandbox.stub(this.store, 'find').returns(this.hoodie.defer().reject().promise());
      });

      it('should call `.add` with passed attributes', function() {
        this.sandbox.stub(this.store, 'add').returns(this.hoodie.defer().promise());

        this.store.findOrAdd('type', 'id123', {
          attribute: 'value'
        });

        expect(this.store.add.calledWith('type', {
          id: 'id123',
          attribute: 'value'
        })).to.be.ok();
      });

      it('should reject when `.add` was rejected', function() {
        this.sandbox.stub(this.store, 'add').returns(this.hoodie.defer().reject().promise());

        var promise = this.store.findOrAdd({
          id: '123',
          attribute: 'value'
        });

        expect(promise).to.be.rejected();
      });

      it('should resolve when `.add` was resolved', function() {
        var promise = this.hoodie.defer().resolve('new_object').promise();

        this.sandbox.stub(this.store, 'add').returns(promise);

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

  describe('#remove(type, id)', function() {
    it('should return a promise', function() {
      var defer = this.store.remove('document', '123');
      expect(defer).to.be.promise();
    });

    it('should call backend.save', function() {
      this.store.remove('document', '123', {option: 'value'});
      expect(this.options.backend.remove).to.be.calledWith('document', '123', {option: 'value'});
    });
  }); // #remove

  describe('#removeAll(type)', function() {
    beforeEach(function() {
      this.findAllDefer = this.hoodie.defer();
      this.sandbox.stub(this.store, 'findAll').returns(this.findAllDefer.promise());
    });

    it('should return a promise', function() {
      expect(this.store.removeAll()).to.be.pending();
    });

    it('should call backend.removeAll', function() {
      this.store.removeAll('type', { option: 'value'});
      expect(this.options.backend.removeAll).to.be.calledWith('type', { option: 'value'});
    });
  }); // #removeAll

  //
  describe('#decoratePromises', function() {
    it('should decorate promises returned by the store', function() {
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

    var methods = 'add find findAll findOrAdd update updateAll remove removeAll'.split(/\s+/);
    methods.forEach( function(method) {
      it('should scope passed methods to returned promise by ' + method, function() {
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

