'use strict';

var _and, _but, _when;

$.ajax = function() {
  var promise = $.Deferred().promise();
  promise.abort = function() {};
  return promise;
};

_when = function(description, specs) {
  describe('when ' + description, specs);
};

_and = function(description, specs) {
  describe('and ' + description, specs);
};

_but = function(description, specs) {
  describe('but ' + description, specs);
};

// expect.js helpers
expect.Assertion.prototype.called = function() {

  this.assert(
      this.obj.called
    , function(){ return 'expected to be called'}
    , function(){ return 'expected to not be called' });
  return this
};
expect.Assertion.prototype.calledWith = function() {
  var args = Array.prototype.slice.call(arguments);
  var hit = false

  for (var i = 0; i < this.obj.args.length; i++) {
    if (expect.eql(this.obj.args[i], args)) {
      hit = true
    }
  };

  this.assert(
      hit
    , function(){ return 'expected to be called with \n' + JSON.stringify(args, '', '  ') + ', calls where: \n' + JSON.stringify(this.obj.args, '', '  ')}
    , function(){ return 'expected to not be called with \n' + JSON.stringify(args, '', '  ') });
  return this
};

expect.Assertion.prototype.promise = function () {
  var isPromise = (typeof this.obj.done === 'function' && this.obj.resolve === undefined);
  this.assert(
      isPromise
    , function(){ return 'expected promise'});
  return this;
};

expect.Assertion.prototype.resolved = function () {
  this.assert(
      expect.eql(this.obj.state(), 'resolved')
    , function(){ return 'expected to be resolved, but is ' + this.obj.state()});
  return this;
};

expect.Assertion.prototype.resolvedWith = function () {
  var args = Array.prototype.slice.call(arguments);
  var resolvedWith;
  this.obj.done( function() { resolvedWith = Array.prototype.slice.call(arguments) });

  this.assert(
      expect.eql(args, resolvedWith)
    , function(){ return 'expected to resolve with \n' + JSON.stringify(args, '', '  ') + ', was: \n' + JSON.stringify(resolvedWith, '', '  ')}
    , function(){ return 'expected to not resolve with \n' + JSON.stringify(args, '', '  ') + ', was: \n' + JSON.stringify(resolvedWith, '', '  ')});
  return this;
};

expect.Assertion.prototype.rejected = function () {
  this.assert(
      expect.eql(this.obj.state(), 'rejected')
    , function(){ return 'expected to be rejected, but is ' + this.obj.state()});
  return this;
};

expect.Assertion.prototype.rejectedWith = function () {
  var args = Array.prototype.slice.call(arguments);
  var rejectedWith;
  this.obj.fail( function() { rejectedWith = Array.prototype.slice.call(arguments) });

  this.assert(
      expect.eql(args, rejectedWith)
    , function(){ return 'expected to rejected with \n' + JSON.stringify(args, '', '  ') + ', was: \n' + JSON.stringify(rejectedWith, '', '  ')}
    , function(){ return 'expected to not rejected with \n' + JSON.stringify(args, '', '  ') + ', was: \n' + JSON.stringify(rejectedWith, '', '  ')});
  return this;
};

expect.Assertion.prototype.pending = function () {
  this.assert(
      expect.eql(this.obj.state(), 'pending')
    , function(){ return 'expected to be pending, but is ' + this.obj.state()});
  return this;
};
