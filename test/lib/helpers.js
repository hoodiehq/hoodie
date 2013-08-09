'use strict';

var _and, _but, _when;

$.ajax = function() {
  var promise = $.Deferred().promise();
  promise.abort = function() {};
  return promise;
};

_when = function(description, specs) {
  describe("when " + description, specs);
};

_and = function(description, specs) {
  describe("and " + description, specs);
};

_but = function(description, specs) {
  describe("but " + description, specs);
};

mocha.setup({globals: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']});


before(function () {
});

beforeEach(function () {
  this.sandbox = sinon.sandbox.create();
});

afterEach(function () {
  this.sandbox.restore();
});

after(function () {
});


// expect.js helpers
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
    , function(){ return 'expected to be called with ' + JSON.stringify(args) + ', calls where: ' + JSON.stringify(this.obj.args)}
    , function(){ return 'expected to not be called with ' + JSON.stringify(args) });
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
    , function(){ return 'expected to be resolved'});
  return this;
};

expect.Assertion.prototype.resolvedWith = function (obj) {
  var resolvedWith;
  this.obj.done( function() { resolvedWith = Array.prototype.slice.call(arguments) });

  this.assert(
      expect.eql(obj, resolvedWith)
    , function(){ return 'expected to resolve with ' + JSON.stringify(obj) + ', was: ' + JSON.stringify(resolvedWith)}
    , function(){ return 'expected to not resolve with ' + JSON.stringify(obj) + ', was: ' + JSON.stringify(resolvedWith)});
  return this;
};

expect.Assertion.prototype.rejected = function () {
  this.assert(
      expect.eql(this.obj.state(), 'rejected')
    , function(){ return 'expected to be resolved'});
  return this;
};

expect.Assertion.prototype.rejectedWith = function (obj) {
  var rejectedWith;
  this.obj.fail( function() { rejectedWith = Array.prototype.slice.call(arguments) });

  this.assert(
      expect.eql(obj, rejectedWith)
    , function(){ return 'expected to rejected with ' + JSON.stringify(obj) + ', was: ' + JSON.stringify(rejectedWith)}
    , function(){ return 'expected to not rejected with ' + JSON.stringify(obj) + ', was: ' + JSON.stringify(rejectedWith)});
  return this;
};

expect.Assertion.prototype.pending = function () {
  this.assert(
      expect.eql(this.obj.state(), 'pending')
    , function(){ return 'expected to be resolved'});
  return this;
};
