'use strict';

describe('Events', function() {

  beforeEach(function() {
    this.obj = new window.Events();
  });

  describe('.bind(event, callback)', function() {

    it('should bind the passed callback to the passed event', function() {
      var cb= sinon.spy();

      this.obj.bind('test', cb);
      this.obj.trigger('test');

      expect(cb.called).to.be.ok();
    });

    it('should allow to pass multiple events', function() {
      var cb = sinon.spy();

      this.obj.bind('test1 test2', cb);
      this.obj.trigger('test1');
      this.obj.trigger('test2');

      expect(cb.callCount).to.eql(2);
    });

  });

  describe('.one(event, callback)', function() {

    it('should bind passed callback to first occurence of passed event', function() {
      var cb = sinon.spy();

      this.obj.one('test', cb);
      this.obj.trigger('test');

      expect(cb.callCount).to.eql(1);
    });

  });

  describe('.trigger(event, args...)', function() {

    it('should call subscribed callbacks', function() {
      var cb1, cb2;
      cb1 = sinon.spy();
      cb2 = sinon.spy();
      this.obj.bind('test', cb1);
      this.obj.bind('test', cb2);
      this.obj.trigger('test');

      expect(cb1.called).to.be.ok();
      expect(cb2.called).to.be.ok();
    });

    it('should pass arguments', function() {
      var cb = sinon.spy();
      this.obj.bind('test', cb);
      this.obj.trigger('test', 'arg1', 'arg2', 'arg3');

      expect(cb.calledWith('arg1', 'arg2', 'arg3')).to.be.ok();
    });

  });

  describe('.unbind(event, callback)', function() {

    _when('callback passed', function() {

      it('should unsubscribe the callback', function() {
        var cb= sinon.spy();
        this.obj.bind('test', cb);
        this.obj.unbind('test', cb);
        this.obj.trigger('test');

        expect(cb.callCount).to.eql(0);
      });
    });

    _when('no callback passed', function() {
      it('should unsubscribe all callbacks', function() {
        var cb1, cb2;
        cb1 = sinon.spy();
        cb2 = sinon.spy();
        this.obj.bind('test', cb1);
        this.obj.bind('test', cb2);
        this.obj.unbind('test');
        this.obj.trigger('test');

        expect(cb1.callCount).to.eql(0);
        expect(cb2.callCount).to.eql(0);
      });

    });

  });

});

