/* global hoodieEvents:true*/

describe('Events', function() {

  beforeEach(function() {
    this.hoodie = {}; // new Mocks.Hoodie();
    hoodieEvents(this.hoodie);
  });

  describe('.bind(event, callback)', function() {
    it('should bind the passed callback to the passed event', function() {
      var cb = sinon.spy();

      this.hoodie.bind('test', cb);
      this.hoodie.trigger('test');

      expect(cb).to.be.called();
    });

    it('should allow to pass multiple events', function() {
      var cb = sinon.spy();

      this.hoodie.bind('test1 test2', cb);
      this.hoodie.trigger('test1');
      this.hoodie.trigger('test2');

      expect(cb.callCount).to.eql(2);
    });
  }); // .bind(event, callback)

  describe('.one(event, callback)', function() {
    it('should bind passed callback to first occurence of passed event', function() {
      var cb = sinon.spy();

      this.hoodie.one('test', cb);
      this.hoodie.trigger('test');
      this.hoodie.trigger('test');

      expect(cb.callCount).to.eql(1);
    });
  }); // .one(event, callback)

  describe('.trigger(event, args...)', function() {
    it('should call subscribed callbacks', function() {
      var cb1, cb2;
      cb1 = sinon.spy();
      cb2 = sinon.spy();
      this.hoodie.bind('test', cb1);
      this.hoodie.bind('test', cb2);
      this.hoodie.trigger('test');

      expect(cb1.called).to.be.ok();
      expect(cb2.called).to.be.ok();
    });

    it('should pass arguments', function() {
      var cb = sinon.spy();
      this.hoodie.bind('test', cb);
      this.hoodie.trigger('test', 'arg1', 'arg2', 'arg3');

      expect(cb).to.be.calledWith('arg1', 'arg2', 'arg3');
    });
  }); // .trigger(event, args...)

  describe('.unbind(event, callback)', function() {
    _when('callback passed', function() {

      it('should unsubscribe the callback', function() {
        var cb = sinon.spy();
        this.hoodie.bind('test', cb);
        this.hoodie.unbind('test', cb);
        this.hoodie.trigger('test');

        expect(cb.callCount).to.eql(0);
      });
    });

    _when('no callback passed', function() {
      it('should unsubscribe all callbacks', function() {
        var cb1, cb2;
        cb1 = sinon.spy();
        cb2 = sinon.spy();
        this.hoodie.bind('test', cb1);
        this.hoodie.bind('test', cb2);
        this.hoodie.unbind('test');
        this.hoodie.trigger('test');

        expect(cb1.callCount).to.eql(0);
        expect(cb2.callCount).to.eql(0);
      });
    });
  }); // .unbind(event, callback)

  describe('options.context = obj & options.namespace = "funky"', function() {
    beforeEach(function() {
      this.context = {};
      hoodieEvents(this.hoodie, { context: this.context, namespace: 'funky' });
    });

    describe('.bind(event, callback)', function() {
      it('should bind the passed callback to the passed event on context', function() {
        var cb = sinon.spy();

        this.context.bind('test', cb);
        this.context.trigger('test');

        expect(cb).to.be.called();
      });

      it('should bind the passed callback to the passed event namespaced by "funky"', function() {
        var cb = sinon.spy();

        this.hoodie.bind('funky:test', cb);
        this.context.trigger('test');

        expect(cb).to.be.called();
      });
    }); // .bind(event, callback)

    describe('.one(event, callback)', function() {
      it('should bind passed callback to first occurence of passed event on context', function() {
        var cb = sinon.spy();

        this.context.one('test', cb);
        this.context.trigger('test');
        this.context.trigger('test');

        expect(cb.callCount).to.eql(1);
      });

      it('should bind passed callback to first occurence of passed event namespaced by "funky"', function() {
        var cb = sinon.spy();

        this.context.one('test', cb);
        this.hoodie.trigger('funky:test');
        this.hoodie.trigger('funky:test');

        expect(cb.callCount).to.eql(1);
      });
    }); // .one(event, callback)

    describe('.unbind(event, callback)', function() {
      _when('callback passed', function() {
        it('should unsubscribe the callback on context', function() {
          var cb = sinon.spy();
          this.context.bind('test', cb);
          this.context.unbind('test', cb);
          this.context.trigger('test');

          expect(cb.callCount).to.eql(0);
        });

        it('should unsubscribe the callback namespaced by "funky"', function() {
          var cb = sinon.spy();
          this.context.bind('test', cb);
          this.context.unbind('test', cb);
          this.hoodie.trigger('funky:test');

          expect(cb.callCount).to.eql(0);
        });
      });

      _when('no callback passed', function() {
        it('should unsubscribe all callbacks namespaced by "funky"', function() {
          var cb1, cb2, cb3;
          cb1 = sinon.spy();
          cb2 = sinon.spy();
          cb3 = sinon.spy();
          this.hoodie.bind('funky:test', cb1);
          this.hoodie.bind('funky:test', cb2);
          this.hoodie.bind('test', cb3);
          this.context.unbind();
          this.context.trigger('test');
          this.hoodie.trigger('test');

          expect(cb1.callCount).to.eql(0);
          expect(cb2.callCount).to.eql(0);
          expect(cb3.callCount).to.eql(1);
        });
      });
    }); // .unbind(event, callback)
  });
});

