'use strict';
var _and, _but, _when;

$.ajax = function() {
  var promise = $.Deferred().promise();
  promise.abort = function() {};
  return promise;
}

_when = function(description, specs) {
  return describe("when " + description, specs);
};

_and = function(description, specs) {
  return describe("and " + description, specs);
};

_but = function(description, specs) {
  return describe("but " + description, specs);
};

jasmine.Matchers.prototype.toBePromise = function() {
  return this.actual.done && !this.actual.resolve;
};

jasmine.Matchers.prototype.toBeDefer = function() {
  return this.actual.done && this.actual.resolve;
};

jasmine.Matchers.prototype.toBeRejected = function() {
  return this.actual.state() === 'rejected';
};

jasmine.Matchers.prototype.toBeResolved = function() {
  return this.actual.state() === 'resolved';
};

jasmine.Matchers.prototype.notToBeRejected = function() {
  return this.actual.state() !== 'rejected';
};

jasmine.Matchers.prototype.notToBeResolved = function() {
  return this.actual.state() !== 'resolved';
};

jasmine.Matchers.prototype.toBeResolvedWith = function() {
  var done, expectedArgs;
  expectedArgs = jasmine.util.argsToArray(arguments);
  if (!this.actual.done) {
    throw new Error('Expected a promise, but got ' + jasmine.pp(this.actual) + '.');
  }
  done = jasmine.createSpy('done');
  this.actual.done(done);
  this.message = function() {
    if (done.callCount === 0) {
      return ["Expected spy " + done.identity + " to have been resolved with " + jasmine.pp(expectedArgs) + " but it was never resolved.", "Expected spy " + done.identity + " not to have been resolved with " + jasmine.pp(expectedArgs) + " but it was."];
    } else {
      return ["Expected spy " + done.identity + " to have been resolved with " + jasmine.pp(expectedArgs) + " but was resolved with " + jasmine.pp(done.argsForCall), "Expected spy " + done.identity + " not to have been resolved with " + jasmine.pp(expectedArgs) + " but was resolved with " + jasmine.pp(done.argsForCall)];
    }
  };
  return this.env.contains_(done.argsForCall, expectedArgs);
};

jasmine.Matchers.prototype.toBeRejectedWith = function() {
  var expectedArgs, fail;
  expectedArgs = jasmine.util.argsToArray(arguments);
  if (!this.actual.fail) {
    throw new Error('Expected a promise, but got ' + jasmine.pp(this.actual) + '.');
  }
  fail = jasmine.createSpy('fail');
  this.actual.fail(fail);
  this.message = function() {
    if (fail.callCount === 0) {
      return ["Expected spy " + fail.identity + " to have been rejected with " + jasmine.pp(expectedArgs) + " but it was never rejected.", "Expected spy " + fail.identity + " not to have been rejected with " + jasmine.pp(expectedArgs) + " but it was."];
    } else {
      return ["Expected spy " + fail.identity + " to have been rejected with " + jasmine.pp(expectedArgs) + " but was rejected with " + jasmine.pp(fail.argsForCall), "Expected spy " + fail.identity + " not to have been rejected with " + jasmine.pp(expectedArgs) + " but was rejected with " + jasmine.pp(fail.argsForCall)];
    }
  };
  return this.env.contains_(fail.argsForCall, expectedArgs);
};
