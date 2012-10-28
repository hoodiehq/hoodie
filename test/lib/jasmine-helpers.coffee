_when = (description, specs) -> describe("when " + description, specs)
_and  = (description, specs) -> describe("and " + description, specs)
_but  = (description, specs) -> describe("but " + description, specs)

jasmine.Matchers.prototype.toBePromise = ->
  this.actual.done and !this.actual.resolve

jasmine.Matchers.prototype.toBeDefer = ->
  this.actual.done and this.actual.resolve


  
jasmine.Matchers.prototype.toBeRejected    = -> this.actual.state() is 'rejected'
jasmine.Matchers.prototype.toBeResolved    = -> this.actual.state() is 'resolved'
jasmine.Matchers.prototype.notToBeRejected = -> this.actual.state() isnt 'rejected'
jasmine.Matchers.prototype.notToBeResolved = -> this.actual.state() isnt 'resolved'

jasmine.Matchers.prototype.toBeResolvedWith = -> 
  expectedArgs = jasmine.util.argsToArray(arguments);
  
  unless this.actual.done
    throw new Error('Expected a promise, but got ' + jasmine.pp(this.actual) + '.');
  
  done = jasmine.createSpy 'done'
  this.actual.done done
  
  this.message = ->
    if done.callCount == 0
      return [
        "Expected spy " + done.identity + " to have been resolved with " + jasmine.pp(expectedArgs) + " but it was never resolved.",
        "Expected spy " + done.identity + " not to have been resolved with " + jasmine.pp(expectedArgs) + " but it was."
      ];
    else
      return [
        "Expected spy " + done.identity + " to have been resolved with " + jasmine.pp(expectedArgs) + " but was resolved with " + jasmine.pp(done.argsForCall),
        "Expected spy " + done.identity + " not to have been resolved with " + jasmine.pp(expectedArgs) + " but was resolved with " + jasmine.pp(done.argsForCall)
      ];

  return this.env.contains_(done.argsForCall, expectedArgs);

jasmine.Matchers.prototype.toBeRejectedWith = -> 
  expectedArgs = jasmine.util.argsToArray(arguments);
  
  unless this.actual.fail
    throw new Error('Expected a promise, but got ' + jasmine.pp(this.actual) + '.');
  
  fail = jasmine.createSpy 'fail'
  this.actual.fail fail
  
  this.message = ->
    if fail.callCount == 0
      return [
        "Expected spy " + fail.identity + " to have been rejected with " + jasmine.pp(expectedArgs) + " but it was never rejected.",
        "Expected spy " + fail.identity + " not to have been rejected with " + jasmine.pp(expectedArgs) + " but it was."
      ];
    else
      return [
        "Expected spy " + fail.identity + " to have been rejected with " + jasmine.pp(expectedArgs) + " but was rejected with " + jasmine.pp(fail.argsForCall),
        "Expected spy " + fail.identity + " not to have been rejected with " + jasmine.pp(expectedArgs) + " but was rejected with " + jasmine.pp(fail.argsForCall)
      ];

  return this.env.contains_(fail.argsForCall, expectedArgs);
