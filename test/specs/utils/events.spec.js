require('../../lib/setup');
var events = require('events');
var hoodieEvents = require('../../../src/utils').events;

describe('events', function() {

  describe('module', function() {

    it('should return instance of EventEmitter', function() {
      var emitter = hoodieEvents();
      expect(emitter).to.be.a(events.EventEmitter);
      expect(emitter).to.be.a(hoodieEvents.HoodieEventEmitter);
    });

    it('should extend hoodie instance', function() {
      var hoodie = {};
      hoodieEvents(hoodie);

      expect(hoodie.one).to.be.a(Function);
      expect(hoodie.once).to.be.a(Function);
    });

    it('should map to scopedEventEmitter', function() {
      this.sandbox.spy(hoodieEvents, 'scopedEventEmitter');

      var hoodie = {};
      hoodieEvents(hoodie);
      hoodieEvents(hoodie, {}, 'foo');

      expect(hoodieEvents.scopedEventEmitter).to.be.calledOnce();
    });
  });

  describe('METHODS', function() {

    it('should be an Array with method names', function() {
      expect(hoodieEvents.METHODS).to.be.an(Array);

      hoodieEvents.METHODS.forEach(function(fn) {
        expect(fn).to.be.a('string');
      });
    });

  });

  describe('HoodieEventEmitter', function() {

    it('should have all methods', function() {
      var emitter = new hoodieEvents.HoodieEventEmitter();

      hoodieEvents.METHODS.forEach(function(fn) {
        expect(emitter[fn]).to.be.a(Function);
      });
    });

  });

  describe('scopedEventEmitter', function() {

    it('should emit events on context', function() {
      var hoodie = {};
      hoodieEvents(hoodie);

      var context = {};
      var namespace = 'test';

      hoodieEvents.scopedEventEmitter(hoodie, context, namespace);
      expect(context.on).to.be.a(Function);

      var cb = this.sandbox.spy();
      context.on('foo', cb);

      var data = {bar: 'bar'};
      context.emit('foo', data);

    expect(cb).to.be.calledWithExactly(data);
    expect(cb).to.be.calledOnce();
    });

    it('should emit scoped events on hoodie', function() {
      var hoodie = {};
      hoodieEvents(hoodie);

      var context = {};
      var namespace = 'test';

      hoodieEvents.scopedEventEmitter(hoodie, context, namespace);
      expect(context.on).to.be.a(Function);

      var cb = this.sandbox.spy();
      hoodie.on('test:foo', cb);

      var data = {bar: 'bar'};
      context.emit('foo', data);

      expect(cb).to.be.calledWithExactly(data);
      expect(cb).to.be.calledOnce();
    });

    it('should listen to deeply scoped events', function() {
      var hoodie = {};
      hoodieEvents(hoodie);

      var context = {};
      var namespace = 'test';

      hoodieEvents.scopedEventEmitter(hoodie, context, namespace);
      expect(context.on).to.be.a(Function);

      var deepContext = {};
      var deepNamespace = namespace + ':foo';

      hoodieEvents.scopedEventEmitter(hoodie, deepContext, deepNamespace);

      var cb = this.sandbox.spy();
      hoodie.on('test:foo:bar', cb);

      var ctxCb = this.sandbox.spy();
      context.on('foo:bar', ctxCb);

      var deepCb = this.sandbox.spy();
      deepContext.on('bar', deepCb);

      var data = {bar: 'bar'};
      deepContext.emit('bar', data);

      expect(cb).to.be.calledWithExactly(data);
      expect(cb).to.be.calledOnce();

      expect(ctxCb).to.be.calledWithExactly(data);
      expect(ctxCb).to.be.calledOnce();

      expect(deepCb).to.be.calledWithExactly(data);
      expect(deepCb).to.be.calledOnce();
    });

  });

});
