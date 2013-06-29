 describe("Hoodie.User", function() {
  beforeEach(function() {
    return this.hoodie = new Mocks.Hoodie;
  });
  describe("constructor", function() {
    beforeEach(function() {
      return spyOn(this.hoodie, "open").andReturn('storeApi');
    });
    it("should return a shortcut for hoodie.open", function() {
      var user;
      user = new Hoodie.User(this.hoodie);
      expect(user('uuid123')).toBe('storeApi');
      return expect(this.hoodie.open).wasCalledWith('user/uuid123/public', {
        prefix: '$public'
      });
    });
    it("should pass options", function() {
      var user;
      user = new Hoodie.User(this.hoodie);
      user('uuid123', {
        sync: true
      });
      return expect(this.hoodie.open).wasCalledWith('user/uuid123/public', {
        prefix: '$public',
        sync: true
      });
    });
    return it("should extend hoodie.store API with publish / unpublish methods", function() {
      var publish, unpublish, _ref;
      spyOn(this.hoodie.store, "decoratePromises");
      new Hoodie.User(this.hoodie);
      expect(this.hoodie.store.decoratePromises).wasCalled();
      _ref = this.hoodie.store.decoratePromises.mostRecentCall.args[0], publish = _ref.publish, unpublish = _ref.unpublish;
      expect(typeof publish).toBe('function');
      return expect(typeof unpublish).toBe('function');
    });
  });
  return describe("hoodie.store promise decorations", function() {
    beforeEach(function() {
      this.storeDefer = this.hoodie.defer();
      return spyOn(this.hoodie.store, "update");
    });
    describe("#publish(properties)", function() {
      _when("promise returns one object", function() {
        beforeEach(function() {
          this.promise = this.storeDefer.resolve({
            type: 'task',
            id: '123',
            title: 'milk'
          });
          return this.promise.hoodie = this.hoodie;
        });
        _and("no properties passed", function() {
          return it("should update object returned by promise with $public: true", function() {
            Hoodie.User.prototype._storePublish.apply(this.promise, []);
            return expect(this.hoodie.store.update).wasCalledWith('task', '123', {
              $public: true
            });
          });
        });
        return _and("properties passed as array", function() {
          return it("should update object returned by promise with $public: ['title', 'owner']", function() {
            var properties;
            properties = ['title', 'owner'];
            Hoodie.User.prototype._storePublish.apply(this.promise, [properties]);
            return expect(this.hoodie.store.update).wasCalledWith('task', '123', {
              $public: ['title', 'owner']
            });
          });
        });
      });
      return _when("promise returns multiple objects", function() {
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
          return this.promise.hoodie = this.hoodie;
        });
        _and("no properties passed", function() {
          return it("should update object returned by promise with $public: true", function() {
            Hoodie.User.prototype._storePublish.apply(this.promise, []);
            expect(this.hoodie.store.update).wasCalledWith('task', '123', {
              $public: true
            });
            return expect(this.hoodie.store.update).wasCalledWith('task', '456', {
              $public: true
            });
          });
        });
        return _and("properties passed as array", function() {
          return it("should update object returned by promise with $public: ['title', 'owner']", function() {
            var properties;
            properties = ['title', 'owner'];
            Hoodie.User.prototype._storePublish.apply(this.promise, [properties]);
            expect(this.hoodie.store.update).wasCalledWith('task', '123', {
              $public: ['title', 'owner']
            });
            return expect(this.hoodie.store.update).wasCalledWith('task', '456', {
              $public: ['title', 'owner']
            });
          });
        });
      });
    });
    return describe("#unpublish()", function() {
      _when("promise returns one object that is public", function() {
        beforeEach(function() {
          this.promise = this.storeDefer.resolve({
            type: 'task',
            id: '123',
            title: 'milk',
            $public: true
          });
          return this.promise.hoodie = this.hoodie;
        });
        return it("should update object returned by promise with $public: false", function() {
          Hoodie.User.prototype._storeUnpublish.apply(this.promise, []);
          return expect(this.hoodie.store.update).wasCalledWith('task', '123', {
            $public: false
          });
        });
      });
      _when("promise returns one object that is not public", function() {
        beforeEach(function() {
          this.promise = this.storeDefer.resolve({
            type: 'task',
            id: '123',
            title: 'milk'
          });
          return this.promise.hoodie = this.hoodie;
        });
        return it("should not update object returned by promise", function() {
          Hoodie.User.prototype._storeUnpublish.apply(this.promise, []);
          return expect(this.hoodie.store.update).wasNotCalled();
        });
      });
      return _when("promise returns multiple objects, of which some are public", function() {
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
          return this.promise.hoodie = this.hoodie;
        });
        return it("should update object returned by promise with $public: true", function() {
          Hoodie.User.prototype._storeUnpublish.apply(this.promise, []);
          expect(this.hoodie.store.update).wasNotCalledWith('task', '123', {
            $public: false
          });
          expect(this.hoodie.store.update).wasCalledWith('task', '456', {
            $public: false
          });
          return expect(this.hoodie.store.update).wasCalledWith('task', '789', {
            $public: false
          });
        });
      });
    });
  });
});
