describe("Hoodie Events", function() {

  'use strict';

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    hoodieEvents(this.hoodie)
  });

  describe(".bind(event, callback)", function() {

    it("should bind the passed callback to the passed event", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.hoodie.bind('test', cb);
      this.hoodie.trigger('test');
      expect(cb).wasCalled();
    });

    it("should allow to pass multiple events", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.hoodie.bind('test1 test2', cb);
      this.hoodie.trigger('test1');
      this.hoodie.trigger('test2');
      expect(cb.callCount).toBe(2);
    });

  });

  describe(".one(event, callback)", function() {

    it("should bind passed callback to first occurence of passed event", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.hoodie.one('test', cb);
      this.hoodie.trigger('test');
      expect(cb.callCount).toBe(1);
    });

  });

  describe(".trigger(event, args...)", function() {

    it("should call subscribed callbacks", function() {
      var cb1, cb2;
      cb1 = jasmine.createSpy('test1');
      cb2 = jasmine.createSpy('test2');
      this.hoodie.bind('test', cb1);
      this.hoodie.bind('test', cb2);
      this.hoodie.trigger('test');
      expect(cb1).wasCalled();
      expect(cb2).wasCalled();
    });

    it("should pass arguments", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.hoodie.bind('test', cb);
      this.hoodie.trigger('test', 'arg1', 'arg2', 'arg3');
      expect(cb).wasCalledWith('arg1', 'arg2', 'arg3');
    });

  });

  describe(".unbind(event, callback)", function() {

    _when("callback passed", function() {
      it("should unsubscribe the callback", function() {
        var cb;
        cb = jasmine.createSpy('test');
        this.hoodie.bind('test', cb);
        this.hoodie.unbind('test', cb);
        this.hoodie.trigger('test');
        expect(cb).wasNotCalled();
      });
    });

    _when("no callback passed", function() {
      it("should unsubscribe all callbacks", function() {
        var cb1, cb2;
        cb1 = jasmine.createSpy('test1');
        cb2 = jasmine.createSpy('test2');
        this.hoodie.bind('test', cb1);
        this.hoodie.bind('test', cb2);
        this.hoodie.unbind('test');
        this.hoodie.trigger('test');
        expect(cb1).wasNotCalled();
        expect(cb2).wasNotCalled();
      });

    });

  });

});

