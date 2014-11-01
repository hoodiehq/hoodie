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

expect.Assertion.prototype.promise = function () {
  var isPromise = (typeof this.obj.done === 'function' && this.obj.resolve === undefined);
  this.assert(
      isPromise
    , function(){ return 'expected promise'});
  return this;
};

expect.Assertion.prototype.resolved = function () {
  this.assert(
      expect.eql(this.obj.isFulfilled(), true)
    , function(){ return 'expected to be resolved, but is ' + this.obj});
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
      expect.eql(this.obj.isRejected(), true)
    , function(){ return 'expected to be rejected, but is ' + this.obj});
  return this;
};

expect.Assertion.prototype.rejectedWith = function () {
  var args = Array.prototype.slice.call(arguments);
  var rejectedWith;
  this.obj.fail(function(error) {
    rejectedWith = error.reason();
  });

  // hoodie turns a string into an Error Object.
  // For simplicity, allow to test for rejectedWith(message)
  // as it is usually in the code, instead of rejectedWith( new HoodieError(message) )
  if (rejectedWith && typeof args[0] === 'string') {
    rejectedWith = rejectedWith.message || rejectedWith;
  }



  this.assert(
      expect.eql(args, [rejectedWith])
    , function(){ return 'expected to rejected with \n' + JSON.stringify(args, '', '  ') + ', was: \n' + JSON.stringify(rejectedWith, '', '  ')}
    , function(){ return 'expected to not rejected with \n' + JSON.stringify(args, '', '  ') + ', was: \n' + JSON.stringify(rejectedWith, '', '  ')});
  return this;
};

expect.Assertion.prototype.pending = function () {
  var isPending = true;
  this.obj.always(function() {
    isPending = false;
  });
  this.assert(
      expect.eql(isPending, true)
    , function(){ return 'expected to be pending, but is ' + this.obj});
  return this;
};
