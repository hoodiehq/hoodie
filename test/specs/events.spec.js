describe("Events", function() {

  beforeEach(function() {
    this.obj = new Events;
  });

  describe(".bind(event, callback)", function() {

    it("should bind the passed callback to the passed event", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.obj.bind('test', cb);
      this.obj.trigger('test');
      expect(cb).wasCalled();
    });

    it("should allow to pass multiple events", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.obj.bind('test1 test2', cb);
      this.obj.trigger('test1');
      this.obj.trigger('test2');
      expect(cb.callCount).toBe(2);
    });

  });

  describe(".one(event, callback)", function() {

    it("should bind passed callback to first occurence of passed event", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.obj.one('test', cb);
      this.obj.trigger('test');
      this.obj.trigger('test');
      expect(cb.callCount).toBe(1);
    });

  });

  describe(".trigger(event, args...)", function() {

    it("should call subscribed callbacks", function() {
      var cb1, cb2;
      cb1 = jasmine.createSpy('test1');
      cb2 = jasmine.createSpy('test2');
      this.obj.bind('test', cb1);
      this.obj.bind('test', cb2);
      this.obj.trigger('test');
      expect(cb1).wasCalled();
      expect(cb2).wasCalled();
    });

    it("should pass arguments", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.obj.bind('test', cb);
      this.obj.trigger('test', 'arg1', 'arg2', 'arg3');
      expect(cb).wasCalledWith('arg1', 'arg2', 'arg3');
    });

  });

  describe(".unbind(event, callback)", function() {

    _when("callback passed", function() {
      it("should unsubscribe the callback", function() {
        var cb;
        cb = jasmine.createSpy('test');
        this.obj.bind('test', cb);
        this.obj.unbind('test', cb);
        this.obj.trigger('test');
        expect(cb).wasNotCalled();
      });
    });

    _when("no callback passed", function() {
      it("should unsubscribe all callbacks", function() {
        var cb1, cb2;
        cb1 = jasmine.createSpy('test1');
        cb2 = jasmine.createSpy('test2');
        this.obj.bind('test', cb1);
        this.obj.bind('test', cb2);
        this.obj.unbind('test');
        this.obj.trigger('test');
        expect(cb1).wasNotCalled();
        expect(cb2).wasNotCalled();
      });

    });

  });

});

